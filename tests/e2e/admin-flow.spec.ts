import { test, expect } from '@playwright/test'

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者ログイン
    await page.goto('http://localhost:3000/admin')
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'admin123')
    await page.click('button:has-text("ログイン")')
    await expect(page).toHaveURL(/.*\/admin\/dashboard/)
  })

  test('should manage game flow', async ({ page }) => {
    // クイズを開始
    await page.click('button:has-text("クイズを開始")')
    await expect(page.locator('text=question_presentation')).toBeVisible()
    
    // 回答を締め切る
    await page.click('button:has-text("回答を締め切る")')
    await expect(page.locator('text=answer_closed')).toBeVisible()
    
    // 正解を表示
    await page.click('button:has-text("正解を表示")')
    await expect(page.locator('text=result_presentation')).toBeVisible()
    
    // 次の問題へ
    await page.click('button:has-text("次の問題へ")')
    await expect(page.locator('text=question_presentation')).toBeVisible()
  })

  test('should handle UNDO operations', async ({ page }) => {
    // クイズを開始
    await page.click('button:has-text("クイズを開始")')
    
    // 回答を締め切る
    await page.click('button:has-text("回答を締め切る")')
    
    // UNDO実行
    await page.click('button:has-text("元に戻す")')
    
    // 状態が戻っていることを確認
    await expect(page.locator('text=question_presentation')).toBeVisible()
    await expect(page.locator('button:has-text("回答を締め切る")')).toBeVisible()
  })

  test('should manage questions', async ({ page }) => {
    // 問題管理画面へ
    await page.goto('http://localhost:3000/admin/questions')
    
    // 問題を追加
    await page.click('button:has-text("問題を追加")')
    
    // フォーム入力
    await page.fill('input[type="number"][min="1"]', '1')
    await page.fill('textarea', 'テスト問題: 新郎新婦が初めて出会った場所は？')
    await page.selectOption('select', 'multiple_choice')
    await page.fill('input[type="number"][min="10"]', '30')
    await page.fill('input[type="number"][min="1"][max="100"]', '10')
    
    // 選択肢を入力
    const choices = ['東京', '大阪', '名古屋', '福岡']
    const choiceInputs = await page.locator('input[placeholder*="選択肢"]').all()
    for (let i = 0; i < choices.length && i < choiceInputs.length; i++) {
      await choiceInputs[i].fill(choices[i])
    }
    
    // 正解を選択
    await page.click('input[type="radio"]', { nth: 0 })
    
    // 解説を追加
    await page.fill('textarea[placeholder="正解発表時に表示される解説"]', '二人は東京の職場で出会いました')
    
    // 保存
    await page.click('button:has-text("問題を追加")', { nth: -1 })
    
    // 問題が追加されたことを確認
    await expect(page.locator('text=テスト問題')).toBeVisible()
  })

  test('should manage participants', async ({ page }) => {
    // 参加者管理画面へ
    await page.goto('http://localhost:3000/admin/participants')
    
    // 参加者を追加
    await page.click('button:has-text("参加者を追加")')
    await page.fill('input[placeholder="山田太郎"]', '山田花子')
    await page.selectOption('select', 'bride')
    await page.click('button:has-text("追加")', { nth: -1 })
    
    // 参加者が追加されたことを確認
    await expect(page.locator('text=山田花子')).toBeVisible()
    
    // QRコードが生成されたことを確認
    await expect(page.locator('text=/WQ[A-Z0-9]+/')).toBeVisible()
    
    // 一括追加
    await page.click('button:has-text("CSVで一括追加")')
    await page.fill('textarea', '佐藤太郎,groom_friend\n鈴木花子,bride_friend')
    await page.click('button:has-text("一括追加")')
    
    // 複数の参加者が追加されたことを確認
    await expect(page.locator('text=佐藤太郎')).toBeVisible()
    await expect(page.locator('text=鈴木花子')).toBeVisible()
  })

  test('should handle data management', async ({ page }) => {
    // データ管理画面へ
    await page.goto('http://localhost:3000/admin/data')
    
    // 統計情報が表示されることを確認
    await expect(page.locator('text=登録参加者数')).toBeVisible()
    await expect(page.locator('text=登録問題数')).toBeVisible()
    
    // データ初期化（確認ダイアログをモック）
    page.on('dialog', dialog => dialog.accept())
    await page.click('button:has-text("回答データをクリア")')
    
    // 成功メッセージ
    await expect(page.locator('text=クリアしました')).toBeVisible()
  })

  test('should export final results', async ({ page }) => {
    // 最終結果画面へ
    await page.goto('http://localhost:3000/admin/results')
    
    // ランキングが表示されることを確認
    await expect(page.locator('text=総合ランキング')).toBeVisible()
    await expect(page.locator('text=問題ごとの統計')).toBeVisible()
    
    // CSVダウンロード
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("CSVダウンロード")')
    const download = await downloadPromise
    
    // ファイル名の確認
    expect(download.suggestedFilename()).toMatch(/quiz_results_.*\.csv/)
  })

  test('should upload images for questions', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/questions')
    await page.click('button:has-text("問題を追加")')
    
    // 画像アップロード
    const fileInput = await page.locator('input[type="file"]').first()
    await fileInput.setInputFiles('./tests/fixtures/test-image.jpg')
    
    // アップロード完了を待つ
    await expect(page.locator('text=アップロード中')).toBeHidden({ timeout: 10000 })
    
    // 画像プレビューが表示されることを確認
    await expect(page.locator('img[alt="アップロード画像"]')).toBeVisible()
  })
})