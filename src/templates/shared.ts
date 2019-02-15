export interface ArticlePageProps {
  contentHtml: string,
  lastUpdatedAt: Date,
  timeZone: string,
}

export interface NonArticlePageProps {
  articles: {
    articleId: string,
    lastUpdatedAt: Date,
    pageTitle: string,
    permalink: string,
  }[],
  blogName: string,
  permalink: string,
  timeZone: string,
}
