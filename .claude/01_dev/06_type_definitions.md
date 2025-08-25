# TypeScript型定義書 - 結婚式クイズアプリ

## 1. 基本型定義

### 1.1 ドメイン型

```typescript
// types/domain.ts

/**
 * グループタイプ（参加者の属性）
 */
export type GroupType = '新郎友人' | '新郎親族' | '新婦友人' | '新婦親族';

/**
 * ゲーム状態
 */
export type GameStatus = 
  | 'waiting'           // 待機中
  | 'question_display'  // 問題表示中
  | 'accepting_answers' // 回答受付中
  | 'closed'           // 回答締切
  | 'showing_answer'   // 正解発表中
  | 'showing_ranking'  // ランキング表示中
  | 'finished';        // 終了

/**
 * 管理者アクション
 */
export type AdminAction = 
  | 'start'         // クイズ開始
  | 'next'          // 次の問題へ
  | 'close'         // 回答締切
  | 'reveal'        // 正解発表
  | 'show_ranking'  // ランキング表示
  | 'finish'        // クイズ終了
  | 'undo';         // 操作取消

/**
 * 接続状態
 */
export type ConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'reconnecting' 
  | 'error';
```

### 1.2 エンティティ型

```typescript
// types/entities.ts

/**
 * ユーザー（参加者）
 */
export interface User {
  id: string;
  fullName: string;
  nickname: string | null;
  groupType: GroupType;
  qrCode: string;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 問題
 */
export interface Question {
  id: string;
  orderNumber: number;
  questionText: string;
  questionImageUrl: string | null;
  explanationText: string | null;
  explanationImageUrl: string | null;
  timeLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 選択肢
 */
export interface Choice {
  id: string;
  questionId: string;
  choiceText: string | null;
  choiceImageUrl: string | null;
  isCorrect: boolean;
  displayOrder: number;
  createdAt: string;
}

/**
 * 回答
 */
export interface Answer {
  id: string;
  userId: string;
  questionId: string;
  choiceId: string;
  isCorrect: boolean;
  responseTimeMs: number | null;
  createdAt: string;
}

/**
 * ゲーム状態
 */
export interface GameState {
  id: string;
  currentQuestionId: string | null;
  status: GameStatus;
  lastAction: string | null;
  metadata: Record<string, any>;
  updatedAt: string;
}

/**
 * ユーザーセッション
 */
export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActive: string;
  createdAt: string;
}
```

## 2. API型定義

### 2.1 リクエスト/レスポンス型

```typescript
// types/api.ts

/**
 * 基本APIレスポンス
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/**
 * APIエラー
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * ページネーション
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// 認証関連
export namespace Auth {
  export interface ParticipantLoginRequest {
    qrCode: string;
  }
  
  export interface ParticipantLoginResponse {
    user: User;
    sessionToken: string;
    expiresAt: string;
  }
  
  export interface AdminLoginRequest {
    password: string;
  }
  
  export interface AdminLoginResponse {
    token: string;
    expiresAt: string;
  }
  
  export interface SetNicknameRequest {
    nickname: string;
  }
  
  export interface SetNicknameResponse {
    nickname: string;
    updated: boolean;
  }
}

// クイズ関連
export namespace Quiz {
  export interface GetCurrentQuestionResponse {
    question: Question & {
      choices: Choice[];
    } | null;
    gameStatus: GameStatus;
    hasAnswered: boolean;
    userAnswer?: string;
  }
  
  export interface SubmitAnswerRequest {
    questionId: string;
    choiceId: string;
  }
  
  export interface SubmitAnswerResponse {
    accepted: boolean;
    isCorrect?: boolean;
    message: string;
  }
  
  export interface GetRankingResponse {
    rankings: RankingEntry[];
    userRank?: UserRankInfo;
    groupStatistics: GroupStatistics[];
  }
  
  export interface RankingEntry {
    rank: number;
    userId: string;
    displayName: string;
    groupType: GroupType;
    score: number;
    answeredCount: number;
  }
  
  export interface UserRankInfo {
    rank: number;
    score: number;
    percentile: number;
  }
  
  export interface GroupStatistics {
    groupType: GroupType;
    averageScore: number;
    memberCount: number;
    topScore: number;
  }
}

// 管理者関連
export namespace Admin {
  export interface QuizControlRequest {
    action: AdminAction;
    metadata?: Record<string, any>;
  }
  
  export interface QuizControlResponse {
    newStatus: GameStatus;
    currentQuestionNumber?: number;
    message: string;
  }
  
  export interface CreateUserRequest {
    fullName: string;
    groupType: GroupType;
  }
  
  export interface CreateUserResponse {
    user: User;
    qrCodeUrl: string;
  }
  
  export interface CreateQuestionRequest {
    orderNumber: number;
    text: string;
    imageFile?: File;
    choices: CreateChoiceInput[];
    explanationText?: string;
    explanationImageFile?: File;
    timeLimit?: number;
  }
  
  export interface CreateChoiceInput {
    text?: string;
    imageFile?: File;
    isCorrect: boolean;
    displayOrder: number;
  }
  
  export interface ResetDataRequest {
    resetType: 'answers' | 'all';
    confirmation: string;
  }
  
  export interface ResetDataResponse {
    resetCount: {
      answers: number;
      sessions: number;
      users?: number;
    };
    message: string;
  }
  
  export interface StatisticsResponse {
    totalParticipants: number;
    activeParticipants: number;
    questionsAnswered: number;
    averageScore: number;
    completionRate: number;
    groupBreakdown: Record<GroupType, number>;
    recentActivity: ActivityLog[];
  }
  
  export interface ActivityLog {
    timestamp: string;
    type: 'login' | 'answer' | 'disconnect';
    userId: string;
    details?: any;
  }
}
```

### 2.2 WebSocket型定義

```typescript
// types/websocket.ts

/**
 * リアルタイムイベント
 */
export type RealtimeEvent = 
  | 'game_state_change'
  | 'new_answer'
  | 'ranking_update'
  | 'user_joined'
  | 'user_left'
  | 'announcement';

/**
 * WebSocketメッセージ
 */
export interface WebSocketMessage<T = any> {
  event: RealtimeEvent;
  payload: T;
  timestamp: string;
}

/**
 * ゲーム状態変更イベント
 */
export interface GameStateChangeEvent {
  previousStatus: GameStatus;
  newStatus: GameStatus;
  currentQuestionId?: string;
  action: string;
}

/**
 * 新規回答イベント
 */
export interface NewAnswerEvent {
  userId: string;
  questionId: string;
  timestamp: string;
  currentAnswerCount: number;
  totalParticipants: number;
}

/**
 * ランキング更新イベント
 */
export interface RankingUpdateEvent {
  rankings: Quiz.RankingEntry[];
  updatedAt: string;
}

/**
 * プレゼンス（オンライン状態）
 */
export interface PresenceState {
  userId: string;
  fullName: string;
  nickname?: string;
  groupType: GroupType;
  joinedAt: string;
  lastSeen: string;
}

/**
 * チャンネル購読オプション
 */
export interface SubscriptionOptions {
  channel: string;
  event?: string;
  filter?: Record<string, any>;
  callback: (payload: any) => void;
}
```

## 3. UI コンポーネント型

### 3.1 Props型定義

```typescript
// types/components.ts

/**
 * 共通Props
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * ボタンProps
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * 入力フィールドProps
 */
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'number' | 'password' | 'email';
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

/**
 * モーダルProps
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  onClose: () => void;
}

/**
 * カードProps
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
}

// クイズ専用コンポーネント
export namespace QuizComponents {
  export interface QuestionCardProps {
    question: Question;
    choices: Choice[];
    selectedChoiceId?: string;
    isAnswering?: boolean;
    showResult?: boolean;
    onSelectChoice?: (choiceId: string) => void;
  }
  
  export interface ChoiceButtonProps {
    choice: Choice;
    isSelected?: boolean;
    isCorrect?: boolean;
    isDisabled?: boolean;
    showResult?: boolean;
    onClick?: () => void;
  }
  
  export interface RankingListProps {
    rankings: Quiz.RankingEntry[];
    currentUserId?: string;
    showGroupLabels?: boolean;
    maxItems?: number;
  }
  
  export interface TimerProps {
    duration: number;
    onTimeout?: () => void;
    isPaused?: boolean;
  }
  
  export interface StatisticsCardProps {
    title: string;
    value: number | string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
  }
  
  export interface ConnectionIndicatorProps {
    status: ConnectionStatus;
    showDetails?: boolean;
  }
}

// 管理画面コンポーネント
export namespace AdminComponents {
  export interface ControlPanelProps {
    gameState: GameState;
    currentQuestion?: Question;
    onAction: (action: AdminAction) => void;
    isLoading?: boolean;
  }
  
  export interface UserTableProps {
    users: User[];
    onEdit?: (userId: string) => void;
    onDelete?: (userId: string) => void;
    onGenerateQR?: (userId: string) => void;
  }
  
  export interface QuestionFormProps {
    question?: Question;
    onSubmit: (data: Admin.CreateQuestionRequest) => Promise<void>;
    onCancel: () => void;
  }
  
  export interface StatisticsDashboardProps {
    statistics: Admin.StatisticsResponse;
    refreshInterval?: number;
  }
  
  export interface ActivityFeedProps {
    activities: Admin.ActivityLog[];
    maxItems?: number;
    autoRefresh?: boolean;
  }
}
```

### 3.2 フック型定義

```typescript
// types/hooks.ts

/**
 * useGameState フック
 */
export interface UseGameStateReturn {
  gameState: GameState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useAuth フック
 */
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (qrCode: string) => Promise<void>;
  logout: () => void;
  setNickname: (nickname: string) => Promise<void>;
}

/**
 * useRealtimeSubscription フック
 */
export interface UseRealtimeSubscriptionReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  subscribe: (options: SubscriptionOptions) => () => void;
  unsubscribe: (channel: string) => void;
}

/**
 * useQuiz フック
 */
export interface UseQuizReturn {
  currentQuestion: Question | null;
  choices: Choice[];
  hasAnswered: boolean;
  userAnswer?: string;
  isLoading: boolean;
  submitAnswer: (choiceId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * useRanking フック
 */
export interface UseRankingReturn {
  rankings: Quiz.RankingEntry[];
  userRank?: Quiz.UserRankInfo;
  groupStatistics: Quiz.GroupStatistics[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * useCountdown フック
 */
export interface UseCountdownReturn {
  timeLeft: number;
  isRunning: boolean;
  start: (duration: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/**
 * useLocalStorage フック
 */
export interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T) => void;
  removeValue: () => void;
}

/**
 * useDebounce フック
 */
export interface UseDebounceReturn<T> {
  debouncedValue: T;
  isPending: boolean;
}
```

## 4. ユーティリティ型

### 4.1 型ヘルパー

```typescript
// types/utils.ts

/**
 * Nullable型
 */
export type Nullable<T> = T | null;

/**
 * Optional型
 */
export type Optional<T> = T | undefined;

/**
 * DeepPartial型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * DeepReadonly型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * ValueOf型
 */
export type ValueOf<T> = T[keyof T];

/**
 * Entries型
 */
export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

/**
 * PromiseValue型
 */
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

/**
 * AsyncReturnType型
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : any;
```

### 4.2 バリデーション型

```typescript
// types/validation.ts

/**
 * バリデーションルール
 */
export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * フォームエラー
 */
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * フォーム状態
 */
export interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: { [K in keyof T]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * バリデーションスキーマ
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};
```

## 5. 型ガード

### 5.1 型ガード関数

```typescript
// types/guards.ts

/**
 * User型ガード
 */
export const isUser = (value: any): value is User => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.fullName === 'string' &&
    ['新郎友人', '新郎親族', '新婦友人', '新婦親族'].includes(value.groupType)
  );
};

/**
 * Question型ガード
 */
export const isQuestion = (value: any): value is Question => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.orderNumber === 'number' &&
    typeof value.questionText === 'string'
  );
};

/**
 * GameStatus型ガード
 */
export const isGameStatus = (value: any): value is GameStatus => {
  return [
    'waiting',
    'question_display',
    'accepting_answers',
    'closed',
    'showing_answer',
    'showing_ranking',
    'finished'
  ].includes(value);
};

/**
 * ApiError型ガード
 */
export const isApiError = (value: any): value is ApiError => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
};

/**
 * ApiResponse型ガード
 */
export const isApiResponse = <T>(
  value: any,
  dataGuard?: (data: any) => data is T
): value is ApiResponse<T> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  if (typeof value.success !== 'boolean') {
    return false;
  }
  
  if (value.success && dataGuard && !dataGuard(value.data)) {
    return false;
  }
  
  if (!value.success && !isApiError(value.error)) {
    return false;
  }
  
  return true;
};
```

## 6. 定数型

### 6.1 定数定義

```typescript
// types/constants.ts

/**
 * アプリケーション定数
 */
export const APP_CONSTANTS = {
  MAX_PARTICIPANTS: 60,
  MAX_NICKNAME_LENGTH: 20,
  MIN_NICKNAME_LENGTH: 1,
  MAX_QUESTION_TEXT_LENGTH: 500,
  MAX_CHOICE_TEXT_LENGTH: 200,
  DEFAULT_TIME_LIMIT: 30,
  MIN_TIME_LIMIT: 10,
  MAX_TIME_LIMIT: 180,
  SESSION_TIMEOUT: 86400000, // 24時間
  RECONNECT_MAX_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
} as const;

/**
 * エラーメッセージ定数
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  INVALID_QR_CODE: '無効なQRコードです',
  SESSION_EXPIRED: 'セッションの有効期限が切れました',
  ALREADY_ANSWERED: '既に回答済みです',
  QUIZ_NOT_STARTED: 'クイズはまだ開始されていません',
  NICKNAME_TOO_LONG: `ニックネームは${APP_CONSTANTS.MAX_NICKNAME_LENGTH}文字以内で入力してください`,
  NICKNAME_DUPLICATE: 'このニックネームは既に使用されています',
} as const;

/**
 * APIエンドポイント
 */
export const API_ENDPOINTS = {
  AUTH: {
    PARTICIPANT_LOGIN: '/api/auth/participant/login',
    ADMIN_LOGIN: '/api/auth/admin/login',
    SET_NICKNAME: '/api/auth/participant/nickname',
    LOGOUT: '/api/auth/logout',
  },
  QUIZ: {
    CURRENT: '/api/quiz/current',
    ANSWER: '/api/quiz/answer',
    RANKING: '/api/quiz/ranking',
  },
  ADMIN: {
    CONTROL: '/api/admin/quiz/control',
    UNDO: '/api/admin/quiz/undo',
    USERS: '/api/admin/users',
    QUESTIONS: '/api/admin/questions',
    STATISTICS: '/api/admin/statistics',
    RESET: '/api/admin/reset',
  },
} as const;

/**
 * WebSocketチャンネル
 */
export const WS_CHANNELS = {
  GAME_STATE: 'game_state_changes',
  ANSWERS: 'answers_updates',
  RANKING: 'ranking_updates',
  PRESENCE: 'presence',
  BROADCAST: 'broadcast_channel',
} as const;
```

## 7. 型エクスポート

### 7.1 インデックスファイル

```typescript
// types/index.ts

// ドメイン型
export * from './domain';
export * from './entities';

// API型
export * from './api';
export * from './websocket';

// UI型
export * from './components';
export * from './hooks';

// ユーティリティ型
export * from './utils';
export * from './validation';
export * from './guards';
export * from './constants';

// 名前空間エクスポート
export { Auth, Quiz, Admin } from './api';
export { QuizComponents, AdminComponents } from './components';
```