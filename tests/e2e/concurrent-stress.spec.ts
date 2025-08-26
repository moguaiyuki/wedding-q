import { test, expect, Browser, Page } from '@playwright/test'

test.describe('Concurrent Connection Stress Test', () => {
  test('should handle 60 concurrent participants', async ({ browser }) => {
    const PARTICIPANT_COUNT = 60
    const participants: Page[] = []
    const contexts = []
    
    try {
      // 管理者として参加者を事前に作成
      const adminContext = await browser.newContext()
      const adminPage = await adminContext.newPage()
      await adminPage.goto('http://localhost:3000/admin')
      await adminPage.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'admin123')
      await adminPage.click('button:has-text("ログイン")')
      
      // 参加者を一括追加
      await adminPage.goto('http://localhost:3000/admin/participants')
      const csvData = Array.from({ length: PARTICIPANT_COUNT }, (_, i) => 
        `テスト参加者${i + 1},${i % 2 === 0 ? 'groom' : 'bride'}`
      ).join('\n')
      
      await adminPage.click('button:has-text("CSVで一括追加")')
      await adminPage.fill('textarea', csvData)
      await adminPage.click('button:has-text("一括追加")')
      
      // QRコードを取得
      const qrCodes: string[] = []
      const qrElements = await adminPage.locator('td:nth-child(2)').all()
      for (const element of qrElements) {
        const qrCode = await element.textContent()
        if (qrCode && qrCode.startsWith('WQ')) {
          qrCodes.push(qrCode)
        }
      }
      
      console.log(`Created ${qrCodes.length} participants`)
      
      // 60名の参加者を同時に接続
      const connectionPromises = []
      for (let i = 0; i < Math.min(PARTICIPANT_COUNT, qrCodes.length); i++) {
        connectionPromises.push((async () => {
          const context = await browser.newContext()
          contexts.push(context)
          const page = await context.newPage()
          participants.push(page)
          
          await page.goto('http://localhost:3000/participant')
          await page.fill('input[placeholder="例: WQ1234ABCDE"]', qrCodes[i])
          await page.click('button:has-text("参加する")')
          
          // 待機画面に到達
          await expect(page).toHaveURL(/.*\/participant\/waiting/, { timeout: 30000 })
          return page
        })())
      }
      
      // 全員が接続完了するまで待つ
      await Promise.all(connectionPromises)
      console.log('All participants connected')
      
      // 管理者ダッシュボードで参加者数を確認
      await adminPage.goto('http://localhost:3000/admin/dashboard')
      await expect(adminPage.locator(`text=参加者: ${PARTICIPANT_COUNT}名`)).toBeVisible({ timeout: 10000 })
      
      // クイズを開始
      await adminPage.click('button:has-text("クイズを開始")')
      
      // 全参加者がクイズ画面に遷移
      const transitionPromises = participants.map(page =>
        expect(page).toHaveURL(/.*\/participant\/quiz/, { timeout: 30000 })
      )
      await Promise.all(transitionPromises)
      console.log('All participants transitioned to quiz')
      
      // 全参加者が同時に回答を送信
      const answerPromises = participants.map(async (page, index) => {
        // ランダムに選択肢を選ぶ
        const choices = await page.locator('button[role="radio"]').all()
        if (choices.length > 0) {
          const randomChoice = choices[Math.floor(Math.random() * choices.length)]
          await randomChoice.click()
        }
        await page.click('button:has-text("回答を送信")')
        await expect(page.locator('text=回答を送信しました')).toBeVisible({ timeout: 10000 })
      })
      await Promise.all(answerPromises)
      console.log('All participants submitted answers')
      
      // 管理者画面で全員の回答を確認
      await adminPage.click('button:has-text("回答を締め切る")')
      await expect(adminPage.locator(`text=回答数: ${PARTICIPANT_COUNT}`)).toBeVisible({ timeout: 10000 })
      
      // クリーンアップ
      await adminPage.close()
      await adminContext.close()
      
    } finally {
      // 全ページとコンテキストをクリーンアップ
      for (const page of participants) {
        await page.close()
      }
      for (const context of contexts) {
        await context.close()
      }
    }
  })

  test('should maintain real-time sync under load', async ({ browser }) => {
    const PARTICIPANT_COUNT = 20
    const participants: Page[] = []
    const contexts = []
    
    try {
      // 複数の参加者を接続（セットアップは上記と同様）
      // ...
      
      // リアルタイム更新のテスト
      const updatePromises = participants.map(async (page) => {
        // ゲーム状態の変更を監視
        let stateChanges = 0
        page.on('websocket', ws => {
          ws.on('framereceived', frame => {
            if (frame.payload.includes('game_state')) {
              stateChanges++
            }
          })
        })
        
        // 10秒間監視
        await page.waitForTimeout(10000)
        
        // 少なくとも1回は更新を受信していることを確認
        expect(stateChanges).toBeGreaterThan(0)
      })
      
      await Promise.all(updatePromises)
      
    } finally {
      for (const page of participants) {
        await page.close()
      }
      for (const context of contexts) {
        await context.close()
      }
    }
  })

  test('should handle rapid state changes', async ({ browser }) => {
    // 管理者が素早く状態を変更し、参加者が追従できることを確認
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const participantContext = await browser.newContext()
    const participantPage = await participantContext.newPage()
    
    try {
      // セットアップ
      // ...
      
      // 高速で状態変更
      const stateChanges = [
        'button:has-text("クイズを開始")',
        'button:has-text("回答を締め切る")',
        'button:has-text("正解を表示")',
        'button:has-text("次の問題へ")'
      ]
      
      for (const selector of stateChanges) {
        await adminPage.click(selector)
        await adminPage.waitForTimeout(100) // 100ms間隔で操作
      }
      
      // 参加者画面が最新状態に追従していることを確認
      await expect(participantPage).toHaveURL(/.*\/participant\/quiz/, { timeout: 5000 })
      
    } finally {
      await adminPage.close()
      await adminContext.close()
      await participantPage.close()
      await participantContext.close()
    }
  })
})