//
// It is only to request renderers to return HTML.
// So you can render with your favorite template engine.
//

const renderArticle = (props) => {
  return `<div style="background-color:blue;">${props.contentHtml}</div>`;
};

const nonArticles = [
  {
    nonArticlePageId: 'my-top',
    url: 'index.html',
    render(props) {
      return `<h1><a href="/author.html">Author's Blog</a></h1>
<ul>${props.articles.map(a => `<li><a href="${a.permalink}">${a.pageTitle}</a></li>`)}</ul>`;
    },
  },
  {
    nonArticlePageId: 'author',
    url: 'author.html',
    render(props) {
      return '<p>My name is Foo</p>';
    },
  },
];

module.exports = function ubwConfigs() {
  return {
    "blogName": "Customizing Pages",
    "publicationPath": "./blog-publication",
    "baseUrl": "/",
    "cssUrls": [
      "/external-resources/index.css",
    ],
    "language": "en",
    "timeZone": "UTC",
    renderArticle,
    nonArticles,
  };
}
