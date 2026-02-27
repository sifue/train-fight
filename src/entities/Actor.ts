import Phaser from 'phaser';

export abstract class Actor extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body;

  protected readonly baseColor: number;
  stunnedUntil = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    super(scene, x, y, width, height, color);
    this.setOrigin(0.5, 1);
    this.baseColor = color;
  }

  flash(color: number): void {
    this.setFillStyle(color);
  }

  resetColor(): void {
    this.setFillStyle(this.baseColor);
  }
}
