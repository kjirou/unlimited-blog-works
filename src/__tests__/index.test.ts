import fs from "fs-extra";
import path from "path";

import {
  UbwSettings,
  executeArticleNew,
  executeCompile,
  executeCompileWithSettings,
  executeHelp,
  executeInit,
  executeNow,
  executeVersion,
  requireSettings,
} from "../index";
import { ArticlePageProps, NonArticlePageProps } from "../templates/shared";
import { dumpDir, prepareWorkspace } from "../test-helper";

const clearModule = require("clear-module");
const hast = require("hastscript");

const testTmpDir = "index";
let workspaceRoot: string;

beforeEach(() => {
  workspaceRoot = prepareWorkspace(testTmpDir);
});

describe("executeVersion", () => {
  it("can return a string that seems to be a version", () => {
    return executeVersion().then((result) => {
      expect(result.exitCode).toBe(0);
      expect(/^\d+\.\d+\.\d+$/.test(result.message)).toBe(true);
    });
  });
});

describe("executeHelp", () => {
  it("can return a sentence", () => {
    return executeHelp().then((result) => {
      expect(result.exitCode).toBe(0);
      expect(result.message.length > 0).toBe(true);
    });
  });
});

describe("executeNow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2019-01-01 00:00:00+0000"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return a date-time string formatted with UTC", () => {
    return executeNow().then((result) => {
      expect(result.exitCode).toBe(0);
      expect(result.message).toBe("2019-01-01 00:00:00+0000");
    });
  });
});

describe("executeInit", () => {
  it("can create some files", () => {
    return executeInit(workspaceRoot).then((result) => {
      expect(result.exitCode).toBe(0);

      const dump = dumpDir(workspaceRoot);
      expect(typeof dump["ubw-configs.js"]).toBe("string");
      expect(typeof dump["blog-source/external-resources/index.css"]).toBe(
        "string",
      );
      expect(
        typeof dump["blog-source/external-resources/github-markdown.css"],
      ).toBe("string");
    });
  });
});

describe("executeArticleNew", () => {
  describe("when after `executeInit`", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2019-01-01 00:00:00+0000"));
      return executeInit(workspaceRoot);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("can create a source file of an article", () => {
      return executeArticleNew(path.join(workspaceRoot, "ubw-configs.js")).then(
        (result) => {
          expect(result.exitCode).toBe(0);

          const dump = dumpDir(workspaceRoot);
          expect(typeof dump["blog-source/articles/20190101-0001.md"]).toBe(
            "string",
          );
        },
      );
    });
  });
});

describe("executeCompile, executeCompileWithSettings", () => {
  describe("when after `executeInit` and `executeArticleNew`", () => {
    let configFilePath: string;

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2019-01-01 00:00:00+0000"));
      configFilePath = path.join(workspaceRoot, "ubw-configs.js");

      return executeInit(workspaceRoot)
        .then(() => {
          clearModule(configFilePath);
          return executeArticleNew(configFilePath);
        })
        .then(() => {
          clearModule(configFilePath);
        });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe("basic specification of `executeCompile`", () => {
      it("can create some files into the publication directory", () => {
        return executeCompile(configFilePath).then((result) => {
          expect(result.exitCode).toBe(0);

          const dump = dumpDir(workspaceRoot);
          expect(typeof dump["blog-publication/index.html"]).toBe("string");
          expect(typeof dump["blog-publication/atom-feed.xml"]).toBe("string");
          expect(typeof dump["blog-publication/robots.txt"]).toBe("string");
          expect(
            typeof dump["blog-publication/external-resources/index.css"],
          ).toBe("string");
          expect(
            typeof dump[
              "blog-publication/external-resources/github-markdown.css"
            ],
          ).toBe("string");
          expect(
            typeof dump["blog-publication/articles/20190101-0001.html"],
          ).toBe("string");
        });
      });

      it("should set an empty href attribute for the title of each page", () => {
        return executeCompile(configFilePath).then((result) => {
          expect(result.exitCode).toBe(0);

          const dump = dumpDir(workspaceRoot);
          expect(
            /<h1 .+href="".+<\/h1>/.test(dump["blog-publication/index.html"]),
          ).toBe(true);
          expect(
            /<h1 .+href="".+<\/h1>/.test(
              dump["blog-publication/articles/20190101-0001.html"],
            ),
          ).toBe(true);
        });
      });
    });

    describe('"_direct" directory', () => {
      it('should succeed even if there is no "_direct" directory', () => {
        fs.removeSync(
          path.join(workspaceRoot, "blog-source/external-resources/_direct"),
        );

        return executeCompile(configFilePath).then((result) => {
          const dump = dumpDir(workspaceRoot);
          expect(typeof dump["blog-publication/index.html"]).toBe("string");
          expect(typeof dump["blog-publication/robots.txt"]).toBe("undefined");
        });
      });

      it('should succeed even if the "_direct" directory is empty', () => {
        fs.emptyDirSync(
          path.join(workspaceRoot, "blog-source/external-resources/_direct"),
        );

        return executeCompile(configFilePath).then((result) => {
          const dump = dumpDir(workspaceRoot);
          expect(typeof dump["blog-publication/index.html"]).toBe("string");
          expect(typeof dump["blog-publication/robots.txt"]).toBe("undefined");
        });
      });
    });

    describe("use settings", () => {
      let settings: UbwSettings;

      beforeEach(() => {
        clearModule(configFilePath);
        settings = requireSettings(configFilePath);
      });

      describe("ogp, defaultOgpImageUrl", () => {
        let articleSource: string;

        beforeEach(() => {
          articleSource = fs
            .readFileSync(
              path.join(workspaceRoot, "blog-source/articles/20190101-0001.md"),
            )
            .toString();

          Object.assign(settings.configs, {
            blogName: "FOO",
            blogUrl: "https://example.com/bar",
          });
        });

        it("og:title, og:url, og:site_name, og:type", () => {
          return executeCompileWithSettings(settings).then((result) => {
            const dump = dumpDir(workspaceRoot);
            expect(
              dump["blog-publication/articles/20190101-0001.html"].indexOf(
                '<meta property="og:type" content="website">',
              ),
            ).not.toBe(-1);
            expect(
              dump["blog-publication/articles/20190101-0001.html"].indexOf(
                '<meta property="og:url" content="https://example.com/bar/articles/20190101-0001.html">',
              ),
            ).not.toBe(-1);
            expect(
              dump["blog-publication/articles/20190101-0001.html"].indexOf(
                '<meta property="og:site_name" content="FOO">',
              ),
            ).not.toBe(-1);

            expect(
              dump["blog-publication/index.html"].indexOf(
                '<meta property="og:type" content="website">',
              ),
            ).not.toBe(-1);
            expect(
              dump["blog-publication/index.html"].indexOf(
                '<meta property="og:url" content="https://example.com/bar/">',
              ),
            ).not.toBe(-1);
            expect(
              dump["blog-publication/index.html"].indexOf(
                '<meta property="og:site_name" content="FOO">',
              ),
            ).not.toBe(-1);
          });
        });

        it("og:description", () => {
          fs.writeFileSync(
            path.join(workspaceRoot, "blog-source/articles/20190101-0001.md"),
            articleSource + "Foo Bar\n\nBaz\n",
          );

          return executeCompileWithSettings(settings).then((result) => {
            const dump = dumpDir(workspaceRoot);
            expect(
              dump["blog-publication/articles/20190101-0001.html"].indexOf(
                '<meta property="og:description" content="Foo Bar Baz">',
              ),
            ).not.toBe(-1);
          });
        });

        describe("og:image", () => {
          beforeEach(() => {
            settings.configs.defaultOgpImageUrl =
              "https://example.com/default.png";
          });

          it("should use defaultOgpImageUrl when the article does not have any images", () => {
            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/articles/20190101-0001.html"].indexOf(
                  '<meta property="og:image" content="https://example.com/default.png">',
                ),
              ).not.toBe(-1);
            });
          });

          it('should not render "og:image" when the article does not have any images and defaultOgpImageUrl is an empty', () => {
            settings.configs.defaultOgpImageUrl = "";
            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/articles/20190101-0001.html"].indexOf(
                  "og:image",
                ),
              ).toBe(-1);
            });
          });

          it('should use the first "![](url)" of the article', () => {
            fs.writeFileSync(
              path.join(workspaceRoot, "blog-source/articles/20190101-0001.md"),
              articleSource +
                "![](http://foo.com/a.png) ![](http://bar.com/b.png)",
            );

            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/articles/20190101-0001.html"].indexOf(
                  '<meta property="og:image" content="http://foo.com/a.png">',
                ),
              ).not.toBe(-1);
            });
          });

          it('should resolve the "![](relative-url)" of the article', () => {
            fs.writeFileSync(
              path.join(workspaceRoot, "blog-source/articles/20190101-0001.md"),
              articleSource + "![](./a.png)",
            );

            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/articles/20190101-0001.html"].indexOf(
                  '<meta property="og:image" content="https://example.com/bar/articles/a.png">',
                ),
              ).not.toBe(-1);
            });
          });

          it('should resolve the "![](root-relative-url)" of the article', () => {
            fs.writeFileSync(
              path.join(workspaceRoot, "blog-source/articles/20190101-0001.md"),
              articleSource + "![](/a.png)",
            );

            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/articles/20190101-0001.html"].indexOf(
                  '<meta property="og:image" content="https://example.com/bar/a.png">',
                ),
              ).not.toBe(-1);
            });
          });

          it("should use defaultOgpImageUrl in non-articles", () => {
            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/index.html"].indexOf(
                  '<meta property="og:image" content="https://example.com/default.png">',
                ),
              ).not.toBe(-1);
            });
          });

          it('should not render "og:image" in non-articles when defaultOgpImageUrl is an empty', () => {
            settings.configs.defaultOgpImageUrl = "";
            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/index.html"].indexOf("og:image"),
              ).toBe(-1);
            });
          });
        });
      });

      it("generateArticleHeadNodes", () => {
        settings.configs.generateArticleHeadNodes = function (
          props: ArticlePageProps,
        ): HastscriptAst[] {
          return [
            hast("script", { src: "/path/to/foo.js" }),
            hast("link", { rel: "/path/to/bar.css" }),
          ];
        };

        return executeCompileWithSettings(settings).then((result) => {
          const dump = dumpDir(workspaceRoot);
          expect(
            dump["blog-publication/articles/20190101-0001.html"].indexOf(
              '<script src="/path/to/foo.js"></script>',
            ),
          ).not.toBe(-1);
          expect(
            dump["blog-publication/articles/20190101-0001.html"].indexOf(
              '<link rel="/path/to/bar.css">',
            ),
          ).not.toBe(-1);
        });
      });

      it("generateNonArticleHeadNodes", () => {
        settings.configs.generateNonArticleHeadNodes = function (
          props: NonArticlePageProps,
        ): HastscriptAst[] {
          return [
            hast("script", { src: "/path/to/foo.js" }),
            hast("link", { rel: "/path/to/bar.css" }),
          ];
        };

        return executeCompileWithSettings(settings).then((result) => {
          const dump = dumpDir(workspaceRoot);
          expect(
            dump["blog-publication/index.html"].indexOf(
              '<script src="/path/to/foo.js"></script>',
            ),
          ).not.toBe(-1);
          expect(
            dump["blog-publication/index.html"].indexOf(
              '<link rel="/path/to/bar.css">',
            ),
          ).not.toBe(-1);
        });
      });

      describe("additionalTopPageLinks", () => {
        it("can render the value as anchor tags", () => {
          settings.configs.additionalTopPageLinks = [
            { linkText: "FOOOO", href: "https://example.com/aaa" },
            { linkText: "BARRR", href: "https://example.com/bbb" },
          ];

          return executeCompileWithSettings(settings).then((result) => {
            const dump = dumpDir(workspaceRoot);
            expect(
              dump["blog-publication/index.html"].indexOf(
                '<a href="https://example.com/aaa">FOOOO</a>',
              ),
            ).not.toBe(-1);
            expect(
              dump["blog-publication/index.html"].indexOf(
                '<a href="https://example.com/bbb">BARRR</a>',
              ),
            ).not.toBe(-1);
          });
        });
      });

      describe("nonArticles", () => {
        describe("pathIsNormalizedToSlash", () => {
          it('should normalize the value of href attribute linking to the top page to "/" when the value is true', () => {
            const topPageConfigs = settings.configs.nonArticles.find(
              (nonArticle) => nonArticle.nonArticlePageId === "top",
            ) as any;
            topPageConfigs.pathIsNormalizedToSlash = true;

            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/articles/20190101-0001.html"].indexOf(
                  '<a href="/">Back to the Top</a>',
                ),
              ).not.toBe(-1);
            });
          });

          it('should render the value of href attribute linking to the top page as "/{filename}.html" when the value is false', () => {
            const topPageConfigs = settings.configs.nonArticles.find(
              (nonArticle) => nonArticle.nonArticlePageId === "top",
            ) as any;
            topPageConfigs.pathIsNormalizedToSlash = false;

            return executeCompileWithSettings(settings).then((result) => {
              const dump = dumpDir(workspaceRoot);
              expect(
                dump["blog-publication/articles/20190101-0001.html"].indexOf(
                  '<a href="/index.html">Back to the Top</a>',
                ),
              ).not.toBe(-1);
            });
          });
        });
      });
    });
  });
});
