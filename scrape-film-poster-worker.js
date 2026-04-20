// largePoster.classList.add('show');

const { parentPort, workerData } = require("worker_threads");

let result = 0;

/* This is where all the code goes scraping each individual file, which I should probably figure out first */

parentPort.postMessage(result); // This gets to stay, but the above implementation needs to change

await page.goto(`https://letterboxd.com/film/${movieTitle}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.modal-poster .film-poster .image');