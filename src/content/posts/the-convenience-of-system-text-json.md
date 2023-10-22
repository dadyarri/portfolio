---
title: Удобство System.Text.Json
source: https://devblogs.microsoft.com/dotnet/the-convenience-of-system-text-json/
description: Обработка JSON это одна из самых частых задач, выполняемых разработчиками. В этой статье сравним разные подходы к этому с точки зрения спектра удобства и производительности
publishedAt: 2023-10-21
isPublish: true
tags: [".NET", "Перевод"]
---

[Обработка JSON-документов](https://learn.microsoft.com/dotnet/standard/serialization/system-text-json/overview), это одна из самых частых задач, возникающих перед разработчиками в современных проектах, причём как в облачных, так и в клиентских приложениях. [`System.Text.Json`](https://learn.microsoft.com/dotnet/standard/serialization/system-text-json/how-to) предлагает несколько API для чтения и записи JSON документов. В этом посте мы посмотрим на удобство чтения и записи JSON с помощью `System.Text.Json`. Кроме того, рассмотрим популярную библиотеку с широкими возможностями [`Newtonsoft.Json`](https://www.newtonsoft.com/json) (так же известную как Json.NET).

Недавно мы начали новый цикл статей про [удобство .NET](/posts/convenience-of-dotnet), которая описывает наш подход к созданию удобных API для решения часто возникающих задач. Основной посыл, который транслирует этот цикл статей в том, что одно из преимуществ .NET предоставляет множество API 