import * as React from 'react';

import {NonArticlePageProps} from './shared';

export default class TopLayout extends React.Component<NonArticlePageProps> {
  render(): JSX.Element {
    return (
      <div className="ubw-non-article ubw-top">
        <div className="markdown-body ubw-main-content">
          <h1>{this.props.blogName}</h1>
          <ul className="ubw-articles">
            {
              this.props.articles
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
      </div>
    );
  }
}
