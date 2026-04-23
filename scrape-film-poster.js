import { chromium } from 'playwright-extra'; // Same thing as just "playwright" but with some extra features (we'll see if I actually need them)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'; // We'll see if this gets used at all
import 'dotenv/config';
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

function convertProxyToPlaywrightFormat(proxyUrl) {
    const url = new URL(proxyUrl);
    return {
        server: `${url.protocol}//${url.host}`,
        username: url.username,
        password: url.password
    };
}

async function scrapeFilmPosters(movieTitles) {
    const proxyUrl = process.env.PROXY_URL; // Generates proxy?

    if (!proxyUrl) {
        console.error('Proxy URL not found in .env file');
        process.exit(1);
    }

    const proxyOptions = convertProxyToPlaywrightFormat(proxyUrl);
    const browser = await chromium.launch({
        proxy: proxyOptions,
    });

    try {
        const page = await browser.newPage();
    } catch (error) {
        console.error(`Failed to navigate: ${error.message}`);
    }

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
