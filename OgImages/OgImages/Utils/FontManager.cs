using OgImages.Configuration;
using SixLabors.Fonts;

namespace OgImages.Utils;

public class FontManager
{
    private readonly Dictionary<string, FontFamily> _fonts = new();
    private readonly FontCollection _collection = new();

    public FontManager(IEnumerable<FontConfig> fontConfigs)
    {
        foreach (var config in fontConfigs)
        {
            var family = _collection.Add(config.Path);
            _fonts[config.Name] = family;
        }
    }

    public Font GetFont(string name, float size)
    {
        if (!_fonts.TryGetValue(name, out var family))
        {
            throw new InvalidOperationException($"Font '{name}' not found in collection.");
        }

        return family.CreateFont(size, name.EndsWith("bold") ? FontStyle.Bold : FontStyle.Regular);
    }
}