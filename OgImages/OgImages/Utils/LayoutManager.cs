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
    private readonly List<Layer> _layers;

    public LayoutManager(List<Layer> layers)
    {
        _layers = layers.Where(e => e.Type == LayerType.Text).ToList();
    }

    public void Render(IImageProcessingContext ctx, OgImagesConfiguration config,
        Dictionary<string, object?> frontmatter)
    {
        var startX = config.Canvas.Padding;

        var totalHeight = 0f;
        List<float> layerHeights = [];

        var fontsManager = new FontManager(config.Fonts);

        foreach (var layer in _layers)
        {
            var font = fontsManager.GetFont(layer.Font!, layer.FontSize);

            var options = new RichTextOptions(font)
            {
                WrappingLength = config.Canvas.MaxWidth,
                WordBreaking = WordBreaking.BreakAll,
                Origin = new PointF(startX, 0)
            };

            var content = FrontmatterFieldRegex().Replace(layer.Content!, match =>
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


        totalHeight += config.Canvas.Padding * (layerHeights.Count - 1);

        var startY = config.Canvas.VerticalAlignment switch
        {
            VerticalAlignment.Top => config.Canvas.Padding,
            VerticalAlignment.Center => (config.Canvas.Height - totalHeight) / 2f,
            VerticalAlignment.Bottom => config.Canvas.Height - totalHeight - config.Canvas.Padding,
            _ => throw new ArgumentOutOfRangeException()
        };

        var currentY = startY;

        for (var i = 0; i < _layers.Count; i++)
        {
            var layer = _layers[i];

            var font = fontsManager.GetFont(layer.Font!, layer.FontSize);

            var options = new RichTextOptions(font)
            {
                WrappingLength = config.Canvas.MaxWidth,
                WordBreaking = WordBreaking.BreakWord,
                Origin = new PointF(startX, currentY)
            };

            var content = FrontmatterFieldRegex().Replace(layer.Content!, match =>
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

            ctx.DrawText(options, content, ColorUtils.ParseRgba(layer.Color!));

            currentY += layerHeights[i] + config.Canvas.Padding;
        }
    }

    [GeneratedRegex("{(.*)}")]
    private static partial Regex FrontmatterFieldRegex();
}