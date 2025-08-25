# コンポーネントデザイン

## 概要
結婚式クイズアプリで使用する全コンポーネントのデザイン仕様とコード例を定義します。

## 基本コンポーネント

### Button コンポーネント

#### デザイン仕様
- 最小高さ: 48px（タッチフレンドリー）
- パディング: 12px 24px
- 角丸: 8px
- トランジション: all 0.2s ease

#### 実装例
```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // ベーススタイル
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        primary: 
          'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg hover:from-pink-600 hover:to-pink-700 focus-visible:ring-pink-500',
        secondary: 
          'bg-white text-pink-600 border-2 border-pink-200 hover:bg-pink-50 focus-visible:ring-pink-500',
        success:
          'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500',
        danger:
          'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        ghost:
          'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = ({
  className,
  variant,
  size,
  fullWidth,
  loading,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner className="mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
```

### Card コンポーネント

#### デザイン仕様
- 角丸: 12px
- 影: 0 4px 6px rgba(0,0,0,0.1)
- パディング: 24px
- 背景: 白
- ボーダー: 1px solid #e5e7eb

#### 実装例
```tsx
// components/ui/Card.tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
}

export const Card = ({
  className,
  variant = 'default',
  interactive = false,
  children,
  ...props
}: CardProps) => {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-transparent border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-200',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all duration-200',
        variants[variant],
        interactive && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// サブコンポーネント
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 pb-4 border-b border-gray-200', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-xl font-semibold text-gray-900', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-gray-700', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-200', className)} {...props} />
);
```

### Input コンポーネント

#### デザイン仕様
- 最小高さ: 48px
- パディング: 12px 16px
- ボーダー: 2px solid
- 角丸: 8px
- フォーカス時: リング表示

#### 実装例
```tsx
// components/ui/Input.tsx
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full min-h-[48px] px-4 py-3 text-base',
              'border-2 rounded-lg transition-all duration-200',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              icon && 'pl-10',
              error
                ? 'border-red-500 bg-red-50 focus:ring-red-500'
                : 'border-gray-300 bg-white focus:border-pink-500 focus:ring-pink-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
```

## 特化型コンポーネント

### QuizCard コンポーネント

#### デザイン仕様
- 質問表示エリア
- 選択肢ボタン（4つ）
- タイマー表示
- アニメーション付き

#### 実装例
```tsx
// components/quiz/QuizCard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Timer } from 'lucide-react';

interface QuizCardProps {
  question: {
    id: number;
    text: string;
    imageUrl?: string;
    choices: Array<{
      id: number;
      text: string;
    }>;
    timeLimit: number;
  };
  onAnswer: (choiceId: number) => void;
  disabled?: boolean;
}

export const QuizCard = ({ question, onAnswer, disabled }: QuizCardProps) => {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, submitted]);

  const handleSubmit = (choiceId: number) => {
    if (disabled || submitted) return;
    
    setSelectedChoice(choiceId);
    setSubmitted(true);
    onAnswer(choiceId);
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-500';
    if (timeLeft <= 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card className="max-w-2xl mx-auto animate-slideIn">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">
            問題 {question.id}
          </CardTitle>
          <div className={cn('flex items-center gap-2 text-lg font-semibold', getTimerColor())}>
            <Timer className="w-5 h-5" />
            <span>{timeLeft}秒</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-xl text-gray-800 font-medium">
          {question.text}
        </div>
        
        {question.imageUrl && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <img
              src={question.imageUrl}
              alt="質問画像"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {question.choices.map((choice, index) => (
            <Button
              key={choice.id}
              variant={selectedChoice === choice.id ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
              disabled={disabled || submitted}
              onClick={() => handleSubmit(choice.id)}
              className={cn(
                'relative overflow-hidden',
                selectedChoice === choice.id && 'ring-2 ring-pink-500 ring-offset-2'
              )}
            >
              <span className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="ml-8">{choice.text}</span>
            </Button>
          ))}
        </div>
        
        {submitted && (
          <div className="text-center text-gray-600 animate-fadeIn">
            回答を送信しました！
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### ParticipantAvatar コンポーネント

#### デザイン仕様
- 円形アバター
- グループ色表示
- ランキング表示対応

#### 実装例
```tsx
// components/participant/ParticipantAvatar.tsx
interface ParticipantAvatarProps {
  name: string;
  group: 'bride' | 'groom';
  rank?: number;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ParticipantAvatar = ({
  name,
  group,
  rank,
  score,
  size = 'md'
}: ParticipantAvatarProps) => {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-xl',
  };

  const groupColors = {
    bride: 'bg-pink-100 text-pink-600 border-pink-300',
    groom: 'bg-blue-100 text-blue-600 border-blue-300',
  };

  const initial = name.charAt(0);

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full border-2 flex items-center justify-center font-bold',
          sizes[size],
          groupColors[group]
        )}
      >
        {initial}
      </div>
      
      {rank && rank <= 3 && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {rank}
        </div>
      )}
      
      {score !== undefined && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {score}点
        </div>
      )}
    </div>
  );
};
```

### ResultChart コンポーネント

#### デザイン仕様
- 棒グラフ表示
- アニメーション付き
- レスポンシブ対応

#### 実装例
```tsx
// components/result/ResultChart.tsx
import { useEffect, useState } from 'react';

interface ResultChartProps {
  choices: Array<{
    id: number;
    text: string;
    count: number;
    isCorrect?: boolean;
  }>;
  totalParticipants: number;
  showAnimation?: boolean;
}

export const ResultChart = ({
  choices,
  totalParticipants,
  showAnimation = true
}: ResultChartProps) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (showAnimation) {
      setTimeout(() => setAnimated(true), 100);
    } else {
      setAnimated(true);
    }
  }, [showAnimation]);

  const maxCount = Math.max(...choices.map(c => c.count));

  return (
    <div className="space-y-4">
      {choices.map((choice, index) => {
        const percentage = totalParticipants > 0 
          ? (choice.count / totalParticipants) * 100 
          : 0;
        const barWidth = maxCount > 0 
          ? (choice.count / maxCount) * 100 
          : 0;

        return (
          <div key={choice.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">
                {String.fromCharCode(65 + index)}. {choice.text}
              </span>
              <span className="text-gray-600">
                {choice.count}人 ({percentage.toFixed(1)}%)
              </span>
            </div>
            
            <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden">
              <div
                className={cn(
                  'absolute left-0 top-0 h-full rounded-lg transition-all duration-1000 ease-out',
                  choice.isCorrect 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                )}
                style={{
                  width: animated ? `${barWidth}%` : '0%',
                  transitionDelay: `${index * 100}ms`
                }}
              >
                {choice.isCorrect && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

### LoadingSpinner コンポーネント

#### デザイン仕様
- 回転アニメーション
- サイズバリエーション
- カスタマイズ可能な色

#### 実装例
```tsx
// components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner = ({
  size = 'md',
  color = 'pink',
  fullScreen = false,
  message
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className={cn('relative', sizes[size])}>
        <div
          className={cn(
            'absolute inset-0 rounded-full border-4 border-gray-200'
          )}
        />
        <div
          className={cn(
            'absolute inset-0 rounded-full border-4 border-t-transparent animate-spin',
            `border-${color}-500`
          )}
        />
      </div>
      {message && (
        <p className="text-gray-600 text-center">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};
```

## レイアウトコンポーネント

### PageLayout コンポーネント

```tsx
// components/layout/PageLayout.tsx
interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const PageLayout = ({
  children,
  header,
  footer,
  maxWidth = 'lg'
}: PageLayoutProps) => {
  const widths = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {header && (
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className={cn('mx-auto px-4 py-4', widths[maxWidth])}>
            {header}
          </div>
        </header>
      )}
      
      <main className={cn('mx-auto px-4 py-8', widths[maxWidth])}>
        {children}
      </main>
      
      {footer && (
        <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
          <div className={cn('mx-auto px-4 py-6', widths[maxWidth])}>
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
};
```

## フィードバックコンポーネント

### Toast コンポーネント

```tsx
// components/ui/Toast.tsx
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}: ToastProps) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const types = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: <CheckCircle />,
    error: <XCircle />,
    warning: <AlertTriangle />,
    info: <Info />,
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 flex items-center gap-3 px-6 py-4 rounded-lg text-white shadow-xl animate-slideUp',
        types[type]
      )}
    >
      {icons[type]}
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 hover:opacity-80 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
```