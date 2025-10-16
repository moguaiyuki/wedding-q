// Quick test script to check ranking API
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to API responses
  page.on('response', async (response) => {
    if (response.url().includes('/api/stats/ranking')) {
      console.log('Ranking API Response:', response.status());
      try {
        const data = await response.json();
        console.log('Ranking data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Could not parse JSON:', e.message);
      }
    }
  });

  // Go to participant page
  await page.goto('http://localhost:3000/participant');

  console.log('Page loaded. Check console for API responses.');
  console.log('Waiting 30 seconds for you to login and navigate...');

  await page.waitForTimeout(30000);

  await browser.close();
})();
