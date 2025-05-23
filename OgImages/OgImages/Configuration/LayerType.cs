using System.Text.Json.Serialization;

namespace OgImages.Configuration;

[JsonConverter(typeof(JsonStringEnumConverter<LayerType>))]
public enum LayerType
{
    Text,
    ListOfTexts
}