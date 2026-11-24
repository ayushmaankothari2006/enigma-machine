using System;

namespace EnigmaMachine.Core.Engine;

/// <summary>
/// Seeded 32-bit PRNG (mulberry32) for deterministic, reproducible permutations
/// identical across web, Android, and Windows desktop implementations.
/// </summary>
public sealed class Mulberry32
{
    private uint _state;

    public Mulberry32(uint seed)
    {
        _state = seed;
    }

    /// <summary>
    /// Returns a pseudo-random floating point number in [0, 1).
    /// </summary>
    public double NextDouble()
    {
        unchecked
        {
            _state += 0x6D2B79F5;
            uint t = _state;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            return ((t ^ (t >> 14)) & 0xFFFFFFFFL) / 4294967296.0;
        }
    }

    /// <summary>
    /// Generates a deterministic permutation of numbers 0..95 using Fisher-Yates shuffle.
    /// </summary>
    public static int[] GeneratePermutation(uint seed)
    {
        var rng = new Mulberry32(seed);
        int[] arr = new int[Alphabet.Size];
        for (int i = 0; i < Alphabet.Size; i++)
        {
            arr[i] = i;
        }

        for (int i = Alphabet.Size - 1; i > 0; i--)
        {
            int j = (int)Math.Floor(rng.NextDouble() * (i + 1));
            (arr[i], arr[j]) = (arr[j], arr[i]);
        }

        return arr;
    }

    /// <summary>
    /// Generates an involution permutation (paired contacts with zero fixed points).
    /// </summary>
    public static int[] GenerateReflector(uint seed)
    {
        var rng = new Mulberry32(seed);
        int[] pool = new int[Alphabet.Size];
        for (int i = 0; i < Alphabet.Size; i++)
        {
            pool[i] = i;
        }

        for (int i = Alphabet.Size - 1; i > 0; i--)
        {
            int j = (int)Math.Floor(rng.NextDouble() * (i + 1));
            (pool[i], pool[j]) = (pool[j], pool[i]);
        }

        int[] reflector = new int[Alphabet.Size];
        for (int i = 0; i < Alphabet.Size; i += 2)
        {
            int a = pool[i];
            int b = pool[i + 1];
            reflector[a] = b;
            reflector[b] = a;
        }

        return reflector;
    }
}
