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
    this.registerAnimations();
  }

  // ---- プレイヤー: 女子高生風 3フレーム(idle, walkA, walkB) ----
  private createPlayerSpritesheet(): void {
    const W = 30, H = 58, FRAMES = 3;
    const c = this.makeMultiFrameCanvas('char_player', W, H, FRAMES);
    const ctx = c.context;

    for (let f = 0; f < FRAMES; f++) {
      this.drawPlayer(ctx, f * W, W, H, f);
    }
    c.refresh();
    this.addFrames('char_player', W, H, FRAMES);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, ox: number, _W: number, _H: number, frame: number): void {
    // セーラー服 (紺)
    ctx.fillStyle = '#2a4a8a';
    ctx.fillRect(ox + 4, 18, 22, 28);

    // スカート
    ctx.fillStyle = '#3a5aaa';
    ctx.fillRect(ox + 3, 38, 24, 14);

    // 白カラー
    ctx.fillStyle = '#e8edf4';
    ctx.fillRect(ox + 9, 18, 12, 6);

    // 頭（肌色）
    ctx.fillStyle = '#f5cba7';
    ctx.fillRect(ox + 8, 5, 14, 13);

    // 黒髪
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(ox + 6, 2, 18, 8);
    ctx.fillRect(ox + 6, 10, 4, 8);
    ctx.fillRect(ox + 20, 10, 4, 6);

    // 目
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(ox + 11, 10, 3, 2);
    ctx.fillRect(ox + 16, 10, 3, 2);

    // 腕（フレームで振り分け）
    ctx.fillStyle = '#2a4a8a';
    if (frame === 1) {
      ctx.fillRect(ox + 1, 22, 5, 14);
      ctx.fillRect(ox + 24, 18, 5, 14);
    } else if (frame === 2) {
      ctx.fillRect(ox + 1, 18, 5, 14);
      ctx.fillRect(ox + 24, 22, 5, 14);
    } else {
      ctx.fillRect(ox + 1, 20, 5, 16);
      ctx.fillRect(ox + 24, 20, 5, 16);
    }

    // 脚
    ctx.fillStyle = '#f5cba7';
    if (frame === 1) {
      ctx.fillRect(ox + 5, 50, 6, 8);
      ctx.fillRect(ox + 17, 53, 7, 5);
    } else if (frame === 2) {
      ctx.fillRect(ox + 6, 53, 7, 5);
      ctx.fillRect(ox + 19, 50, 6, 8);
    } else {
      ctx.fillRect(ox + 7, 52, 6, 6);
      ctx.fillRect(ox + 17, 52, 6, 6);
    }

    // 靴
    ctx.fillStyle = '#2a1a3a';
    if (frame === 1) {
      ctx.fillRect(ox + 4,  57, 8, 2);
      ctx.fillRect(ox + 16, 56, 8, 2);
    } else if (frame === 2) {
      ctx.fillRect(ox + 5,  56, 8, 2);
      ctx.fillRect(ox + 18, 57, 8, 2);
    } else {
      ctx.fillRect(ox + 5,  57, 8, 2);
      ctx.fillRect(ox + 16, 57, 8, 2);
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
      anims.create({ key: 'player_idle', frames: anims.generateFrameNumbers('char_player', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
      anims.create({ key: 'player_walk', frames: anims.generateFrameNumbers('char_player', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
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
