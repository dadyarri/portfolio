+++
title = "Повышение производительности gRPC в .NET"
date = "2024-10-30"
draft = true

[taxonomies]
tags = [".NET"]

[extra]
comment = true
toc = true
+++

# Проблема

В большом приложении используется gRPC для клиент-серверного взаимодействия. С одним сервером одновременно работают два клиента, один отправляет много маленьких запросов и получает в ответ большие ответы, а другой &mdash; по своей инициативе отправляет много больших запросов (счёт идёт на десятки мегабайт)

Это приложение написано на .NET и исторически с момента миграции с .NET Framework и WCF на .NET Core и gRPC использует библиотеку [Grpc.Core](https://www.nuget.org/packages/grpc.core/). Сейчас эта библиотека признана устаревшей, так как под капотом использует неуправляемый код на C и самописную реализацию сетевого взаимодействия, поэтому авторы gRPC [рекомендуют](https://grpc.io/blog/grpc-csharp-future/) переход на современную альтернативу [Grpc.AspNetCore](https://www.nuget.org/packages/grpc.aspnetcore), в которой нет зависимости от C-core реализации и используется управляемый код, а сетевое взаимодействие делегировано на Kestrel, веб-сервер, идущий в комплекте с современными версиями .NET.

Пока приложение работало на старом компоненте gRPC, всё было хорошо &mdash; производительность была на отличном уровне (до 100 мс на отправку больших запросов). С миграцией на новый компонент производительность резко упала (в среднем до **5 секунд (!)** на отправку одного большого запроса)

# Исследование

Для начала убедимся, что проблема действительно в новом компоненте. Я для этого написал простой бенчмарк с использованием [NBomber](https://nbomber.com/), в котором тестировал отправку множества больших запросов (с отправкой на сервер набора случайных байт размером 20 МБ) и маленьких запросов (с получением от сервера целого числа)

Нагрузка, создаваемая бенчмарком: 1800 запросов в течение минуты на каждый метод. Тесты запускались в окружении, на котором работает основное приложение, т. е. .NET 6.

## Тестируемый контракт

```proto
syntax = "proto3";

package example;

service ExampleService {
  // Метод возвращает int
  rpc GetInt (Empty) returns (IntResponse);

  // Метод принимает byte[], ожидаемый объем измеряется десятками мегабайт
  rpc SendLargeData (LargeDataRequest) returns (Empty);
}

// Сообщение для ответа с int
message IntResponse {
  int32 result = 1;
}

// Сообщение для передачи byte[] данных
message LargeDataRequest {
  bytes data = 1;
}

// Пустое сообщение для методов без параметров
message Empty {}
```

## Старый компонент (Grpc.Core)

Старый компонент не требует никакой конфигурации для обеспечения производительности, поэтому оставляем его на стандартных настройках, разве что увеличим максимальный размер получаемого сообщения, чтобы приблизиться к реальным условиям

```cs
var server = new Server(
    new ChannelOption[]
        { new (ChannelOptions.MaxReceiveMessageLength, 110 * 1024 * 1024) })
{
    Services = { ExampleService.BindService(new ExampleServiceImpl(logger)) },
    Ports = { new ServerPort("localhost", Port, ServerCredentials.Insecure) }
};
```

### Отправка больших запросов

scenario: `grpc.core.sendLargeData`

  - ok count: `1800`

  - fail count: `0`

  - all data: `0` MB

  - duration: `00:01:00`

load simulations:

  - `ramping_inject`, rate: `50`, interval: `00:00:01`, during: `00:00:30`

  - `ramping_inject`, rate: `20`, interval: `00:00:01`, during: `00:00:30`

|step|ok stats|
|---|---|
|name|`global information`|
|request count|all = `1800`, ok = `1800`, RPS = `30`|
|latency (ms)|min = `20.1`, mean = `52.47`, max = `236.39`, StdDev = `30.03`|
|latency percentile (ms)|p50 = `44.03`, p75 = `65.09`, p95 = `108.61`, p99 = `160.13`|

Получается, что в среднем отправка 20 МБ на сервер через старый компонент gRPC занимает не более 240 мс, что весьма неплохой результат

### Отправка маленьких запросов

scenario: `grpc.core.getInt`

  - ok count: `1800`

  - fail count: `0`

  - all data: `0` MB

  - duration: `00:01:00`

load simulations:

  - `ramping_inject`, rate: `50`, interval: `00:00:01`, during: `00:00:30`

  - `ramping_inject`, rate: `20`, interval: `00:00:01`, during: `00:00:30`

|step|ok stats|
|---|---|
|name|`global information`|
|request count|all = `1800`, ok = `1800`, RPS = `30`|
|latency (ms)|min = `0.23`, mean = `15.88`, max = `145.04`, StdDev = `22.55`|
|latency percentile (ms)|p50 = `2.82`, p75 = `27.49`, p95 = `61.66`, p99 = `95.36`|

А запрос числа с сервера через старый компонент gRPC занимает не более 150 мс

## Новый компонент (Grpc.AspNetCore, он же grpc-dotnet)

Вот тут и начались проблемы. Дело в том, что приложение весьма сильно нагружается клиентом, который отправляет множество тяжелых запросов, в итоге второй клиент (веб-интерфейс) не отвечал на запросы пользователей минутами.

Запускаем тот же бенчамрк, но на новых клиенте и сервере, аналогично в .NET 6, разве что добавим несколько параметров, [рекомендованных](https://learn.microsoft.com/en-us/aspnet/core/grpc/performance?view=aspnetcore-6.0) Microsoft:

```cs
var channel = GrpcChannel.ForAddress("https://localhost:7166", new GrpcChannelOptions
{
    HttpHandler = new SocketsHttpHandler
    {
        EnableMultipleHttp2Connections = true,
        PooledConnectionLifetime = Timeout.InfiniteTimeSpan,
        KeepAlivePingDelay = TimeSpan.FromSeconds(60),
        KeepAlivePingTimeout = TimeSpan.FromSeconds(30),
    }
});
```

### Отправка больших запросов

scenario: `grpc.net.sendLargeData`

  - ok count: `1800`

  - fail count: `0`

  - all data: `0` MB

  - duration: `00:01:00`

load simulations:

  - `ramping_inject`, rate: `50`, interval: `00:00:01`, during: `00:00:30`

  - `ramping_inject`, rate: `20`, interval: `00:00:01`, during: `00:00:30`

|step|ok stats|
|---|---|
|name|`global information`|
|request count|all = `1800`, ok = `1800`, RPS = `30`|
|latency (ms)|min = `94.09`, mean = `6208.07`, max = `8673.94`, StdDev = `2465.35`|
|latency percentile (ms)|p50 = `7249.92`, p75 = `7954.43`, p95 = `8445.95`, p99 = `8585.22`|

Время задержки большинства запросов (99 перцентиль) выросла в **53 раза (!)**

### Отправка маленьких запросов

scenario: `grpc.net.getInt`

  - ok count: `1800`

  - fail count: `0`

  - all data: `0` MB

  - duration: `00:01:00`

load simulations:

  - `ramping_inject`, rate: `50`, interval: `00:00:01`, during: `00:00:30`

  - `ramping_inject`, rate: `20`, interval: `00:00:01`, during: `00:00:30`

|step|ok stats|
|---|---|
|name|`global information`|
|request count|all = `1800`, ok = `1800`, RPS = `30`|
|latency (ms)|min = `0.31`, mean = `5.95`, max = `213.16`, StdDev = `12.78`|
|latency percentile (ms)|p50 = `4.34`, p75 = `5.61`, p95 = `15.23`, p99 = `56.64`|

Здесь же ситуация даже несколько лучше, время задержки большинства запросов сократилось почти в полтора раза по сравнению со старым компонентом.

# Поиск решения

В процессе я наткнулся на похожий вопрос на [Github](https://github.com/grpc/grpc-dotnet/issues/1353), в котором говорилось о том, что на .NET 5 время ответа одного и того же сервера сильно увеличилось после миграции с Grpc.Core на grpc-dotnet.

Там ответили, что это [известная проблема](https://github.com/grpc/grpc-dotnet/issues/1353#issuecomment-888672767), которая требует низкоуровневых изменений в реализации Kestrel, которые не попадут в .NET 6.

Год спустя исправление этой проблемы [попало](https://github.com/dotnet/aspnetcore/pull/40925) в .NET 7.

Значит, потенциально миграция на .NET 8 исправит эту проблему, проверим это:

# Повторное тестирование на .NET 8

Запустим тот же бенчмарк на .NET 8 и новом компоненте grpc-dotnet, больше ничего не меняя:

## Отправка больших запросов

scenario: `grpc.net.sendLargeData`

  - ok count: `1800`

  - fail count: `0`

  - all data: `0` MB

  - duration: `00:01:00`

load simulations:

  - `ramping_inject`, rate: `50`, interval: `00:00:01`, during: `00:00:30`

  - `ramping_inject`, rate: `20`, interval: `00:00:01`, during: `00:00:30`

|step|ok stats|
|---|---|
|name|`global information`|
|request count|all = `1800`, ok = `1800`, RPS = `30`|
|latency (ms)|min = `42.18`, mean = `2079.63`, max = `4494.73`, StdDev = `1577.43`|
|latency percentile (ms)|p50 = `1840.13`, p75 = `3608.58`, p95 = `4341.76`, p99 = `4386.81`|

На отправке больших запросов видим улучшение ситуации в два раза, что уже хорошо, но есть куда работать, 4 секунды против 160 мс на 1 запрос это всё ещё плохой результат.

## Отправка маленьких запросов

scenario: `grpc.net.getInt`

  - ok count: `1800`

  - fail count: `0`

  - all data: `0` MB

  - duration: `00:01:00`

load simulations:

  - `ramping_inject`, rate: `50`, interval: `00:00:01`, during: `00:00:30`

  - `ramping_inject`, rate: `20`, interval: `00:00:01`, during: `00:00:30`

|step|ok stats|
|---|---|
|name|`global information`|
|request count|all = `1800`, ok = `1800`, RPS = `30`|
|latency (ms)|min = `0.23`, mean = `3.96`, max = `44.21`, StdDev = `3.32`|
|latency percentile (ms)|p50 = `3.87`, p75 = `5.13`, p95 = `8.95`, p99 = `18.82`|

Задержка обработки большинства запросов сократилась в 3 раза, что даже лучше, чем на старом компоненте **в 5 раз (!)**

# Промежуточные выводы

Значит, в целом направление работы правильное, остаётся как-то настраивать Kestrel и gRPC, чтобы приблизить производительность к уровню старого компонента
