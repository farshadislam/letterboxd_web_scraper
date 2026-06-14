# Letterboxd Web Scraper

Basically what's in the name. I wanted to try using Playwright and Node.js, so a simple web scraper that reads all the reviews on a person's profile and turns them into string data seemed like a simple enough project to get used to both tools.

## How it works
The user correctly inputs their username on Letterboxd (case-sensitive) and runs the program with it as the only argument. I had to bypass the built-in CAPTCHA features Letterboxd employs in order to access multiple pages within the same browser context, so I used Puppeteer's Stealth Plugin as a rotating proxy. It wasn't the most efficient solution, because I would have to delete and then rebuild
the proxy files every time I ran the program, but it let me make URL requests without getting blocked. THe purpose was this was to learn how to web scrape, not bypass security tools efficiently.

Once it opens the Letterboxd profile in a headless browser, it goes through each review page sequentially, going through all the DOM elements until it's obtained all the full reviews on each page. I had to add specific handling for "more" or "spoiler" tags so that the reviews wouldn't get
cut off prematurely, but nonetheless, it scrapes every movie review on their profile, and displays the string data it recieved in the console.

## Plans for the future
I'd like to see if there's a way for me to take the information I'm getting from all the reviews, and make a sophisticated graph display via Vercel, or even make movie recommendations based on the sorts of attributes that people respond most to.
