+++
title = "Связывание конфигурации из JSON с моделью в ASP.NET"
date = "2024-10-26"
draft = true

[extra]
comment = true
+++

Допустим, есть такая секция в `appsettings.json`:

```json
"SomeApp": {
    "Token": "",
    "Secret": ""
}
```
Как её удобнее внедрить в DI, чтобы потом использовать её объект напрямую, без использования IOptions<SomeType>?

Объявим класс для этой конфигурации с авто-свойствами:

```csharp
public class SomeAppConfiguration
{
    public required string Token { get; set; }
    public required string Secret { get; set; }
}
```

Спарсим её, используя стандартные средства чтения конфигурации из `Microsoft.Extensions.Configuration`:

```csharp
builder.Services.Configure<SomeAppConfiguration>(builder.Configuration.GetRequiredSection("SomeApp"));
```

А затем, использовав добавленный в DI этим вызовом `IConfiguration<SomeAppConfiguration>`, добавим ещё и просто `SomeAppConfiguration`:

```csharp
builder.Services.AddSingleton(resolver => resolver.GetRequiredService<IOptions<SomeAppConfiguration>>().Value);
```

Теперь можно, например, используя MinimalAPI получать доступ к конфигурации так:

```csharp
app.MapGet((SomeAppConfiguration config) => {});
```
