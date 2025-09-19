using OgImages.Configuration;
using SixLabors.Fonts;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Processing;
using Spectre.Console;
using System.Text.Json;
using System.Text.RegularExpressions;
using VerticalAlignment = SixLabors.Fonts.VerticalAlignment;

namespace OgImages.Utils;

public partial class LayoutManager
{
    private readonly IEnumerable<ILayer> _layers;

    public LayoutManager(IEnumerable<ILayer> layers)
    {
        _layers = layers;
    }

    public void Render(IImageProcessingContext ctx, OgImagesConfiguration config,
        Dictionary<string, object?> frontmatter, Dictionary<string, ValueTuple<FontFamily, FontStyle>> fonts,
        Dictionary<string, string> directories)
    {
        var startX = config.Canvas.Padding;

        var layerHeights = CalculateLayerHeights(config, frontmatter, fonts, startX).ToList();
        var totalHeight = layerHeights.Sum() + config.Canvas.Padding * (layerHeights.Count - 1);

        var startY = config.Canvas.VerticalAlignment switch
        {
            VerticalAlignment.Top => config.Canvas.Padding,
            VerticalAlignment.Center => (config.Canvas.Height - totalHeight) / 2f,
            VerticalAlignment.Bottom => config.Canvas.Height - totalHeight - config.Canvas.Padding,
            _ => throw new ArgumentOutOfRangeException()
        };

        var currentY = startY;

        foreach (var (layer, index) in _layers.Select((layer, index) => (layer, index)))
        {
            switch (layer)
            {
                case TextLayer textLayer:
                    DrawTextLayer(ctx, config, frontmatter, fonts, startX, currentY, textLayer);
                    break;
                case ListOfTextsLayer listOfTextsLayer:
                    DrawListOfTextsLayer(ctx, listOfTextsLayer, frontmatter, fonts, directories, startX, currentY);
                    break;
            }

            currentY += layerHeights[index] + config.Canvas.Padding;
        }
    }

    private IEnumerable<float> CalculateLayerHeights(OgImagesConfiguration config,
        Dictionary<string, object?> frontmatter, Dictionary<string, ValueTuple<FontFamily, FontStyle>> fonts,
        float startX)
    {
        foreach (var layer in _layers)
        {
            switch (layer)
            {
                case TextLayer textLayer:
                    yield return MeasureTextLayer(textLayer, config, frontmatter, fonts, startX);
                    break;
                case ListOfTextsLayer listOfTextsLayer:
                    yield return MeasureListOfTextsLayer(listOfTextsLayer, config, frontmatter, fonts,
                        startX);
                    break;
            }
        }
    }

    private float MeasureTextLayer(TextLayer textLayer, OgImagesConfiguration config,
        Dictionary<string, object?> frontmatter, Dictionary<string, ValueTuple<FontFamily, FontStyle>> fonts,
        float startX)
    {
        var font = GetFont(textLayer.Font, fonts, textLayer.FontSize);
        var options = CreateTextOptions(font, config.Canvas.MaxWidth, startX, 0);
        var content = ProcessFrontmatterFields(textLayer.Format, frontmatter);
        return TextMeasurer.MeasureSize(content, options).Height;
    }

    private float MeasureListOfTextsLayer(ListOfTextsLayer listOfTextsLayer, OgImagesConfiguration config,
        Dictionary<string, object?> frontmatter, Dictionary<string, ValueTuple<FontFamily, FontStyle>> fonts,
        float startX)
    {
        var font = GetFont(listOfTextsLayer.Font, fonts, listOfTextsLayer.FontSize);
        var options = CreateTextOptions(font, config.Canvas.MaxWidth, startX, 0);

        // The height of a list of texts layer is calculated based on the individual items
        // and their spacing, but for initial height calculation, we can just measure the format string.
        // The actual drawing will handle the item layout.
        var content = ProcessFrontmatterFields(listOfTextsLayer.ItemFormat, frontmatter);
        return TextMeasurer.MeasureSize(content, options).Height + listOfTextsLayer.Padding;
    }

    private void DrawTextLayer(IImageProcessingContext ctx, OgImagesConfiguration config,
        Dictionary<string, object?> frontmatter, Dictionary<string, ValueTuple<FontFamily, FontStyle>> fonts,
        float startX, float currentY, TextLayer textLayer)
    {
        var font = GetFont(textLayer.Font, fonts, textLayer.FontSize);
        var options = CreateTextOptions(font, config.Canvas.MaxWidth, startX, currentY);
        var content = ProcessFrontmatterFields(textLayer.Format, frontmatter);
        ctx.DrawText(options, content, textLayer.Color);
    }

    private void DrawListOfTextsLayer(IImageProcessingContext ctx, ListOfTextsLayer listOfTextsLayer,
        Dictionary<string, object?> frontmatter, Dictionary<string, ValueTuple<FontFamily, FontStyle>> fonts,
        Dictionary<string, string> directories, float startX, float currentY)
    {
        var font = GetFont(listOfTextsLayer.Font, fonts, listOfTextsLayer.FontSize);
        var options = CreateTextOptions(font, 0, 0, 0); // Wrapping handled per item if needed

        ProcessFrontmatterFields(listOfTextsLayer.ItemFormat, frontmatter,
            (fieldName, value) =>
            {
                if (value is List<object> list)
                {
                    var currentX = startX;
                    var match = FrontmatterFieldRegex().Match(listOfTextsLayer.ItemFormat);

                    if (!match.Success)
                    {
                        AnsiConsole.MarkupLineInterpolated(
                            $"[red]Invalid format for list item: {listOfTextsLayer.ItemFormat}[/]");
                        return string.Empty;
                    }

                    var extracted = match.Groups[1].Value;
                    var parts = extracted.Split('|');
                    var extractedField = parts.Length > 1 ? parts[1] : string.Empty;

                    foreach (string item in list)
                    {
                        var path = FileUtils.GetFullPath(
                            Path.Join(listOfTextsLayer.Source, fieldName, $"{item}.json"),
                            directories);
                        var serialized =
                            JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(path));

                        if (serialized is null || !serialized.TryGetValue(extractedField, out var text))
                        {
                            AnsiConsole.MarkupLineInterpolated($"[red]Field {extractedField} not found in {path}[/]");
                            continue;
                        }

                        var textSize = TextMeasurer.MeasureSize(text, options);
                        var rect = new RectangleF(currentX, currentY, textSize.Width + listOfTextsLayer.Padding * 2,
                            textSize.Height + listOfTextsLayer.Padding * 2);

                        var itemOptions = CreateTextOptions(font, 0, // Wrapping handled per item if needed
                            currentX + listOfTextsLayer.Padding / 2f, currentY + listOfTextsLayer.Padding / 2f);

                        ctx.Fill(listOfTextsLayer.Background, rect);
                        ctx.DrawText(itemOptions, text, listOfTextsLayer.Color);

                        currentX += textSize.Width + listOfTextsLayer.Gap;
                    }
                }

                return string.Empty;
            });
    }

    private Font GetFont(string fontName, Dictionary<string, ValueTuple<FontFamily, FontStyle>> fonts, float fontSize)
    {
        if (!fonts.TryGetValue(fontName, out var fontOptions))
        {
            AnsiConsole.MarkupLineInterpolated($"[orange]Font {fontName} not found[/]");
            return SystemFonts.CreateFont("arial", fontSize);
        }

        return fontOptions.Item1.CreateFont(fontSize, fontOptions.Item2);
    }

    private RichTextOptions CreateTextOptions(Font font, float wrappingLength, float originX, float originY)
    {
        return new RichTextOptions(font)
        {
            WrappingLength = wrappingLength,
            WordBreaking = WordBreaking.BreakWord,
            Origin = new PointF(originX, originY)
        };
    }

    private string ProcessFrontmatterFields(string format, Dictionary<string, object?> frontmatter,
        Func<string, object?, string>? listProcessor = null)
    {
        return FrontmatterFieldRegex().Replace(format, match =>
        {
            var extracted = match.Groups[1].Value;
            var parts = extracted.Split('|');
            var fieldName = parts[0];
            var formatSpecifier = parts.Length > 1 ? parts[1] : string.Empty;

            if (!frontmatter.TryGetValue(fieldName, out var value))
            {
                AnsiConsole.MarkupLineInterpolated($"[red]Field {fieldName} not found[/]");
                return string.Empty;
            }

            if (value is DateTime dateTime)
            {
                return dateTime.ToString(formatSpecifier);
            }

            if (value is List<object> && listProcessor != null)
            {
                return listProcessor(fieldName, value);
            }

            return value?.ToString() ?? string.Empty;
        });
    }

    [GeneratedRegex("{(.*)}")]
    private static partial Regex FrontmatterFieldRegex();
}