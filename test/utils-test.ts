import * as assert from 'assert';

import {
  classifyUrl,
  extractPageTitle,
  generateDateTimeString,
  generateTodayDateString,
  getPathnameWithoutTailingSlash,
  permalinksToRelativeUrl,
  removeTailingResourceNameFromPath,
  toNormalizedAbsolutePath,
} from '../src/utils';

describe('utils', function() {
  describe('generateDateTimeString', function() {
    [
      ['2019-01-01 00:00:00+0000', 'UTC', '2019-01-01 00:00:00'],
      ['2019-12-31 23:59:59+0000', 'UTC', '2019-12-31 23:59:59'],
      ['2019-01-01 00:00:00+0000', 'GMT', '2019-01-01 00:00:00'],
      ['2019-01-01 00:00:00+0000', 'Asia/Tokyo', '2019-01-01 09:00:00'],
      ['2019-01-01 00:00:00+0000', 'America/New_York', '2018-12-31 19:00:00'],
    ].forEach(([actual, expectedTimeZone, expected]) => {
      it(`${actual} -> (${expectedTimeZone}) ${expected}`, function() {
        assert.strictEqual(
          generateDateTimeString(new Date(actual), expectedTimeZone),
          expected
        );
      });
    });

    describe('timeZoneSuffix option', function() {
      [
        ['2019-01-01 00:00:00+0000', 'UTC', '2019-01-01 00:00:00+0000'],
        ['2019-01-01 00:00:00+0000', 'Asia/Tokyo', '2019-01-01 09:00:00+0900'],
      ].forEach(([actual, expectedTimeZone, expected]) => {
        it(`${actual} -> (${expectedTimeZone}) ${expected}`, function() {
          assert.strictEqual(
            generateDateTimeString(new Date(actual), expectedTimeZone, {timeZoneSuffix: true}),
            expected
          );
        });
      });
    });
  });

  describe('generateTodayDateString', function() {
    [
      ['2019-01-01 00:00:00+0000', 'UTC', '20190101'],
      ['2019-12-31 23:59:59+0000', 'UTC', '20191231'],
      ['2019-01-01 00:00:00+0000', 'GMT', '20190101'],
      ['2019-01-01 00:00:00+0000', 'Asia/Tokyo', '20190101'],
      ['2019-01-01 00:00:00+0000', 'America/New_York', '20181231'],
    ].forEach(([actual, expectedTimeZone, expected]) => {
      it(`${actual} -> (${expectedTimeZone}) ${expected}`, function() {
        assert.strictEqual(
          generateTodayDateString(new Date(actual), expectedTimeZone),
          expected
        );
      });
    });
  });

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

  describe('classifyUrl', function() {
    [
      ['https://example.com', 'absolute'],
      ['http://example.com', 'absolute'],
      ['https://example.com/', 'absolute'],
      ['/foo', 'root-relative'],
      ['/foo/bar', 'root-relative'],
      ['foo', 'relative'],
      ['./foo', 'relative'],
      ['../foo', 'relative'],
      ['', 'unknown'],
    ].forEach(([urlLikeInput, expected]) => {
      it(`"${urlLikeInput}" -> "${expected}"`, function() {
        assert.strictEqual(classifyUrl(urlLikeInput), expected);
      });
    });
  });

  describe('getPathnameWithoutTailingSlash', function() {
    [
      ['https://example.com', ''],
      ['https://example.com/', ''],
      ['https://example.com/foo', '/foo'],
      ['https://example.com/foo/', '/foo'],
      ['https://example.com/foo/bar', '/foo/bar'],
      ['https://example.com/foo/bar/', '/foo/bar'],
    ].forEach(([urlInput, expected]) => {
      it(`"${urlInput}" -> "${expected}"`, function() {
        assert.strictEqual(getPathnameWithoutTailingSlash(urlInput), expected);
      });
    });
  });

  describe('removeTailingResourceNameFromPath', function() {
    [
      ['index.html', ''],
      ['foo', ''],
      ['./foo', './'],
      ['/foo', '/'],
      ['/foo/bar', '/foo/'],
    ].forEach(([pathInput, expected]) => {
      it(`"${pathInput}" -> "${expected}"`, function() {
        assert.strictEqual(removeTailingResourceNameFromPath(pathInput), expected);
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

  describe('extractPageTitle', function() {
    it('can exact type="heading" and depth=1 only', function() {
      assert.strictEqual(
        extractPageTitle(
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
        extractPageTitle(
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
        extractPageTitle(
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
