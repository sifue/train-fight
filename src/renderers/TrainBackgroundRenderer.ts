import Phaser from 'phaser';
import { HEIGHT, WIDTH, WORLD_WIDTH } from '../constants';

const CAR_W  = 440;
const WIN_Y  = 76;   // 窓内側 上端 Y
const WIN_H  = 106;  // 窓の高さ（76〜182）
const TILE_W = 400;  // 景色テクスチャの繰り返し幅

// scrollFactor: プレイヤー移動時に追加視差（普通の背景より1.5倍速く流れる）
const SCENE_SCROLL = 1.5;
// カメラが WORLD_WIDTH-WIDTH まで進んだとき画面端に来るための必要幅
const SCENE_SPAN = Math.ceil((WORLD_WIDTH - WIDTH) * SCENE_SCROLL + WIDTH) + 420;

// 暴走電車の疾走感: 自動スクロール速度（px/秒, テクスチャ座標）
const AUTO_SCROLL_PX_PER_SEC = 560;

export class TrainBackgroundRenderer {
  private _sceneryTile?: Phaser.GameObjects.TileSprite;

  constructor(private readonly scene: Phaser.Scene) {}

  draw(): void {
    // 0層: 暗いベース背景
    this.scene.add.graphics()
      .fillStyle(0x111a2b)
      .fillRect(0, 0, WORLD_WIDTH, HEIGHT);

    // 1層: 窓外の自動スクロール景色（TileSprite + scrollFactor=1.5）
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

  /** MainScene の update() から毎フレーム呼ぶ */
  update(delta: number): void {
    if (this._sceneryTile) {
      this._sceneryTile.tilePositionX += AUTO_SCROLL_PX_PER_SEC * delta / 1000;
    }
  }

  // ----------------------------------------------------------------
  // 1層: 窓外の景色 TileSprite
  // ----------------------------------------------------------------
  private _drawOutsideScenery(): void {
    this._createSceneryTexture();
    const tile = this.scene.add.tileSprite(0, WIN_Y, SCENE_SPAN, WIN_H, 'window_scenery');
    tile.setOrigin(0, 0);
    tile.setScrollFactor(SCENE_SCROLL);
    this._sceneryTile = tile;
  }

  /** 'window_scenery' キャンバステクスチャを生成（初回のみ） */
  private _createSceneryTexture(): void {
    if (this.scene.textures.exists('window_scenery')) return;
    const canvas = this.scene.textures.createCanvas('window_scenery', TILE_W, WIN_H)!;
    this._drawSceneryToCanvas(canvas.context);
    canvas.refresh();
  }

  private _drawSceneryToCanvas(ctx: CanvasRenderingContext2D): void {
    // 座標は (0,0)=窓の左上 （WIN_Y 分オフセット済み）

    // 空
    ctx.fillStyle = '#bce8fc';
    ctx.fillRect(0, 0, TILE_W, 22);
    ctx.fillStyle = '#9ecff0';
    ctx.fillRect(0, 22, TILE_W, WIN_H - 22);

    // ビル群
    const bldgs = [
      { dx:  10, w: 44, bh: 72, c: '#5a7090' },
      { dx:  65, w: 30, bh: 88, c: '#4a6080' },
      { dx: 108, w: 56, bh: 58, c: '#627898' },
      { dx: 178, w: 38, bh: 90, c: '#516878' },
      { dx: 228, w: 50, bh: 68, c: '#4e6882' },
      { dx: 298, w: 42, bh: 52, c: '#5a7088' },
      { dx: 352, w: 36, bh: 80, c: '#4a6070' },
    ];
    for (const b of bldgs) {
      const by = WIN_H - b.bh;
      ctx.fillStyle = b.c;
      ctx.fillRect(b.dx, by, b.w, b.bh);
      // ビル窓（黄色い光）
      ctx.fillStyle = '#ffe090';
      for (let wy = by + 6; wy < WIN_H - 10; wy += 13) {
        for (let wx = b.dx + 4; wx < b.dx + b.w - 4; wx += 9) {
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
    }

    // 電柱（速度感のキー演出）
    const poles = [52, 148, 252, 355];
    ctx.fillStyle = '#3a2818';
    for (const px of poles) {
      ctx.fillRect(px, 0, 4, WIN_H);
      ctx.fillRect(px - 14, 4, 32, 3);  // 横棒
    }
    // 電線
    ctx.strokeStyle = 'rgba(40,32,24,0.65)';
    ctx.lineWidth = 1;
    for (let i = 0; i + 1 < poles.length; i++) {
      ctx.beginPath();
      ctx.moveTo(poles[i] + 2, 6);
      ctx.lineTo(poles[i + 1] + 2, 9);
      ctx.stroke();
    }

    // 地面（窓下部）
    ctx.fillStyle = '#6a8060';
    ctx.fillRect(0, WIN_H - 16, TILE_W, 10);
    ctx.fillStyle = '#4a6040';
    ctx.fillRect(0, WIN_H - 6, TILE_W, 6);
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

      // 窓ゾーン両脇の壁（窓穴は塗らない → TileSprite が透けて見える）
      g.fillStyle(WALL);
      g.fillRect(x + 14,  WIN_Y, 42,  WIN_H);  // 左柱〜左窓枠
      g.fillRect(x + 160, WIN_Y, 22,  WIN_H);  // 左窓枠〜ドア
      g.fillRect(x + 260, WIN_Y, 20,  WIN_H);  // ドア〜右窓枠
      g.fillRect(x + 384, WIN_Y, 42,  WIN_H);  // 右窓枠〜右柱

      // 左窓枠（内側 x+64〜x+152, y=76〜182 は未描画 → 景色が透ける）
      g.fillStyle(0x5b6d8f);
      g.fillRect(x + 56,  WIN_Y - 8, 104, 8);
      g.fillRect(x + 56,  WIN_Y + WIN_H, 104, 8);
      g.fillRect(x + 56,  WIN_Y - 8, 8, WIN_H + 16);
      g.fillRect(x + 152, WIN_Y - 8, 8, WIN_H + 16);
      g.fillStyle(0x8099bb);
      g.fillRect(x + 60,  WIN_Y - 4, 96, 4);
      g.fillRect(x + 60,  WIN_Y + WIN_H, 96, 4);

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
      g.fillRect(x + 14,  HEIGHT - 232, 12, 38);
      g.fillRect(x + 92,  HEIGHT - 232, 12, 38);
      g.fillRect(x + 118, HEIGHT - 232, 12, 38);
      g.fillRect(x + 196, HEIGHT - 232, 12, 38);
      g.fillStyle(0x3a5070);
      g.fillRect(x + 14,  HEIGHT - 200, 90, 8);
      g.fillRect(x + 118, HEIGHT - 200, 90, 8);
      g.fillStyle(0x42608a);
      g.fillRect(x + 14,  HEIGHT - 192, 90, 24);
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
    const SEAT_Y = HEIGHT - 192;
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

    g.fillStyle(skin);
    if (pose === 'sleep') {
      g.fillRect(cx - 5, headTop + 8, 10, 10);
    } else {
      g.fillRect(cx - 5, headTop, 10, 12);
    }
    g.fillStyle(hair);
    g.fillRect(cx - 5, pose === 'sleep' ? headTop + 8 : headTop, 10, 4);

    g.fillStyle(coat);
    g.fillRect(cx - 8, bodyTop, 16, 20);

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
      g.fillStyle(coat);
      g.fillRect(cx - 10, bodyTop + 10, 4, 8);
      g.fillRect(cx + 6,  bodyTop + 10, 4, 8);
    }
  }
}
