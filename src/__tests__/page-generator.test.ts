import assert from 'assert';
import hast from 'hastscript';

import {
  ArticlePage,
  createArticlePage,
  extractOgpDescription,
  generateH1AutolinkHrefReplacementTransformer,
  getNextAutomaticArticleId,
} from '../page-generator';

describe('extractOgpDescription', function() {
  it('should pick up only values of type="text"', function() {
    assert.strictEqual(
      extractOgpDescription({
        type: 'root',
        children: [
          {type: 'text', value: 'a'},
          {type: 'foo', value: 'X'},
          {type: 'text', value: 'b'},
          {type: 'bar', value: 'X'},
          {type: 'text', value: 'c'},
        ],
      }),
      'a b c'
    );
  });

  it('can ignore some specified types', function() {
    assert.strictEqual(
      extractOgpDescription({
        type: 'foo',
        children: [
          {type: 'text', value: 'a'},
          {
            type: 'html',
            children: [
              {type: 'text', value: 'X'},
            ],
          },
          {
            type: 'bar',
            children: [
              {type: 'code', value: 'X'},
              {type: 'text', value: 'b'},
            ],
          }
        ],
      }),
      'a b'
    );
  });

  it('can return an empty string if there are no matched nodes', function() {
    assert.strictEqual(
      extractOgpDescription({
        type: 'root',
        children: [
          {type: 'code', value: 'X'},
        ],
      }),
      ''
    );
  });

  it('should consider the max-length', function() {
    assert.strictEqual(
      extractOgpDescription({
        type: 'text',
        value: 'a'.repeat(90),
      }),
      'a'.repeat(90)
    );
    assert.strictEqual(
      extractOgpDescription({
        type: 'text',
        value: 'a'.repeat(91),
      }),
      'a'.repeat(87) + '...'
    );
  });

  it('can collapse /\\s+/ characters', function() {
    assert.strictEqual(
      extractOgpDescription({
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'a b  c\td\r\ne   '
          },
          {
            type: 'text',
            value: '  f g'
          },
        ],
      }),
      'a b c d e f g'
    );
  });
});

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
