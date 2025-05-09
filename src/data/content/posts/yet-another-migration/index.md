---
title: "Переезд блога на другой фреймворк (да, опять)"
date: "2025-05-31"
draft: true
tags: ["chatterbox", "blog"]
series: "ssg"

---

Прошло куча времени, как я начал писать [свой генератор статических сайтов](/posts/ssg-with-blackjack-and-plugins). Но спустя пару месяцев я пришёл к выводу, что в одиночку проект такого масштаба не потяну. Поэтому пришло время мигрировать на технологию, которой я изначально хотел избежать.

<!--more-->

В процессе построения архитектуры генератора статических сайтов я понял, что полноценного решения с плагинами на Go я не напишу. Слишком много ограничений, которые я (как разработчик-одиночка с фул-тайм работой) не смогу преодолеть. Например, плагины пришлось бы встраивать непосредственно в исходники (довольно неудобно и быстро засорит код), либо предоставлять способ запускать сторонние бинарники (потенциально небезопасно и потребовало бы собственного репозитория плагинов). В общем, эту реализацию я бросил и пришёл к тому, чего хотел всеми силами избежать. **JavaScript**. 

![](you-should-fight.jpg)

Вообще говоря, я изначально держал мысль писать проект на JavaScript как запасную, но откладывал её из-за того, что конечному пользователю вместо того, чтобы просто держать простую папку с его контентом, придётся создавать ещё и полноценный JavaScript-проект, который может разрастись до безумных размеров, не говоря уже про конфликты зависимостей и прочие радости жизни.

Но у такого подхода есть и свои плюсы. Как бы это ни было прискорбно, JavaScript всё ещё основная технология в современном вебе (как-нибудь потом расскажу, почему я считаю, что это плохо), поэтому здесь есть все необходимые мне инструменты, включая Sass и PostCSS. Имея все это напрямую без костылей, можно сделать подготовку ресурсов к публикации достаточно удобной, а прибитый гвоздями к языку NPM сильно упрощает работу с системой плагинов.

С другой стороны у этого проекта пропадает ценность, как у чего-то уникального. На Go есть [Hugo](https://gohugo.io) – вполне состоявшийся генератор статических сайтов. Но вся расширяемость в нем ограничена написанием кастомных макросов для шаблонизатора и скриптов. И это совсем не то, что мне нужно, то есть сложную логику на стороне сборщика к Hugo я добавить не могу. Поэтому на Go мой проект имел какой-то смысл и мог принести что-то своё.

В JavaScript мире есть [Astro](https://astro.build), который способен на всё то, что я хотел бы видеть в своем генераторе сайтов с блекджеком и плагинами. И писать свой такой же, кажется, смысла особого нет, ведь Astro — уже проверенный временем и сообществом инструмент, а я, как одиночка, лишь впустую потрачу время, пусть и получив опыт в технологии, которая мне никогда особо не нравилась.

Так что думаю, мне стоит просто написать свои интеграции к Astro с необходимым мне функционалом и перетащить блог на него обратно.

# Переезд на Astro

Когда-то этот блог уже работал на нём. Я в то время вместо того, чтобы регулярно что-то писать, часто прыгал с фреймворка на фреймворк. 11ty, Astro, Lume, Zola… Here we go again…

![](scheisse.png)

Но эта попытка отличается от всех предыдущих. Если раньше я старался не погружаться в дебри веб-технологий и просто брал готовую тему и с минимальными правками запускал сайт, то перебравшись на Zola, я через некоторое время написал свою тему практически с нуля, взяв разве что готовую цветовую схему Tokyo Night. Эта реинкарнация на Astro продожает идеи той темы, но снова переписана с нуля, причёсана и улучшена. Кроме того, я добавил красивое резюме. Кажется, теперь получилось совсем хорошо.

И вот, когда редизайн готов, можно задуматься о том, чтобы наполнить сайт нужным мне функционалом. Просто статика, без реактивного мракобесия, это, конечно, хорошо, но хотелось бы, чтобы он красиво выглядел и за его пределами. Для этого существует Open Graph, о котором я уже не раз говорил в цикле [про генерацию изображений](/posts/series/ogimages). Это протокол, который говорит соцсетям, как отображать ссылки на сайт при отправке. В результате получается карточка с описанием и обложкой. И вот эту обложку как раз и нужно генерировать для каждого выходящего поста.

# Astro Integrations

Первое что приходит на ум — использовать встроенные в фреймворк инструменты. Astro позволяет писать кастомные [хуки](https://docs.astro.build/en/reference/integrations-reference) к различным событиям в процессе сборки сайта. Один из них даёт достаточное количество информации для генерации изображения. Это [`astro:build:done`](https://docs.astro.build/en/reference/integrations-reference/#astrobuilddone), который вызывается после завершения сборки и очистки лишнего мусора. Попробуем навесить свою интеграцию на это событие.

```typescript
"hooks": {
    "astro:build:done": async ({ dir, pages }) => {

    }
}
```

`dir` здесь это путь к исходникам сайта, в моём случае `./src`. `pages` — массив объектов с одним полем `pathname`. Это адрес сгенерированной страницы. По умолчанию Astro генерирует "красивые адреса", то есть вместо того, чтобы создать HTML файл с идентификатором поста, например, он создаёт отдельную папку, в которую кладёт `index.html`. Браузеры воспринимают такой адрес по умолчанию и не добавляют название файла в конце. Такой же адрес и попадает в этот массив.

Уже этой информации хватит, чтобы пробежаться по проекту и получить необходимые пути к файлам для генерации.

```typescript
const rootPath = fileURLToPath(new URL('..', dir));
const imagesPath = path.join(rootPath, "public", "content");
const fontsPath = path.join(rootPath, "public", "fonts");
const contentPath = path.join(rootPath, "src", "data", "content");
```

В этот набор страниц так же попадают страницы, для которых я не хочу генерировать OG изображения: главная, страницы с пагинацией, резюме и пр. Поэтому напишем функцию фильтр, которая отсечёт неподходящие страницы. При желании для них изображения можно будет создать отдельно.

```typescript
 function isInternalPage(url: string): boolean {
    const regex = /\/?(cv|tags|series|\d+)(\/|$)/;
    return regex.test(url);
}
```

Переберём все подходящие страницы и запустим для них генерацию:

```typescript
await Promise.all(
    pages
        .filter(page =>
            page.pathname !== "" &&
            !isInternalPage(page.pathname)
        )
        .map(async (page) => {
            // Локальное изображение использовать не получится :(
            const coverPath = path.join(imagesPath, page.pathname, "cover.png");
            const ogPath = path.join(imagesPath, page.pathname, "og-image.png");
            const pagePath = path.join(contentPath, page.pathname, "index.md");

            const metadata = extractPageMetadata(pagePath);
            await generateOgImage(metadata, { output: ogPath, fonts: fontsPath });
        })
);
```

# Достанем мету из статей

<!--extractPageMetadata-->

Теперь нужно достать метаданные о статье из файла в котором она написана (Markdown). Этот скрипт работает вне контекста Astro (почему в интеграции для Astro не работает контекст Astro для меня осталось загадкой). По сути это значит, что нельзя воспользоваться ни коллекциями контента и их удобными функциями для чтения содержимого статей, ни генерируемыми Typescript-типами. А значит пишем костыли и вручную читаем Markdown-преамбулу.

```typescript
function extractFrontmatterFields(content: string, fields: string[]): FrontmatterResult {
    const { data } = matter(content);

    const result: FrontmatterResult = {};

    for (const field of fields) {
        const value = data[field];
        if (typeof value === 'string' || Array.isArray(value)) {
            result[field] = value;
        }
    }

    return result;
}
```

Так, имея контент файла можно легко получить любое поле из преамбулы использовав `extractFrontmatterFields(content, ["title", "date"])`, на выходе получим объект с полями, которые были выбраны при вызове функции. Да, не типобезопасно, но работаем с тем что есть.

Теперь прочитаем файл статьи с диска и вернём её обработанную преамбулу:

```typescript
export function extractPageMetadata(path: string): PageMetadata {

    const content = fs.readFileSync(path, 'utf-8');
    const fm = extractFrontmatterFields(content, ["title", "date"])
    
    return {
        title: fm["title"] as string,
        date: new Date(fm["date"] as string)
    }
}
```

# Нарисуем картинку

Теперь, собрав все данные, можно приступать к генерации изображения. Подход простой - используем специальную библиотеку, которая принимает JSX-like объект с необходимыми стилями (из порезанного набора CSS) и элементами и выдаёт оптимальный SVG с правильным позиционированием и динамически рассчитанным положением элементов на изображении.

```typescript
export async function generateOgImage(postMetaInfo: PageMetadata, paths: Paths) {

    const jbFontPath = path.join(paths.fonts, "jetbrains-mono.ttf");
    const rubikFontPath = path.join(paths.fonts, "rubik-bold.ttf");

    const jbFont = await readFile(jbFontPath);
    const rubikFont = await readFile(rubikFontPath);

    const svg = await satori({
        // Описание дизайна
    }, {
        width: 1200,
        height: 630,
        fonts: [
            {
                name: "jb-mono",
                data: jbFont,
                weight: 400,
                style: "normal"
            },
            {
                name: "rubik",
                data: rubikFont,
                weight: 700,
                style: "normal"
            }
        ]
    });

     const opts = {
        font: {
            loadSystemFonts: false
        },
    }
    const resvg = new Resvg(svg, opts)
    const pngData = resvg.render()
    const buf = pngData.asPng()

    await writeFile(paths.output, buf);
}
```

С переходом на новую версию сайта я решил рисовать через нейросеть для каждого поста свою обложку, которую показывать в карточке в списке постов. И я изначально хотел использовать эту обложку и для генерации OG-изображений. Оказалось, что сделать это не получится. По крайней мере с библиотекой `satori`, которую я использую для генерации SVG. Она просто не поддерживает большинство способов указания `background-image`.

Не будет работать ни указание абсолютного пути до файла на диске, ни кодирование изображения в base64. Только абсолютный URL где-то в интернете. Что мне не подходит, ведь этот код запускается до публикации версии сайта с новыми обложками в интернете и попытка подставить адрес новой обложки статьи, которая ещё не вышла, приведёт к замене картинки на цветной (если был указан `background-color`) или прозрачный фон.

Поэтому придётся пока отказаться от идеи помещать обложку на фон изображения и остаться со стилем, похожим на тот, что был раньше на Zola:

![](./og-image.png)

Теперь, если запустить production-сборку, в папке готового сайта появятся созданные изображения. Думал я, пока не отправил сайт деплоится на Netlify. Если локально все работает, то там интеграция молча падает с ошибкой и сайт собирается без генерации изображений. Моё предположение заключается в том, что Netlify попросту не даёт доступа к файловой системе из пользовательского кода в процессе сборки.

# Переход на хранение изображений в репозитории

Ладно, значит не хранить картинки в репозитории не получится и придётся создавать их средствами Github Actions, как работала моя утилита на Rust.

Перепишем интеграцию в формат отдельного скрипта:

```typescript
#!/usr/bin/env tsx

import path from "path";
import { generateOgImage } from "@utils/og";
import { extractPageMetadata } from "@utils/pages";
import fs from "fs/promises";

async function main() {
  const [,, contentSlug] = process.argv;

  if (!contentSlug) {
    console.error("❌ Content slug is required as argument.");
    process.exit(1);
  }

  const rootPath = path.resolve(__dirname, "..", "..");
  const imagesPath = path.join(rootPath, "public", "content");
  const fontsPath = path.join(rootPath, "public", "fonts");
  const contentPath = path.join(rootPath, "src", "data", "content");

  const pagePath = path.join(contentPath, contentSlug, "index.md");

  try {
    await fs.access(pagePath);
  } catch {
    console.error(`❌ Content file ${pagePath} not found.`);
    process.exit(1);
  }

  const ogPath = path.join(imagesPath, contentSlug, "og-image.png");
  const metadata = extractPageMetadata(pagePath);

  await generateOgImage(metadata, { output: ogPath, fonts: fontsPath });

  console.log(`✅ OG image generated for ${contentSlug}`);
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
```

Добавим npm-задачу для запуска этого скрипта с помощью `npm run`:

```json
"scripts": {
    "og": "tsx src/scripts/generate-og-images.ts"
}
```

И настроим запуск через Github Actions:

```yaml
name: Generate OG images on PR merge

on:
  pull_request:
    types: [closed]
    branches:
      - 'main'

jobs:
  update-og-images:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Log branch name
        run: |
          echo "Branch name: ${{ github.event.pull_request.head.ref }}"

      - name: Generate OG image for merged content
        run: |
          npm run og "${{ github.event.pull_request.head.ref }}"

      - name: Commit and push new OG images
        run: |
          if [[ -n $(git status --porcelain) ]]; then
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            git add .
            git commit -m "updated og-image for ${{ github.event.pull_request.head.ref }}"
            git push
          else
            echo "No changes to commit"
          fi
```

Теперь, благодаря тому, что ветки с контентом у меня в проекте имеют назание `<тип-контента>/<ид-контента>`, которое совпадает с фактическим расположением контента в проекте при слиянии ветки будет запущен этот скрипт для генерации нужного Open Graph изображения.

В итоге получаем временное вполне работающее решение. Но я всё же хочу довести дизайн OG-изображений до первоначальной идеи с использованием обложек постов.

Поэтому напишу свой генератор изображений (да, снова), но уже не на Rust, а на C# (я .NET-разработчик или насрано?). Но это уже совсем другая история…