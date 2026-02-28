# TASK.md - Train Rampage 開発タスク

最終更新: 2026-02-28

## 完了済み ✅

- [x] TypeScript + Phaser.js への移行・OOP設計
- [x] 横スクロールアクション基盤（プレイヤー移動・ジャンプ）
- [x] 強弱攻撃・コンボシステム
- [x] 敵スポーン・AI（追跡/攻撃/硬直）
- [x] スコア・Hi-Score（localStorage永続化）
- [x] ストレスゲージシステム
- [x] スマホ全画面表示（Phaser Scale.FIT）
- [x] スマホタッチコントロール最適化（◀▶↑ | 弱強）
- [x] GitHub Actions デプロイ設定

---

## 優先度: 高 🔴

### T1: BGM・効果音実装（Web Audio API）
- Web Audio API で SE を実装（軽攻撃・強攻撃・被弾・敵撃破）
- BGM ループ（8ビット風シンセ、テンポ 140BPM 程度）
- AudioManager クラスを `src/systems/AudioManager.ts` に作成
- MainScene・CombatSystem から AudioManager を呼び出す

### T2: 音量UIパネル（BGM/SE独立調整）
- 画面内に音量スライダー or ボタン UI（BGM/SE 各 0〜1）
- 設定を localStorage に保存・復元
- スマホ対応（タップで ±10%）

### T3: タイトル画面作成
- `src/scenes/TitleScene.ts` を作成
- タイトルロゴ・PUSH START 点滅
- 操作説明（キーボード / タッチ両対応）
- START ボタン → MainScene 遷移

### T4: エンディング画面改善（ResultScene）
- `src/scenes/ResultScene.ts` を作成
- YOU WIN / GAME OVER を大きく演出（フェードイン）
- スコア・Hi-Score 表示
- タッチ対応「もう一度」「タイトルへ」ボタン

---

## 優先度: 中 🟡

### T5: スコアランキング（Top 5）
- localStorage に上位5件を保存
- ResultScene でランキング表示
- SaveManager クラス `src/core/SaveManager.ts` に整理

### T6: 非常ブレーキゴールとエンディング
- WORLD_WIDTH 末端に「先頭車両」エリアを作成
- ゴールゾーンに触れると非常ブレーキ演出 → YOU WIN
- ゲームクリア専用演出（画面フラッシュ・SE）

### T7: 敵バリエーション追加（3種類に明確化）
- 通常モブ（Normal）: 既存
- 突進モブ（Rush）: 低 HP・高速突進
- 重量モブ（Heavy）: 高 HP・低速・高ダメージ
- 各種のドット絵風 Graphics 描画を差別化

---

## 優先度: 低 🟢

### T8: ドット絵スプライト導入（アニメーション）
- 主人公: 待機/歩行/攻撃/被弾/勝利 アニメーション
- 敵: 3種類それぞれのアニメーション
- TextureManager または 外部ドット絵アセット

### T9: README.md 更新
- 遊び方（PC操作 / スマホ操作）
- デプロイ方法（GitHub Pages）
- スクリーンショット追加

### T10: 中ボス実装（MidBoss）
- 車両の区切りに出現する中ボスキャラ
- 専用 AI（フェーズ移行）
- 撃破で大スコアボーナス

---

## バグ・改善メモ

- [ ] スマホ横向き強制（orientation lock）の実装を検討
- [ ] 攻撃ボタンがゲームオーバー後も反応する（ended フラグ確認済み、要テスト）
- [ ] HUDパネルがスマホ画面の上部を多く占有（コンパクト化を検討）
