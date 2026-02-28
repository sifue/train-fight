import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { ScoreEvents, StressEvents } from './contracts';
import type { SeType } from './AudioManager';

const ATTACK_HITBOX_HEIGHT = 44;
const ATTACK_HITBOX_DEFAULT_WIDTH = 52;
const ATTACK_HITBOX_Y_OFFSET = 20;
const ATTACK_FORWARD_OFFSET = 24;
const ATTACK_LUNGE_VELOCITY = 130;
const HEAVY_CHAIN_WINDOW_MS = 180;
const HEAVY_WHIFF_EXTRA_RECOVERY_MS = 180;
const HEAVY_CHAIN_MAX_X_DISTANCE = 120;
const HEAVY_CHAIN_MAX_Y_DISTANCE = 70;
const ENEMY_DEFAULT_HIT_STUN_MS = 280;
const ENEMY_HIT_TINT_RESET_MS = 80;
const ENEMY_AIR_KNOCKBACK_Y = -120;
const ENEMY_DEATH_STUN_MS = 999999;
const HEAVY_ENEMY_KO_BONUS_PUSH = 500;
const NORMAL_ENEMY_KO_BONUS_PUSH = 720;
const HEAVY_ENEMY_KO_LAUNCH_Y = -580;
const NORMAL_ENEMY_KO_LAUNCH_Y = -750;
const ENEMY_KO_SHAKE_MS = 200;
const ENEMY_KO_SHAKE_INTENSITY = 0.007;
const ENEMY_KO_FADE_MS = 1500;
const HITBOX_OFFSCREEN_X = -9999;

const ENEMY_KO_PROFILES = {
  normal: {
    pushBonus: NORMAL_ENEMY_KO_BONUS_PUSH,
    launchY: NORMAL_ENEMY_KO_LAUNCH_Y
  },
  rush: {
    pushBonus: NORMAL_ENEMY_KO_BONUS_PUSH,
    launchY: NORMAL_ENEMY_KO_LAUNCH_Y
  },
  heavy: {
    pushBonus: HEAVY_ENEMY_KO_BONUS_PUSH,
    launchY: HEAVY_ENEMY_KO_LAUNCH_Y
  },
  boss: {
    pushBonus: HEAVY_ENEMY_KO_BONUS_PUSH,
    launchY: HEAVY_ENEMY_KO_LAUNCH_Y
  }
} as const;

export type AttackConfig = {
  power: number;
  active: number;
  recovery: number;
  width: number;
  push: number;
  stunMs: number;
  hitFlashColor: number;
  hitShakeMs: number;
  hitShakeIntensity: number;
  hitStopMs: number;
};

const DEFAULT_ATTACK_STATE: AttackRuntimeProfile = {
  power: 0,
  push: 0,
  stunMs: ENEMY_DEFAULT_HIT_STUN_MS,
  hitFlashColor: 0xffffff,
  hitShakeMs: 0,
  hitShakeIntensity: 0,
  hitStopMs: 0
};

type AttackRuntimeProfile = Pick<
  AttackConfig,
  'power' | 'push' | 'stunMs' | 'hitFlashColor' | 'hitShakeMs' | 'hitShakeIntensity' | 'hitStopMs'
>;

type AttackHitbox = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
} & AttackRuntimeProfile;

type AttackKind = 'light' | 'heavy';

type CombatDeps = {
  scene: Phaser.Scene;
  scoreSystem: ScoreEvents;
  stressSystem: StressEvents;
  getPlayer: () => Player | undefined;
  getEnemies: () => Phaser.Physics.Arcade.Group | undefined;
  getFacing: () => number;
  isEnded: () => boolean;
  /** SE再生コールバック（省略可） */
  playSE?: (type: SeType) => void;
};

export class CombatSystem {
  private readonly scene: Phaser.Scene;
  private readonly scoreSystem: ScoreEvents;
  private readonly stressSystem: StressEvents;
  private readonly getPlayer: () => Player | undefined;
  private readonly getEnemies: () => Phaser.Physics.Arcade.Group | undefined;
  private readonly getFacing: () => number;
  private readonly isEnded: () => boolean;

  private attackLock = 0;
  private attackHitbox?: AttackHitbox;
  private currentAttack?: AttackKind;
  private attackConnected = false;
  private queuedHeavy?: AttackConfig;
  private queuedHeavyExpiresAt = 0;
  private hitStopToken = 0;
  private readonly playSE?: (type: SeType) => void;

  constructor(deps: CombatDeps) {
    this.scene = deps.scene;
    this.scoreSystem = deps.scoreSystem;
    this.stressSystem = deps.stressSystem;
    this.getPlayer = deps.getPlayer;
    this.getEnemies = deps.getEnemies;
    this.getFacing = deps.getFacing;
    this.isEnded = deps.isEnded;
    this.playSE = deps.playSE;
  }

  init(): void {
    const enemies = this.getEnemies();
    if (!enemies) return;

    const hitbox = this.scene.add.rectangle(
      HITBOX_OFFSCREEN_X,
      HITBOX_OFFSCREEN_X,
      ATTACK_HITBOX_DEFAULT_WIDTH,
      ATTACK_HITBOX_HEIGHT,
      0xff4f4f,
      0.25
    ) as AttackHitbox;
    this.scene.physics.add.existing(hitbox);
    hitbox.body.allowGravity = false;
    hitbox.body.enable = false;

    this.attackHitbox = hitbox;
    this.resetHitboxState();

    this.scene.physics.add.overlap(hitbox, enemies, (_h, enemy) => this.onHitEnemy(enemy as Enemy));
  }

  attack(kind: AttackKind, cfg: AttackConfig): void {
    const player = this.getPlayer();
    if (!player || !this.attackHitbox) return;

    const now = this.scene.time.now;
    if (now < this.attackLock) {
      if (kind === 'heavy' && this.currentAttack === 'light' && this.canQueueHeavyChain()) {
        this.queuedHeavy = cfg;
        this.queuedHeavyExpiresAt = this.attackLock + HEAVY_CHAIN_WINDOW_MS;
      }
      return;
    }

    this.currentAttack = kind;
    this.attackConnected = false;
    this.attackLock = now + cfg.active + cfg.recovery;

    this.setHitboxEnabled(true);
    this.applyAttackConfig(cfg);
    this.attackHitbox.x = player.x + this.getFacing() * (ATTACK_FORWARD_OFFSET + cfg.width * 0.32);
    this.attackHitbox.y = player.y - ATTACK_HITBOX_Y_OFFSET;
    this.attackHitbox.body.setSize(cfg.width, ATTACK_HITBOX_HEIGHT);
    player.body.setVelocityX(this.getFacing() * ATTACK_LUNGE_VELOCITY);

    this.scene.time.delayedCall(cfg.active, () => {
      this.setHitboxEnabled(false);
    });

    this.scene.time.delayedCall(cfg.active + cfg.recovery, () => {
      if (kind === 'heavy' && !this.attackConnected) {
        this.attackLock = Math.max(this.attackLock, this.scene.time.now + HEAVY_WHIFF_EXTRA_RECOVERY_MS);
      }

      const queueAvailable = this.queuedHeavy && this.scene.time.now <= this.queuedHeavyExpiresAt;
      if (!queueAvailable) {
        this.clearQueuedHeavy();
        return;
      }

      const nextHeavy = this.queuedHeavy;
      this.clearQueuedHeavy();
      if (!nextHeavy) return;
      this.attack('heavy', nextHeavy);
    });
  }

  disable(): void {
    this.setHitboxEnabled(false);
    this.resetHitboxState();
    this.attackLock = 0;
    this.attackConnected = false;
    this.clearQueuedHeavy();
    this.currentAttack = undefined;
    this.hitStopToken++;
    this.scene.physics.world.resume();
  }

  private clearQueuedHeavy(): void {
    this.queuedHeavy = undefined;
    this.queuedHeavyExpiresAt = 0;
  }

  private setHitboxEnabled(enabled: boolean): void {
    if (!this.attackHitbox) return;

    this.attackHitbox.active = enabled;
    this.attackHitbox.body.enable = enabled;

    if (!enabled) {
      this.attackHitbox.x = HITBOX_OFFSCREEN_X;
      this.attackHitbox.y = HITBOX_OFFSCREEN_X;
    }
  }

  private applyAttackConfig(cfg: AttackRuntimeProfile): void {
    if (!this.attackHitbox) return;

    this.attackHitbox.power = cfg.power;
    this.attackHitbox.push = cfg.push;
    this.attackHitbox.stunMs = cfg.stunMs;
    this.attackHitbox.hitFlashColor = cfg.hitFlashColor;
    this.attackHitbox.hitShakeMs = cfg.hitShakeMs;
    this.attackHitbox.hitShakeIntensity = cfg.hitShakeIntensity;
    this.attackHitbox.hitStopMs = cfg.hitStopMs;
  }

  private resetHitboxState(): void {
    if (!this.attackHitbox) return;
    this.applyAttackConfig(DEFAULT_ATTACK_STATE);
  }

  private applyHitStop(durationMs: number): void {
    if (durationMs <= 0) return;

    const world = this.scene.physics.world;
    const token = ++this.hitStopToken;

    world.pause();
    this.scene.time.delayedCall(durationMs, () => {
      if (token !== this.hitStopToken) return;
      world.resume();
    });
  }

  private onHitEnemy(enemy: Enemy): void {
    if (!this.attackHitbox || this.isEnded()) return;
    const now = this.scene.time.now;

    if (!this.attackHitbox.active || enemy.hp <= 0 || now < enemy.stunnedUntil) return;

    this.attackConnected = true;
    enemy.hp -= this.attackHitbox.power;
    enemy.stunnedUntil = now + this.attackHitbox.stunMs;
    enemy.body.setVelocityX(this.getFacing() * this.attackHitbox.push);
    enemy.body.setVelocityY(ENEMY_AIR_KNOCKBACK_Y);
    enemy.flash(this.attackHitbox.hitFlashColor);
    this.scene.time.delayedCall(ENEMY_HIT_TINT_RESET_MS, () => enemy.active && enemy.resetColor());
    this.scene.cameras.main.shake(this.attackHitbox.hitShakeMs, this.attackHitbox.hitShakeIntensity);
    this.applyHitStop(this.attackHitbox.hitStopMs);

    // ヒットスパークエフェクト
    this.spawnHitEffect(enemy.x, enemy.y - enemy.height / 2, this.currentAttack === 'heavy');

    // SE 再生（軽/強攻撃ヒット）
    this.playSE?.(this.currentAttack === 'heavy' ? 'heavyHit' : 'lightHit');

    this.scoreSystem.onEnemyHit(enemy.hitScoreBase());

    if (enemy.hp <= 0) {
      this.handleEnemyKo(enemy, now);
    }
  }

  /** マンガ風ヒットスパークを生成 */
  private spawnHitEffect(x: number, y: number, isHeavy: boolean): void {
    const g = this.scene.add.graphics();
    const color = isHeavy ? 0xffdf9a : 0xc8f7ff;
    const size = isHeavy ? 26 : 16;
    const lines = isHeavy ? 8 : 6;

    g.setPosition(x, y).setDepth(16);
    g.lineStyle(isHeavy ? 3 : 2, color, 1);

    for (let i = 0; i < lines; i++) {
      const angle = (i / lines) * Math.PI * 2;
      const inner = size * 0.3;
      g.lineBetween(
        Math.cos(angle) * inner, Math.sin(angle) * inner,
        Math.cos(angle) * size, Math.sin(angle) * size
      );
    }

    // KO 用テキスト
    if (isHeavy) {
      const labels = ['POW!', 'BAM!', 'KA-POW!'];
      const label = labels[Math.floor(Math.random() * labels.length)];
      const txt = this.scene.add
        .text(x + 20, y - 24, label, {
          fontFamily: 'monospace', fontSize: '20px',
          color: '#ffdf9a', stroke: '#000', strokeThickness: 4
        })
        .setDepth(17).setAngle(-15);
      this.scene.tweens.add({
        targets: txt,
        y: txt.y - 30, alpha: 0,
        duration: 380, onComplete: () => txt.destroy()
      });
    }

    this.scene.tweens.add({
      targets: g,
      scaleX: isHeavy ? 2.4 : 1.8,
      scaleY: isHeavy ? 2.4 : 1.8,
      alpha: 0,
      duration: isHeavy ? 280 : 180,
      ease: 'Power2',
      onComplete: () => g.destroy()
    });
  }

  private canQueueHeavyChain(): boolean {
    const player = this.getPlayer();
    const enemies = this.getEnemies();
    if (!player || !enemies) return false;

    const facing = this.getFacing();

    for (const raw of enemies.getChildren()) {
      const enemy = raw as Enemy;
      if (!enemy.active || enemy.hp <= 0) continue;

      const dx = enemy.x - player.x;
      const dy = Math.abs(enemy.y - player.y);
      const inFront = facing > 0 ? dx >= 0 : dx <= 0;
      const nearX = Math.abs(dx) <= HEAVY_CHAIN_MAX_X_DISTANCE;
      const nearY = dy <= HEAVY_CHAIN_MAX_Y_DISTANCE;

      if (inFront && nearX && nearY) return true;
    }

    return false;
  }

  private handleEnemyKo(enemy: Enemy, now: number): void {
    if (!this.attackHitbox) return;

    enemy.hp = 0;
    enemy.stunnedUntil = now + ENEMY_DEATH_STUN_MS;
    // ワールド境界バウンスは維持しつつ、他オブジェクトとの衝突を無効化
    enemy.body.checkCollision.none = true;
    enemy.body.setBounce(0.85);

    const koProfile = ENEMY_KO_PROFILES[enemy.type];
    const dir = this.getFacing();

    enemy.body.setVelocityX(dir * (this.attackHitbox.push + koProfile.pushBonus));
    enemy.body.setVelocityY(koProfile.launchY);
    enemy.setTint(0xfff1b5);

    // 720度スピン（スケールはそのまま・大きいまま飛んでいく）
    this.scene.tweens.add({
      targets: enemy,
      angle: dir * 720,
      duration: ENEMY_KO_FADE_MS,
      ease: 'Linear'
    });
    // 後半60%経過後にフェードアウトして消去（しばらく見えたまま飛ぶ演出）
    this.scene.time.delayedCall(ENEMY_KO_FADE_MS * 0.6, () => {
      if (!enemy.active) return;
      this.scene.tweens.add({
        targets: enemy,
        alpha: 0,
        duration: ENEMY_KO_FADE_MS * 0.4,
        ease: 'Power2.In',
        onComplete: () => enemy.destroy()
      });
    });

    // K.O.!! ポップアップテキスト
    this.spawnKoText(enemy.x, enemy.y - enemy.height / 2);

    this.scoreSystem.onEnemyKo(enemy.koBonus());
    this.stressSystem.onEnemyKo(enemy.type);
    this.scene.cameras.main.shake(ENEMY_KO_SHAKE_MS, ENEMY_KO_SHAKE_INTENSITY);
    this.playSE?.('enemyKO');
  }

  /** K.O.!! 大テキスト演出 */
  private spawnKoText(x: number, y: number): void {
    const labels = ['K.O.!!', 'KNOCKOUT!', 'WHAM!!', 'CRASH!!'];
    const label = labels[Math.floor(Math.random() * labels.length)];
    const txt = this.scene.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(18).setAngle(Phaser.Math.Between(-18, 18));

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 70,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 750,
      ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  }
}
