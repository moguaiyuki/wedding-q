import { test, expect } from '@playwright/test'

test.describe('Participant Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/participant')
  })

  test('should authenticate with QR code', async ({ page }) => {
    // QRコード入力画面の確認
    await expect(page.locator('h1')).toContainText('結婚式クイズへようこそ')
    
    // QRコード入力
    await page.fill('input[placeholder="例: WQ1234ABCDE"]', 'TEST123')
    await page.click('button:has-text("参加する")')
    
    // エラーメッセージの確認
    await expect(page.locator('text=QRコードが無効です')).toBeVisible()
  })

  test('should navigate through quiz flow', async ({ page, context }) => {
    // まず管理者として参加者を作成
    const adminPage = await context.newPage()
    await adminPage.goto('http://localhost:3000/admin')
    await adminPage.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'admin123')
    await adminPage.click('button:has-text("ログイン")')
    
    // 参加者管理画面へ
    await adminPage.goto('http://localhost:3000/admin/participants')
    await adminPage.click('button:has-text("参加者を追加")')
    await adminPage.fill('input[placeholder="山田太郎"]', 'テストユーザー')
    await adminPage.selectOption('select', 'groom')
    await adminPage.click('button:has-text("追加")')
    
    // QRコードを取得
    const qrCode = await adminPage.locator('td:has-text("テストユーザー") ~ td').first().textContent()
    
    // 参加者として認証
    await page.fill('input[placeholder="例: WQ1234ABCDE"]', qrCode!)
    await page.click('button:has-text("参加する")')
    
    // 待機画面の確認
    await expect(page).toHaveURL(/.*\/participant\/waiting/)
    await expect(page.locator('text=クイズの開始をお待ちください')).toBeVisible()
    
    // 管理者がクイズを開始
    await adminPage.goto('http://localhost:3000/admin/dashboard')
    await adminPage.click('button:has-text("クイズを開始")')
    
    // 参加者画面がクイズ画面に遷移
    await expect(page).toHaveURL(/.*\/participant\/quiz/, { timeout: 10000 })
    
    // 回答を選択
    await page.click('button:has-text("選択肢")', { timeout: 10000 })
    await page.click('button:has-text("回答を送信")')
    
    // 結果待機画面
    await expect(page.locator('text=回答を送信しました')).toBeVisible()
    
    // クリーンアップ
    await adminPage.close()
  })

  test('should handle network disconnection gracefully', async ({ page, context }) => {
    // 認証後の画面へ
    // ... (認証処理は上記と同様)
    
    // ネットワークを切断
    await context.setOffline(true)
    
    // オフライン通知の確認
    await expect(page.locator('text=オフライン')).toBeVisible({ timeout: 5000 })
    
    // ネットワークを復元
    await context.setOffline(false)
    
    // 再接続通知の確認
    await expect(page.locator('text=オンライン')).toBeVisible({ timeout: 10000 })
  })

  test('should persist session on reload', async ({ page }) => {
    // 認証
    // ... (認証処理)
    
    // ページリロード
    await page.reload()
    
    // セッションが保持されていることを確認
    await expect(page).not.toHaveURL(/.*\/participant$/)
  })

  test('should prevent duplicate answers', async ({ page, context }) => {
    // 2つのブラウザタブで同じユーザーとして参加
    const page2 = await context.newPage()
    
    // 両方で認証
    // ... (認証処理)
    
    // 両方から同時に回答を送信
    await Promise.all([
      page.click('button:has-text("回答を送信")'),
      page2.click('button:has-text("回答を送信")')
    ])
    
    // 片方でエラーメッセージが表示されることを確認
    const hasError = await Promise.race([
      page.locator('text=既に回答済み').isVisible().catch(() => false),
      page2.locator('text=既に回答済み').isVisible().catch(() => false)
    ])
    
    expect(hasError).toBeTruthy()
  })

  test('should update nickname successfully', async ({ page }) => {
    // 認証後、プロフィール画面へ
    await page.goto('http://localhost:3000/participant/profile')
    
    // ニックネーム設定
    await page.fill('input[placeholder="20文字以内"]', 'テストニックネーム')
    await page.click('button:has-text("保存")')
    
    // 成功メッセージ
    await expect(page.locator('text=保存しました')).toBeVisible()
    
    // 絵文字を含むニックネームは拒否
    await page.fill('input[placeholder="20文字以内"]', 'テスト😀')
    await page.click('button:has-text("保存")')
    await expect(page.locator('text=絵文字は使用できません')).toBeVisible()
  })
})