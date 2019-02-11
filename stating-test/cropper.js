#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const rawPagesRoot = path.join(__dirname, 'raw-pages');
const rawPages = fs.readdirSync(rawPagesRoot)
  .sort()
  .map(fileName => {
    const filePath = path.join(rawPagesRoot, fileName);
    return {
      fileName,
      rawHtml: fs.readFileSync(filePath).toString(),
    };
  });

const croppedSources = rawPages
  .map(({fileName, rawHtml}) => {
    // Stopper for debugging
    //if (fileName !== '0006.html') return;

    console.log('Start ' + fileName);

    // Page Title
    const pageTitleMatcher = new RegExp(/ id="post-\d+">\s*<h2>(.+?)<\/h2>\r/);
    const pageTitleMatch = pageTitleMatcher.exec(rawHtml);
    const rawPageTitle = pageTitleMatch[1];

    // Date
    const dateMatcher = new RegExp(/<div class="entryMetas">\s+(\d+年\d+月\d+日)/);
    const dateMatch = dateMatcher.exec(rawHtml);
    const rawDate = dateMatch[1];

    // Main Content
    const mainContentMatcher = new RegExp(/<div class="entryContent">\s+((?:.|\n|\r)+)<div class='wp_social_bookmarking_light'>/);
    const mainContentMatch = mainContentMatcher.exec(rawHtml);
    const rawMainContent = mainContentMatch[1];

    return {
      rawPageTitle,
      rawDate,
      rawMainContent,
    };
  });

fs.writeFileSync(
  path.join(__dirname, 'raw-pages.json'),
  JSON.stringify(croppedSources, null, 2) + '\n'
);
