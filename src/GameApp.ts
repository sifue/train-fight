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
    scene: [MainScene]
  });
}
