import Phaser from 'phaser';

/**
 * Actor - プレイヤー・敵共通の基底クラス
 * Phaser.GameObjects.Sprite を継承（ドット絵テクスチャ対応）
 */
export abstract class Actor extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  stunnedUntil = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, x, y, texture);
    this.setOrigin(0.5, 1);
  }

  /** 被弾フラッシュ: 色を tint で上書き */
  flash(color: number): void {
    this.setTint(color);
  }

  /** tint をリセット */
  resetColor(): void {
    this.clearTint();
  }
}
