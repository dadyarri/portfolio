---
title: Валидация строго типизированной конфигурации с помощью FluentValidation
urlPath: config-fluent-validation
date: 2023-05-13
summary: Настройка валидации строго типизированной конфигурации с помощью FluentValidation
draft: true
tags:
  - dotnet
  - переводы
---

Это перевод статьи Эндрю Лока, расширяющей предыдущую статью, в которой описывается механизм валидации конфигурации. В этой статье вместо аннотаций будет использоваться очень мощная сторонняя бибиотека FluentValidation.

В предыдущем посте ([оригинал](https://andrewlock.net/adding-validation-to-strongly-typed-configuration-objects-using-flentvalidation/), [перевод](https://dadyarri.ru/posts/typed-config-dotnet/)) я описал как можно использовать атрибуты `DataAnnotation` и новый метод `ValidateOnStart()`, чтобы проверить валидность вашей конфигурации на старте приложения

В этом посте я покажу как сделать то же самое используя популярную библиотеку с открытым исходным кодом FluentValidation. В ней нет ничего встроенного для этого, но нужно будет добавить несколько вспомогательных классов.

Предыдущий пост включает описание строго типизированной конфигурации в целом и все возможные варианты получить ошибку, так что если вы сталкиваетесь с этой темой впервые, предлагаю сначала ознакомиться с предыдущей статьёй. Здесь, перед тем, как перейти к FluentValidation я быстренько повторюсь как валидация IOptions работает с атрибутами `DataAnnotation`.

## Проверка IOptions на старте приложения
В .NET проверка конфигурации появилась ещё в .NET Core 2.2 с методами `Validate<>` и `ValidateDataAnnotations()`, но они вызывались не на старте приложения, а после попытки доступа к объекту конфигурации.

В .NET 6 появился новый метод, `ValidateOnStart()`, который запускает валидацию сразу же после запуска приложения.

Чтобы использовать такую валидацию, нужно сделать четыре вещи:

- Связать объект конфигурации `IOptions<T>` с помощью `services.AddOptions<T>.BindConfiguration()`
- Добавить атрибуты валидации к объекту конфигурации
- Вызвать `ValidateDateAnnotations()` `OptionsBuilder`'а, возвращённого из `AddOptions<T>()`
- Вызвать `ValidateOnStart()` `OptionsBuilder`'а.

В примере ниже, я настроил валидацию конфига для объекта SlackApiSettings:

```csharp
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<SlackApiSettings>()
    .BindConfiguration("SlackApi") // 👈 Связать секцию SlackApi из конфигурации
    .ValidateDataAnnotations() // 👈 Включить валидацию
    .ValidateOnStart(); // 👈 Валидировать на старте приложения

var app = builder.Build();

app.MapGet("/", (IOptions<SlackApiSettings> options) => options.Value);

app.Run();

public class SlackApiSettings
{
    [Required, Url]
    public string WebhookUrl { get; set; }
    [Required]
    public string DisplayName { get; set; }
    public bool ShouldNotify { get; set; }
}
```

Теперь создадим файл конфигурации с ошибкой, например, удалив обязательное значение DisplayName:

```json
{
  "SlackApi": {
    "WebhookUrl": "http://example.com/test/url",
    "DisplayName": null,
    "ShouldNotify": true
  }
}
```

Теперь, если вы запустите приложение, то получите исключение:

```csharp
Unhandled exception. Microsoft.Extensions.Options.OptionsValidationException: 
  DataAnnotation validation failed for 'SlackApiSettings' members: 
    'DisplayName' with the error: 'The DisplayName field is required.'.
   at Microsoft.Extensions.Options.OptionsFactory`1.Create(String name)
   at Microsoft.Extensions.Options.OptionsMonitor`1.<>c__DisplayClass10_0.<Get>b__0()

```

Теперь, если в конфигурации встретится ошибка, вы об этом узнаете сразу на старте приложения, а не в рантайме, когда попытаетесь получить доступ к значениям из конфигурации.

