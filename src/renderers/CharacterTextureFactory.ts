import Phaser from 'phaser';

/**
 * CharacterTextureFactory
 * Canvas でドット絵風キャラクターテクスチャを生成する。
 * createCanvas でスプライトシートを作成し、フレームを手動追加。
 * 歩行アニメーションも登録する。
 */
export class CharacterTextureFactory {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 全テクスチャ・アニメーションを生成（シーンの create() で呼ぶ） */
  createAll(): void {
    if (!this.scene.textures.exists('char_player')) this.createPlayerSpritesheet();
    if (!this.scene.textures.exists('char_normal')) this.createEnemySpritesheet('char_normal', 0xd1d5db, 0xb0b4ba);
    if (!this.scene.textures.exists('char_rush'))   this.createEnemySpritesheet('char_rush',   0x8bb1ff, 0x6080cc);
    if (!this.scene.textures.exists('char_heavy'))  this.createHeavySpritesheet();
    if (!this.scene.textures.exists('char_boss'))   this.createBossSpritesheet();
    this.registerAnimations();
  }

  // ---- プレイヤー: 萌え系女子高生 5フレーム(idle=0, walkA=1, walkB=2, punch=3, kick=4) ----
  // W=36, H=64 で解像度アップ → 大きな目・ミニスカ・ニーハイソックスを表現
  private createPlayerSpritesheet(): void {
    const W = 48, H = 64, FRAMES = 5;
    const c = this.makeMultiFrameCanvas('char_player', W, H, FRAMES);
    const ctx = c.context;

    for (let f = 0; f < FRAMES; f++) {
      this.drawPlayer(ctx, f * W, f);
    }
    c.refresh();
    this.addFrames('char_player', W, H, FRAMES);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
    // ---- 後ろ髪（ダークブラウン） ----
    ctx.fillStyle = '#200c04';
    ctx.fillRect(ox + 6,  0, 24, 7);   // 頭頂部
    ctx.fillRect(ox + 4,  3,  4, 15);  // 左ツインテール
    ctx.fillRect(ox + 28, 3,  4, 15);  // 右ツインテール
    // 髪ハイライト
    ctx.fillStyle = '#4a2010';
    ctx.fillRect(ox + 10, 1,  8, 2);

    // ---- 顔（肌色） ----
    ctx.fillStyle = '#fce8d0';
    ctx.fillRect(ox + 9, 4, 18, 14);

    // ---- 前髪（顔の上に被さる） ----
    ctx.fillStyle = '#200c04';
    ctx.fillRect(ox + 8, 4, 20, 5);    // 前髪全体
    // 前髪の隙間（目が見えるように）
    ctx.fillStyle = '#fce8d0';
    ctx.fillRect(ox + 11, 6, 14, 3);

    // ---- 左目（大きな萌え目・7px幅） ----
    ctx.fillStyle = '#160820';          // 上まつ毛
    ctx.fillRect(ox + 10, 8,  7, 1);
    ctx.fillRect(ox + 10, 13, 1, 1);   // 下まつ毛左
    ctx.fillRect(ox + 16, 13, 1, 1);   // 下まつ毛右
    ctx.fillStyle = '#eaf4ff';          // 白目
    ctx.fillRect(ox + 10, 9,  7, 4);
    ctx.fillStyle = '#2266dd';          // 虹彩（ビビッドブルー）
    ctx.fillRect(ox + 11, 9,  5, 4);
    ctx.fillStyle = '#08061a';          // 瞳孔
    ctx.fillRect(ox + 12, 9,  3, 4);
    ctx.fillStyle = '#ffffff';          // キャッチライト（大きめ）
    ctx.fillRect(ox + 13, 9,  3, 2);
    ctx.fillRect(ox + 11, 12, 1, 1);   // サブハイライト

    // ---- 右目 ----
    ctx.fillStyle = '#160820';
    ctx.fillRect(ox + 19, 8,  7, 1);
    ctx.fillRect(ox + 19, 13, 1, 1);
    ctx.fillRect(ox + 25, 13, 1, 1);
    ctx.fillStyle = '#eaf4ff';
    ctx.fillRect(ox + 19, 9,  7, 4);
    ctx.fillStyle = '#2266dd';
    ctx.fillRect(ox + 20, 9,  5, 4);
    ctx.fillStyle = '#08061a';
    ctx.fillRect(ox + 21, 9,  3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 22, 9,  3, 2);
    ctx.fillRect(ox + 20, 12, 1, 1);

    // ---- ほっぺ（チーク：大きめ） ----
    ctx.fillStyle = '#ff9898';
    ctx.fillRect(ox + 9,  13, 3, 1);
    ctx.fillRect(ox + 24, 13, 3, 1);

    // ---- 口（小さなピンク） ----
    ctx.fillStyle = '#e0826a';
    ctx.fillRect(ox + 16, 16, 4, 1);

    // ---- ツインテールリボン（ホットピンク） ----
    ctx.fillStyle = '#ff1166';
    ctx.fillRect(ox + 2, 4, 6, 5);    // 左リボン
    ctx.fillRect(ox + 28, 4, 6, 5);   // 右リボン
    ctx.fillStyle = '#ff66aa';         // リボンハイライト
    ctx.fillRect(ox + 3, 5, 4, 3);
    ctx.fillRect(ox + 29, 5, 4, 3);
    ctx.fillStyle = '#cc0044';         // リボン中心ノット
    ctx.fillRect(ox + 4, 6, 2, 2);
    ctx.fillRect(ox + 30, 6, 2, 2);

    // ---- ネック ----
    ctx.fillStyle = '#fce8d0';
    ctx.fillRect(ox + 15, 18, 6, 3);

    // ---- セーラー服上半身（ネイビー） ----
    ctx.fillStyle = '#1e3672';
    ctx.fillRect(ox + 8, 20, 20, 17);  // ボディ y=20-36

    // 白セーラーカラー
    ctx.fillStyle = '#e8f4ff';
    ctx.fillRect(ox + 14, 20, 8, 5);
    ctx.fillRect(ox + 16, 20, 4, 8);

    // 赤スカーフリボン（胸元）
    ctx.fillStyle = '#cc1122';
    ctx.fillRect(ox + 13, 25, 10, 6);
    ctx.fillRect(ox + 12, 26, 3, 4);   // 左ハネ
    ctx.fillRect(ox + 21, 26, 3, 4);   // 右ハネ
    ctx.fillStyle = '#ff3344';
    ctx.fillRect(ox + 15, 27, 6, 3);
    ctx.fillStyle = '#aa0011';
    ctx.fillRect(ox + 17, 28, 2, 1);

    // ---- ミニスカート（たった7px！） ----
    ctx.fillStyle = '#1a2a5a';
    ctx.fillRect(ox + 7, 37, 22, 7);
    ctx.fillStyle = '#243470';         // プリーツライン
    ctx.fillRect(ox + 12, 37, 1, 7);
    ctx.fillRect(ox + 18, 37, 1, 7);
    ctx.fillRect(ox + 24, 37, 1, 7);

    // ---- 腕（フレーム別） ----
    ctx.fillStyle = '#1e3672';
    if (frame === 0) {
      ctx.fillRect(ox + 3,  22, 6, 15);
      ctx.fillRect(ox + 27, 22, 6, 15);
    } else if (frame === 1) {
      ctx.fillRect(ox + 2,  20, 6, 14);   // 左腕前
      ctx.fillRect(ox + 28, 24, 6, 14);   // 右腕後
    } else if (frame === 2) {
      ctx.fillRect(ox + 2,  24, 6, 14);   // 左腕後
      ctx.fillRect(ox + 28, 20, 6, 14);   // 右腕前
    } else if (frame === 3) {
      // パンチ: 左腕引き、右腕を大きくリーチして前方に伸ばす
      ctx.fillRect(ox + 3,  26, 6, 12);   // 左腕（引き）
      ctx.fillRect(ox + 27, 20, 6,  5);   // 右肩〜上腕
      ctx.fillRect(ox + 31, 19,10,  4);   // 右前腕（長く水平に）
      // 右拳（肌色・大きな拳！）
      ctx.fillStyle = '#fce8d0';
      ctx.fillRect(ox + 39, 17, 8,  8);
      ctx.fillStyle = '#d4b090';           // 指の影
      ctx.fillRect(ox + 39, 19, 1,  5);
      ctx.fillRect(ox + 41, 19, 1,  5);
      ctx.fillRect(ox + 43, 19, 1,  5);
      ctx.fillRect(ox + 45, 19, 1,  4);
    } else {
      // キック: 両腕を広げてバランス
      ctx.fillRect(ox + 1,  20, 7, 15);
      ctx.fillRect(ox + 28, 20, 7, 15);
    }

    // ---- 太もも（スカート下・肌色） ----
    // キックフレームはスカートの後に描くため脚は後で描画
    ctx.fillStyle = '#fce8d0';
    if (frame === 0) {
      ctx.fillRect(ox + 11, 44, 7, 10);
      ctx.fillRect(ox + 18, 44, 7, 10);
    } else if (frame === 1) {
      ctx.fillRect(ox + 9,  42, 7, 12);  // 左前
      ctx.fillRect(ox + 20, 45, 7,  9);  // 右後
    } else if (frame === 2) {
      ctx.fillRect(ox + 9,  45, 7,  9);  // 左後
      ctx.fillRect(ox + 20, 42, 7, 12);  // 右前
    } else if (frame === 3) {
      ctx.fillRect(ox + 11, 44, 7, 10);
      ctx.fillRect(ox + 18, 44, 7, 10);
    } else {
      // キック: 左軸足、右足を大きく前方に蹴り出す
      ctx.fillRect(ox + 11, 44, 7, 10);   // 左太もも（軸足）
      ctx.fillRect(ox + 20, 37, 8,  7);   // 右太もも（前方）
      ctx.fillRect(ox + 26, 39,10,  6);   // 右ひざ〜すね（さらに前へ）
    }

    // ---- ニーハイソックス（白） ----
    ctx.fillStyle = '#e8f4ff';
    if (frame === 0) {
      ctx.fillRect(ox + 11, 54, 7, 6);
      ctx.fillRect(ox + 18, 54, 7, 6);
    } else if (frame === 1) {
      ctx.fillRect(ox + 9,  54, 7, 6);
      ctx.fillRect(ox + 20, 54, 7, 6);
    } else if (frame === 2) {
      ctx.fillRect(ox + 9,  54, 7, 6);
      ctx.fillRect(ox + 20, 54, 7, 6);
    } else if (frame === 3) {
      ctx.fillRect(ox + 11, 54, 7, 6);
      ctx.fillRect(ox + 18, 54, 7, 6);
    } else {
      ctx.fillRect(ox + 11, 54, 7, 6);   // 左足ソックス
      ctx.fillRect(ox + 34, 43, 8, 5);   // 右足ソックス（蹴り足先、遠い！）
    }

    // ---- 靴 ----
    ctx.fillStyle = '#1a0e28';
    if (frame === 0) {
      ctx.fillRect(ox + 10, 60, 9, 4);
      ctx.fillRect(ox + 17, 60, 9, 4);
    } else if (frame === 1) {
      ctx.fillRect(ox + 8,  60, 9, 4);
      ctx.fillRect(ox + 19, 60, 9, 4);
    } else if (frame === 2) {
      ctx.fillRect(ox + 8,  60, 9, 4);
      ctx.fillRect(ox + 19, 60, 9, 4);
    } else if (frame === 3) {
      ctx.fillRect(ox + 10, 60, 9, 4);
      ctx.fillRect(ox + 17, 60, 9, 4);
    } else {
      ctx.fillRect(ox + 10, 60, 9, 4);   // 左靴
      ctx.fillRect(ox + 38, 46, 9, 4);   // 右靴（最遠端！ox+38〜47）
    }
  }

  // ---- 通常/突進敵: サラリーマン風 2フレーム ----
  private createEnemySpritesheet(key: string, coat: number, pants: number): void {
    const W = 28, H = 52, FRAMES = 2;
    const c = this.makeMultiFrameCanvas(key, W, H, FRAMES);
    const ctx = c.context;
    const coatHex  = '#' + coat.toString(16).padStart(6, '0');
    const pantsHex = '#' + pants.toString(16).padStart(6, '0');

    for (let f = 0; f < FRAMES; f++) {
      this.drawSalaryman(ctx, f * W, coatHex, pantsHex, f);
    }
    c.refresh();
    this.addFrames(key, W, H, FRAMES);
  }

  private drawSalaryman(
    ctx: CanvasRenderingContext2D, ox: number,
    coatHex: string, pantsHex: string, frame: number
  ): void {
    // 上着
    ctx.fillStyle = coatHex;
    ctx.fillRect(ox + 3, 16, 22, 22);

    // Yシャツ
    ctx.fillStyle = '#e8edf4';
    ctx.fillRect(ox + 10, 16, 8, 18);

    // 頭
    ctx.fillStyle = '#f0d0b0';
    ctx.fillRect(ox + 7, 4, 14, 13);

    // 黒髪
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(ox + 5, 2, 18, 7);

    // 目
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(ox + 10, 9, 2, 2);
    ctx.fillRect(ox + 16, 9, 2, 2);

    // 腕
    ctx.fillStyle = coatHex;
    if (frame === 0) {
      ctx.fillRect(ox + 0, 18, 5, 14);
      ctx.fillRect(ox + 23, 20, 5, 12);
    } else {
      ctx.fillRect(ox + 0, 20, 5, 12);
      ctx.fillRect(ox + 23, 18, 5, 14);
    }

    // ズボン
    ctx.fillStyle = pantsHex;
    ctx.fillRect(ox + 4, 34, 20, 14);

    // 脚
    if (frame === 0) {
      ctx.fillRect(ox + 5, 47, 8, 5);
      ctx.fillRect(ox + 15, 49, 8, 3);
    } else {
      ctx.fillRect(ox + 5, 49, 8, 3);
      ctx.fillRect(ox + 15, 47, 8, 5);
    }

    // 靴
    ctx.fillStyle = '#2a2010';
    if (frame === 0) {
      ctx.fillRect(ox + 4,  51, 9, 2);
      ctx.fillRect(ox + 14, 50, 9, 2);
    } else {
      ctx.fillRect(ox + 4,  50, 9, 2);
      ctx.fillRect(ox + 14, 51, 9, 2);
    }
  }

  // ---- 重量敵: ガタイのいいおじさん 2フレーム ----
  private createHeavySpritesheet(): void {
    const W = 36, H = 60, FRAMES = 2;
    const c = this.makeMultiFrameCanvas('char_heavy', W, H, FRAMES);
    const ctx = c.context;

    for (let f = 0; f < FRAMES; f++) {
      this.drawHeavy(ctx, f * W, f);
    }
    c.refresh();
    this.addFrames('char_heavy', W, H, FRAMES);
  }

  private drawHeavy(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
    // 体
    ctx.fillStyle = '#c04040';
    ctx.fillRect(ox + 2, 18, 32, 24);

    // ベルト
    ctx.fillStyle = '#401010';
    ctx.fillRect(ox + 2, 36, 32, 4);
    ctx.fillStyle = '#c0a000';
    ctx.fillRect(ox + 14, 37, 8, 3);

    // 頭
    ctx.fillStyle = '#f0c090';
    ctx.fillRect(ox + 9, 3, 18, 16);

    // 薄い髪
    ctx.fillStyle = '#6a5040';
    ctx.fillRect(ox + 8, 2, 20, 7);

    // 眉毛
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(ox + 12, 8, 5, 2);
    ctx.fillRect(ox + 19, 8, 5, 2);

    // 目
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(ox + 12, 11, 3, 3);
    ctx.fillRect(ox + 21, 11, 3, 3);

    // 腕（太い）
    ctx.fillStyle = '#c04040';
    if (frame === 0) {
      ctx.fillRect(ox + 0, 20, 6, 20);
      ctx.fillRect(ox + 30, 22, 6, 18);
    } else {
      ctx.fillRect(ox + 0, 22, 6, 18);
      ctx.fillRect(ox + 30, 20, 6, 20);
    }

    // ズボン
    ctx.fillStyle = '#8a2020';
    ctx.fillRect(ox + 5, 38, 26, 18);

    // 脚
    if (frame === 0) {
      ctx.fillRect(ox + 6,  52, 10, 8);
      ctx.fillRect(ox + 20, 54, 10, 6);
    } else {
      ctx.fillRect(ox + 6,  54, 10, 6);
      ctx.fillRect(ox + 20, 52, 10, 8);
    }

    // 靴
    ctx.fillStyle = '#2a1010';
    if (frame === 0) {
      ctx.fillRect(ox + 5,  58, 12, 3);
      ctx.fillRect(ox + 19, 57, 12, 3);
    } else {
      ctx.fillRect(ox + 5,  57, 12, 3);
      ctx.fillRect(ox + 19, 58, 12, 3);
    }
  }

  /** Phaser アニメーションを登録（グローバル anims に一度だけ） */
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

  // ---- 中ボス: 怖い車掌（黒服・大柄） ----
  private createBossSpritesheet(): void {
    const W = 44, H = 72, FRAMES = 2;
    const c = this.makeMultiFrameCanvas('char_boss', W, H, FRAMES);
    const ctx = c.context;
    for (let f = 0; f < FRAMES; f++) this.drawBoss(ctx, f * W, f);
    c.refresh();
    this.addFrames('char_boss', W, H, FRAMES);
  }

  private drawBoss(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
    // 制服上着（黒）
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(ox + 3, 22, 38, 28);

    // 金ボタン
    ctx.fillStyle = '#c0a000';
    ctx.fillRect(ox + 20, 24, 4, 4);
    ctx.fillRect(ox + 20, 32, 4, 4);
    ctx.fillRect(ox + 20, 40, 4, 4);

    // 白シャツ（えり）
    ctx.fillStyle = '#e8edf4';
    ctx.fillRect(ox + 17, 22, 10, 8);

    // ズボン（濃紺）
    ctx.fillStyle = '#16213e';
    ctx.fillRect(ox + 6, 46, 32, 22);

    // 帽子
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(ox + 6, 3, 32, 8);
    ctx.fillRect(ox + 4, 9, 36, 4);  // つば

    // 頭（肌色）
    ctx.fillStyle = '#f0c090';
    ctx.fillRect(ox + 10, 10, 24, 14);

    // 口ひげ
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(ox + 15, 19, 14, 3);

    // 目（鋭い）
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(ox + 13, 14, 4, 3);
    ctx.fillRect(ox + 27, 14, 4, 3);

    // 眉毛（太い・怒り）
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(ox + 12, 12, 6, 2);
    ctx.fillRect(ox + 26, 12, 6, 2);

    // 腕（大きな拳）
    ctx.fillStyle = '#1a1a2e';
    if (frame === 0) {
      ctx.fillRect(ox + 0, 24, 7, 22);
      ctx.fillRect(ox + 37, 26, 7, 20);
    } else {
      ctx.fillRect(ox + 0, 26, 7, 20);
      ctx.fillRect(ox + 37, 24, 7, 22);
    }
    // 拳
    ctx.fillStyle = '#f0c090';
    if (frame === 0) {
      ctx.fillRect(ox + 0,  44, 8, 8);
      ctx.fillRect(ox + 36, 44, 8, 8);
    } else {
      ctx.fillRect(ox + 0,  46, 8, 8);
      ctx.fillRect(ox + 36, 42, 8, 8);
    }

    // 脚
    if (frame === 0) {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(ox + 7,  60, 12, 10);
      ctx.fillRect(ox + 25, 62, 12, 8);
    } else {
      ctx.fillRect(ox + 7,  62, 12, 8);
      ctx.fillRect(ox + 25, 60, 12, 10);
    }

    // 靴
    ctx.fillStyle = '#0a0a14';
    if (frame === 0) {
      ctx.fillRect(ox + 6,  68, 14, 4);
      ctx.fillRect(ox + 24, 67, 14, 4);
    } else {
      ctx.fillRect(ox + 6,  67, 14, 4);
      ctx.fillRect(ox + 24, 68, 14, 4);
    }
  }

  // ---- ヘルパー ----

  /** createCanvas でスプライトシート用の横長キャンバスを作る */
  private makeMultiFrameCanvas(key: string, frameW: number, frameH: number, frames: number) {
    const c = this.scene.textures.createCanvas(key, frameW * frames, frameH)!;
    c.context.clearRect(0, 0, frameW * frames, frameH);
    return c;
  }

  /** Phaser テクスチャにフレームを手動登録 */
  private addFrames(key: string, frameW: number, frameH: number, count: number): void {
    const tex = this.scene.textures.get(key);
    for (let i = 0; i < count; i++) {
      tex.add(i, 0, i * frameW, 0, frameW, frameH);
    }
  }
}
