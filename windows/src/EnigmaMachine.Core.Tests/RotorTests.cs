using EnigmaMachine.Core.Engine;
using Xunit;

namespace EnigmaMachine.Core.Tests;

public class RotorTests
{
    [Theory]
    [InlineData(RotorId.I)]
    [InlineData(RotorId.II)]
    [InlineData(RotorId.III)]
    [InlineData(RotorId.IV)]
    [InlineData(RotorId.V)]
    public void Rotor_BackwardPass_PerfectlyReversesForwardPass(RotorId rotorId)
    {
        var rotorDef = Presets.GetRotor(rotorId);
        int[] testPositions = { 0, 15, 33, 65, 95 };
        int[] testRings = { 0, 5, 42, 95 };

        foreach (int pos in testPositions)
        {
            foreach (int ring in testRings)
            {
                var rotor = new Rotor(rotorDef, pos, ring);
                for (int x = 0; x < Alphabet.Size; x++)
                {
                    int fwd = rotor.Forward(x);
                    int bwd = rotor.Backward(fwd);
                    Assert.Equal(x, bwd);
                }
            }
        }
    }

    [Fact]
    public void Rotor_EffectiveShift_CalculatesCorrectly()
    {
        var rotor = new Rotor(Presets.GetRotor(RotorId.I), position: 5, ringSetting: 2);
        Assert.Equal(3, rotor.EffectiveShift);

        // Position < RingSetting wraps modulo 96
        rotor.Position = 2;
        rotor.RingSetting = 5;
        Assert.Equal(93, rotor.EffectiveShift);
    }
}
