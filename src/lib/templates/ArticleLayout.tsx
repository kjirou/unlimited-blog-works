import * as React from 'react';

interface ArticlePageProps {
  contentHtml: string,
  lastUpdatedAt: Date,
}

export default class ArticleLayout extends React.Component<ArticlePageProps> {
  render(): JSX.Element {
    return (
      <React.Fragment>
        <div dangerouslySetInnerHTML={{__html: this.props.contentHtml}} />
        <div>
          <ul>
            {/* TODO: Time Zone */}
            <li>Last updated at: {this.props.lastUpdatedAt.toString()}</li>
          </ul>
        </div>
      </React.Fragment>
    );
  }
}
