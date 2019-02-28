export interface ArticlePageProps {
  blogName: string,
  blogUrl: string,
  contentHtml: string,
  formattedLastUpdatedAt: string,
  lastUpdatedAt: Date,
  nonArticles: {
    [nonArticlePageId: string]: {
      permalink: string,
      rootRelativePath: string,
    },
  },
  timeZone: string,
}

export interface NonArticlePageProps {
  articles: {
    articleId: string,
    lastUpdatedAt: Date,
    formattedLastUpdatedAt: string,
    pageTitle: string,
    permalink: string,
    rootRelativePath: string,
  }[],
  blogName: string,
  blogUrl: string,
  permalink: string,
  rootRelativePath: string,
  timeZone: string,
}
