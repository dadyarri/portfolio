---
title: Валидация конфигурации с помощью FluentValidation
slug: config-fluent-validation
publishedAt: 2023-05-13
description: Настройка валидации строго типизированной конфигурации с помощью FluentValidation
isPublish: true
tags:
  - dotnet
  - переводы
---

Это перевод [статьи](https://andrewlock.net/adding-validation-to-strongly-typed-configuration-objects-using-flentvalidation/) Эндрю Лока, расширяющей предыдущую статью, в которой описывается механизм валидации конфигурации. В этой статье вместо аннотаций будет использоваться очень мощная сторонняя бибиотека [FluentValidation](https://docs.fluentvalidation.net/en/latest/).

В предыдущем посте ([оригинал](https://andrewlock.net/adding-validation-to-strongly-typed-configuration-objects-using-flentvalidation/), [перевод](https://dadyarri.ru/posts/typed-config-dotnet/)) я описал как можно использовать атрибуты `DataAnnotation` и новый метод `ValidateOnStart()`, чтобы проверить валидность вашей конфигурации на старте приложения

В этом посте я покажу как сделать то же самое используя популярную библиотеку с открытым исходным кодом [FluentValidation](https://docs.fluentvalidation.net/en/latest/). Для этого понадобится добавить несколько вспомогательных классов.

Предыдущий пост включает описание строго типизированной конфигурации в целом и все возможные варианты получить ошибку, так что если вы сталкиваетесь с этой темой впервые, предлагаю сначала ознакомиться с предыдущей статьёй. Здесь, перед тем, как перейти к FluentValidation я быстренько повторюсь как валидация IOptions работает с атрибутами `DataAnnotation`.

## Проверка IOptions на старте приложения
В .NET проверка конфигурации появилась ещё в .NET Core 2.2 с методами `Validate<>` и `ValidateDataAnnotations()`, но они вызывались не на старте приложения, а после попытки доступа к объекту конфигурации.

В .NET 6 появился новый метод, `ValidateOnStart()`, который запускает валидацию сразу же после запуска приложения.

Чтобы использовать такую валидацию, нужно сделать четыре вещи:

- Связать объект конфигурации из файла с `IOptions<T>`
- Добавить атрибуты валидации к объекту конфигурации
- Вызвать `ValidateDateAnnotations()` `OptionsBuilder`'а, возвращённого из `AddOptions<T>()`
- Вызвать `ValidateOnStart()` `OptionsBuilder`'а.

В примере ниже, я настроил валидацию конфига для объекта `SlackApiSettings`:

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

Теперь, если вы запустите приложение, то получите исключение сразу, а не в момент обращения к конфигурации:

```csharp
Unhandled exception. Microsoft.Extensions.Options.OptionsValidationException: 
  DataAnnotation validation failed for 'SlackApiSettings' members: 
    'DisplayName' with the error: 'The DisplayName field is required.'.
   at Microsoft.Extensions.Options.OptionsFactory`1.Create(String name)
   at Microsoft.Extensions.Options.OptionsMonitor`1.<>c__DisplayClass10_0.<Get>b__0()

```

## Валидация `IOptions` с использованием FluentValidation

Атрибуты `DataAnnotation` это довольно простой способ проверки данных, который перестаёт работать в более сложных случаях. Поэтому заменим его на популярную альтернативу FluentValidation

Эта статья не учебник по FluentValidation, а лишь простой пример минимально необходимой настройки для валидации на старте

### 1. Создание проекта

Создадим минимальное API для тестирования и добавим зависимость FluentValidation:

```sh
dotnet new web
dotnet add package FluentValidation
```

Затем заменим содержимое `Program.cs` простым API, которое использует строго типизированный объект конфигурации (`SlackApiSettings`) и выводит его значение при запросе:

```csharp

using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<SlackApiSettings>()
    .BindConfiguration("SlackApi") // Связывание с секцией SlackApi в конфиге

var app = builder.Build();

app.MapGet("/", (IOptions<SlackApiSettings> options) => options.Value); // Вывод объекта SlackApiSettings

app.Run();

public class SlackApiSettings
{
    public string? WebhookUrl { get; set; }
    public string? DisplayName { get; set; }
    public bool ShouldNotify { get; set; }
}

```

В этом простом приложении мы связываем объект `SlackApiSettings` с секцией `SlackApi` в конфигурации. Простое API возвращает содержимое конфига в формате JSON:

```json
{
  "webhookUrl": null,
  "displayName": null,
  "shouldNotify": false
}

```

### 2. Добавление валидатора FluentValidator

В [документации](https://docs.fluentvalidation.net/en/latest/start.html) можно подробнее прочитать про то, как создавать валидаторы и правила. Ниже приведён пример того, как можно переписать валидацию на `DataAnnotations` из начала статьи с помощью `AbstractValidator<T>`

```csharp
public class SlackApiSettingsValidator : AbstractValidator<SlackApiSettings>
{
    public SlackApiSettingsValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotEmpty(); // не пустой
        RuleFor(x => x.WebhookUrl)
            .NotEmpty()
            // .MustAsync((_, _) => Task.FromResult(true)) 👈 нельзя использовать асинхронные валидаторы
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.WebhookUrl));
    }
}
```

> Важный момент: Хотя это (скорее всего) не станет проблемой, но стоит держать в голове, что здесь нельзя использовать асинхронные правила, так как интерфейс [`IValidateOptions<T>`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.options.ivalidateoptions-1?view=dotnet-plat-ext-7.0), который мы будем использовать дальше только синхронный.

### 3. Создание метода расширения `ValidateFluentValidation`

Следующий этап самый важный. Нужно добавить альтернативу метода `ValidateDataAnnotations` для FluentValidation, который я назвал `ValidateFluentValidation`. Это расширение довольно простое и похоже на версию для DataAnnotation:

```csharp
public static class OptionsBuilderFluentValidationExtensions
{
    public static OptionsBuilder<TOptions> ValidateFluentValidation<TOptions>(
      this OptionsBuilder<TOptions> optionsBuilder) where TOptions : class
    {
        optionsBuilder.Services.AddSingleton<IValidateOptions<TOptions>>(
            provider => new FluentValidationOptions<TOptions>(
              optionsBuilder.Name, provider));
        return optionsBuilder;
    }
}
```
Этот метод расширения `OptionsBuilder<T>` добавляет новый сервис `FluentValidationOptions<T>` в DI-контейнер и регистрирует его как `IValidateOptions<T>`. В `FluentValidationOptions<T>` и происходит вся магия. Здесь кода сильно больше, поэтому всё прокомментировано:

```csharp
public class FluentValidationOptions<TOptions> 
    : IValidateOptions<TOptions> where TOptions : class
{
    private readonly IServiceProvider _serviceProvider;
    private readonly string? _name;
    public FluentValidationOptions(string? name, IServiceProvider serviceProvider)
    {
        // service provider понадобится ниже, чтобы создать scope
        _serviceProvider = serviceProvider; 
        _name = name; // Обработка именованных параметров
    }

    public ValidateOptionsResult Validate(string? name, TOptions options)
    {
        // Null в имени используется для настройки всех именованных параметров
        if (_name != null && _name != name)
        {
            // Игнорируется, если этот экземпляр не валидируется
            return ValidateOptionsResult.Skip;
        }

        // Убедиться, что опции были переданы
        ArgumentNullException.ThrowIfNull(options);
        
        // Валидаторы обычно регистрируются как scoped
        // так что нужно создать scope, чтобы быть уверенными, так как этот метод
        // будет вызываться из главного scope
        using IServiceScope scope = _serviceProvider.CreateScope();

        // получаем объект валидатора
        var validator = scope.ServiceProvider.GetRequiredService<IValidator<TOptions>>();

        // Запускаем валидацию
        ValidationResult results = validator.Validate(options);
        if (results.IsValid)
        {
            // Всё успешно
            return ValidateOptionsResult.Success;
        }

        // Валидация провалилась, собираем сообщение об ошибке
        string typeName = options.GetType().Name;
        var errors = new List<string>();
        foreach (var result in results.Errors)
        {
            errors.Add($"Fluent validation failed for '{typeName}.{result.PropertyName}' with the error: '{result.ErrorMessage}'.");
        }

        return ValidateOptionsResult.Fail(errors);
    }
}
```

Код выше немного сложнее оригинального `IValidateOptions`, так как добавляет две особенности:

- `IOptions<T>` поддерживает *именованные параметры*. Они используются редко; чаще всего в аутентификации, например. Больше о них можно прочитать в [статье](https://andrewlock.net/configuring-named-options-using-iconfigurenamedoptions-and-configureall/) автора.
- `IValidateOptions` вызывается из `IOptionsMonitor`, который регистрируется как *синглтон*. Поэтому наш объект `FluentValidationOptions` тоже должен регистрироваться как синглтон. Однако обычно валидаторы FluentValidation регистрируются как scoped. Из-за этого несоответствия мы не можем внедрить `IValidator<T>` в конструктор `FluentValidationOptions` и должны сначала создать `IServiceScope`

За исключением предыдущих двух пунктов, код довольно простой. Он запускает `validator.Validate()` и возвращает соответствующий результат.

> NB: Этот класс требует того, чтобы `IValidator<T>` был зарегистрирован для конкретного типа в DI

Теперь мы готовы собрать все кусочки пазла воедино, чтобы валидировать конфигурацию на старте приложения.

## Собираем всё вместе

Если мы соединим весь код из предыдущих шагов, зарегистрируем валидатор, полное приложение будет выглядеть как-то так:

```csharp
using FluentValidation;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// 👇 Регистрируем валидатор
builder.Services.AddScoped<IValidator<SlackApiSettings>, SlackApiSettingsValidator>();

builder.Services.AddOptions<SlackApiSettings>()
    .BindConfiguration("SlackApi") // 👈 Связываем объект SlackApi из конфигурации с SlackApiSettings
    .ValidateFluentValidation() // 👈 Включаем валидацию
    .ValidateOnStart(); // 👈 Валидируем на старте приложения

var app = builder.Build();

app.MapGet("/", (IOptions<SlackApiSettings> options) => options.Value);

app.Run();

public class SlackApiSettings
{
    public string? WebhookUrl { get; set; }
    public string? DisplayName { get; set; }
    public bool ShouldNotify { get; set; }
}

public class SlackApiSettingsValidator : AbstractValidator<SlackApiSettings>
{
    public SlackApiSettingsValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty();
        RuleFor(x => x.WebhookUrl)
            .NotEmpty()
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.WebhookUrl));
    }
}

public static class OptionsBuilderFluentValidationExtensions
{
    public static OptionsBuilder<TOptions> ValidateFluentValidation<TOptions>(this OptionsBuilder<TOptions> optionsBuilder) where TOptions : class
    {
        optionsBuilder.Services.AddSingleton<IValidateOptions<TOptions>>(
            provider => new FluentValidationOptions<TOptions>(optionsBuilder.Name, provider));
        return optionsBuilder;
    }
}

public class FluentValidationOptions<TOptions> : IValidateOptions<TOptions> where TOptions : class
{
    private readonly IServiceProvider _serviceProvider;
    private readonly string? _name;

    public FluentValidationOptions(string? name, IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _name = name;
    }

    public ValidateOptionsResult Validate(string? name, TOptions options)
    {
        if (_name != null && _name != name)
        {
            return ValidateOptionsResult.Skip;
        }

        ArgumentNullException.ThrowIfNull(options);
        
        using var scope = _serviceProvider.CreateScope();
        var validator = scope.ServiceProvider.GetRequiredService<IValidator<TOptions>>();
        var results = validator.Validate(options);
        if (results.IsValid)
        {
            return ValidateOptionsResult.Success;
        }

        string typeName = options.GetType().Name;
        var errors = new List<string>();
        foreach (var result in results.Errors)
        {
            errors.Add($"Fluent validation failed for '{typeName}.{result.PropertyName}' with the error: '{result.ErrorMessage}'.");
        }

        return ValidateOptionsResult.Fail(errors);
    }
}
```
Теперь, если мы запустим приложение с ошибочной конфигурацией, получим исключение на старте приложения, как мы и хотели:

```csharp
Unhandled exception. Microsoft.Extensions.Options.OptionsValidationException: Fluent validation failed for 'SlackApiSettings.DisplayName' with the error: ''Display Name' must not be empty.'.
   at Microsoft.Extensions.Options.OptionsFactory`1.Create(String name)
```
## Пишем метод расширения

Сейчас нужно помнить добавлять валидатор для настроек, включать валидацию для объекта конфига и включать валидацию на старте. Если вы хотите, вместо этого можно написать метод расширения, который будет делать это за вас:

```csharp
public static class FluentValidationOptionsExtensions
{
    public static OptionsBuilder<TOptions> AddWithValidation<TOptions, TValidator>(
        this IServiceCollection services,
        string configurationSection)
    where TOptions : class
    where TValidator : class, IValidator<TOptions>
    {
        // Добавляем валидатор
        services.AddScoped<IValidator<TOptions>, TValidator>();

        return services.AddOptions<TOptions>()
            .BindConfiguration(configurationSection)
            .ValidateFluentValidation()
            .ValidateOnStart();
    }
}
```

Тогда ваше приложение станет настолько простым:

```csharp
using FluentValidation;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// 👇 Регистрируем валидатор и параметры
builder.Services.AddWithValidation<SlackApiSettings, SlackApiSettingsValidator>("SlackApi")

var app = builder.Build();

app.MapGet("/", (IOptions<SlackApiSettings> options) => options.Value);

app.Run();
And that's it, I hope you find this useful if you're using FluentValidation with ASP.NET Core!
```

## Вывод

В этом посте я показал вам, как можно использовать FluentValidation для ваших строго типизированных объектов конфигурации `IOptions<>` в ASP.NET Core. Я создал версию `ValidateDataAnnotations()` как метод расширения `ValidateFluentValidation()`. В сочетании с `ValidateOnStart()` (и зарегистрированным `IValidator<T>`), получаем валидацию конфигов на старте приложения. Это позволяет быть уверенным в том, что ошибки конфигурации всплывут как можно раньше, вместо появления ошибок в рантайме.
