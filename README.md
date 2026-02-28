# RUSH BREAKER（満員電車ランページ）

満員電車のストレスをぶっ飛ばして先頭車両の非常ブレーキを引け！

Phaser.js + TypeScript で作った横スクロール爽快アクション。ブラウザ完結・スマホ対応。

---

## 遊び方

### PC操作

| キー | アクション |
|------|-----------|
| `← →` | 左右移動 |
| `↑` | ジャンプ |
| `Z` | 弱攻撃 |
| `X` | 強攻撃（溜め感あり、隙大） |
| `M` | BGM音量切替 (0→25→50→100%) |
| `N` | SE音量切替 |
| `R` | リトライ（ゲームオーバー後） |

### スマホ操作（横向き推奨）

| ボタン | アクション |
|--------|-----------|
| `◀` | 左移動（左下） |
| `▶` | 右移動（左下） |
| `↑JUMP` | ジャンプ（左上） |
| `弱` | 弱攻撃（右下左） |
| `強` | 強攻撃（右下右） |
| `M♪` / `N🔊` | BGM/SE音量（右上） |

---

## ゲームルール

1. 車両内の敵（通常/突進/重量 3種類）をかき分けて右へ進む
2. 攻撃をヒットさせるとスコアとコンボが増加する
3. 先頭車両（右端の 🚨 エリア）に到達でクリア！
4. HPが0になるとゲームオーバー
5. スコアTop5はローカルに記録される

---

## GitHub Pages でのプレイ

公開URLにアクセスするだけでプレイできます。

### ローカルで動かす

```bash
npm install
npm run dev
# http://localhost:5173/ でプレイ
```

### 本番ビルド

```bash
npm run build   # dist/ に生成
npm run preview # ビルド済みをローカルで確認
```

### GitHub Pages へのデプロイ

`main` ブランチへ push すると GitHub Actions が自動でデプロイします。

1. リポジトリの Settings → Pages を開く
2. Source: `GitHub Actions` を選択
3. Push すると `.github/workflows/` の設定が動作し `gh-pages` ブランチへデプロイ

---

## ファイル構成（主要）

```
src/
  scenes/
    TitleScene.ts     # タイトル画面
    ResultScene.ts    # 結果画面（スコア・ランキング）
  entities/
    Player.ts         # プレイヤー
    Enemy.ts          # 敵（normal/rush/heavy）
  systems/
    AudioManager.ts   # BGM・SE（Web Audio API）
    CombatSystem.ts   # 攻撃・ヒット判定
    ScoreSystem.ts    # スコア・コンボ
    StressSystem.ts   # ストレスゲージ
    UISystem.ts       # HUD表示
  core/
    SaveManager.ts    # localStorage（ランキング保存）
  renderers/
    CharacterTextureFactory.ts  # ドット絵テクスチャ生成
    TrainBackgroundRenderer.ts  # 電車内背景
  MainScene.ts        # メインゲームシーン
  GameApp.ts          # Phaser初期化
```

---

## 技術スタック

- **Phaser 3** (v3.88) - ゲームエンジン
- **TypeScript** - 型安全な開発
- **Vite** - ビルドツール
- **Web Audio API** - プロシージャル BGM/SE（外部ファイル不要）
- **GitHub Actions** - 自動デプロイ

---

## 機能一覧

- [x] 横スクロールベルトアクション
- [x] 3種類の敵（通常 / 突進 / 重量）
- [x] 弱攻撃・強攻撃（コンボチェーン対応）
- [x] BGM・効果音（Web Audio API による合成音）
- [x] BGM/SE 独立音量制御
- [x] タイトル画面 / ゲームオーバー・クリア結果画面
- [x] スコアランキング Top5（localStorage 保存）
- [x] スマホ全画面対応（横向きプレイ推奨）
- [x] マルチタッチ対応タッチコントロール
- [x] 進行度バー（先頭車両までの距離表示）
- [x] 敵HPバー表示
- [x] ピクセルアート風キャラクター
