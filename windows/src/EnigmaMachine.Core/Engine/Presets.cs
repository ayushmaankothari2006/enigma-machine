using System;
using System.Collections.Generic;

namespace EnigmaMachine.Core.Engine;

/// <summary>
/// Deterministic rotor and reflector catalog for Modern Enigma 96.
/// Guarantees bit-for-bit parity with Web and Android platforms.
/// </summary>
public static class Presets
{
    public static int[] InvertPermutation(int[] p)
    {
        var inv = new int[Alphabet.Size];
        for (int i = 0; i < Alphabet.Size; i++)
        {
            inv[p[i]] = i;
        }
        return inv;
    }

    public static readonly IReadOnlyDictionary<RotorId, RotorDefinition> RotorCatalog = InitializeRotors();

    public static readonly IReadOnlyDictionary<ReflectorId, ReflectorDefinition> ReflectorCatalog = InitializeReflectors();

    private static Dictionary<RotorId, RotorDefinition> InitializeRotors()
    {
        var catalog = new Dictionary<RotorId, RotorDefinition>();

        // Rotor I: Seed 101, Turnover Notch 33 ('A')
        int[] w1 = Mulberry32.GeneratePermutation(101);
        catalog[RotorId.I] = new RotorDefinition(
            RotorId.I,
            "Rotor I",
            w1,
            InvertPermutation(w1),
            33,
            "'A'"
        );

        // Rotor II: Seed 202, Turnover Notch 65 ('a')
        int[] w2 = Mulberry32.GeneratePermutation(202);
        catalog[RotorId.II] = new RotorDefinition(
            RotorId.II,
            "Rotor II",
            w2,
            InvertPermutation(w2),
            65,
            "'a'"
        );

        // Rotor III: Seed 303, Turnover Notch 16 ('0')
        int[] w3 = Mulberry32.GeneratePermutation(303);
        catalog[RotorId.III] = new RotorDefinition(
            RotorId.III,
            "Rotor III",
            w3,
            InvertPermutation(w3),
            16,
            "'0'"
        );

        // Rotor IV: Seed 404, Turnover Notch 0 (' ')
        int[] w4 = Mulberry32.GeneratePermutation(404);
        catalog[RotorId.IV] = new RotorDefinition(
            RotorId.IV,
            "Rotor IV",
            w4,
            InvertPermutation(w4),
            0,
            "[Space]"
        );

        // Rotor V: Seed 505, Turnover Notch 95 ('\n')
        int[] w5 = Mulberry32.GeneratePermutation(505);
        catalog[RotorId.V] = new RotorDefinition(
            RotorId.V,
            "Rotor V",
            w5,
            InvertPermutation(w5),
            95,
            "[Enter]"
        );

        return catalog;
    }

    private static Dictionary<ReflectorId, ReflectorDefinition> InitializeReflectors()
    {
        var catalog = new Dictionary<ReflectorId, ReflectorDefinition>();

        // Reflector A: Seed 606 (Involution, zero fixed points)
        int[] refA = Mulberry32.GenerateReflector(606);
        catalog[ReflectorId.A] = new ReflectorDefinition(
            ReflectorId.A,
            "Reflector A",
            refA
        );

        // Reflector B: Seed 707 (Involution, zero fixed points)
        int[] refB = Mulberry32.GenerateReflector(707);
        catalog[ReflectorId.B] = new ReflectorDefinition(
            ReflectorId.B,
            "Reflector B",
            refB
        );

        return catalog;
    }

    public static RotorDefinition GetRotor(RotorId id) => RotorCatalog[id];

    public static ReflectorDefinition GetReflector(ReflectorId id) => ReflectorCatalog[id];
}
