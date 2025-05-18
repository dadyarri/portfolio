using System.Text.Json.Serialization;
using SixLabors.Fonts;

namespace OgImages.Configuration;

public class Canvas
{
    public int Width { get; set; }
    public int Height { get; set; }
    public int Padding { get; set; }
    public int MaxWidth { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter<VerticalAlignment>))]
    public VerticalAlignment VerticalAlignment { get; set; }
    public string? Background { get; set; }
}