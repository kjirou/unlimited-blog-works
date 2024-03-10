# <img src="https://github.com/kjirou/unlimited-blog-works/raw/main/documents/ubw-icon.png" width="32" height="32" /> unlimited-blog-works

![run-checks](https://github.com/kjirou/unlimited-blog-works/actions/workflows/run-checks.yml/badge.svg)

A simple static blog generator for publishing on GitHub Pages

## :rocket: Installation

### Software Preparation

- [Node.js](https://nodejs.org/) version 18 or higher

### Package Installation

```bash
npm install -g unlimited-blog-works
```

## :eyes: Overview

- Generate blog source with CLI
  - Sample blog source => [/exapmles/docs](/examples/docs)
- Edit Markdown formed articles with your text editor or the editor of GitHub Web
  - Sample article source => [/examples/docs/blog-source/articles/20190212-0002.md](/examples/docs/blog-source/articles/20190212-0002.md)
- Compile from Markdown to HTML and deploy it onto GitHub Pages
  - Sample deployment => [/docs](/docs) using [the feature of GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#publishing-sources-for-github-pages-sites)

## :world_map: Overall View of the Structure

![](/documents/ubw-overall-view.png)

Execute the following command at any place as a trial.

```bash
ubw init my-blog
cd ./my-blog
ubw article new
ubw compile
```

The following files will be generated.

```
tree .
.
├── blog-publication
│   ├── articles
│   │   └── 20190310-0001.html
│   ├── atom-feed.xml
│   ├── external-resources
│   │   ├── github-markdown.css
│   │   └── index.css
│   ├── index.html
│   └── robots.txt
├── blog-source
│   ├── articles
│   │   └── 20190310-0001.md
│   └── external-resources
│       ├── _direct
│       │   └── robots.txt
│       ├── github-markdown.css
│       └── index.css
└── ubw-configs.js

7 directories, 11 files
```

```
cat blog-source/articles/20190310-0001.md
---
publicId: 20190310-0001
lastUpdatedAt: '2019-03-10 08:23:09+0000'
---

# Page Title
```

```
cat blog-publication/articles/20190310-0001.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Page Title | My Blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/external-resources/index.css">
    <meta property="og:title" content="Page Title">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://example.com/articles/20190310-0001.html">
    <meta property="og:site_name" content="My Blog">
  </head>
  <body>
    <div class="ubw-article">
      <div class="markdown-body ubw-main-content">
        <h1 id="page-title">Page Title<a class="ubw-heading-slug" aria-hidden data-ubw-autolink href="">#</a></h1>
      </div>
      <hr class="ubw-end-of-main-content">
      <ul class="ubw-meta-data">
        <li class="ubw-meta-data-last-updated-at"><span>Last updated at:</span><span>2019-03-10 08:23:09 (UTC)</span></li>
        <li class="ubw-meta-data-back-to-top"><a href="/">Back to the Top</a></li>
      </ul>
    </div>
  </body>
</html>
```

## :cat: Concept

- Save sentences with the Markdown format
  - Because it is the simplest form that can express sentence structure.
- **NO** Article Status Management
  - Manage drafts and editing history with VCS such as **Git**.
- **NO** Posting Comments
  - It is more interesting to talk on external SNS.
- **NO** Text Editor
  - I think it would be better to **use the text editor you are using routinely**.
  - Also, if you want to write easily, I recommend **using the WYSIWYG editor on GitHub Web**.
- **NO** JS/CSS Preprocessor
  - Because it's hard work...

## :books: CLI API Reference

- `ubw article new [OPTIONS]`
  - Create an empty article
  - `OPTIONS`
    - `--config-file, -c`
      - A path of `ubw-configs.js` file, default is `"./ubw-configs.js"`
- `ubw compile [OPTIONS]`
  - Compile Markdown articles into HTML
  - `OPTIONS`
    - `--config-file, -c`
      - A path of `ubw-configs.js` file, default is `"./ubw-configs.js"`
- `ubw help`
  - Display help
- `ubw init BLOG_SOURCE_DIR`
  - Initialize a new blog
  - `BLOG_SOURCE_DIR`
    - A location to generate
- `ubw now`
  - Display current time by "YYYY-MM-DD HH:ii:ss+0000" format. It can be used to configure `lastUpdatedAt` in articles.
- `ubw version`
  - Display version of npm package

## :scroll: ubw-configs.js

Most of the commands reflect the configuration of "ubw-configs.js".

For details of setting, refer to the following source code and its comment at present.

- [Properties](https://github.com/kjirou/unlimited-blog-works/blob/f417f557ceeb164cef66bfc8587da66f0a0fc05e/src/page-generator.ts#L43-L122)
- [Default values](https://github.com/kjirou/unlimited-blog-works/blob/f417f557ceeb164cef66bfc8587da66f0a0fc05e/src/page-generator.ts#L128-L198)

## :writing_hand: Markdown Format

Basically it is a **GitHub compatible format**, so please refer to the following articles.

- [Mastering Markdown](https://guides.github.com/features/mastering-markdown/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)

However, for example, the following functions are not yet available.

- [Emoji](https://help.github.com/articles/basic-writing-and-formatting-syntax/#using-emoji)
- [Syntax highlighting](https://help.github.com/articles/creating-and-highlighting-code-blocks/#syntax-highlighting)

## :wrench: Development

### Softwares that needs to be locally installed

- [Node.js](https://nodejs.org/), version is defined in [.nvmrc](/.nvmrc)

### Install this application

```bash
git clone git@github.com:kjirou/unlimited-blog-works.git
cd ./unlimited-blog-works
npm install
```

## :link: Reference Urls

- [unified](https://github.com/unifiedjs)
  - The parser/generator logics of Markdown/HTML depends on the packages.
- [JS Paint](https://github.com/1j01/jspaint)
  - The above images were created on this site.
- [それなりブログ](https://kjirou.github.io/blog/)
  - This is my Japanese blog created in this package.
