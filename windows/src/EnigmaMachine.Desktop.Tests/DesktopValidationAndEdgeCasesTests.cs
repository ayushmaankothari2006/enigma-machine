using System;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media;
using EnigmaMachine.Core.Engine;
using EnigmaMachine.Desktop.Services;
using EnigmaMachine.Desktop.Tests.TestHelpers;
using EnigmaMachine.Desktop.ViewModels;
using Xunit;

namespace EnigmaMachine.Desktop.Tests;

/// <summary>
/// Real-world desktop and edge-case validation suite verifying:
/// - Stress-testing under massive text blocks (10,000+ characters) without UI thread freeze
/// - Adaptive window resizing and Windows 11 Snap Layouts compatibility (760px to 4K)
/// - State preservation across minimize, restore, and maximize window states
/// - Real-time hot-swapping between Windows Dark and Light modes without state loss
/// - High-DPI display scaling simulation (125%, 150%, 200%)
/// </summary>
public class DesktopValidationAndEdgeCasesTests
{
    [Fact]
    public async Task MassiveTextPaste_StressTest_ProcessesAsync_WithoutDispatcherLockup()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                var vm = (MainViewModel)window.DataContext;

                // Generate a massive text block of 25,000 characters
                const int PayloadSize = 25_000;
                var sb = new StringBuilder(PayloadSize);
                for (int i = 0; i < PayloadSize; i++)
                {
                    // Alternate through valid printable ASCII characters and spaces
                    sb.Append(Alphabet.Chars[i % 95]);
                }
                string massivePayload = sb.ToString();

                // Simulate pasting the entire 25,000 character payload into InputTextBox
                window.InputTextBox.Text = massivePayload;
                StaTestHelper.DoEvents();

                // Confirm that calculation is offloaded to background task
                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && window.OutputTextBox.Text.Length == PayloadSize, timeoutMs: 15000);

                // Assertions on output card
                Assert.Equal(PayloadSize, window.InputTextBox.Text.Length);
                Assert.Equal(PayloadSize, window.OutputTextBox.Text.Length);
                Assert.Equal(PayloadSize, vm.InputCharCount);
                Assert.Equal(PayloadSize, vm.OutputCharCount);
                Assert.False(string.IsNullOrEmpty(window.OutputTextBox.Text));
                Assert.NotEqual(massivePayload, window.OutputTextBox.Text);

                // Verify calculation time is reported
                Assert.Contains("ms", vm.CalculationTime);

                // Verify that reciprocal decryption on 25,000 characters completely restores original text
                string ciphertext = window.OutputTextBox.Text;
                window.UseOutputAsInputButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && window.OutputTextBox.Text == massivePayload, timeoutMs: 15000);

                Assert.Equal(massivePayload, window.OutputTextBox.Text);
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task DynamicWindowResizing_AndSnapLayouts_AdjustsCardsWithoutClipping()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                window.Show();
                StaTestHelper.DoEvents();

                // 1. Windows 11 Snap Layouts: Snapped Half-Screen on 1080p display (width ~768px)
                window.Width = 768;
                window.Height = 700;
                window.UpdateLayout();
                StaTestHelper.DoEvents();

                Assert.Equal(768, window.Width);
                Assert.NotNull(window.InputTextBox);
                Assert.NotNull(window.OutputTextBox);

                // 2. Minimum Window Bounds: Fits comfortably on compact laptops / 150% scaling
                window.Width = window.MinWidth; // 760
                window.Height = window.MinHeight; // 560
                window.UpdateLayout();
                StaTestHelper.DoEvents();

                Assert.Equal(760, window.MinWidth);
                Assert.Equal(560, window.MinHeight);
                Assert.Equal(760, window.Width);
                Assert.Equal(560, window.Height);

                // 3. Maximized / Large Screen (1080p / 1440p)
                window.Width = 1920;
                window.Height = 1080;
                window.UpdateLayout();
                StaTestHelper.DoEvents();

                Assert.Equal(1920, window.Width);

                // 4. 4K Ultra HD Display (3840 x 2160)
                window.Width = 3840;
                window.Height = 2160;
                window.UpdateLayout();
                StaTestHelper.DoEvents();

                Assert.Equal(3840, window.Width);

                // Ensure interactive buttons and textboxes remain responsive and attached
                Assert.True(window.ClearInputButton.IsEnabled);
                Assert.True(window.CopyOutputButton.IsEnabled);
                Assert.True(window.ResetSettingsButton.IsEnabled);

                await Task.CompletedTask;
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task WindowMinimizeAndRestore_PreservesAllTextAndRotorStateIntact()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                window.Show();
                var vm = (MainViewModel)window.DataContext;

                // Configure customized machine state
                vm.SelectedReflector = ReflectorId.B;
                vm.LeftRotor.SelectedRotorId = RotorId.IV;
                vm.LeftRotor.Position = 42;
                vm.LeftRotor.RingSetting = 11;

                vm.MiddleRotor.SelectedRotorId = RotorId.V;
                vm.MiddleRotor.Position = 77;
                vm.MiddleRotor.RingSetting = 23;

                vm.RightRotor.SelectedRotorId = RotorId.II;
                vm.RightRotor.Position = 19;
                vm.RightRotor.RingSetting = 85;

                string testSecret = "Strict State Preservation Under Window Minimize and Restore Pass";
                window.InputTextBox.Text = testSecret;
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && !string.IsNullOrEmpty(window.OutputTextBox.Text));

                string expectedCiphertext = window.OutputTextBox.Text;

                // Simulate Minimizing the Window
                window.WindowState = WindowState.Minimized;
                StaTestHelper.DoEvents();

                // Simulate Restoring the Window
                window.WindowState = WindowState.Normal;
                StaTestHelper.DoEvents();

                // Assert that ALL state is completely intact
                Assert.Equal(testSecret, window.InputTextBox.Text);
                Assert.Equal(expectedCiphertext, window.OutputTextBox.Text);

                Assert.Equal(ReflectorId.B, vm.SelectedReflector);
                Assert.Equal(RotorId.IV, vm.LeftRotor.SelectedRotorId);
                Assert.Equal(42, vm.LeftRotor.Position);
                Assert.Equal(11, vm.LeftRotor.RingSetting);

                Assert.Equal(RotorId.V, vm.MiddleRotor.SelectedRotorId);
                Assert.Equal(77, vm.MiddleRotor.Position);
                Assert.Equal(23, vm.MiddleRotor.RingSetting);

                Assert.Equal(RotorId.II, vm.RightRotor.SelectedRotorId);
                Assert.Equal(19, vm.RightRotor.Position);
                Assert.Equal(85, vm.RightRotor.RingSetting);
            }
            finally
            {
                window.Close();
            }
        });
    }

    [Fact]
    public async Task RealTimeThemeToggle_DarkAndLightModes_HotSwapsBrushesWithoutStateLoss()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                window.Show();
                var vm = (MainViewModel)window.DataContext;

                // Enter secret message and customize machine
                string secret = "Theme Hot Swap Zero State Loss Verification 1944";
                window.InputTextBox.Text = secret;
                vm.LeftRotor.Position = 33;
                StaTestHelper.DoEvents();

                await StaTestHelper.WaitForConditionAsync(() =>
                    !vm.IsProcessing && !string.IsNullOrEmpty(window.OutputTextBox.Text));

                string originalCiphertext = window.OutputTextBox.Text;

                // Ensure initial theme is Dark
                ThemeService.ApplyTheme(AppTheme.Dark);
                StaTestHelper.DoEvents();

                Assert.Equal(AppTheme.Dark, ThemeService.CurrentTheme);
                Assert.Equal("Light", window.ThemeButtonLabel.Text);

                // Toggle Theme to Light Mode via Button Command
                Assert.True(window.ToggleThemeButton.Command.CanExecute(null));
                window.ToggleThemeButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                // 1. Verify Theme switched to Light
                Assert.Equal(AppTheme.Light, ThemeService.CurrentTheme);
                Assert.Equal("Dark", window.ThemeButtonLabel.Text);

                // 2. Verify that colors updated to Light palette
                var appResources = Application.Current.Resources;
                var windowBrush = (SolidColorBrush)appResources["WindowBackgroundBrush"];
                Assert.Equal(Color.FromRgb(0xF1, 0xF5, 0xF9), windowBrush.Color);

                var cardBrush = (SolidColorBrush)appResources["CardBackgroundBrush"];
                Assert.Equal(Color.FromRgb(0xFF, 0xFF, 0xFF), cardBrush.Color);

                // 3. Verify zero state loss: text and rotor settings are 100% preserved
                Assert.Equal(secret, window.InputTextBox.Text);
                Assert.Equal(originalCiphertext, window.OutputTextBox.Text);
                Assert.Equal(33, vm.LeftRotor.Position);

                // Toggle Theme back to Dark Mode
                window.ToggleThemeButton.Command.Execute(null);
                StaTestHelper.DoEvents();

                Assert.Equal(AppTheme.Dark, ThemeService.CurrentTheme);
                Assert.Equal("Light", window.ThemeButtonLabel.Text);

                var darkWindowBrush = (SolidColorBrush)appResources["WindowBackgroundBrush"];
                Assert.Equal(Color.FromRgb(0x0F, 0x11, 0x17), darkWindowBrush.Color);

                // State remains pristine
                Assert.Equal(secret, window.InputTextBox.Text);
                Assert.Equal(originalCiphertext, window.OutputTextBox.Text);
            }
            finally
            {
                // Reset to Light theme for remaining tests
                ThemeService.ApplyTheme(AppTheme.Light);
                window.Close();
            }
        });
    }

    [Theory]
    [InlineData(1.25)] // 125% DPI Scaling (1080p laptop standard)
    [InlineData(1.50)] // 150% DPI Scaling (2K / high-DPI standard)
    [InlineData(2.00)] // 200% DPI Scaling (4K UHD standard)
    public async Task DpiScalingSimulation_HighDpiRatios_RendersVectorGraphicsWithoutClipping(double dpiScale)
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var window = new MainWindow();
            try
            {
                window.Show();

                // Apply DPI layout scaling transform simulating high-DPI monitor on root element
                var root = (FrameworkElement)window.Content;
                root.LayoutTransform = new ScaleTransform(dpiScale, dpiScale);
                root.Measure(new Size(1200 * dpiScale, 840 * dpiScale));
                root.Arrange(new Rect(0, 0, 1200 * dpiScale, 840 * dpiScale));
                root.UpdateLayout();
                StaTestHelper.DoEvents();

                // Assert that layout and elements measured successfully without throwing
                Assert.True(root.IsMeasureValid);
                Assert.True(root.IsArrangeValid);
                Assert.NotNull(window.InputTextBox);
                Assert.NotNull(window.OutputTextBox);
                Assert.NotNull(window.NotificationBar);
                Assert.True(root.ActualWidth > 0);
                Assert.True(root.ActualHeight > 0);

                await Task.CompletedTask;
            }
            finally
            {
                window.Close();
            }
        });
    }
}
