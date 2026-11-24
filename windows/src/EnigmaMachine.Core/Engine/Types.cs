using System;
using System.Collections.Generic;

namespace EnigmaMachine.Core.Engine;

public enum RotorId
{
    I,
    II,
    III,
    IV,
    V
}

public enum ReflectorId
{
    A,
    B
}

public enum RotorSlot
{
    Left,
    Middle,
    Right
}

public sealed record RotorDefinition(
    RotorId Id,
    string Name,
    int[] Wiring,
    int[] Inverse,
    int Notch,
    string NotchGlyph
);

public sealed record ReflectorDefinition(
    ReflectorId Id,
    string Name,
    int[] Wiring
);

public sealed record SignalTrace(
    char InChar,
    int InIdx,
    int[] PosBefore,
    int[] PosAfter,
    string PawlAction,
    int Shift3,
    int Shift2,
    int Shift1,
    int R3Fwd,
    int R2Fwd,
    int R1Fwd,
    int RefIdx,
    int R1Bwd,
    int R2Bwd,
    int R3Bwd,
    char OutChar,
    int OutIdx
);

public sealed record StepHistoryItem(
    int StepNum,
    char ChIn,
    int[] PosBefore,
    string PawlAction,
    int[] PosAfter,
    char ChOut
);

public sealed record EncryptResult(
    string Ciphertext,
    int[] FinalPositions,
    SignalTrace? LastTrace,
    IReadOnlyList<StepHistoryItem> History,
    double ElapsedMilliseconds
);

public sealed record RotorConfig(
    RotorId Id,
    int Position,
    int RingSetting,
    int? CustomTurnoverNotch = null
);

public sealed record EnigmaMachineConfig(
    ReflectorId Reflector,
    RotorConfig LeftRotor,
    RotorConfig MiddleRotor,
    RotorConfig RightRotor
);
