# デプロイガイド

## 🚀 クイックデプロイ

```bash
# 簡単デプロイコマンド
npm run deploy
```

このコマンドで以下が実行されます：
1. ビルドの実行
2. 環境変数の確認
3. Vercelへのデプロイ

## 📋 デプロイ前の準備

### 1. 環境変数の設定

`.env.production`ファイルを作成し、以下の環境変数を設定：

```bash
# .env.production.exampleをコピー
cp .env.production.example .env.production
```

必要な環境変数：
- `NEXT_PUBLIC_SUPABASE_URL` - SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabaseの公開キー
- `SUPABASE_SERVICE_ROLE_KEY` - Supabaseのサービスロールキー（秘密）
- `ADMIN_PASSWORD` - 管理者パスワード
- `NEXT_PUBLIC_APP_URL` - デプロイ後のアプリケーションURL

### 2. Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQLエディタで`supabase/migrations`内のマイグレーションファイルを実行
3. RLSポリシーが適用されていることを確認

### 3. Vercel CLIのインストール

```bash
# グローバルインストール（推奨）
npm install -g vercel

# ローカルインストール
npm install --save-dev vercel
```

## 🎯 デプロイコマンド

### 基本的なデプロイ

```bash
# フルデプロイ（ビルド、環境変数確認、デプロイ）
npm run deploy

# クイックデプロイ（確認なしで即デプロイ）
npm run deploy:quick

# プレビューデプロイ（本番前のテスト用）
npm run deploy:preview
```

### 手動デプロイ

```bash
# 1. ビルド
npm run build

# 2. デプロイ
vercel --prod
```

## 🔧 トラブルシューティング

### ビルドエラー

```bash
# TypeScriptエラーをチェック
npm run typecheck

# Lintエラーをチェック
npm run lint
```

### 環境変数エラー

```bash
# Vercelの環境変数を確認
vercel env ls

# 環境変数を追加
vercel env add VARIABLE_NAME production
```

### デプロイ後のログ確認

```bash
# 最新のログを確認
vercel logs

# リアルタイムログ
vercel logs --follow
```

## 🔄 ロールバック

問題が発生した場合：

```bash
# 前のバージョンにロールバック
vercel rollback

# 特定のデプロイメントにロールバック
vercel rollback [deployment-url]
```

## 📱 デプロイ後の確認事項

1. **機能テスト**
   - [ ] QRコードログイン（TEST001）
   - [ ] 管理者ログイン（/admin）
   - [ ] ニックネーム設定
   - [ ] リアルタイム同期

2. **パフォーマンス**
   - [ ] ページ読み込み速度
   - [ ] モバイル表示
   - [ ] 60人同時接続テスト

3. **セキュリティ**
   - [ ] 環境変数が正しく設定されている
   - [ ] RLSポリシーが有効
   - [ ] HTTPS接続

## 🌐 カスタムドメイン設定

1. Vercelダッシュボードで「Settings」→「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定

```
# Aレコード
A    @    76.76.21.21

# CNAMEレコード
CNAME    www    cname.vercel-dns.com
```

## 📊 モニタリング

- **Vercelダッシュボード**: https://vercel.com/dashboard
- **Supabaseダッシュボード**: https://app.supabase.com
- **エラー監視**: Vercel Analyticsを有効化

## 💡 Tips

- デプロイは`main`ブランチから実行することを推奨
- 本番環境へのデプロイ前に`deploy:preview`でテスト
- 重要な変更後は必ずバックアップを取る
- Supabaseの使用量制限に注意（無料プランの場合）

## 🆘 サポート

問題が発生した場合：
1. [Vercelドキュメント](https://vercel.com/docs)
2. [Supabaseドキュメント](https://supabase.com/docs)
3. プロジェクトのGitHub Issues