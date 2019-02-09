export interface NonArticlePageProps {
  articles: {
    articleId: string,
    pageName: string,
    permalink: string,
  }[],
  blogName: string,
}
