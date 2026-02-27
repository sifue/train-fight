import Phaser from 'phaser';
import { HEIGHT, WIDTH, WORLD_WIDTH } from './constants';

/**
 * Main gameplay scene (TS migration in progress)
 *
 * Step 1: move core scene lifecycle out of the legacy game.js
 * Step 2: split systems (Player / Enemy / Combat / UI)
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, HEIGHT);

    // Temporary migration marker so Vite+TS boot path can be verified first.
    this.add
      .text(WIDTH / 2, HEIGHT / 2, 'Train Rampage TS migration in progress', {
        color: '#d7e3ff',
        fontFamily: 'monospace',
        fontSize: '20px'
      })
      .setOrigin(0.5);
  }

  update(_time: number, _delta: number): void {
    // TODO: transplant legacy update loop from game.js incrementally.
  }
}
