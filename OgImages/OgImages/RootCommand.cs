using System.Text.Json;
using System.Text.RegularExpressions;
using OgImages.Configuration;
using OgImages.Utils;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using Spectre.Console;
using Spectre.Console.Cli;
using YamlDotNet.Serialization;
using Color = SixLabors.ImageSharp.Color;
using Directory = System.IO.Directory;
using Size = SixLabors.ImageSharp.Size;

namespace OgImages;

internal sealed partial class RootCommand : AsyncCommand<RootCommandSettings>
{
    public override async Task<int> ExecuteAsync(CommandContext context, RootCommandSettings settings)
    {
        if (settings.Content is null)
        {
            AnsiConsole.MarkupLine("[red]Please select content item[/]");
            return 1;
        }

        var configurationPath = FileUtils.FindFileUpwards("og-images.json");

        if (configurationPath is null)
        {
            AnsiConsole.MarkupLine("[red]Config file named og-images.json not found[/]");
            return 1;
        }

        var configurationDirectory = Path.GetDirectoryName(configurationPath)!;

        AnsiConsole.MarkupLineInterpolated($"[green]Using config file from '{configurationPath}'[/]");

        await using var fs = File.OpenRead(configurationPath);
        var configuration = await JsonSerializer.DeserializeAsync<OgImagesConfiguration>(fs);

        if (configuration is null)
        {
            AnsiConsole.MarkupLine("[red]Error reading configuration file[/]");
            return 1;
        }

        foreach (var directory in configuration.Directories)
        {
            directory.Path = Path.GetFullPath(Path.Join(configurationDirectory, directory.Path));

            if (!Directory.Exists(directory.Path))
            {
                AnsiConsole.MarkupLine("[red]Directory doesn't exist[/]");
                return 1;
            }
        }

        foreach (var fontConfig in configuration.Fonts)
        {
            fontConfig.Path = Path.GetFullPath(DirectoryRegex().Replace(fontConfig.Path, match =>
            {
                var dirName = match.Groups[1].Value;
                var dirPath = configuration.Directories
                    .Where(d => d.Name == dirName)
                    .Select(d => d.Path)
                    .FirstOrDefault();

                if (dirPath is null)
                {
                    AnsiConsole.MarkupLine("[red]Directory doesn't exist[/]");
                    return string.Empty;
                }

                return dirPath;
            }));

            if (!File.Exists(fontConfig.Path))
            {
                AnsiConsole.MarkupLineInterpolated($"[red]Font file {fontConfig.Name} not found[/]");
                return 1;
            }
        }

        var contentPath = configuration.Directories.FirstOrDefault(e => e.Name == "content");

        if (contentPath is null)
        {
            AnsiConsole.MarkupLineInterpolated($"[red]Directory content doesn't exist[/]");
            return 1;
        }

        var imagesPath = configuration.Directories.FirstOrDefault(e => e.Name == "images");

        if (imagesPath is null)
        {
            AnsiConsole.MarkupLineInterpolated($"[red]Directory images not found[/]");
            return 1;
        }

        var postPath = Path.Join(contentPath.Path, settings.Content, "index.md");

        if (!File.Exists(postPath))
        {
            AnsiConsole.MarkupLineInterpolated($"[red]Post file not found[/]");
            return 1;
        }

        var coverImage = Path.Join(imagesPath.Path, settings.Content, "cover.webp");

        if (!File.Exists(coverImage))
        {
            AnsiConsole.MarkupLineInterpolated($"[red]Cover image not found[/]");
            return 1;
        }

        var postContent = await File.ReadAllTextAsync(postPath);
        var frontmatterString = FrontmatterRegex().Match(postContent).Groups[1].Value;
        var frontmatter = new Deserializer().Deserialize<Dictionary<string, object?>>(frontmatterString);

        foreach (var kvp in frontmatter)
        {
            frontmatter[kvp.Key] = TypeUtils.GuessType(kvp.Value);
        }

        using var og = new Image<Rgba32>(new SixLabors.ImageSharp.Configuration(), configuration.Canvas.Width,
            configuration.Canvas.Height);
        using var cover = Image.Load<Rgba32>(coverImage);

        cover.Mutate(ctx => ctx.Resize(new Size(configuration.Canvas.Width, configuration.Canvas.Height)));
        og.Mutate(ctx =>
        {
            ctx.DrawImage(cover, new Point(0, 0), 1f);

            foreach (var layer in configuration.Layers)
            {
                switch (layer.Type)
                {
                    case LayerType.Overlay:
                    {
                        var rect = new Rectangle(0, 0, configuration.Canvas.Width, configuration.Canvas.Height);
                        var color = layer.Background.Split(',').Select(byte.Parse).ToArray();
                        ctx.Fill(Color.FromRgba(color[0], color[1], color[2], color[3]), rect);
                        break;
                    }
                    case LayerType.Text:
                        break;
                    case LayerType.ListOfTexts:
                        break;
                    default:
                        throw new ArgumentOutOfRangeException();
                }
            }
        });

        var ogImagePath = Path.Join(imagesPath.Path, settings.Content, "og-image.png");
        using var ms = new MemoryStream();
        await using var outputFileStream = new FileStream(ogImagePath, FileMode.OpenOrCreate);

        await og.SaveAsync(ms, new PngEncoder());
        ms.WriteTo(outputFileStream);

        return 0;
    }

    [GeneratedRegex("#(.*)#")]
    private static partial Regex DirectoryRegex();

    [GeneratedRegex(@"^---\s*\n(.*?)\n---", RegexOptions.Singleline)]
    private static partial Regex FrontmatterRegex();

    [GeneratedRegex("{(.*)}")]
    private static partial Regex FrontmatterFieldRegex();
}