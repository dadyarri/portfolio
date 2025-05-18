using SixLabors.ImageSharp;

namespace OgImages.Configuration;

public class ListOfTextsLayer: ILayer
{
    public LayerType Type => LayerType.ListOfTexts;
    public required string Content { get; set; }
    public Color Color { get; set; }
    public Color Background { get; set; }
    public required string Font { get; set; }
}