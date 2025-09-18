namespace OgImages.Configuration;

public class OgImagesConfiguration
{
    public required Canvas Canvas { get; set; }
    public List<Directory> Directories { get; set; } = [];
    public List<FontConfig> Fonts { get; set; } = [];
    public required IEnumerable<ILayer> Layers { get; set; }

    public required Content Content { get; set; }

    public List<TextLayer> GetTextLayers()
    {
        var list = new List<TextLayer>();

        foreach (var layer in Layers)
        {
            if (layer is TextLayer textLayer)
            {
                list.Add(textLayer);
            }
        }

        return list;
    }

}