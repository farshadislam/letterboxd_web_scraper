import { chromium } from 'playwright';

async function scrapeFavourites(username) {
  const browser = await chromium.launch();
  const context = await browser.newContext(); // This is required for multiple pages
  
  const page = await context.newPage();
  const allPages = context.pages(); // Only one page for my Letterboxd profile on its own

  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(30_000);

  await page.goto(`https://letterboxd.com/${username}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.favourite-production-poster-container .frame-title');
 // This is where we get the film titles in my favourites bar

  const titles = await page.locator('.favourite-production-poster-container .frame-title').evaluateAll(
    els => els.map(el => el.textContent)
  );

  const nerdTitles = await page.$$eval('.favourite-production-poster-container .frame-title', els =>
    els.map(el => el.closest('a').getAttribute('href').split('/')[3]) // Want to get the third element from the split (contains film title)
  );

  const posterLinks = []; // Initialize outside of for-loop

  for (let i = 0; i < nerdTitles.length; i++) {
    await page.goto(`https://letterboxd.com/film/${nerdTitles[i]}/`, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => { // Runs a function inside of the headless browser
      document.querySelector('#poster-modal').style.display = 'block'; // Sets the HD poster visible, so that we can inspect element the shit out of it (in theory)
    });

    posterLinks[i] = await page.$eval('#poster-modal img.image', el => el.getAttribute('src'));
  }

  await browser.close();
  return { titles, posterLinks };
}

async function main() {
  const { titles, posterLinks } = await scrapeFavourites('orangepickleguy');

  

  console.log(titles);
  console.log(posterLinks);

  // Want to add logic to sift through all the reviews next
}

main();
