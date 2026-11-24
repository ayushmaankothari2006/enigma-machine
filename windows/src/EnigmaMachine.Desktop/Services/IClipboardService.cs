namespace EnigmaMachine.Desktop.Services;

/// <summary>
/// Abstraction for system clipboard interactions.
/// </summary>
public interface IClipboardService
{
    /// <summary>
    /// Attempts to write text to the clipboard.
    /// </summary>
    bool TrySetText(string text, out string? errorMessage);

    /// <summary>
    /// Reads text currently stored in the clipboard, or null if empty/inaccessible.
    /// </summary>
    string? GetText();
}
