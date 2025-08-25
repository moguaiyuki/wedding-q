# パフォーマンス最適化

## 概要
60名同時接続、リアルタイム同期、モバイル環境での快適な動作を実現するためのパフォーマンス最適化戦略を定義します。

## パフォーマンス目標

### 数値目標
- **初期表示**: 3秒以内（3G環境）
- **画面遷移**: 500ms以内
- **リアルタイム同期**: 1秒以内
- **Lighthouse スコア**: 90以上（Performance）
- **Core Web Vitals**:
  - LCP: 2.5秒以内
  - FID: 100ms以内
  - CLS: 0.1以内

## フロントエンド最適化

### 1. バンドルサイズ最適化

#### コード分割
```typescript
// 動的インポートによるコード分割
// app/participant/[id]/page.tsx
import dynamic from 'next/dynamic';

// 重いコンポーネントの遅延読み込み
const QRScanner = dynamic(
  () => import('@/components/QRScanner'),
  { 
    loading: () => <div>QRコードスキャナーを読み込み中...</div>,
    ssr: false // クライアントサイドのみ
  }
);

const ChartComponent = dynamic(
  () => import('@/components/ResultChart'),
  { 
    loading: () => <div>グラフを準備中...</div>,
    ssr: false
  }
);

// ルートごとの自動コード分割（Next.js App Router）
// 各ページは自動的に別バンドルになる
```

#### ライブラリの最適化
```javascript
// next.config.js
module.exports = {
  // 不要なロケールを除外
  i18n: {
    locales: ['ja'],
    defaultLocale: 'ja',
  },
  
  // Webpack設定
  webpack: (config, { isServer }) => {
    // moment.jsのロケールを日本語のみに
    config.plugins.push(
      new webpack.ContextReplacementPlugin(
        /moment[/\\]locale$/,
        /ja/
      )
    );
    
    // ツリーシェイキングの最適化
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };
    
    return config;
  },
  
  // SWCによる高速ビルド
  swcMinify: true,
  
  // 画像最適化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

### 2. レンダリング最適化

#### React最適化
```typescript
// メモ化による再レンダリング防止
import { memo, useMemo, useCallback } from 'react';

// 参加者リストコンポーネント
const ParticipantList = memo(({ participants, currentUser }) => {
  // 計算結果のメモ化
  const sortedParticipants = useMemo(
    () => participants.sort((a, b) => b.score - a.score),
    [participants]
  );
  
  // コールバックのメモ化
  const handleClick = useCallback(
    (id: string) => {
      // クリック処理
    },
    []
  );
  
  return (
    <div className="space-y-2">
      {sortedParticipants.map(participant => (
        <ParticipantItem
          key={participant.id}
          participant={participant}
          isCurrentUser={participant.id === currentUser.id}
          onClick={handleClick}
        />
      ))}
    </div>
  );
});

// 仮想スクロール（大量データ表示時）
import { FixedSizeList } from 'react-window';

const VirtualizedList = ({ items, height }) => {
  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ParticipantItem participant={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

#### CSS最適化
```css
/* Critical CSS のインライン化 */
/* app/globals.css - クリティカルな部分 */
:root {
  --primary: #ec4899;
  --background: #ffffff;
  --text: #1f2937;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--background);
  color: var(--text);
}

.container {
  max-width: 100%;
  padding: 1rem;
}

/* GPU アクセラレーション */
.animated-element {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* コンポジットレイヤーの活用 */
.fixed-header {
  position: fixed;
  top: 0;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* アニメーションの最適化 */
@keyframes slideIn {
  from {
    transform: translate3d(100%, 0, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}

/* レイアウトシフトの防止 */
img, video {
  aspect-ratio: attr(width) / attr(height);
  width: 100%;
  height: auto;
}
```

### 3. 画像最適化

```typescript
// 画像の最適化コンポーネント
import Image from 'next/image';

const OptimizedImage = ({ src, alt, priority = false }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      priority={priority} // ファーストビューの画像
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQ..." // プレースホルダー
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
    />
  );
};

// WebP/AVIF の自動生成と配信
// next.config.js で設定済み
```

## バックエンド最適化

### 1. データベース最適化

#### インデックス設計
```sql
-- 頻繁にアクセスされるカラムにインデックス
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_users_qr_code ON users(qr_code);
CREATE INDEX idx_game_state_key ON game_state(key);

-- 複合インデックス（よく一緒に使われるカラム）
CREATE INDEX idx_answers_user_question ON answers(user_id, question_id);

-- 部分インデックス（特定条件のみ）
CREATE INDEX idx_active_questions ON questions(id) 
WHERE is_active = true;
```

#### クエリ最適化
```typescript
// N+1問題の回避
// 悪い例
const users = await supabase.from('users').select('*');
for (const user of users.data) {
  const answers = await supabase
    .from('answers')
    .select('*')
    .eq('user_id', user.id);
  // ...
}

// 良い例（JOIN使用）
const usersWithAnswers = await supabase
  .from('users')
  .select(`
    *,
    answers (
      id,
      question_id,
      choice_id,
      created_at
    )
  `);

// バッチ処理
const batchInsertAnswers = async (answers: Answer[]) => {
  // 一括挿入（トランザクション内）
  const { data, error } = await supabase
    .from('answers')
    .insert(answers);
  
  return { data, error };
};
```

### 2. キャッシング戦略

#### メモリキャッシュ
```typescript
// サーバーサイドキャッシュ
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  
  set(key: string, data: any, ttl: number = 60000) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  // 定期的なクリーンアップ
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expires) {
          this.cache.delete(key);
        }
      }
    }, 60000); // 1分ごと
  }
}

const cache = new MemoryCache();

// 使用例
export async function getQuestions() {
  const cached = cache.get('questions');
  if (cached) return cached;
  
  const { data } = await supabase
    .from('questions')
    .select('*')
    .order('order_num');
  
  cache.set('questions', data, 300000); // 5分キャッシュ
  return data;
}
```

#### クライアントサイドキャッシュ
```typescript
// SWR によるデータフェッチとキャッシュ
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useGameState() {
  const { data, error, mutate } = useSWR(
    '/api/game-state',
    fetcher,
    {
      refreshInterval: 1000, // 1秒ごとに更新
      revalidateOnFocus: true,
      dedupingInterval: 500, // 重複リクエスト防止
    }
  );
  
  return {
    gameState: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}

// ローカルストレージキャッシュ
class LocalCache {
  static set(key: string, data: any, ttl?: number) {
    const item = {
      data,
      expires: ttl ? Date.now() + ttl : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  }
  
  static get(key: string) {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (parsed.expires && Date.now() > parsed.expires) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  }
}
```

### 3. リアルタイム通信の最適化

#### WebSocket接続の管理
```typescript
// 接続プールと再利用
class RealtimeManager {
  private static instance: RealtimeManager;
  private channel: any;
  private subscribers = new Map<string, Set<Function>>();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new RealtimeManager();
    }
    return this.instance;
  }
  
  connect() {
    if (this.channel) return;
    
    this.channel = supabase
      .channel('game_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_state' },
        (payload) => this.broadcast('game_state', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'answers' },
        (payload) => this.broadcast('answers', payload)
      )
      .subscribe();
  }
  
  subscribe(event: string, callback: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);
    
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }
  
  private broadcast(event: string, data: any) {
    this.subscribers.get(event)?.forEach(callback => {
      callback(data);
    });
  }
  
  // デバウンスによる更新頻度制御
  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}
```

## モバイル最適化

### タッチ操作の最適化
```typescript
// パッシブリスナーの使用
useEffect(() => {
  const handleTouchStart = (e: TouchEvent) => {
    // タッチ処理
  };
  
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
  };
}, []);

// タップ遅延の解消
const Button = ({ onClick, children }) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  }, [onClick]);
  
  return (
    <button
      onClick={handleClick}
      className="touch-manipulation" // CSS で touch-action: manipulation
    >
      {children}
    </button>
  );
};
```

### ネットワーク最適化
```typescript
// オフライン対応
class OfflineManager {
  private queue: Array<() => Promise<any>> = [];
  
  constructor() {
    window.addEventListener('online', () => this.processQueue());
  }
  
  async execute(action: () => Promise<any>) {
    if (!navigator.onLine) {
      this.queue.push(action);
      return { error: 'オフラインです' };
    }
    
    try {
      return await action();
    } catch (error) {
      this.queue.push(action);
      throw error;
    }
  }
  
  private async processQueue() {
    while (this.queue.length > 0) {
      const action = this.queue.shift()!;
      try {
        await action();
      } catch {
        // エラー時は再度キューに戻す
        this.queue.unshift(action);
        break;
      }
    }
  }
}
```

## 監視とメトリクス

### パフォーマンス監視
```typescript
// Web Vitals の測定
import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Google Analytics や独自の分析システムに送信
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
getFCP(sendToAnalytics);

// カスタムメトリクス
class PerformanceMonitor {
  static measure(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    console.log(`${name}: ${duration}ms`);
    
    // 閾値を超えた場合は警告
    if (duration > 1000) {
      console.warn(`Slow operation: ${name} took ${duration}ms`);
    }
  }
}
```

## チェックリスト

### デプロイ前の確認
- [ ] Lighthouse スコア 90以上
- [ ] バンドルサイズ分析完了
- [ ] 画像の最適化確認
- [ ] キャッシュ戦略の実装
- [ ] モバイル実機テスト完了
- [ ] 3G環境でのテスト完了
- [ ] 60名同時接続テスト完了