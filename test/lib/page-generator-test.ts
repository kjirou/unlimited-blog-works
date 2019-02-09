import * as assert from 'assert';

import {
  ArticlePage,
  createArticlePage,
  getNextAutomaticArticleId,
} from '../../src/lib/page-generator';

describe('lib/page-generator', function() {
  describe('getNextAutomaticArticleId', function() {
    it('can increment a number', function() {
      const articlePages: ArticlePage[] = [
        Object.assign(createArticlePage(), {articleId: '20190101-0001'}),
      ];
      assert.strictEqual(getNextAutomaticArticleId(articlePages, '20190101'), '20190101-0002');
    });

    it('can increment the higher of the two numbers', function() {
      const articlePages: ArticlePage[] = [
        Object.assign(createArticlePage(), {articleId: '20190101-0002'}),
        Object.assign(createArticlePage(), {articleId: '20190101-9998'}),
      ];
      assert.strictEqual(getNextAutomaticArticleId(articlePages, '20190101'), '20190101-9999');
    });

    it('can get the "0001" number when there are no articles', function() {
      assert.strictEqual(getNextAutomaticArticleId([], '20190101'), '20190101-0001');
    });

    it('should ignore articles not equal date', function() {
      const articlePages: ArticlePage[] = [
        Object.assign(createArticlePage(), {articleId: '20190102-0001'}),
        Object.assign(createArticlePage(), {articleId: '2019010X-0001'}),
      ];
      assert.strictEqual(getNextAutomaticArticleId(articlePages, '20190101'), '20190101-0001');
    });
  });
});
