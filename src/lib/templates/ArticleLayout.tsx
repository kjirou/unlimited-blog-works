import * as React from 'react';

import {generateDateTimeString} from '../utils';

interface ArticlePageProps {
  contentHtml: string,
  lastUpdatedAt: Date,
  timeZone: string,
}

export default class ArticleLayout extends React.Component<ArticlePageProps> {
  render(): JSX.Element {
    return (
      <React.Fragment>
        <div dangerouslySetInnerHTML={{__html: this.props.contentHtml}} />
        <div>
          <ul>
            <li>Last updated at: {generateDateTimeString(this.props.lastUpdatedAt, this.props.timeZone)}</li>
          </ul>
        </div>
      </React.Fragment>
    );
  }
}
