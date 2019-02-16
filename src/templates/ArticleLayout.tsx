import * as React from 'react';

import {ArticlePageProps} from './shared';

export default class ArticleLayout extends React.Component<ArticlePageProps> {
  render(): JSX.Element {
    return (
      <React.Fragment>
        <div className="markdown-body" dangerouslySetInnerHTML={{__html: this.props.contentHtml}} />
        <hr className="article-end-of-markdown-body" />
        <div className="article-meta-information">
          <ul>
            <li>Last updated at: {this.props.formattedLastUpdatedAt}</li>
            <li><a href={this.props.nonArticles.top.permalink}>Back to the Top</a></li>
          </ul>
        </div>
      </React.Fragment>
    );
  }
}
