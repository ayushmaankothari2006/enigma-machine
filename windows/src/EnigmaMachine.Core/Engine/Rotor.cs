using System;

namespace EnigmaMachine.Core.Engine;

/// <summary>
/// Represents an Enigma Rotor implementing forward and backward pin-contact substitution
/// with dynamic ring setting offset and position rotation.
/// </summary>
public sealed class Rotor
{
    public RotorDefinition Definition { get; }
    public int Position { get; set; }
    public int RingSetting { get; set; }
    public int TurnoverNotch { get; set; }

    public Rotor(RotorDefinition definition, int position = 0, int ringSetting = 0, int? turnoverNotch = null)
    {
        Definition = definition ?? throw new ArgumentNullException(nameof(definition));
        Position = ((position % Alphabet.Size) + Alphabet.Size) % Alphabet.Size;
        RingSetting = ((ringSetting % Alphabet.Size) + Alphabet.Size) % Alphabet.Size;
        TurnoverNotch = turnoverNotch.HasValue
            ? ((turnoverNotch.Value % Alphabet.Size) + Alphabet.Size) % Alphabet.Size
            : definition.Notch;
    }

    /// <summary>
    /// Computes the effective electrical shift of the rotor: (Position - RingSetting) mod 96.
    /// </summary>
    public int EffectiveShift => ((Position - RingSetting) % Alphabet.Size + Alphabet.Size) % Alphabet.Size;

    /// <summary>
    /// Forward signal pass (Right-to-Left towards Reflector).
    /// </summary>
    public int Forward(int x)
    {
        int shift = EffectiveShift;
        int pinIn = (x + shift) % Alphabet.Size;
        int pinMid = Definition.Wiring[pinIn];
        return ((pinMid - shift) % Alphabet.Size + Alphabet.Size) % Alphabet.Size;
    }

    /// <summary>
    /// Backward signal pass (Left-to-Right from Reflector).
    /// </summary>
    public int Backward(int x)
    {
        int shift = EffectiveShift;
        int pinIn = (x + shift) % Alphabet.Size;
        int pinMid = Definition.Inverse[pinIn];
        return ((pinMid - shift) % Alphabet.Size + Alphabet.Size) % Alphabet.Size;
    }
}
