import Phaser from 'phaser';
import { HEIGHT, WIDTH, WORLD_WIDTH } from '../constants';

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
  /** プレイヤーX座標（進行度計算用） */
  playerX: number;
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
  private progressBar?: Phaser.GameObjects.Graphics;
  /** プレイヤーX座標 (UISystem.update から毎フレーム更新) */
  private playerX = 0;

  constructor(scene: Phaser.Scene, isTouchDevice = false) {
    this.scene = scene;
    this.isTouchDevice = isTouchDevice;
  }

  create(): void {
    this.drawProgressBar();
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
    // コンボ表示（高コンボで大きく表示）
    if (snapshot.combo > 1) {
      const fontSize = snapshot.combo >= 10 ? '28px' : '22px';
      this.comboText?.setStyle({ ...this.uiStyle('#ffd166'), fontSize });
      this.comboText?.setText(`★ COMBO x${snapshot.combo}`);
    } else {
      this.comboText?.setText('');
    }

    this.scoreText?.setText(`SCORE: ${snapshot.score.toLocaleString()}`);
    this.hiScoreText?.setText(`HI: ${snapshot.hiScore.toLocaleString()}`);

    // HP ハート表示（最大5）
    const maxHp = 5;
    const hp = Math.max(0, Math.min(maxHp, snapshot.hp));
    const hearts = '♥'.repeat(hp) + '♡'.repeat(maxHp - hp);
    this.hpText?.setText(`HP: ${hearts}`);

    // ストレスゲージ（ブロック文字）
    const blocks = Math.floor(snapshot.stressPercent / 10);
    const bar = '█'.repeat(blocks) + '░'.repeat(10 - blocks);
    const stressLabel = snapshot.stressCritical ? '⚠ STRESS' : 'STRESS';
    const stressColor = snapshot.stressCritical ? '#ff4444' : '#ffcf8a';
    this.stressText?.setStyle({ ...this.uiStyle('#ffcf8a'), color: stressColor });
    this.stressText?.setText(`${stressLabel}: ${bar}`);

    this.enemyText?.setText(`ENEMY LEFT: ${snapshot.enemiesLeft}`);
    const bgmPct = Math.round(snapshot.bgmVolume * 100);
    const sePct  = Math.round(snapshot.seVolume  * 100);
    this.soundText?.setText(`BGM: ${bgmPct}%  SE: ${sePct}%`);
    this.updateProgressBar(snapshot.playerX);
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

  private drawProgressBar(): void {
    // 進行度バー（画面下部）
    const barH = 6;
    const barY = HEIGHT - barH;

    // 背景レール
    const rail = this.scene.add.graphics().setScrollFactor(0).setDepth(40);
    rail.fillStyle(0x1a2a3a, 0.85);
    rail.fillRect(0, barY, WIDTH, barH);

    // 動的な進行バー
    this.progressBar = this.scene.add.graphics().setScrollFactor(0).setDepth(41);

    // ゴールマーカー
    const goalPct = (WORLD_WIDTH - 220) / WORLD_WIDTH;
    const goalX = Math.floor(goalPct * WIDTH);
    rail.fillStyle(0xffd166, 0.9);
    rail.fillRect(goalX - 2, barY - 2, 4, barH + 2);
    this.scene.add.text(goalX, barY - 14, '🚨', { fontSize: '11px' })
      .setScrollFactor(0).setDepth(42).setOrigin(0.5);
  }

  private updateProgressBar(playerX: number): void {
    if (!this.progressBar) return;
    this.progressBar.clear();

    const barH = 6;
    const barY = HEIGHT - barH;
    const pct = Math.min(1, playerX / WORLD_WIDTH);
    const barW = Math.floor(pct * WIDTH);

    // 進行度に応じて色変化（青→緑）
    const r = Math.floor(Phaser.Math.Interpolation.Linear([0x4a, 0x2a], pct));
    const g = Math.floor(Phaser.Math.Interpolation.Linear([0x8a, 0xdd], pct));
    const b = Math.floor(Phaser.Math.Interpolation.Linear([0xff, 0x44], pct));
    const color = (r << 16) | (g << 8) | b;

    this.progressBar.fillStyle(color, 0.95);
    this.progressBar.fillRect(0, barY, barW, barH);

    // プレイヤー位置マーカー
    this.progressBar.fillStyle(0xffffff, 1);
    this.progressBar.fillRect(barW - 2, barY - 1, 4, barH + 2);
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
