# Next.js App Router パターン集

## 概要
結婚式クイズアプリにおける Next.js 14 App Router の実装パターンとベストプラクティスを定義します。

## プロジェクト構造

### ディレクトリ構成
```
src/
├── app/                          # App Router
│   ├── (auth)/                   # 認証グループ
│   │   ├── login/
│   │   └── qr-scan/
│   ├── (public)/                 # 公開ページグループ
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── participant/              # 参加者用ページ
│   │   ├── [id]/                # 動的ルート
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── layout.tsx
│   ├── admin/                    # 管理者用ページ
│   │   ├── dashboard/
│   │   ├── quiz/
│   │   └── layout.tsx
│   ├── presentation/             # プレゼンテーション画面
│   │   └── page.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── quiz/
│   │   └── webhook/
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ホームページ
│   ├── loading.tsx               # グローバルローディング
│   ├── error.tsx                 # エラーバウンダリ
│   ├── not-found.tsx             # 404ページ
│   └── global-error.tsx         # グローバルエラー
├── components/                    # コンポーネント
├── lib/                          # ユーティリティ
├── hooks/                        # カスタムフック
├── types/                        # 型定義
└── styles/                       # スタイル
```

## レイアウトパターン

### ルートレイアウト
```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: {
    default: '結婚式クイズ',
    template: '%s | 結婚式クイズ',
  },
  description: '新郎新婦についてのクイズで盛り上がろう！',
  keywords: ['結婚式', 'クイズ', 'ウェディング', 'パーティー'],
  authors: [{ name: 'Wedding Quiz Team' }],
  creator: 'Wedding Quiz Team',
  publisher: 'Wedding Quiz',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://wedding-quiz.vercel.app'),
  openGraph: {
    title: '結婚式クイズ',
    description: '新郎新婦についてのクイズで盛り上がろう！',
    url: '/',
    siteName: '結婚式クイズ',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '結婚式クイズ',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '結婚式クイズ',
    description: '新郎新婦についてのクイズで盛り上がろう！',
    images: ['/og-image.png'],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### グループレイアウト
```tsx
// app/(public)/layout.tsx
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

### 並列ルート
```tsx
// app/admin/layout.tsx
export default function AdminLayout({
  children,
  sidebar,
  header,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        {header}
      </div>
      <div className="flex">
        <aside className="w-64 min-h-screen bg-white shadow-md">
          {sidebar}
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// app/admin/@sidebar/page.tsx
export default function AdminSidebar() {
  return (
    <nav className="p-4">
      {/* サイドバーコンテンツ */}
    </nav>
  );
}

// app/admin/@header/page.tsx
export default function AdminHeader() {
  return (
    <header className="bg-white shadow-sm">
      {/* ヘッダーコンテンツ */}
    </header>
  );
}
```

## Server Components パターン

### データフェッチング
```tsx
// app/quiz/[id]/page.tsx
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/server';
import { QuizContent } from './quiz-content';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// 静的メタデータ生成
export async function generateMetadata({ params }: PageProps) {
  const supabase = await createServerComponentClient();
  const { data: quiz } = await supabase
    .from('questions')
    .select('question_text')
    .eq('id', params.id)
    .single();

  if (!quiz) {
    return {
      title: 'クイズが見つかりません',
    };
  }

  return {
    title: `問題 ${params.id}: ${quiz.question_text}`,
    description: quiz.question_text,
  };
}

// サーバーコンポーネント
export default async function QuizPage({ params, searchParams }: PageProps) {
  const supabase = await createServerComponentClient();
  
  // データ取得
  const [questionResult, choicesResult] = await Promise.all([
    supabase
      .from('questions')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('choices')
      .select('*')
      .eq('question_id', params.id)
      .order('order_num'),
  ]);

  if (questionResult.error || !questionResult.data) {
    notFound();
  }

  return (
    <QuizContent 
      question={questionResult.data}
      choices={choicesResult.data || []}
      userId={searchParams.userId as string}
    />
  );
}
```

### Streaming SSR
```tsx
// app/leaderboard/page.tsx
import { Suspense } from 'react';
import { LeaderboardSkeleton } from '@/components/skeletons';

// 非同期コンポーネント
async function Leaderboard() {
  const supabase = await createServerComponentClient();
  
  // 重い処理（集計など）
  const { data } = await supabase
    .rpc('calculate_leaderboard')
    .limit(100);

  return (
    <div className="space-y-4">
      {data?.map((user, index) => (
        <LeaderboardItem key={user.id} user={user} rank={index + 1} />
      ))}
    </div>
  );
}

// ページコンポーネント
export default function LeaderboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">ランキング</h1>
      
      {/* Suspense でストリーミング */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <Leaderboard />
      </Suspense>
    </div>
  );
}
```

## Client Components パターン

### インタラクティブコンポーネント
```tsx
// app/participant/[id]/quiz-content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface QuizContentProps {
  question: Question;
  choices: Choice[];
  userId: string;
}

export function QuizContent({ question, choices, userId }: QuizContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question.time_limit);

  // リアルタイム更新を監視
  const { data: gameState } = useRealtimeSubscription({
    table: 'game_state',
    filter: `key=eq.current_state`,
  });

  // タイマー
  useEffect(() => {
    if (timeLeft > 0 && !selectedChoice) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !selectedChoice) {
      handleTimeout();
    }
  }, [timeLeft, selectedChoice]);

  // ゲーム状態の変更を監視
  useEffect(() => {
    if (gameState?.status === 'showing_results') {
      router.push(`/results/${question.id}`);
    }
  }, [gameState, question.id, router]);

  const handleSubmit = async () => {
    if (!selectedChoice || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('answers')
        .insert({
          user_id: userId,
          question_id: question.id,
          choice_id: selectedChoice,
          answered_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: '回答を送信しました',
        description: '結果発表をお待ちください',
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: '回答の送信に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeout = () => {
    toast({
      title: '時間切れ',
      description: '制限時間を過ぎました',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      {/* タイマー表示 */}
      <div className="text-center">
        <div className={`text-4xl font-bold ${
          timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-700'
        }`}>
          {timeLeft}秒
        </div>
      </div>

      {/* 質問 */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4">{question.question_text}</h2>
        
        {question.image_url && (
          <img 
            src={question.image_url} 
            alt="質問画像" 
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}

        {/* 選択肢 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {choices.map((choice) => (
            <Button
              key={choice.id}
              variant={selectedChoice === choice.id ? 'default' : 'outline'}
              size="lg"
              className="w-full justify-start"
              onClick={() => setSelectedChoice(choice.id)}
              disabled={isSubmitting || timeLeft === 0}
            >
              {choice.choice_text}
            </Button>
          ))}
        </div>
      </div>

      {/* 送信ボタン */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedChoice || isSubmitting || timeLeft === 0}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? '送信中...' : '回答を送信'}
      </Button>
    </div>
  );
}
```

## API Routes パターン

### Route Handlers
```typescript
// app/api/auth/qr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { qrCode } = await request.json();
    
    if (!qrCode) {
      return NextResponse.json(
        { error: 'QRコードが必要です' },
        { status: 400 }
      );
    }

    // QRコードのデコードと検証
    const decoded = jwt.verify(
      qrCode,
      process.env.QR_SECRET_KEY!
    ) as { userId: string; eventId: string };

    // Supabase クライアント作成
    const supabase = createRouteHandlerClient({ cookies });

    // ユーザー情報取得
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '無効なQRコードです' },
        { status: 401 }
      );
    }

    // セッション作成
    const sessionToken = jwt.sign(
      { userId: user.id, name: user.name },
      process.env.SESSION_SECRET!,
      { expiresIn: '1d' }
    );

    // レスポンス作成
    const response = NextResponse.json(
      { user, token: sessionToken },
      { status: 200 }
    );

    // Cookie設定
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 1日
    });

    return response;
  } catch (error) {
    console.error('QR authentication error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
```

### Webhook処理
```typescript
// app/api/webhook/supabase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('x-webhook-signature');
  
  // 署名検証
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  const payload = JSON.parse(body);
  
  // イベントタイプによる処理分岐
  switch (payload.type) {
    case 'INSERT':
      await handleInsert(payload);
      break;
    case 'UPDATE':
      await handleUpdate(payload);
      break;
    case 'DELETE':
      await handleDelete(payload);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleInsert(payload: any) {
  // INSERT イベント処理
}

async function handleUpdate(payload: any) {
  // UPDATE イベント処理
}

async function handleDelete(payload: any) {
  // DELETE イベント処理
}
```

## ミドルウェアパターン

### 認証ミドルウェア
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // セッション確認
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 保護されたルートの確認
  const protectedPaths = ['/admin', '/participant'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 管理者ルートの確認
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  // 認証が必要なパスで未認証の場合
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 管理者権限の確認
  if (isAdminPath) {
    const adminPassword = request.cookies.get('admin-password')?.value;
    
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // CSPヘッダー設定
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' wss://*.supabase.co https://*.supabase.co;"
  );

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## エラーハンドリング

### エラーバウンダリ
```tsx
// app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログ送信
    console.error('Application error:', error);
    
    // エラートラッキングサービスに送信
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 mb-6">
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full"
            >
              もう一度試す
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              ホームに戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Not Found ページ
```tsx
// app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ページが見つかりません
        </h1>
        <p className="text-gray-600 mb-6">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link href="/">
          <Button className="w-full max-w-xs">
            ホームに戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

## パフォーマンス最適化

### 動的インポート
```tsx
// components/heavy-component.tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 重いコンポーネントの動的インポート
const ChartComponent = dynamic(
  () => import('@/components/charts/ResultChart'),
  {
    loading: () => <Skeleton className="w-full h-64" />,
    ssr: false, // クライアントサイドのみでレンダリング
  }
);

const QRScanner = dynamic(
  () => import('@/components/qr/Scanner').then(mod => mod.Scanner),
  {
    loading: () => <div>QRスキャナーを読み込み中...</div>,
    ssr: false,
  }
);

export function HeavyComponentWrapper() {
  return (
    <div>
      <ChartComponent />
      <QRScanner />
    </div>
  );
}
```

### 画像最適化
```tsx
// components/optimized-image.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      priority={false}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      className="rounded-lg object-cover"
    />
  );
}
```

### Prefetching
```tsx
// components/navigation.tsx
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      {/* 自動プリフェッチ（デフォルト） */}
      <Link href="/quiz/1">クイズ1</Link>
      
      {/* プリフェッチ無効化 */}
      <Link href="/heavy-page" prefetch={false}>
        重いページ
      </Link>
      
      {/* 手動プリフェッチ */}
      <button
        onClick={() => {
          router.prefetch('/quiz/2');
        }}
      >
        次のクイズを準備
      </button>
    </nav>
  );
}
```