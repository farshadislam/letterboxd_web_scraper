import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'node:fs';

const REVIEWS_PER_PAGE = 12;

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
    );

    const nerdTitles = await page.$$eval('.favourite-production-poster-container .frame-title', els =>
        els.map(el => el.closest('a').getAttribute('href').split('/')[3]) // Want to get the third element from the split (contains film title)
    );

    const posterLinks = []; // Initialize outside of for-loop

    await browser.close();

    return { titles };
}

async function scrapeReviews(username) {
    chromium.use(StealthPlugin());

    const context = await chromium.launchPersistentContext('./browser-session');

    const firstPage = await context.newPage();
    await firstPage.goto(`https://letterboxd.com/${username}/reviews`, { waitUntil: 'domcontentloaded' });

    // When a DOM element has spaces in the class name, that means it's been assigned multiple classes
    await firstPage.waitForSelector('.js-listitem .js-review .body-text');
    console.log('Successfully identified review body selector!');

    let revealsRemaining = await firstPage.locator('a.reveal').count(); // Finds out how many reviews have a "...more" reveal tag
    console.log(`Starting "click" sequence with ${revealsRemaining} reveal links...`)

    while (revealsRemaining > 0) {
        let revealLink = firstPage.locator('a.reveal').first(); // Identifies the first available selector with a "...more" tag
        await revealLink.click(); // Initiate the click action (DOES NOT GUARANTEE THE SELECTOR WAS CLICKED)
        // await revealLink.waitFor( { state : 'hidden'} ); // Once clicked, the selector vanishes, which is confirmed by this line
        revealsRemaining--;
    }

    const pageOneReviews = await firstPage.locator('.js-listitem .js-review .body-text').evaluateAll(
        els => els.map(el => { // This will already isolate each individual instance of the locator tag
            const nodeOfReview = el.querySelectorAll("p"); // Unpacks every p tag within each review into a NodeList

            let concatReview = "";

            for (let i = 0; i < nodeOfReview.length; i++) {
                let paragraph = nodeOfReview.item(i).textContent; // Get the text content of each paragraph (every item is a DOM element that can be treated as a standard tag in HTML)

                concatReview += paragraph; // Append onto concatReview
            }

            return concatReview; // Return the entire text content and then push it onto the reviews list
        }
    ));

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

    const { titles } = await scrapeFavourites('orangepickleguy');
    console.log(titles);

    const { pageOneReviews } = await scrapeReviews('orangepickleguy');
    console.log(pageOneReviews);
}

main();
