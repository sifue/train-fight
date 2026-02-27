# Train Fight - Task Board

更新: 2026-02-27

## 方針
- コア実装（TypeScript/OOP移行）はメインラインで進める
- 影響範囲が少ないクリエイティブ（ドット絵/サウンド）は独立タスクフォースとして並行
- 10分進捗報告で、各トラックの完了/ブロックを短報する

---

## Track A: Core Gameplay / Architecture（メイン）

### A-1 TS移行の土台
- [x] `src/` 構成を作成
- [x] `main.ts` / `GameApp.ts` / `MainScene.ts` 作成
- [x] Vite + TypeScript ビルド導入
- [ ] 既存 `game.js` の最小移植
  - [x] 背景描画 (`drawTrain`) のTS移植
  - [x] プレイヤー移動/ジャンプ + 地面コライダー + カメラ追従
  - [x] 敵/攻撃/スコア/UIテキストの移植

### A-2 OOP分割
- [x] `Player` / `Enemy` 基底クラス分離
  - [x] `Enemy` を `src/entities/Enemy.ts` として分離（スポーン/スコア/被弾パラメータを集約）
  - [x] `Player` 分離
  - [x] `Actor` 基底クラスを追加し共通の色リセット/スタン状態を集約
- [x] `CombatSystem` 分離
- [x] `ScoreSystem` / `StressSystem` 分離
  - [x] `ScoreSystem` を `src/systems/ScoreSystem.ts` として分離（combo/score/hi-score更新を移管）
  - [x] `StressSystem` を `src/systems/StressSystem.ts` として分離（被弾ストレス蓄積/時間減衰/撃破時軽減を移管）
- [x] `UISystem` 分離

### A-3 UX改善
- [x] HUDデザイン刷新
- [x] ミッションカードUI
- [x] GameOver/Win の `R` リトライ実装

---

## Track B: Dot Art Taskforce（並行）

### B-1 主人公（女子高生）
- [ ] コンセプト1枚（シルエット/配色）
- [ ] 32x48 base sprite
- [ ] Idle/Walk(4f)/Attack(3f)/Hit(2f)/Win(4f)
- [ ] JSON atlas化

### B-2 敵モブ
- [ ] Normal / Rush / Heavy の3系統
- [ ] 各 Idle/Walk/Hit/Down
- [ ] 色差分でバリエーション

### B-3 背景アセット
- [ ] つり革/ドア/広告/座席タイル化
- [ ] 窓外スクロール素材

---

## Track C: Audio Taskforce（並行）

### C-1 SE
- [ ] punch_light / punch_heavy / hit / ko / ui_ok / ui_ng
- [ ] 音量正規化（ピーク抑制）

### C-2 BGM
- [ ] Stage loop (90~110 BPM)
- [ ] Result loop
- [ ] ループ境界チェック

### C-3 Audio UI
- [ ] BGM volume slider
- [ ] SE volume slider
- [ ] mute toggle
- [ ] localStorage保存

---

## Track D: Refactoring / Performance Taskforce（継続）

### D-1 Bundle最適化
- [ ] `vite` の `manualChunks` + `dynamic import` 検証
- [ ] Phaser依存範囲の最小化（import見直し）
- [ ] 主要chunkサイズの計測をREADMEに記録

### D-2 コード品質
- [ ] Scene責務の肥大化検知（200行超の関数分割）
- [ ] System間インターフェースを型で固定
- [ ] 「未使用状態/定数/関数」除去タスクを毎日生成

### D-3 運用ルール
- [ ] 10分報告ごとに「新規リファクタ候補」を1件抽出
- [ ] 候補に `優先度(High/Med/Low)` を付与
- [ ] 次コミット前に「今やる/後回し」を明示判断

---

## 今週のマイルストーン

### M1（最優先）
- [x] Vite+TS導入
- [ ] 既存ゲームのTS移植（動作同等）
- [ ] UI整理（最低限）

### M2
- [ ] ドット絵主人公差し替え
- [ ] 基本SE差し替え
- [ ] スコア演出強化

### M3
- [ ] 中ボス追加
- [ ] コンボ分岐
- [ ] 最終バランス
