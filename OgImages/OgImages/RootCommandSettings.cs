using System.ComponentModel;
using Spectre.Console.Cli;

namespace OgImages;

public class RootCommandSettings : CommandSettings
{
    [Description("Content ID to generate images")]
    [CommandArgument(0, "[content]")]
    public string? Content { get; set; }

}