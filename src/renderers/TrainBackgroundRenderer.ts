import Phaser from 'phaser';
import { HEIGHT, WORLD_WIDTH } from '../constants';

export class TrainBackgroundRenderer {
  constructor(private readonly scene: Phaser.Scene) {}

  draw(): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0x111a2b);
    g.fillRect(0, 0, WORLD_WIDTH, HEIGHT);

    this.drawCeiling(g);
    this.drawCars(g);
    this.drawSeats(g);
    this.drawFloor(g);
    this.drawStraps(g);

    this.scene.add.text(WORLD_WIDTH - 350, HEIGHT - 165, '先頭車両 / 非常ブレーキ', {
      font: '20px monospace',
      color: '#ffd166'
    });
  }

  private drawCeiling(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x2f3f5b);
    g.fillRect(0, 0, WORLD_WIDTH, 32);
    g.fillStyle(0xdce7ff);
    g.fillRect(24, 8, WORLD_WIDTH - 48, 8);

    for (let x = 40; x < WORLD_WIDTH - 30; x += 120) {
      g.fillStyle(0x6d7ea0);
      g.fillCircle(x, 12, 3);
    }
  }

  private drawCars(g: Phaser.GameObjects.Graphics): void {
    for (let x = 0; x < WORLD_WIDTH; x += 440) {
      g.fillStyle(0x4f607f);
      g.fillRect(x + 4, 0, 10, HEIGHT);
      g.fillRect(x + 426, 0, 10, HEIGHT);

      g.fillStyle(0x7083a5);
      g.fillRect(x + 182, 72, 78, 170);
      g.fillStyle(0x3b4c69);
      g.fillRect(x + 188, 78, 66, 142);
      g.fillStyle(0x98aac7);
      g.fillRect(x + 219, 140, 4, 90);

      g.fillStyle(0x5b6d8f);
      g.fillRect(x + 56, 68, 104, 122);
      g.fillRect(x + 280, 68, 104, 122);
      g.fillStyle(0x27364f);
      g.fillRect(x + 64, 76, 88, 106);
      g.fillRect(x + 288, 76, 88, 106);

      g.fillStyle(0xd8dde8);
      g.fillRect(x + 24, 40, 132, 20);
      g.fillStyle(0xffc857);
      g.fillRect(x + 284, 40, 128, 20);
      g.fillStyle(0x1b2940);
      g.fillRect(x + 10, 220, 420, 12);
    }
  }

  private drawSeats(g: Phaser.GameObjects.Graphics): void {
    for (let x = 0; x < WORLD_WIDTH; x += 220) {
      g.fillStyle(0x42608a);
      g.fillRect(x + 12, HEIGHT - 196, 92, 24);
      g.fillRect(x + 118, HEIGHT - 196, 92, 24);
    }
  }

  private drawFloor(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x172338);
    g.fillRect(0, HEIGHT - 165, WORLD_WIDTH, 95);
    g.fillStyle(0xe6d36c);
    g.fillRect(0, HEIGHT - 82, WORLD_WIDTH, 8);

    for (let x = 0; x < WORLD_WIDTH; x += 70) {
      g.fillStyle((x / 70) % 2 ? 0x1f3049 : 0x253954);
      g.fillRect(x, HEIGHT - 75, 46, 6);
    }
  }

  private drawStraps(g: Phaser.GameObjects.Graphics): void {
    for (let x = 40; x < WORLD_WIDTH; x += 62) {
      g.lineStyle(2, 0x9eb1d6);
      g.lineBetween(x, 16, x, 46);
      g.fillStyle(0xe6edf9);
      g.fillCircle(x, 52, 7);
    }
  }
}
