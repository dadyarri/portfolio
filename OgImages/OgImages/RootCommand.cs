using System.Text.Json;
using OgImages.Configuration;
using OgImages.Utils;
using Spectre.Console;
using Spectre.Console.Cli;

namespace OgImages;

internal sealed class RootCommand : AsyncCommand<RootCommandSettings>
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

        AnsiConsole.MarkupLineInterpolated($"[green]Using config file from '{configurationPath}'[/]");

        await using var fs = File.OpenRead(configurationPath);
        var configuration = await JsonSerializer.DeserializeAsync<OgImagesConfiguration>(fs);

        return 0;
    }
}