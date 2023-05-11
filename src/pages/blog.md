---
layout: blog.njk
title: Блог
date: 2023-05-12
pagination:
  data: collections.post
  size: 20
permalink: "blog{% if pagination.pageNumber > 0 %}/page/{{ pagination.pageNumber }}{% endif %}/index.html"
subtitle: Мои статьи и переводы на разные темы
eleventyNavigation:
  key: Блог
  order: 2
---
