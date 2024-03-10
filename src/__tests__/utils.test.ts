import {
  classifyUrl,
  extractPageTitle,
  generateDateTimeString,
  generateTodayDateString,
  getPathnameWithoutTailingSlash,
  permalinksToRelativeUrl,
  removeTailingResourceNameFromPath,
  toNormalizedAbsolutePath,
} from "../utils";

describe("generateDateTimeString", () => {
  test.each<
    [
      Parameters<typeof generateDateTimeString>,
      ReturnType<typeof generateDateTimeString>,
    ]
  >([
    [[new Date("2019-01-01 00:00:00+0000"), "UTC"], "2019-01-01 00:00:00"],
    [[new Date("2019-12-31 23:59:59+0000"), "UTC"], "2019-12-31 23:59:59"],
    [[new Date("2019-01-01 00:00:00+0000"), "GMT"], "2019-01-01 00:00:00"],
    [
      [new Date("2019-01-01 00:00:00+0000"), "Asia/Tokyo"],
      "2019-01-01 09:00:00",
    ],
    [
      [new Date("2019-01-01 00:00:00+0000"), "America/New_York"],
      "2018-12-31 19:00:00",
    ],
    [
      [new Date("2019-01-01 00:00:00+0000"), "UTC", { timeZoneSuffix: true }],
      "2019-01-01 00:00:00+0000",
    ],
    [
      [
        new Date("2019-01-01 00:00:00+0000"),
        "Asia/Tokyo",
        { timeZoneSuffix: true },
      ],
      "2019-01-01 09:00:00+0900",
    ],
  ])("%s -> %s", (args, expected) => {
    expect(generateDateTimeString(...args)).toBe(expected);
  });
});

describe("generateTodayDateString", () => {
  test.each<
    [
      Parameters<typeof generateTodayDateString>,
      ReturnType<typeof generateTodayDateString>,
    ]
  >([
    [[new Date("2019-01-01 00:00:00+0000"), "UTC"], "20190101"],
    [[new Date("2019-12-31 23:59:59+0000"), "UTC"], "20191231"],
    [[new Date("2019-01-01 00:00:00+0000"), "GMT"], "20190101"],
    [[new Date("2019-01-01 00:00:00+0000"), "Asia/Tokyo"], "20190101"],
    [[new Date("2019-01-01 00:00:00+0000"), "America/New_York"], "20181231"],
  ])("%s -> %s", (args, expected) => {
    expect(generateTodayDateString(...args)).toBe(expected);
  });
});

describe("toNormalizedAbsolutePath", () => {
  test.each<
    [
      Parameters<typeof toNormalizedAbsolutePath>,
      ReturnType<typeof toNormalizedAbsolutePath>,
    ]
  >([
    [["foo", "/base"], "/base/foo"],
    [["./foo", "/base"], "/base/foo"],
    [["foo/bar", "/base"], "/base/foo/bar"],
    [["foo/bar/baz/../..", "/base"], "/base/foo"],
    [["/abs", "/base"], "/abs"],
  ])("%s -> %s", (args, expected) => {
    expect(toNormalizedAbsolutePath(...args)).toBe(expected);
  });
});

describe("classifyUrl", () => {
  test.each<[Parameters<typeof classifyUrl>, ReturnType<typeof classifyUrl>]>([
    [["https://example.com"], "absolute"],
    [["http://example.com"], "absolute"],
    [["https://example.com/"], "absolute"],
    [["/foo"], "root-relative"],
    [["/foo/bar"], "root-relative"],
    [["foo"], "relative"],
    [["./foo"], "relative"],
    [["../foo"], "relative"],
    [[""], "unknown"],
  ])("%s -> %s", (args, expected) => {
    expect(classifyUrl(...args)).toBe(expected);
  });
});

describe("getPathnameWithoutTailingSlash", () => {
  test.each<
    [
      Parameters<typeof getPathnameWithoutTailingSlash>,
      ReturnType<typeof getPathnameWithoutTailingSlash>,
    ]
  >([
    [["https://example.com"], ""],
    [["https://example.com/"], ""],
    [["https://example.com/foo"], "/foo"],
    [["https://example.com/foo/"], "/foo"],
    [["https://example.com/foo/bar"], "/foo/bar"],
    [["https://example.com/foo/bar/"], "/foo/bar"],
  ])("%s -> %s", (args, expected) => {
    expect(getPathnameWithoutTailingSlash(...args)).toBe(expected);
  });
});

describe("removeTailingResourceNameFromPath", () => {
  test.each<
    [
      Parameters<typeof removeTailingResourceNameFromPath>,
      ReturnType<typeof removeTailingResourceNameFromPath>,
    ]
  >([
    [["index.html"], ""],
    [["foo"], ""],
    [["./foo"], "./"],
    [["/foo"], "/"],
    [["/foo/bar"], "/foo/"],
  ])("%s -> %s", (args, expected) => {
    expect(removeTailingResourceNameFromPath(...args)).toBe(expected);
  });
});

describe("permalinksToRelativeUrl", () => {
  test.each<
    [
      Parameters<typeof permalinksToRelativeUrl>,
      ReturnType<typeof permalinksToRelativeUrl>,
    ]
  >([
    [
      ["/index.html", "/articles/20190101-0001.html"],
      "articles/20190101-0001.html",
    ],
    [["/articles/20190101-0001.html", "/index.html"], "../index.html"],
    [["/", "/index"], "index"],
    [["/index", "/"], "."],
    [["/", "/"], "."],
    [["/same", "/same"], "same"],
    [["/samedir/same", "/samedir/same"], "same"],
    [["/samedir/foo", "/samedir/bar"], "bar"],
    [["/samedir/foo", "/samedir/bar/x"], "bar/x"],
  ])("%s -> %s", (args, expected) => {
    expect(permalinksToRelativeUrl(...args)).toBe(expected);
  });
});

describe("extractPageTitle", () => {
  it('can only extract type="heading" and depth=1', () => {
    expect(
      extractPageTitle({
        type: "root",
        children: [
          {
            type: "not_heading",
            depth: 1,
            value: "X",
          },
          {
            type: "heading",
            depth: 2,
            value: "Y",
          },
          {
            type: "heading",
            depth: 1,
            value: "FOO",
          },
          {
            type: "heading",
            depth: 2,
            value: "Z",
          },
        ],
      }),
    ).toBe("FOO");
  });

  it("should trim the value", () => {
    expect(
      extractPageTitle({
        type: "root",
        children: [
          {
            type: "heading",
            depth: 1,
            value: " FOO  ",
          },
        ],
      }),
    ).toBe("FOO");
  });

  it("should recursively join children's values", () => {
    expect(
      extractPageTitle({
        type: "root",
        children: [
          {
            type: "heading",
            depth: 1,
            value: "X",
            children: [
              {
                type: "",
                value: "A",
              },
              {
                type: "",
                value: "B",
                children: [
                  {
                    type: "",
                    value: "FOO",
                  },
                ],
              },
              {
                type: "",
                value: "C",
              },
            ],
          },
        ],
      }),
    ).toBe("X A B FOO C");
  });
});
