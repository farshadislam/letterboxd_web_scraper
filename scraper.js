import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'node:fs';
import { argv } from 'node:process';
import { convertArrayToCSV } from 'convert-array-to-csv';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeAllReviewsNoWorkers(username) {
    chromium.use(StealthPlugin());
    const context = await chromium.launchPersistentContext('./browser-session', { headless: true });
    console.log('Loaded up new browser session!');
    const page = await context.newPage();
    const allReviews = [];
    let pageNum = 1;

    let reviewDetails = {
        "filmTitle" : "",
        "yearReleased" : "",
        "rating" : "",
        "reviewDate" : "",
        "fullReview" : ""
    }

    while (true) {
        
        await page.goto(`https://letterboxd.com/${username}/reviews/films/page/${pageNum}/`, { waitUntil: 'domcontentloaded' });
        console.log(`Scraping page number ${pageNum}...`);

        const reviewCount = await page.locator('.js-review-body').count();
        if (reviewCount === 0) break; // No reviews = past the last page
        

        // Expand any truncated reviews (does not track spoiler tags yet)
        console.log('Counting number of reveals at first page load...');
        
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(500); // brief settle time for lazy-loaded elements to render
        let revealsRemaining = await page.locator('.reveal:visible').count();

        console.log(`Now performing ${revealsRemaining} many click reveals...`);
        while (revealsRemaining > 0) {
            await page.locator('.reveal:visible').first().click();
            revealsRemaining--;
        } 

        await delay(500);

        console.log('Pushing all reviews as strings to larger list...');
        const allReviewsOnPage = await page.locator('.js-listitem').evaluateAll(
        els => els.map(el => { // This will already isolate each individual instance of the locator tag
            const reviewElement = el.querySelectorAll(".js-review-body p"); // Unpacks every p tag within each review into a NodeList

            let concatReview = "";

            for (let i = 0; i < reviewElement.length; i++) {
                let paragraph = reviewElement.item(i).textContent; // Get the text content of each paragraph (every item is a DOM element that can be treated as a standard tag in HTML)

                concatReview += paragraph; // Append onto concatReview

                if (i != reviewElement.length - 1)
                    concatReview += '\n';
            }

            return {
                "filmTitle" : el.querySelector(".primaryname a")?.textContent.trim() ?? '',
                "yearReleased" : el.querySelector(".releasedate a")?.textContent.trim() ?? '',
                "rating" : el.querySelector(".-rating title")?.textContent.trim() ?? '',
                "reviewDate" : el.querySelector(".timestamp")?.getAttribute("datetime") ?? '',
                "fullReview" : concatReview
            }
            
            concatReview; // Return the entire text content and then push it onto the reviews list
        }
        ));

        console.log(allReviewsOnPage);
        allReviews.push(allReviewsOnPage);
        pageNum++;
    }

    await context.close();
    return allReviews;
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

    const inputUsername = argv[2];
    const header = ["Film Title", "Year Released", "Star Rating", "Date Reviewed", "Full Review"];

    const allReviews = await scrapeAllReviewsNoWorkers(inputUsername);
    const csv = convertArrayToCSV(allReviews, {header, separator: ","});
    await fs.promises.writeFile(`reviews-by-${inputUsername}.csv`, csv, 'utf-8');
    console.log(`Written to reviews-by-${inputUsername}.csv`);
}

main();
