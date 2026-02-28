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
  private createPlayerSpritesheet(): void {
    const W = 30, H = 58, FRAMES = 5;
    const c = this.makeMultiFrameCanvas('char_player', W, H, FRAMES);
    const ctx = c.context;

    for (let f = 0; f < FRAMES; f++) {
      this.drawPlayer(ctx, f * W, f);
    }
    c.refresh();
    this.addFrames('char_player', W, H, FRAMES);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
    // ---- 髪（ダークブラウン・ツインテール風） ----
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(ox + 5, 0, 20, 6);   // 頭頂部
    ctx.fillRect(ox + 4, 4, 22, 4);   // 前髪
    ctx.fillRect(ox + 4, 4, 3, 12);   // 左サイドロック
    ctx.fillRect(ox + 23, 4, 3, 12);  // 右サイドロック
    // 髪ハイライト
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(ox + 9, 1, 5, 2);

    // ツインテールリボン（ピンク）
    ctx.fillStyle = '#ff4488';
    ctx.fillRect(ox + 2, 5, 4, 3);
    ctx.fillRect(ox + 24, 5, 4, 3);
    ctx.fillStyle = '#ff88bb';
    ctx.fillRect(ox + 3, 6, 2, 1);
    ctx.fillRect(ox + 25, 6, 2, 1);

    // ---- 顔（肌色） ----
    ctx.fillStyle = '#f7c8a0';
    ctx.fillRect(ox + 8, 4, 14, 14);

    // ---- 大きな目（萌え系） ----
    // 左目
    ctx.fillStyle = '#1a1a2a';           // まつ毛・アウトライン
    ctx.fillRect(ox + 9, 8, 5, 1);      // 上まつ毛
    ctx.fillRect(ox + 9, 12, 1, 1);     // 下まつ毛左端
    ctx.fillRect(ox + 13, 12, 1, 1);    // 下まつ毛右端
    ctx.fillStyle = '#ddeeff';           // 白目
    ctx.fillRect(ox + 9, 9, 5, 3);
    ctx.fillStyle = '#2855aa';           // 虹彩（青）
    ctx.fillRect(ox + 10, 9, 3, 3);
    ctx.fillStyle = '#0a0a18';           // 瞳孔
    ctx.fillRect(ox + 11, 10, 1, 2);
    ctx.fillStyle = '#ffffff';           // キャッチライト
    ctx.fillRect(ox + 12, 9, 1, 1);

    // 右目
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(ox + 16, 8, 5, 1);
    ctx.fillRect(ox + 16, 12, 1, 1);
    ctx.fillRect(ox + 20, 12, 1, 1);
    ctx.fillStyle = '#ddeeff';
    ctx.fillRect(ox + 16, 9, 5, 3);
    ctx.fillStyle = '#2855aa';
    ctx.fillRect(ox + 17, 9, 3, 3);
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(ox + 18, 10, 1, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 19, 9, 1, 1);

    // ほっぺ（チーク）
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(ox + 8, 13, 2, 1);
    ctx.fillRect(ox + 20, 13, 2, 1);

    // 口（小さなピンク）
    ctx.fillStyle = '#e8806a';
    ctx.fillRect(ox + 13, 15, 3, 1);

    // ---- ネック ----
    ctx.fillStyle = '#f7c8a0';
    ctx.fillRect(ox + 12, 17, 6, 3);

    // ---- セーラー服上半身（紺） ----
    ctx.fillStyle = '#1e3a6e';
    ctx.fillRect(ox + 4, 18, 22, 20);

    // 白セーラーカラー
    ctx.fillStyle = '#e8edf4';
    ctx.fillRect(ox + 9, 18, 12, 5);
    ctx.fillRect(ox + 11, 18, 8, 8);

    // 赤チェストリボン
    ctx.fillStyle = '#cc1122';
    ctx.fillRect(ox + 11, 22, 8, 5);
    ctx.fillStyle = '#ff3344';
    ctx.fillRect(ox + 13, 23, 4, 3);
    ctx.fillStyle = '#cc1122';
    ctx.fillRect(ox + 14, 24, 2, 1);  // 中心ノット

    // ---- スカート（ネイビー・プリーツ） ----
    ctx.fillStyle = '#1e2e5a';
    ctx.fillRect(ox + 3, 36, 24, 16);
    // プリーツライン（やや明るい）
    ctx.fillStyle = '#2a3e70';
    ctx.fillRect(ox + 7,  36, 1, 16);
    ctx.fillRect(ox + 13, 36, 1, 16);
    ctx.fillRect(ox + 19, 36, 1, 16);

    // ---- 白ソックス ----
    ctx.fillStyle = '#e8edf4';
    ctx.fillRect(ox + 7, 52, 6, 4);
    ctx.fillRect(ox + 17, 52, 6, 4);

    // ---- 腕（フレーム別） ----
    ctx.fillStyle = '#1e3a6e';
    if (frame === 0) {
      // アイドル: 自然に垂らす
      ctx.fillRect(ox + 1, 20, 4, 16);
      ctx.fillRect(ox + 25, 20, 4, 16);
    } else if (frame === 1) {
      // ウォークA: 左前・右後
      ctx.fillRect(ox + 0, 18, 4, 16);
      ctx.fillRect(ox + 26, 22, 4, 14);
    } else if (frame === 2) {
      // ウォークB: 右前・左後
      ctx.fillRect(ox + 0, 22, 4, 14);
      ctx.fillRect(ox + 26, 18, 4, 16);
    } else if (frame === 3) {
      // パンチ: 右腕を前方に突き出す
      ctx.fillRect(ox + 1, 22, 4, 14);   // 左腕（引いた状態）
      ctx.fillRect(ox + 24, 20, 6, 5);   // 右腕（伸ばした状態）
      // パンチ拳（肌色）
      ctx.fillStyle = '#f7c8a0';
      ctx.fillRect(ox + 26, 18, 4, 5);
    } else {
      // キック: バランスのため両腕を広げる
      ctx.fillRect(ox + 0, 18, 4, 16);
      ctx.fillRect(ox + 26, 18, 4, 16);
    }

    // ---- 脚（フレーム別） ----
    ctx.fillStyle = '#f7c8a0';  // 肌（ソックスより上）
    if (frame === 0) {
      ctx.fillRect(ox + 7, 50, 6, 4);
      ctx.fillRect(ox + 17, 50, 6, 4);
    } else if (frame === 1) {
      ctx.fillRect(ox + 5, 48, 6, 6);
      ctx.fillRect(ox + 19, 51, 6, 3);
    } else if (frame === 2) {
      ctx.fillRect(ox + 5, 51, 6, 3);
      ctx.fillRect(ox + 19, 48, 6, 6);
    } else if (frame === 3) {
      // パンチ: 両足自然立ち
      ctx.fillRect(ox + 7, 50, 6, 4);
      ctx.fillRect(ox + 17, 50, 6, 4);
    } else {
      // キック: 右足を前方上方に蹴り上げ
      ctx.fillRect(ox + 7, 50, 6, 4);   // 左足（接地）
      // キック足スカート下から延伸
      ctx.fillStyle = '#1e2e5a';  // スカートの延長
      ctx.fillRect(ox + 3, 44, 10, 8);
      ctx.fillStyle = '#e8edf4';  // 右足ソックス（蹴り足）
      ctx.fillRect(ox + 20, 40, 6, 4);
      ctx.fillStyle = '#f7c8a0';
      ctx.fillRect(ox + 20, 44, 6, 4);
    }

    // ---- 靴 ----
    ctx.fillStyle = '#181020';
    if (frame === 0) {
      ctx.fillRect(ox + 6, 55, 8, 3);
      ctx.fillRect(ox + 16, 55, 8, 3);
    } else if (frame === 1) {
      ctx.fillRect(ox + 4, 53, 8, 3);
      ctx.fillRect(ox + 18, 55, 8, 3);
    } else if (frame === 2) {
      ctx.fillRect(ox + 4, 55, 8, 3);
      ctx.fillRect(ox + 18, 53, 8, 3);
    } else if (frame === 3) {
      ctx.fillRect(ox + 6, 55, 8, 3);
      ctx.fillRect(ox + 16, 55, 8, 3);
    } else {
      // キック: 左足靴のみ（右足は蹴り上げ）
      ctx.fillRect(ox + 6, 55, 8, 3);
      ctx.fillRect(ox + 20, 43, 6, 3);  // 蹴り足の靴
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
      anims.create({ key: 'player_punch', frames: anims.generateFrameNumbers('char_player', { start: 3, end: 3 }), frameRate: 10, repeat: 0 });
      anims.create({ key: 'player_kick',  frames: anims.generateFrameNumbers('char_player', { start: 4, end: 4 }), frameRate: 10, repeat: 0 });
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
