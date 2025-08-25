# 結婚式クイズアプリケーション実装計画

## プロジェクト概要
60名の参加者がスマートフォンを使って新郎新婦に関するクイズに回答する結婚式用エンターテイメントアプリケーション

## フェーズ1: プロジェクト初期設定
1. **Next.js プロジェクトの作成**
   - Next.js 14 (App Router) でプロジェクトを初期化
   - TypeScript、Tailwind CSS を有効化

2. **依存関係のインストール**
   - Supabase クライアント (@supabase/supabase-js, @supabase/auth-helpers-nextjs)
   - QRコード生成 (qrcode)
   - UI コンポーネント (shadcn/ui, lucide-react, radix-ui)
   - ユーティリティ (clsx, tailwind-merge)

3. **環境変数の設定**
   - Supabase接続情報の設定
   - 管理者パスワードの設定

## フェーズ2: Supabaseデータベース構築
1. **テーブル作成**
   - users: 参加者情報（QRコード、グループ所属）
   - questions: クイズ問題（画像対応）
   - choices: 選択肢
   - answers: 回答記録
   - game_state: ゲーム状態管理
   - user_sessions: セッション管理

2. **Row Level Security (RLS) ポリシー設定**
   - 参加者は自分の回答のみ操作可能
   - 管理者は全データ操作可能

## フェーズ3: 基本機能実装
1. **認証システム**
   - 管理者: パスワード認証
   - 参加者: QRコード/ID認証

2. **参加者アプリ (/participant)**
   - QRコード読み取り画面
   - 待機画面
   - クイズ回答画面
   - 結果表示画面

3. **管理者アプリ (/admin)**
   - ログイン画面
   - ダッシュボード
   - 問題管理
   - ゲーム進行管理
   - UNDO機能

4. **プレゼンテーション画面 (/presentation)**
   - 待機画面表示
   - 問題表示
   - リアルタイム集計結果
   - ランキング表示

## フェーズ4: リアルタイム機能実装
1. **Supabase Realtime統合**
   - game_state購読による状態同期
   - answers購読による集計表示
   - 参加者数のリアルタイム表示

2. **接続管理**
   - 自動再接続処理
   - セッション永続化
   - エラーハンドリング

## フェーズ5: UI/UX最適化
1. **モバイル最適化**
   - レスポンシブデザイン
   - タッチ操作最適化
   - 読み込み状態表示

2. **日本語対応**
   - 全UIテキストの日本語化
   - エラーメッセージの日本語化

## フェーズ6: テストとデプロイ
1. **テスト実施**
   - 60人同時接続テスト
   - ネットワーク断線テスト
   - UNDO機能テスト

2. **Vercelデプロイ**
   - 本番環境構築
   - 環境変数設定
   - ドメイン設定

## 実装順序の推奨
1. プロジェクト初期設定とSupabase接続
2. 基本的な画面構造の作成
3. 認証機能の実装
4. クイズの基本機能（問題表示・回答）
5. リアルタイム同期機能
6. 管理機能（UNDO等）
7. UI/UXの洗練
8. テストとデプロイ

## 技術スタック
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database/BaaS**: Supabase (PostgreSQL + Realtime)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Supabase Realtime subscriptions

## ディレクトリ構造
```
src/
├── app/                     # Next.js App Router pages
│   ├── participant/         # Guest-facing pages
│   ├── admin/              # Admin management pages
│   ├── presentation/       # Screen display page
│   └── api/                # API routes
├── components/             # React components
├── lib/                    # Business logic & utilities
└── types/                  # TypeScript definitions
```

## 主要機能
1. **QRコード認証**: 各参加者の座席カードに固有のQRコード
2. **リアルタイム同期**: Supabase Realtimeによる即座の画面更新
3. **接続復元力**: リロード時の状態永続化と再接続対応
4. **UNDO機能**: 管理者による操作の取り消し機能

## コマンド

### プロジェクトセットアップ
```bash
# Create Next.js project
npx create-next-app@latest wedding-quiz-app --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install qrcode @types/qrcode
npm install lucide-react clsx tailwind-merge
npm install @radix-ui/react-slot

# Setup shadcn/ui
npx shadcn-ui@latest init
```

### 開発
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript type checking (if configured)
```

## 環境変数
`.env.local` に必要な設定:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`