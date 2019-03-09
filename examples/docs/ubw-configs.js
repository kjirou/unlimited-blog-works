module.exports = function ubwConfigs() {
  const blogUrl = 'https://kjirou.github.io/unlimited-blog-works';
  return {
    "blogName": "Sample Blog",
    "blogUrl": blogUrl,
    "publicationDir": "../../docs",
    "cssUrls": [
      "/unlimited-blog-works/external-resources/index.css",
    ],
    "language": "en",
    "timeZone": "UTC",
    defaultOgpImageUrl: blogUrl + '/external-resources/hagumeta.png',
  };
}
