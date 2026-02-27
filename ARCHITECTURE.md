# Train Fight - Architecture (OOP)

## ディレクトリ構成（移行後）

```text
src/
  core/
    GameApp.ts            # Phaser起動・シーン登録
    Config.ts             # 定数・バランス値
    InputManager.ts       # キー入力抽象化
    AudioManager.ts       # BGM/SE/音量管理
    SaveManager.ts        # localStorage（Hi-Score/設定）
  entities/
    Character.ts          # 共通基底（移動/被弾/状態）
    Player.ts             # プレイヤー固有ロジック
    Enemy.ts              # 敵基底
    enemy/
      NormalEnemy.ts
      RushEnemy.ts
      HeavyEnemy.ts
      MidBoss.ts
  systems/
    CombatSystem.ts       # 当たり判定・ダメージ・吹っ飛び
    SpawnSystem.ts        # 敵スポーン管理
    ScoreSystem.ts        # スコア計算
    StressSystem.ts       # 暴走ゲージ管理
    UISystem.ts           # HUD/結果画面
  scenes/
    BootScene.ts
    MainScene.ts
    ResultScene.ts
  assets/
    sprites/
    sfx/
    bgm/
```

## 設計原則
- 単一責務（SRP）
- 状態を列挙型で明示（Idle/Move/Attack/Hit/Down）
- Sceneはオーケストレーションのみ、ロジックはSystemへ
- バランス値はConfigに集約

## 主要クラス責務
- `Player`: 入力から行動状態を決定
- `Enemy`: AI状態遷移（追尾/攻撃/硬直）
- `CombatSystem`: 攻撃解決・ヒットストップ・ノックバック
- `AudioManager`: BGM/SE再生と音量永続化
- `UISystem`: HUD更新、ゲームオーバー時のリトライ導線

## 開発ステップ
1. 現行`game.js`を `MainScene.ts` に分割移植
2. システム分離（Combat/Score/Stress）
3. スプライト・アニメ導入
4. サウンド資産導入
5. バランス調整
