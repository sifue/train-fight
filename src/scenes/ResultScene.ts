import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../constants';
import { SaveManager } from '../core/SaveManager';

export type ResultData = {
  result: 'win' | 'lose' | 'stress';
  score: number;
  hiScore: number;
};

/**
 * ResultScene - ゲーム結果画面
 * YOU WIN / GAME OVER を演出付きで表示
 */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(data: ResultData): void {
    const { result, score, hiScore } = data;

    // スコアをランキングに登録
    const ranking = SaveManager.addScore(score);
    const finalHiScore = SaveManager.getHiScore();

    this._drawBackground(result);

    // フェードインで登場
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this._drawResultText(result);
    this._drawScores(score, Math.max(hiScore, finalHiScore));
    this._drawRanking(ranking, score);
    this._drawButtons(result, score, hiScore);
  }

  private _drawBackground(result: 'win' | 'lose' | 'stress'): void {
    const color = result === 'win' ? 0x0a1e0a : result === 'stress' ? 0x1e100a : 0x1e0a0a;
    this.add.graphics()
      .fillStyle(color, 1)
      .fillRect(0, 0, WIDTH, HEIGHT);

    // 装飾ライン
    const lineColor = result === 'win' ? 0x2a5a2a : result === 'stress' ? 0x5a3a0a : 0x5a2a2a;
    for (let i = 0; i < 5; i++) {
      this.add.graphics()
        .lineStyle(1, lineColor, 0.4)
        .lineBetween(0, i * (HEIGHT / 4), WIDTH, i * (HEIGHT / 4));
    }
  }

  private _drawResultText(result: 'win' | 'lose' | 'stress'): void {
    const isWin = result === 'win';
    const isStress = result === 'stress';
    const mainMsg = isWin ? 'YOU WIN!' : isStress ? 'STRESS OVER' : 'GAME OVER';
    const subMsg  = isWin ? '非常ブレーキ作動！電車を止めた！' : isStress ? 'ストレスで限界に達した...' : 'やられてしまった...';
    const color   = isWin ? '#9dff9d' : isStress ? '#ffaa44' : '#ff9f9f';

    // 大きなメインメッセージ
    const mainText = this.add.text(WIDTH / 2, HEIGHT / 2 - 110, mainMsg, {
      fontFamily: 'monospace',
      fontSize: '72px',
      color,
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: isWin ? '#006600' : isStress ? '#884400' : '#660000', fill: true }
    }).setOrigin(0.5).setAlpha(0);

    // テキストをアニメーション表示
    this.tweens.add({
      targets: mainText,
      alpha: 1,
      scaleX: { from: 1.5, to: 1 },
      scaleY: { from: 1.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    this.add.text(WIDTH / 2, HEIGHT / 2 - 40, subMsg, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#d7e3ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(400, () => {
      this.children.list
        .filter(obj => obj instanceof Phaser.GameObjects.Text && (obj as Phaser.GameObjects.Text).text === subMsg)
        .forEach(obj => {
          this.tweens.add({ targets: obj, alpha: 1, duration: 400 });
        });
    });
  }

  private _drawScores(score: number, hiScore: number): void {
    const isNewRecord = score >= hiScore && score > 0;

    const scorePanelBg = this.add.graphics();
    scorePanelBg.fillStyle(0x0b1220, 0.75);
    scorePanelBg.fillRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 10, 400, 110, 12);
    scorePanelBg.lineStyle(2, 0x4a6a9a, 0.7);
    scorePanelBg.strokeRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 10, 400, 110, 12);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 22, `SCORE: ${score.toLocaleString()}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#7ce0ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const hiScoreLabel = isNewRecord ? '★ NEW HI-SCORE! ★' : `HI-SCORE: ${hiScore.toLocaleString()}`;
    const hiColor = isNewRecord ? '#ffd166' : '#9dff9d';
    const newRecord = this.add.text(WIDTH / 2, HEIGHT / 2 + 60, hiScoreLabel, {
      fontFamily: 'monospace',
      fontSize: isNewRecord ? '22px' : '20px',
      color: hiColor,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    if (isNewRecord) {
      this.tweens.add({
        targets: newRecord,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private _drawRanking(ranking: { score: number; date: string }[], currentScore: number): void {
    const panelX = WIDTH / 2 + 120;
    const panelY = HEIGHT / 2 - 10;
    const panelW = 220;
    const panelH = 118;

    // ランキングパネル
    const bg = this.add.graphics();
    bg.fillStyle(0x0b1220, 0.75);
    bg.fillRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 10);
    bg.lineStyle(2, 0x6a5aaa, 0.7);
    bg.strokeRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 10);

    this.add.text(panelX, panelY + 14, '-- TOP 5 --', {
      fontFamily: 'monospace', fontSize: '13px', color: '#b8a4ff'
    }).setOrigin(0.5);

    ranking.forEach((entry, i) => {
      const isMe = entry.score === currentScore;
      const color = i === 0 ? '#ffd166' : isMe ? '#7ce0ff' : '#c8d8f8';
      const prefix = i === 0 ? '👑' : `${i + 1}.`;
      this.add.text(panelX - panelW / 2 + 12, panelY + 30 + i * 17,
        `${prefix} ${entry.score.toLocaleString().padStart(7)}  ${entry.date}`,
        { fontFamily: 'monospace', fontSize: '12px', color }
      );
    });
  }

  private _drawButtons(result: 'win' | 'lose' | 'stress', score: number, hiScore: number): void {
    const btnY = HEIGHT / 2 + 130;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
      // タッチ用大型ボタン
      this._makeTouchBtn(WIDTH / 2 - 120, btnY, 'もう一度', 0x1a3a5a, 0x4a8afe, () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => this.scene.start('MainScene'));
      });
      this._makeTouchBtn(WIDTH / 2 + 120, btnY, 'タイトルへ', 0x2a1a2a, 0xb04aff, () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => this.scene.start('TitleScene'));
      });
    }

    // キーボードヒント
    const hint = isTouchDevice ? '' : 'R: もう一度プレイ  /  ESC or T: タイトルへ';
    this.add.text(WIDTH / 2, HEIGHT - 28, hint, {
      fontFamily: 'monospace', fontSize: '15px', color: '#6a8aaa'
    }).setOrigin(0.5);

    // キーボード操作
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => this.scene.start('MainScene'));
      } else if (e.key === 'Escape' || e.key === 't' || e.key === 'T') {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => this.scene.start('TitleScene'));
      }
    });

    // 撃破スコアが0でない場合に「操作ヒント」を後から表示
    this.time.delayedCall(1000, () => {
      const _ = score + hiScore; // suppress unused warning
      void _;
    });
  }

  private _makeTouchBtn(cx: number, cy: number, label: string, fillColor: number, strokeColor: number, onTap: () => void): void {
    const w = 180, h = 56, r = 10;
    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 0.85);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
    bg.lineStyle(2, strokeColor, 0.9);
    bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

    // 当たり判定用透明ゾーン
    const zone = this.add.zone(cx, cy, w, h).setInteractive();
    this.add.text(cx, cy, label, {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);

    zone.on('pointerdown', onTap);
  }
}
