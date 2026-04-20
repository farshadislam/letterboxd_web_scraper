import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Worker from 'worker_threads';

function addWorker(nameOfMovie) {
    return filmPosterObtainerPromise =  new Promise((resolve, reject) => {
        const filmPosterObtainer = new Worker("./scrape-film-poster-worker.js", {
            workerData: {
                movieTitleInURL: nameOfMovie,
            },
        });

        filmPosterObtainer.on("message", (data) => {
            resolve(data);
        });

        filmPosterObtainer.on("error", (err) => {
            reject(`An error occured : ${err}`);
        });
    });
}

async function scrapeFilmPosters(movieTitles) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const workerPromises = [];

    for (let i = 0; i < movieTitles.length; i++) {
        workerPromises.push(addWorker(movieTitles[i]));
    }
    
    const threadResults = await Promise.all(workerPromises);
    const imageLinks = [];

    for (let i = 0; i < THREADS_AVAILABLE; i++) {
        imageLinks.push(threadResults[i]);
    }
    await browser.close();
    return { imageLinks };
}

async function main() {
    let movieTitles = ['barry-lyndon', 'autumn-sonata', 'happiness', 'the-king-of-comedy']
    const { imageLinks } = await scrapeFilmPosters(movieTitles);

    console.log(imageLinks);
}

main();
