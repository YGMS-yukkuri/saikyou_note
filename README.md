# 僕の考えた最強のノート

間違えた問題を記録し、復習するためのWebアプリケーションです。

## 機能

- **Googleアカウントでログイン**: Firebase OAuthを使用した安全なログイン
- **問題の登録・編集・削除**: 間違えた問題を詳細に記録
- **一覧表示**: 登録日時順、タイトル順、ミス回数順で並び替え可能
- **ランダム出題**: 登録した問題からランダムに出題
- **間違いマーク機能**: 間違えた問題のカウントを記録

## セットアップ

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト設定から、Webアプリを追加
4. Firebase設定情報をコピー

### 2. Firebase設定の更新

`js/firebase-config.js` を開き、Firebase設定情報を更新してください:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firebase Authentication の設定

1. Firebase Console で「Authentication」を選択
2. 「Sign-in method」タブで「Google」を有効化
3. 承認済みドメインにデプロイ先のドメインを追加

### 4. Firestore Database の設定

1. Firebase Console で「Firestore Database」を選択
2. データベースを作成（本番環境モードで開始）
3. ルールを以下のように設定:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### 5. ローカルでの実行

このプロジェクトはシンプルなHTMLファイルで構成されているため、ローカルサーバーで実行できます:

```bash
# Pythonを使用する場合
python -m http.server 8000

# Node.jsのhttp-serverを使用する場合
npx http-server
```

ブラウザで `http://localhost:8000/login.html` にアクセスしてください。

## ファイル構成

```
saikyou_note/
├── css/
│   └── style.css          # 共通スタイルシート
├── js/
│   ├── firebase-config.js # Firebase設定
│   ├── login.js          # ログイン画面用JavaScript
│   ├── list.js           # 一覧画面用JavaScript
│   └── random.js         # ランダム問題画面用JavaScript
├── docs/
│   └── 仕様書.md         # プロジェクト仕様書
├── login.html            # ログイン画面
├── list.html             # 一覧表示画面
├── random.html           # ランダム問題画面
└── README.md             # このファイル
```

## 使い方

### ログイン
1. `login.html` にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントでログイン

### 問題の登録
1. 一覧画面で「新規登録」ボタンをクリック
2. タイトル、問題、解答、解説（任意）を入力
3. 「登録」ボタンをクリック

### 問題の編集・削除
1. 一覧画面で「編集/削除」ボタンをクリック
2. 内容を編集して「保存」または「データを削除...」をクリック

### ランダム出題
1. 一覧画面で「ランダム問題」ボタンをクリック
2. 問題が表示されたら回答を入力
3. 「回答を表示」をクリックして正解と解説を確認
4. 間違えた場合は「間違えたときはここをクリック」ボタンをクリック
5. 「次に進む」で次の問題へ、「一覧に戻る」で一覧画面へ

## 技術スタック

- HTML5
- CSS3
- JavaScript (ES6 Modules)
- Firebase Authentication (OAuth)
- Firebase Firestore

## ライセンス

このプロジェクトは個人用途で作成されています。

## 注意事項

- Firebase Sparkプラン（無料枠）を使用しているため、大量のリクエストには制限があります
- ログイン状態は7日間保持されます
- データはlocalStorageにキャッシュされ、一覧画面表示時にFirestoreと同期されます
