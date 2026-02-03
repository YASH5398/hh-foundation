const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const outputPath = path.join(__dirname, '.tmp-signup-console.json');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clickButtonByText = async (page, text) => {
  await page.evaluate((buttonText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim().includes(buttonText));
    if (!btn) throw new Error(`Button not found: ${buttonText}`);
    btn.click();
  }, text);
};

(async () => {
  const logs = [];
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    const args = msg.args().map(a => a.toString());
    logs.push({
      type: msg.type(),
      text: msg.text(),
      args,
      location: msg.location()
    });
  });

  page.on('pageerror', err => {
    logs.push({
      type: 'pageerror',
      text: err.toString(),
      stack: err.stack || ''
    });
  });

  try {
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded', timeout: 120000 });

    await page.waitForSelector('input[name="fullName"]', { timeout: 120000 });

    // Fill minimal fields to reach step 3
    await page.type('input[name="fullName"]', 'Test User');
    await page.type('input[name="email"]', 'testuser@example.com');
    await page.type('input[name="phone"]', '9876543210');
    await page.type('input[name="whatsappNumber"]', '9876543210');
    await page.type('input[name="sponsorId"]', 'HHF123456');

    // Next step
    await clickButtonByText(page, 'Continue');
    await sleep(1000);

    await page.type('input[name="password"]', 'password123');
    await page.type('input[name="confirmPassword"]', 'password123');
    await page.type('input[name="epin"]', 'EPIN1234');

    await clickButtonByText(page, 'Continue');
    await sleep(1000);

    await page.select('select[name="paymentMethod"]', 'UPI');
    await page.type('input[name="upiId"]', 'test@upi');

    await clickButtonByText(page, 'Create Account');

    await sleep(15000);
  } catch (err) {
    logs.push({ type: 'script-error', text: err.toString(), stack: err.stack || '' });
  } finally {
    fs.writeFileSync(outputPath, JSON.stringify(logs, null, 2));
    await browser.close();
  }
})();
