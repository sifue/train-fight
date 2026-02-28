import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../constants';
import { getAudioManager } from '../systems/AudioManager';

/**
 * TitleScene - タイトル画面
 * ゲーム開始前に表示するシーン
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    this._drawBackground();
    this._drawTitle();
    this._drawControls();
    this._drawStartPrompt();
    this._setupStartInput();
  }

  private _drawBackground(): void {
    // 電車の窓をイメージした背景
    const bg = this.add.graphics();

    // 空のグラデーション風
    bg.fillGradientStyle(0x0a0f1e, 0x0a0f1e, 0x1a2a4a, 0x1a2a4a, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // 窓枠の装飾
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 150;
      bg.fillStyle(0x0d1f38, 0.8);
      bg.fillRoundedRect(x, 80, 130, 180, 8);
      bg.lineStyle(2, 0x2a4a7a, 0.7);
      bg.strokeRoundedRect(x, 80, 130, 180, 8);
    }

    // 床ライン
    bg.fillStyle(0x0b1626, 1);
    bg.fillRect(0, HEIGHT - 80, WIDTH, 80);
    bg.lineStyle(2, 0x2a4a6a, 0.8);
    bg.lineBetween(0, HEIGHT - 80, WIDTH, HEIGHT - 80);

    // 電車の手すり
    bg.lineStyle(4, 0x3a5a8a, 0.6);
    bg.lineBetween(0, 270, WIDTH, 270);
    for (let i = 0; i < 8; i++) {
      bg.lineBetween(80 + i * 120, 200, 80 + i * 120, 270);
    }
  }

  private _drawTitle(): void {
    // タイトルロゴ背景
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000814, 0.75);
    titleBg.fillRoundedRect(WIDTH / 2 - 340, 30, 680, 110, 16);
    titleBg.lineStyle(2, 0xff4d4d, 0.8);
    titleBg.strokeRoundedRect(WIDTH / 2 - 340, 30, 680, 110, 16);

    // メインタイトル
    this.add.text(WIDTH / 2, 75, 'RUSH BREAKER', {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: '#ff4d4d',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#8b0000', fill: true }
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(WIDTH / 2, 122, '満員電車ランページ', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd166',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  private _drawControls(): void {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 操作説明パネル
    const panel = this.add.graphics();
    panel.fillStyle(0x0a1525, 0.8);
    panel.fillRoundedRect(WIDTH / 2 - 310, 310, 620, 160, 12);
    panel.lineStyle(2, 0x4a6a9a, 0.7);
    panel.strokeRoundedRect(WIDTH / 2 - 310, 310, 620, 160, 12);

    this.add.text(WIDTH / 2, 326, '-- 操作方法 --', {
      fontFamily: 'monospace', fontSize: '14px', color: '#9abde0'
    }).setOrigin(0.5);

    if (isTouchDevice) {
      this.add.text(WIDTH / 2, 358, [
        '左エリア  ◀  左移動    ▶  右移動',
        '          ↑JUMP  ジャンプ',
        '右エリア  弱  通常攻撃  強  強攻撃',
        '         (スマホは横向きで遊ぼう!)'
      ].join('\n'), {
        fontFamily: 'monospace', fontSize: '15px', color: '#d7e3ff',
        lineSpacing: 8
      }).setOrigin(0.5, 0);
    } else {
      this.add.text(WIDTH / 2, 358, [
        '←→: 移動      ↑: ジャンプ',
        ' Z : 弱攻撃   X : 強攻撃',
        ' R : リトライ  M : BGMミュート'
      ].join('\n'), {
        fontFamily: 'monospace', fontSize: '17px', color: '#d7e3ff',
        lineSpacing: 10
      }).setOrigin(0.5, 0);
    }
  }

  private _drawStartPrompt(): void {
    // 点滅する「PUSH START」テキスト
    const startText = this.add.text(WIDTH / 2, HEIGHT - 45, 'PUSH START  /  TAP TO PLAY', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.1,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ゲームタイトル説明
    this.add.text(WIDTH / 2, 235, '暴走する電車を止めろ！  車両の先頭へ進み非常ブレーキを引け！', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffa040',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  private _setupStartInput(): void {
    const audio = getAudioManager();
    const startGame = (): void => {
      // AudioContext 開始（autoplay ポリシー対応）
      audio.init();
      audio.playSE('uiSelect');
      this.time.delayedCall(150, () => {
        audio.stopBGM();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => this.scene.start('MainScene'));
      });
    };

    // キーボード
    this.input.keyboard?.once('keydown', startGame);
    // タッチ / マウス
    this.input.once('pointerdown', startGame);
  }
}

