using System.Text.Json;
using System.Text.Json.Serialization;
using OgImages.Configuration;

namespace OgImages.Utils;

public class LayerConverter : JsonConverter<ILayer>
{
    public override ILayer? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var jsonDocument = JsonDocument.ParseValue(ref reader);
        var root = jsonDocument.RootElement;

        var typeString = root.GetProperty("Type").GetString();
        var type = Enum.Parse<LayerType>(typeString!);
        return type switch
        {
            LayerType.Text => JsonSerializer.Deserialize<TextLayer>(root.GetRawText(), options),
            LayerType.ListOfTexts => JsonSerializer.Deserialize<ListOfTextsLayer>(root.GetRawText(), options),
            _ => throw new JsonException($"Unknown layer type {typeString}")
        };
    }

    public override void Write(Utf8JsonWriter writer, ILayer value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
    }
}