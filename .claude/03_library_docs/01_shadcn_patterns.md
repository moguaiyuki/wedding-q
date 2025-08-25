# shadcn/ui パターン集

## 概要
結婚式クイズアプリにおける shadcn/ui の活用パターンとカスタマイズ方法を定義します。

## セットアップ

### 初期設定
```bash
# shadcn/ui の初期化
npx shadcn-ui@latest init

# 設定内容
? Would you like to use TypeScript? › Yes
? Which style would you like to use? › Default
? Which color would you like to use as base color? › Slate
? Where is your global CSS file? › app/globals.css
? Would you like to use CSS variables for colors? › Yes
? Where is your tailwind.config.js located? › tailwind.config.js
? Configure the import alias for components? › @/components
? Configure the import alias for utils? › @/lib/utils
```

### コンポーネントのインストール
```bash
# 必要なコンポーネントをインストール
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add alert
```

## カスタマイズパターン

### テーマカスタマイズ
```css
/* app/globals.css */
@layer base {
  :root {
    /* 結婚式テーマカラー */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    
    /* プライマリカラー（ピンク） */
    --primary: 330 81% 60%;
    --primary-foreground: 0 0% 100%;
    
    /* セカンダリカラー（ゴールド） */
    --secondary: 45 93% 47%;
    --secondary-foreground: 0 0% 100%;
    
    /* カードコンポーネント */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    
    /* ボーダー */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    
    /* アクセントカラー */
    --accent: 45 93% 47%;
    --accent-foreground: 0 0% 100%;
    
    /* 状態カラー */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    
    --ring: 330 81% 60%;
    
    --radius: 0.5rem;
  }
}
```

### Button コンポーネントの拡張
```tsx
// components/ui/wedding-button.tsx
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Heart } from 'lucide-react';

interface WeddingButtonProps extends ButtonProps {
  loading?: boolean;
  celebration?: boolean;
  icon?: React.ReactNode;
}

export const WeddingButton = ({
  loading,
  celebration,
  icon,
  children,
  className,
  disabled,
  ...props
}: WeddingButtonProps) => {
  return (
    <Button
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:scale-105 hover:shadow-xl',
        celebration && 'bg-gradient-to-r from-pink-500 to-purple-500',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {icon && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {celebration && (
        <Heart className="absolute -top-1 -right-1 h-4 w-4 text-white animate-pulse" />
      )}
    </Button>
  );
};
```

### Card コンポーネントのバリエーション
```tsx
// components/ui/quiz-card.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuizCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass';
  className?: string;
}

export const QuizCard = ({
  title,
  description,
  children,
  footer,
  variant = 'default',
  className,
}: QuizCardProps) => {
  const variants = {
    default: '',
    gradient: 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200',
    glass: 'bg-white/80 backdrop-blur-sm border-white/20 shadow-xl',
  };

  return (
    <Card className={cn(variants[variant], 'transition-all duration-300', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && (
        <CardFooter className="bg-gray-50/50 border-t">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
```

### Dialog パターン
```tsx
// components/ui/confirmation-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'default',
}: ConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              variant === 'destructive' && 'bg-red-500 hover:bg-red-600'
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

## フォームパターン

### React Hook Form との統合
```tsx
// components/forms/participant-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100, '名前は100文字以内で入力してください'),
  group: z.enum(['bride', 'groom'], {
    required_error: 'グループを選択してください',
  }),
  tableNumber: z.number().min(1).max(20).optional(),
});

type FormData = z.infer<typeof formSchema>;

export const ParticipantForm = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      group: undefined,
      tableNumber: undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>お名前</FormLabel>
              <FormControl>
                <Input placeholder="山田 太郎" {...field} />
              </FormControl>
              <FormDescription>
                フルネームを入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="group"
          render={({ field }) => (
            <FormItem>
              <FormLabel>グループ</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="グループを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bride">新婦側</SelectItem>
                  <SelectItem value="groom">新郎側</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                新郎側・新婦側のどちらかを選択してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tableNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>テーブル番号（任意）</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          登録する
        </Button>
      </form>
    </Form>
  );
};
```

## Toast パターン

### Toast の実装
```tsx
// components/ui/use-wedding-toast.tsx
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const useWeddingToast = () => {
  const { toast } = useToast();

  const success = (message: string, description?: string) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>{message}</span>
        </div>
      ),
      description,
      className: 'border-green-200 bg-green-50',
    });
  };

  const error = (message: string, description?: string) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span>{message}</span>
        </div>
      ),
      description,
      variant: 'destructive',
    });
  };

  const warning = (message: string, description?: string) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <span>{message}</span>
        </div>
      ),
      description,
      className: 'border-yellow-200 bg-yellow-50',
    });
  };

  const info = (message: string, description?: string) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <span>{message}</span>
        </div>
      ),
      description,
      className: 'border-blue-200 bg-blue-50',
    });
  };

  return { success, error, warning, info };
};
```

## Progress パターン

### アニメーション付きプログレスバー
```tsx
// components/ui/animated-progress.tsx
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'gradient' | 'striped';
  className?: string;
}

export const AnimatedProgress = ({
  value,
  max = 100,
  showLabel = false,
  variant = 'default',
  className,
}: AnimatedProgressProps) => {
  const [progress, setProgress] = useState(0);
  const percentage = (value / max) * 100;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-pink-500 to-purple-500';
      case 'striped':
        return 'bg-gradient-to-r from-pink-500 to-purple-500 bg-stripes';
      default:
        return '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span>進捗</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
      )}
      <Progress 
        value={progress} 
        className={cn('h-3', getVariantClasses())}
      />
    </div>
  );
};
```

## Badge パターン

### ステータスバッジ
```tsx
// components/ui/status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'waiting' | 'in_progress' | 'completed' | 'error';
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge = ({ status, children, className }: StatusBadgeProps) => {
  const variants = {
    waiting: 'bg-gray-100 text-gray-700 border-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse',
    completed: 'bg-green-100 text-green-700 border-green-300',
    error: 'bg-red-100 text-red-700 border-red-300',
  };

  const icons = {
    waiting: '⏳',
    in_progress: '🔄',
    completed: '✅',
    error: '❌',
  };

  return (
    <Badge className={cn(variants[status], 'gap-1', className)}>
      <span>{icons[status]}</span>
      {children}
    </Badge>
  );
};
```

## Skeleton パターン

### コンテンツローダー
```tsx
// components/ui/content-loader.tsx
import { Skeleton } from '@/components/ui/skeleton';

export const QuizCardSkeleton = () => {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
};

export const ParticipantListSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
};
```

## Tabs パターン

### クイズ管理タブ
```tsx
// components/admin/quiz-tabs.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Settings, BarChart } from 'lucide-react';

export const QuizManagementTabs = () => {
  return (
    <Tabs defaultValue="participants" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="participants" className="gap-2">
          <Users className="h-4 w-4" />
          参加者
        </TabsTrigger>
        <TabsTrigger value="quiz" className="gap-2">
          <Trophy className="h-4 w-4" />
          クイズ
        </TabsTrigger>
        <TabsTrigger value="results" className="gap-2">
          <BarChart className="h-4 w-4" />
          結果
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="h-4 w-4" />
          設定
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="participants" className="space-y-4">
        {/* 参加者管理コンテンツ */}
      </TabsContent>
      
      <TabsContent value="quiz" className="space-y-4">
        {/* クイズ管理コンテンツ */}
      </TabsContent>
      
      <TabsContent value="results" className="space-y-4">
        {/* 結果表示コンテンツ */}
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-4">
        {/* 設定コンテンツ */}
      </TabsContent>
    </Tabs>
  );
};
```

## ユーティリティ

### cn 関数の活用
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 使用例
<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  {
    'object-syntax': true,
    'another-class': isActive,
  },
  className // props から受け取ったクラス
)} />
```

### カスタムバリアント
```typescript
// lib/variants.ts
import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        wedding: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```