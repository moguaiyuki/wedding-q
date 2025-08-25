# 開発環境セットアップガイド - 結婚式クイズアプリ

## 1. 前提条件

### 1.1 必要なソフトウェア

| ソフトウェア | バージョン | 確認コマンド | インストール方法 |
|-------------|-----------|-------------|-----------------|
| Node.js | 18.17.0以上 | `node -v` | [nodejs.org](https://nodejs.org/) |
| npm | 9.0.0以上 | `npm -v` | Node.js同梱 |
| Git | 2.0以上 | `git --version` | [git-scm.com](https://git-scm.com/) |
| VSCode | 最新版 | - | [code.visualstudio.com](https://code.visualstudio.com/) |

### 1.2 推奨VSCode拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "steoates.autoimport",
    "mikestead.dotenv",
    "supermaven.supermaven"
  ]
}
```

## 2. プロジェクトセットアップ

### 2.1 リポジトリクローン

```bash
# リポジトリをクローン
git clone https://github.com/your-org/wedding-quiz-app.git
cd wedding-quiz-app

# ブランチ確認
git branch -a
```

### 2.2 依存関係インストール

```bash
# package.jsonから依存関係をインストール
npm install

# 開発用依存関係も含めてクリーンインストール
npm ci

# 依存関係の脆弱性チェック
npm audit

# 脆弱性の自動修正（可能な場合）
npm audit fix
```

### 2.3 環境変数設定

```bash
# .env.localファイルを作成
cp .env.example .env.local

# エディタで環境変数を設定
code .env.local
```

```env
# .env.local の内容
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 管理者認証
ADMIN_PASSWORD=wedding2024admin

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 開発環境設定
NODE_ENV=development
```

## 3. Supabase設定

### 3.1 Supabaseプロジェクト作成

```bash
# Supabase CLIインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクト初期化
supabase init

# プロジェクトリンク
supabase link --project-ref xxxxxxxxxxxxxxxxxxxxx
```

### 3.2 データベースセットアップ

```bash
# マイグレーションファイル作成
supabase migration new initial_schema

# SQLファイルを編集
code supabase/migrations/20240101000001_initial_schema.sql
```

```sql
-- supabase/migrations/20240101000001_initial_schema.sql
-- ユーザーテーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(20),
    group_type VARCHAR(20) NOT NULL CHECK (
        group_type IN ('新郎友人', '新郎親族', '新婦友人', '新婦親族')
    ),
    qr_code VARCHAR(50) UNIQUE NOT NULL,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 他のテーブル定義...（database_design.mdを参照）
```

```bash
# ローカルDBにマイグレーション適用
supabase db reset

# リモートDBにマイグレーション適用
supabase db push

# 型定義生成
npm run generate-types
```

### 3.3 Supabase Realtime設定

```bash
# Supabaseダッシュボードで設定
# 1. Database > Replication に移動
# 2. 以下のテーブルでRealtimeを有効化：
#    - game_state
#    - answers
#    - users

# ローカルでRealtime確認
supabase status
```

## 4. 開発サーバー起動

### 4.1 Next.js開発サーバー

```bash
# 開発サーバー起動
npm run dev

# ポート指定で起動
npm run dev -- -p 3001

# HTTPSで起動（自己署名証明書）
npm run dev -- --experimental-https

# ターボパックで起動（高速）
npm run dev -- --turbo
```

### 4.2 開発用URL

```bash
# アプリケーションURL
参加者用: http://localhost:3000
管理者用: http://localhost:3000/admin
プレゼン: http://localhost:3000/presentation

# Supabase Studio（ローカル）
http://localhost:54323

# メール確認（Inbucket）
http://localhost:54324
```

## 5. 開発ワークフロー

### 5.1 ブランチ戦略

```bash
# 機能開発用ブランチ作成
git checkout -b feature/quiz-timer

# 開発作業
npm run dev

# コード品質チェック
npm run lint
npm run type-check

# コミット（Conventional Commits）
git add .
git commit -m "feat: クイズタイマー機能を追加"

# プッシュ
git push origin feature/quiz-timer

# プルリクエスト作成
gh pr create --title "クイズタイマー機能の追加" --body "..."
```

### 5.2 コーディング規約

```javascript
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 5.3 Git Hooks設定

```bash
# Huskyインストール
npm install --save-dev husky lint-staged
npx husky install

# pre-commitフック設定
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

## 6. デバッグ設定

### 6.1 VSCodeデバッグ設定

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "- Local:.+(https?://\\S+|[0-9]+)",
        "uriFormat": "http://localhost:3000",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### 6.2 Chrome DevTools設定

```javascript
// lib/debug.ts
export const enableDebugMode = () => {
  if (typeof window !== 'undefined') {
    // React DevTools設定
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: () => {},
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
    };
    
    // デバッグ情報をグローバルに公開
    (window as any).DEBUG = {
      supabase: () => console.log(supabase),
      gameState: () => console.log(gameState),
      clearStorage: () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Storage cleared');
      },
    };
  }
};
```

## 7. テスト環境

### 7.1 テストデータ準備

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  // 参加者データ作成
  const users = [];
  const groups = ['新郎友人', '新郎親族', '新婦友人', '新婦親族'];
  
  for (let i = 1; i <= 60; i++) {
    users.push({
      full_name: `テストユーザー${i}`,
      group_type: groups[i % 4],
      qr_code: `TEST_QR_${i.toString().padStart(3, '0')}`,
      nickname: Math.random() > 0.5 ? `ニックネーム${i}` : null,
    });
  }
  
  const { error: usersError } = await supabase
    .from('users')
    .insert(users);
    
  if (usersError) {
    console.error('Users insert error:', usersError);
    return;
  }
  
  // 問題データ作成
  const questions = [
    {
      order_number: 1,
      question_text: '新郎の出身地はどこ？',
      explanation_text: '新郎は東京都出身です。',
    },
    {
      order_number: 2,
      question_text: '新婦の趣味は？',
      explanation_text: '新婦の趣味は読書です。',
    },
    // ... 他の問題
  ];
  
  for (const question of questions) {
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();
      
    if (questionError) {
      console.error('Question insert error:', questionError);
      continue;
    }
    
    // 選択肢作成
    const choices = [
      { choice_text: '東京', is_correct: true, display_order: 1 },
      { choice_text: '大阪', is_correct: false, display_order: 2 },
      { choice_text: '名古屋', is_correct: false, display_order: 3 },
      { choice_text: '福岡', is_correct: false, display_order: 4 },
    ].map(c => ({ ...c, question_id: questionData.id }));
    
    await supabase.from('choices').insert(choices);
  }
  
  // ゲーム状態初期化
  await supabase.from('game_state').insert({
    status: 'waiting',
    metadata: {},
  });
  
  console.log('Seed completed successfully!');
}

seed().catch(console.error);
```

```bash
# シードデータ投入
npm run seed

# データリセット
npm run reset-db
```

### 7.2 開発用ツール

```typescript
// pages/dev/tools.tsx (開発環境のみ)
export default function DevTools() {
  if (process.env.NODE_ENV !== 'development') {
    return <div>Not available in production</div>;
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">開発ツール</h1>
      
      {/* QRコードシミュレーター */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">QRコードログイン</h2>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 60 }, (_, i) => (
            <button
              key={i}
              onClick={() => loginAsUser(`TEST_QR_${(i + 1).toString().padStart(3, '0')}`)}
              className="p-2 bg-blue-500 text-white rounded"
            >
              User {i + 1}
            </button>
          ))}
        </div>
      </section>
      
      {/* ゲーム状態コントロール */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">ゲーム状態</h2>
        <div className="space-x-2">
          <button onClick={() => setGameState('waiting')}>待機</button>
          <button onClick={() => setGameState('accepting_answers')}>回答受付</button>
          <button onClick={() => setGameState('showing_answer')}>正解発表</button>
        </div>
      </section>
      
      {/* データベース操作 */}
      <section>
        <h2 className="text-xl font-bold mb-4">データベース</h2>
        <button onClick={clearAllAnswers} className="bg-red-500 text-white p-2 rounded">
          全回答削除
        </button>
      </section>
    </div>
  );
}
```

## 8. トラブルシューティング

### 8.1 よくある問題と解決方法

```bash
# 問題: ポート3000が使用中
# 解決方法:
lsof -i :3000
kill -9 <PID>
# または別ポートで起動
npm run dev -- -p 3001

# 問題: Supabase接続エラー
# 解決方法:
# 1. 環境変数確認
cat .env.local | grep SUPABASE
# 2. Supabaseステータス確認
supabase status
# 3. ローカルSupabase再起動
supabase stop
supabase start

# 問題: TypeScriptエラー
# 解決方法:
# 1. 型定義再生成
npm run generate-types
# 2. node_modules再インストール
rm -rf node_modules package-lock.json
npm install
# 3. TypeScriptキャッシュクリア
rm -rf .next
npm run dev

# 問題: ESLintエラー
# 解決方法:
npm run lint -- --fix

# 問題: Git merge conflict
# 解決方法:
git status
# conflictファイルを手動で修正
git add .
git commit -m "resolve: マージコンフリクト解決"
```

### 8.2 デバッグログ設定

```typescript
// lib/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  
  // Supabase専用ログ
  supabase: (operation: string, data: any) => {
    if (isDevelopment) {
      console.log(`[SUPABASE:${operation}]`, data);
    }
  },
  
  // パフォーマンス計測
  measure: (name: string, fn: () => void) => {
    if (isDevelopment) {
      console.time(name);
      fn();
      console.timeEnd(name);
    } else {
      fn();
    }
  },
};
```

## 9. パフォーマンス最適化

### 9.1 ビルド最適化

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 画像最適化
  images: {
    domains: ['xxxxxxxxxxxxxxxxxxxxx.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // バンドル分析
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      );
    }
    return config;
  },
  
  // 実験的機能
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

module.exports = nextConfig;
```

```bash
# バンドル分析実行
ANALYZE=true npm run build

# 本番ビルド
npm run build

# ビルドサイズ確認
npm run analyze
```

### 9.2 開発効率化スクリプト

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "seed": "tsx scripts/seed.ts",
    "reset-db": "supabase db reset",
    "generate-types": "supabase gen types typescript --local > types/supabase.ts",
    "analyze": "ANALYZE=true next build",
    "check-all": "npm run type-check && npm run lint && npm run test",
    "prepare": "husky install"
  }
}
```

## 10. チーム開発ガイドライン

### 10.1 コードレビューチェックリスト

```markdown
## コードレビューチェックリスト

### 機能要件
- [ ] 要件定義書の内容を満たしているか
- [ ] エッジケースを考慮しているか
- [ ] エラーハンドリングが適切か

### コード品質
- [ ] TypeScriptの型定義が適切か
- [ ] 命名規則に従っているか
- [ ] 不要なコメントアウトがないか
- [ ] console.logが残っていないか

### パフォーマンス
- [ ] 不要な再レンダリングがないか
- [ ] 適切にメモ化されているか
- [ ] N+1問題がないか

### セキュリティ
- [ ] XSS対策がされているか
- [ ] SQLインジェクション対策がされているか
- [ ] 認証・認可が適切か

### テスト
- [ ] テストが追加されているか
- [ ] テストカバレッジが十分か
```

### 10.2 デイリー開発フロー

```bash
# 朝の作業開始
git pull origin main
npm install
npm run dev

# 作業中
# - 定期的にコミット
# - テスト実行
# - Lintチェック

# 作業終了前
npm run check-all
git push origin feature/your-branch

# プルリクエスト作成
gh pr create
```