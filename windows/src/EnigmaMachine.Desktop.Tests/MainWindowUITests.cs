using System;
using System.Threading.Tasks;
using System.Windows;
using EnigmaMachine.Core.Engine;
using EnigmaMachine.Desktop.Services;
using EnigmaMachine.Desktop.Tests.TestHelpers;
using EnigmaMachine.Desktop.ViewModels;
using Xunit;

namespace EnigmaMachine.Desktop.Tests;

/// <summary>
/// Automated End-to-End UI and Integration Tests verifying live user interactions,
/// visual tree controls, keyboard entry, clipboard operations, and error handling on WPF Dispatcher.
/// </summary>
public class MainWindowUITests
{
    [Fact]
    public async Task SimulateKeyboardEntry_UpdatesOutputCardInRealTime_WithDeterministicCiphertext()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                var vm = (MainViewModel)window.DataContext;

                // Clear default sample
                window.ClearInputButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                Assert.Equal(string.Empty, window.InputTextBox.Text);
                Assert.Equal(string.Empty, window.OutputTextBox.Text);

                // Simulate keystrokes typed into InputTextBox
                string simulatedTyping = "HELLO MODERN ENIGMA 96";
                foreach (char ch in simulatedTyping)
                {
                    window.InputTextBox.Text += ch;
                    StaTestHelper.DoEvents();
                }

                // Wait for debounce timer (35ms) and background cipher calculation
                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && window.OutputTextBox.Text.Length == simulatedTyping.Length);

                // Verify Input & Output cards
                Assert.Equal(simulatedTyping, window.InputTextBox.Text);
                Assert.Equal(simulatedTyping.Length, vm.InputCharCount);

                string ciphertext = window.OutputTextBox.Text;
                Assert.False(string.IsNullOrEmpty(ciphertext));
                Assert.Equal(simulatedTyping.Length, ciphertext.Length);
                Assert.Equal(simulatedTyping.Length, vm.OutputCharCount);
                Assert.NotEqual(simulatedTyping, ciphertext); // Must not be plaintext

                // Verify deterministic test vector for "HELLO MODERN ENIGMA 96" with default settings (Reflector A, Rotors I-II-III at 0/0)
                var config = new EnigmaMachineConfig(
                    ReflectorId.A,
                    new RotorConfig(RotorId.I, 0, 0),
                    new RotorConfig(RotorId.II, 0, 0),
                    new RotorConfig(RotorId.III, 0, 0)
                );
                var expectedCipher = new EnigmaEngine(config).ProcessText(simulatedTyping).Ciphertext;
                Assert.Equal(expectedCipher, ciphertext);
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task ClickCopyButton_PopulatesWindowsClipboard_AndDisplaysVisualConfirmation()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var mockClipboard = new MockClipboardService();
            var vm = new MainViewModel(mockClipboard);
            var window = new MainWindow(vm);
            try
            {
                // Enter distinct text
                window.InputTextBox.Text = "TEST TRANSMISSION CLASSIFIED 1944";
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && !string.IsNullOrEmpty(window.OutputTextBox.Text));

                string generatedCiphertext = window.OutputTextBox.Text;
                Assert.False(string.IsNullOrEmpty(generatedCiphertext));

                // Click Copy Output Button
                Assert.True(window.CopyOutputButton.Command.CanExecute(null));
                window.CopyOutputButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() => vm.IsCopied && window.CopyButtonTextLabel.Text == "Copied!", timeoutMs: 3000);

                // 1. Verify Visual Confirmation on Button Text
                Assert.Equal("Copied!", window.CopyButtonTextLabel.Text);
                Assert.True(vm.IsCopied);

                // 2. Verify Native InfoBar Notification Banner
                Assert.Equal(Visibility.Visible, window.NotificationBar.Visibility);
                Assert.Equal("Clipboard Copied", window.NotificationTitleText.Text);
                Assert.Equal(NotificationSeverity.Success, vm.NotificationSeverity);
                Assert.Contains(generatedCiphertext.Length.ToString(), window.NotificationMessageText.Text);

                // 3. Verify Clipboard Content
                Assert.Equal(generatedCiphertext, mockClipboard.GetText());
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task NegativeTest_EnteringUnsupportedCharacters_DisplaysWarningBanner_WithoutDispatcherException()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                var vm = (MainViewModel)window.DataContext;

                // Input containing characters outside 96 ASCII alphabet (emojis, tabs, non-ASCII Unicode)
                string dirtyInput = "Valid Text 🚀\tWith Emojis 🎉 And Symbol \u00A9";
                window.InputTextBox.Text = dirtyInput;
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && !string.IsNullOrEmpty(window.OutputTextBox.Text));

                // 1. Verify warning indicator within Input Card
                Assert.True(vm.HasUnsupportedChars);
                Assert.Equal(Visibility.Visible, window.UnsupportedCharsWarningBanner.Visibility);

                // 2. Verify Native InfoBar Warning Notification
                Assert.Equal(Visibility.Visible, window.NotificationBar.Visibility);
                Assert.Equal(NotificationSeverity.Warning, vm.NotificationSeverity);
                Assert.Equal("Input Sanitized", window.NotificationTitleText.Text);
                Assert.Contains("Filtered", window.NotificationMessageText.Text);

                // 3. Verify Output contains strictly encrypted valid characters
                string output = window.OutputTextBox.Text;
                var sanitized = Alphabet.Sanitize(dirtyInput);
                Assert.Equal(sanitized.SanitizedText.Length, output.Length);

                // Assert each output char belongs strictly to the 96-char alphabet
                foreach (char c in output)
                {
                    Assert.True(Alphabet.IsValidChar(c));
                }
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task NegativeTest_ClickingClearButton_ResetsInputAndOutputGracefully()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                var vm = (MainViewModel)window.DataContext;

                // Load text and let cipher calculate
                window.InputTextBox.Text = "Text To Be Cleared Promptly";
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && !string.IsNullOrEmpty(window.OutputTextBox.Text));

                Assert.True(window.OutputTextBox.Text.Length > 0);

                // Click the Clear Button
                Assert.True(window.ClearInputButton.Command.CanExecute(null));
                window.ClearInputButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                // Wait for reset
                await StaTestHelper.WaitForConditionAsync(() =>
                    window.InputTextBox.Text == string.Empty && window.OutputTextBox.Text == string.Empty);

                // Assert UI is reset gracefully
                Assert.Equal(string.Empty, window.InputTextBox.Text);
                Assert.Equal(string.Empty, window.OutputTextBox.Text);
                Assert.Equal(0, vm.InputCharCount);
                Assert.Equal(0, vm.OutputCharCount);
                Assert.False(vm.HasUnsupportedChars);
                Assert.Equal(Visibility.Collapsed, window.NotificationBar.Visibility);
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task NegativeTest_ClickCopyWhenEmpty_DisplaysWarningFeedback_WithoutModifyingClipboard()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var mockClipboard = new MockClipboardService("CANARY_PREEXISTING_TEXT");
            var vm = new MainViewModel(mockClipboard);
            var window = new MainWindow(vm);
            try
            {
                // Clear input and output
                window.ClearInputButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                // Click Copy Output Button when output is empty
                window.CopyOutputButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                // 1. Verify warning notification
                Assert.Equal(Visibility.Visible, window.NotificationBar.Visibility);
                Assert.Equal(NotificationSeverity.Warning, vm.NotificationSeverity);
                Assert.Equal("Clipboard", window.NotificationTitleText.Text);
                Assert.Contains("no ciphertext", window.NotificationMessageText.Text);

                // 2. Verify Button text is not set to "Copied!"
                Assert.Equal("Copy", window.CopyButtonTextLabel.Text);
                Assert.False(vm.IsCopied);

                // 3. Verify clipboard service was not invoked with empty text
                Assert.Equal(0, mockClipboard.SetTextCallCount);
                Assert.Equal("CANARY_PREEXISTING_TEXT", mockClipboard.GetText());

                await Task.CompletedTask;
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task ReciprocalDecryption_ViaUseAsInputButton_ReproducesOriginalPlaintext()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                var vm = (MainViewModel)window.DataContext;

                string initialPlaintext = "Top Secret Operation Overlord Reciprocal Verification";
                window.InputTextBox.Text = initialPlaintext;
                StaTestHelper.DoEvents();

                // Wait for initial encryption
                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && window.OutputTextBox.Text.Length == initialPlaintext.Length);

                string ciphertext = window.OutputTextBox.Text;
                Assert.NotEqual(initialPlaintext, ciphertext);

                // Click "Use as Input" button
                Assert.True(window.UseOutputAsInputButton.Command.CanExecute(null));
                window.UseOutputAsInputButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                // Input is now the ciphertext
                Assert.Equal(ciphertext, window.InputTextBox.Text);

                // Wait for reciprocal decryption calculation
                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && window.OutputTextBox.Text == initialPlaintext);

                // Verify original plaintext was completely restored
                Assert.Equal(initialPlaintext, window.OutputTextBox.Text);
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task SettingsCard_ChangingReflector_UpdatesOutputCiphertextImmediately()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                var vm = (MainViewModel)window.DataContext;

                window.InputTextBox.Text = "Testing Reflector Swap Live Feedback";
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && !string.IsNullOrEmpty(window.OutputTextBox.Text));

                // Capture Reflector A ciphertext
                string cipherA = window.OutputTextBox.Text;
                Assert.Equal(ReflectorId.A, vm.SelectedReflector);

                // Change reflector to B via ComboBox
                window.ReflectorComboBox.SelectedItem = ReflectorId.B;
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && window.OutputTextBox.Text != cipherA);

                // Capture Reflector B ciphertext
                string cipherB = window.OutputTextBox.Text;
                Assert.Equal(ReflectorId.B, vm.SelectedReflector);
                Assert.NotEqual(cipherA, cipherB);

                // Switch back to Reflector A
                window.ReflectorComboBox.SelectedItem = ReflectorId.A;
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && window.OutputTextBox.Text == cipherA);

                Assert.Equal(cipherA, window.OutputTextBox.Text);
            }
            finally
            {
                window.Close();
            }
        });
    }
}
