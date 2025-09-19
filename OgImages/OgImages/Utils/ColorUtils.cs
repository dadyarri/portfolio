using SixLabors.ImageSharp;

namespace OgImages.Utils;

public class ColorUtils
{
    public static Color ParseRgba(string input)
    {
        var parsed = input.Split(',').Select(byte.Parse).ToArray();
        return Color.FromRgba(parsed[0], parsed[1], parsed[2], parsed[3]);
    }
}