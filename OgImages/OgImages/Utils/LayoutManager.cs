using System.Text.RegularExpressions;
using OgImages.Configuration;
using SixLabors.Fonts;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Processing;
using Spectre.Console;
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
        Dictionary<string, object?> frontmatter, Dictionary<string, Tuple<FontFamily, FontStyle>> fonts)
    {
        var startX = config.Canvas.Padding;

        var totalHeight = 0f;
        List<float> layerHeights = [];

        foreach (var layer in _layers)
        {
            if (layer is TextLayer textLayer)
            {
                fonts.TryGetValue(textLayer.Font, out var fontOptions);
                ArgumentNullException.ThrowIfNull(fontOptions);

                var font = fontOptions.Item1.CreateFont(textLayer.FontSize, fontOptions.Item2);

                var options = new RichTextOptions(font)
                {
                    WrappingLength = config.Canvas.MaxWidth,
                    WordBreaking = WordBreaking.BreakWord,
                    Origin = new PointF(startX, 0)
                };

                var content = FrontmatterFieldRegex().Replace(textLayer.Format, match =>
                {
                    var extracted = match.Groups[1].Value;
                    var fieldName = extracted.Split('|')[0];

                    if (!frontmatter.TryGetValue(fieldName, out var value))
                    {
                        AnsiConsole.MarkupLineInterpolated($"[red]Field {fieldName} not found[/]");
                        return string.Empty;
                    }

                    if (value is DateTime dateTime)
                    {
                        return dateTime.ToString(extracted.Split('|')[1]);
                    }

                    return value?.ToString() ?? string.Empty;
                });

                var textSize = TextMeasurer.MeasureSize(content, options);

                totalHeight += textSize.Height;
                layerHeights.Add(textSize.Height);
            }
        }


        totalHeight += config.Canvas.Padding * (layerHeights.Count - 1);

        var startY = config.Canvas.VerticalAlignment switch
        {
            VerticalAlignment.Top => config.Canvas.Padding,
            VerticalAlignment.Center => (config.Canvas.Height - totalHeight) / 2f,
            VerticalAlignment.Bottom => config.Canvas.Height - totalHeight - config.Canvas.Padding,
            _ => throw new ArgumentOutOfRangeException()
        };

        var currentY = startY;

        foreach (var (item, ind) in _layers.Select((x, i) => (x, i)))
        {
            switch (item)
            {
                case TextLayer textLayer:
                {
                    fonts.TryGetValue(textLayer.Font, out var fontOptions);

                    ArgumentNullException.ThrowIfNull(fontOptions);
                    var font = fontOptions.Item1.CreateFont(textLayer.FontSize, fontOptions.Item2);

                    var options = new RichTextOptions(font)
                    {
                        WrappingLength = config.Canvas.MaxWidth,
                        WordBreaking = WordBreaking.BreakWord,
                        Origin = new PointF(startX, currentY)
                    };

                    var content = FrontmatterFieldRegex().Replace(textLayer.Format, match =>
                    {
                        var extracted = match.Groups[1].Value;
                        var fieldName = extracted.Split('|')[0];

                        if (!frontmatter.TryGetValue(fieldName, out var value))
                        {
                            AnsiConsole.MarkupLineInterpolated($"[red]Field {fieldName} not found[/]");
                            return string.Empty;
                        }

                        if (value is DateTime dateTime)
                        {
                            return dateTime.ToString(extracted.Split('|')[1]);
                        }

                        return value?.ToString() ?? string.Empty;
                    });

                    ctx.DrawText(options, content, textLayer.Color);

                    currentY += layerHeights[ind] + config.Canvas.Padding;
                    break;
                }

                case ListOfTextsLayer listOfTextsLayer:
                {
                    break;
                }
            }
        }
    }

    [GeneratedRegex("{(.*)}")]
    private static partial Regex FrontmatterFieldRegex();
}