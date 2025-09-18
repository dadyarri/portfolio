using SixLabors.ImageSharp;

namespace OgImages.Configuration;

public class ListOfTextsLayer : ILayer
{
    public LayerType Type => LayerType.ListOfTexts;
    public required string ItemFormat { get; set; }
    public Color Color { get; set; }
    public Color Background { get; set; }
    public required string Font { get; set; }
    public required string Source { get; set; }
    public int FontSize { get; set; }
    public int Padding { get; set; }
    public int Gap { get; set; }
}