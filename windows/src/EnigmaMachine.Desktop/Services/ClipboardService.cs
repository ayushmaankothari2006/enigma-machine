using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows;

namespace EnigmaMachine.Desktop.Services;

/// <summary>
/// Hardened Windows clipboard service with retry logic and error reporting.
/// Prevents COMException (CLIPBRD_E_CANT_OPEN) crashes when another app has clipboard locked.
/// </summary>
public static class ClipboardService
{
    private const int MaxRetries = 10;
    private const int BaseDelayMilliseconds = 35;

    public static bool TrySetText(string text, out string? errorMessage)
    {
        errorMessage = null;

        if (string.IsNullOrEmpty(text))
        {
            errorMessage = "Cannot copy empty content.";
            return false;
        }

        for (int attempt = 1; attempt <= MaxRetries; attempt++)
        {
            try
            {
                Clipboard.SetDataObject(text, true);
                return true;
            }
            catch (COMException) when (attempt < MaxRetries)
            {
                // Clipboard temporarily locked by another process (e.g. clipboard manager, remote desktop)
                WaitWithPumping(BaseDelayMilliseconds * attempt);
            }
            catch (Exception ex)
            {
                if (attempt == MaxRetries)
                {
                    errorMessage = $"Clipboard access failed: {ex.Message}";
                    return false;
                }
                WaitWithPumping(BaseDelayMilliseconds * attempt);
            }
        }

        errorMessage = "Clipboard access timed out: The Windows clipboard is currently locked by another application.";
        return false;
    }

    private static void WaitWithPumping(int milliseconds)
    {
        var dispatcher = System.Windows.Threading.Dispatcher.FromThread(Thread.CurrentThread);
        if (dispatcher != null && !dispatcher.HasShutdownStarted)
        {
            var frame = new System.Windows.Threading.DispatcherFrame();
            var timer = new System.Windows.Threading.DispatcherTimer(System.Windows.Threading.DispatcherPriority.Background, dispatcher)
            {
                Interval = TimeSpan.FromMilliseconds(milliseconds)
            };
            timer.Tick += (_, _) =>
            {
                timer.Stop();
                frame.Continue = false;
            };
            timer.Start();
            System.Windows.Threading.Dispatcher.PushFrame(frame);
        }
        else
        {
            Thread.Sleep(milliseconds);
        }
    }

    /// <summary>
    /// Safely reads text from the Windows clipboard.
    /// </summary>
    public static string? GetText()
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
