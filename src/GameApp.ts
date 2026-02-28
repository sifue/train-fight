import Phaser from 'phaser';
import { HEIGHT, WIDTH } from './constants';
import { MainScene } from './MainScene';

export function createGameApp(parent = 'game'): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#0f1522',
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 1500 }, debug: false }
    },
    scale: {
      // 画面サイズに合わせてアスペクト比を維持しながら最大拡大
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT,
    },
    scene: [MainScene]
  });
}
