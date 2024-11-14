+++
title = "Настраиваемые Open Graph изображения на Rust"
date = "2024-11-30"
draft = false

[taxonomies]
tags = ["Rust", "Блог"]

[extra]
comment = true
toc = true
og_image = "og-image.jpeg"
+++

В предыдущей [статье](/posts/better-ogimages-rust) я описал, как можно быстро генерировать Open Graph изображения. Однако, тот подход был не гибким: дизайн изображений был жёстко закодирован, и любое изменение требовало правки кода и его пересборки. Кроме того, существовала проблема с дозаписью в файл, что негативно влияло на производительность и усложняло поддержку.

В этой статье я объясню, как вынести конфигурацию изображений в отдельный TOML-файл и автоматизировать процесс генерации с помощью Github Actions. Это упростит разработку и поддержку проекта.

<!--more-->

# Использование TOML для конфигурации

Для повышения гибкости в генерации изображений я решил использовать внешний файл конфигурации. Существуют различные форматы, такие как JSON и YAML, но я предпочёл TOML из-за его простоты и удобства в использовании, а также благодаря его широкой популярности в экосистеме Rust. TOML легко читается как человеком, так и машиной, и, в отличие от YAML, минимизирует вероятность ошибок, связанных с различными интерпретациями парсеров.

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

Я также добавил функцию для извлечения вложенных значений из TOML-объекта, что упрощает доступ к данным:

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

Автоматизация процесса генерации изображений помогает упростить рабочий процесс и избежать необходимости локальной генерации. Я настроил Github Actions следующим образом:

1. Когда в новую ветку загружаются изменения, автоматически создаётся pull request (если он ещё не был создан).
2. После этого в этой ветке запускается генератор изображений, и созданные изображения коммитятся в текущую ветку.

Ниже представлен пример конфигурации для Github Actions:

1. Когда загружаются изменения в новую ветку, название которой начинается с `posts/` или `minis/` (в таких ветках я работаю над черновиками), склонируем репозиторий, чтобы иметь возможность дальше работать в нём с правами на запись:  

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

Примеры изображений, созданных с использованием новой конфигурации, показывают, насколько легко теперь изменить дизайн без необходимости пересборки кода. Новый подход значительно упрощает внесение изменений и позволяет быстро адаптировать внешний вид в соответствии с новыми требованиями.

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

Полный исходный код можно посмотреть на [Github](https://github.com/dadyarri/portfolio/tree/main/og-builder) моего сайта, а собранные под Windows и Linux бинарники можно найти [там же](https://github.com/dadyarri/portfolio/tree/main/bin). Текущая версия будет работать с любым проектом на Zola, так как там достаточно строгая структура, которую я реализовал у себя.

В следующей статье я покажу, как интегрировал эту разработку в фреймворк, на котором работает сайт.
