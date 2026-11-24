using System;
using System.Collections.Generic;

namespace EnigmaMachine.Core.Engine;

public enum ConfigWarningSeverity
{
    Info,
    Warning,
    Error
}

public sealed record ConfigDiagnostic(
    ConfigWarningSeverity Severity,
    string Code,
    string Message
);

public sealed record ValidationReport(
    bool IsValid,
    IReadOnlyList<ConfigDiagnostic> Diagnostics
);

/// <summary>
/// Validates Enigma machine configurations against authentic physical rules and runtime safety limits.
/// </summary>
public static class EnigmaValidator
{
    public const int MaxRecommendedPayloadLength = 500_000;

    public static ValidationReport Validate(EnigmaMachineConfig? config)
    {
        var diagnostics = new List<ConfigDiagnostic>();

        if (config == null)
        {
            diagnostics.Add(new ConfigDiagnostic(
                ConfigWarningSeverity.Error,
                "CFG_NULL",
                "Machine configuration cannot be null."
            ));
            return new ValidationReport(false, diagnostics);
        }

        // Check for duplicate rotor models across slots
        var rotorIds = new[]
        {
            config.LeftRotor.Id,
            config.MiddleRotor.Id,
            config.RightRotor.Id
        };

        var seen = new HashSet<RotorId>();
        var duplicates = new HashSet<RotorId>();

        foreach (var id in rotorIds)
        {
            if (!seen.Add(id))
            {
                duplicates.Add(id);
            }
        }

        if (duplicates.Count > 0)
        {
            string dupNames = string.Join(", ", duplicates);
            diagnostics.Add(new ConfigDiagnostic(
                ConfigWarningSeverity.Warning,
                "CFG_DUP_ROTOR",
                $"Duplicate rotor model selected ({dupNames}). In physical Enigma machines, each rotor slot requires a unique physical wheel."
            ));
        }

        // Check bounds for positions and ring settings (should be 0..95)
        ValidateRotorBounds("Left Rotor", config.LeftRotor, diagnostics);
        ValidateRotorBounds("Middle Rotor", config.MiddleRotor, diagnostics);
        ValidateRotorBounds("Right Rotor", config.RightRotor, diagnostics);

        bool isValid = diagnostics.TrueForAll(d => d.Severity != ConfigWarningSeverity.Error);
        return new ValidationReport(isValid, diagnostics);
    }

    private static void ValidateRotorBounds(string slotName, RotorConfig rotor, List<ConfigDiagnostic> diagnostics)
    {
        if (rotor.Position < 0 || rotor.Position >= Alphabet.Size)
        {
            diagnostics.Add(new ConfigDiagnostic(
                ConfigWarningSeverity.Warning,
                "CFG_POS_BOUNDS",
                $"{slotName} starting position ({rotor.Position}) exceeds standard [0, 95] boundary and will be wrapped."
            ));
        }

        if (rotor.RingSetting < 0 || rotor.RingSetting >= Alphabet.Size)
        {
            diagnostics.Add(new ConfigDiagnostic(
                ConfigWarningSeverity.Warning,
                "CFG_RING_BOUNDS",
                $"{slotName} ring setting ({rotor.RingSetting}) exceeds standard [0, 95] boundary and will be wrapped."
            ));
        }
    }
}
