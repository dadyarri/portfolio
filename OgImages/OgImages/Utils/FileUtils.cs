namespace OgImages.Utils;

public class FileUtils
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
}