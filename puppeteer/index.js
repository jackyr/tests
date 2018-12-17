const puppeteer = require('puppeteer');

const url = 'https://www.apple.com/news/';
const delay = 1000;
const fullPage = true;
const viewportWidth = 1440;
const viewportHeight = 900;

function sleep(time) {
  return new Promise(function (resolve) {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

(async () => {
  const viewPort = {
    width: viewportWidth,
    height: viewportHeight,
  };
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.pages().then(pages => pages.length > 0 ? pages[0] : browser.newPage());
  await page.setViewport(viewPort);
  await page.goto(url);
  console.log('Waiting for page loading..');
  if (fullPage) {
    const height = await page.evaluate(() => {
      return document.documentElement.offsetHeight; //eslint-disable-line
    });
    viewPort.height = height;
    await page.setViewport(viewPort);
  }
  await sleep(delay);
  await page.screenshot({path: 'output.jpeg'});
  console.log('Screenshot saved');
  browser.close();
  process.exit();
})();
