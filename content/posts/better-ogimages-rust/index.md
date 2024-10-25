+++
title = "Ускоряем генерацию Open Graph изображений на Rust"
date = "2024-10-25"
draft = true

[taxonomies]
tags = ["Rust", "Блог"]

[extra]
comment = true
toc = true
og_image = "og-image.jpeg"
+++

Я уже говорил, что решение по генерации изображений для соцсетей из прошлой [статьи](/posts/ogimages-rust) неидеально &mdash; оно требует установленного Google Chrome, запускает его, ждёт пока страница загрузится и потом делает скриншот.

Во второй части этого цикла статей я покажу, как у меня получилось улучшить производительность и удобство своего приложения для генерации OG Image, а ещё добавить автоматическую генерацию этих изображений при публикации нового черновика.

<!--more-->

# Зачем я отказался от браузера и шаблонов?

Сам по себе шаблонизатор неплох, он работает быстро и отлично решает свою задачу, но вот превратить созданный им HTML в изображение без браузера никак. А вот с ним уже есть проблемы:

1. Для работы необходим установленный Google Chrome, который есть не всегда, или установить его нет возможности (например, на CI-серверах);
2. Отсюда невозможность автоматизации запуска (например при публикации нового черновика);
3. Хотя браузер запускается в headless режиме, почему-то при использовании `chromiumoxide` всё равно появляется белое окно, которое ничего не отображает, но всё равно висит всё время генерации;
4. Для того, чтобы загрузились все необходимые ресурсы и страница полностью срендерилась, нужно некоторое время, которое зависит от производительности компьютера. Так в моих условиях это примерно 600 миллисекунд на изображение. Да, это не очень много, но всё равно мешает.

Поэтому неплохо бы найти другое, более удачное решение

# Как работает SVG?

В прошлой статье я упоминал, что кроме браузера можно генерировать SVG, как делает, например `@vercel/og`. SVG &mdash; это растровый формат изображений, который оперирует примитивами, например полигонами и определяет их положение в сетке координат. Но что более важно, так это то, что SVG &mdash; текстовый формат, основанный на XML, а значит, его можно легко создавать программно.

# Как должно работать всё приложение?

Поскольку это не новое приложение, а переписывание старого, я опишу только то, что изменилось:

Получив все необходимые данные из постов, вместо заполнения шаблонов, можно приступать к генерации SVG. Нам нужен довольно небольшой функционал &mdash; вставка текста, прямоугольника, группы и CSS-стилей. Добавим немного математики, чтобы правильно спозиционировать элементы на холсте.

Соберём SVG-файл, подхватив из темы правильную таблицу стилей и добавив необходимые примитивы.

Собрав такой SVG-файл мы его распарсим и отрендерим в PNG, положим рядом с MD-файлом статьи и удалим сохранённый ранее SVG.

Готово. Полученный файл можно добавить в meta тег.

# Разберём код

## Генерация SVG

Для генерации SVG на текущем этапе я решил не слишком заморачиваться и написал несколько функций, которые открывают файл на дозапись, делают своё дело и закрывают файл. Решение определённо неоптимальное и в следующей статье будет заменено на что-то более приличное.

Приведу некоторые функции, которые занимаются дозаписью в SVG. Так, эта создаёт новый файл по пути (если он уже существует &mdash; перезаписывает), добавляет в него заголовок и записывает размер холста:

```rust
pub fn create_svg(path: &PathBuf, width: usize, height: usize) {
    let mut file = File::create(path).expect("can't create svg file");
    let svg_header = format!("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}\" height=\"{}\" style=\"background-color: #121212; color: #f2f8f8;\">", width, height);

    file.write_all(svg_header.as_bytes()).expect("can't write to file");
}

```

Следующая функция читает файл CSS по пути и вставляет его содержимое в SVG файл:


```rust

pub fn write_css(svg_path: &PathBuf, css_path: &PathBuf) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(svg_path)
        .unwrap();

    let css_content = read_to_string(css_path).unwrap_or(String::new());
    let style_tag = format!("\n<style>\n{}\n</style>\n", css_content);

    file.write_all(style_tag.as_bytes()).expect("can't write to file");
}

```

А эта &mdash; рисует прямоугольник по координатам:

```rust

pub fn write_rect(svg_path: &PathBuf, x: i32, y: i32, w: i32, h: i32, class: &String) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(svg_path)
        .unwrap();

    let rect_tag = format!("\n<rect class=\"{}\" x=\"{}\" y=\"{}\" width=\"{}\" height=\"{}\"></rect>", class, x, y, w, h);

    file.write_all(rect_tag.as_bytes()).expect("can't write to file");
}
```

## Измерение размеров текста

Следующий этап &mdash; рассчитать размеры текста, чтобы правильно расставить текст на холсте. Нам понадобится разбить текст на несколько строк, чтобы длинный текст не вылезал за границы холста. Для этого побуквенно разберём каждое слово и, используя шрифт, которым рисуется текст на изображении, посчитаем ширину слова. Если на каком-то слове длина строки превысит ширину холста, то перенесём это слово на новую строку (шириной я называю длину в пикселях):

```rust
pub fn wrap_text(text: &str, font: &Font, font_size: i32, canvas_width: f32) -> Result<Vec<String>> {
    let scale = Scale::uniform(font_size as f32);
    let mut lines: Vec<String> = Vec::new();
    let mut current_line = String::new(); // Текущая строка
    let mut current_line_width = 0.0; // Ширина текущей строки

    let space_width = measure_text_dimensions(" ", font, scale)?; // Измерим ширину пробела для последующего использования

    for word in text.split_whitespace() { // Для каждого слова
        let word_width = measure_text_dimensions(word, font, scale)?; // Найдём его ширину

        if current_line_width + word_width > canvas_width { // Если ширина строки вместе с новым словом больше ширины холста
            lines.push(current_line.trim().to_string()); // Перенесём текущее слово на новую строку
            current_line = String::new();
            current_line_width = 0.0;
        }

        current_line.push_str(word); // Добавим слово к текущей строке
        current_line.push(' ');
        current_line_width += word_width + space_width;
    }

    if !current_line.is_empty() {
        lines.push(current_line.trim().to_string());
    }


    Ok(lines)
}
```

А эта функция посимвольно измеряет ширину текста и просто взята из примеров библиотеки `rusttype`.


```rust
fn measure_text_dimensions(text: &str, font: &Font, scale: Scale) -> Result<f32> {
    let width = font
        .layout(text, scale, point(40.0, 40.0))
        .map(|g| g.position().x + g.unpositioned().h_metrics().advance_width)
        .last()
        .unwrap_or(0.0);

    Ok(width)
}
```

## Сохранение изображения

Получив готовый SVG, нужно превратить его в растровое изображение. Используем для этого `resvg`:

```rust
pub fn save_png(svg_path: &Path, png_path: &Path) {
    let tree = {
        let mut opt = usvg::Options::default();

        opt.resources_dir = std::fs::canonicalize(&svg_path)
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()));

        opt.fontdb_mut().load_system_fonts(); // Загрузим шрифты, установленные в системе

        let svg_data = std::fs::read(&svg_path).unwrap(); // Прочитаем SVG-файл
        usvg::Tree::from_data(&svg_data, &opt).unwrap()
    };

    let pixmap_size = tree.size().to_int_size();
    let mut pixmap = tiny_skia::Pixmap::new(pixmap_size.width(), pixmap_size.height()).unwrap();
    resvg::render(&tree, tiny_skia::Transform::default(), &mut pixmap.as_mut());
    pixmap.save_png(&png_path).unwrap(); // Сохраним PNG-файл
}
```
## Соберём всё вместе

На текущем этапе положение элементов на холсте фиксировано: я прямо в коде определил, где и какие элементы Open Graph изображения должны находиться. Поэтому сбор изображения в одно сводится просто к последовательному вызову нескольких функций.

После получения преамбулы из статьи нужно добыть файл шрифта, собрать нужные пути, разбить заголовок по строкам, написать SVG-файл, и преобразовать его в PNG.

```rust
let font_path = Path::new(&root)
    .join("fonts")
    .join("jetbrains-mono.ttf");
let font_data = fs::read(&font_path)?;
let font = Font::try_from_bytes(&*font_data).expect("Error constructing Font"); // Загрузка шрифта
let wrapped_lines = text::wrap_text(&preamble.title, &font, 60, 1100f32)?; // Разбиение заголовка по строкам (с небольшим запасом по ширине холста)

let svg_path = absolute_path.parent().unwrap().join("og-image.svg"); // Построение путей
let png_path = absolute_path.parent().unwrap().join("og-image.png");
let css_path = Path::new(&root)
    .join("themes")
    .join(&args.theme)
    .join("css")
    .join("og-image.css");

svg::create_svg(&svg_path, 1200, 630); // Создание холста
svg::write_css(&svg_path, &css_path); // Запись CSS
svg::write_rect(&svg_path, 0, 0, 1200, 630, &"background".to_string()); // Рисование шрифта
svg::write_rect(&svg_path, 0, 610, 1200, 20, &"border".to_string()); // Рисование нижней границы

let mut current_x = 20; // Начинаем рисовать с небольшим отступом по горизонтали
let mut current_y = ((610 - ((wrapped_lines.len()) * 70)) / 2) as i32; // Вычислим необходимую координату, чтобы расположить содержимое посередине

for line in wrapped_lines { // Построчно нарисуем заголовок
    svg::write_text(&svg_path, &line, current_x, current_y, &"h1".to_string());
    current_y += 70;
}


svg::write_text( // Впишем дату и мой ник
    &svg_path,
    &format!("{} :: dadyarri", NaiveDate::parse_from_str(&*preamble.date, "%Y-%m-%d")?.format("%d.%m.%Y")),
    current_x,
    current_y,
    &"p".to_string()
);

current_y += 40; // Опустимся ниже

for tag in preamble.taxonomies.tags {  // Нарисуем теги постов
    let tag_width = text::measure_text_dimensions_pub(&tag, &font, 25)? as i32;
    svg::write_rect(&svg_path, current_x, current_y, tag_width, 40, &"tag".to_string());
    svg::write_text(&svg_path, &tag, current_x + 10, current_y + 30, &"tag-label".to_string());

    current_x += tag_width + 20;
}

svg::close_svg(&svg_path); // Закроем SVG-файл

image::save_png(&svg_path, &png_path); // Сохраним PNG
fs::remove_file(&svg_path)?; // Удалим SVG
```

# Запуск

Запустим полученное приложение. С его помощью 6 изображений в среднем генерируются за ~300 миллисекунд:

{{ resize_image(path="posts/better-ogimages-rust/1.png", width=936, height=398, op="scale") }}

# Дальнейшие планы

Планирую написать ещё как минимум одну статью в этом цикле, в которой сделаю получение положения элементов из внешней конфигурации, перепишу механизм создания SVG, чтоюы избежать многократной дозаписи в файл.
