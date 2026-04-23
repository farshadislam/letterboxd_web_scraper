import 'dotenv/config';
import { chromium } from 'playwright';

function convertProxyToPlaywrightFormat(proxyUrl) {
    const url = new URL(proxyUrl);
    return {
        server: `${url.protocol}//${url.host}`,
        username: url.username,
        password: url.password
    };
}

async function tryNavigate(page, url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await page.goto(url);
            return; // If successful, return without throwing an error
        } catch (error) {
            console.error(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === maxRetries) {
                throw error; // Rethrow the last error if all retries fail
            }
        }
    }
}

async function main() {
    const proxyUrl = process.env.PROXY_URL;

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
        await tryNavigate(page, 'https://letterboxd.com/film/the-drama/');
    } catch (error) {
        console.error(`Failed to navigate: ${error.message}`);
    } finally {
        await browser.close();
    }
}

main();