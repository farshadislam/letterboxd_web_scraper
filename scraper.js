/* https://www.scrapingbee.com/blog/web-scraping-javascript/ */

import * as cheerio from 'cheerio';

const URL = "https://letterboxd.com/orangepickleguy/"; // Testing on my own account

async function scrape() {
    const response = await fetch(URL); // Async wait on URL to load
    const html = await response.text(); // Async wait for html translation

    const $ = cheerio.load(html); // Loads html into cheerio
    const favourites = []; // Gonna store user's favs in this list

    $('div.favourite-production-poster-container').each((_i, el) => { // Should IDEALLY parse all favourites
        /* don't need to go down every subclass!   div.favourite-production-poster-container */
        
        
        
        /* REALLY INTERESTING because I had the right idea, but apparently the info is actually rendered on the client side or something? Either way, it looks like I need to read the meta tags instead in order to get the film titles */
        const film_name_and_year = $(el).find('.frame-title').text().trim();

        // Still need to find a way to get the highest res movie poster for each film

        favourites.push(film_name_and_year);
    });

    console.log(JSON.stringify(favourites, null, 2));
}

await scrape();