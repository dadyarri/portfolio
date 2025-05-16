using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter<LayerType>))]
public enum LayerType
{
    Overlay,
    Text,
    ListOfTexts
}