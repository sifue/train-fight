import Phaser from 'phaser';
import { Actor } from './Actor';

export class Player extends Actor {
  invulnUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 30, 58, 0x48d7ff);
  }

  flashDamaged(): void {
    this.flash(0xff9ea8);
  }

  resetTint(): void {
    this.resetColor();
  }
}
