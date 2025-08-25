# デザイン原則

## 概要
結婚式クイズアプリのデザイン原則を定義します。お祝いの場にふさわしい、エレガントで使いやすいデザインを目指します。

## コアデザイン原則

### 1. 祝福と喜び (Celebration & Joy)
結婚式という特別な日にふさわしい、明るく華やかなデザイン

### 2. 包括性 (Inclusivity)
幅広い年齢層（20代〜80代）が使えるユニバーサルデザイン

### 3. 明瞭性 (Clarity)
会場の照明環境でも見やすく、直感的に操作できる

### 4. 信頼性 (Reliability)
大切な日のイベントを支える、安定したデザイン

## ビジュアルアイデンティティ

### カラーパレット

#### プライマリカラー
```css
:root {
  /* メインカラー（ピンク系） */
  --primary-50: #fdf2f8;
  --primary-100: #fce7f3;
  --primary-200: #fbcfe8;
  --primary-300: #f9a8d4;
  --primary-400: #f472b6;
  --primary-500: #ec4899;  /* メイン */
  --primary-600: #db2777;
  --primary-700: #be185d;
  --primary-800: #9d174d;
  --primary-900: #831843;
  
  /* アクセントカラー（ゴールド系） */
  --accent-50: #fffbeb;
  --accent-100: #fef3c7;
  --accent-200: #fde68a;
  --accent-300: #fcd34d;
  --accent-400: #fbbf24;  /* メイン */
  --accent-500: #f59e0b;
  --accent-600: #d97706;
  --accent-700: #b45309;
  --accent-800: #92400e;
  --accent-900: #78350f;
}
```

#### セマンティックカラー
```css
:root {
  /* 成功・正解 */
  --success-light: #d1fae5;
  --success-main: #10b981;
  --success-dark: #059669;
  
  /* エラー・不正解 */
  --error-light: #fee2e2;
  --error-main: #ef4444;
  --error-dark: #dc2626;
  
  /* 警告・注意 */
  --warning-light: #fef3c7;
  --warning-main: #f59e0b;
  --warning-dark: #d97706;
  
  /* 情報 */
  --info-light: #dbeafe;
  --info-main: #3b82f6;
  --info-dark: #2563eb;
  
  /* 中立色 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### タイポグラフィ

#### フォントファミリー
```css
:root {
  /* 日本語対応フォントスタック */
  --font-sans: -apple-system, BlinkMacSystemFont, "Hiragino Sans",
               "Hiragino Kaku Gothic ProN", "Noto Sans JP", 
               Meiryo, sans-serif;
  
  /* 数字用フォント */
  --font-mono: "SF Mono", Monaco, "Cascadia Code", 
               "Roboto Mono", monospace;
  
  /* 装飾用フォント（オプション） */
  --font-decorative: "Tangerine", "Great Vibes", cursive;
}
```

#### フォントサイズ
```css
:root {
  /* モバイルファースト */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  
  /* レスポンシブ調整 */
  @media (min-width: 768px) {
    --text-base: 1.125rem;  /* 18px on tablet+ */
    --text-lg: 1.25rem;     /* 20px on tablet+ */
    --text-xl: 1.5rem;      /* 24px on tablet+ */
  }
}
```

### スペーシングシステム

```css
:root {
  /* 8px グリッドシステム */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

## コンポーネントデザイン原則

### ボタン
```css
/* プライマリボタン */
.btn-primary {
  /* 大きめのタッチターゲット（最小44px） */
  min-height: 48px;
  padding: var(--space-3) var(--space-6);
  
  /* 視認性の高い色使い */
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  
  /* 触覚フィードバック */
  transition: all 0.2s ease;
  transform: translateY(0);
}

.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 無効状態の明確化 */
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--gray-300);
}
```

### カード
```css
.card {
  /* ソフトな影 */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  /* 優しい角丸 */
  border-radius: 12px;
  
  /* 適切な内部余白 */
  padding: var(--space-6);
  
  /* 背景 */
  background: white;
  border: 1px solid var(--gray-100);
}

/* ホバー効果 */
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
```

### フォーム要素
```css
.input {
  /* アクセシブルなサイズ */
  min-height: 48px;
  padding: var(--space-3) var(--space-4);
  
  /* 明確な境界 */
  border: 2px solid var(--gray-300);
  border-radius: 8px;
  
  /* フォーカス状態 */
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

/* エラー状態 */
.input-error {
  border-color: var(--error-main);
  background-color: var(--error-light);
}
```

## アクセシビリティ

### コントラスト比
```css
/* WCAG AAA 準拠（7:1以上） */
.text-on-primary {
  color: white;  /* #ec4899 に対して 4.5:1 以上 */
}

.text-on-light {
  color: var(--gray-800);  /* 白背景に対して 7:1 以上 */
}
```

### フォーカス表示
```css
/* キーボードフォーカス時のみ表示 */
.focus-visible:focus-visible {
  outline: 3px solid var(--primary-500);
  outline-offset: 2px;
}

/* マウス操作時は非表示 */
.focus-visible:focus:not(:focus-visible) {
  outline: none;
}
```

### 読み上げ対応
```html
<!-- スクリーンリーダー用テキスト -->
<span class="sr-only">回答を選択してください</span>

<!-- ARIA ラベル -->
<button aria-label="次の質問へ進む">
  次へ <ChevronRight />
</button>

<!-- ライブリージョン -->
<div aria-live="polite" aria-atomic="true">
  残り時間: 15秒
</div>
```

## モーション原則

### アニメーション速度
```css
:root {
  /* 高速（マイクロインタラクション） */
  --duration-fast: 150ms;
  
  /* 標準（一般的な遷移） */
  --duration-normal: 250ms;
  
  /* 遅い（ページ遷移など） */
  --duration-slow: 400ms;
  
  /* イージング関数 */
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### アニメーション削減対応
```css
/* prefers-reduced-motion 対応 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## レスポンシブデザイン

### ブレークポイント
```css
:root {
  /* モバイルファースト */
  --screen-sm: 640px;   /* 小型タブレット */
  --screen-md: 768px;   /* タブレット */
  --screen-lg: 1024px;  /* デスクトップ */
  --screen-xl: 1280px;  /* 大画面 */
  --screen-2xl: 1536px; /* プレゼンテーション画面 */
}
```

### グリッドシステム
```css
.container {
  width: 100%;
  padding: 0 var(--space-4);
  margin: 0 auto;
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}
```

## ダークモード対応（オプション）

```css
/* 自動切り替え */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: var(--gray-900);
    --bg-secondary: var(--gray-800);
    --text-primary: var(--gray-100);
    --text-secondary: var(--gray-300);
  }
}

/* 手動切り替え */
[data-theme="dark"] {
  --bg-primary: var(--gray-900);
  --bg-secondary: var(--gray-800);
  --text-primary: var(--gray-100);
  --text-secondary: var(--gray-300);
}
```

## デザイントークン

```typescript
// design-tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#fdf2f8',
      // ...
    },
    semantic: {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    }
  },
  
  typography: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', ...],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      // ...
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    // ...
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  }
};
```