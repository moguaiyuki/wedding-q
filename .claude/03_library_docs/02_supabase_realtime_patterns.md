# Supabase Realtime パターン集

## 概要
結婚式クイズアプリにおける Supabase Realtime の実装パターンと最適化手法を定義します。

## Supabase クライアント設定

### 基本設定
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// サーバーサイド用
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerComponentClient() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

### 型定義の生成
```bash
# Supabase CLIで型を生成
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

## Realtime チャンネル管理

### RealtimeManager クラス
```typescript
// lib/realtime/RealtimeManager.ts
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type ChangeHandler<T> = (payload: RealtimePostgresChangesPayload<T>) => void;
type PresenceHandler = (state: any) => void;
type BroadcastHandler = (payload: any) => void;

export class RealtimeManager {
  private static instance: RealtimeManager;
  private supabase = createClient();
  private channels = new Map<string, RealtimeChannel>();
  private subscriptions = new Map<string, Set<Function>>();

  static getInstance(): RealtimeManager {
    if (!this.instance) {
      this.instance = new RealtimeManager();
    }
    return this.instance;
  }

  // データベース変更の監視
  subscribeToTable<T = any>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    handler: ChangeHandler<T>,
    filter?: string
  ): () => void {
    const channelName = `db-${table}`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = this.supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }

    const subscription = channel.on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter,
      },
      handler
    );

    if (channel.state !== 'subscribed') {
      channel.subscribe();
    }

    // クリーンアップ関数を返す
    return () => {
      channel?.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  // Presence（参加者の状態管理）
  subscribeToPresence(
    channelName: string,
    onSync: PresenceHandler,
    onJoin?: PresenceHandler,
    onLeave?: PresenceHandler
  ): {
    track: (state: any) => Promise<void>;
    untrack: () => Promise<void>;
    unsubscribe: () => void;
  } {
    const channel = this.supabase.channel(channelName);
    this.channels.set(channelName, channel);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        onSync(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        onJoin?.({ key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        onLeave?.({ key, leftPresences });
      })
      .subscribe();

    return {
      track: async (state: any) => {
        await channel.track(state);
      },
      untrack: async () => {
        await channel.untrack();
      },
      unsubscribe: () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  // Broadcast（リアルタイムメッセージング）
  subscribeToBroadcast(
    channelName: string,
    event: string,
    handler: BroadcastHandler
  ): {
    send: (payload: any) => Promise<void>;
    unsubscribe: () => void;
  } {
    const channel = this.supabase.channel(channelName);
    this.channels.set(channelName, channel);

    channel
      .on('broadcast', { event }, handler)
      .subscribe();

    return {
      send: async (payload: any) => {
        await channel.send({
          type: 'broadcast',
          event,
          payload,
        });
      },
      unsubscribe: () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  // すべてのチャンネルをクリーンアップ
  cleanup(): void {
    this.channels.forEach(channel => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.subscriptions.clear();
  }
}
```

## React Hooks パターン

### useRealtimeSubscription フック
```typescript
// hooks/useRealtimeSubscription.ts
import { useEffect, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';

interface UseRealtimeSubscriptionOptions<T> {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void;
}

export function useRealtimeSubscription<T = any>({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeSubscriptionOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const manager = RealtimeManager.getInstance();
    
    const unsubscribe = manager.subscribeToTable<T>(
      table,
      event,
      (payload: RealtimePostgresChangesPayload<T>) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              setData(prev => [...prev, payload.new as T]);
              onInsert?.(payload.new as T);
            }
            break;
          
          case 'UPDATE':
            if (payload.new) {
              setData(prev =>
                prev.map(item =>
                  (item as any).id === (payload.new as any).id
                    ? payload.new as T
                    : item
                )
              );
              onUpdate?.(payload.new as T);
            }
            break;
          
          case 'DELETE':
            if (payload.old) {
              setData(prev =>
                prev.filter(item => (item as any).id !== (payload.old as any).id)
              );
              onDelete?.(payload.old as T);
            }
            break;
        }
      },
      filter
    );

    setLoading(false);

    return () => {
      unsubscribe();
    };
  }, [table, event, filter]);

  return { data, loading, error };
}
```

### useGameState フック
```typescript
// hooks/useGameState.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';

interface GameState {
  currentQuestionId: number | null;
  status: 'waiting' | 'in_progress' | 'showing_results' | 'completed';
  answersLocked: boolean;
  showCorrectAnswer: boolean;
  timeRemaining: number;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 初期データ取得
    const fetchInitialState = async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .single();

      if (data && !error) {
        setGameState(data.value as GameState);
      }
      setLoading(false);
    };

    fetchInitialState();

    // リアルタイム更新を監視
    const manager = RealtimeManager.getInstance();
    const unsubscribe = manager.subscribeToTable(
      'game_state',
      'UPDATE',
      (payload) => {
        if (payload.new?.value) {
          setGameState(payload.new.value as GameState);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const updateGameState = async (updates: Partial<GameState>) => {
    const newState = { ...gameState, ...updates };
    
    const { error } = await supabase
      .from('game_state')
      .update({ value: newState, updated_at: new Date().toISOString() })
      .eq('key', 'current_state');

    if (!error) {
      // 楽観的更新
      setGameState(newState);
    }

    return { error };
  };

  return {
    gameState,
    loading,
    updateGameState,
  };
}
```

### usePresence フック（参加者の接続状態）
```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';
import { useUser } from '@/hooks/useUser';

interface Presence {
  userId: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
}

export function usePresence(channelName: string = 'quiz-room') {
  const [presences, setPresences] = useState<Record<string, Presence[]>>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const manager = RealtimeManager.getInstance();
    
    const presence = manager.subscribeToPresence(
      channelName,
      // onSync
      (state) => {
        setPresences(state);
        const count = Object.values(state).flat().length;
        setOnlineCount(count);
      },
      // onJoin
      ({ key, newPresences }) => {
        console.log(`${key} joined with:`, newPresences);
      },
      // onLeave
      ({ key, leftPresences }) => {
        console.log(`${key} left with:`, leftPresences);
      }
    );

    // 自分の状態をトラック
    presence.track({
      userId: user.id,
      name: user.name,
      status: 'online',
      lastSeen: new Date(),
    });

    // ページ離脱時の処理
    const handleBeforeUnload = () => {
      presence.untrack();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      presence.unsubscribe();
    };
  }, [channelName, user]);

  return {
    presences: Object.values(presences).flat(),
    onlineCount,
  };
}
```

## 回答収集パターン

### リアルタイム回答集計
```typescript
// hooks/useAnswerAggregation.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';

interface AnswerStats {
  choiceId: number;
  count: number;
  percentage: number;
}

export function useAnswerAggregation(questionId: number | null) {
  const [stats, setStats] = useState<AnswerStats[]>([]);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!questionId) {
      setStats([]);
      setTotalAnswers(0);
      return;
    }

    // 初期データ取得
    const fetchInitialStats = async () => {
      const { data, error } = await supabase
        .from('answers')
        .select('choice_id')
        .eq('question_id', questionId);

      if (data && !error) {
        calculateStats(data);
      }
      setLoading(false);
    };

    fetchInitialStats();

    // リアルタイム更新を監視
    const manager = RealtimeManager.getInstance();
    const unsubscribe = manager.subscribeToTable(
      'answers',
      'INSERT',
      async (payload) => {
        if (payload.new?.question_id === questionId) {
          // 新しい回答が追加されたら再集計
          const { data } = await supabase
            .from('answers')
            .select('choice_id')
            .eq('question_id', questionId);

          if (data) {
            calculateStats(data);
          }
        }
      },
      `question_id=eq.${questionId}`
    );

    return () => {
      unsubscribe();
    };
  }, [questionId]);

  const calculateStats = (answers: { choice_id: number }[]) => {
    const counts = answers.reduce((acc, answer) => {
      acc[answer.choice_id] = (acc[answer.choice_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const total = answers.length;
    setTotalAnswers(total);

    const statsArray = Object.entries(counts).map(([choiceId, count]) => ({
      choiceId: parseInt(choiceId),
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));

    setStats(statsArray);
  };

  return { stats, totalAnswers, loading };
}
```

## Broadcast パターン（イベント通知）

### イベント通知システム
```typescript
// hooks/useEventBroadcast.ts
import { useEffect, useCallback } from 'react';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';

export type EventType = 
  | 'quiz_started'
  | 'quiz_ended'
  | 'question_changed'
  | 'answers_locked'
  | 'results_shown'
  | 'celebration';

interface BroadcastEvent {
  type: EventType;
  payload?: any;
  timestamp: Date;
}

export function useEventBroadcast(
  onEvent?: (event: BroadcastEvent) => void
) {
  useEffect(() => {
    const manager = RealtimeManager.getInstance();
    
    const broadcast = manager.subscribeToBroadcast(
      'quiz-events',
      'event',
      (payload) => {
        onEvent?.(payload as BroadcastEvent);
      }
    );

    return () => {
      broadcast.unsubscribe();
    };
  }, [onEvent]);

  const sendEvent = useCallback(async (
    type: EventType,
    payload?: any
  ) => {
    const manager = RealtimeManager.getInstance();
    const broadcast = manager.subscribeToBroadcast(
      'quiz-events',
      'event',
      () => {} // No-op handler for sending
    );

    await broadcast.send({
      type,
      payload,
      timestamp: new Date(),
    });

    broadcast.unsubscribe();
  }, []);

  return { sendEvent };
}

// 使用例
export function QuizController() {
  const { sendEvent } = useEventBroadcast();

  const startQuiz = async () => {
    // クイズ開始処理
    await sendEvent('quiz_started', { 
      startTime: new Date(),
      totalQuestions: 10 
    });
  };

  const showResults = async (questionId: number) => {
    await sendEvent('results_shown', { questionId });
  };

  return (
    <div>
      <button onClick={startQuiz}>クイズ開始</button>
      <button onClick={() => showResults(1)}>結果表示</button>
    </div>
  );
}
```

## エラーハンドリングとリトライ

### 接続管理とリトライ
```typescript
// lib/realtime/ConnectionManager.ts
export class ConnectionManager {
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 1000;
  private isConnected = false;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(
    private onConnect?: () => void,
    private onDisconnect?: () => void,
    private onError?: (error: Error) => void
  ) {}

  async connect(connectFn: () => Promise<void>): Promise<void> {
    try {
      await connectFn();
      this.isConnected = true;
      this.retryCount = 0;
      this.onConnect?.();
    } catch (error) {
      this.handleError(error as Error, connectFn);
    }
  }

  private async handleError(
    error: Error,
    connectFn: () => Promise<void>
  ): Promise<void> {
    this.isConnected = false;
    this.onDisconnect?.();
    this.onError?.(error);

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
      
      console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect(connectFn);
      }, delay);
    } else {
      console.error('Max retries reached. Could not establish connection.');
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.isConnected = false;
    this.onDisconnect?.();
  }

  getStatus(): boolean {
    return this.isConnected;
  }
}
```

### 接続状態フック
```typescript
// hooks/useConnectionStatus.ts
import { useEffect, useState } from 'react';
import { ConnectionManager } from '@/lib/realtime/ConnectionManager';
import { createClient } from '@/lib/supabase/client';

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const manager = new ConnectionManager(
      () => {
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
      },
      () => {
        setIsConnected(false);
        setIsReconnecting(true);
      },
      (err) => {
        setError(err.message);
      }
    );

    // 接続状態を監視
    const channel = supabase.channel('connection-check');
    
    manager.connect(async () => {
      await new Promise((resolve, reject) => {
        channel
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve(true);
            } else if (status === 'CHANNEL_ERROR') {
              reject(new Error('Channel subscription failed'));
            }
          });
      });
    });

    return () => {
      channel.unsubscribe();
      manager.disconnect();
    };
  }, []);

  return { isConnected, isReconnecting, error };
}
```

## パフォーマンス最適化

### デバウンス処理
```typescript
// hooks/useDebouncedRealtime.ts
import { useEffect, useRef, useState } from 'react';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';

export function useDebouncedRealtime<T>(
  table: string,
  delay: number = 500
) {
  const [data, setData] = useState<T[]>([]);
  const bufferRef = useRef<T[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const manager = RealtimeManager.getInstance();
    
    const unsubscribe = manager.subscribeToTable<T>(
      table,
      '*',
      (payload) => {
        if (payload.new) {
          bufferRef.current.push(payload.new as T);
          
          // デバウンス処理
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          
          timerRef.current = setTimeout(() => {
            setData(prev => [...prev, ...bufferRef.current]);
            bufferRef.current = [];
          }, delay);
        }
      }
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      unsubscribe();
    };
  }, [table, delay]);

  return data;
}
```

### バッチ処理
```typescript
// lib/realtime/BatchProcessor.ts
export class BatchProcessor<T> {
  private queue: T[] = [];
  private timer?: NodeJS.Timeout;
  
  constructor(
    private processFn: (items: T[]) => void,
    private batchSize: number = 10,
    private maxDelay: number = 1000
  ) {}

  add(item: T): void {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.maxDelay);
    }
  }

  private flush(): void {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    this.processFn(batch);
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => this.flush(), this.maxDelay);
    }
  }

  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.queue = [];
  }
}
```