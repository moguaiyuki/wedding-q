# フロントエンド設計書 - 結婚式クイズアプリ

## 1. 設計方針

### 1.1 基本原則

| 原則 | 説明 | 実装方法 |
|------|------|----------|
| **モバイルファースト** | スマートフォン優先設計 | レスポンシブデザイン、タッチ最適化 |
| **リアルタイム同期** | 60名の同時更新 | Supabase Realtime、楽観的UI |
| **アクセシビリティ** | 幅広い年齢層対応 | 大きなタップ領域、明確な視覚フィードバック |
| **パフォーマンス** | 高速レスポンス | Code Splitting、画像最適化、キャッシング |
| **型安全性** | TypeScript厳密モード | 型定義の徹底、型ガード実装 |

### 1.2 ディレクトリ構造

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                # 認証グループ
│   │   └── login/
│   ├── participant/           # 参加者用ページ
│   │   ├── layout.tsx
│   │   ├── waiting/
│   │   ├── quiz/
│   │   ├── result/
│   │   └── ranking/
│   ├── admin/                 # 管理者用ページ
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── control/
│   │   └── users/
│   ├── presentation/          # プレゼン画面
│   ├── api/                   # APIルート
│   └── globals.css
├── components/                 # UIコンポーネント
│   ├── ui/                   # 基本UIコンポーネント
│   ├── quiz/                 # クイズ関連
│   ├── admin/                # 管理画面用
│   └── presentation/         # プレゼン用
├── hooks/                     # カスタムフック
├── lib/                       # ライブラリ
├── stores/                    # 状態管理
├── styles/                    # スタイル定義
├── types/                     # 型定義
└── utils/                     # ユーティリティ
```

## 2. コンポーネント設計

### 2.1 コンポーネント階層

```typescript
// Atomic Designベースの階層構造
// Atoms（原子）
components/
  ui/
    Button.tsx
    Input.tsx
    Card.tsx
    Badge.tsx
    
// Molecules（分子）
components/
  quiz/
    ChoiceButton.tsx
    QuestionCard.tsx
    Timer.tsx
    
// Organisms（生物）
components/
  quiz/
    QuizQuestion.tsx
    RankingList.tsx
    
// Templates（テンプレート）
app/
  participant/
    layout.tsx
    
// Pages（ページ）
app/
  participant/
    quiz/
      page.tsx
```

### 2.2 基本コンポーネント実装

```typescript
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        success: 'bg-green-500 text-white hover:bg-green-600',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4',
        lg: 'h-14 px-6 text-lg',
        xl: 'h-16 px-8 text-xl', // 結婚式用大サイズ
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 2.3 クイズ専用コンポーネント

```typescript
// components/quiz/QuizQuestion.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import type { Question, Choice } from '@/types';

interface QuizQuestionProps {
  question: Question;
  choices: Choice[];
  onAnswer: (choiceId: string) => Promise<void>;
  timeLimit?: number;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  choices,
  onAnswer,
  timeLimit = 30,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { executeWithOptimism, isOptimistic } = useOptimisticUpdate<boolean>();
  
  const handleAnswer = async (choiceId: string) => {
    setSelectedChoice(choiceId);
    
    try {
      await executeWithOptimism(
        true, // 楽観的に送信成功とする
        async () => {
          await onAnswer(choiceId);
          return true;
        },
        false // エラー時は未送信に戻す
      );
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setSelectedChoice(null);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 問題番号 */}
      <div className="text-center mb-4">
        <span className="text-2xl font-bold text-pink-600">
          第{question.orderNumber}問
        </span>
      </div>
      
      {/* 問題文 */}
      <Card className="mb-6 p-6">
        {question.questionImageUrl && (
          <img
            src={question.questionImageUrl}
            alt="問題画像"
            className="w-full rounded-lg mb-4"
          />
        )}
        <p className="text-xl leading-relaxed">{question.questionText}</p>
      </Card>
      
      {/* 選択肢 */}
      <div className="space-y-3">
        <AnimatePresence>
          {choices.map((choice, index) => (
            <motion.div
              key={choice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ChoiceButton
                choice={choice}
                isSelected={selectedChoice === choice.id}
                isDisabled={!!selectedChoice || isOptimistic}
                showResult={showResult}
                onClick={() => handleAnswer(choice.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* 送信状態表示 */}
      {isOptimistic && (
        <div className="mt-4 text-center text-gray-600">
          回答を送信中...
        </div>
      )}
    </div>
  );
};

// components/quiz/ChoiceButton.tsx
interface ChoiceButtonProps {
  choice: Choice;
  isSelected: boolean;
  isDisabled: boolean;
  showResult: boolean;
  onClick: () => void;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  choice,
  isSelected,
  isDisabled,
  showResult,
  onClick,
}) => {
  const getButtonStyle = () => {
    if (showResult && choice.isCorrect) {
      return 'bg-green-100 border-green-500 border-2';
    }
    if (showResult && isSelected && !choice.isCorrect) {
      return 'bg-red-100 border-red-500 border-2';
    }
    if (isSelected) {
      return 'bg-blue-100 border-blue-500 border-2';
    }
    return 'bg-white hover:bg-gray-50 border-gray-300 border';
  };
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'w-full p-6 rounded-xl transition-all transform',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        !isDisabled && 'active:scale-95',
        getButtonStyle()
      )}
    >
      {choice.choiceImageUrl ? (
        <img
          src={choice.choiceImageUrl}
          alt={`選択肢${choice.displayOrder}`}
          className="w-full rounded-lg"
        />
      ) : (
        <span className="text-xl">{choice.choiceText}</span>
      )}
      
      {/* 結果表示 */}
      {showResult && choice.isCorrect && (
        <div className="mt-2 text-green-600 font-bold">
          ✓ 正解
        </div>
      )}
      {showResult && isSelected && !choice.isCorrect && (
        <div className="mt-2 text-red-600 font-bold">
          ✗ 不正解
        </div>
      )}
    </button>
  );
};
```

## 3. 状態管理

### 3.1 Zustand Store実装

```typescript
// stores/gameStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, User } from '@/types';

interface GameStore {
  // State
  gameState: GameState | null;
  currentUser: User | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  hasAnswered: boolean;
  
  // Actions
  setGameState: (state: GameState) => void;
  setCurrentUser: (user: User) => void;
  setConnectionStatus: (status: GameStore['connectionStatus']) => void;
  setHasAnswered: (answered: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        gameState: null,
        currentUser: null,
        connectionStatus: 'disconnected',
        hasAnswered: false,
        
        // Actions
        setGameState: (state) => set({ gameState: state }),
        setCurrentUser: (user) => set({ currentUser: user }),
        setConnectionStatus: (status) => set({ connectionStatus: status }),
        setHasAnswered: (answered) => set({ hasAnswered: answered }),
        reset: () => set({
          gameState: null,
          currentUser: null,
          connectionStatus: 'disconnected',
          hasAnswered: false,
        }),
      }),
      {
        name: 'game-storage',
        partialize: (state) => ({
          currentUser: state.currentUser,
        }),
      }
    )
  )
);

// stores/uiStore.ts
interface UIStore {
  isLoading: boolean;
  error: Error | null;
  notification: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
  
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  showNotification: (type: UIStore['notification']['type'], message: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isLoading: false,
  error: null,
  notification: null,
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  showNotification: (type, message) => {
    set({ notification: { type, message } });
    // 3秒後に自動で消す
    setTimeout(() => {
      set({ notification: null });
    }, 3000);
  },
  clearNotification: () => set({ notification: null }),
}));
```

## 4. カスタムフック

### 4.1 ゲーム関連フック

```typescript
// hooks/useGameState.ts
import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { supabase } from '@/lib/supabase';

export const useGameState = () => {
  const { gameState, setGameState, setConnectionStatus } = useGameStore();
  
  useEffect(() => {
    // 初期状態取得
    const fetchGameState = async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .single();
      
      if (data) {
        setGameState(data);
      }
    };
    
    fetchGameState();
    
    // リアルタイム購読
    const channel = supabase
      .channel('game_state_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state',
      }, (payload) => {
        console.log('Game state updated:', payload);
        setGameState(payload.new as GameState);
      })
      .on('presence', { event: 'sync' }, () => {
        setConnectionStatus('connected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });
    
    return () => {
      channel.unsubscribe();
    };
  }, [setGameState, setConnectionStatus]);
  
  return { gameState };
};

// hooks/useRealtimeConnection.ts
import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  const connect = async () => {
    try {
      setIsConnected(false);
      
      channelRef.current = supabase
        .channel('presence')
        .on('presence', { event: 'sync' }, () => {
          setIsConnected(true);
          setReconnectAttempts(0);
        });
      
      await channelRef.current.subscribe();
      
      // Keep-alive ping
      const pingInterval = setInterval(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ping',
            payload: {},
          });
        }
      }, 30000);
      
      return () => clearInterval(pingInterval);
    } catch (error) {
      console.error('Connection failed:', error);
      handleReconnect();
    }
  };
  
  const handleReconnect = () => {
    if (reconnectAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms...`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        connect();
      }, delay);
    }
  };
  
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);
  
  return { isConnected, reconnectAttempts };
};
```

### 4.2 UIフック

```typescript
// hooks/useResponsive.ts
import { useEffect, useState } from 'react';

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
      setIsDesktop(width >= 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return { isMobile, isTablet, isDesktop };
};

// hooks/useCountdown.ts
import { useEffect, useState, useCallback } from 'react';

export const useCountdown = (initialTime: number = 30) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);
  
  const start = useCallback((time?: number) => {
    setTimeLeft(time ?? initialTime);
    setIsRunning(true);
  }, [initialTime]);
  
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
  }, [initialTime]);
  
  return { timeLeft, isRunning, start, pause, reset };
};

// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    observer.observe(target);
    
    return () => observer.disconnect();
  }, [options]);
  
  return { targetRef, isIntersecting };
};
```

## 5. スタイリング戦略

### 5.1 Tailwind設定

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          pink: '#FFB6C1',
          gold: '#FFD700',
          ivory: '#FFFFF0',
          sage: '#87A96B',
        },
        quiz: {
          correct: '#10B981',
          incorrect: '#EF4444',
          pending: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        serif: ['Noto Serif JP', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 5.2 グローバルスタイル

```css
/* app/globals.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  /* 日本語フォント設定 */
  html {
    font-family: 'Noto Sans JP', sans-serif;
    font-feature-settings: 'palt';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* スクロールバーカスタマイズ */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-gray-100;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }
  
  /* タップハイライト無効化（モバイル） */
  * {
    -webkit-tap-highlight-color: transparent;
  }
}

@layer components {
  /* カードコンポーネント */
  .card {
    @apply bg-white rounded-2xl shadow-lg p-6;
  }
  
  /* グラデーション背景 */
  .gradient-wedding {
    @apply bg-gradient-to-br from-wedding-pink via-wedding-ivory to-wedding-gold;
  }
  
  /* アニメーション付きボタン */
  .btn-animated {
    @apply transform transition-all duration-200 active:scale-95;
  }
  
  /* 正解/不正解表示 */
  .answer-correct {
    @apply bg-green-100 border-2 border-green-500 text-green-800;
  }
  
  .answer-incorrect {
    @apply bg-red-100 border-2 border-red-500 text-red-800;
  }
}

@layer utilities {
  /* セーフエリア対応（iPhone） */
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
  
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  /* テキストグラデーション */
  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500;
  }
  
  /* ローディングアニメーション */
  .loading-dots::after {
    content: '...';
    animation: dots 1.5s steps(4, end) infinite;
  }
  
  @keyframes dots {
    0%, 20% { content: ''; }
    40% { content: '.'; }
    60% { content: '..'; }
    80%, 100% { content: '...'; }
  }
}
```

## 6. パフォーマンス最適化

### 6.1 画像最適化

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  );
};
```

### 6.2 コード分割

```typescript
// app/participant/quiz/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 動的インポート
const QuizQuestion = dynamic(
  () => import('@/components/quiz/QuizQuestion').then(mod => mod.QuizQuestion),
  {
    loading: () => <QuizSkeleton />,
    ssr: false, // クライアントサイドのみ
  }
);

const RankingList = dynamic(
  () => import('@/components/quiz/RankingList'),
  {
    loading: () => <div>ランキング読み込み中...</div>,
  }
);

export default function QuizPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <div className="min-h-screen">
        <QuizQuestion />
        <RankingList />
      </div>
    </Suspense>
  );
}
```

### 6.3 メモ化とパフォーマンス

```typescript
// components/quiz/RankingList.tsx
import { memo, useMemo } from 'react';

interface RankingListProps {
  rankings: RankingEntry[];
  currentUserId?: string;
}

export const RankingList = memo<RankingListProps>(({ rankings, currentUserId }) => {
  // 重い計算をメモ化
  const groupedRankings = useMemo(() => {
    return rankings.reduce((acc, entry) => {
      if (!acc[entry.groupType]) {
        acc[entry.groupType] = [];
      }
      acc[entry.groupType].push(entry);
      return acc;
    }, {} as Record<string, RankingEntry[]>);
  }, [rankings]);
  
  // 仮想スクロール対応（大量データ）
  const virtualizedList = useVirtualizer({
    count: rankings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizedList.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizedList.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <RankingItem
              entry={rankings[virtualItem.index]}
              isCurrentUser={rankings[virtualItem.index].userId === currentUserId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数
  return (
    prevProps.rankings.length === nextProps.rankings.length &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

RankingList.displayName = 'RankingList';
```