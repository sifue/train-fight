import Phaser from 'phaser';
import { HEIGHT, WIDTH } from './constants';
import { TitleScene } from './scenes/TitleScene';
import { MainScene } from './MainScene';
import { ResultScene } from './scenes/ResultScene';

/** スマホ横向き強制（Screen Orientation API 対応デバイスのみ） */
function tryLockLandscape(): void {
  try {
    const orient = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orient.lock?.('landscape-primary').catch(() => {/* 非対応環境は無視 */});
  } catch {
    // ブラウザが未対応でも無視
  }
}

export function createGameApp(parent = 'game'): Phaser.Game {
  tryLockLandscape();
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#0f1522',
    antialias: true,
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 1500 }, debug: false }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT,
      // フルHD表示（1920×1080）でのテキストにじみ防止:
      // zoom=2 でキャンバスを2倍解像度（1920×1080）で描画し
      // CSS拡縮を最小化してテキスト・グラフィックをシャープに保つ
      zoom: 2,
    },
    scene: [TitleScene, MainScene, ResultScene]
  });
}
