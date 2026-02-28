import Phaser from 'phaser';

/**
 * CharacterTextureFactory
 * Canvas でドット絵風キャラクターテクスチャを生成する。
 * 各キャラタイプのテクスチャを preload/create フェーズで一度だけ作成。
 */
export class CharacterTextureFactory {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 全テクスチャを生成（シーンの create() で呼ぶ） */
  createAll(): void {
    if (!this.scene.textures.exists('char_player')) this.createPlayerTexture();
    if (!this.scene.textures.exists('char_normal')) this.createEnemyTexture('char_normal', 0xd1d5db, 0xb0b4ba);
    if (!this.scene.textures.exists('char_rush'))   this.createEnemyTexture('char_rush',   0x8bb1ff, 0x6080cc);
    if (!this.scene.textures.exists('char_heavy'))  this.createHeavyTexture();
  }

  // ---- プレイヤー: 女子高生風シルエット ----
  private createPlayerTexture(): void {
    const W = 30, H = 58;
    const c = this.makeCanvas('char_player', W, H);
    const ctx = c.context;

    // セーラー服 (紺)
    ctx.fillStyle = '#2a4a8a';
    ctx.fillRect(4, 18, 22, 28);

    // スカート
    ctx.fillStyle = '#3a5aaa';
    ctx.fillRect(3, 38, 24, 14);

    // 脚
    ctx.fillStyle = '#f5cba7';
    ctx.fillRect(7, 52, 6, 6);
    ctx.fillRect(17, 52, 6, 6);

    // 白カラー
    ctx.fillStyle = '#e8edf4';
    ctx.fillRect(9, 18, 12, 6);

    // 頭（肌色）
    ctx.fillStyle = '#f5cba7';
    ctx.fillRect(8, 5, 14, 13);

    // 黒髪
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(6, 2, 18, 8);
    ctx.fillRect(6, 10, 4, 8);
    ctx.fillRect(20, 10, 4, 6);

    // 目
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(11, 10, 3, 2);
    ctx.fillRect(16, 10, 3, 2);

    // 腕
    ctx.fillStyle = '#2a4a8a';
    ctx.fillRect(1, 20, 5, 16);
    ctx.fillRect(24, 20, 5, 16);

    c.refresh();
  }

  // ---- 通常/突進敵: サラリーマン風 ----
  private createEnemyTexture(key: string, coat: number, pants: number): void {
    const W = 28, H = 52;
    const c = this.makeCanvas(key, W, H);
    const ctx = c.context;

    const coatHex = '#' + coat.toString(16).padStart(6, '0');
    const pantsHex = '#' + pants.toString(16).padStart(6, '0');

    // ズボン
    ctx.fillStyle = pantsHex;
    ctx.fillRect(4, 34, 20, 14);

    // 上着
    ctx.fillStyle = coatHex;
    ctx.fillRect(3, 16, 22, 22);

    // Yシャツ
    ctx.fillStyle = '#e8edf4';
    ctx.fillRect(10, 16, 8, 18);

    // 頭
    ctx.fillStyle = '#f0d0b0';
    ctx.fillRect(7, 4, 14, 13);

    // 黒髪
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(5, 2, 18, 7);

    // 目
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(10, 9, 2, 2);
    ctx.fillRect(16, 9, 2, 2);

    // 腕
    ctx.fillStyle = coatHex;
    ctx.fillRect(0, 18, 5, 14);
    ctx.fillRect(23, 18, 5, 14);

    // 脚
    ctx.fillStyle = pantsHex;
    ctx.fillRect(5, 48, 8, 4);
    ctx.fillRect(15, 48, 8, 4);

    c.refresh();
  }

  // ---- 重量敵: ガタイのいいおじさん ----
  private createHeavyTexture(): void {
    const W = 36, H = 60;
    const c = this.makeCanvas('char_heavy', W, H);
    const ctx = c.context;

    // ズボン (濃い赤)
    ctx.fillStyle = '#8a2020';
    ctx.fillRect(5, 38, 26, 18);

    // 体（大きい）
    ctx.fillStyle = '#c04040';
    ctx.fillRect(2, 18, 32, 24);

    // ベルト
    ctx.fillStyle = '#401010';
    ctx.fillRect(2, 36, 32, 4);
    ctx.fillStyle = '#c0a000';
    ctx.fillRect(14, 37, 8, 3);

    // 頭（丸い）
    ctx.fillStyle = '#f0c090';
    ctx.fillRect(9, 3, 18, 16);

    // 薄い髪
    ctx.fillStyle = '#6a5040';
    ctx.fillRect(8, 2, 20, 7);

    // 眉毛（怒り気味）
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(12, 8, 5, 2);
    ctx.fillRect(19, 8, 5, 2);

    // 目
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(12, 11, 3, 3);
    ctx.fillRect(21, 11, 3, 3);

    // 腕（太い）
    ctx.fillStyle = '#c04040';
    ctx.fillRect(0, 20, 6, 20);
    ctx.fillRect(30, 20, 6, 20);

    // 脚
    ctx.fillStyle = '#8a2020';
    ctx.fillRect(6, 52, 10, 8);
    ctx.fillRect(20, 52, 10, 8);

    c.refresh();
  }

  // ---- Canvas ヘルパー ----
  private makeCanvas(key: string, w: number, h: number) {
    const c = this.scene.textures.createCanvas(key, w, h)!;
    c.context.clearRect(0, 0, w, h);
    return c;
  }
}
