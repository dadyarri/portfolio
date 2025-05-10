using System.Text.Json;
using System.Text.RegularExpressions;
using OgImages.Configuration;
using OgImages.Utils;
using Spectre.Console;
using Spectre.Console.Cli;
using Directory = System.IO.Directory;

namespace OgImages;

internal sealed partial class RootCommand : AsyncCommand<RootCommandSettings>
{
    public override async Task<int> ExecuteAsync(CommandContext context, RootCommandSettings settings)
    {
        if (settings is { All: false, Content: null })
        {
            AnsiConsole.MarkupLine("[red]Please select content item or specify [bold]--all[/] flag[/]");
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

        return 0;
    }

    [GeneratedRegex("#(.*)#")]
    private static partial Regex DirectoryRegex();
}