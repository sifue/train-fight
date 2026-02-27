# RUSH BREAKER（満員電車ランページ）

Phaser.js だけで作った、静的ホスティング対応の横スクロール爽快アクションです。

> コンセプト: 「満員電車ストレスの擬人化をぶっ飛ばし、先頭車両で非常ブレーキを引く」

## プレイ

- `index.html` をブラウザで開く
- もしくはローカルサーバー:

```bash
cd train-rampage
python3 -m http.server 8080
# http://localhost:8080
```

## 操作

- `← →` 移動
- `↑` ジャンプ
- `Z` 通常攻撃
- `X` 強攻撃
- `C` ダッシュ
- `Shift` ラン（微加速）
- `E` 非常ブレーキ（先頭車両で条件を満たすと成功）

## クリア条件

1. 先頭車両（右端）まで進む
2. 暴走ゲージを 70% 未満に抑える（敵を倒してゲージ上昇を抑制）
3. `E` で非常ブレーキ

## GitHub Pages 公開手順

1. 新規リポジトリ作成（例: `rush-breaker`）
2. この `train-rampage/` の中身をルートに push
3. GitHub Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: `main` / `/root`
4. 数分待つと `https://<account>.github.io/rush-breaker/` で公開

## ボットアカウントに必要な権限（最小）

GitHubの"machine user"（ボット用ユーザー）を作る場合:

### パターンA: Classic Personal Access Token（簡単）
- `repo`（privateにもpushするなら）
- publicだけなら `public_repo` だけでも可
- `workflow`（GitHub Actionsを使うなら）

### パターンB: Fine-grained PAT（推奨）
対象リポジトリ限定 + 以下権限:
- Repository permissions
  - `Contents: Read and write`（pushに必須）
  - `Metadata: Read`（自動で付与）
  - `Actions: Read and write`（Actions使うなら）
  - `Pages: Read and write`（APIでPages制御するなら）

### 運用上の推奨
- ボットをあなたの個人Org/repoに **Collaborator (Write)** で招待
- トークン有効期限は短め（30〜90日）
- 2FA必須
- トークンはGitHub Secretsで保管

## ファイル構成

- `index.html` ... エントリ
- `style.css` ... UI/表示
- `game.js` ... ゲームロジック（Phaser）

## Phase2 で追加済み

- 敵タイプ追加（通常 / heavy / rush）
- コンボ表示とコンボ持続タイマー
- ダッシュ操作（C）
- 車両感の背景演出強化（吊り革・区画・ドア・広告）
- 撃破時の吹っ飛び演出を強化
- 難易度を緩和（HP増加、敵密度と圧を調整）

## 今後の拡張案（Phase3+）

- 本格ドット絵スプライト（Aseprite）
- 車両ごとの固有ギミック（ドア、押し戻し風）
- 掴み・投げ・エリア必殺
- BGMループとSE素材差し替え
- ステージ2（ホーム→運転席）
