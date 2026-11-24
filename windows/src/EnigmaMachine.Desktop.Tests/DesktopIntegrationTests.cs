using System;
using System.Threading.Tasks;
using EnigmaMachine.Core.Engine;
using EnigmaMachine.Desktop.Services;
using EnigmaMachine.Desktop.Tests.TestHelpers;
using EnigmaMachine.Desktop.ViewModels;
using Xunit;

namespace EnigmaMachine.Desktop.Tests;

/// <summary>
/// Integration tests verifying asynchronous background dispatch, keystroke debouncing,
/// cancellation preemption, clipboard failure modes, and cryptographic configuration diagnostics.
/// </summary>
public class DesktopIntegrationTests
{
    [Fact]
    public async Task RapidTypingSimulation_DebouncingAndCancellation_CancelsPriorTasks_AndYieldsDeterministicOutput()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var mockClipboard = new MockClipboardService();
            var vm = new MainViewModel(mockClipboard);

            // Simulate rapid keystrokes entered faster than the 35ms debounce threshold
            string[] keystrokeProgression = new[]
            {
                "A",
                "Al",
                "Ali",
                "Alic",
                "Alice",
                "Alice ",
                "Alice in",
                "Alice in ",
                "Alice in W",
                "Alice in Wo",
                "Alice in Won",
                "Alice in Wond",
                "Alice in Wonder",
                "Alice in Wonderl",
                "Alice in Wonderla",
                "Alice in Wonderlan",
                "Alice in Wonderland"
            };

            foreach (var step in keystrokeProgression)
            {
                vm.InputText = step;
                // Tiny delay simulating 100-144 WPM rapid typing bursts
                await Task.Delay(10);
                StaTestHelper.DoEvents();
            }

            // Wait for debounce timer to expire and background thread-pool cipher calculation to finish
            await StaTestHelper.WaitForConditionAsync(() =>
                !vm.IsProcessing && vm.OutputText.Length == "Alice in Wonderland".Length);

            Assert.Equal("Alice in Wonderland", vm.InputText);
            Assert.Equal("Alice in Wonderland".Length, vm.OutputCharCount);

            // Compare against standalone deterministic engine
            var config = new EnigmaMachineConfig(
                ReflectorId.A,
                new RotorConfig(RotorId.I, 0, 0),
                new RotorConfig(RotorId.II, 0, 0),
                new RotorConfig(RotorId.III, 0, 0)
            );
            var expected = new EnigmaEngine(config).ProcessText("Alice in Wonderland").Ciphertext;
            Assert.Equal(expected, vm.OutputText);
        });
    }

    [Fact]
    public async Task ClipboardService_LockedClipboardSimulation_DisplaysErrorFeedback_WithoutThrowing()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var mockClipboard = new MockClipboardService
            {
                ShouldFail = true,
                FailureMessage = "Simulated COMException: CLIPBRD_E_CANT_OPEN (0x800401D0)"
            };

            var vm = new MainViewModel(mockClipboard)
            {
                InputText = "Secret Message To Copy Under Lock"
            };
            StaTestHelper.DoEvents();

            await StaTestHelper.WaitForConditionAsync(() =>
                !vm.IsProcessing && !string.IsNullOrEmpty(vm.OutputText));

            // Execute copy command
            Assert.True(vm.CopyOutputCommand.CanExecute(null));
            vm.CopyOutputCommand.Execute(null);

            // Verify visual error notification was presented via native InfoBar
            Assert.True(vm.IsNotificationVisible);
            Assert.Equal(NotificationSeverity.Error, vm.NotificationSeverity);
            Assert.Equal("Clipboard Access Denied", vm.NotificationTitle);
            Assert.Contains("CLIPBRD_E_CANT_OPEN", vm.NotificationMessage);

            // Button should not report success
            Assert.False(vm.IsCopied);
            Assert.Equal("Copy", vm.CopyButtonText);
            Assert.Equal(1, mockClipboard.SetTextCallCount);
        });
    }

    [Fact]
    public async Task LargePayloadSimulation_TriggersWarningFeedback_AndCompletesAsync()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var vm = new MainViewModel();

            // Create payload exceeding recommended threshold (> 500,000 chars)
            int targetLength = EnigmaValidator.MaxRecommendedPayloadLength + 1_000;
            string largeChunk = new string('X', targetLength);
            vm.InputText = largeChunk;
            StaTestHelper.DoEvents();

            // Wait for processing to begin and warning to appear
            await StaTestHelper.WaitForConditionAsync(() => vm.IsNotificationVisible);

            // 1. Verify large payload warning banner
            Assert.True(vm.IsNotificationVisible);
            Assert.Equal(NotificationSeverity.Warning, vm.NotificationSeverity);
            Assert.Equal("Large Payload Warning", vm.NotificationTitle);
            Assert.Contains($"{targetLength:N0}", vm.NotificationMessage);

            // 2. Await background completion
            await StaTestHelper.WaitForConditionAsync(() => !vm.IsProcessing, timeoutMs: 12000);

            Assert.Equal(largeChunk.Length, vm.OutputCharCount);
            Assert.NotEqual(largeChunk, vm.OutputText);
        });
    }

    [Fact]
    public async Task InvalidMachineConfiguration_DuplicateRotors_DisplaysWarningFeedback()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var vm = new MainViewModel();

            // Set Left and Middle rotors to duplicate Rotor I
            vm.LeftRotor.SelectedRotorId = RotorId.I;
            vm.MiddleRotor.SelectedRotorId = RotorId.I;
            vm.RightRotor.SelectedRotorId = RotorId.III;

            vm.InputText = "Testing Duplicate Rotor Diagnostic Alert";
            StaTestHelper.DoEvents();

            await StaTestHelper.WaitForConditionAsync(() =>
                !vm.IsProcessing && vm.IsNotificationVisible);

            // Verify configuration warning banner
            Assert.True(vm.IsNotificationVisible);
            Assert.Equal(NotificationSeverity.Warning, vm.NotificationSeverity);
            Assert.Equal("Machine Configuration", vm.NotificationTitle);
            Assert.Contains("Duplicate rotor", vm.NotificationMessage);
        });
    }

    [Fact]
    public async Task RotorPositionStepCommands_TriggerReEncryption_AndProduceValidCiphertext()
    {
        await StaTestHelper.RunAsync(async () =>
        {
            var vm = new MainViewModel
            {
                InputText = "Stepping Rotor Position Updates Ciphertext"
            };
            StaTestHelper.DoEvents();

            await StaTestHelper.WaitForConditionAsync(() =>
                !vm.IsProcessing && !string.IsNullOrEmpty(vm.OutputText));

            string initialCiphertext = vm.OutputText;
            Assert.Equal(0, vm.RightRotor.Position);

            // Step right rotor position up from 0 -> 1
            vm.RightRotor.StepPositionUpCommand.Execute(null);
            StaTestHelper.DoEvents();

            Assert.Equal(1, vm.RightRotor.Position);

            // Await re-encryption
            await StaTestHelper.WaitForConditionAsync(() =>
                !vm.IsProcessing && vm.OutputText != initialCiphertext);

            string steppedCiphertext = vm.OutputText;
            Assert.NotEqual(initialCiphertext, steppedCiphertext);
            Assert.Equal(vm.InputText.Length, steppedCiphertext.Length);
        });
    }
}
