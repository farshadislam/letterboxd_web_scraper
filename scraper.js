import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'node:fs';

// const express = require("express");
// const { Worker } = require("worker_threads");

// const app = express(); // Creates server
// const port = process.env.PORT || 3000; // Readiesb port 3000
// const THREADS_AVAILABLE = 10;

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

async function scrapePageOneReviews(username) {
    chromium.use(StealthPlugin());

    const context = await chromium.launchPersistentContext('./browser-session', {headless: true});

    const firstPage = await context.newPage();
    await firstPage.goto(`https://letterboxd.com/${username}/reviews/films/page/2/`, { waitUntil: 'domcontentloaded' });
    

    // When a DOM element has spaces in the class name, that means it's been assigned multiple classes

    console.log('Clicking every instance of a reveal link on the page...');

    let revealsRemaining = await firstPage.locator('a.reveal').count();

    while (revealsRemaining > 0) {
        let revealLink = firstPage.locator('a.reveal').first();
        await revealLink.click();
        revealsRemaining--;
    }

    console.log('Pushing every review as a string into the returning list...');
    // const pageOneReviews = [];

    await delay(1500);
    
    const pageOneReviews = await firstPage.locator('.js-review-body').evaluateAll(
        els => els.map(el => { // This will already isolate each individual instance of the locator tag
            const nodeOfReview = el.querySelectorAll("p"); // Unpacks every p tag within each review into a NodeList

            let concatReview = "";

            for (let i = 0; i < nodeOfReview.length; i++) {
                let paragraph = nodeOfReview.item(i).textContent; // Get the text content of each paragraph (every item is a DOM element that can be treated as a standard tag in HTML)

                concatReview += paragraph; // Append onto concatReview

                if (i != nodeOfReview.length - 1)
                    concatReview += '\n';
            }

            return concatReview; // Return the entire text content and then push it onto the reviews list
        }
    ));

    await context.close();
    return { pageOneReviews };
}

async function scrapeAllReviewsNoWorkers(username) {
    chromium.use(StealthPlugin());
    const context = await chromium.launchPersistentContext('./browser-session', { headless: true });
    console.log('Loaded up new browser session!');
    const page = await context.newPage();
    const allReviews = [];
    let pageNum = 1;

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
        /* 
        while (await page.locator('a.reveal:visible').count() > 0) {
            await page.locator('a.reveal:visible').first().click();
        } */



        await delay(2500);

        console.log('Pushing all reviews as strings to larger list...');
        const allReviewsOnPage = await page.locator('.js-review-body').evaluateAll(
        els => els.map(el => { // This will already isolate each individual instance of the locator tag
            const nodeOfReview = el.querySelectorAll("p"); // Unpacks every p tag within each review into a NodeList

            let concatReview = "";

            for (let i = 0; i < nodeOfReview.length; i++) {
                let paragraph = nodeOfReview.item(i).textContent; // Get the text content of each paragraph (every item is a DOM element that can be treated as a standard tag in HTML)

                concatReview += paragraph; // Append onto concatReview

                if (i != nodeOfReview.length - 1)
                    concatReview += '\n';
            }

            return concatReview; // Return the entire text content and then push it onto the reviews list
        }
        ));

        console.log(allReviewsOnPage);
        allReviews.push(allReviewsOnPage);
        pageNum++;
    }

    await context.close();
    return allReviews;
}

// function addReviewScraper(reviewPageURL) {
//     const allReviewsOnPage = new Promise((resolve, reject) => {
//         const reviewWorker = new Worker('./worker-optimized.js', {
//             workerData: {
//                 reviewPageURL: reviewPageURL,
//             },
//         });

//         reviewWorker.on("message", (data) => {
//             resolve(data);
//         });

//         reviewWorker.on("error", (err) => {
//             reject(`An error occured : ${err}`);
//         });
//     });

//     return allReviewsOnPage;
// }

async function scrapeAllTheirReviews(username) {
    chromium.use(StealthPlugin());
    const context = await chromium.launchPersistentContext('./browser-session', { headless: true });
    const page = await context.newPage();
    const allReviews = [];
    let pageNum = 1;

    while (true) {
        await page.goto(`https://letterboxd.com/${username}/reviews/films/page/${pageNum}/`, { waitUntil: 'domcontentloaded' });

        const reviewCount = await page.locator('.js-review-body').count();
        if (reviewCount === 0) {
            pageNum--; // This is how many pages actually have reviews on them
            break;
        }

        pageNum++;
    }

    const reviewPromises = [];
    for (let i = 0; i < pageNum; i++) {
        // `https://letterboxd.com/${username}/reviews/films/page/${i+1}/`
    }

    await context.close();
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

    // const { pageOneReviews } = await scrapePageOneReviews('orangepickleguy');
    // console.log(pageOneReviews);

    const { allReviews } = await scrapeAllReviewsNoWorkers('orangepickleguy');
    // console.log(allReviews);
}

main();
