import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { ScoreEvents, StressEvents } from './contracts';

const ATTACK_HITBOX_HEIGHT = 44;
const ATTACK_HITBOX_DEFAULT_WIDTH = 52;
const ATTACK_HITBOX_Y_OFFSET = 20;
const ATTACK_FORWARD_OFFSET = 24;
const ATTACK_LUNGE_VELOCITY = 130;
const HEAVY_CHAIN_WINDOW_MS = 180;
const ENEMY_DEFAULT_HIT_STUN_MS = 280;
const ENEMY_HIT_TINT_RESET_MS = 80;
const ENEMY_AIR_KNOCKBACK_Y = -120;
const ENEMY_DEATH_STUN_MS = 999999;
const HEAVY_ENEMY_KO_BONUS_PUSH = 190;
const NORMAL_ENEMY_KO_BONUS_PUSH = 280;
const HEAVY_ENEMY_KO_LAUNCH_Y = -300;
const NORMAL_ENEMY_KO_LAUNCH_Y = -380;
const ENEMY_KO_SHAKE_MS = 90;
const ENEMY_KO_SHAKE_INTENSITY = 0.0022;
const ENEMY_KO_ROTATION_MIN = 35;
const ENEMY_KO_ROTATION_MAX = 75;
const ENEMY_KO_FADE_MS = 460;
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
  private queuedHeavy?: AttackConfig;
  private queuedHeavyExpiresAt = 0;
  private hitStopToken = 0;

  constructor(deps: CombatDeps) {
    this.scene = deps.scene;
    this.scoreSystem = deps.scoreSystem;
    this.stressSystem = deps.stressSystem;
    this.getPlayer = deps.getPlayer;
    this.getEnemies = deps.getEnemies;
    this.getFacing = deps.getFacing;
    this.isEnded = deps.isEnded;
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
      if (kind === 'heavy' && this.currentAttack === 'light') {
        this.queuedHeavy = cfg;
        this.queuedHeavyExpiresAt = this.attackLock + HEAVY_CHAIN_WINDOW_MS;
      }
      return;
    }

    this.currentAttack = kind;
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

    enemy.hp -= this.attackHitbox.power;
    enemy.stunnedUntil = now + this.attackHitbox.stunMs;
    enemy.body.setVelocityX(this.getFacing() * this.attackHitbox.push);
    enemy.body.setVelocityY(ENEMY_AIR_KNOCKBACK_Y);
    enemy.flash(this.attackHitbox.hitFlashColor);
    this.scene.time.delayedCall(ENEMY_HIT_TINT_RESET_MS, () => enemy.active && enemy.resetColor());
    this.scene.cameras.main.shake(this.attackHitbox.hitShakeMs, this.attackHitbox.hitShakeIntensity);
    this.applyHitStop(this.attackHitbox.hitStopMs);

    this.scoreSystem.onEnemyHit(enemy.hitScoreBase());

    if (enemy.hp <= 0) {
      this.handleEnemyKo(enemy, now);
    }
  }

  private handleEnemyKo(enemy: Enemy, now: number): void {
    if (!this.attackHitbox) return;

    enemy.hp = 0;
    enemy.stunnedUntil = now + ENEMY_DEATH_STUN_MS;
    enemy.body.checkCollision.none = true;

    const koProfile = ENEMY_KO_PROFILES[enemy.type];

    enemy.body.setVelocityX(this.getFacing() * (this.attackHitbox.push + koProfile.pushBonus));
    enemy.body.setVelocityY(koProfile.launchY);
    enemy.setFillStyle(0xfff1b5);
    this.scene.tweens.add({
      targets: enemy,
      angle: this.getFacing() * Phaser.Math.Between(ENEMY_KO_ROTATION_MIN, ENEMY_KO_ROTATION_MAX),
      alpha: 0,
      duration: ENEMY_KO_FADE_MS,
      onComplete: () => enemy.destroy()
    });

    this.scoreSystem.onEnemyKo(enemy.koBonus());
    this.stressSystem.onEnemyKo(enemy.type);
    this.scene.cameras.main.shake(ENEMY_KO_SHAKE_MS, ENEMY_KO_SHAKE_INTENSITY);
  }
}
