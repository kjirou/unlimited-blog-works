import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import * as path from "path";

import {
  ActualUbwConfigs,
  ArticlePage,
  NonArticlePage,
  UbwConfigs,
  createDefaultUbwConfigs as createDefaultUbwConfigs_,
  createInitialArticleFrontMatters,
  createInitialUbwConfigs,
  fillWithDefaultUbwConfigs,
  generateArticlePages,
  generateNonArticlePages,
  getNextAutomaticArticleId,
  initializeArticlePages,
  initializeNonArticlePages,
  preprocessArticlePages,
  preprocessNonArticlePages,
} from "./page-generator";
import {
  CONFIG_FILE_NAME,
  PRESETS_EXTERNAL_RESOURCES_ROOT,
  generateBlogPaths,
  generateDateTimeString,
  generateTodayDateString,
  toNormalizedAbsolutePath,
} from "./utils";

export interface CommandResult {
  exitCode: number;
  message: string;
}

export interface UbwSettings {
  configs: UbwConfigs;
  blogRoot: string;
}

export function requireSettings(configFilePath: string): UbwSettings {
  const generateActualUbwConfigs = require(configFilePath);
  const actualConfigs = generateActualUbwConfigs() as ActualUbwConfigs;
  const configs = fillWithDefaultUbwConfigs(actualConfigs);
  const blogRoot = path.join(path.dirname(configFilePath), configs.blogDir);

  return {
    configs,
    blogRoot,
  };
}

export const createDefaultUbwConfigs = createDefaultUbwConfigs_;

export const cliUtils = {
  CONFIG_FILE_NAME,
  toNormalizedAbsolutePath,
};

//
// Executables
//

export function executeArticleNew(
  configFilePath: string,
): Promise<CommandResult> {
  const { configs, blogRoot } = requireSettings(configFilePath);

  const paths = generateBlogPaths(blogRoot, configs.publicationDir);

  fs.ensureDirSync(paths.sourceRoot);
  fs.ensureDirSync(paths.sourceArticlesRoot);

  const articlePages: ArticlePage[] = initializeArticlePages(
    blogRoot,
    configs,
    fs.readdirSync(paths.sourceArticlesRoot),
  );

  const now = new Date();
  const todayDateString = generateTodayDateString(now, configs.timeZone);
  const articleId = getNextAutomaticArticleId(articlePages, todayDateString);
  const frontMatters = createInitialArticleFrontMatters(
    articleId,
    generateDateTimeString(now, "UTC", { timeZoneSuffix: true }),
  );

  fs.writeFileSync(
    path.join(paths.sourceArticlesRoot, articleId + ".md"),
    [
      // TODO: Want to wrap string variables with double quotes always.
      "---\n" + yaml.dump(frontMatters) + "---",
      "",
      "# Page Title\n",
    ].join("\n"),
  );

  return Promise.resolve({
    exitCode: 0,
    message: "",
  });
}

export function executeCompile(configFilePath: string): Promise<CommandResult> {
  const settings = requireSettings(configFilePath);
  return executeCompileWithSettings(settings);
}

// Separate it from `executeCompile` to change the `configs` at the time of the test
export function executeCompileWithSettings(
  settings: UbwSettings,
): Promise<CommandResult> {
  const { configs, blogRoot } = settings;
  const paths = generateBlogPaths(blogRoot, configs.publicationDir);

  let articlePages: ArticlePage[] = initializeArticlePages(
    blogRoot,
    configs,
    fs.readdirSync(paths.sourceArticlesRoot),
  ).map((articlePage) => {
    return Object.assign({}, articlePage, {
      markdown: fs.readFileSync(articlePage.inputFilePath).toString(),
    });
  });
  let nonArticlePages: NonArticlePage[] = initializeNonArticlePages(
    blogRoot,
    configs,
  );

  articlePages = preprocessArticlePages(blogRoot, configs, articlePages);
  nonArticlePages = preprocessNonArticlePages(
    blogRoot,
    configs,
    nonArticlePages,
  );

  articlePages = generateArticlePages(
    blogRoot,
    configs,
    articlePages,
    nonArticlePages,
  );
  nonArticlePages = generateNonArticlePages(
    blogRoot,
    configs,
    articlePages,
    nonArticlePages,
  );

  fs.ensureDirSync(paths.publicationRoot);
  fs.ensureDirSync(paths.publicationArticlesRoot);

  articlePages.forEach((article) => {
    fs.writeFileSync(article.outputFilePath, article.html);
  });
  nonArticlePages.forEach((nonArticlePage) => {
    fs.writeFileSync(nonArticlePage.outputFilePath, nonArticlePage.html);
  });

  fs.copySync(
    paths.sourceExternalResourcesRoot,
    paths.publicationExternalResourcesRoot,
  );

  // Expand files under the "external-resources/_direct" into under the document root.
  //
  // NOTICE: Previously expanded files using "fs-extra"'s `moveSync` like the following code,
  //         this didn't work in the Travis CI environment.
  //         ```
  //         fs.moveSync("/path/to/external-resources/_direct", "/path/to/publication");
  //         ```
  fs.ensureDirSync(paths.publicationExternalResourcesDirectPlacementRoot);
  fs.readdirSync(paths.publicationExternalResourcesDirectPlacementRoot).forEach(
    (fileName) => {
      const from = path.join(
        paths.publicationExternalResourcesDirectPlacementRoot,
        fileName,
      );
      const to = path.join(paths.publicationRoot, fileName);
      fs.copySync(from, to);
    },
  );
  fs.removeSync(paths.publicationExternalResourcesDirectPlacementRoot);

  return Promise.resolve({
    exitCode: 0,
    message: "",
  });
}

export function executeHelp(): Promise<CommandResult> {
  return Promise.resolve({
    exitCode: 0,
    message:
      "Please see the README of https://github.com/kjirou/unlimited-blog-works",
  });
}

export function executeInit(blogRoot: string): Promise<CommandResult> {
  const configFilePath = path.join(blogRoot, CONFIG_FILE_NAME);

  const initialConfigs = createInitialUbwConfigs();
  const configs = fillWithDefaultUbwConfigs(initialConfigs);

  const configFileSource = [
    "module.exports = function ubwConfigs() {",
    `return ${JSON.stringify(initialConfigs, null, 2)};`
      .split("\n")
      .map((line) => "  " + line)
      .join("\n"),
    "}",
    "",
  ].join("\n");

  fs.ensureDirSync(blogRoot);
  fs.writeFileSync(configFilePath, configFileSource);

  const paths = generateBlogPaths(blogRoot, configs.publicationDir);

  fs.ensureDirSync(paths.sourceExternalResourcesRoot);
  fs.copySync(
    PRESETS_EXTERNAL_RESOURCES_ROOT,
    paths.sourceExternalResourcesRoot,
  );

  return Promise.resolve({
    exitCode: 0,
    message: "",
  });
}

export function executeNow(): Promise<CommandResult> {
  return Promise.resolve({
    exitCode: 0,
    message: generateDateTimeString(new Date(), "UTC", {
      timeZoneSuffix: true,
    }),
  });
}

export function executeVersion(): Promise<CommandResult> {
  const packageJson = require("../package.json") as { version: string };

  return Promise.resolve({
    exitCode: 0,
    message: packageJson.version,
  });
}
