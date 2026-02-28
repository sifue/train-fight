import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../constants';

type UiStyleColor = '#ffd166' | '#7ce0ff' | '#9dff9d' | '#ff9f9f' | '#ffcf8a' | '#d7e3ff' | '#ffd6a5' | '#fff2b2';

export type UiSnapshot = {
  combo: number;
  score: number;
  hiScore: number;
  hp: number;
  stressPercent: number;
  stressCritical: boolean;
  enemiesLeft: number;
  /** ゴールまでの距離(m換算) */
  distToGoal: number;
  /** BGM音量 0.0〜1.0 */
  bgmVolume: number;
  /** SE音量 0.0〜1.0 */
  seVolume: number;
};

export class UISystem {
  private readonly scene: Phaser.Scene;
  private readonly isTouchDevice: boolean;
  private comboText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private hiScoreText?: Phaser.GameObjects.Text;
  private hpText?: Phaser.GameObjects.Text;
  private stressText?: Phaser.GameObjects.Text;
  private enemyText?: Phaser.GameObjects.Text;
  private soundText?: Phaser.GameObjects.Text;
  private missionText?: Phaser.GameObjects.Text;
  private resultText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, isTouchDevice = false) {
    this.scene = scene;
    this.isTouchDevice = isTouchDevice;
  }

  create(): void {
    this.drawHudPanel();
    this.drawMissionCard();
    this.comboText = this.scene.add.text(24, 20, '', this.uiStyle('#ffd166')).setScrollFactor(0);
    this.scoreText = this.scene.add.text(24, 42, '', this.uiStyle('#7ce0ff')).setScrollFactor(0);
    this.hiScoreText = this.scene.add.text(24, 64, '', this.uiStyle('#9dff9d')).setScrollFactor(0);
    this.hpText = this.scene.add.text(24, 86, '', this.uiStyle('#ff9f9f')).setScrollFactor(0);
    this.stressText = this.scene.add.text(24, 108, '', this.uiStyle('#ffcf8a')).setScrollFactor(0);
    this.enemyText = this.scene.add.text(24, 130, '', this.uiStyle('#ffd6a5')).setScrollFactor(0);
    this.soundText = this.scene.add.text(24, 152, '', { ...this.uiStyle('#d7e3ff'), fontSize: '16px' }).setScrollFactor(0);
    const controlHint = this.isTouchDevice
      ? '画面ボタンで操作  R: リトライ'
      : '←→: 移動 / ↑: ジャンプ / Z: 弱 / X: 強 / M: BGM / N: SE';
    this.scene.add
      .text(24, 176, controlHint, { ...this.uiStyle('#d7e3ff'), fontSize: '16px' })
      .setScrollFactor(0);
    this.resultText = this.scene.add
      .text(WIDTH / 2, HEIGHT / 2 - 24, '', {
        ...this.uiStyle('#fff2b2'),
        fontSize: '36px'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20);

    this.missionText = this.scene.add
      .text(648, 44, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#f3f7ff',
        lineSpacing: 6
      })
      .setScrollFactor(0)
      .setDepth(7);
  }

  update(snapshot: UiSnapshot): void {
    this.comboText?.setText(snapshot.combo > 1 ? `COMBO x${snapshot.combo}` : '');
    this.scoreText?.setText(`SCORE: ${snapshot.score}`);
    this.hiScoreText?.setText(`HI-SCORE: ${snapshot.hiScore}`);
    this.hpText?.setText(`HP: ${Math.max(0, snapshot.hp)}`);
    this.stressText?.setText(`STRESS: ${snapshot.stressPercent}%${snapshot.stressCritical ? '  !!' : ''}`);
    this.enemyText?.setText(`ENEMY LEFT: ${snapshot.enemiesLeft}`);
    const bgmPct = Math.round(snapshot.bgmVolume * 100);
    const sePct  = Math.round(snapshot.seVolume  * 100);
    this.soundText?.setText(`BGM: ${bgmPct}%  SE: ${sePct}%`);
    const distLabel = snapshot.distToGoal <= 0 ? 'GOAL!' : `先頭まで: ${snapshot.distToGoal}m`;
    this.missionText?.setText(
      `- ${distLabel}\n- [${snapshot.hp > 0 ? '✓' : ' '}] HPを残して生還`
    );
  }

  showResult(message: string): void {
    this.resultText?.setText(`${message}\nPress R to retry`);
  }

  private uiStyle(color: UiStyleColor): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color,
      fontFamily: 'monospace',
      fontSize: '20px',
      stroke: '#000000',
      strokeThickness: 3
    };
  }

  private drawHudPanel(): void {
    const panel = this.scene.add.graphics().setScrollFactor(0).setDepth(5);
    panel.fillStyle(0x0b1220, 0.62);
    panel.fillRoundedRect(10, 10, 590, 195, 12);
    panel.lineStyle(2, 0x6f86ad, 0.85);
    panel.strokeRoundedRect(10, 10, 590, 195, 12);

    this.scene.add
      .text(24, 4, 'TRAIN RAMPAGE STATUS', {
        font: 'bold 14px monospace',
        color: '#d7e3ff'
      })
      .setScrollFactor(0)
      .setDepth(6);
  }

  private drawMissionCard(): void {
    const card = this.scene.add.graphics().setScrollFactor(0).setDepth(5);
    card.fillStyle(0x1a172b, 0.68);
    card.fillRoundedRect(620, 10, 340, 112, 12);
    card.lineStyle(2, 0xb8a4ff, 0.9);
    card.strokeRoundedRect(620, 10, 340, 112, 12);

    this.scene.add
      .text(636, 18, 'MISSION CARD', {
        font: 'bold 14px monospace',
        color: '#e0d7ff'
      })
      .setScrollFactor(0)
      .setDepth(6);
  }
}
