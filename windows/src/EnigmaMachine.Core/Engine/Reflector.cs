using System;

namespace EnigmaMachine.Core.Engine;

/// <summary>
/// Represents the Enigma Reflector (Umkehrwalze) providing an involution permutation.
/// Guarantees strict reciprocity: Reflector(Reflector(x)) == x and Reflector(x) != x.
/// </summary>
public sealed class Reflector
{
    public ReflectorDefinition Definition { get; }

    public Reflector(ReflectorDefinition definition)
    {
        Definition = definition ?? throw new ArgumentNullException(nameof(definition));
    }

    /// <summary>
    /// Reflects an electrical signal contact.
    /// </summary>
    public int Reflect(int x)
    {
        return Definition.Wiring[x];
    }
}
