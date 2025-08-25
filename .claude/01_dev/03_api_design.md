# API設計書 - 結婚式クイズアプリ

## 1. API概要

### 1.1 基本仕様
- **プロトコル**: HTTPS
- **データ形式**: JSON
- **文字コード**: UTF-8
- **認証方式**: JWT (JSON Web Token) / Session Cookie
- **APIバージョン**: v1
- **ベースURL**: `https://wedding-quiz.com/api`

### 1.2 共通レスポンス形式

```typescript
// 成功レスポンス
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// エラーレスポンス
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### 1.3 HTTPステータスコード

| コード | 説明 | 使用場面 |
|--------|------|----------|
| 200 | OK | 正常な取得・更新 |
| 201 | Created | リソース作成成功 |
| 204 | No Content | 削除成功 |
| 400 | Bad Request | リクエスト不正 |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | リソース不在 |
| 409 | Conflict | 重複・競合 |
| 429 | Too Many Requests | レート制限 |
| 500 | Internal Server Error | サーバーエラー |
| 503 | Service Unavailable | メンテナンス中 |

## 2. 認証API

### 2.1 参加者ログイン

```typescript
// POST /api/auth/participant/login
interface ParticipantLoginRequest {
  qrCode: string;  // QRコードまたはID
}

interface ParticipantLoginResponse {
  user: {
    id: string;
    fullName: string;
    nickname: string | null;
    groupType: '新郎友人' | '新郎親族' | '新婦友人' | '新婦親族';
  };
  sessionToken: string;
  expiresAt: string;
}

// 実装例
export async function POST(request: Request) {
  const { qrCode } = await request.json();
  
  // QRコード検証
  const user = await supabase
    .from('users')
    .select('*')
    .eq('qr_code', qrCode)
    .single();
    
  if (!user.data) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_QR_CODE',
        message: '無効なQRコードです'
      }
    }, { status: 401 });
  }
  
  // セッション作成
  const sessionToken = generateSessionToken();
  const session = await createSession(user.data.id, sessionToken);
  
  // Cookie設定
  const response = NextResponse.json({
    success: true,
    data: {
      user: user.data,
      sessionToken,
      expiresAt: session.expiresAt
    }
  });
  
  response.cookies.set('session', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 86400 // 24時間
  });
  
  return response;
}
```

### 2.2 管理者ログイン

```typescript
// POST /api/auth/admin/login
interface AdminLoginRequest {
  password: string;
}

interface AdminLoginResponse {
  token: string;
  expiresAt: string;
}

// 実装例
export async function POST(request: Request) {
  const { password } = await request.json();
  
  // パスワード検証
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: 'パスワードが正しくありません'
      }
    }, { status: 401 });
  }
  
  // JWT生成
  const token = await signJWT({
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 3600000 // 1時間
  });
  
  return NextResponse.json({
    success: true,
    data: {
      token,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }
  });
}
```

### 2.3 ニックネーム設定

```typescript
// PUT /api/auth/participant/nickname
interface SetNicknameRequest {
  nickname: string;
}

interface SetNicknameResponse {
  nickname: string;
  updated: boolean;
}

// バリデーション
const validateNickname = (nickname: string): boolean => {
  // 長さチェック
  if (nickname.length > 20) return false;
  
  // 絵文字チェック
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/gu;
  if (emojiRegex.test(nickname)) return false;
  
  // 不適切な文字チェック
  const invalidChars = /[<>\"\'&]/;
  if (invalidChars.test(nickname)) return false;
  
  return true;
};
```

## 3. クイズAPI

### 3.1 現在の問題取得

```typescript
// GET /api/quiz/current
interface GetCurrentQuestionResponse {
  question: {
    id: string;
    orderNumber: number;
    text: string;
    imageUrl: string | null;
    choices: Array<{
      id: string;
      text: string | null;
      imageUrl: string | null;
      displayOrder: number;
    }>;
    timeLimit: number;
  };
  gameStatus: 'waiting' | 'accepting_answers' | 'closed' | 'showing_answer';
  hasAnswered: boolean;
  userAnswer?: string;
}

// 実装例
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '認証が必要です' }
    }, { status: 401 });
  }
  
  // ゲーム状態取得
  const gameState = await supabase
    .from('game_state')
    .select('*')
    .single();
    
  if (!gameState.data?.current_question_id) {
    return NextResponse.json({
      success: true,
      data: {
        gameStatus: 'waiting',
        question: null
      }
    });
  }
  
  // 問題と選択肢取得
  const question = await supabase
    .from('questions')
    .select(`
      *,
      choices (*)
    `)
    .eq('id', gameState.data.current_question_id)
    .single();
    
  // ユーザーの回答確認
  const userAnswer = await supabase
    .from('answers')
    .select('choice_id')
    .eq('user_id', session.userId)
    .eq('question_id', gameState.data.current_question_id)
    .single();
    
  return NextResponse.json({
    success: true,
    data: {
      question: question.data,
      gameStatus: gameState.data.status,
      hasAnswered: !!userAnswer.data,
      userAnswer: userAnswer.data?.choice_id
    }
  });
}
```

### 3.2 回答送信

```typescript
// POST /api/quiz/answer
interface SubmitAnswerRequest {
  questionId: string;
  choiceId: string;
}

interface SubmitAnswerResponse {
  accepted: boolean;
  isCorrect?: boolean;
  message: string;
}

// 実装例（楽観的ロック付き）
export async function POST(request: Request) {
  const session = await getSession(request);
  const { questionId, choiceId } = await request.json();
  
  // トランザクション処理
  const { data, error } = await supabase.rpc('sp_submit_answer', {
    p_user_id: session.userId,
    p_question_id: questionId,
    p_choice_id: choiceId
  });
  
  if (error) {
    if (error.code === '23505') { // Unique violation
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALREADY_ANSWERED',
          message: '既に回答済みです'
        }
      }, { status: 409 });
    }
    throw error;
  }
  
  // リアルタイム通知
  await supabase.channel('quiz_answers').send({
    type: 'broadcast',
    event: 'new_answer',
    payload: {
      userId: session.userId,
      questionId,
      timestamp: new Date().toISOString()
    }
  });
  
  return NextResponse.json({
    success: true,
    data: {
      accepted: true,
      message: '回答を受け付けました'
    }
  });
}
```

### 3.3 ランキング取得

```typescript
// GET /api/quiz/ranking
interface GetRankingResponse {
  rankings: Array<{
    rank: number;
    userId: string;
    displayName: string;
    groupType: string;
    score: number;
    answeredCount: number;
  }>;
  userRank?: {
    rank: number;
    score: number;
    percentile: number;
  };
  groupStatistics: Array<{
    groupType: string;
    averageScore: number;
    memberCount: number;
  }>;
}

// キャッシュ戦略
const getRankingWithCache = async () => {
  const cacheKey = 'ranking:current';
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const ranking = await supabase
    .from('v_user_rankings')
    .select('*')
    .order('rank', { ascending: true });
    
  await redis.setex(cacheKey, 5, JSON.stringify(ranking.data)); // 5秒キャッシュ
  return ranking.data;
};
```

## 4. 管理者API

### 4.1 クイズ進行制御

```typescript
// POST /api/admin/quiz/control
interface QuizControlRequest {
  action: 'start' | 'next' | 'close' | 'reveal' | 'show_ranking' | 'finish';
  metadata?: Record<string, any>;
}

interface QuizControlResponse {
  newStatus: string;
  currentQuestionNumber?: number;
  message: string;
}

// 実装例（状態遷移管理）
export async function POST(request: Request) {
  const { action, metadata } = await request.json();
  
  // 管理者認証確認
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({
      success: false,
      error: { code: 'FORBIDDEN', message: '管理者権限が必要です' }
    }, { status: 403 });
  }
  
  // 状態遷移定義
  const stateTransitions = {
    start: { from: 'waiting', to: 'question_display' },
    next: { from: 'showing_answer', to: 'question_display' },
    close: { from: 'accepting_answers', to: 'closed' },
    reveal: { from: 'closed', to: 'showing_answer' },
    show_ranking: { from: 'showing_answer', to: 'showing_ranking' },
    finish: { from: '*', to: 'finished' }
  };
  
  const transition = stateTransitions[action];
  
  // 現在の状態確認
  const currentState = await supabase
    .from('game_state')
    .select('*')
    .single();
    
  // 状態遷移実行
  const { data, error } = await supabase
    .from('game_state')
    .update({
      status: transition.to,
      last_action: action,
      metadata: { ...currentState.data.metadata, ...metadata },
      updated_at: new Date().toISOString()
    })
    .eq('id', currentState.data.id);
    
  // 全クライアントに通知
  await broadcastStateChange(transition.to, action);
  
  return NextResponse.json({
    success: true,
    data: {
      newStatus: transition.to,
      message: `状態を${transition.to}に変更しました`
    }
  });
}
```

### 4.2 UNDO機能

```typescript
// POST /api/admin/quiz/undo
interface UndoResponse {
  success: boolean;
  previousAction: string;
  restoredStatus: string;
}

// 実装例（履歴管理）
export async function POST(request: Request) {
  // UNDOスタック取得
  const history = await redis.lrange('game:history', 0, 0);
  if (!history.length) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'NO_HISTORY',
        message: '取り消し可能な操作がありません'
      }
    }, { status: 400 });
  }
  
  const lastState = JSON.parse(history[0]);
  
  // 状態復元
  await supabase
    .from('game_state')
    .update({
      status: lastState.status,
      current_question_id: lastState.questionId,
      last_action: `undo_${lastState.action}`,
      updated_at: new Date().toISOString()
    });
    
  // 履歴から削除
  await redis.lpop('game:history');
  
  return NextResponse.json({
    success: true,
    data: {
      success: true,
      previousAction: lastState.action,
      restoredStatus: lastState.status
    }
  });
}
```

### 4.3 参加者管理

```typescript
// GET /api/admin/users
interface GetUsersResponse {
  users: Array<{
    id: string;
    fullName: string;
    nickname: string | null;
    groupType: string;
    qrCode: string;
    isOnline: boolean;
    lastActive: string | null;
    score: number;
  }>;
  statistics: {
    total: number;
    online: number;
    byGroup: Record<string, number>;
  };
}

// POST /api/admin/users
interface CreateUserRequest {
  fullName: string;
  groupType: '新郎友人' | '新郎親族' | '新婦友人' | '新婦親族';
}

interface CreateUserResponse {
  user: {
    id: string;
    fullName: string;
    groupType: string;
    qrCode: string;
    qrCodeUrl: string;
  };
}

// QRコード生成
import QRCode from 'qrcode';

const generateQRCode = async (userId: string): Promise<string> => {
  const qrData = `${process.env.NEXT_PUBLIC_APP_URL}/login?code=${userId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  return qrCodeDataUrl;
};
```

### 4.4 問題管理

```typescript
// GET /api/admin/questions
interface GetQuestionsResponse {
  questions: Array<{
    id: string;
    orderNumber: number;
    text: string;
    imageUrl: string | null;
    choices: Array<{
      id: string;
      text: string | null;
      imageUrl: string | null;
      isCorrect: boolean;
    }>;
    statistics?: {
      answerCount: number;
      correctRate: number;
    };
  }>;
}

// POST /api/admin/questions
interface CreateQuestionRequest {
  orderNumber: number;
  text: string;
  image?: File;
  choices: Array<{
    text?: string;
    image?: File;
    isCorrect: boolean;
  }>;
  explanationText?: string;
  explanationImage?: File;
}

// 画像アップロード処理
const uploadImage = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('quiz-images')
    .upload(fileName, file, {
      contentType: file.type,
      cacheControl: '3600'
    });
    
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('quiz-images')
    .getPublicUrl(fileName);
    
  return publicUrl;
};
```

### 4.5 データリセット

```typescript
// POST /api/admin/reset
interface ResetRequest {
  resetType: 'answers' | 'all';
  confirmation: string; // "RESET"と入力
}

interface ResetResponse {
  resetCount: {
    answers: number;
    sessions: number;
    users?: number;
  };
  message: string;
}

// 実装例（安全確認付き）
export async function POST(request: Request) {
  const { resetType, confirmation } = await request.json();
  
  if (confirmation !== 'RESET') {
    return NextResponse.json({
      success: false,
      error: {
        code: 'CONFIRMATION_REQUIRED',
        message: '確認文字列が正しくありません'
      }
    }, { status: 400 });
  }
  
  let resetCount = { answers: 0, sessions: 0 };
  
  if (resetType === 'answers') {
    // 回答のみリセット
    const { count: answersCount } = await supabase
      .from('answers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 全削除
      
    await supabase
      .from('users')
      .update({ total_score: 0 });
      
    resetCount.answers = answersCount || 0;
  } else if (resetType === 'all') {
    // 全データリセット
    await supabase.rpc('sp_reset_game');
    resetCount = { answers: 60, sessions: 60, users: 60 };
  }
  
  return NextResponse.json({
    success: true,
    data: {
      resetCount,
      message: 'データをリセットしました'
    }
  });
}
```

## 5. リアルタイムAPI (WebSocket)

### 5.1 Supabase Realtime設定

```typescript
// lib/realtime.ts
import { createClient } from '@supabase/supabase-js';

export const setupRealtimeSubscriptions = (userId: string) => {
  const channels = [];
  
  // ゲーム状態の購読
  const gameStateChannel = supabase
    .channel('game_state_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_state'
    }, (payload) => {
      handleGameStateChange(payload);
    });
    
  // 回答状態の購読
  const answersChannel = supabase
    .channel('answers_channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'answers',
      filter: `question_id=eq.${currentQuestionId}`
    }, (payload) => {
      handleNewAnswer(payload);
    });
    
  // プレゼンス（オンライン状態）
  const presenceChannel = supabase
    .channel('presence')
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      updateOnlineUsers(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', leftPresences);
    });
    
  // 購読開始
  channels.forEach(ch => ch.subscribe());
  
  return () => {
    channels.forEach(ch => ch.unsubscribe());
  };
};
```

### 5.2 ブロードキャストAPI

```typescript
// ブロードキャストメッセージ型定義
interface BroadcastMessage {
  type: 'state_change' | 'statistics_update' | 'announcement';
  payload: any;
  timestamp: string;
}

// 管理者からの一斉送信
export const broadcastToAll = async (message: BroadcastMessage) => {
  const channel = supabase.channel('broadcast_channel');
  
  await channel.send({
    type: 'broadcast',
    event: message.type,
    payload: message.payload
  });
};

// クライアント側受信
const subscribeToBroadcast = () => {
  supabase
    .channel('broadcast_channel')
    .on('broadcast', { event: '*' }, (payload) => {
      handleBroadcastMessage(payload);
    })
    .subscribe();
};
```

## 6. エラーハンドリング

### 6.1 エラーコード定義

```typescript
enum ErrorCode {
  // 認証関連
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // クイズ関連
  ALREADY_ANSWERED = 'ALREADY_ANSWERED',
  QUIZ_NOT_STARTED = 'QUIZ_NOT_STARTED',
  ANSWER_CLOSED = 'ANSWER_CLOSED',
  
  // システム関連
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // バリデーション
  INVALID_INPUT = 'INVALID_INPUT',
  NICKNAME_TAKEN = 'NICKNAME_TAKEN',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION'
}

// エラーレスポンス生成
const createErrorResponse = (
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: any
) => {
  return NextResponse.json({
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  }, { status: statusCode });
};
```

### 6.2 グローバルエラーハンドラー

```typescript
// middleware.ts
export async function middleware(request: Request) {
  try {
    // レート制限チェック
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'リクエストが多すぎます。しばらく待ってから再試行してください。',
        429,
        { retryAfter: rateLimitResult.retryAfter }
      );
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return createErrorResponse(
      ErrorCode.NETWORK_ERROR,
      'サーバーエラーが発生しました',
      500
    );
  }
}
```

## 7. レート制限

### 7.1 レート制限設定

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// エンドポイント別レート制限
export const rateLimits = {
  // 参加者API
  participant: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
  }),
  
  // 管理者API
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  }),
  
  // 回答送信（特別制限）
  answer: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(1, '5 s'), // 1 request per 5 seconds
  }),
};

// 使用例
export const checkRateLimit = async (
  request: Request,
  type: keyof typeof rateLimits = 'participant'
) => {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success, limit, remaining, reset } = await rateLimits[type].limit(ip);
  
  return {
    allowed: success,
    limit,
    remaining,
    retryAfter: reset - Date.now()
  };
};
```

## 8. API テスト

### 8.1 統合テスト例

```typescript
// __tests__/api/quiz.test.ts
import { createMocks } from 'node-mocks-http';

describe('/api/quiz/answer', () => {
  it('should accept valid answer', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': 'session=valid_session_token'
      },
      body: {
        questionId: 'question_1',
        choiceId: 'choice_1'
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(true);
    expect(jsonData.data.accepted).toBe(true);
  });
  
  it('should reject duplicate answer', async () => {
    // 1回目の回答
    await submitAnswer('user_1', 'question_1', 'choice_1');
    
    // 2回目の回答試行
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        questionId: 'question_1',
        choiceId: 'choice_2'
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(409);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.error.code).toBe('ALREADY_ANSWERED');
  });
});
```

### 8.2 負荷テスト

```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 60 },  // 60人まで増加
    { duration: '1m', target: 60 },   // 60人維持
    { duration: '30s', target: 0 },   // 0人まで減少
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95%が3秒以内
    http_req_failed: ['rate<0.05'],    // エラー率5%未満
  },
};

export default function () {
  // ログイン
  const loginRes = http.post('https://api.example.com/auth/participant/login', 
    JSON.stringify({ qrCode: `test_${__VU}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  // 回答送信
  const answerRes = http.post('https://api.example.com/quiz/answer',
    JSON.stringify({
      questionId: 'q1',
      choiceId: `c${Math.floor(Math.random() * 4) + 1}`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(answerRes, {
    'answer accepted': (r) => r.status === 200 || r.status === 409,
  });
  
  sleep(1);
}
```