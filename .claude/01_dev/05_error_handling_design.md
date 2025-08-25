# エラーハンドリング設計書 - 結婚式クイズアプリ

## 1. エラー分類と対応方針

### 1.1 エラーカテゴリ

| カテゴリ | 説明 | 重要度 | 対応方針 |
|---------|------|--------|----------|
| **ネットワークエラー** | 通信断絶、タイムアウト | 高 | 自動リトライ、オフライン表示 |
| **認証エラー** | セッション切れ、権限不足 | 中 | 再ログイン誘導 |
| **バリデーションエラー** | 入力値不正 | 低 | 即座にフィードバック |
| **競合エラー** | 重複回答、状態不整合 | 中 | 明確なメッセージ表示 |
| **システムエラー** | サーバーエラー、予期せぬエラー | 高 | フォールバック画面、ログ記録 |

### 1.2 エラーコード体系

```typescript
// エラーコード定義（結婚式クイズ特化）
enum ErrorCode {
  // ネットワーク系 (1xxx)
  NETWORK_ERROR = 1000,
  TIMEOUT = 1001,
  OFFLINE = 1002,
  WEBSOCKET_DISCONNECTED = 1003,
  
  // 認証系 (2xxx)
  INVALID_QR_CODE = 2000,
  SESSION_EXPIRED = 2001,
  UNAUTHORIZED = 2002,
  ADMIN_AUTH_FAILED = 2003,
  
  // クイズ系 (3xxx)
  ALREADY_ANSWERED = 3000,
  QUIZ_NOT_STARTED = 3001,
  ANSWER_CLOSED = 3002,
  INVALID_QUESTION_STATE = 3003,
  
  // バリデーション系 (4xxx)
  NICKNAME_TOO_LONG = 4000,
  NICKNAME_INVALID_CHARS = 4001,
  NICKNAME_DUPLICATE = 4002,
  INVALID_INPUT = 4003,
  
  // システム系 (5xxx)
  DATABASE_ERROR = 5000,
  INTERNAL_ERROR = 5001,
  SERVICE_UNAVAILABLE = 5002,
  RATE_LIMIT_EXCEEDED = 5003
}
```

## 2. クライアントサイドエラーハンドリング

### 2.1 グローバルエラーハンドラー

```typescript
// lib/error-handler.ts
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public userMessage: string,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// エラーハンドリングフック
export const useErrorHandler = () => {
  const [error, setError] = useState<AppError | null>(null);
  const router = useRouter();
  
  const handleError = useCallback((error: any) => {
    console.error('Error occurred:', error);
    
    // AppErrorインスタンスの場合
    if (error instanceof AppError) {
      setError(error);
      
      // 認証エラーの場合はログイン画面へ
      if (error.code === ErrorCode.SESSION_EXPIRED) {
        router.push('/participant/login');
      }
      
      return;
    }
    
    // ネットワークエラー
    if (error.name === 'NetworkError' || !navigator.onLine) {
      setError(new AppError(
        ErrorCode.NETWORK_ERROR,
        'Network error occurred',
        'ネットワークに接続できません。通信環境を確認してください。',
        true
      ));
      return;
    }
    
    // その他のエラー
    setError(new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'Unknown error',
      'エラーが発生しました。しばらく待ってから再試行してください。',
      true
    ));
  }, [router]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return { error, handleError, clearError };
};
```

### 2.2 ネットワークエラー対策

```typescript
// hooks/useNetworkStatus.ts
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('接続が復旧しました');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('ネットワーク接続が切断されました');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 接続品質チェック
    const checkConnectionQuality = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }
      
      const start = Date.now();
      try {
        await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const latency = Date.now() - start;
        
        if (latency < 500) {
          setConnectionQuality('good');
        } else if (latency < 2000) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('offline');
        }
      } catch {
        setConnectionQuality('offline');
      }
    };
    
    const interval = setInterval(checkConnectionQuality, 10000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  return { isOnline, connectionQuality };
};

// オフライン表示コンポーネント
export const OfflineIndicator: React.FC = () => {
  const { isOnline, connectionQuality } = useNetworkStatus();
  
  if (isOnline && connectionQuality === 'good') return null;
  
  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 p-2 text-center text-white
      ${!isOnline ? 'bg-red-500' : connectionQuality === 'poor' ? 'bg-yellow-500' : ''}
    `}>
      {!isOnline ? (
        <>
          <span className="mr-2">⚠️</span>
          オフライン - ネットワーク接続を確認してください
        </>
      ) : (
        <>
          <span className="mr-2">⚡</span>
          接続が不安定です
        </>
      )}
    </div>
  );
};
```

### 2.3 自動リトライメカニズム

```typescript
// lib/retry-handler.ts
interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => {
      // リトライ可能なエラーかチェック
      if (error instanceof AppError) {
        return error.retryable;
      }
      // ネットワークエラーはリトライ
      return error.name === 'NetworkError' || 
             error.code === 'ECONNABORTED';
    }
  } = options;
  
  let lastError: any;
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!retryCondition(error) || attempt === maxAttempts) {
        throw error;
      }
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
  
  throw lastError;
};

// 使用例
const submitAnswer = async (questionId: string, choiceId: string) => {
  return withRetry(
    async () => {
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, choiceId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new AppError(
          error.code,
          error.message,
          error.userMessage,
          response.status >= 500 // サーバーエラーはリトライ可能
        );
      }
      
      return response.json();
    },
    {
      maxAttempts: 3,
      retryCondition: (error) => {
        // 重複回答エラーはリトライしない
        if (error.code === ErrorCode.ALREADY_ANSWERED) {
          return false;
        }
        return error.retryable;
      }
    }
  );
};
```

## 3. サーバーサイドエラーハンドリング

### 3.1 APIエラーレスポンス

```typescript
// lib/api-error-handler.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    public userMessage: string,
    public details?: any
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }
}

// エラーレスポンス生成
export const createErrorResponse = (error: ApiError) => {
  return NextResponse.json({
    success: false,
    error: {
      code: error.code,
      message: error.userMessage,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined
    },
    timestamp: new Date().toISOString()
  }, { 
    status: error.statusCode 
  });
};

// APIルートのエラーハンドラー
export const withErrorHandler = (
  handler: (req: Request) => Promise<NextResponse>
) => {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      
      // ApiErrorの場合
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }
      
      // Supabaseエラー
      if (error?.code === '23505') {
        return createErrorResponse(new ApiError(
          409,
          ErrorCode.ALREADY_ANSWERED,
          '既に回答済みです'
        ));
      }
      
      // その他のエラー
      return createErrorResponse(new ApiError(
        500,
        ErrorCode.INTERNAL_ERROR,
        'サーバーエラーが発生しました',
        error?.message
      ));
    }
  };
};
```

### 3.2 データベースエラー処理

```typescript
// lib/database-error-handler.ts
export const handleDatabaseError = (error: any): never => {
  console.error('Database Error:', error);
  
  // 接続エラー
  if (error.code === 'ECONNREFUSED') {
    throw new ApiError(
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
      'データベースに接続できません。しばらく待ってから再試行してください。'
    );
  }
  
  // タイムアウト
  if (error.code === 'ETIMEDOUT') {
    throw new ApiError(
      504,
      ErrorCode.TIMEOUT,
      'データベース処理がタイムアウトしました'
    );
  }
  
  // 制約違反
  if (error.code === '23505') { // unique_violation
    throw new ApiError(
      409,
      ErrorCode.ALREADY_ANSWERED,
      '既に処理済みです'
    );
  }
  
  if (error.code === '23503') { // foreign_key_violation
    throw new ApiError(
      400,
      ErrorCode.INVALID_INPUT,
      '無効なデータです'
    );
  }
  
  // デフォルト
  throw new ApiError(
    500,
    ErrorCode.DATABASE_ERROR,
    'データベースエラーが発生しました',
    error.message
  );
};

// トランザクション処理のラッパー
export const withTransaction = async <T>(
  fn: (client: SupabaseClient) => Promise<T>
): Promise<T> => {
  const client = createClient();
  
  try {
    // トランザクション開始
    await client.rpc('begin_transaction');
    
    const result = await fn(client);
    
    // コミット
    await client.rpc('commit_transaction');
    
    return result;
  } catch (error) {
    // ロールバック
    await client.rpc('rollback_transaction').catch(console.error);
    handleDatabaseError(error);
  }
};
```

## 4. リアルタイム通信エラー処理

### 4.1 WebSocket再接続処理

```typescript
// hooks/useRealtimeConnection.ts
export const useRealtimeConnection = () => {
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  
  useEffect(() => {
    let channel: RealtimeChannel;
    let reconnectTimer: NodeJS.Timeout;
    
    const connect = async () => {
      try {
        setConnectionState('connecting');
        
        channel = supabase
          .channel('game_state')
          .on('presence', { event: 'sync' }, () => {
            setConnectionState('connected');
            setReconnectAttempts(0);
          })
          .on('broadcast', { event: 'pong' }, () => {
            // Keep-alive応答
            setConnectionState('connected');
          });
          
        await channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionState('connected');
          } else if (status === 'CLOSED') {
            handleDisconnection();
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionState('error');
            handleDisconnection();
          }
        });
        
        // Keep-aliveメカニズム
        const keepAlive = setInterval(() => {
          channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: {}
          });
        }, 30000);
        
        return () => clearInterval(keepAlive);
      } catch (error) {
        console.error('Connection error:', error);
        setConnectionState('error');
        handleDisconnection();
      }
    };
    
    const handleDisconnection = () => {
      setConnectionState('disconnected');
      
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
        
        reconnectTimer = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        // 最大試行回数に達した場合
        toast.error('接続が切断されました。ページを更新してください。');
      }
    };
    
    connect();
    
    return () => {
      clearTimeout(reconnectTimer);
      channel?.unsubscribe();
    };
  }, [reconnectAttempts]);
  
  return { connectionState, reconnectAttempts };
};
```

### 4.2 楽観的更新とロールバック

```typescript
// hooks/useOptimisticUpdate.ts
export const useOptimisticUpdate = <T>() => {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [actualData, setActualData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const executeWithOptimism = async (
    optimisticValue: T,
    asyncOperation: () => Promise<T>,
    rollbackValue?: T
  ) => {
    // 楽観的更新
    setOptimisticData(optimisticValue);
    setError(null);
    
    try {
      // 実際の処理実行
      const result = await asyncOperation();
      setActualData(result);
      setOptimisticData(null);
      return result;
    } catch (err) {
      // エラー時はロールバック
      console.error('Optimistic update failed:', err);
      setError(err as Error);
      
      if (rollbackValue !== undefined) {
        setOptimisticData(rollbackValue);
      } else {
        setOptimisticData(null);
      }
      
      // エラーを再スロー
      throw err;
    }
  };
  
  const data = optimisticData ?? actualData;
  
  return {
    data,
    error,
    executeWithOptimism,
    isOptimistic: optimisticData !== null
  };
};

// 使用例：回答送信
const QuizAnswer: React.FC = () => {
  const { data: hasAnswered, executeWithOptimism } = useOptimisticUpdate<boolean>();
  
  const handleAnswer = async (choiceId: string) => {
    try {
      await executeWithOptimism(
        true, // 楽観的に「回答済み」とする
        async () => {
          const response = await submitAnswer(questionId, choiceId);
          return response.accepted;
        },
        false // エラー時は「未回答」に戻す
      );
      
      toast.success('回答を送信しました');
    } catch (error) {
      if (error.code === ErrorCode.ALREADY_ANSWERED) {
        toast.error('既に回答済みです');
      } else {
        toast.error('回答の送信に失敗しました');
      }
    }
  };
  
  return (
    <button 
      onClick={() => handleAnswer(choice.id)}
      disabled={hasAnswered}
    >
      {hasAnswered ? '回答済み' : '回答する'}
    </button>
  );
};
```

## 5. エラー通知UI

### 5.1 トースト通知

```typescript
// components/Toast.tsx
import { Toaster, toast } from 'react-hot-toast';

// カスタムトースト設定
export const showErrorToast = (error: AppError) => {
  const toastOptions = {
    duration: error.retryable ? 5000 : 3000,
    style: {
      background: '#ef4444',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    }
  };
  
  if (error.retryable) {
    toast.error(
      (t) => (
        <div className="flex items-center justify-between">
          <span>{error.userMessage}</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              // リトライ処理
              window.location.reload();
            }}
            className="ml-4 bg-white text-red-500 px-2 py-1 rounded text-sm"
          >
            再試行
          </button>
        </div>
      ),
      toastOptions
    );
  } else {
    toast.error(error.userMessage, toastOptions);
  }
};

// 成功通知
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 2000,
    style: {
      background: '#10b981',
      color: '#fff',
    }
  });
};

// グローバルトースト設定
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          className: 'font-sans',
          style: {
            maxWidth: '500px',
          }
        }}
      />
    </>
  );
};
```

### 5.2 エラーバウンダリ

```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // エラーログ送信
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }
  
  logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-6xl text-center mb-4">😵</div>
            <h2 className="text-2xl font-bold text-center mb-4">
              予期せぬエラーが発生しました
            </h2>
            <p className="text-gray-600 text-center mb-6">
              申し訳ございません。エラーが発生しました。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white py-3 rounded-lg"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## 6. エラーログとモニタリング

### 6.1 ログ収集

```typescript
// lib/logger.ts
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  category: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: {
    code: ErrorCode;
    stack?: string;
  };
}

class Logger {
  private buffer: LogEntry[] = [];
  private flushInterval = 5000; // 5秒ごとに送信
  
  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
      
      // ページ離脱時に強制送信
      window.addEventListener('beforeunload', () => this.flush());
    }
  }
  
  private log(level: LogEntry['level'], message: string, metadata?: any) {
    const entry: LogEntry = {
      level,
      message,
      category: metadata?.category || 'general',
      timestamp: new Date().toISOString(),
      userId: metadata?.userId,
      metadata,
      error: metadata?.error
    };
    
    // コンソール出力
    console[level](message, metadata);
    
    // バッファに追加
    this.buffer.push(entry);
    
    // エラーの場合は即座に送信
    if (level === 'error') {
      this.flush();
    }
  }
  
  private async flush() {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      console.error('Failed to send logs:', error);
      // 送信失敗時はバッファに戻す
      this.buffer.unshift(...logs);
    }
  }
  
  debug(message: string, metadata?: any) {
    this.log('debug', message, metadata);
  }
  
  info(message: string, metadata?: any) {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: any) {
    this.log('warn', message, metadata);
  }
  
  error(message: string, error?: any, metadata?: any) {
    this.log('error', message, {
      ...metadata,
      error: {
        code: error?.code,
        stack: error?.stack,
        message: error?.message
      }
    });
  }
}

export const logger = new Logger();
```

### 6.2 エラーモニタリング

```typescript
// pages/admin/monitoring.tsx
export const MonitoringDashboard: React.FC = () => {
  const [errorStats, setErrorStats] = useState<ErrorStatistics>();
  const [recentErrors, setRecentErrors] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    const fetchErrorStats = async () => {
      const [stats, errors] = await Promise.all([
        fetch('/api/admin/monitoring/stats').then(r => r.json()),
        fetch('/api/admin/monitoring/errors').then(r => r.json())
      ]);
      
      setErrorStats(stats);
      setRecentErrors(errors);
    };
    
    fetchErrorStats();
    const interval = setInterval(fetchErrorStats, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">エラーモニタリング</h1>
      
      {/* エラー統計 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="総エラー数"
          value={errorStats?.totalErrors || 0}
          trend={errorStats?.errorTrend}
        />
        <StatCard
          title="エラー率"
          value={`${errorStats?.errorRate || 0}%`}
          trend={errorStats?.rateTrend}
        />
        <StatCard
          title="影響ユーザー数"
          value={errorStats?.affectedUsers || 0}
        />
        <StatCard
          title="平均復旧時間"
          value={`${errorStats?.mttr || 0}秒`}
        />
      </div>
      
      {/* 最近のエラー */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">最近のエラー</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">時刻</th>
              <th className="text-left p-2">エラーコード</th>
              <th className="text-left p-2">メッセージ</th>
              <th className="text-left p-2">ユーザー</th>
              <th className="text-left p-2">対応</th>
            </tr>
          </thead>
          <tbody>
            {recentErrors.map((error, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{formatTime(error.timestamp)}</td>
                <td className="p-2">
                  <span className="text-red-500 font-mono">
                    {error.error?.code}
                  </span>
                </td>
                <td className="p-2">{error.message}</td>
                <td className="p-2">{error.userId || '-'}</td>
                <td className="p-2">
                  <button className="text-blue-500 underline">
                    詳細
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```