// import the required library
import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ timeout: 60000 });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto("https://www.scrapingcourse.com/ecommerce/", { timeout: 1000000 });
    
    // define the scraper function
    async function scraper() {
        // find all product containers on the page
        const productContainers = await page.$$(".woocommerce-LoopProduct-link");
        let value = 1;

        for (const container of productContainers) {
            // extract product name and price from each container
            const productName = await container.$eval(".woocommerce-loop-product__title", element => element.innerText);
            const price = await container.$eval(".price", element => element.innerText);

            console.log(value,") Name:", productName);
            console.log("Price:", price);
            value += 1;

            if (value == 16) {
                break;
            }
        }
    }

    while (true) {
        try {
            // execute the scraper function
            await scraper();

            // find and click the next page link
            const nextPageLink = await page.$(".next.page-numbers");
            if (nextPageLink) {
                await nextPageLink.click({ timeout: 100000 });
                await page.waitForTimeout(30000);
            } else {
                console.log("No more pages available");
                break;
            }
        } catch (e) {
            console.log("An error occurred:", e);
            break;
        }
    }
    
    // close the browser
    await browser.close();
})();
