using System.Text.Json;
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
        Dictionary<string, object?> frontmatter, Dictionary<string, Tuple<FontFamily, FontStyle>> fonts,
        Dictionary<string, string> directories)
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

            if (layer is ListOfTextsLayer listOfTextsLayer)
            {
                fonts.TryGetValue(listOfTextsLayer.Font, out var fontOptions);
                ArgumentNullException.ThrowIfNull(fontOptions);

                var font = fontOptions.Item1.CreateFont(listOfTextsLayer.FontSize, fontOptions.Item2);

                var options = new RichTextOptions(font)
                {
                    WrappingLength = config.Canvas.MaxWidth,
                    WordBreaking = WordBreaking.BreakWord,
                    Origin = new PointF(startX, 0)
                };

                var content = FrontmatterFieldRegex().Replace(listOfTextsLayer.ItemFormat, match =>
                {
                    var extracted = match.Groups[1].Value;
                    var fieldName = extracted.Split('|')[0];

                    if (!frontmatter.TryGetValue(fieldName, out var value))
                    {
                        AnsiConsole.MarkupLineInterpolated($"[red]Field {fieldName} not found[/]");
                        return string.Empty;
                    }

                    if (value is List<object> list)
                    {
                        List<string> data = [];
                        foreach (string item in list)
                        {
                            var path = FileUtils.GetFullPath(
                                Path.Join(listOfTextsLayer.Source, fieldName, $"{item}.json"),
                                directories);
                            var serialized =
                                JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(path));
                            data.Add(serialized![extracted.Split('|')[1]]);
                        }

                        return string.Join(string.Empty, data);
                    }

                    return value?.ToString() ?? string.Empty;
                });

                var textSize = TextMeasurer.MeasureSize(content, options);
                totalHeight += textSize.Height + listOfTextsLayer.Padding;
                layerHeights.Add(textSize.Height + listOfTextsLayer.Padding);
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

        foreach (var (layer, ind) in _layers.Select((x, i) => (x, i)))
        {
            switch (layer)
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
                    break;
                }

                case ListOfTextsLayer listOfTextsLayer:
                {
                    fonts.TryGetValue(listOfTextsLayer.Font, out var fontOptions);
                    ArgumentNullException.ThrowIfNull(fontOptions);

                    var font = fontOptions.Item1.CreateFont(listOfTextsLayer.FontSize, fontOptions.Item2);

                    var options = new RichTextOptions(font)
                    {
                        WrappingLength = config.Canvas.MaxWidth,
                        WordBreaking = WordBreaking.BreakWord,
                        Origin = new PointF(startX, 0),
                    };

                    var content = FrontmatterFieldRegex().Replace(listOfTextsLayer.ItemFormat, match =>
                    {
                        var extracted = match.Groups[1].Value;
                        var fieldName = extracted.Split('|')[0];

                        if (!frontmatter.TryGetValue(fieldName, out var value))
                        {
                            AnsiConsole.MarkupLineInterpolated($"[red]Field {fieldName} not found[/]");
                            return string.Empty;
                        }

                        if (value is List<object> list)
                        {
                            var currentX = startX;

                            foreach (string item in list)
                            {
                                var path = FileUtils.GetFullPath(
                                    Path.Join(listOfTextsLayer.Source, fieldName, $"{item}.json"),
                                    directories);
                                var serialized =
                                    JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(path));

                                var text = serialized![extracted.Split('|')[1]];
                                var textSize = TextMeasurer.MeasureSize(text, options);
                                var rect = new RectangleF(currentX, currentY, textSize.Width + listOfTextsLayer.Padding * 2, textSize.Height + listOfTextsLayer.Padding * 2);

                                options.Origin = new PointF(currentX + listOfTextsLayer.Padding / 2, currentY);
                                
                                ctx.Fill(listOfTextsLayer.Background, rect);
                                ctx.DrawText(options, text, listOfTextsLayer.Color);
                                
                                currentX += (int)textSize.Width + listOfTextsLayer.Gap * 2;
                            }
                        }

                        return value?.ToString() ?? string.Empty;
                    });

                    var textSize = TextMeasurer.MeasureSize(content, options);
                    totalHeight += textSize.Height + listOfTextsLayer.Padding;
                    layerHeights.Add(textSize.Height + listOfTextsLayer.Padding);
                    break;
                }
            }

            currentY += layerHeights[ind] + config.Canvas.Padding;
        }
    }

    [GeneratedRegex("{(.*)}")]
    private static partial Regex FrontmatterFieldRegex();
}