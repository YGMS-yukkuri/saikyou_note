# 最強のノート（saikyou_note）

このリポジトリは「最強のノート」アプリの雛形です。フロントエンドは React + Vite（TypeScript想定）で実装しています。バックエンドは Firebase（Auth + Firestore）を想定しています。

## 開発環境セットアップ

1. Node.js と npm をインストールしてください。
2. リポジトリをクローンして依存関係をインストールします:

```bash
npm install
```

3. .env.example をコピーして `.env` に必要な Firebase の設定を記載してください（Google OAuthの設定をFirebaseコンソールで行ってください）。

```bash
cp .env.example .env
```

4. 開発サーバーを起動します:

```bash
npm run dev
```

## 実装方針（現状）

- Google OAuth のサインインは実装済み（UI ボタンからの呼び出し）。
- Firestore 連携のスケルトン（config）は用意済み。CRUD は次フェーズで実装します。
- ローカルでは `localStorage` の `notes` キーを使って簡易動作確認できます。

## TODO
- Firestore の CRUD 実装（登録・編集・削除・MissCount 更新） ✅
- モーダル（仮想ウインドウ）実装 ✅
- Firestore セキュリティルール追加 ✅ (`firestore.rules` を追加しました)
- ネットワーク再試行・タイムアウト実装 ✅（10秒タイムアウト、最大3回再試行）
- ネットワーク状態を示すバナー表示（`NetworkStatus`） ✅
- テスト・Lint など

## 補足
- Google の OAuth 設定方法や Firebase プロジェクトの作成手順が必要であれば追記します。

## セットアップ詳細 🔧
1. `.env.example` をコピーして `.env` を作成し、Firebase の値を埋めてください。

   cp .env.example .env

2. Firebase コンソールで Google 認証を有効にし、認証ドメインなどを設定してください。

3. Firestore のセキュリティルールは `firestore.rules` を参照し、プロジェクトに取り込んでください。

## ローカルでの開発
- 依存インストール: `npm ci`
- 開発サーバー: `npm run dev`
- テスト: `npm test`
- Lint: `npm run lint`

## GitHub Actions CI
- `/.github/workflows/ci.yml` を追加しました。プッシュ / PR 時に lint / test / build を実行します。

## 注意・運用事項 ⚠️
- Firestore は Spark（無料）プランでの利用を想定しています。読み書き回数に注意してください（特に一覧での頻繁な再取得は避けてください）。
- `.env` などの機密情報は公開リポジトリに直接置かないでください。`.env.example` をテンプレートとして配布してください。