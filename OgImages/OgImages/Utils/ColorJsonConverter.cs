using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OgImages.Utils;

public class ColorJsonConverter : JsonConverter<Color>
{
    public override Color Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Color value must be a string in 'R,G,B,A' format.");

        var value = reader.GetString();

        if (string.IsNullOrWhiteSpace(value))
            throw new JsonException("Empty color value.");

        var parts = value.Split(',');

        if (parts.Length != 4)
            throw new JsonException("Color value must have exactly 4 components: R,G,B,A.");

        try
        {
            var r = byte.Parse(parts[0]);
            var g = byte.Parse(parts[1]);
            var b = byte.Parse(parts[2]);
            var a = byte.Parse(parts[3]);

            return new Color(new Rgba32(r, g, b, a));
        }
        catch (Exception ex)
        {
            throw new JsonException($"Invalid color components in value: {value}.", ex);
        }
    }

    public override void Write(Utf8JsonWriter writer, Color value, JsonSerializerOptions options)
    {
        var rgba = value.ToPixel<Rgba32>();
        var result = $"{rgba.R},{rgba.G},{rgba.B},{rgba.A}";
        writer.WriteStringValue(result);
    }
}