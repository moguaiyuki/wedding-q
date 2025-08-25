# 結婚式クイズアプリ 技術仕様書

## 技術スタック

### コア技術
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース/BaaS**: Supabase
- **デプロイ**: Vercel
- **スタイリング**: Tailwind CSS + shadcn/ui

### 詳細仕様

#### 1. Next.js設定
- **バージョン**: 14.x (App Router使用)
- **TypeScript**: 厳密な型定義を使用
- **API Routes**: バックエンドAPIの実装に使用
- **環境変数**: 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_PASSWORD`

#### 2. Supabase設定
- **データベース**: PostgreSQL
- **リアルタイム機能**: Realtime subscriptionを使用
  - 参加者画面の自動更新
  - ゲーム状態の同期
- **認証**: 
  - 管理者：カスタム認証（環境変数でパスワード管理）
  - 参加者：匿名認証またはカスタムトークン
- **ストレージ**: 問題・解説画像の保存

#### 3. データベース設計

```sql
-- 参加者テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(20),
  group_type VARCHAR(20) NOT NULL CHECK (group_type IN ('新郎友人', '新郎親族', '新婦友人', '新婦親族')),
  qr_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 問題テーブル
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  explanation_text TEXT,
  explanation_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 選択肢テーブル
CREATE TABLE choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  choice_text TEXT,
  choice_image_url TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 回答テーブル
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  question_id UUID REFERENCES questions(id),
  choice_id UUID REFERENCES choices(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- ゲーム状態テーブル
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_question_id UUID REFERENCES questions(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'question_display', 'accepting_answers', 'closed', 'showing_answer', 'showing_ranking', 'finished')),
  last_action VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- セッション管理テーブル
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  qr_code VARCHAR(50) NOT NULL,
  session_token VARCHAR(100) UNIQUE NOT NULL,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Supabase Realtime設定
```typescript
// リアルタイム購読の設定例
const gameStateSubscription = supabase
  .channel('game_state_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'game_state'
  }, handleGameStateChange)
  .subscribe();

const answersSubscription = supabase
  .channel('answers_changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'answers'
  }, handleNewAnswer)
  .subscribe();
```

#### 5. プロジェクト構造
```
src/
├── app/
│   ├── page.tsx                 # トップページ（QRコード読み取り）
│   ├── participant/
│   │   ├── login/page.tsx       # 参加者ログイン
│   │   ├── quiz/page.tsx        # クイズ画面
│   │   └── ranking/page.tsx     # ランキング画面
│   ├── admin/
│   │   ├── login/page.tsx       # 管理者ログイン
│   │   ├── dashboard/page.tsx   # 管理ダッシュボード
│   │   ├── users/page.tsx       # 参加者管理
│   │   ├── questions/page.tsx   # 問題管理
│   │   └── control/page.tsx     # クイズ進行管理
│   ├── presentation/page.tsx    # プレゼンテーション画面
│   └── api/
│       ├── auth/route.ts        # 認証API
│       ├── quiz/route.ts        # クイズ操作API
│       └── reset/route.ts       # データリセットAPI
├── components/
│   ├── participant/             # 参加者用コンポーネント
│   ├── admin/                   # 管理者用コンポーネント
│   └── presentation/            # プレゼン用コンポーネント
├── lib/
│   ├── supabase.ts             # Supabaseクライアント
│   ├── auth.ts                 # 認証ロジック
│   └── quiz-logic.ts           # クイズロジック
└── types/
    └── index.ts                 # TypeScript型定義
```

#### 6. 認証フロー

**管理者認証**:
1. パスワード入力（環境変数と照合）
2. JWTトークン生成
3. Cookieに保存

**参加者認証**:
1. QRコードまたはID入力
2. usersテーブルと照合
3. セッショントークン生成
4. user_sessionsテーブルに保存

#### 7. QRコード/ID対応
```typescript
// 参加者ログイン処理
async function participantLogin(input: string) {
  // QRコードまたは直接ID入力に対応
  const user = await supabase
    .from('users')
    .select('*')
    .eq('qr_code', input)
    .single();
    
  if (!user) {
    throw new Error('無効なQRコードまたはIDです');
  }
  
  // セッション作成
  const sessionToken = generateSessionToken();
  await supabase
    .from('user_sessions')
    .insert({
      user_id: user.id,
      qr_code: input,
      session_token: sessionToken
    });
    
  return { user, sessionToken };
}
```

#### 8. デプロイ設定

**Vercel設定**:
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- 環境変数設定（Vercelダッシュボードで設定）

**Supabase設定**:
1. プロジェクト作成
2. データベーススキーマ作成（上記SQL実行）
3. Row Level Security (RLS) 設定
4. Realtime設定有効化

#### 9. 開発環境セットアップ手順
```bash
# プロジェクト作成
npx create-next-app@latest wedding-quiz-app --typescript --tailwind --app

# 依存関係インストール
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install qrcode
npm install @types/qrcode
npm install lucide-react
npm install clsx tailwind-merge
npm install @radix-ui/react-slot

# shadcn/ui セットアップ
npx shadcn-ui@latest init
```

#### 10. 環境変数テンプレート (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin
ADMIN_PASSWORD=your_secure_admin_password

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 実装上の注意事項

1. **リアルタイム同期**: Supabase Realtimeを使用して、管理者の操作が即座に全参加者に反映されるようにする

2. **エラーハンドリング**: ネットワークエラーや一時的な切断に対して適切に対処

3. **パフォーマンス**: 
   - 画像は事前に最適化
   - Supabase Storageの画像URLは直接参照

4. **セキュリティ**:
   - Row Level Security (RLS) を適切に設定
   - 管理者APIには認証チェックを実装

5. **ユーザビリティ**:
   - レスポンシブデザイン必須
   - ローディング状態を明確に表示
   - エラーメッセージは日本語で分かりやすく