
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  await page.screenshot({path: 'website_snapshot.png', fullPage: true});
  await browser.close();
})();
