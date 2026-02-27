# Train Fight - Task Board

更新: 2026-02-27

## 方針
- コア実装（TypeScript/OOP移行）はメインラインで進める
- 影響範囲が少ないクリエイティブ（ドット絵/サウンド）は独立タスクフォースとして並行
- 10分進捗報告で、各トラックの完了/ブロックを短報する

---

## Track A: Core Gameplay / Architecture（メイン）

### A-1 TS移行の土台
- [ ] `src/` 構成を作成
- [ ] `main.ts` / `GameApp.ts` / `MainScene.ts` 作成
- [ ] Vite + TypeScript ビルド導入
- [ ] 既存 `game.js` の最小移植

### A-2 OOP分割
- [ ] `Player` / `Enemy` 基底クラス分離
- [ ] `CombatSystem` 分離
- [ ] `ScoreSystem` / `StressSystem` 分離
- [ ] `UISystem` 分離

### A-3 UX改善
- [ ] HUDデザイン刷新
- [ ] ミッションカードUI
- [ ] GameOver/Win の `R` リトライ実装

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

## 今週のマイルストーン

### M1（最優先）
- [ ] Vite+TS導入
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
