import * as assert from 'assert';

import {
  ArticlePage,
  createArticlePage,
  extractPageName,
  getNextAutomaticArticleId,
  scanRemarkAstNode,
} from '../../src/lib/page-generator';

describe('lib/page-generator', function() {
  describe('scanRemarkAstNode', function() {
    it('can evalute children recursively', function() {
      const results: string[] = [];
      scanRemarkAstNode(
        {
          type: 'foo',
          value: 'FOO',
          children: [
            {
              type: 'bar',
              value: 'BAR',
              children: [
                {
                  type: 'baz',
                  value: 'BAZ',
                },
              ],
            },
          ],
        },
        (node) => {
          results.push(node.value as string);
        }
      );
      assert.deepStrictEqual(results, [
        'FOO',
        'BAR',
        'BAZ',
      ]);
    });

    it('can evalute children\'s siblings', function() {
      const results: string[] = [];
      scanRemarkAstNode(
        {
          type: 'foo',
          value: 'FOO',
          children: [
            {
              type: 'x',
              value: 'X',
            },
            {
              type: 'y',
              value: 'Y',
            },
          ],
        },
        (node) => {
          results.push(node.value as string);
        }
      );
      assert.deepStrictEqual(results, [
        'FOO',
        'X',
        'Y',
      ]);
    });
  });

  describe('extractPageName', function() {
    it('can exact type="heading" and depth=1 only', function() {
      assert.strictEqual(
        extractPageName(
          {
            type: 'root',
            children: [
              {
                type: 'not_heading',
                depth: 1,
                value: 'X',
              },
              {
                type: 'heading',
                depth: 2,
                value: 'Y',
              },
              {
                type: 'heading',
                depth: 1,
                value: 'FOO',
              },
              {
                type: 'heading',
                depth: 2,
                value: 'Z',
              },
            ],
          }
        ),
        'FOO'
      );
    });

    it('should trim the value', function() {
      assert.strictEqual(
        extractPageName(
          {
            type: 'root',
            children: [
              {
                type: 'heading',
                depth: 1,
                value: ' FOO  ',
              },
            ],
          }
        ),
        'FOO'
      );
    });

    it('should join children\'s values recursively', function() {
      assert.strictEqual(
        extractPageName(
          {
            type: 'root',
            children: [
              {
                type: 'heading',
                depth: 1,
                value: 'X',
                children: [
                  {
                    type: '',
                    value: 'A',
                  },
                  {
                    type: '',
                    value: 'B',
                    children: [
                      {
                        type: '',
                        value: 'FOO',
                      },
                    ],
                  },
                  {
                    type: '',
                    value: 'C',
                  },
                ],
              },
            ],
          }
        ),
        'X A B FOO C'
      );
    });
  });

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
