using EnigmaMachine.Desktop.Services;

namespace EnigmaMachine.Desktop.Tests.TestHelpers;

/// <summary>
/// Configurable mock clipboard service for negative and isolated testing scenarios.
/// </summary>
public sealed class MockClipboardService : IClipboardService
{
    public string? CurrentText { get; set; }
    public bool ShouldFail { get; set; }
    public string FailureMessage { get; set; } = "Mock clipboard COMException: CLIPBRD_E_CANT_OPEN";
    public int SetTextCallCount { get; private set; }

    public MockClipboardService(string? initialText = null)
    {
        CurrentText = initialText;
    }

    public bool TrySetText(string text, out string? errorMessage)
    {
        SetTextCallCount++;

        if (ShouldFail)
        {
            errorMessage = FailureMessage;
            return false;
        }

        if (string.IsNullOrEmpty(text))
        {
            errorMessage = "Cannot copy empty content.";
            return false;
        }

        CurrentText = text;
        errorMessage = null;
        return true;
    }

    public string? GetText() => CurrentText;
}
