import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { ScoreEvents, StressEvents } from './contracts';

export type AttackConfig = {
  power: number;
  active: number;
  width: number;
  push: number;
};

type AttackHitbox = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
  power: number;
  push: number;
};

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

    const hitbox = this.scene.add.rectangle(-9999, -9999, 52, 44, 0xff4f4f, 0.25) as AttackHitbox;
    this.scene.physics.add.existing(hitbox);
    hitbox.body.allowGravity = false;
    hitbox.body.enable = false;
    hitbox.power = 0;
    hitbox.push = 0;

    this.attackHitbox = hitbox;

    this.scene.physics.add.overlap(hitbox, enemies, (_h, enemy) => this.onHitEnemy(enemy as Enemy));
  }

  attack(cfg: AttackConfig): void {
    const player = this.getPlayer();
    if (!player || !this.attackHitbox) return;

    const now = this.scene.time.now;
    if (now < this.attackLock) return;

    this.attackLock = now + cfg.active + 70;

    this.attackHitbox.body.enable = true;
    this.attackHitbox.active = true;
    this.attackHitbox.power = cfg.power;
    this.attackHitbox.push = cfg.push;
    this.attackHitbox.x = player.x + this.getFacing() * (24 + cfg.width * 0.32);
    this.attackHitbox.y = player.y - 20;
    this.attackHitbox.body.setSize(cfg.width, 44);
    player.body.setVelocityX(this.getFacing() * 130);

    this.scene.time.delayedCall(cfg.active, () => {
      if (!this.attackHitbox) return;
      this.attackHitbox.active = false;
      this.attackHitbox.body.enable = false;
      this.attackHitbox.x = -9999;
    });
  }

  disable(): void {
    if (!this.attackHitbox) return;
    this.attackHitbox.body.enable = false;
  }

  private onHitEnemy(enemy: Enemy): void {
    if (!this.attackHitbox || this.isEnded()) return;
    const now = this.scene.time.now;

    if (!this.attackHitbox.active || enemy.hp <= 0 || now < enemy.stunnedUntil) return;

    enemy.hp -= this.attackHitbox.power;
    enemy.stunnedUntil = now + 280;
    enemy.body.setVelocityX(this.getFacing() * this.attackHitbox.push);
    enemy.body.setVelocityY(-120);
    enemy.flash(0xffffff);
    this.scene.time.delayedCall(80, () => enemy.active && enemy.resetColor());

    this.scoreSystem.onEnemyHit(enemy.hitScoreBase());

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.stunnedUntil = now + 999999;
      enemy.body.checkCollision.none = true;
      enemy.body.setVelocityX(this.getFacing() * (this.attackHitbox.push + (enemy.type === 'heavy' ? 190 : 280)));
      enemy.body.setVelocityY(enemy.type === 'heavy' ? -300 : -380);
      enemy.setFillStyle(0xfff1b5);
      this.scene.tweens.add({
        targets: enemy,
        angle: this.getFacing() * Phaser.Math.Between(35, 75),
        alpha: 0,
        duration: 460,
        onComplete: () => enemy.destroy()
      });

      this.scoreSystem.onEnemyKo(enemy.koBonus());
      this.stressSystem.onEnemyKo(enemy.type);
      this.scene.cameras.main.shake(90, 0.0022);
    }
  }
}
