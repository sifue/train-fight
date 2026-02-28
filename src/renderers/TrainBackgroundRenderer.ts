import Phaser from 'phaser';
import { HEIGHT, WIDTH, WORLD_WIDTH } from '../constants';

const CAR_W  = 440;
const WIN_Y  = 76;   // 窓内側 上端 Y
const WIN_H  = 106;  // 窓の高さ（76〜182）

// scrollFactor=SCENE_SCROLL でカメラより速く流れる景色
const SCENE_SCROLL = 1.5;
// カメラが WORLD_WIDTH-WIDTH まで進んだ時、画面上に見える景色の最大 X
const SCENE_SPAN = Math.ceil((WORLD_WIDTH - WIDTH) * SCENE_SCROLL + WIDTH) + 420;
const TILE_W = 400;

export class TrainBackgroundRenderer {
  constructor(private readonly scene: Phaser.Scene) {}

  draw(): void {
    // 0層: 暗いベース背景
    this.scene.add.graphics()
      .fillStyle(0x111a2b)
      .fillRect(0, 0, WORLD_WIDTH, HEIGHT);

    // 1層: 窓外の高速流れる景色（scrollFactor > 1 → 疾走感）
    this._drawOutsideScenery();

    // 2層: 電車内部構造（窓穴は塗らず景色が透ける）
    this._drawInterior();

    // 3層: 座席の乗客たち
    this._drawPassengers();

    // ゴール表示
    this.scene.add.text(WORLD_WIDTH - 350, HEIGHT - 165, '先頭車両 / 非常ブレーキ', {
      font: '20px monospace',
      color: '#ffd166'
    });
  }

  // ----------------------------------------------------------------
  // 1層: 窓外の流れる景色
  // ----------------------------------------------------------------
  private _drawOutsideScenery(): void {
    const g = this.scene.add.graphics();
    g.setScrollFactor(SCENE_SCROLL);

    // 空（窓全体）
    g.fillStyle(0x9ecff0);
    g.fillRect(0, WIN_Y, SCENE_SPAN, WIN_H);

    for (let tx = 0; tx < SCENE_SPAN; tx += TILE_W) {
      this._drawSceneryTile(g, tx);
    }
  }

  private _drawSceneryTile(g: Phaser.GameObjects.Graphics, ox: number): void {
    const y0 = WIN_Y;
    const h  = WIN_H;

    // 空上部を明るく
    g.fillStyle(0xbce8fc);
    g.fillRect(ox, y0, TILE_W, 22);

    // ビル群（遠景）
    const bldgs = [
      { dx:  10, w: 44, bh: 72, c: 0x5a7090 },
      { dx:  65, w: 30, bh: 88, c: 0x4a6080 },
      { dx: 108, w: 56, bh: 58, c: 0x627898 },
      { dx: 178, w: 38, bh: 90, c: 0x516878 },
      { dx: 228, w: 50, bh: 68, c: 0x4e6882 },
      { dx: 298, w: 42, bh: 52, c: 0x5a7088 },
      { dx: 352, w: 36, bh: 80, c: 0x4a6070 },
    ];
    for (const b of bldgs) {
      const by = y0 + h - b.bh;
      g.fillStyle(b.c);
      g.fillRect(ox + b.dx, by, b.w, b.bh);
      // ビルの窓（黄色い光）
      g.fillStyle(0xffe090);
      for (let wy = by + 6; wy < y0 + h - 10; wy += 13) {
        for (let wx = ox + b.dx + 4; wx < ox + b.dx + b.w - 4; wx += 9) {
          g.fillRect(wx, wy, 5, 7);
        }
      }
    }

    // 電柱（高速疾走感のキー）
    const poles = [52, 148, 252, 355];
    g.fillStyle(0x3a2818);
    for (const px of poles) {
      g.fillRect(ox + px,      y0,      4, h);
      g.fillRect(ox + px - 14, y0 + 4, 32, 3);
    }
    // 電線
    g.lineStyle(1, 0x282018, 0.65);
    for (let i = 0; i + 1 < poles.length; i++) {
      g.lineBetween(ox + poles[i] + 2, y0 + 6, ox + poles[i + 1] + 2, y0 + 9);
    }

    // 地面（窓下部）
    g.fillStyle(0x6a8060);
    g.fillRect(ox, y0 + h - 16, TILE_W, 10);
    g.fillStyle(0x4a6040);
    g.fillRect(ox, y0 + h - 6,  TILE_W, 6);
  }

  // ----------------------------------------------------------------
  // 2層: 電車内部構造（窓内は透明のまま）
  // ----------------------------------------------------------------
  private _drawInterior(): void {
    const g = this.scene.add.graphics();
    const WALL = 0x3a4c6a;

    // 天井バー
    g.fillStyle(0x2f3f5b);
    g.fillRect(0, 0, WORLD_WIDTH, 32);
    g.fillStyle(0xdce7ff);
    g.fillRect(24, 8, WORLD_WIDTH - 48, 8);
    for (let x = 40; x < WORLD_WIDTH - 30; x += 120) {
      g.fillStyle(0xe8f0ff);
      g.fillRect(x - 22, 16, 44, 6);  // 蛍光灯
      g.fillStyle(0x6d7ea0);
      g.fillCircle(x, 12, 3);
    }

    // 天井〜窓上端の壁（全幅）
    g.fillStyle(WALL);
    g.fillRect(0, 32, WORLD_WIDTH, WIN_Y - 32);

    for (let x = 0; x < WORLD_WIDTH; x += CAR_W) {
      // 車両区切り柱（全高）
      g.fillStyle(0x4f607f);
      g.fillRect(x + 4,   0, 10, HEIGHT);
      g.fillRect(x + 426, 0, 10, HEIGHT);

      // 広告パネル（窓上）
      g.fillStyle(0xd8dde8);
      g.fillRect(x + 24,  40, 130, 18);
      g.fillStyle(0xffc857);
      g.fillRect(x + 284, 40, 128, 18);

      // 窓ゾーン（y=WIN_Y〜WIN_Y+WIN_H）の壁：窓穴は塗らない
      g.fillStyle(WALL);
      g.fillRect(x + 14,  WIN_Y, 42,  WIN_H);  // 左柱右〜左窓枠左
      g.fillRect(x + 160, WIN_Y, 22,  WIN_H);  // 左窓枠右〜ドア左
      g.fillRect(x + 260, WIN_Y, 20,  WIN_H);  // ドア右〜右窓枠左
      g.fillRect(x + 384, WIN_Y, 42,  WIN_H);  // 右窓枠右〜右柱左

      // 左窓枠（内側 x+64〜x+152, y=76〜182 は塗らず景色が透ける）
      g.fillStyle(0x5b6d8f);
      g.fillRect(x + 56,  WIN_Y - 8, 104, 8);           // 上枠
      g.fillRect(x + 56,  WIN_Y + WIN_H, 104, 8);       // 下枠
      g.fillRect(x + 56,  WIN_Y - 8, 8, WIN_H + 16);   // 左桟
      g.fillRect(x + 152, WIN_Y - 8, 8, WIN_H + 16);   // 右桟
      g.fillStyle(0x8099bb);
      g.fillRect(x + 60,  WIN_Y - 4, 96, 4);            // 上縁
      g.fillRect(x + 60,  WIN_Y + WIN_H, 96, 4);        // 下縁

      // 右窓枠（内側 x+288〜x+376 も景色が透ける）
      g.fillStyle(0x5b6d8f);
      g.fillRect(x + 280, WIN_Y - 8, 104, 8);
      g.fillRect(x + 280, WIN_Y + WIN_H, 104, 8);
      g.fillRect(x + 280, WIN_Y - 8, 8, WIN_H + 16);
      g.fillRect(x + 376, WIN_Y - 8, 8, WIN_H + 16);
      g.fillStyle(0x8099bb);
      g.fillRect(x + 284, WIN_Y - 4, 96, 4);
      g.fillRect(x + 284, WIN_Y + WIN_H, 96, 4);

      // 中央ドア枠
      g.fillStyle(0x7083a5);
      g.fillRect(x + 182, WIN_Y - 8, 78, WIN_H + 62);
      g.fillStyle(0x3b4c69);
      g.fillRect(x + 188, WIN_Y - 2, 66, WIN_H + 56);
      g.fillStyle(0x98aac7);
      g.fillRect(x + 219, 140, 4, 90);

      // 窓下〜床上の壁
      g.fillStyle(WALL);
      g.fillRect(x + 14, WIN_Y + WIN_H + 8, 412, HEIGHT - 165 - WIN_Y - WIN_H - 8);

      // 横手すりレール
      g.fillStyle(0x1b2940);
      g.fillRect(x + 10, 220, 420, 10);
      g.fillStyle(0x8099bb);
      g.fillRect(x + 10, 220, 420, 2);

      // 座席背もたれ・座面
      g.fillStyle(0x2a3a5a);
      g.fillRect(x + 14,  HEIGHT - 232, 12, 38);   // 背もたれ支柱 左
      g.fillRect(x + 92,  HEIGHT - 232, 12, 38);
      g.fillRect(x + 118, HEIGHT - 232, 12, 38);
      g.fillRect(x + 196, HEIGHT - 232, 12, 38);
      g.fillStyle(0x3a5070);
      g.fillRect(x + 14,  HEIGHT - 200, 90, 8);    // 背もたれ上端
      g.fillRect(x + 118, HEIGHT - 200, 90, 8);
      g.fillStyle(0x42608a);
      g.fillRect(x + 14,  HEIGHT - 192, 90, 24);   // 座面
      g.fillRect(x + 118, HEIGHT - 192, 90, 24);
    }

    // 床
    g.fillStyle(0x172338);
    g.fillRect(0, HEIGHT - 165, WORLD_WIDTH, 95);
    g.fillStyle(0xe6d36c);
    g.fillRect(0, HEIGHT - 82, WORLD_WIDTH, 8);
    for (let x = 0; x < WORLD_WIDTH; x += 70) {
      g.fillStyle((x / 70) % 2 ? 0x1f3049 : 0x253954);
      g.fillRect(x, HEIGHT - 75, 46, 6);
    }

    // 吊り革
    for (let x = 40; x < WORLD_WIDTH; x += 62) {
      g.lineStyle(2, 0x9eb1d6);
      g.lineBetween(x, 16, x, 46);
      g.fillStyle(0xe6edf9);
      g.fillCircle(x, 52, 7);
    }
  }

  // ----------------------------------------------------------------
  // 3層: 座席に座る乗客たち
  // ----------------------------------------------------------------
  private _drawPassengers(): void {
    const g = this.scene.add.graphics();
    const SEAT_Y = HEIGHT - 192;  // 座面上端
    const poses = ['sleep', 'phone', 'read', 'upright', 'look', 'phone', 'sleep', 'read'] as const;
    let idx = 0;

    for (let x = 0; x < WORLD_WIDTH; x += 220) {
      this._drawPassenger(g, x + 59,  SEAT_Y, poses[idx % poses.length], idx); idx++;
      this._drawPassenger(g, x + 163, SEAT_Y, poses[idx % poses.length], idx); idx++;
    }
  }

  private _drawPassenger(
    g: Phaser.GameObjects.Graphics,
    cx: number, seatY: number,
    pose: 'sleep' | 'phone' | 'read' | 'upright' | 'look',
    idx: number
  ): void {
    const skins = [0xf5d5b0, 0xe8c090, 0xf0c890, 0xd4a870, 0xf2d0a8];
    const coats = [0x3a4a6a, 0x4a3a2a, 0x2a4a3a, 0x6a4a3a, 0x2a2a4a, 0x5a5555, 0x3a3a6a];
    const hairs = [0x1a0a04, 0x4a3a20, 0x2a1a10, 0x0a0a14, 0x5a4030];
    const skin = skins[idx % skins.length];
    const coat = coats[idx % coats.length];
    const hair = hairs[idx % hairs.length];

    const headTop = seatY - 44;
    const bodyTop = seatY - 28;

    // 頭
    g.fillStyle(skin);
    if (pose === 'sleep') {
      g.fillRect(cx - 5, headTop + 8, 10, 10);
    } else {
      g.fillRect(cx - 5, headTop, 10, 12);
    }
    // 髪
    g.fillStyle(hair);
    if (pose === 'sleep') {
      g.fillRect(cx - 5, headTop + 8, 10, 4);
    } else {
      g.fillRect(cx - 5, headTop, 10, 4);
    }

    // 胴体
    g.fillStyle(coat);
    g.fillRect(cx - 8, bodyTop, 16, 20);

    // ポーズ別
    if (pose === 'phone') {
      g.fillStyle(coat);
      g.fillRect(cx + 5, bodyTop + 2, 4, 8);
      g.fillStyle(0x1a1a2a);
      g.fillRect(cx + 7, bodyTop - 8, 5, 9);
      g.fillStyle(0x66aaff);
      g.fillRect(cx + 8, bodyTop - 7, 3, 7);
      g.fillStyle(coat);
      g.fillRect(cx - 8, bodyTop + 8, 4, 8);
    } else if (pose === 'read') {
      g.fillStyle(coat);
      g.fillRect(cx - 10, bodyTop, 4, 10);
      g.fillRect(cx + 6,  bodyTop, 4, 10);
      g.fillStyle(0xe8e0d0);
      g.fillRect(cx - 8, bodyTop - 10, 16, 12);
      g.fillStyle(0x888880);
      g.fillRect(cx - 6, bodyTop - 8, 12, 1);
      g.fillRect(cx - 6, bodyTop - 5, 12, 1);
      g.fillRect(cx - 6, bodyTop - 2, 8,  1);
    } else if (pose === 'sleep') {
      g.fillStyle(coat);
      g.fillRect(cx - 10, bodyTop + 4, 4, 14);
      g.fillRect(cx + 6,  bodyTop + 4, 4, 14);
    } else {
      // upright / look
      g.fillStyle(coat);
      g.fillRect(cx - 10, bodyTop + 10, 4, 8);
      g.fillRect(cx + 6,  bodyTop + 10, 4, 8);
    }
  }
}
