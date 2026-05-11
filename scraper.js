import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'node:fs';

const REVIEWS_PER_PAGE = 12;

async function scrapeFavourites(username) {
    const browser = await chromium.launch(); // Opens browser
    const page = await browser.newPage(); // Opens a page

    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(30_000);

    await page.goto(`https://letterboxd.com/${username}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.favourite-production-poster-container .frame-title');
    // This is where we get the film titles in my favourites bar

    const titles = await page
        .locator('.favourite-production-poster-container .frame-title') // Identifies tags
        .evaluateAll( // “Run this function inside the browser (page) context, and give me back the result.”
        els => els.map(el => el.textContent) // IMPLICITLY returns the els list
    );

    const nerdTitles = await page.$$eval('.favourite-production-poster-container .frame-title', els =>
        els.map(el => el.closest('a').getAttribute('href').split('/')[3]) // Want to get the third element from the split (contains film title)
    );

    const posterLinks = []; // Initialize outside of for-loop

    await browser.close();

    return { titles };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeReviews(username) {
    chromium.use(StealthPlugin());

    const context = await chromium.launchPersistentContext('./browser-session', {headless: true});

    const firstPage = await context.newPage();
    await firstPage.goto(`https://letterboxd.com/${username}/reviews/films/page/2/`, { waitUntil: 'domcontentloaded' });
    

    // When a DOM element has spaces in the class name, that means it's been assigned multiple classes

    console.log('Clicking every instance of a reveal link on the page...');
    /* for (const revealLink of await firstPage.locator('a.reveal').all()) {
        await revealLink.click();
    } */

    let revealsRemaining = await firstPage.locator('a.reveal').count();

    while (revealsRemaining > 0) {
        let revealLink = firstPage.locator('a.reveal').first();
        await revealLink.click();
        revealsRemaining--;
    }

    console.log('Pushing every review as a string into the returning list...');
    const pageOneReviews = [];

    await delay(1500);
    for (const review of await firstPage.locator('.js-review-body').all()) {
        pageOneReviews.push(await review.textContent());
    }

    await context.close();
    return { pageOneReviews };
}

async function main() {
    // Source - https://stackoverflow.com/a/4482701
    // Posted by T.J. Crowder, modified by community. See post 'Timeline' for change history
    // Retrieved 2026-04-23, License - CC BY-SA 4.0

    const dir = 'browser-session';

    if (fs.existsSync(dir)) {
        await fs.promises.rm(dir, { recursive: true });
        console.log(`"${dir}" was deleted!`);
    }

    // const { titles } = await scrapeFavourites('orangepickleguy');
    // console.log(titles);

    const { pageOneReviews } = await scrapeReviews('orangepickleguy');
    console.log(pageOneReviews);
}

main();
