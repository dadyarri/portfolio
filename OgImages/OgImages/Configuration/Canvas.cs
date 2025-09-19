using SixLabors.Fonts;
using System.Text.Json.Serialization;

namespace OgImages.Configuration;

public class Canvas
{
    public required int Width { get; set; }
    public required int Height { get; set; }
    public required int Padding { get; set; }
    public required int MaxWidth { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter<VerticalAlignment>))]
    public required VerticalAlignment VerticalAlignment { get; set; }
    public required Backgound Background { get; set; }
}