# アニメーションシステム

## 概要
結婚式クイズアプリにおけるアニメーション戦略とその実装方法を定義します。お祝いの雰囲気を演出しつつ、パフォーマンスとアクセシビリティを両立させます。

## アニメーション原則

### 1. 目的を持ったアニメーション
- **フィードバック**: ユーザーアクションへの即座の反応
- **ガイド**: 視線誘導と操作の流れの明確化
- **演出**: お祝いの雰囲気を高める装飾的効果
- **待機**: ローディング中の体験向上

### 2. パフォーマンス優先
- GPU アクセラレーションの活用
- `transform` と `opacity` のみを使用
- `will-change` の適切な使用
- 60fps の維持

### 3. アクセシビリティ配慮
- `prefers-reduced-motion` への対応
- アニメーションの無効化オプション
- 重要な情報はアニメーションに依存しない

## 基本設定

### CSS変数定義
```css
/* globals.css */
:root {
  /* Duration */
  --animation-duration-instant: 100ms;
  --animation-duration-fast: 200ms;
  --animation-duration-normal: 300ms;
  --animation-duration-slow: 500ms;
  --animation-duration-slower: 800ms;
  
  /* Easing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  /* Delays */
  --animation-delay-none: 0ms;
  --animation-delay-short: 50ms;
  --animation-delay-medium: 100ms;
  --animation-delay-long: 200ms;
  --animation-delay-stagger: 50ms;
}

/* Reduced motion対応 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Tailwind設定
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        // 基本アニメーション
        'fade-in': 'fadeIn var(--animation-duration-normal) var(--ease-out)',
        'fade-out': 'fadeOut var(--animation-duration-normal) var(--ease-in)',
        'slide-in': 'slideIn var(--animation-duration-normal) var(--ease-out)',
        'slide-up': 'slideUp var(--animation-duration-normal) var(--ease-out)',
        'scale-in': 'scaleIn var(--animation-duration-fast) var(--ease-spring)',
        'spin-slow': 'spin 3s linear infinite',
        
        // 特殊効果
        'pulse-slow': 'pulse 3s var(--ease-in-out) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'shake': 'shake 0.5s var(--ease-in-out)',
        'confetti': 'confetti 1s var(--ease-out) forwards',
        'sparkle': 'sparkle 1.5s var(--ease-in-out) infinite',
        
        // ステッガーアニメーション
        'stagger-fade': 'fadeIn var(--animation-duration-normal) var(--ease-out) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
};
```

## React アニメーションフック

### useAnimation フック
```typescript
// hooks/useAnimation.ts
import { useEffect, useRef, useState } from 'react';

interface UseAnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  onComplete?: () => void;
}

export const useAnimation = (
  enabled: boolean,
  options: UseAnimationOptions = {}
) => {
  const {
    duration = 300,
    delay = 0,
    easing = 'ease-out',
    onComplete,
  } = options;
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (enabled && !isAnimating) {
      setIsAnimating(true);
      setIsComplete(false);
      
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setIsComplete(true);
        onComplete?.();
      }, duration + delay);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, duration, delay, onComplete]);
  
  return {
    isAnimating,
    isComplete,
    animationStyles: {
      animationDuration: `${duration}ms`,
      animationDelay: `${delay}ms`,
      animationTimingFunction: easing,
    },
  };
};
```

### useStaggerAnimation フック
```typescript
// hooks/useStaggerAnimation.ts
import { useEffect, useState } from 'react';

export const useStaggerAnimation = (
  items: any[],
  staggerDelay: number = 50
) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    items.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * staggerDelay);
      
      timeouts.push(timeout);
    });
    
    return () => {
      timeouts.forEach(clearTimeout);
      setVisibleItems([]);
    };
  }, [items, staggerDelay]);
  
  return {
    isVisible: (index: number) => visibleItems.includes(index),
    visibleItems,
  };
};
```

## アニメーションコンポーネント

### AnimatedPresence コンポーネント
```tsx
// components/animation/AnimatedPresence.tsx
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedPresenceProps {
  children: React.ReactNode;
  show: boolean;
  animation?: 'fade' | 'slide' | 'scale' | 'slideUp';
  duration?: number;
  className?: string;
}

export const AnimatedPresence = ({
  children,
  show,
  animation = 'fade',
  duration = 300,
  className,
}: AnimatedPresenceProps) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      
      return () => clearTimeout(timeout);
    }
  }, [show, duration]);
  
  if (!shouldRender) return null;
  
  const animations = {
    fade: {
      enter: 'opacity-0',
      enterActive: 'opacity-100',
      exit: 'opacity-100',
      exitActive: 'opacity-0',
    },
    slide: {
      enter: 'translate-x-full',
      enterActive: 'translate-x-0',
      exit: 'translate-x-0',
      exitActive: 'translate-x-full',
    },
    scale: {
      enter: 'scale-95 opacity-0',
      enterActive: 'scale-100 opacity-100',
      exit: 'scale-100 opacity-100',
      exitActive: 'scale-95 opacity-0',
    },
    slideUp: {
      enter: 'translate-y-4 opacity-0',
      enterActive: 'translate-y-0 opacity-100',
      exit: 'translate-y-0 opacity-100',
      exitActive: 'translate-y-4 opacity-0',
    },
  };
  
  const currentAnimation = animations[animation];
  const animationClass = isAnimating
    ? show
      ? currentAnimation.enterActive
      : currentAnimation.exitActive
    : show
    ? currentAnimation.enter
    : currentAnimation.exit;
  
  return (
    <div
      className={cn(
        'transition-all',
        animationClass,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};
```

### CountAnimation コンポーネント
```tsx
// components/animation/CountAnimation.tsx
import { useEffect, useState } from 'react';

interface CountAnimationProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export const CountAnimation = ({
  value,
  duration = 1000,
  format = (v) => v.toString(),
  className,
}: CountAnimationProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = displayValue;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // イージング関数（ease-out-expo）
      const easeOutExpo = progress === 1 
        ? 1 
        : 1 - Math.pow(2, -10 * progress);
      
      const currentValue = Math.floor(
        startValue + (value - startValue) * easeOutExpo
      );
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);
  
  return (
    <span className={className}>
      {format(displayValue)}
    </span>
  );
};
```

### Confetti コンポーネント
```tsx
// components/animation/Confetti.tsx
import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  particleCount?: number;
  duration?: number;
  colors?: string[];
}

export const Confetti = ({
  active,
  particleCount = 50,
  duration = 3000,
  colors = ['#ec4899', '#f472b6', '#fbbf24', '#a78bfa', '#60a5fa'],
}: ConfettiProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    delay: number;
  }>>([]);
  
  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 500,
      }));
      
      setParticles(newParticles);
      
      const timeout = setTimeout(() => {
        setParticles([]);
      }, duration);
      
      return () => clearTimeout(timeout);
    }
  }, [active, particleCount, duration, colors]);
  
  if (!active && particles.length === 0) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
};
```

## ページトランジション

### PageTransition コンポーネント
```tsx
// components/animation/PageTransition.tsx
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'idle' | 'exit'>('idle');
  
  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('exit');
      
      setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
        
        setTimeout(() => {
          setTransitionStage('idle');
        }, 300);
      }, 300);
    }
  }, [children, displayChildren]);
  
  const getTransitionClass = () => {
    switch (transitionStage) {
      case 'enter':
        return 'animate-slide-in opacity-0';
      case 'exit':
        return 'animate-slide-out opacity-100';
      default:
        return 'opacity-100';
    }
  };
  
  return (
    <div className={`transition-all duration-300 ${getTransitionClass()}`}>
      {displayChildren}
    </div>
  );
};
```

## インタラクションアニメーション

### ボタンアニメーション
```css
/* components/ui/Button.module.css */
.button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s var(--ease-out);
  transform: translateZ(0);
}

.button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.button:active::before {
  width: 300px;
  height: 300px;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 5px 10px rgba(236, 72, 153, 0.2);
}

/* Success animation */
.button.success {
  animation: successPulse 0.5s var(--ease-out);
}

@keyframes successPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}
```

### カードホバーアニメーション
```tsx
// components/ui/InteractiveCard.tsx
export const InteractiveCard = ({ children, className, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300',
        'hover:shadow-2xl hover:-translate-y-1',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300',
          'bg-gradient-to-r from-pink-400/20 to-purple-400/20',
          isHovered && 'opacity-100'
        )}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Hover indicator */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500',
          'transition-all duration-300 ease-out',
          isHovered ? 'w-full' : 'w-0'
        )}
      />
    </div>
  );
};
```

## ローディングアニメーション

### スケルトンローダー
```tsx
// components/animation/Skeleton.tsx
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave';
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className,
  animation = 'pulse',
}: SkeletonProps) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
  };
  
  return (
    <div
      className={cn(
        'bg-gray-200',
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
      }}
    >
      {animation === 'wave' && (
        <div className="relative overflow-hidden h-full">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      )}
    </div>
  );
};
```

## パフォーマンス最適化

### GPU アクセラレーション
```css
/* GPU acceleration hints */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Remove will-change after animation */
.animation-complete {
  will-change: auto;
}
```

### アニメーション制御フック
```typescript
// hooks/useAnimationControl.ts
export const useAnimationControl = () => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  useEffect(() => {
    const stored = localStorage.getItem('animations-enabled');
    if (stored !== null) {
      setAnimationsEnabled(stored === 'true');
    } else if (prefersReducedMotion) {
      setAnimationsEnabled(false);
    }
  }, [prefersReducedMotion]);
  
  const toggleAnimations = () => {
    const newValue = !animationsEnabled;
    setAnimationsEnabled(newValue);
    localStorage.setItem('animations-enabled', newValue.toString());
    
    // Apply to document
    document.documentElement.classList.toggle('no-animations', !newValue);
  };
  
  return {
    animationsEnabled,
    prefersReducedMotion,
    toggleAnimations,
  };
};
```

## アニメーション設定UI

```tsx
// components/settings/AnimationSettings.tsx
export const AnimationSettings = () => {
  const { animationsEnabled, toggleAnimations } = useAnimationControl();
  
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div>
        <h3 className="font-semibold">アニメーション設定</h3>
        <p className="text-sm text-gray-600">
          画面の動きやエフェクトの有効/無効を切り替えます
        </p>
      </div>
      <Switch
        checked={animationsEnabled}
        onChange={toggleAnimations}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          animationsEnabled ? 'bg-pink-500' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            animationsEnabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </Switch>
    </div>
  );
};
```