using System;
using System.Collections.Generic;
using System.Text;

namespace EnigmaMachine.Core.Engine;

public sealed record SanitizationResult(
    string SanitizedText,
    bool HasUnsupportedChars,
    int UnsupportedCharCount,
    int OriginalCharCount,
    IReadOnlyList<char> DistinctUnsupportedChars
);

/// <summary>
/// Modern Enigma 96 Alphabet Definition.
/// 
/// Index 0: ' ' (SPACE, ASCII 32)
/// Index 1..94: ASCII 33..126 ('!' to '~')
/// Index 95: '\n' (ENTER / Line Feed, ASCII 10)
/// </summary>
public static class Alphabet
{
    public const int Size = 96;

    public static readonly char[] Chars = InitializeAlphabet();

    private static char[] InitializeAlphabet()
    {
        var chars = new char[Size];
        chars[0] = ' ';
        for (int i = 33; i <= 126; i++)
        {
            chars[i - 32] = (char)i;
        }
        chars[95] = '\n';
        return chars;
    }

    /// <summary>
    /// Fast O(1) character-to-index lookup using ASCII code boundaries.
    /// </summary>
    public static int CharToIndex(char ch)
    {
        if (ch == ' ') return 0;
        if (ch == '\n') return 95;
        if (ch >= 33 && ch <= 126) return ch - 32;
        return -1;
    }

    /// <summary>
    /// Returns true if the character is supported in the 96-character alphabet.
    /// </summary>
    public static bool IsValidChar(char ch) => CharToIndex(ch) >= 0;

    /// <summary>
    /// Fast O(1) index-to-character lookup with modulo wrapping.
    /// </summary>
    public static char IndexToChar(int index)
    {
        int norm = ((index % Size) + Size) % Size;
        return Chars[norm];
    }

    /// <summary>
    /// Formats a printable glyph string representing the index (e.g. [Space], [Enter], or glyph).
    /// </summary>
    public static string FormatGlyph(int index)
    {
        int norm = ((index % Size) + Size) % Size;
        if (norm == 0) return "[Space]";
        if (norm == 95) return "[Enter]";
        return Chars[norm].ToString();
    }

    /// <summary>
    /// Normalizes CRLF and CR to LF, and filters out characters outside the 96-character set.
    /// </summary>
    public static string SanitizeInput(string? text, out bool hasUnsupportedChars)
    {
        var res = Sanitize(text);
        hasUnsupportedChars = res.HasUnsupportedChars;
        return res.SanitizedText;
    }

    /// <summary>
    /// Full sanitization returning detailed metrics on stripped characters and distinct symbols.
    /// </summary>
    public static SanitizationResult Sanitize(string? text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return new SanitizationResult(string.Empty, false, 0, 0, Array.Empty<char>());
        }

        // Normalize line endings
        string normalized = text.Replace("\r\n", "\n").Replace('\r', '\n');
        var sb = new StringBuilder(normalized.Length);
        int unsupportedCount = 0;
        var distinctUnsupported = new HashSet<char>();

        foreach (char ch in normalized)
        {
            if (CharToIndex(ch) != -1)
            {
                sb.Append(ch);
            }
            else
            {
                unsupportedCount++;
                distinctUnsupported.Add(ch);
            }
        }

        return new SanitizationResult(
            SanitizedText: sb.ToString(),
            HasUnsupportedChars: unsupportedCount > 0,
            UnsupportedCharCount: unsupportedCount,
            OriginalCharCount: text.Length,
            DistinctUnsupportedChars: new List<char>(distinctUnsupported)
        );
    }
}
