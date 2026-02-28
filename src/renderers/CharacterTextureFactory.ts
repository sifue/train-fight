import Phaser from 'phaser';

/**
 * CharacterTextureFactory
 * Canvas でドット絵風キャラクターテクスチャを生成する。
 * 全キャラクター「右向きサイドビュー」で描画。
 * setFlipX(true) で左向きになる。
 */
export class CharacterTextureFactory {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createAll(): void {
    if (!this.scene.textures.exists('char_player')) this.createPlayerSpritesheet();
    if (!this.scene.textures.exists('char_normal')) this.createEnemySpritesheet('char_normal', 0xc8d4e8, 0x9098b0);
    if (!this.scene.textures.exists('char_rush'))   this.createEnemySpritesheet('char_rush',   0x8baae0, 0x6080cc);
    if (!this.scene.textures.exists('char_heavy'))  this.createHeavySpritesheet();
    if (!this.scene.textures.exists('char_boss'))   this.createBossSpritesheet();
    this.registerAnimations();
  }

  // ====================================================================
  // プレイヤー: 萌え系女子高生
  // W=48, H=64, 5フレーム (idle=0, walkA=1, walkB=2, punch=3, kick=4)
  // 右向きサイドビュー。後ろ=左側、前=右側
  // ====================================================================
  private createPlayerSpritesheet(): void {
    const W = 48, H = 64, FRAMES = 5;
    const c = this.makeMultiFrameCanvas('char_player', W, H, FRAMES);
    const ctx = c.context;
    for (let f = 0; f < FRAMES; f++) this.drawPlayer(ctx, f * W, f);
    c.refresh();
    this.addFrames('char_player', W, H, FRAMES);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
    // 右向きサイドビュー（3/4アングル）
    // 後ろ = 左側、前 = 右側

    // ---- 後ろ髪・ツインテール（左後方に流れる） ----
    ctx.fillStyle = '#200c04';
    ctx.fillRect(ox+ 2,  0, 14,  9);  // 後頭部
    ctx.fillRect(ox+ 2,  6,  6, 22);  // 左ツインテール
    ctx.fillRect(ox+ 6,  4,  4, 26);  // 右ツインテール
    ctx.fillStyle = '#4a1808';
    ctx.fillRect(ox+ 4,  1,  6,  3);  // ハイライト

    // ---- ツインテールリボン（ホットピンク） ----
    ctx.fillStyle = '#ff1166';
    ctx.fillRect(ox+ 1,  7,  7,  6);
    ctx.fillStyle = '#ff66aa';
    ctx.fillRect(ox+ 2,  8,  5,  4);
    ctx.fillStyle = '#cc0044';
    ctx.fillRect(ox+ 3,  9,  2,  2);  // ノット

    // ---- 前髪（右向きに伸びる） ----
    ctx.fillStyle = '#200c04';
    ctx.fillRect(ox+10,  0, 14,  5);  // 前髪メイン
    ctx.fillRect(ox+20,  4,  5,  5);  // 右サイドバング
    ctx.fillRect(ox+14,  4,  4,  4);  // 前髪たれ

    // ---- 顔（右向きプロフィール） ----
    ctx.fillStyle = '#fce8d0';
    ctx.fillRect(ox+12,  4, 12, 13);  // 顔本体
    ctx.fillRect(ox+22,  6,  3,  8);  // 鼻先〜あご（右に突き出す）

    // ---- 大きな萌え目（1つ・右側） ----
    ctx.fillStyle = '#160820';
    ctx.fillRect(ox+15,  8,  8,  1);  // 上まつ毛
    ctx.fillRect(ox+15, 13,  1,  1);
    ctx.fillRect(ox+22, 13,  1,  1);
    ctx.fillStyle = '#eaf4ff';
    ctx.fillRect(ox+15,  9,  8,  4);  // 白目
    ctx.fillStyle = '#2266dd';
    ctx.fillRect(ox+16,  9,  6,  4);  // 虹彩
    ctx.fillStyle = '#08061a';
    ctx.fillRect(ox+18,  9,  3,  4);  // 瞳孔
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox+19,  9,  3,  2);  // キャッチライト
    ctx.fillRect(ox+16, 12,  1,  1);  // サブハイライト

    // ほっぺ・口
    ctx.fillStyle = '#ff9898';
    ctx.fillRect(ox+20, 13,  3,  1);
    ctx.fillStyle = '#e0826a';
    ctx.fillRect(ox+21, 15,  3,  1);

    // ---- ネック ----
    ctx.fillStyle = '#fce8d0';
    ctx.fillRect(ox+15, 17,  6,  4);

    // ---- セーラー服上半身 ----
    ctx.fillStyle = '#1e3672';
    ctx.fillRect(ox+12, 20, 14, 16);  // 胴体（横から細め）
    ctx.fillStyle = '#e8f4ff';
    ctx.fillRect(ox+16, 20,  7,  4);  // 前えり
    ctx.fillRect(ox+13, 20,  4,  8);  // 横えり（後ろ側）
    ctx.fillStyle = '#cc1122';
    ctx.fillRect(ox+15, 24,  9,  7);  // スカーフ
    ctx.fillStyle = '#ff3344';
    ctx.fillRect(ox+16, 26,  6,  4);
    ctx.fillStyle = '#aa0011';
    ctx.fillRect(ox+18, 28,  2,  2);

    // ---- ミニスカート（横から台形） ----
    ctx.fillStyle = '#1a2a5a';
    ctx.fillRect(ox+10, 36, 16,  7);
    ctx.fillStyle = '#243470';
    ctx.fillRect(ox+14, 36,  1,  7);
    ctx.fillRect(ox+20, 36,  1,  7);

    // ---- 腕（フレーム別・横から見た前後の腕） ----
    ctx.fillStyle = '#1e3672';
    if (frame === 0) {
      // アイドル: 自然に下げた状態
      ctx.fillRect(ox+ 9, 22,  5, 14);  // 後ろ腕（左）
      ctx.fillRect(ox+22, 22,  5, 14);  // 前腕（右）
    } else if (frame === 1) {
      // 歩行A: 前腕前方・後ろ腕後方
      ctx.fillRect(ox+ 9, 24,  5, 13);
      ctx.fillRect(ox+22, 20,  5, 14);
    } else if (frame === 2) {
      // 歩行B: 逆
      ctx.fillRect(ox+ 9, 20,  5, 14);
      ctx.fillRect(ox+22, 24,  5, 13);
    } else if (frame === 3) {
      // パンチ: 後ろ腕引き・前腕を力強く長く伸ばす
      ctx.fillRect(ox+ 9, 26,  5, 10);  // 後ろ腕（引き）
      ctx.fillRect(ox+22, 20,  5,  5);  // 前肩〜上腕
      ctx.fillRect(ox+25, 19, 10,  4);  // 前腕（水平）
      // 前拳（肌色・大きな拳！）
      ctx.fillStyle = '#fce8d0';
      ctx.fillRect(ox+33, 17,  9,  8);
      ctx.fillStyle = '#d4b090';
      ctx.fillRect(ox+33, 19,  1,  5);
      ctx.fillRect(ox+35, 19,  1,  5);
      ctx.fillRect(ox+37, 19,  1,  5);
      ctx.fillRect(ox+39, 19,  1,  4);
    } else {
      // キック: 両腕広げてバランス
      ctx.fillRect(ox+ 8, 20,  5, 15);
      ctx.fillRect(ox+23, 20,  5, 15);
    }

    // ---- 脚（フレーム別） ----
    ctx.fillStyle = '#fce8d0';
    if (frame === 0) {
      ctx.fillRect(ox+12, 43,  6, 13);
      ctx.fillRect(ox+18, 43,  6, 13);
    } else if (frame === 1) {
      ctx.fillRect(ox+10, 43,  6, 12);  // 後ろ脚
      ctx.fillRect(ox+20, 41,  6, 14);  // 前脚
    } else if (frame === 2) {
      ctx.fillRect(ox+10, 41,  6, 14);
      ctx.fillRect(ox+20, 43,  6, 12);
    } else if (frame === 3) {
      ctx.fillRect(ox+11, 43,  6, 13);
      ctx.fillRect(ox+19, 43,  6, 13);
    } else {
      // キック
      ctx.fillRect(ox+12, 43,  6, 13);  // 後ろ軸足
      ctx.fillRect(ox+22, 36,  8,  8);  // 前太もも（高く前方へ）
      ctx.fillRect(ox+28, 39, 10,  7);  // 前すね（水平・長い）
    }

    // ---- ニーハイソックス ----
    ctx.fillStyle = '#e8f4ff';
    if (frame === 0) {
      ctx.fillRect(ox+12, 56,  6,  5);
      ctx.fillRect(ox+18, 56,  6,  5);
    } else if (frame === 1) {
      ctx.fillRect(ox+10, 55,  6,  5);
      ctx.fillRect(ox+20, 56,  6,  5);
    } else if (frame === 2) {
      ctx.fillRect(ox+10, 56,  6,  5);
      ctx.fillRect(ox+20, 55,  6,  5);
    } else if (frame === 3) {
      ctx.fillRect(ox+11, 56,  6,  5);
      ctx.fillRect(ox+19, 56,  6,  5);
    } else {
      ctx.fillRect(ox+12, 56,  6,  5);  // 後ろ足
      ctx.fillRect(ox+35, 44,  8,  4);  // キック足ソックス（遠い！）
    }

    // ---- 靴 ----
    ctx.fillStyle = '#1a0e28';
    if (frame === 0) {
      ctx.fillRect(ox+10, 61,  8,  3);
      ctx.fillRect(ox+16, 61,  8,  3);
    } else if (frame === 1) {
      ctx.fillRect(ox+ 8, 61,  8,  3);
      ctx.fillRect(ox+18, 61,  9,  3);
    } else if (frame === 2) {
      ctx.fillRect(ox+ 8, 61,  9,  3);
      ctx.fillRect(ox+18, 61,  8,  3);
    } else if (frame === 3) {
      ctx.fillRect(ox+10, 61,  8,  3);
      ctx.fillRect(ox+17, 61,  8,  3);
    } else {
      ctx.fillRect(ox+10, 61,  8,  3);  // 後ろ靴
      ctx.fillRect(ox+38, 46,  9,  4);  // キック靴（最遠端！）
    }
  }

  // ====================================================================
  // 通常/突進敵: サラリーマン
  // W=28, H=52, 2フレーム。右向きサイドビュー
  // ====================================================================
  private createEnemySpritesheet(key: string, coat: number, pants: number): void {
    const W = 28, H = 52, FRAMES = 2;
    const c = this.makeMultiFrameCanvas(key, W, H, FRAMES);
    const ctx = c.context;
    const coatHex  = '#' + coat.toString(16).padStart(6, '0');
    const pantsHex = '#' + pants.toString(16).padStart(6, '0');
    for (let f = 0; f < FRAMES; f++) this.drawSalaryman(ctx, f * W, coatHex, pantsHex, f);
    c.refresh();
    this.addFrames(key, W, H, FRAMES);
  }

  private drawSalaryman(
    ctx: CanvasRenderingContext2D, ox: number,
    coatHex: string, pantsHex: string, frame: number
  ): void {
    // 右向きサイドビュー（丸顔でかわいめの困り顔）

    // ---- 頭・髪 ----
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(ox+ 3,  0, 14,  7);  // 頭頂
    ctx.fillRect(ox+ 2,  4,  5,  8);  // 後ろ髪（左）
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(ox+ 4,  1,  6,  2);  // ハイライト

    // ---- 顔（丸顔・右向き） ----
    ctx.fillStyle = '#f5d5b0';
    ctx.fillRect(ox+ 6,  3, 12, 11);  // 顔
    ctx.fillRect(ox+16,  5,  2,  5);  // 鼻先（右）
    ctx.fillRect(ox+ 5, 10,  2,  3);  // あご丸み

    // 眉（困り顔）
    ctx.fillStyle = '#3a2a0a';
    ctx.fillRect(ox+ 8,  5,  5,  1);
    ctx.fillRect(ox+ 9,  4,  3,  1);

    // 目（丸くてかわいい）
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(ox+ 9,  7,  3,  3);
    ctx.fillStyle = '#2266aa';
    ctx.fillRect(ox+ 9,  7,  2,  2);  // 虹彩
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox+10,  7,  1,  1);  // ハイライト

    // 口（への字）
    ctx.fillStyle = '#c08060';
    ctx.fillRect(ox+10, 12,  4,  1);
    ctx.fillRect(ox+ 9, 11,  1,  1);

    // ---- ネック ----
    ctx.fillStyle = '#f5d5b0';
    ctx.fillRect(ox+10, 14,  4,  3);

    // ---- スーツ上着 ----
    ctx.fillStyle = coatHex;
    ctx.fillRect(ox+ 6, 16, 14, 16);  // 上着（横から）
    // シャツ
    ctx.fillStyle = '#eef4ff';
    ctx.fillRect(ox+10, 16,  5,  9);
    // ネクタイ（赤）
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(ox+11, 16,  3, 12);
    ctx.fillStyle = '#ff4422';
    ctx.fillRect(ox+12, 20,  1,  4);

    // ---- 腕（前後交互） ----
    ctx.fillStyle = coatHex;
    if (frame === 0) {
      ctx.fillRect(ox+ 2, 17,  5, 12);  // 後ろ腕
      ctx.fillRect(ox+18, 17,  5, 12);  // 前腕
    } else {
      ctx.fillRect(ox+ 2, 19,  5, 10);  // 後ろ腕（後方）
      ctx.fillRect(ox+18, 15,  5, 14);  // 前腕（前方）
    }

    // ---- ズボン ----
    ctx.fillStyle = pantsHex;
    ctx.fillRect(ox+ 7, 32, 12, 12);

    // ---- 脚（前後交互） ----
    if (frame === 0) {
      ctx.fillRect(ox+ 7, 44,  5,  5);
      ctx.fillRect(ox+13, 44,  5,  5);
    } else {
      ctx.fillRect(ox+ 4, 44,  5,  5);  // 後ろ脚
      ctx.fillRect(ox+13, 44,  5,  7);  // 前脚（前方）
    }

    // ---- 靴 ----
    ctx.fillStyle = '#2a1a10';
    if (frame === 0) {
      ctx.fillRect(ox+ 5, 49,  8,  3);
      ctx.fillRect(ox+11, 49,  8,  3);
    } else {
      ctx.fillRect(ox+ 2, 49,  8,  3);
      ctx.fillRect(ox+11, 49,  9,  3);
    }
  }

  // ====================================================================
  // 重量敵: ガタイのいいおじさん
  // W=36, H=60, 2フレーム。右向きサイドビュー
  // ====================================================================
  private createHeavySpritesheet(): void {
    const W = 36, H = 60, FRAMES = 2;
    const c = this.makeMultiFrameCanvas('char_heavy', W, H, FRAMES);
    const ctx = c.context;
    for (let f = 0; f < FRAMES; f++) this.drawHeavy(ctx, f * W, f);
    c.refresh();
    this.addFrames('char_heavy', W, H, FRAMES);
  }

  private drawHeavy(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
    // 右向きサイドビュー、大柄・ぽっちゃり

    // ---- 頭（大きめ・ちょっとかわいい） ----
    ctx.fillStyle = '#6a4830';
    ctx.fillRect(ox+ 4,  0, 18,  7);  // 頭頂
    ctx.fillRect(ox+ 2,  4,  6, 10);  // 後ろ髪（左）
    ctx.fillStyle = '#f0b080';
    ctx.fillRect(ox+ 6,  3, 16, 13);  // 顔（大きくぽっちゃり）
    ctx.fillRect(ox+20,  5,  3,  8);  // 鼻先（大きめ）

    // 眉・目
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(ox+10,  5,  6,  2);  // 眉
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(ox+11,  8,  4,  3);  // 目
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox+12,  8,  1,  1);

    // ほっぺ（丸くてかわいい）
    ctx.fillStyle = '#e08868';
    ctx.fillRect(ox+18, 11,  3,  2);

    // 口ひげ
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(ox+12, 13,  7,  2);
    // 口（ニヤリ）
    ctx.fillStyle = '#c07050';
    ctx.fillRect(ox+13, 15,  5,  1);

    // ---- ネック ----
    ctx.fillStyle = '#f0b080';
    ctx.fillRect(ox+12, 16,  6,  3);

    // ---- 赤ジャージ（大きな体） ----
    ctx.fillStyle = '#c03030';
    ctx.fillRect(ox+ 4, 18, 22, 22);  // 胴体（横から大きい）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox+ 4, 20, 22,  2);  // 白ライン横
    ctx.fillRect(ox+ 4, 18,  2, 22);  // 白ライン縦

    // ---- ベルト ----
    ctx.fillStyle = '#401010';
    ctx.fillRect(ox+ 5, 35, 20,  4);
    ctx.fillStyle = '#c0a000';
    ctx.fillRect(ox+12, 36,  8,  3);  // バックル

    // ---- 腕（太い） ----
    ctx.fillStyle = '#c03030';
    if (frame === 0) {
      ctx.fillRect(ox+ 0, 20,  6, 18);  // 後ろ腕
      ctx.fillRect(ox+24, 20,  6, 18);  // 前腕
    } else {
      ctx.fillRect(ox+ 0, 22,  6, 16);  // 後ろ腕（後方）
      ctx.fillRect(ox+24, 17,  6, 21);  // 前腕（前方）
    }
    // 拳（肌色）
    ctx.fillStyle = '#f0b080';
    if (frame === 0) {
      ctx.fillRect(ox+ 0, 37,  7,  7);
      ctx.fillRect(ox+23, 37,  7,  7);
    } else {
      ctx.fillRect(ox+ 0, 37,  7,  7);
      ctx.fillRect(ox+23, 35,  7,  7);
    }

    // ---- ズボン ----
    ctx.fillStyle = '#8a2020';
    ctx.fillRect(ox+ 5, 39, 20, 16);

    // ---- 脚（太い） ----
    if (frame === 0) {
      ctx.fillRect(ox+ 6, 54,  8,  5);
      ctx.fillRect(ox+16, 54,  8,  5);
    } else {
      ctx.fillRect(ox+ 3, 54,  8,  5);  // 後ろ脚
      ctx.fillRect(ox+16, 53,  8,  7);  // 前脚（前方）
    }

    // ---- 靴 ----
    ctx.fillStyle = '#2a1010';
    if (frame === 0) {
      ctx.fillRect(ox+ 4, 58, 11,  3);
      ctx.fillRect(ox+14, 58, 11,  3);
    } else {
      ctx.fillRect(ox+ 1, 58, 11,  3);
      ctx.fillRect(ox+14, 57, 12,  3);
    }
  }

  // ====================================================================
  // 中ボス: 怖い車掌
  // W=44, H=72, 2フレーム。右向きサイドビュー
  // ====================================================================
  private createBossSpritesheet(): void {
    const W = 44, H = 72, FRAMES = 2;
    const c = this.makeMultiFrameCanvas('char_boss', W, H, FRAMES);
    const ctx = c.context;
    for (let f = 0; f < FRAMES; f++) this.drawBoss(ctx, f * W, f);
    c.refresh();
    this.addFrames('char_boss', W, H, FRAMES);
  }

  private drawBoss(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
    // 右向きサイドビュー、威厳ある車掌

    // ---- 制服帽子（横から） ----
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(ox+ 6,  0, 22,  6);  // 帽子上部
    ctx.fillRect(ox+ 4,  5, 26,  4);  // つば
    ctx.fillStyle = '#c0a000';
    ctx.fillRect(ox+16,  1,  8,  4);  // バッジ
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(ox+18,  2,  4,  2);  // バッジ輝き

    // ---- 顔 ----
    ctx.fillStyle = '#f0c090';
    ctx.fillRect(ox+ 8,  7, 16, 14);  // 顔
    ctx.fillRect(ox+22,  9,  3,  8);  // 鼻先（右）

    // 眉（厳しい・傾いた）
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(ox+10,  9,  6,  2);
    ctx.fillRect(ox+11,  8,  4,  1);

    // 目（鋭い）
    ctx.fillStyle = '#1a1818';
    ctx.fillRect(ox+11, 12,  4,  2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox+12, 12,  1,  1);

    // 口ひげ（堂々たる）
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(ox+12, 18,  9,  2);
    ctx.fillRect(ox+11, 17,  2,  2);

    // 口
    ctx.fillStyle = '#c08060';
    ctx.fillRect(ox+14, 20,  5,  1);

    // ---- ネック ----
    ctx.fillStyle = '#f0c090';
    ctx.fillRect(ox+14, 22,  6,  3);

    // ---- 制服上着（黒・横から） ----
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(ox+ 8, 24, 20, 24);
    // 金ボタン
    ctx.fillStyle = '#c0a000';
    ctx.fillRect(ox+18, 26,  4,  3);
    ctx.fillRect(ox+18, 32,  4,  3);
    ctx.fillRect(ox+18, 38,  4,  3);
    // 白えり
    ctx.fillStyle = '#e8f0f8';
    ctx.fillRect(ox+14, 24,  6,  4);

    // ---- 腕（大きな拳） ----
    ctx.fillStyle = '#1a1a2e';
    if (frame === 0) {
      ctx.fillRect(ox+ 2, 26,  7, 20);  // 後ろ腕
      ctx.fillRect(ox+26, 26,  7, 20);  // 前腕
    } else {
      ctx.fillRect(ox+ 2, 28,  7, 18);  // 後ろ腕（後方）
      ctx.fillRect(ox+26, 22,  7, 24);  // 前腕（前方）
    }
    // 拳
    ctx.fillStyle = '#f0c090';
    if (frame === 0) {
      ctx.fillRect(ox+ 2, 44,  8,  8);
      ctx.fillRect(ox+26, 44,  8,  8);
    } else {
      ctx.fillRect(ox+ 2, 44,  8,  8);
      ctx.fillRect(ox+26, 42,  8,  8);
    }

    // ---- ズボン ----
    ctx.fillStyle = '#16213e';
    ctx.fillRect(ox+10, 47, 16, 20);

    // ---- 脚 ----
    if (frame === 0) {
      ctx.fillRect(ox+10, 60, 10,  8);
      ctx.fillRect(ox+22, 60, 10,  8);
    } else {
      ctx.fillRect(ox+ 6, 60, 10,  8);  // 後ろ脚
      ctx.fillRect(ox+22, 58, 10, 10);  // 前脚（前方）
    }

    // ---- 靴 ----
    ctx.fillStyle = '#0a0a14';
    if (frame === 0) {
      ctx.fillRect(ox+ 8, 67, 14,  5);
      ctx.fillRect(ox+20, 67, 14,  5);
    } else {
      ctx.fillRect(ox+ 4, 67, 14,  5);
      ctx.fillRect(ox+20, 66, 14,  5);
    }
  }

  // ====================================================================
  // アニメーション登録
  // ====================================================================
  private registerAnimations(): void {
    const anims = this.scene.anims;

    if (!anims.exists('player_idle')) {
      anims.create({ key: 'player_idle',  frames: anims.generateFrameNumbers('char_player', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
      anims.create({ key: 'player_walk',  frames: anims.generateFrameNumbers('char_player', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
      anims.create({ key: 'player_punch', frames: [{ key: 'char_player', frame: 3 }], duration: 260, repeat: 0 });
      anims.create({ key: 'player_kick',  frames: [{ key: 'char_player', frame: 4 }], duration: 300, repeat: 0 });
    }

    for (const type of ['normal', 'rush'] as const) {
      if (!anims.exists(`${type}_walk`)) {
        anims.create({ key: `${type}_idle`, frames: anims.generateFrameNumbers(`char_${type}`, { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
        anims.create({ key: `${type}_walk`, frames: anims.generateFrameNumbers(`char_${type}`, { start: 0, end: 1 }), frameRate: 7, repeat: -1 });
      }
    }

    if (!anims.exists('heavy_walk')) {
      anims.create({ key: 'heavy_idle', frames: anims.generateFrameNumbers('char_heavy', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
      anims.create({ key: 'heavy_walk', frames: anims.generateFrameNumbers('char_heavy', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    }

    if (!anims.exists('boss_walk')) {
      anims.create({ key: 'boss_idle', frames: anims.generateFrameNumbers('char_boss', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
      anims.create({ key: 'boss_walk', frames: anims.generateFrameNumbers('char_boss', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    }
  }

  // ====================================================================
  // ヘルパー
  // ====================================================================
  private makeMultiFrameCanvas(key: string, frameW: number, frameH: number, frames: number) {
    const c = this.scene.textures.createCanvas(key, frameW * frames, frameH)!;
    c.context.clearRect(0, 0, frameW * frames, frameH);
    return c;
  }

  private addFrames(key: string, frameW: number, frameH: number, count: number): void {
    const tex = this.scene.textures.get(key);
    for (let i = 0; i < count; i++) {
      tex.add(i, 0, i * frameW, 0, frameW, frameH);
    }
  }
}
