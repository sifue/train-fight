import type Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

const ENEMY_CHASE_RANGE = 440;

export class EnemyAiSystem {
  update(now: number, player: Player | undefined, enemies: Phaser.Physics.Arcade.Group | undefined, ended: boolean): void {
    if (!player || !enemies || ended) return;

    for (const enemyRaw of enemies.getChildren()) {
      const enemy = enemyRaw as Enemy;
      enemy.body.setVelocityX(this.getChaseVelocity(enemy, player, now));
    }
  }

  private getChaseVelocity(enemy: Enemy, player: Player, now: number): number {
    const isStunned = now <= enemy.stunnedUntil;
    if (isStunned) {
      enemy.playAnim(`${enemy.type}_idle`);
      return 0;
    }

    const dx = player.x - enemy.x;
    if (Math.abs(dx) >= ENEMY_CHASE_RANGE) {
      enemy.playAnim(`${enemy.type}_idle`);
      return 0;
    }

    const dir = Math.sign(dx);
    // 敵がプレイヤー方向を向く
    enemy.setFlipX(dir < 0);
    enemy.playAnim(`${enemy.type}_walk`);

    return dir * enemy.aggroSpeed();
  }
}
