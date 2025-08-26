# デプロイメントガイド

## 前提条件

1. Vercelアカウントの作成
2. Supabaseプロジェクトの作成
3. GitHubリポジトリの準備

## 手順

### 1. Supabaseのセットアップ

#### 1.1 プロジェクト作成
1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. 「New Project」をクリック
3. プロジェクト名とパスワードを設定
4. リージョンを選択（推奨: Tokyo - hnd1）

#### 1.2 データベース構築
```bash
# マイグレーションファイルを順番に実行
npm run supabase:migrate
```

または手動で以下のSQLを実行:
1. `/supabase/migrations/001_initial_schema.sql`
2. `/supabase/migrations/002_add_nickname.sql`
3. `/supabase/migrations/003_add_explanation.sql`

#### 1.3 Storageバケット作成
Supabase Dashboardで:
1. Storage → New bucket
2. 名前: `public`
3. Public bucket: ON

#### 1.4 環境変数の取得
Settings → API から以下を取得:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role secret → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Vercelへのデプロイ

#### 2.1 Vercel CLIを使用する場合
```bash
# Vercel CLIのインストール
npm i -g vercel

# プロジェクトをVercelにリンク
vercel link

# 環境変数を設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ADMIN_PASSWORD
vercel env add NEXT_PUBLIC_APP_URL # https://wedding-q.vercel.app またはカスタムドメイン

# デプロイ
vercel --prod
```

#### 2.2 GitHub連携を使用する場合
1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. 「New Project」→ GitHubリポジトリを選択
3. Environment Variablesに以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_URL` (例: https://wedding-q.vercel.app)
4. 「Deploy」をクリック

### 3. 本番環境の初期設定

#### 3.1 管理者アクセス確認
```
https://your-domain.vercel.app/admin
```
設定した`ADMIN_PASSWORD`でログイン

#### 3.2 参加者登録
1. 管理者ダッシュボード → 参加者管理
2. CSVで一括登録またはひとりずつ登録
3. QRコードを生成（URL形式: `https://wedding-q.vercel.app/participant?qr=XXXX`）
4. QRコードを印刷して座席カードに貼り付け

#### 3.3 問題登録
1. 管理者ダッシュボード → 問題管理
2. 問題を順番に登録
3. 画像がある場合はアップロード

### 4. 動作確認

#### 4.1 接続テスト
```bash
# Playwrightでのテスト
npm run test:e2e
```

#### 4.2 手動確認
- [ ] 管理者ログイン
- [ ] 参加者QRコード認証
- [ ] リアルタイム同期
- [ ] クイズ回答送信
- [ ] 結果集計表示
- [ ] UNDO機能

### 5. 当日の運用

#### 5.1 事前準備
- QRコードカードを座席に配置
- プレゼンテーション画面をプロジェクターに接続
- WiFi接続を確認

#### 5.2 リハーサル
1. データ管理 → 回答データをクリア
2. テスト回答を実施
3. 正常動作を確認
4. 本番前に再度クリア

#### 5.3 トラブルシューティング

**接続できない場合:**
- WiFiパスワードを確認
- QRコードが正しく読み取れているか確認
  - QRコードを読み取ると自動的にURLに移動し、ログインされる
  - 手動入力の場合は、QRコードのID部分だけを入力
- ブラウザのキャッシュをクリア

**画面が更新されない場合:**
- ページをリロード
- ネットワーク状態を確認
- Supabaseのステータスを確認

**エラーが発生した場合:**
- 管理者画面でUNDO操作
- 最悪の場合、データをクリアして再開

## セキュリティ考慮事項

1. **管理者パスワード**
   - 必ず強力なパスワードを使用
   - 定期的に変更

2. **環境変数**
   - 本番環境の値を公開しない
   - service_role_keyは特に注意

3. **アクセス制御**
   - 管理者機能は認証必須
   - 参加者は自分の回答のみ操作可能

## パフォーマンス最適化

1. **画像最適化**
   - 画像は5MB以下に圧縮
   - WebP形式を推奨

2. **同時接続数**
   - 60名程度は問題なし
   - それ以上の場合はSupabaseプランのアップグレードを検討

3. **キャッシュ設定**
   - 静的アセットはCDNでキャッシュ
   - APIレスポンスはno-cache

## 監視とログ

1. **Vercel Analytics**
   - Real-time analyticsを有効化
   - Core Web Vitalsを監視

2. **Supabaseログ**
   - Database → Logsで確認
   - エラー発生時の調査に使用

3. **エラー通知**
   - Sentryなどのエラー監視サービスの導入を推奨

## バックアップ

1. **データベース**
   - Supabase Dashboardから手動バックアップ
   - 本番前と本番後に実施

2. **参加者データ**
   - CSVエクスポート機能を使用
   - イベント終了後に保存

## お問い合わせ

技術的な問題が発生した場合の連絡先:
- プロジェクト管理者
- Supabaseサポート
- Vercelサポート