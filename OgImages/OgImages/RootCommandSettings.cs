using Spectre.Console.Cli;
using System.ComponentModel;

namespace OgImages;

public class RootCommandSettings : CommandSettings
{
    [Description("Flag to generate all open graph images")]
    [CommandOption("--all")]
    public bool All { get; set; }

    [Description("Content ID to generate images")]
    [CommandArgument(0, "[content]")]
    public string? Content { get; set; }

}