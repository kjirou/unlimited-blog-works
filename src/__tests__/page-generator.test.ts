import hast from "hastscript";

import {
  ArticlePage,
  createArticlePage,
  extractOgpDescription,
  generateH1AutolinkHrefReplacementTransformer,
  getNextAutomaticArticleId,
} from "../page-generator";

describe("extractOgpDescription", function () {
  it('should pick up only values of type="text"', function () {
    expect(
      extractOgpDescription({
        type: "root",
        children: [
          { type: "text", value: "a" },
          { type: "foo", value: "X" },
          { type: "text", value: "b" },
          { type: "bar", value: "X" },
          { type: "text", value: "c" },
        ],
      }),
    ).toBe("a b c");
  });

  it("can ignore some specified types", function () {
    expect(
      extractOgpDescription({
        type: "foo",
        children: [
          { type: "text", value: "a" },
          {
            type: "html",
            children: [{ type: "text", value: "X" }],
          },
          {
            type: "bar",
            children: [
              { type: "code", value: "X" },
              { type: "text", value: "b" },
            ],
          },
        ],
      }),
    ).toBe("a b");
  });

  it("can return an empty string if there are no matched nodes", function () {
    expect(
      extractOgpDescription({
        type: "root",
        children: [{ type: "code", value: "X" }],
      }),
    ).toBe("");
  });

  it("should consider the max-length", function () {
    expect(
      extractOgpDescription({
        type: "text",
        value: "a".repeat(90),
      }),
    ).toBe("a".repeat(90));
    expect(
      extractOgpDescription({
        type: "text",
        value: "a".repeat(91),
      }),
    ).toBe("a".repeat(87) + "...");
  });

  it("can collapse /\\s+/ characters", function () {
    expect(
      extractOgpDescription({
        type: "root",
        children: [
          {
            type: "text",
            value: "a b  c\td\r\ne   ",
          },
          {
            type: "text",
            value: "  f g",
          },
        ],
      }),
    ).toBe("a b c d e f g");
  });
});

describe("generateH1AutolinkHrefReplacementTransformer", function () {
  it("can empty a href", function () {
    const tree = hast("h1", [
      hast("a", {
        dataUbwAutolink: true,
        href: "#foo",
      }),
    ]);
    generateH1AutolinkHrefReplacementTransformer("dataUbwAutolink")(tree);
    expect(tree).toStrictEqual({
      type: "element",
      tagName: "h1",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "a",
          properties: {
            dataUbwAutolink: true,
            href: "",
          },
          children: [],
        },
      ],
    });
  });

  it('should only replace "h1 > a" nodes', function () {
    const tree = hast("body", [
      hast("h2", [
        hast("a", {
          dataUbwAutolink: true,
          href: "#one",
        }),
      ]),
      hast("h1", [
        hast("a", {
          dataUbwAutolink: true,
          href: "#two",
        }),
      ]),
      hast("h2", [
        hast("a", {
          dataUbwAutolink: true,
          href: "#three",
        }),
      ]),
      hast("h1", [
        hast("a", {
          dataUbwAutolink: true,
          href: "#four",
        }),
      ]),
      hast("h2", [
        hast("a", {
          dataUbwAutolink: true,
          href: "#five",
        }),
      ]),
    ]);
    generateH1AutolinkHrefReplacementTransformer("dataUbwAutolink")(tree);
    expect((tree as any).children[0].children[0].properties.href).toBe("#one");
    expect((tree as any).children[1].children[0].properties.href).toBe("");
    expect((tree as any).children[2].children[0].properties.href).toBe(
      "#three",
    );
    expect((tree as any).children[3].children[0].properties.href).toBe("");
    expect((tree as any).children[4].children[0].properties.href).toBe("#five");
  });

  it("should only replace nodes marked with specified attributes", function () {
    const tree = hast("div", [
      hast("h1", [
        hast("a", {
          foo: true,
          href: "#one",
        }),
      ]),
      hast("h1", [
        hast("a", {
          bar: true,
          href: "#two",
        }),
      ]),
      hast("h1", [
        hast("a", {
          foo: true,
          href: "#three",
        }),
      ]),
    ]);
    generateH1AutolinkHrefReplacementTransformer("foo")(tree);
    expect((tree as any).children[0].children[0].properties.href).toBe("");
    expect((tree as any).children[1].children[0].properties.href).toBe("#two");
    expect((tree as any).children[2].children[0].properties.href).toBe("");
  });
});

describe("getNextAutomaticArticleId", function () {
  it("can increment a number", function () {
    const articlePages: ArticlePage[] = [
      Object.assign(createArticlePage(), { articleId: "20190101-0001" }),
    ];
    expect(getNextAutomaticArticleId(articlePages, "20190101")).toBe(
      "20190101-0002",
    );
  });

  it("can increment the higher of the two numbers", function () {
    const articlePages: ArticlePage[] = [
      Object.assign(createArticlePage(), { articleId: "20190101-0002" }),
      Object.assign(createArticlePage(), { articleId: "20190101-9998" }),
    ];
    expect(getNextAutomaticArticleId(articlePages, "20190101")).toBe(
      "20190101-9999",
    );
  });

  it('can get "0001" when there are no articles', function () {
    expect(getNextAutomaticArticleId([], "20190101")).toBe("20190101-0001");
  });

  it("should ignore articleIds that can't be parsed as a date", function () {
    const articlePages: ArticlePage[] = [
      Object.assign(createArticlePage(), { articleId: "20190102-0001" }),
      Object.assign(createArticlePage(), { articleId: "2019010X-0001" }),
    ];
    expect(getNextAutomaticArticleId(articlePages, "20190101")).toBe(
      "20190101-0001",
    );
  });
});
