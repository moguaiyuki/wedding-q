# Claude Code カスタムコマンド設定

このプロジェクトでは、Claude Codeで使用できるカスタムコマンド（スラッシュコマンド）が設定されています。

## 使い方

Claude Codeのチャット内で以下のコマンドを入力するだけです：

```
/deploy
```

## 利用可能なコマンド

### デプロイメント

| コマンド | エイリアス | 説明 |
|---------|----------|------|
| `/deploy` | `/d` | 本番環境へのフルデプロイ（ビルド確認付き） |
| `/deploy:quick` | `/dq` | 素早いデプロイ（確認なし） |
| `/deploy:preview` | `/dp` | プレビュー環境へのデプロイ |

### 開発

| コマンド | 説明 |
|---------|------|
| `/dev` | 開発サーバーを起動 |
| `/build` | プロダクションビルドを実行 |
| `/test` | E2Eテストを実行 |

### データベース

| コマンド | 説明 |
|---------|------|
| `/supabase:migrate` | Supabaseマイグレーションを実行 |

### 運用・監視

| コマンド | 説明 |
|---------|------|
| `/logs` | Vercelのログをリアルタイム表示 |
| `/env:list` | 環境変数の一覧表示 |
| `/rollback` | 前のデプロイメントにロールバック |

## コマンドの実行例

```bash
# Claude Codeのチャットで：
User: デプロイして
Assistant: /deploy を実行します...

# または直接：
User: /deploy

# エイリアスも使えます：
User: /dq  # deploy:quickの短縮形
```

## 内部動作

1. Claude Codeがスラッシュコマンドを検出
2. `npm run claude [command]`が実行される
3. `scripts/claude-commands.js`がコマンドを処理
4. 対応するnpmスクリプトまたはCLIコマンドが実行される

## カスタムフック

### Pre-deploy フック
デプロイ前に自動実行：
- Lintチェック
- TypeScriptの型チェック
- ビルドテスト

### Post-deploy フック
デプロイ後に自動実行：
- 成功通知
- デプロイURLの表示

## トラブルシューティング

### コマンドが動作しない場合

1. **権限エラー**
   ```bash
   chmod +x scripts/deploy.sh
   chmod +x scripts/claude-commands.js
   ```

2. **Vercel CLIがインストールされていない**
   ```bash
   npm install -g vercel
   ```

3. **環境変数が設定されていない**
   ```bash
   cp .env.production.example .env.production
   # 必要な値を設定
   ```

## カスタマイズ

新しいコマンドを追加するには：

1. `scripts/claude-commands.js`を編集
2. commandsオブジェクトに新しいコマンドを追加
3. 必要に応じてエイリアスも追加

```javascript
// scripts/claude-commands.js
const commands = {
  // ... 既存のコマンド
  'my-command': {
    command: 'npm run my-script',
    description: 'My custom command'
  }
};
```

## セキュリティ注意事項

- 本番環境へのデプロイコマンドは慎重に使用してください
- 環境変数には機密情報が含まれる可能性があります
- `/rollback`は本番環境に影響するため、実行前に確認してください

## サポート

問題が発生した場合：
1. `scripts/claude-commands.js`のログを確認
2. Vercel CLIが正しくインストールされているか確認
3. プロジェクトのルートディレクトリで実行しているか確認