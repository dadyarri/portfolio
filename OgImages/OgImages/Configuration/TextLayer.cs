using SixLabors.ImageSharp;

namespace OgImages.Configuration;

public class TextLayer : ILayer
{
    public LayerType Type => LayerType.Text;
    public Color Color { get; set; }
    public required string Format { get; set; }
    public required string Font { get; set; }
    public int FontSize { get; set; }
}