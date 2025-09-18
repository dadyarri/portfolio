using Spectre.Console;
using System.Text.RegularExpressions;

namespace OgImages.Utils;

public partial class FileUtils
{
    public static string? FindFileUpwards(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("File name cannot be null or whitespace.", nameof(fileName));

        var currentDirectory = AppContext.BaseDirectory;

        while (!string.IsNullOrEmpty(currentDirectory))
        {
            var filePath = Path.Combine(currentDirectory, fileName);
            if (File.Exists(filePath))
            {
                return filePath;
            }

            var parent = Directory.GetParent(currentDirectory);
            if (parent == null)
                break;

            currentDirectory = parent.FullName;
        }

        return null;
    }

    public static string GetFullPath(string expression, Dictionary<string, string> directories)
    {

        var replaced = DirectoryRegex().Replace(expression, match =>
        {
            var dirName = match.Groups[1].Value;
            if (directories.TryGetValue(dirName, out var dir))
            {
                return dir;
            }

            AnsiConsole.MarkupLineInterpolated($"[red]Directory {dirName} is not defined[/]");
            throw new Exception("Directory is not defined");
        });


        return replaced;
    }

    [GeneratedRegex("#([^#/]+)#")]
    private static partial Regex DirectoryRegex();
}