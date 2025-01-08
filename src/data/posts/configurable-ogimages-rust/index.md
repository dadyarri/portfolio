---
title: "Настраиваемые Open Graph изображения на Rust"
date: "2024-11-30"
draft: false

tags: ["rust", "blog"]
cycle: "ogimages"
---

В предыдущей [статье](/posts/better-ogimages-rust) я описал, как можно быстро генерировать Open Graph изображения. Однако, тот подход был не гибким: дизайн изображений был зафиксирован в коде, и любое изменение требовало его правки и пересборки приложения. Кроме того, существовала проблема с дозаписью в файл: добавление каждого тега в SVG-файл открывала файл на диске, записывал туда новое содержимое и закрывал файл.

В этой статье я расскажу, как вынес конфигурацию изображений в отдельный TOML-файл и автоматизировал процесс генерации с помощью Github Actions.

<!--more-->

# Использование TOML для конфигурации

Для повышения гибкости в генерации изображений я решил использовать внешний файл конфигурации. Существуют различные форматы, (например JSON и YAML), но я предпочёл TOML из-за его простоты и удобства в использовании, а также благодаря его широкой популярности в экосистеме Rust. TOML легко читается как человеком, так и машиной, и, в отличие от YAML, минимизирует вероятность ошибок, связанных с различными реализациями парсеров.

# Структура конфигурационного файла

Конфигурационный файл состоит из следующих блоков:

- **`[image]`**: общие параметры изображения, такие как размер холста и отступы.
- **`[[fonts]]`**: используемые шрифты, включая название и путь к файлу. Можно указать несколько блоков.
- **`[background]`**: параметры фона изображения, такие как цвет или стиль границы.
- **`[[sections]]`**: содержимое изображения, включая текстовые блоки и их стили.

Эти блоки позволяют гибко управлять дизайном изображения без необходимости изменения исходного кода.

Я также добавил валидацию конфигурации, чтобы предотвратить ошибки на этапе настройки. Пример кода для проверки конфигурации:

```rust
impl SectionConfig {
    // Проверка, что либо `preamble_key`, либо `format` указаны, но не оба.
    pub fn validate(&self) -> Result<(), String> {
        match (&self.preamble_key, &self.format) {
            (None, None) => Err("Необходимо указать либо `preamble_key`, либо `format`.".to_string()),
            (Some(_), Some(_)) => Err("Следует указать только один из параметров: `preamble_key` или `format`.".to_string()),
            _ => Ok(()),
        }
    }

    pub fn is_simple(&self) -> Result<bool, String> {
        match (&self.preamble_key, &self.format) {
            (None, Some(_)) => Ok(false),
            (Some(_), None) => Ok(true),
            _ => Err("Некорректная секция".to_string()),
        }
    }
}
```

Я также добавил функцию для извлечения вложенных значений из TOML-объекта, что упрощает доступ к информации в преамбуле:

```rust
pub fn get_nested_value<'a>(preamble: &'a Value, keys: &str) -> Option<&'a Value> {
    let mut current_value = preamble;
    let split: Vec<&str> = keys.split('.').collect();

    for key in split {
        current_value = match current_value.get(key) {
            Some(value) => value,
            None => {
                return None;
            }
        };
    }
    Some(current_value)
}
```

# Автоматизация генерации изображений с помощью Github Actions

Автоматизация процесса генерации изображений поможет упростить рабочий процесс и избежать ручного запуска генератора. Я настроил Github Actions следующим образом:

1. Когда загружаются изменения в новую ветку, название которой начинается с `posts/` или `minis/` (в таких ветках я работаю над черновиками), склонируем репозиторий, чтобы иметь возможность дальше работать в нём и дадим права на запись в репозиторий и в пул реквесты:

```yaml
name: Create Pull Request on new post

on:
  push:
    branches:
      - 'posts/*'
      - 'minis/*'

jobs:
  create-pull-request:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
```

2. Проверим, нужно ли создать новый pull-request (необходимо, чтобы не получать ошибки сценария, когда изменения загружаются повторно в уже существовавшую ветку):

```yaml

      - name: Check if new pull request is needed to create
        id: get_pr
        run: |
          EXISTED_PULLS_FOR_THE_BRANCH=$(gh pr list -B main -H ${{ github.ref_name }} --json id)
          echo "existed_pulls=$EXISTED_PULLS_FOR_THE_BRANCH" >> $GITHUB_OUTPUT

```

3. Создадим черновой pull-request, подставив всю информацию и назначив меня ответственным:

```yaml

      - name: Create Pull Request
        id: create_pr
        if: steps.get_pr.outputs.existed_pulls == '[]'
        run: |
          pr_url=$(gh pr create -B main -H "${{ github.ref_name }}" -t "Draft of ${{ github.ref_name }}" -b "This pull request contains the draft for the new post." -a dadyarri -d)
          echo "pr_url=$pr_url" >> $GITHUB_OUTPUT

```

4. Запустим генератор. Он создаст недостающее изображение и положит его рядом с новой статьёй:

```yaml

      - name: Generate OG images
        if: steps.get_pr.outputs.existed_pulls == '[]'
        run: |
          cd bin
          chmod +x og-builder
          ./og-builder --sections 'posts,minis'
        env:
          RUST_LOG: info

```

5. Обновим репозиторий, добавив в открытый pull-request коммит с новым изображением:

```yaml
      - name: Push new OG images to the repo
        if: steps.get_pr.outputs.existed_pulls == '[]'
        run: |
          git add .
          git commit -m "updated og-images"
          git push
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

# Примеры и результаты

Примеры изображений, созданных с использованием новой конфигурации, показывают, насколько легко теперь изменить дизайн без необходимости пересборки приложения. Новый подход значительно упрощает внесение изменений и позволяет быстро адаптировать вид изображений в соответствии с новыми требованиями.

Например мои изображения создаются из конфигурации, которую я привёл ранее:

{{ resize_image(path="posts/configurable-ogimages-rust/og-image.png", width=1200, height=630, op="scale") }}

Для демонстрации изменений возьмём, например, светлую тему моего же сайта и изменив всего пару параметров запустим генератор снова:

```toml
[background]
fill = "#F2F8F8"

[[background.borders]]
stroke = "#31445E"

[[sections]]
fill = "#101E1E"
background = { fill = "#121212", padding = 10 }
```

{{ resize_image(path="posts/configurable-ogimages-rust/1.png", width=1200, height=630, op="scale") }}

Так можно изменить любой параметр и он тут же повлияет на результат.

# Заключение

Использование TOML и Github Actions позволило значительно улучшить гибкость и автоматизацию генерации Open Graph изображений. Эти изменения упрощают настройку дизайна изображений и устраняют необходимость пересборки кода.

Полный исходный код можно посмотреть на [Github](https://github.com/dadyarri/portfolio/tree/main/og-builder) моего сайта, а собранные под Windows и Linux бинарники можно найти [там же](https://github.com/dadyarri/portfolio/tree/main/bin). Текущая версия будет работать с любым проектом на Zola, так как там достаточно строгая структура, которой придерживается генератор.

# ЗЫ

Честно говоря, я устал от Rust. Он медленно компилируется, на винде создаёт огромное множество проблем (а в силу разных причин я не могу перебраться на Linux, хотя иногда очень хочется).

Изначально, у меня была идея продолжить развитие этого проекта, встроив его в Zola. Но я подумал и решил, что нервные клетки мне дороже и в следующем цикле статей про разработку я займусь написанием своего генератора статических сайтов с блекджеком и ~~шл~~ плагинами, но на каком-нибудь другом языке.
