# セキュリティ設計

## 概要
結婚式クイズアプリのセキュリティ設計を定義します。個人情報保護、不正アクセス防止、データ保護を重視した設計とします。

## セキュリティ要件

### 1. 認証・認可

#### QRコード認証
```typescript
// QRコードの構造
interface QRCodeData {
  userId: string;        // UUID v4
  eventId: string;       // イベント識別子
  timestamp: number;     // 発行日時
  signature: string;     // HMAC署名
}

// QRコード検証
async function validateQRCode(qrData: string): Promise<boolean> {
  try {
    const data = JSON.parse(decodeURIComponent(qrData));
    
    // 署名検証
    const expectedSignature = await generateHMAC(
      `${data.userId}:${data.eventId}:${data.timestamp}`,
      process.env.QR_SECRET_KEY!
    );
    
    if (data.signature !== expectedSignature) {
      return false;
    }
    
    // 有効期限チェック（イベント当日のみ有効）
    const eventDate = new Date(data.timestamp);
    const today = new Date();
    if (!isSameDay(eventDate, today)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

#### 管理者認証
```typescript
// 管理者認証フロー
interface AdminAuth {
  validatePassword(password: string): boolean;
  generateSession(): string;
  validateSession(token: string): boolean;
}

class AdminAuthService implements AdminAuth {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15分
  private attempts = new Map<string, number>();
  private lockouts = new Map<string, number>();
  
  validatePassword(password: string, ip: string): boolean {
    // ロックアウトチェック
    if (this.isLockedOut(ip)) {
      throw new Error('Too many attempts. Please try again later.');
    }
    
    // パスワード検証
    const isValid = password === process.env.ADMIN_PASSWORD;
    
    if (!isValid) {
      this.recordFailedAttempt(ip);
    } else {
      this.clearAttempts(ip);
    }
    
    return isValid;
  }
  
  private isLockedOut(ip: string): boolean {
    const lockoutTime = this.lockouts.get(ip);
    if (!lockoutTime) return false;
    
    if (Date.now() - lockoutTime > this.LOCKOUT_DURATION) {
      this.lockouts.delete(ip);
      this.attempts.delete(ip);
      return false;
    }
    
    return true;
  }
}
```

### 2. データ保護

#### 個人情報の扱い
```typescript
// 個人情報の最小化
interface ParticipantData {
  id: string;           // 内部ID（UUID）
  displayName: string;  // 表示名（ニックネーム可）
  group: 'bride' | 'groom';
  tableNumber?: number;
  // メールアドレス、電話番号は保存しない
}

// データの暗号化
class DataEncryption {
  // 保存時の暗号化（必要に応じて）
  static encrypt(data: string): string {
    // Supabaseの暗号化機能を利用
    return data; // Supabaseが自動的に暗号化
  }
  
  // セッションストレージの暗号化
  static encryptSession(data: any): string {
    const json = JSON.stringify(data);
    // Base64エンコード（簡易的な難読化）
    return btoa(encodeURIComponent(json));
  }
  
  static decryptSession(encrypted: string): any {
    try {
      const json = decodeURIComponent(atob(encrypted));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
```

#### データ削除ポリシー
```typescript
// イベント終了後の自動削除
interface DataRetentionPolicy {
  retentionDays: number;
  deletePersonalData(): Promise<void>;
  archiveEventData(): Promise<void>;
}

class EventDataManager implements DataRetentionPolicy {
  retentionDays = 7; // イベント後7日間保持
  
  async deletePersonalData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    // 個人を特定できる情報を削除
    await supabase
      .from('users')
      .update({ 
        name: 'Deleted User',
        qr_code: null 
      })
      .lt('created_at', cutoffDate.toISOString());
    
    // セッション情報を削除
    await supabase
      .from('user_sessions')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
  }
  
  async archiveEventData(): Promise<void> {
    // 統計データのみを保存
    const stats = await this.generateEventStatistics();
    await supabase
      .from('event_archives')
      .insert({
        event_date: new Date(),
        total_participants: stats.participants,
        average_score: stats.averageScore,
        // 個人を特定できない集計データのみ
      });
  }
}
```

### 3. 通信セキュリティ

#### HTTPS強制
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 本番環境でHTTPS強制
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }
  
  // セキュリティヘッダー追加
  const response = NextResponse.next();
  
  // CSPヘッダー
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' wss://*.supabase.co https://*.supabase.co;"
  );
  
  // その他のセキュリティヘッダー
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
```

### 4. 入力検証とサニタイゼーション

#### 入力検証
```typescript
// バリデーションルール
class InputValidator {
  // 名前の検証（日本語対応）
  static validateName(name: string): boolean {
    if (!name || name.length > 100) return false;
    
    // XSS攻撃パターンのチェック
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /<iframe/i,
      /<embed/i,
      /<object/i
    ];
    
    return !xssPatterns.some(pattern => pattern.test(name));
  }
  
  // 回答の検証
  static validateAnswer(answer: number, choices: number[]): boolean {
    return choices.includes(answer);
  }
  
  // QRコードデータの検証
  static validateQRData(data: string): boolean {
    try {
      // 長さチェック
      if (data.length > 500) return false;
      
      // JSON構造チェック
      const parsed = JSON.parse(decodeURIComponent(data));
      
      // 必須フィールドチェック
      return !!(
        parsed.userId &&
        parsed.eventId &&
        parsed.timestamp &&
        parsed.signature
      );
    } catch {
      return false;
    }
  }
}

// サニタイゼーション
class Sanitizer {
  // HTMLエスケープ
  static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, char => map[char]);
  }
  
  // 表示用テキストのサニタイズ
  static sanitizeDisplayText(text: string): string {
    // 制御文字の除去
    let sanitized = text.replace(/[\x00-\x1F\x7F]/g, '');
    
    // HTMLエスケープ
    sanitized = this.escapeHtml(sanitized);
    
    // 長さ制限
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200) + '...';
    }
    
    return sanitized;
  }
}
```

### 5. レート制限

#### API レート制限
```typescript
// レート制限の実装
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly MAX_REQUESTS = 100;
  private readonly TIME_WINDOW = 60000; // 1分
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // 古いリクエストを削除
    const recentRequests = userRequests.filter(
      time => now - time < this.TIME_WINDOW
    );
    
    if (recentRequests.length >= this.MAX_REQUESTS) {
      return false;
    }
    
    // リクエストを記録
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
}

// API ルートでの使用
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!rateLimiter.isAllowed(ip)) {
    return new Response('Too many requests', { status: 429 });
  }
  
  // 通常の処理
}
```

### 6. エラーハンドリング

#### セキュアなエラーメッセージ
```typescript
// エラーメッセージの管理
class SecureErrorHandler {
  // 内部エラーを外部向けメッセージに変換
  static getPublicMessage(error: Error): string {
    // ログには詳細を記録
    console.error('Internal error:', error);
    
    // ユーザーには一般的なメッセージを返す
    const errorMap: Record<string, string> = {
      'AUTH_FAILED': '認証に失敗しました',
      'INVALID_QR': 'QRコードが無効です',
      'SESSION_EXPIRED': 'セッションが期限切れです',
      'RATE_LIMITED': 'リクエストが多すぎます。しばらくお待ちください'
    };
    
    return errorMap[error.message] || 'エラーが発生しました';
  }
  
  // ログ記録（個人情報は除外）
  static logError(error: Error, context: any): void {
    const sanitizedContext = {
      ...context,
      // 個人情報を除外
      name: undefined,
      email: undefined,
      qrCode: undefined
    };
    
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      context: sanitizedContext,
      timestamp: new Date().toISOString()
    });
  }
}
```

## セキュリティチェックリスト

### デプロイ前確認事項
- [ ] HTTPS が有効になっている
- [ ] 環境変数が適切に設定されている
- [ ] 管理者パスワードが十分に強力
- [ ] CSPヘッダーが設定されている
- [ ] レート制限が有効
- [ ] エラーメッセージに機密情報が含まれていない
- [ ] ログに個人情報が記録されていない
- [ ] QRコード署名キーが設定されている

### 運用時の確認事項
- [ ] 不正アクセスの監視
- [ ] エラーログの定期確認
- [ ] イベント終了後のデータ削除
- [ ] セキュリティアップデートの適用

## インシデント対応

### 対応フロー
1. **検知**: エラーログ、アラートで異常を検知
2. **評価**: 影響範囲と重要度を評価
3. **封じ込め**: 必要に応じてアクセス制限
4. **調査**: ログ分析で原因特定
5. **復旧**: 修正とサービス復旧
6. **報告**: 必要に応じて関係者に報告