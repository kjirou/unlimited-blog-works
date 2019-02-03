import * as assert from 'assert';

import {
  extractPageName,
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
});
