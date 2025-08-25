# テスト戦略書 - 結婚式クイズアプリ

## 1. テスト戦略概要

### 1.1 テストピラミッド

```
         /\
        /  \  E2E Tests (10%)
       /    \  - 主要シナリオ
      /------\ Integration Tests (30%)
     /        \ - API統合テスト
    /          \ - DB連携テスト
   /------------\ Unit Tests (60%)
  /              \ - コンポーネント
 /                \ - ビジネスロジック
/------------------\ - ユーティリティ
```

### 1.2 テスト目標

| 指標 | 目標値 | 現在値 | 説明 |
|------|--------|--------|------|
| **コードカバレッジ** | 80%以上 | - | 全体のテストカバレッジ |
| **クリティカルパス** | 100% | - | 回答送信、認証など重要機能 |
| **レスポンス時間** | 3秒以内 | - | 95パーセンタイル |
| **同時接続** | 60名 | - | 本番想定の負荷テスト |

## 2. ユニットテスト

### 2.1 テスト環境設定

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// ポリフィル
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// モック設定
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Next.js Router モック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));
```

### 2.2 コンポーネントテスト

```typescript
// __tests__/components/QuizQuestion.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizQuestion } from '@/components/quiz/QuizQuestion';
import { mockQuestion, mockChoices } from '@/__tests__/fixtures';

describe('QuizQuestion', () => {
  const defaultProps = {
    question: mockQuestion,
    choices: mockChoices,
    onAnswer: jest.fn(),
    isAnswering: false,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('問題文と選択肢を正しく表示する', () => {
    render(<QuizQuestion {...defaultProps} />);
    
    // 問題文の表示確認
    expect(screen.getByText(mockQuestion.questionText)).toBeInTheDocument();
    
    // 全選択肢の表示確認
    mockChoices.forEach(choice => {
      if (choice.choiceText) {
        expect(screen.getByText(choice.choiceText)).toBeInTheDocument();
      }
    });
  });
  
  it('選択肢クリックで回答が送信される', async () => {
    render(<QuizQuestion {...defaultProps} />);
    
    const firstChoice = screen.getByText(mockChoices[0].choiceText!);
    fireEvent.click(firstChoice);
    
    await waitFor(() => {
      expect(defaultProps.onAnswer).toHaveBeenCalledWith(mockChoices[0].id);
    });
  });
  
  it('回答中は選択肢がdisabledになる', () => {
    render(<QuizQuestion {...defaultProps} isAnswering={true} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
  
  it('画像付き問題を正しく表示する', () => {
    const questionWithImage = {
      ...mockQuestion,
      questionImageUrl: 'https://example.com/image.jpg',
    };
    
    render(<QuizQuestion {...defaultProps} question={questionWithImage} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', questionWithImage.questionImageUrl);
  });
  
  it('回答済みの場合は結果を表示する', () => {
    render(
      <QuizQuestion 
        {...defaultProps} 
        hasAnswered={true}
        userAnswer={mockChoices[0].id}
        showResult={true}
      />
    );
    
    // 正解マークの表示確認
    const correctChoice = mockChoices.find(c => c.isCorrect);
    const correctElement = screen.getByTestId(`choice-${correctChoice?.id}`);
    expect(correctElement).toHaveClass('bg-green-200');
  });
});
```

### 2.3 フックのテスト

```typescript
// __tests__/hooks/useGameState.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameState } from '@/hooks/useGameState';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useGameState', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
      channel: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
      unsubscribe: jest.fn(),
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });
  
  it('初期状態を正しく取得する', async () => {
    const mockGameState = {
      id: '1',
      status: 'waiting',
      currentQuestionId: null,
    };
    
    mockSupabase.single.mockResolvedValue({ 
      data: mockGameState, 
      error: null 
    });
    
    const { result } = renderHook(() => useGameState());
    
    await waitFor(() => {
      expect(result.current.gameState).toEqual(mockGameState);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('リアルタイム更新を受信する', async () => {
    const { result } = renderHook(() => useGameState());
    
    // リアルタイム更新をシミュレート
    const mockCallback = mockSupabase.on.mock.calls[0][2];
    const newGameState = {
      status: 'accepting_answers',
      currentQuestionId: 'q1',
    };
    
    act(() => {
      mockCallback({ new: newGameState });
    });
    
    await waitFor(() => {
      expect(result.current.gameState.status).toBe('accepting_answers');
    });
  });
  
  it('エラー時にエラー状態を設定する', async () => {
    const mockError = new Error('Failed to fetch');
    mockSupabase.single.mockResolvedValue({ 
      data: null, 
      error: mockError 
    });
    
    const { result } = renderHook(() => useGameState());
    
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('アンマウント時にunsubscribeする', () => {
    const { unmount } = renderHook(() => useGameState());
    
    unmount();
    
    expect(mockSupabase.unsubscribe).toHaveBeenCalled();
  });
});
```

## 3. 統合テスト

### 3.1 API統合テスト

```typescript
// __tests__/api/quiz.integration.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/quiz/answer/route';
import { createClient } from '@supabase/supabase-js';

// 実際のSupabaseテスト環境を使用
const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!
);

describe('API: /api/quiz/answer', () => {
  let testUserId: string;
  let testQuestionId: string;
  let testChoiceId: string;
  
  beforeAll(async () => {
    // テストデータ準備
    const { data: user } = await supabase
      .from('users')
      .insert({ 
        full_name: 'テストユーザー',
        group_type: '新郎友人',
        qr_code: 'TEST_QR_001'
      })
      .select()
      .single();
    testUserId = user.id;
    
    const { data: question } = await supabase
      .from('questions')
      .insert({
        order_number: 1,
        question_text: 'テスト問題',
      })
      .select()
      .single();
    testQuestionId = question.id;
    
    const { data: choice } = await supabase
      .from('choices')
      .insert({
        question_id: testQuestionId,
        choice_text: 'テスト選択肢',
        is_correct: true,
        display_order: 1,
      })
      .select()
      .single();
    testChoiceId = choice.id;
  });
  
  afterAll(async () => {
    // テストデータクリーンアップ
    await supabase.from('answers').delete().eq('user_id', testUserId);
    await supabase.from('choices').delete().eq('question_id', testQuestionId);
    await supabase.from('questions').delete().eq('id', testQuestionId);
    await supabase.from('users').delete().eq('id', testUserId);
  });
  
  it('正常に回答を送信できる', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: {
        questionId: testQuestionId,
        choiceId: testChoiceId,
      },
    });
    
    // セッション設定
    req.cookies = { session: 'valid_test_session' };
    
    await handler(req as any, res as any);
    
    expect(res._getStatusCode()).toBe(200);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(true);
    expect(jsonData.data.accepted).toBe(true);
    
    // DBに保存されたか確認
    const { data: answer } = await supabase
      .from('answers')
      .select()
      .eq('user_id', testUserId)
      .eq('question_id', testQuestionId)
      .single();
    
    expect(answer).toBeTruthy();
    expect(answer.choice_id).toBe(testChoiceId);
    expect(answer.is_correct).toBe(true);
  });
  
  it('重複回答を拒否する', async () => {
    // 1回目の回答
    await supabase.from('answers').insert({
      user_id: testUserId,
      question_id: testQuestionId,
      choice_id: testChoiceId,
      is_correct: true,
    });
    
    // 2回目の回答試行
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        questionId: testQuestionId,
        choiceId: testChoiceId,
      },
    });
    
    await handler(req as any, res as any);
    
    expect(res._getStatusCode()).toBe(409);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.error.code).toBe('ALREADY_ANSWERED');
  });
});
```

### 3.2 Realtime統合テスト

```typescript
// __tests__/realtime/gameState.integration.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Realtime: Game State Sync', () => {
  let adminClient: any;
  let participantClient: any;
  let gameStateUpdates: any[] = [];
  
  beforeAll(async () => {
    // 管理者クライアント
    adminClient = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_SERVICE_KEY!
    );
    
    // 参加者クライアント
    participantClient = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_ANON_KEY!
    );
    
    // リアルタイム購読
    participantClient
      .channel('game_state_test')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state',
      }, (payload: any) => {
        gameStateUpdates.push(payload);
      })
      .subscribe();
  });
  
  afterAll(async () => {
    await participantClient.removeAllChannels();
  });
  
  it('ゲーム状態の更新が全クライアントに伝播する', async () => {
    // 管理者が状態を更新
    await adminClient
      .from('game_state')
      .update({ status: 'accepting_answers' })
      .eq('id', 'test_game_id');
    
    // 更新が伝播するまで待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新を受信したか確認
    const update = gameStateUpdates.find(
      u => u.new?.status === 'accepting_answers'
    );
    expect(update).toBeTruthy();
  });
  
  it('複数の参加者が同時に接続できる', async () => {
    const clients = [];
    const connectionPromises = [];
    
    // 60クライアント同時接続
    for (let i = 0; i < 60; i++) {
      const client = createClient(
        process.env.TEST_SUPABASE_URL!,
        process.env.TEST_SUPABASE_ANON_KEY!
      );
      
      clients.push(client);
      
      const promise = new Promise((resolve) => {
        client
          .channel(`participant_${i}`)
          .on('presence', { event: 'sync' }, () => resolve(true))
          .subscribe();
      });
      
      connectionPromises.push(promise);
    }
    
    // 全接続完了を待つ
    const results = await Promise.all(connectionPromises);
    expect(results.every(r => r === true)).toBe(true);
    
    // クリーンアップ
    clients.forEach(c => c.removeAllChannels());
  });
});
```

## 4. E2Eテスト

### 4.1 Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 E2Eテストシナリオ

```typescript
// e2e/participant-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('参加者フロー', () => {
  test('QRコードログインから回答送信まで', async ({ page }) => {
    // 1. トップページアクセス
    await page.goto('/');
    
    // 2. QRコード入力（カメラ使用せずID直接入力）
    await page.fill('[data-testid="qr-input"]', 'TEST_QR_001');
    await page.click('[data-testid="login-button"]');
    
    // 3. ログイン確認画面
    await expect(page).toHaveURL('/participant/login');
    await expect(page.locator('[data-testid="user-name"]')).toContainText('テストユーザー1');
    
    // 4. ニックネーム設定
    await page.fill('[data-testid="nickname-input"]', 'テストニックネーム');
    await page.click('[data-testid="confirm-button"]');
    
    // 5. 待機画面
    await expect(page).toHaveURL('/participant/waiting');
    await expect(page.locator('text=クイズ開始をお待ちください')).toBeVisible();
    
    // 6. クイズ開始（管理者操作をシミュレート）
    await page.evaluate(() => {
      // Supabaseのゲーム状態を直接更新
      window.testHelpers.startQuiz();
    });
    
    // 7. 問題画面に自動遷移
    await expect(page).toHaveURL('/participant/quiz');
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
    
    // 8. 回答選択
    await page.click('[data-testid="choice-1"]');
    
    // 9. 回答済み画面
    await expect(page.locator('text=回答を送信しました')).toBeVisible();
    
    // 10. 結果発表
    await page.evaluate(() => {
      window.testHelpers.revealAnswer();
    });
    
    await expect(page).toHaveURL('/participant/result');
    await expect(page.locator('[data-testid="result-display"]')).toBeVisible();
  });
  
  test('接続復帰テスト', async ({ page, context }) => {
    // ログイン
    await page.goto('/');
    await page.fill('[data-testid="qr-input"]', 'TEST_QR_002');
    await page.click('[data-testid="login-button"]');
    
    // ネットワーク切断
    await context.setOffline(true);
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // 再接続
    await context.setOffline(false);
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    
    // 状態が復元されているか確認
    await expect(page.locator('[data-testid="user-name"]')).toContainText('テストユーザー2');
  });
});

// e2e/admin-flow.spec.ts
test.describe('管理者フロー', () => {
  test('クイズ進行管理', async ({ page }) => {
    // 管理者ログイン
    await page.goto('/admin/login');
    await page.fill('[data-testid="password-input"]', process.env.ADMIN_PASSWORD!);
    await page.click('[data-testid="login-button"]');
    
    // ダッシュボード
    await expect(page).toHaveURL('/admin/dashboard');
    
    // クイズ運営画面へ
    await page.click('[data-testid="nav-control"]');
    await expect(page).toHaveURL('/admin/control');
    
    // クイズ開始
    await page.click('[data-testid="start-quiz"]');
    await expect(page.locator('[data-testid="status"]')).toContainText('accepting_answers');
    
    // 回答締切
    await page.click('[data-testid="close-answers"]');
    await expect(page.locator('[data-testid="status"]')).toContainText('closed');
    
    // 正解発表
    await page.click('[data-testid="reveal-answer"]');
    await expect(page.locator('[data-testid="status"]')).toContainText('showing_answer');
    
    // UNDO機能
    await page.click('[data-testid="undo-button"]');
    await expect(page.locator('[data-testid="status"]')).toContainText('closed');
  });
});
```

## 5. パフォーマンステスト

### 5.1 負荷テスト (k6)

```javascript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 60 },  // 60ユーザーまで増加
    { duration: '5m', target: 60 },  // 60ユーザー維持
    { duration: '2m', target: 0 },   // 0まで減少
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95%が3秒以内
    errors: ['rate<0.05'],              // エラー率5%未満
    http_req_failed: ['rate<0.05'],     // 失敗率5%未満
  },
};

export default function () {
  const userId = `user_${__VU}`;
  const qrCode = `TEST_QR_${String(__VU).padStart(3, '0')}`;
  
  // ログイン
  const loginRes = http.post(
    'http://localhost:3000/api/auth/participant/login',
    JSON.stringify({ qrCode }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  errorRate.add(loginRes.status !== 200);
  
  if (loginRes.status === 200) {
    const sessionToken = loginRes.json('data.sessionToken');
    
    // 現在の問題取得
    const quizRes = http.get('http://localhost:3000/api/quiz/current', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    
    check(quizRes, {
      'quiz fetched': (r) => r.status === 200,
    });
    
    if (quizRes.status === 200) {
      const question = quizRes.json('data.question');
      
      if (question && question.choices) {
        // ランダムに選択肢を選んで回答
        const randomChoice = question.choices[Math.floor(Math.random() * question.choices.length)];
        
        const answerRes = http.post(
          'http://localhost:3000/api/quiz/answer',
          JSON.stringify({
            questionId: question.id,
            choiceId: randomChoice.id,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`,
            },
          }
        );
        
        check(answerRes, {
          'answer submitted': (r) => r.status === 200 || r.status === 409,
        });
      }
    }
  }
  
  sleep(1);
}
```

### 5.2 Lighthouse CI

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/participant/quiz',
        'http://localhost:3000/admin/dashboard',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## 6. テストデータ管理

### 6.1 フィクスチャ

```typescript
// __tests__/fixtures/index.ts
export const mockUser = {
  id: 'user_001',
  fullName: '山田太郎',
  nickname: 'やまちゃん',
  groupType: '新郎友人' as const,
  qrCode: 'QR_001',
  totalScore: 3,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockQuestion = {
  id: 'q_001',
  orderNumber: 1,
  questionText: '新郎の出身地はどこでしょう？',
  questionImageUrl: null,
  explanationText: '新郎は東京都出身です。',
  explanationImageUrl: null,
  timeLimit: 30,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockChoices = [
  {
    id: 'c_001',
    questionId: 'q_001',
    choiceText: '東京',
    choiceImageUrl: null,
    isCorrect: true,
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c_002',
    questionId: 'q_001',
    choiceText: '大阪',
    choiceImageUrl: null,
    isCorrect: false,
    displayOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
  },
  // ... 他の選択肢
];

export const mockGameState = {
  id: 'game_001',
  currentQuestionId: 'q_001',
  status: 'accepting_answers' as const,
  lastAction: 'start',
  metadata: {},
  updatedAt: '2024-01-01T00:00:00Z',
};

// ファクトリー関数
export const createMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockUser,
    id: `user_${String(i + 1).padStart(3, '0')}`,
    fullName: `テストユーザー${i + 1}`,
    qrCode: `QR_${String(i + 1).padStart(3, '0')}`,
  }));
};
```

### 6.2 テストヘルパー

```typescript
// __tests__/helpers/index.ts
import { createClient } from '@supabase/supabase-js';

export class TestHelper {
  private supabase: any;
  
  constructor() {
    this.supabase = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_SERVICE_KEY!
    );
  }
  
  async setupTestData() {
    // テストデータ初期化
    await this.cleanupTestData();
    
    // ユーザー作成
    const users = createMockUsers(60);
    await this.supabase.from('users').insert(users);
    
    // 問題作成
    await this.supabase.from('questions').insert(mockQuestion);
    await this.supabase.from('choices').insert(mockChoices);
    
    // ゲーム状態初期化
    await this.supabase.from('game_state').insert({
      status: 'waiting',
      metadata: {},
    });
  }
  
  async cleanupTestData() {
    // テストデータ削除
    await this.supabase.from('answers').delete().neq('id', '0');
    await this.supabase.from('user_sessions').delete().neq('id', '0');
    await this.supabase.from('choices').delete().neq('id', '0');
    await this.supabase.from('questions').delete().neq('id', '0');
    await this.supabase.from('users').delete().neq('id', '0');
  }
  
  async simulateUserAnswer(userId: string, choiceId: string) {
    const { data: choice } = await this.supabase
      .from('choices')
      .select('*, questions(*)')
      .eq('id', choiceId)
      .single();
    
    return this.supabase.from('answers').insert({
      user_id: userId,
      question_id: choice.question_id,
      choice_id: choiceId,
      is_correct: choice.is_correct,
    });
  }
  
  async changeGameState(status: string) {
    return this.supabase
      .from('game_state')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', 'game_001');
  }
}

// グローバルテストヘルパー
export const testHelper = new TestHelper();
```

## 7. CI/CDパイプライン

### 7.1 GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase
        run: |
          npm install -g supabase
          supabase init
          supabase db reset
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_SERVICE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
  
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          npm run build
          npm run start &
          sleep 10
          lhci autorun
```

### 7.2 テスト実行スクリプト

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__/.*\\.test\\.ts",
    "test:integration": "jest --testPathPattern=__tests__/.*\\.integration\\.test\\.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:load": "k6 run performance/load-test.js",
    "test:lighthouse": "lhci autorun",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```