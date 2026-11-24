using EnigmaMachine.Core.Engine;
using Xunit;

namespace EnigmaMachine.Core.Tests;

public class SteppingTests
{
    [Fact]
    public void RotorStepping_AccuratelySimulatesDoubleSteppingAnomaly()
    {
        // Setup:
        // Rotor II turnover notch is 65 ('a')
        // Rotor III turnover notch is 16 ('0')
        int notch2 = 65;
        int notch3 = 16;

        // Step 1: Right rotor not at notch (15), middle not at notch (64)
        var step1 = EnigmaEngine.StepRotors(0, 64, 15, notch2, notch3);
        Assert.Equal(new[] { 0, 64, 16 }, step1.Positions);
        Assert.Equal("Normal Fast (R3)", step1.PawlAction);

        // Step 2: Right rotor IS at notch 16!
        // On keystroke, both R3 and R2 step
        var step2 = EnigmaEngine.StepRotors(0, 64, 16, notch2, notch3);
        Assert.Equal(new[] { 0, 65, 17 }, step2.Positions);
        Assert.Contains("Middle Turnover", step2.PawlAction);

        // Step 3: Middle rotor IS at its notch 65!
        // Double-stepping anomaly: Middle rotor steps AGAIN and also steps Left rotor (R1)!
        var step3 = EnigmaEngine.StepRotors(0, 65, 17, notch2, notch3);
        Assert.Equal(new[] { 1, 66, 18 }, step3.Positions);
        Assert.Contains("Double-Step Anomaly", step3.PawlAction);
    }
}
