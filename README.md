# vuepress-offline: Offline vuepress output page

[中文文档](README_zh_CN.md)

[VuePress](https://vuepress.vuejs.org/) is a very good static website generator, but the static files it generates can only be hosted on HTTP services for browsing.

But sometimes we don't have an HTTP server to host, so we hope to open it in the local browser to access. There are many similar problems in VuePress Issue, such as:
 
  - [#796](https://github.com/vuejs/vuepress/issues/796)
  - [#387](https://github.com/vuejs/vuepress/issues/387)

This procedure is to solve this problem.

# Instructions

installation

````bash
yarn install -g vuepress-offline
````

If your VuePress output directory is `dist`, then use the `-d` parameter to specify the output directory:

````bash
vuepress-offline -d dist
````

# Features

  - Support the conversion of `css`, `javascript`, `image`, and `hyperlinks` in HTML pages
  - Support conversion of part of `import` in CSS

  
