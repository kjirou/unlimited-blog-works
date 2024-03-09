import type { FunctionComponent } from 'preact';

import {ArticlePageProps} from './shared';

const ArticleLayout: FunctionComponent<ArticlePageProps> = (props) => {
  return (
    <div className="ubw-page ubw-article">
      <div className="markdown-body ubw-main-content" dangerouslySetInnerHTML={{__html: props.contentHtml}} />
      <hr className="ubw-end-of-main-content" />
      <ul className="ubw-meta-data">
        <li className="ubw-meta-data-last-updated-at">
          <span>Last updated at:</span>
          <span>{props.formattedLastUpdatedAt} ({props.timeZone})</span>
        </li>
        <li className="ubw-meta-data-back-to-top">
          <a href={props.nonArticles.top.rootRelativePath}>Back to the Top</a>
        </li>
      </ul>
    </div>
  );
};
export default ArticleLayout;
