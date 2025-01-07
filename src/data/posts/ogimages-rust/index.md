---
title: "Генерация Open Graph изображений на Rust"
date: "2024-10-17"
draft: false

tags: ["Rust", "Блог"]
cycle: ["ogimages"]

---

Иногда случается так, что меня резко переклинивает и я начинаю заниматься тем, чего вообще не делал или к чему давно не прикасался.

Например, я давно ничего не писал сюда (да и в маленький [блог](https://t.me/yadevblog) тоже). В какой-то момент я решил (снова) переписать сайт с нуля на новом фреймворке, на этот раз поставив себе задачу избежать использования Javascript-экосистемы всеми силами.

<!--more-->

Почему? Потому что я при ведении блога хочу максиимально избежать когнитивной нагрузки и заниматься ведением блога, а не попытками понять, почему где-то что-то сломалось.

Некоторое время назад я занимался реактом, вроде даже пытался на нём блог писать (или на каком-то фреймворке, который его использовал, не суть), с меня хватило, спасибо.

{{ resize_image(path="posts/ogimages-rust/1.jpg", width=583, height=503, op="scale") }}

Поэтому я ограничил круг поиска статическими генераторами (SSG) и спустя несколько итераций пришёл к [Zola](https://getzola.org). Мне сразу понравилась его концепция "one binary to rule them all", так сказать, то есть никаких зависимостей настраивать не нужно, всё необходимое работает из коробки и управляется одним бинарником.

И этот бинарник работает чертовски быстро

{{ resize_image(path="posts/ogimages-rust/2.png", width=640, height=116, op="scale") }}

Нашёл тему мне по вкусу, перенёс старые статьи и за вечер сайт готов. Ну не прекрасно ли? А дальше вопрос бесконечной полировки, которой я уже довольно долго занимаюсь: всё время нахожу в теме какие-то мелочёвки, которые мне хочется исправить.

А вот чего в Zola нет, так это генерации превьюшек для соцсетей. Автор сам это не добавляет, а красоты хочется, поэтому мне пришлось воротить своё решение.

# Open Graph

Прокотол, который был придуман для управления тем, как ссылки отображаются на разных сайтах. Работает он довольно просто, через HTML-метатеги:

```html
<meta property="og:title" content="Личный блог dadyarri" />
<meta property="og:description" content="Мыслепомойка об IT и всяком вокруг" />
<meta name="description" content="Мыслепомойка об IT и всяком вокруг" />
<meta property="og:image" content=https://dadyarri.ru/posts/ogimages-rust/og-image.png />
```

Разумеется, я мог бы сам рисовать такие изображения где-нибудь в Photoshop, например, но зачем, если это можно автоматизировать? 

Например вот так выглядит превьюшка для этой статьи, которую я создал с помощью штуковины, о которой сейчас расскажу:

{{ resize_image(path="posts/ogimages-rust/og-image.png", width=1200, height=630, op="scale") }}

# Почему Rust?

Да, я в основном программирую на C#/.NET, но вот эту мелочь для своего блога решил написать на совершенно незнакомом для себя языке. Почему? Всё просто:

- Zola написан на Rust, если получится удачное решение, есть шанс его встроить в фреймворк
- Хотелось изучить что-то новое
- Не хотелось использовать JavaScript, пусть на нём и существует проверенный инструмент от [Vercel](https://vercel.com/docs/functions/og-image-generation)

# Как оно работает?

Zola основан на шаблонизаторе Tera от того же автора, который сильно похож на Jinja2. Он используется, чтобы подставить данные в HTML-шаблон, размеченный специальным синтаксисом.

Я для себя определил, как примерно должна выглядеть превьюшка и что содержать: заголовок, дату публикации, мой ник и список тегов статьи.

Примерно так выглядит базовая структура проекта на Zola:

```
.
└─── content
     ├─── _index.md
     └─── posts
          ├─── _index.md
          └─── better-ogimages-rust
               └─── index.md
```

В корне лежит конфиг, который управляет настройками сайта, папка `contents` &mdash; это стартовая директория для содержимого сайта. `posts` &mdash; это коллекция с постами, таких может быть несколько. Генерировать изображения я хочу для всех постов во всех коллекциях, значит, нужно предусмотреть способ передавать снаружи список коллекций для генерации. Причём это параметр опциональный, со значением по умолчанию `posts`

Собрав список публикаций, достанем из них преамбулу (TOML-часть в начале каждой статьи), распарсим её в структуру (об этом было [в предыдущей статье](/posts/ogimages-rust/#kod)).


Самый простой способ, который мне пришёл в голову: пройтись по статьям, заполнить шаблон и создать изображения из готовых HTML-страниц. Так я и сделал:

# Создание шаблона

Вот так выглядит шаблон превьюшки, который я выбрал для своего сайта. Ничего сложного, просто подстановка данных, пришедших снаружи в шаблон. Остальное &mdash; магия CSS.

```html
<body>
    <div class="card">
        <h1>{{ title | safe }}</h1>
        <p><time>{{ date | date(format="%d.%m.%Y") }}</time> :: dadyarri</p>

        <div class="tags">
            {% for tag in tags %}
            <span class="tag">{{ tag | safe }}</span>
            {% endfor %}
        </div>
    </div>
</body>
```

# Код

В каждом файле статьи есть набор метаданных, который используется для рендера самой статьи:

```toml
title = "Генерация Open Graph изображений на Rust"
date = "2024-11-10"
draft = true

[taxonomies]
tags = ["Rust", "Блог"]

[extra]
comment = true
toc = true
og_image = true
```
Используем его и для заполнения шаблона OG Image. В шаблоне используются не все поля из этих метаданных, поэтому парсеру не обязательно знать обо всём:

```rust
#[derive(Deserialize, Debug)]
pub struct Preamble {
    pub(crate) title: String,
    pub(crate) date: String,
    pub(crate) taxonomies: PreambleTaxonomies,
}

#[derive(Deserialize, Debug)]
pub struct PreambleTaxonomies {
    pub(crate) tags: Vec<String>,
}
```
Получим список папок для статей в которых нужно создать превьюшки и ещё несколько параметров:

```rust
#[derive(Parser)]
#[command(version, about, long_about = None)]
pub struct Cli {
    #[arg(short, long)]
    pub(crate) theme: String, // Название темы, откуда берём стили и шаблон для генерации
    #[arg(short, long, default_value_t = 600)]
    pub(crate) wait_for_browser_in_msec: u64, // Браузеру нужно время, чтобы загрузиться и отрендерить созданную страницу
    #[arg(short, long, value_delimiter = ',', default_value = "posts")]
    pub(crate) sections: Vec<String>, // Список секций с публикациями
}
```

Теперь можно пробежаться по всем публикациям:


```rust
let args = Cli::parse();

for section in args.sections.iter() {
    let path = Path::new("..").join("content").join(section);
    process_content(&path, &args, &mut browser).await?;
}
```

Далее достанем из статей метаданные, используя для этого парсер TOML:

```rust
pub(crate) fn parse_preamble(file_path: &str) -> anyhow::Result<structs::Preamble> {
    let content = fs::read_to_string(file_path)?;
    let re = Regex::new(r"^\+{3}([\s\S]+?)\+{3}")?;

    if let Some(captures) = re.captures(&content) { // Если в регулярку попало какое-то содержимое, заключённое между тремя знаками `+`
        let toml_str = captures.get(1).map_or_else(
            || Err(anyhow!("Failed to extract preamble")),
            |m| Ok(m.as_str()),
        )?;

        let preamble: structs::Preamble = toml::from_str(toml_str)?; // Пытаемся распарсить эту преамбулу в структуру
        Ok(preamble)
    } else {
        Err(anyhow!("Preamble not found"))
    }
}
```

Имея метаданные можно их подставить в шаблон:

```rust
let tera = Tera::new(templates_glob_str)?;
let mut context = tera::Context::new();

context.insert("title", preamble.title.as_str());
context.insert("date", preamble.date.as_str());
context.insert("tags", &preamble.taxonomies.tags);

let rendered_html = tera.render("og_image.html", &context)?;
Ok(rendered_html)
```

`@vercel/og` работает по довольно любопытной схеме:

Он не хранит изображения на диске, а генерирует их на лету по запросу пользователя, при этом преобразовывая JSX-код в SVG. Звучит довольно замороченно, хотя работает и правда весьма быстро.

К сожалению, готовых инструментов, которые способны такое делать в Rust-мире нет (да и сервера, который в реальном времени обрабатывал бы запросы пользователей тоже), поэтому пойдём другим путём: предварительная генерация изображений с помощью браузера, запущенного в headless режиме (то есть без интерфейса). Да, это не такое красивое решение, но за неимением лучшего, используем его.

Не знаю, может меня осенит и я сделаю что-то получше. Но пока так.

```rust
let page = browser
    .new_page("data:text/html,".to_owned() + &urlencoding::encode(&html))
    .await?;

page.wait_for_navigation_response().await?;
time::sleep(Duration::from_millis(wait_for_browser_in_msecs)).await;

let image = page
    .screenshot(
        ScreenshotParams::builder()
            .full_page(true)
            .format(CaptureScreenshotFormat::Jpeg)
            .quality(100)
            .build(),
    )
    .await?;

let og_image_path = absolute_path.parent().unwrap().join("og-image.jpeg");

fs::write(og_image_path, image)?;
```

Достаточно простое решение, работает с приемлемой скоростью, но очень прямолинейное: получить срендеренный HTML, открыть его в браузере, сделать скриншот. Всё.

# Добавим всё в шаблон

Достаточно куда-нибудь в `<head>` добавить тег, описывающий, откуда брать картинку. Я их храню рядом с самими статьями:

```html
{% if page.extra.og_image%}
    <meta
        property="og:image"
        content={{ get_url(path=[current_path, page.extra.og_image] | join(sep=''))}}
    />
{% endif %}
```

# Итоги

На выходе получаем экзешник, который сам создаёт все картинки и сохраняет их в нужном месте. Как вам такое решение? Может есть идеи, что можно улучшить?