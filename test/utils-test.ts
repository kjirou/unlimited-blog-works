import * as assert from 'assert';

import {
  extractPageName,
  permalinksToRelativeUrl,
  scanRemarkAstNode,
  toNormalizedAbsolutePath,
} from '../src/utils';

describe('utils', function() {
  describe('toNormalizedAbsolutePath', function() {
    [
      ['foo', '/base/foo'],
      ['./foo', '/base/foo'],
      ['foo/bar', '/base/foo/bar'],
      ['foo/bar/baz/../..', '/base/foo'],
      ['/abs', '/abs'],
    ].forEach(([pathInput, expected]) => {
      it(`"${pathInput}" -> "${expected}"`, function() {
        assert.strictEqual(toNormalizedAbsolutePath(pathInput, '/base'), expected);
      });
    });
  });

  describe('permalinksToRelativeUrl', function() {
    [
      ['/index.html', '/articles/20190101-0001.html', 'articles/20190101-0001.html'],
      ['/articles/20190101-0001.html', '/index.html', '../index.html'],
      ['/', '/index', 'index'],
      ['/index', '/', '.'],
      ['/', '/', '.'],
      ['/same', '/same', 'same'],
      ['/samedir/same', '/samedir/same', 'same'],
      ['/samedir/foo', '/samedir/bar', 'bar'],
      ['/samedir/foo', '/samedir/bar/x', 'bar/x'],
    ].forEach(([fromPermalink, toPermalink, expected]) => {
      it(`From "${fromPermalink}" to "${toPermalink}" -> "${expected}"`, function() {
        assert.strictEqual(permalinksToRelativeUrl(fromPermalink, toPermalink), expected);
      });
    });
  });

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
});
