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

### A-4 戦闘の意思決定強化（強/弱攻撃の再設計）
- [x] 弱攻撃の役割定義（発生が速い・硬直短い・コンボ始動）
- [x] 強攻撃の役割定義（発生遅い・硬直長い・高威力・ガード/重敵に有効）
- [x] ダメージ/ノックバック/スタン値を数値で分離し、範囲差だけにしない
- [ ] 使い分けが見える演出追加（色・SE・ヒットストップ量・画面揺れ差）
  - [x] ヒット色/画面揺れを弱・強で分離し、視覚フィードバック差を追加（2026-02-27）
  - [x] 弱/強でヒットストップ時間を分離（Light 24ms / Heavy 62ms）して手触り差を追加（2026-02-27）
- [x] 近接弱→強派生、強の空振りリスクで読み合いを成立させる
  - [x] 弱攻撃中に強入力を受け付けるキューを追加し、硬直終わり180ms以内で強派生を自動発火（2026-02-27）
- [ ] バランス検証（弱only/強onlyが最適解にならないことを確認）

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
  - [x] 現行1Scene構成での build 計測を更新し、分割余地が小さいことを確認
- [ ] Phaser依存範囲の最小化（import見直し）
- [x] 主要chunkサイズの計測をREADMEに記録

### D-2 コード品質
- [ ] Scene責務の肥大化検知（200行超の関数分割）
  - [x] `TrainBackgroundRenderer` を新設し `MainScene` から背景描画ロジックを分離
  - [x] 攻撃入力パラメータを `LIGHT_ATTACK` / `HEAVY_ATTACK` 定数へ抽出し重複を削減
  - [x] 敵AIの速度算出を `getEnemyChaseVelocity` に抽出して分岐重複を整理
  - [x] 被弾ノックバック処理を `applyPlayerKnockback` に抽出して `onPlayerHit` を簡素化
  - [x] `update` の再起動判定/システムtick/HiScore永続化を `shouldRestartRun` / `tickSystems` / `persistHiScore` へ分割
  - [x] 敵追従AIを `EnemyAiSystem` に分離し `MainScene` の責務を縮小
  - [x] `MainScene` の被弾まわりマジックナンバー（無敵/ノックバック/色戻し）を定数化（2026-02-27）
  - [x] `setupInput` のキー登録重複を `bindKey` ヘルパーで整理（2026-02-27）
  - [x] `updatePlayerInput` で `player/cursors` を先に束縛し、移動/ジャンプ処理へ引数渡ししてガード重複を削減（2026-02-27）
  - [x] `Enemy` タイプ別ステータスを `ENEMY_SPECS` に集約し三項演算の重複を解消（2026-02-27）
  - [x] `MainScene` のプレイヤー移動/ジャンプ/物理パラメータを定数化してマジックナンバーを削減（2026-02-27）
  - [x] 敵スポーン間隔/物理パラメータのマジックナンバーを定数化し `spawnInitialEnemies` を while で明確化（2026-02-27）
  - [x] `MainScene` の戦闘/物理チューニング定数を `config/gameplay.ts` へ分離し、シーン本体を責務寄りに整理（2026-02-27）
  - [x] プレイヤー当たり判定/地面サイズの定数を `config/gameplay.ts` へ集約しレイアウト値を明示化（2026-02-27）
  - [x] `configurePlayerPhysics` / `configureEnemyPhysics` を抽出して生成処理と物理設定責務を分離（2026-02-27）
  - [x] 初期HPマジックナンバーを `PLAYER_MAX_HP` に抽出し run 状態リセットの重複値を排除（2026-02-27）
  - [x] `CombatSystem` の攻撃/被弾マジックナンバーを定数化してチューニング差分を追いやすくした（2026-02-27）
  - [x] `CombatSystem` のKOノックバック/演出ハードコード値を定数化し、重敵分岐の読みやすさを改善（2026-02-27）
  - [x] `CombatSystem` の攻撃ヒットボックス有効/無効処理を `setHitboxEnabled` に集約し、offscreen退避値の重複を削減（2026-02-27）
  - [x] `CombatSystem` の攻撃プロファイル適用を `applyAttackConfig` に抽出し、設定項目追加時の代入漏れリスクを低減（2026-02-27）
  - [x] 攻撃ヒットボックス初期値を `DEFAULT_ATTACK_STATE` / `ATTACK_HITBOX_DEFAULT_WIDTH` に集約し、初期化マジックナンバーを削減（2026-02-28）
  - [x] `CombatSystem` に `resetHitboxState` を追加し、初期化と `disable` 後の攻撃状態リセット処理を一本化（2026-02-28）
  - [x] `AttackRuntimeProfile` 型を導入し、`resetHitboxState` が不要な `active/recovery/width` ダミー値に依存しないよう整理（2026-02-28）
  - [x] 敵タイプ別KOノックバック値を `ENEMY_KO_PROFILES` に集約し、分岐重複を削減。`disable` 時に攻撃ロックも明示リセット（2026-02-27）
  - [x] ヒットストップ再入時の競合をトークン制御に変更し、短い停止で早期resumeされる不整合を防止（2026-02-27）
  - [x] 強攻撃キューの破棄処理を `clearQueuedHeavy` に集約し、期限切れ/disable 時の状態リセット重複を削減（2026-02-27）
- [x] System間インターフェースを型で固定（`contracts.ts` で Score/Stress の境界を明示）
- [ ] 「未使用状態/定数/関数」除去タスクを毎日生成
  - [x] `UISystem` の未使用プロパティ `infoText` を除去（2026-02-27）

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
