import * as assert from 'assert';
import * as hast from 'hastscript';

import {
  ArticlePage,
  createArticlePage,
  generateH1AutolinkHrefReplacementTransformer,
  getNextAutomaticArticleId,
} from '../src/page-generator';

describe('page-generator', function() {
  describe('generateH1AutolinkHrefReplacementTransformer', function() {
    it('can empty a href', function() {
      const tree = hast('h1', [
        hast('a', {
          dataUbwAutolink: true,
          href: '#foo',
        })
      ]);
      generateH1AutolinkHrefReplacementTransformer('dataUbwAutolink')(tree);
      assert.deepStrictEqual(
        tree,
        {
          type: 'element',
          tagName: 'h1',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'a',
              properties: {
                dataUbwAutolink: true,
                href: '',
              },
              children: [],
            }
          ],
        }
      );
    });

    it('should only replace "h1 > a" nodes', function() {
      const tree = hast('body', [
        hast('h2', [
          hast('a', {
            dataUbwAutolink: true,
            href: '#one',
          })
        ]),
        hast('h1', [
          hast('a', {
            dataUbwAutolink: true,
            href: '#two',
          })
        ]),
        hast('h2', [
          hast('a', {
            dataUbwAutolink: true,
            href: '#three',
          })
        ]),
        hast('h1', [
          hast('a', {
            dataUbwAutolink: true,
            href: '#four',
          })
        ]),
        hast('h2', [
          hast('a', {
            dataUbwAutolink: true,
            href: '#five',
          })
        ])
      ]);
      generateH1AutolinkHrefReplacementTransformer('dataUbwAutolink')(tree);
      assert.strictEqual((tree as any).children[0].children[0].properties.href, '#one');
      assert.strictEqual((tree as any).children[1].children[0].properties.href, '');
      assert.strictEqual((tree as any).children[2].children[0].properties.href, '#three');
      assert.strictEqual((tree as any).children[3].children[0].properties.href, '');
      assert.strictEqual((tree as any).children[4].children[0].properties.href, '#five');
    });

    it('should only replace nodes with marker attributes', function() {
      const tree = hast('div', [
        hast('h1', [
          hast('a', {
            foo: true,
            href: '#one',
          })
        ]),
        hast('h1', [
          hast('a', {
            bar: true,
            href: '#two',
          })
        ]),
        hast('h1', [
          hast('a', {
            foo: true,
            href: '#three',
          })
        ]),
      ]);
      generateH1AutolinkHrefReplacementTransformer('foo')(tree);
      assert.strictEqual((tree as any).children[0].children[0].properties.href, '');
      assert.strictEqual((tree as any).children[1].children[0].properties.href, '#two');
      assert.strictEqual((tree as any).children[2].children[0].properties.href, '');
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
