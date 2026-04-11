import { chromium } from 'playwright';

async function scrapeFavourites(username) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(30_000);

  await page.goto(`https://letterboxd.com/${username}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.favourite-production-poster-container .frame-title');
 // This is where we get the film titles in my favourites bar

  const titles = await page
    .locator('.favourite-production-poster-container .frame-title') // Identifies tags
    .evaluateAll( // “Run this function inside the browser (page) context, and give me back the result.”
      els => els.map(el => el.textContent) // IMPLICITLY returns the els list

      /*
      els => {
        return els.map(el => el.textContent) // EXPLICITLY returns the els list
      }
      */
    );

  const nerdTitles = await page.$$eval('.favourite-production-poster-container .frame-title', els =>
    els.map(el => el.closest('a').getAttribute('href').split('/')[3]) // Want to get the third element from the split (contains film title)
  );

  const posterLinks = []; // Initialize outside of for-loop

  /*
  for (let i = 0; i < nerdTitles.length; i++) { 
    await page.goto(`https://letterboxd.com/film/${nerdTitles[i]}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.poster film-poster .image'); // <--- Times out the entire thing goddammit

    posterLinks[i] = await page.$eval('#poster-modal img.image', el => el.getAttribute('srcset'));
  }

  await browser.close();
  */
  return { titles };
}

async function scrapeReviews(username) {
  const browser = await chromium.launch();
  const context = await browser.newContext(); // This is required for multiple pages
  const allPages = context.pages(); // Should be two pages for how many reviews I've written

  const firstPage = await context.newPage();
  await firstPage.goto(`https://letterboxd.com/${username}/reviews/`, { waitUntil: 'domcontentloaded' });
  
  // When a DOM element has spaces in the class name, that means it's been assigned multiple classes

  const reviews = await page.locator('.js-listitem .js-review .collapsed-text').evaluateAll(
    els => {
      const stupid = []

      // Implement the logic to unpack every instance of more and then store every review on the page

      // Fidn every more tag
      // click on it or expand some fucking how
      // unpack every p tag
      // concatenate into a full review
      // push to stupid list

      return stupid;
    }
  );
}

async function main() {
  const { titles } = await scrapeFavourites('orangepickleguy');
  console.log(titles);

  // Want to add logic to sift through all the reviews next

  
}

main();
