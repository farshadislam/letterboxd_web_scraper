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
  // const browser = await chromium.launch();
  //const browser = await chromium.launch({ channel: 'chrome' });

  //const context = await browser.newContext(); // This is required for multiple pages
  const context = await chromium.launchPersistentContext('./browser-session', {
    headless: false,
  });

  const firstPage = await context.newPage();
  await firstPage.goto(`https://letterboxd.com/${username}/reviews/`, { waitUntil: 'domcontentloaded' });
  
  // When a DOM element has spaces in the class name, that means it's been assigned multiple classes

  
  await firstPage.locator('.reveal').evaluateAll(els => els.forEach(el => el.click())); // Click all "more" links to expand them first

  await firstPage.waitForSelector('.js-listitem .js-review .body-text'); // better than isVisible because it actually waits for it to be visible and won't continue otherwise
  console.log('Actually found the fucking tags bro');

  const pageOneReviews = await firstPage.locator('.js-listitem .js-review .body-text').evaluateAll(
      els => els.map(el => { // This will already isolate each individual instance of the locator tag
        const nodeOfReview = el.querySelectorAll("p"); // Unpacks every p tag within each review into a NodeList

        let concatReview = ""

        for (let i = 0; i < nodeOfReview.length; i++) {
          let paragraph = nodeOfReview.item(i).textContent; // Get the text content of each paragraph (every item is a DOM element that can be treated as a standard tag in HTML)

          concatReview.concat('', paragraph); // Append onto concatReview
        }

        return concatReview; // Return the entire text content and then push it onto the reviews list
      }
    ));

  return { pageOneReviews };
}

async function main() {
  const { titles } = await scrapeFavourites('orangepickleguy');
  console.log(titles);

  const { pageOneReviews } = await scrapeReviews('orangepickleguy');
  console.log(pageOneReviews);
}

main();
