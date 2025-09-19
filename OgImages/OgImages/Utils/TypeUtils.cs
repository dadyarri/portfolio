using System.Globalization;

namespace OgImages.Utils;

public class TypeUtils
{
    /// <summary>
    /// Пытается угадать тип значения.
    /// </summary>
    public static object GuessType(object? value)
    {
        if (value is null)
            return new object();

        if (value is string s)
        {
            if (bool.TryParse(s, out var boolResult))
                return boolResult;

            if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dateResult))
                return dateResult;

            if (int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var intResult))
                return intResult;

            if (double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var doubleResult))
                return doubleResult;

            return s;
        }

        if (value is bool or int or double or DateTime)
            return value;

        if (value is IEnumerable<object> list)
        {
            return list.Select(GuessType).ToList();
        }

        if (value is Dictionary<object, object> dict)
        {
            var guessedDict = new Dictionary<string, object>();
            foreach (var kvp in dict)
            {
                guessedDict[kvp.Key.ToString()!] = GuessType(kvp.Value);
            }
            return guessedDict;
        }

        return value;
    }
}