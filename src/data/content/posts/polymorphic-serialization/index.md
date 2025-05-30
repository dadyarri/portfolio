---
title:  "Полиморфная сериализация в Kotlin и C#"
date:  "2024-03-26"
draft:  false

tags:  ["csharp", "kotlin"]

---

В процессе работы над своим дипломом я столкнулся с интересной задачей: сформировать контент нескольких типов в один JSON-массив. Поскольку бэкенд написан на C#, то и пример будет для него. Например есть контент-ссылка (есть идентификатор и URL), контент-текст (есть идентификатор и содержимое) и контент-файл (есть идентификатор и название). Нужно как-то эти очевидно разные типы данных засунуть в одну кучу, чтобы приложение могло удобно это обрабатывать.
<!--more-->

Первое, что приходит на ум, создать один жирный объект с nullable-полями, в который засовывать разные типы. Навроде такого:

```cs
class ContentItem {
    public Guid Id { get; set; }
    public required string Type { get; set; }
    public string? Link { get; set; }
    public string? Title { get; set; }
    public string? Text { get; set; }
}
```

Что на выходе нам даст примерно это:

```json
{
	"items": [
		{
			"id": "<some-guid>",
			"type": "link",
			"link": "https://example.com",
			"title": null,
			"text": null
		},
		{
			"id": "<some-guid>",
			"type": "text",
			"link": null,
			"title": null,
			"text": "Lorem ipsum dolor sit amet."
		},
		{
			"id": "<some-guid>",
			"type": "file",
			"link": null,
			"title": null,
			"text": "Файл_final(1).docx"
		}
	]
}
```

Даже с маленьким количеством полей выглядит паршиво, не правда ли? А что будет, если необходимые клиенту данные разростутся? Так что этот вариант я не стал даже рассматривать.

# Попытка номер раз

Первой моей идеей было создать интерфейс с общими полями, от которого бы наследовались разные типы контента. Поскольку `List<T>` в C# не поддерживает полиморфизм, пришлось использовать `IEnumerable<T>`. Так получилась такая модель данных:

```cs
interface IContentItem {
    public Guid Id { get; set; }
    public string ContentType { get; set; }
}

class TextContentItem: IContentItem {
    public Guid Id { get; set; }
    public string ContentType => "text";
    public required string Text { get; set; }
}

class LinkContentItem: IContentItem {
    public Guid Id { get; set; }
    public string ContentType => "link";
    public required string Link { get; set; }
}

class FileContentItem: IContentItem {
    public Guid Id { get; set; }
    public string ContentType => "file";
    public required string Title { get; set; }
}

class GetContentResponse {
    public required IEnumerable<IContentItem> Items {get; set;}
}
```

И хотя при создании коллекции из элементов контента проблем с полиморфизмом не было, сериализатор выдавал объекты, приведённые к `IContentItem`:

```json
{
	"items": [
		{
			"id": "<some-guid>",
			"contentType": "link"
		},
		{
			"id": "<some-guid>",
			"contentType": "text"
		},
		{
			"id": "<some-guid>",
			"contentType": "file"
		}
	]
}
```

Такое поведение (естественно) меня не устраивало. В Newtonsoft.Json разрешить полиморфизм при сериализации можно одним параметром. Но я во всём приложении использую `System.Text.Json`, поэтому и говорить буду про него. Здесь такого параметра нет, значит нужно написать свой конвертер для типа `IContentItem`, который поможет правильно сериализовать объект в зависимости от типа контента.

# Попытка номер два

Добавим куда-нибудь в проект кастомный конвертер `ContentConverter`. Он должен реализовать интерфейс `JsonConverter<T>`. В качестве параметра типа укажем интерфейс:

```cs

public class ContentConverter : JsonConverter<IContentItem> {
  public override IContentItem? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
    var jsonDoc = JsonDocument.ParseValue(ref reader);
    var root = jsonDoc.RootElement;

    var type = root.GetProperty("Type").GetString();
    return type switch {
      "text"       => JsonSerializer.Deserialize<TextContentItem>(root.GetRawText(), options),
      "file"       => JsonSerializer.Deserialize<FileContentItem>(root.GetRawText(), options),
      "link"       => JsonSerializer.Deserialize<LinkContentItem>(root.GetRawText(), options),
      "assignment" => JsonSerializer.Deserialize<AssignmentContentItem>(root.GetRawText(), options),
      _            => throw new JsonException($"Unknown type {type}"),
    };
  }

  public override void Write(Utf8JsonWriter writer, IContentItem value, JsonSerializerOptions options) {
    JsonSerializer.Serialize(writer, value, value.GetType(), options);
  }
}

```

По сути тут происходит несложная логика. На вход конвертеру поступает объект, в котором записано JSON-дерево. Оттуда его можно эффективно считать и обработать. Это мы и делаем — достаём из объекта свойство `Type` и на его основе решаем, какой десериализатор использовать.

Останется только подключить этот конвертер, чтобы парсер начал его использовать. Поскольку я использую FastEndpoints, у меня это делается просто:

```cs
app.UseFastEndpoints(c => {
    c.Serializer.Options.Converters.Add(new ContentConverter());
});
```

Теперь метод будет возвращать красивый JSON с объектами разного типа:

```json
{
	"items": [
		{
			"id": "<some-guid>",
			"type": "link",
			"link": "https://example.com"
		},
		{
			"id": "<some-guid>",
			"type": "text",
			"text": "Lorem ipsum dolor sit amet."
		},
		{
			"id": "<some-guid>",
			"type": "file",
			"text": "Файл_final(1).docx"
		}
	]
}
```

# Окей, а как это парсить на клиенте?

Хороший вопрос, и ответ на него несложный. `kotlinx.serialization` умеет в полиморфную сериализацию. Достаточно написать кастомный сериализатор, который подскажет, какие типы в зависимости от чего брать. Для начала добавим классы, которые опишут модели данных, которые приходят из API.

Опишем вот такой базовый тип, от которого будут наследоваться все типы контента:

```kt
@Serializable(ContentSerializer::class)
sealed class BaseContentItem {
    @Serializable(ContentTypeSerializer::class)
    abstract val contentType: ContentType
}
```

И классы, описывающие конкретные типы контента:

```kt
@Serializable
data class TextContentItem(
    @Serializable(UuidSerializer::class) val id: UUID,

    override val contentType: ContentType = ContentType.Text,

    val text: String
) : BaseContentItem()

@Serializable
data class FileContentItem(
    @Serializable(UuidSerializer::class) val id: UUID,

    override val contentType: ContentType = ContentType.File,

    val title: String
) : BaseContentItem()

@Serializable
data class LinkContentItem(
    @Serializable(UuidSerializer::class) val id: UUID,

    override val contentType: ContentType = ContentType.Link,

    val link: String
) : BaseContentItem()

```

Эти типы различаются не только набором полей, но и типом контента. Он описан перечислением:

```kt
@Serializable(ContentTypeSerializer::class)
enum class ContentType(val typeName: String) {
    Text("text"),
    Link("link"),
    File("file"),
    Assignment("assignment")
}
```

Для того, чтобы он корректно парсился из JSON, добавим ему кастомный сериализатор:

```kt
object ContentTypeSerializer : KSerializer<ContentType> {
    override val descriptor = PrimitiveSerialDescriptor("ContentType", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: ContentType) {
        encoder.encodeString(value.typeName)
    }

    override fun deserialize(decoder: Decoder): ContentType {
        val typeName = decoder.decodeString()
        return ContentType.entries.first { it.typeName == typeName }
    }
}
```

Теперь понадобится сериализатор для базового типа контента, который будет понимать, по какому принципу выбирать сериализатор для конкретных типов:

```kt
object ContentSerializer :
    JsonContentPolymorphicSerializer<BaseContentItem>(BaseContentItem::class) {
    override fun selectDeserializer(element: JsonElement): DeserializationStrategy<BaseContentItem> {
        return when (element.jsonObject["contentType"]?.jsonPrimitive?.content) {
            "text" -> TextContentItem.serializer()
            "file" -> FileContentItem.serializer()
            "link" -> LinkContentItem.serializer()
            else -> throw SerializationException("No serializer was found")
        }
    }
}
```

Теперь перед тем, как пытаться привести весь объект контента к базовому типу, сериализатор посмотрит на поле `contentType` и если найдёт там знакомое значение, будет использовать корректный сериализатор.

Добавим вот такой сериализуемый класс, который содержит в себе список базовых элементов контента

```kt
@Serializable
data class ContentSection(
    val items: List<BaseContentItem>
)
```

Отлично, теперь можно работать с запросами как [обычно](/posts/better-ktor-networking):

```kt
suspend fun getContent(id: UUID): Response<ContentSection> {
    val httpClient = HttpClientFactory.httpClient
    val authHeaderValue = authManager.getAuthHeaderValue()
    return httpClient.safeRequest {
        method = HttpMethod.Get
        url("/content/${id}")
        accept(ContentType.Application.Json)
        headers {
            append(HttpHeaders.Authorization, authHeaderValue)
        }
    }
}
```

# Заключение

В этой статье я показал, как можно добавить отправку массивов JSON с объектами разных типов из бэкенда на C#/.NET и парсинг этих данных обратно в объекты в приложении на kotlin.
