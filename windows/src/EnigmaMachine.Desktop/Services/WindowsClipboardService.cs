using System;
using System.Windows;

namespace EnigmaMachine.Desktop.Services;

/// <summary>
/// Production implementation of IClipboardService interacting directly with Windows OS clipboard.
/// </summary>
public sealed class WindowsClipboardService : IClipboardService
{
    public bool TrySetText(string text, out string? errorMessage)
    {
        return ClipboardService.TrySetText(text, out errorMessage);
    }

    public string? GetText()
    {
        try
        {
            return Clipboard.GetText();
        }
        catch
        {
            return null;
        }
    }
}
