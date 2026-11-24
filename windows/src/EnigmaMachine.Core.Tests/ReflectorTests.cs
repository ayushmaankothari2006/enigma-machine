using EnigmaMachine.Core.Engine;
using Xunit;

namespace EnigmaMachine.Core.Tests;

public class ReflectorTests
{
    [Theory]
    [InlineData(ReflectorId.A)]
    [InlineData(ReflectorId.B)]
    public void Reflector_HasZeroFixedPoints_AndIsStrictInvolution(ReflectorId reflectorId)
    {
        var reflectorDef = Presets.GetReflector(reflectorId);
        var reflector = new Reflector(reflectorDef);

        for (int x = 0; x < Alphabet.Size; x++)
        {
            int mapped = reflector.Reflect(x);

            // Zero fixed points: no contact maps to itself
            Assert.NotEqual(x, mapped);

            // Involution property: R(R(x)) == x
            Assert.Equal(x, reflector.Reflect(mapped));
        }
    }
}
