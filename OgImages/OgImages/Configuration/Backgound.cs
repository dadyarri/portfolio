using SixLabors.ImageSharp;

namespace OgImages.Configuration;

public class Backgound
{
    public string Image { get; set; } = string.Empty;
    public Color FallbackColor { get; set; } = Color.White;
    public Color OverlayColor { get; set; } = Color.Transparent;
}