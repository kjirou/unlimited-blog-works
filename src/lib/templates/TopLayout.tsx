import * as React from 'react';

import {NonArticlePageProps} from './shared';

export default class TopLayout extends React.Component<NonArticlePageProps> {
  render(): JSX.Element {
    return (
      <React.Fragment>
        <h1>My Blog</h1>
        <ul>
          {
            this.props.articles.map(article => {
              return (
                <li key={article.articleId}>
                  <a href={article.permalink}>{article.pageName}</a>
                </li>
              );
            })
          }
        </ul>
      </React.Fragment>
    );
  }
}
