import * as React from 'react';

import {ArticlePageProps} from './shared';

export default class ArticleLayout extends React.Component<ArticlePageProps> {
  render(): JSX.Element {
    return (
      <div className="ubw-page ubw-article">
        <div className="markdown-body ubw-main-content" dangerouslySetInnerHTML={{__html: this.props.contentHtml}} />
        <hr className="ubw-end-of-main-content" />
        <ul className="ubw-meta-data">
          <li className="ubw-meta-data-last-updated-at">
            <span>Last updated at:</span>
            <span>{this.props.formattedLastUpdatedAt} ({this.props.timeZone})</span>
          </li>
          <li className="ubw-meta-data-back-to-top">
            <a href={this.props.nonArticles.top.rootRelativePath}>Back to the Top</a>
          </li>
        </ul>
      </div>
    );
  }
}
