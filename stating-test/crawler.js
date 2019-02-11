#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const request = require('request');

let articleUrls = fs.readFileSync(path.join(__dirname, 'article-urls.txt')).toString().split('\n')
  .filter(line => line !== '')
  .map(line => {
    return line.split('::::')[0];
  });

// For debugging
//articleUrls = articleUrls.slice(0, 10);

Promise.resolve()
  .then(() => {
    return articleUrls.reduce((promise, articleUrl) => {
      return promise.then(() => {
        return new Promise((resolve) => {
          console.log('Start ' + articleUrl);
          setTimeout(() => {
            request(articleUrl, (error, response, body) => {

              if (error) {
                console.error('Error occured in ' + articleUrl);
                throw new Error(error);
              }

              const matched = /\/(\d+)$/.exec(articleUrl);
              fs.writeFileSync(path.join(__dirname, 'raw-pages', matched[1].padStart(4, '0') + '.html'), body);

              console.log('Finish ' + articleUrl);
              resolve();
            });
          }, 1000);
        });
      });
    }, Promise.resolve());
  })
;
