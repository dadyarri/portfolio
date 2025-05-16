namespace OgImages.Configuration;

public class OgImagesConfiguration
{
    public required Canvas Canvas { get; set; }
    public List<Directory> Directories { get; set; } = [];
    public List<FontConfig> Fonts { get; set; } = [];
    public List<Layer> Layers { get; set; }
}