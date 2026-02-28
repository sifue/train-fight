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
- [x] T1: BGM・効果音（Web Audio API プロシージャル生成）
- [x] T2: 音量UI（BGM/SE タッチボタン・M/Nキー）
- [x] T3: TitleScene（タイトルロゴ・操作説明・PUSH START）
- [x] T4: ResultScene（YOU WIN/GAME OVER 演出・タッチボタン）
- [x] T5: スコアランキング Top5（SaveManager・localStorage）
- [x] T6: 非常ブレーキゴール・エンディング演出
- [x] T7: 敵バリエーション 3種（normal/rush/heavy + ピクセルアートスプライト）
- [x] T9: README.md 更新（操作方法・デプロイ方法）
- [x] ストレス最大(100%)でゲームオーバー（STRESS OVER 専用画面）
- [x] TitleSceneでBGM開始（autoplay対応）
- [x] スマホ横向き強制（orientation lock）
- [x] ゲームオーバー後のタッチボタン無効化
- [x] HUDパネルのスマホ向けコンパクト化
- [x] ゴール接近演出（フラッシュ・シェイク・フロートテキスト）
- [x] キャラクターピクセルアートスプライト生成
- [x] 漫画風ヒットエフェクト（POW!/BAM!）

---

## 優先度: 低 🟢（残タスク）

### T8: 歩行アニメーション（2フレームサイクル）
- 主人公・敵の歩行を2フレームでアニメーション化
- キャラクターテクスチャに複数フレームを作成
- Phaser アニメーション登録・状態に応じて再生

### T10: 中ボス実装（MidBoss）
- 車両の区切りに出現する中ボスキャラ
- 専用 AI（フェーズ移行）
- 撃破で大スコアボーナス
