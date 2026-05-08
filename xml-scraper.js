// Source - https://stackoverflow.com/a/79935329
// Posted by ggorlen, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-04, License - CC BY-SA 4.0

// const playwright = require("playwright"); // ^1.58.0
import playwright from 'playwright';

let browser;
(async () => {
  browser = await playwright.chromium.launch({headless: false});
  const page = await browser.newPage();
  const url = "https://letterboxd.com/itscharlibb/film/erupcja/2/";
  await page.goto(url, {waitUntil: "domcontentloaded"});
  console.log(await page.locator(".js-review-body").textContent());
})()
  .catch(err => console.error(err))
  .finally(() => browser?.close());


