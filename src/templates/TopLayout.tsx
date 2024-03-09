import type { FunctionComponent } from 'preact';

import {NonArticlePageProps} from './shared';

const TopLayout: FunctionComponent<NonArticlePageProps> = (props) => {
  const atomFeedPage = props.nonArticles.find(nonArticle => nonArticle.id === 'atom-feed') as any;

  return (
    <div className="ubw-page ubw-non-article ubw-top">
      <div className="markdown-body ubw-main-content">
        <h1>{props.blogName}</h1>
        <ul className="ubw-articles">
          {
            props.articles
              .slice()
              .sort((a, b) => {
                return b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime();
              })
              .map(article => {
                return (
                  <li key={article.articleId} className="ubw-articles-item">
                    <a className="ubw-articles-item-link" href={article.rootRelativePath}>{article.pageTitle}</a>
                    <span className="ubw-articles-item-last-updated-at">
                      {article.formattedLastUpdatedAt}
                    </span>
                  </li>
                );
              })
          }
        </ul>
      </div>
      <hr className="ubw-end-of-main-content" />
      <ul className="ubw-meta-data">
        <li><a href={atomFeedPage.rootRelativePath}>Atom Feed</a></li>
        {
          props.additionalTopPageLinks.map((data, index) => {
            return <li key={'ubw-meta-data-additional-link-' + index}><a href={data.href}>{data.linkText}</a></li>;
          })
        }
      </ul>
    </div>
  );
};
export default TopLayout;
