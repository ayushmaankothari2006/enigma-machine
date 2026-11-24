using System.Threading.Tasks;
using EnigmaMachine.Core.Engine;
using EnigmaMachine.Desktop.Services;
using EnigmaMachine.Desktop.ViewModels;
using Xunit;

namespace EnigmaMachine.Desktop.Tests;

public class MainViewModelTests
{
    [Fact]
    public async Task InitialState_LoadsSample_AndEncryptsSuccessfully()
    {
        var vm = new MainViewModel();

        // Sample is loaded by default
        Assert.False(string.IsNullOrEmpty(vm.InputText));
        Assert.True(vm.InputCharCount > 0);

        // Execute encryption
        await vm.ExecuteProcessEnigmaAsync();

        Assert.False(string.IsNullOrEmpty(vm.OutputText));
        Assert.Equal(vm.InputText.Length, vm.OutputCharCount);
        Assert.False(vm.IsProcessing);
    }

    [Fact]
    public async Task ClearInputCommand_ClearsAllText()
    {
        var vm = new MainViewModel();
        await vm.ExecuteProcessEnigmaAsync();

        vm.ClearInputCommand.Execute(null);

        Assert.Equal(string.Empty, vm.InputText);
        Assert.Equal(0, vm.InputCharCount);
        Assert.False(vm.IsNotificationVisible);
    }

    [Fact]
    public async Task UseOutputAsInputCommand_EnablesReciprocalDecryption()
    {
        var vm = new MainViewModel
        {
            InputText = "Reciprocal Decryption Verification Test"
        };
        await vm.ExecuteProcessEnigmaAsync();

        string ciphertext = vm.OutputText;
        Assert.NotEqual(vm.InputText, ciphertext);

        // Feed ciphertext back to input
        vm.UseOutputAsInputCommand.Execute(null);
        Assert.Equal(ciphertext, vm.InputText);

        // Process reciprocal decryption
        await vm.ExecuteProcessEnigmaAsync();
        Assert.Equal("Reciprocal Decryption Verification Test", vm.OutputText);
    }

    [Fact]
    public void ResetSettingsCommand_RestoresDefaultPreset()
    {
        var vm = new MainViewModel
        {
            SelectedReflector = ReflectorId.B
        };
        vm.LeftRotor.SelectedRotorId = RotorId.V;
        vm.LeftRotor.Position = 42;
        vm.LeftRotor.RingSetting = 10;

        vm.ResetSettingsCommand.Execute(null);

        Assert.Equal(ReflectorId.A, vm.SelectedReflector);
        Assert.Equal(RotorId.I, vm.LeftRotor.SelectedRotorId);
        Assert.Equal(0, vm.LeftRotor.Position);
        Assert.Equal(0, vm.LeftRotor.RingSetting);

        Assert.Equal(RotorId.II, vm.MiddleRotor.SelectedRotorId);
        Assert.Equal(0, vm.MiddleRotor.Position);
        Assert.Equal(0, vm.MiddleRotor.RingSetting);

        Assert.Equal(RotorId.III, vm.RightRotor.SelectedRotorId);
        Assert.Equal(0, vm.RightRotor.Position);
        Assert.Equal(0, vm.RightRotor.RingSetting);
    }

    [Fact]
    public void RandomizeSettingsCommand_AssignsDistinctRotors()
    {
        var vm = new MainViewModel();
        vm.RandomizeSettingsCommand.Execute(null);

        // Rotor IDs should be distinct
        Assert.NotEqual(vm.LeftRotor.SelectedRotorId, vm.MiddleRotor.SelectedRotorId);
        Assert.NotEqual(vm.MiddleRotor.SelectedRotorId, vm.RightRotor.SelectedRotorId);
        Assert.NotEqual(vm.LeftRotor.SelectedRotorId, vm.RightRotor.SelectedRotorId);

        // Positions and rings within valid 96 bounds
        Assert.InRange(vm.LeftRotor.Position, 0, Alphabet.Size - 1);
        Assert.InRange(vm.MiddleRotor.Position, 0, Alphabet.Size - 1);
        Assert.InRange(vm.RightRotor.Position, 0, Alphabet.Size - 1);
    }

    [Fact]
    public void Notification_ShowAndDismiss_TogglesStateCorrectly()
    {
        var vm = new MainViewModel();

        vm.ShowNotification(NotificationSeverity.Warning, "Test Title", "Test Message Body");
        Assert.True(vm.IsNotificationVisible);
        Assert.Equal(NotificationSeverity.Warning, vm.NotificationSeverity);
        Assert.Equal("Test Title", vm.NotificationTitle);
        Assert.Equal("Test Message Body", vm.NotificationMessage);

        vm.DismissNotificationCommand.Execute(null);
        Assert.False(vm.IsNotificationVisible);
    }

    [Fact]
    public void ClipboardService_EmptyText_ReturnsFalseWithoutThrowing()
    {
        bool result = ClipboardService.TrySetText(string.Empty, out string? error);
        Assert.False(result);
        Assert.NotNull(error);
        Assert.Contains("empty", error);
    }

    [Fact]
    public void RotorSlotViewModel_Steppers_IncrementAndWrap()
    {
        bool changed = false;
        var slot = new RotorSlotViewModel(RotorSlot.Right, RotorId.III, defaultPos: 95, defaultRing: 0, () => changed = true);

        // Step up from 95 wraps to 0
        slot.StepPositionUpCommand.Execute(null);
        Assert.Equal(0, slot.Position);
        Assert.True(changed);

        // Step down from 0 wraps to 95
        slot.StepPositionDownCommand.Execute(null);
        Assert.Equal(95, slot.Position);

        // Ring steppers
        slot.StepRingDownCommand.Execute(null);
        Assert.Equal(95, slot.RingSetting);

        slot.StepRingUpCommand.Execute(null);
        Assert.Equal(0, slot.RingSetting);
    }
}
