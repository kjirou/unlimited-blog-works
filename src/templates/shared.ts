export interface NonArticlePageProps {
  articles: {
    articleId: string,
    lastUpdatedAt: Date,
    pageName: string,
    permalink: string,
  }[],
  blogName: string,
  permalink: string,
}
