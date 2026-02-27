# Issues

## TF-001: Rリトライ後に操作不能になる
- Status: Fixed (pending deploy verification)
- Reported: 2026-02-27 by sifue
- Symptom:
  - `R`でリトライ後、ゲームが再開しても入力を受け付けない
- Root Cause:
  - `scene.restart()` 後に `MainScene` インスタンス内の `ended` などランタイム状態が残留し、入力更新がスキップされるケースがあった
- Fix:
  - `create()` 冒頭で `resetRunState()` を実行し、`ended/playerHp/facing/player/enemies/combatSystem` を初期化
- Verification:
  - 1) ゲーム開始
  - 2) ゲームオーバーにする
  - 3) `R` を押す
  - 4) 移動・攻撃・ジャンプが再び可能であること
