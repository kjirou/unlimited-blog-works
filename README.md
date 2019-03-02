# <img src="https://github.com/kjirou/unlimited-blog-works/raw/documents/documents/ubw-icon.png" width="32" height="32" /> unlimited-blog-works

[![npm version](https://badge.fury.io/js/unlimited-blog-works.svg)](https://badge.fury.io/js/unlimited-blog-works)
[![Build Status](https://travis-ci.org/kjirou/unlimited-blog-works.svg?branch=master)](https://travis-ci.org/kjirou/unlimited-blog-works)

A simple static blog generator for publishing on GitHub Pages


## :rocket: Installation

```bash
npm install -g unlimited-blog-works
```


## :eyes: Overview

- Generate blog source by command.
  - Sample blog source => [/exapmles/docs](/examples/docs)
- Edit the Markdown formed article with your text editor or GitHub Web's editor.
  - Sample article source => [/examples/docs/blog-source/articles/20190212-0001.md](/examples/docs/blog-source/articles/20190212-0001.md)
- Compile from Markdown to HTML by command and host it by [GitHub Pages](https://pages.github.com/).
  - Sample hosting => `git push` compilation results to [/docs](/docs) and is hosted to [https://kjirou.github.io/unlimited-blog-works/](https://kjirou.github.io/unlimited-blog-works/) by [the feature of GitHub](https://help.github.com/en/articles/configuring-a-publishing-source-for-github-pages#publishing-your-github-pages-site-from-a-docs-folder-on-your-master-branch).


## :world_map: Overall View of the Structure

![](/documents/ubw-overall-view.png)

Execute the following command at arbitrary place as a trial.
```bash
ubw init my-blog
cd ./my-blog
ubw article new
ubw compile
```

The following files will be generated.
```
tree ./my-blog
.
├── blog-publication
│   ├── articles
│   │   └── 20190302-0001.html
│   ├── atom-feed.xml
│   ├── external-resources
│   │   ├── github-markdown.css
│   │   └── index.css
│   ├── index.html
│   └── robots.txt
├── blog-source
│   ├── articles
│   │   └── 20190302-0001.md
│   └── external-resources
│       ├── _direct
│       │   └── robots.txt
│       ├── github-markdown.css
│       └── index.css
└── ubw-configs.js

7 directories, 11 files
```

```
cat blog-source/articles/20190302-0001.md
---
publicId: 20190302-0001
lastUpdatedAt: '2019-03-02 04:57:24+0000'
---

# Page Title
```

```
cat blog-publication/articles/20190302-0001.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Page Title | My Blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/external-resources/index.css">
    <meta property="og:title" content="Page Title">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://example.com/articles/20190302-0001.html">
    <meta property="og:site_name" content="My Blog">
  </head>
  <body>
    <div class="ubw-article">
      <div class="markdown-body ubw-main-content">
        <h1 id="page-title">Page Title<a class="ubw-heading-slug" aria-hidden href="#page-title">#</a></h1>
      </div>
      <hr class="ubw-end-of-main-content">
      <ul class="ubw-meta-data">
        <li class="ubw-meta-data-last-updated-at"><span>Last updated at:</span><span>2019-03-02 04:57:24 (UTC)</span></li>
        <li class="ubw-meta-data-back-to-top"><a href="/index.html">Back to the Top</a></li>
      </ul>
    </div>
  </body>
</html>
```


## :cat: Concept

- **NO** Article Status Management
  - Manage drafts and editing history via VCS such as **Git**.
- **NO** Posting Comments
  - It is more interesting to talk on external SNS such as [Twitter](https://twitter.com/).
- **NO** Text Editor
  - I think it would be better to **use the text editor you are using routinely**.
  - Also, if you want to write easily, I recommend **using the WYSIWYG editor on GitHub Web**.
- **NO** JS/CSS Preprocessor
  - Generation such as JS/CSS used on the client side should be managed independently using software such as [webpack](https://webpack.js.org/) in modern times.


## :books: CLI API Reference

- `ubw article new [OPTIONS]`
  - `OPTIONS`
    - `--config-file, -c`
      - Pass the path of `ubw-configs.js`. If not specified, use the one in the current directory.
- `ubw compile [OPTIONS]`
  - `OPTIONS`
    - `--config-file, -c`
      - Pass the path of `ubw-configs.js`. If not specified, use the one in the current directory.
- `ubw init BLOG_SOURCE_DIR`
  - `BLOG_SOURCE_DIR`
    - Specify a location to generate a blog repository.


## :scroll: ubw-configs.js

Most of the commands reflect the configuration of "ubw-configs.js".

For details of setting, refer to the following source code and its comment at present.

- [Properties](https://github.com/kjirou/unlimited-blog-works/blob/8caadf1ec3ec7d335c63d45a9995ab3f126fc645/src/page-generator.ts#L41-L105)
- [Default Values](https://github.com/kjirou/unlimited-blog-works/blob/8caadf1ec3ec7d335c63d45a9995ab3f126fc645/src/page-generator.ts#L110-L173)


## :wrench: Development
### Softwares that needs to be locally installed

- [Node.js](https://nodejs.org/) `== 10`

### Install this application

```bash
git clone git@github.com:kjirou/unlimited-blog-works.git
cd ./unlimited-blog-works
npm install
```


## :link: Reference Urls

- [unified](https://github.com/unifiedjs)
  - The parser/generator logics of Markdown and HTML depends on the library.
- [JS Paint](https://github.com/1j01/jspaint)
  - The above images were created on this site.
