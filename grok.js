import fs from 'fs/promises';
import * as cheerio from 'cheerio';

const URL = "https://letterboxd.com/orangepickleguy/";
const OUTPUT_RAW = "letterboxd-raw.html";
const OUTPUT_PARSED = "letterboxd-parsed.html";

async function savePageHtml() {
  try {
    console.log(`Fetching: ${URL}`);

    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // 1. Save the exact raw HTML we received
    await fs.writeFile(OUTPUT_RAW, html, 'utf-8');
    console.log(`Raw HTML saved to: ${OUTPUT_RAW}`);
    console.log(`Size: ${html.length.toLocaleString()} characters`);

    // 2. Parse with Cheerio and save a pretty version (optional but helpful)
    const $ = cheerio.load(html, { decodeEntities: false });
    const prettyHtml = $.html(); // Cheerio's .html() gives cleaned-up version

    await fs.writeFile(OUTPUT_PARSED, prettyHtml, 'utf-8');
    console.log(`Parsed/pretty HTML saved to: ${OUTPUT_PARSED}`);

    // Quick stats to help you understand what's actually there
    const favContainers = $('div.favourite-production-poster-container').length;
    const frameTitles = $('.frame-title').length;
    const posterAlts = $('img.image').toArray().map(el => $(el).attr('alt') || '(no alt)');

    console.log('\nQuick inspection:');
    console.log(`- Favourite poster containers found: ${favContainers}`);
    console.log(`- .frame-title elements found: ${frameTitles}`);
    if (posterAlts.length > 0) {
      console.log('- Poster alt texts (first few):');
      posterAlts.slice(0, 5).forEach((alt, i) => {
        console.log(`  ${i + 1}. ${alt}`);
      });
      if (posterAlts.length > 5) console.log(`  ...and ${posterAlts.length - 5} more`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

await savePageHtml();