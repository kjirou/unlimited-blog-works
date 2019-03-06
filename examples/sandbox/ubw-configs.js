require('../../setup/ts-node-reigister-for-cli-debug');
const {createDefaultUbwConfigs} = require('../../src');

const defautConfigs = createDefaultUbwConfigs();

module.exports = function ubwConfigs() {
  return {
    "blogName": "わたしのブログ",
    "blogUrl": "https://example.com",
    "publicationDir": "./blog-publication",
    "cssUrls": [
      "/external-resources/index.css",
    ],
    "jsUrls": [
      "/external-resources/index.js",
    ],
    "language": "ja",
    "timeZone": "Asia/Tokyo",
    additionalTopPageLinks: defautConfigs.additionalTopPageLinks.concat([
      {linkText: 'My Real Blog', href: 'https://kjirou.github.io/blog/'},
    ]),
  };
}
