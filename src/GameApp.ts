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
    // pixelArt モードを無効化: スケールアップ時にテキストが滲まないよう antialias を有効化
    antialias: true,
    // サブピクセル描画を整数座標に丸めて文字滲みを防止
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 1500 }, debug: false }
    },
    scale: {
      // 画面サイズに合わせてアスペクト比を維持しながら最大拡大
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT,
    },
    // TitleScene → MainScene → ResultScene の順で登録
    // 最初に起動するシーンは配列の先頭
    scene: [TitleScene, MainScene, ResultScene]
  });
}
