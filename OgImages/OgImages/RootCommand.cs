using System.Text.Json;
using System.Text.RegularExpressions;
using OgImages.Configuration;
using OgImages.Utils;
using SixLabors.Fonts;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using Spectre.Console;
using Spectre.Console.Cli;
using YamlDotNet.Serialization;
using Directory = System.IO.Directory;
using Size = SixLabors.ImageSharp.Size;

namespace OgImages;

internal sealed partial class RootCommand : AsyncCommand<RootCommandSettings>
{
    public override async Task<int> ExecuteAsync(CommandContext context, RootCommandSettings settings)
    {
        if (settings.Content is null && !settings.All)
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

        var jsonOptions = new JsonSerializerOptions();
        jsonOptions.Converters.Add(new ColorJsonConverter());
        jsonOptions.Converters.Add(new LayerConverter());

        var configuration = await JsonSerializer.DeserializeAsync<OgImagesConfiguration>(fs, jsonOptions);

        if (configuration is null)
        {
            AnsiConsole.MarkupLine("[red]Error reading configuration file[/]");
            return 1;
        }

        var directories = new Dictionary<string, string>();

        foreach (var directory in configuration.Directories)
        {
            directories.TryAdd(directory.Name, Path.GetFullPath(Path.Join(configurationDirectory, directory.Path)));
        }

        AnsiConsole.MarkupLineInterpolated($"[gray]Found {directories.Count} directories[/]");

        var fontCollection = new FontCollection();
        Dictionary<string, Tuple<FontFamily, FontStyle>> fonts = [];

        foreach (var fontConfig in configuration.Fonts)
        {
            var path = FileUtils.GetFullPath(fontConfig.Path, directories);

            if (!File.Exists(path))
            {
                AnsiConsole.MarkupLineInterpolated($"[red]Font file {fontConfig.Name} not found[/]");
                return 1;
            }

            var style = fontConfig.Weight switch
            {
                400 => FontStyle.Regular,
                700 => FontStyle.Bold,
                _ => throw new ArgumentOutOfRangeException()
            };

            var family = fontCollection.Add(path);
            fonts.Add(fontConfig.Name, new Tuple<FontFamily, FontStyle>(family, style));
        }

        AnsiConsole.MarkupLineInterpolated($"[gray]Found {fonts.Count} fonts[/]");

        List<string> contentItems = [];

        if (settings.All)
        {
            var pathParts = configuration.Content.Article.Split('/');
            var contentRoot = FileUtils.GetFullPath(pathParts.First(), directories);
            var fileName = pathParts.Last();

            contentItems = Directory.EnumerateFiles(contentRoot, fileName, SearchOption.AllDirectories)
                .Select(path => Path.GetRelativePath(contentRoot, Path.GetDirectoryName(path)!))
                .ToList();
        }
        else
        {
            contentItems = [settings.Content];
        }

        AnsiConsole.MarkupLineInterpolated($"[gray]Running generation for [[{string.Join(", ", contentItems)}]][/]");

        foreach (var contentItem in contentItems)
        {
            directories["item"] = contentItem;

            var postContent =
                await File.ReadAllTextAsync(FileUtils.GetFullPath(configuration.Content.Article, directories));
            var frontmatterString = FrontmatterRegex().Match(postContent).Groups[1].Value;
            var frontmatter = new Deserializer().Deserialize<Dictionary<string, object?>>(frontmatterString);

            foreach (var kvp in frontmatter)
            {
                frontmatter[kvp.Key] = TypeUtils.GuessType(kvp.Value);
            }

            using var og = new Image<Rgba32>(new SixLabors.ImageSharp.Configuration(), configuration.Canvas.Width,
                configuration.Canvas.Height);

            var backgroundPath = FileUtils.GetFullPath(configuration.Canvas.Background.Image, directories);
            if (File.Exists(backgroundPath))
            {
                using var backgroundImage = Image.Load<Rgba32>(backgroundPath);
                backgroundImage.Mutate(ctx =>
                    ctx.Resize(new Size(configuration.Canvas.Width, configuration.Canvas.Height)));

                og.Mutate(ctx =>
                {
                    var rect = new Rectangle(0, 0, configuration.Canvas.Width, configuration.Canvas.Height);
                    ctx.DrawImage(backgroundImage, new Point(0, 0), 1f);
                    ctx.Fill(configuration.Canvas.Background.OverlayColor, rect);
                });
            }
            else
            {
                og.Mutate(ctx => ctx.Fill(configuration.Canvas.Background.FallbackColor));
            }


            og.Mutate(ctx =>
            {
                var lm = new LayoutManager(configuration.Layers);
                lm.Render(ctx, configuration, frontmatter, fonts, directories);
            });

            var ogImagePath = FileUtils.GetFullPath(configuration.Content.OgImage, directories);
            using var ms = new MemoryStream();
            await using var outputFileStream = new FileStream(ogImagePath, FileMode.OpenOrCreate);

            await og.SaveAsync(ms, new PngEncoder());
            ms.WriteTo(outputFileStream);

            AnsiConsole.MarkupLine($"[green]Saved {ogImagePath}[/]");
        }

        return 0;
    }

    [GeneratedRegex(@"^---\s*\n(.*?)\n---", RegexOptions.Singleline)]
    private static partial Regex FrontmatterRegex();
}