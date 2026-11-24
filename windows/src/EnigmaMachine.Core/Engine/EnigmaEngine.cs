using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace EnigmaMachine.Core.Engine;

/// <summary>
/// Modern Enigma 96 Cryptographic Engine.
/// 
/// Deterministic 96-character alphabet, 3-rotor stack (Right-to-Left signal pass),
/// authentic mechanical double-stepping pawl anomaly, and involution reflector.
/// Executes completely offline on CPU with zero internet access or external dependencies.
/// </summary>
public sealed class EnigmaEngine
{
    public Rotor R1 { get; } // Left (Slow)
    public Rotor R2 { get; } // Middle (Double-stepping turnover)
    public Rotor R3 { get; } // Right (Fast)
    public Reflector Reflector { get; private set; }

    public EnigmaEngine(EnigmaMachineConfig config)
    {
        ArgumentNullException.ThrowIfNull(config);

        R1 = new Rotor(
            Presets.GetRotor(config.LeftRotor.Id),
            config.LeftRotor.Position,
            config.LeftRotor.RingSetting,
            config.LeftRotor.CustomTurnoverNotch
        );

        R2 = new Rotor(
            Presets.GetRotor(config.MiddleRotor.Id),
            config.MiddleRotor.Position,
            config.MiddleRotor.RingSetting,
            config.MiddleRotor.CustomTurnoverNotch
        );

        R3 = new Rotor(
            Presets.GetRotor(config.RightRotor.Id),
            config.RightRotor.Position,
            config.RightRotor.RingSetting,
            config.RightRotor.CustomTurnoverNotch
        );

        Reflector = new Reflector(Presets.GetReflector(config.Reflector));
    }

    /// <summary>
    /// Computes authentic mechanical pawl stepping before electrical contact.
    /// Accurately simulates the historical double-stepping anomaly:
    /// When the middle rotor (R2) is at its notch, it steps both itself and R1 on the next stroke.
    /// </summary>
    public static (int[] Positions, string PawlAction, bool R2AtNotch, bool R3AtNotch) StepRotors(
        int pos1,
        int pos2,
        int pos3,
        int notch2,
        int notch3)
    {
        bool r2AtNotch = pos2 == notch2;
        bool r3AtNotch = pos3 == notch3;

        int newPos1 = pos1;
        int newPos2 = pos2;
        int newPos3 = (pos3 + 1) % Alphabet.Size;
        string pawlAction = "Normal Fast (R3)";

        if (r2AtNotch)
        {
            newPos1 = (pos1 + 1) % Alphabet.Size;
            newPos2 = (pos2 + 1) % Alphabet.Size;
            pawlAction = "Double-Step Anomaly (R2+R1+R3)";
        }
        else if (r3AtNotch)
        {
            newPos2 = (pos2 + 1) % Alphabet.Size;
            pawlAction = "Middle Turnover (R2+R3)";
        }

        return (new[] { newPos1, newPos2, newPos3 }, pawlAction, r2AtNotch, r3AtNotch);
    }

    /// <summary>
    /// Enciphers a single character through the stepped rotor stack and reflector.
    /// </summary>
    public (char OutChar, SignalTrace? Trace) EncryptChar(char ch, bool recordTrace = false)
    {
        int inIdx = Alphabet.CharToIndex(ch);
        if (inIdx == -1)
        {
            return (ch, null);
        }

        // Capture rotor positions before stepping
        int[] posBefore = { R1.Position, R2.Position, R3.Position };

        // Pawl stepping occurs mechanically BEFORE electrical contact
        var (positions, pawlAction, _, _) = StepRotors(
            R1.Position,
            R2.Position,
            R3.Position,
            R2.TurnoverNotch,
            R3.TurnoverNotch
        );

        R1.Position = positions[0];
        R2.Position = positions[1];
        R3.Position = positions[2];

        int[] posAfter = { R1.Position, R2.Position, R3.Position };

        // Forward electrical pass: Right Rotor (R3) -> Middle Rotor (R2) -> Left Rotor (R1)
        int r3Fwd = R3.Forward(inIdx);
        int r2Fwd = R2.Forward(r3Fwd);
        int r1Fwd = R1.Forward(r2Fwd);

        // Reflector
        int refIdx = Reflector.Reflect(r1Fwd);

        // Backward electrical pass: Left Rotor (R1) -> Middle Rotor (R2) -> Right Rotor (R3)
        int r1Bwd = R1.Backward(refIdx);
        int r2Bwd = R2.Backward(r1Bwd);
        int r3Bwd = R3.Backward(r2Bwd);

        char outChar = Alphabet.IndexToChar(r3Bwd);

        SignalTrace? trace = null;
        if (recordTrace)
        {
            trace = new SignalTrace(
                InChar: ch,
                InIdx: inIdx,
                PosBefore: posBefore,
                PosAfter: posAfter,
                PawlAction: pawlAction,
                Shift3: R3.EffectiveShift,
                Shift2: R2.EffectiveShift,
                Shift1: R1.EffectiveShift,
                R3Fwd: r3Fwd,
                R2Fwd: r2Fwd,
                R1Fwd: r1Fwd,
                RefIdx: refIdx,
                R1Bwd: r1Bwd,
                R2Bwd: r2Bwd,
                R3Bwd: r3Bwd,
                OutChar: outChar,
                OutIdx: r3Bwd
            );
        }

        return (outChar, trace);
    }

    /// <summary>
    /// Synchronously processes an entire text string with cancellation support.
    /// Optimized for memory efficiency and high throughput.
    /// </summary>
    public EncryptResult ProcessText(string? text, CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();

        if (string.IsNullOrEmpty(text))
        {
            return new EncryptResult(
                Ciphertext: string.Empty,
                FinalPositions: new[] { R1.Position, R2.Position, R3.Position },
                LastTrace: null,
                History: Array.Empty<StepHistoryItem>(),
                ElapsedMilliseconds: 0.0
            );
        }

        string sanitized = Alphabet.SanitizeInput(text, out _);
        if (sanitized.Length == 0)
        {
            return new EncryptResult(
                Ciphertext: string.Empty,
                FinalPositions: new[] { R1.Position, R2.Position, R3.Position },
                LastTrace: null,
                History: Array.Empty<StepHistoryItem>(),
                ElapsedMilliseconds: 0.0
            );
        }

        var sb = new StringBuilder(sanitized.Length);
        SignalTrace? lastTrace = null;
        var history = new List<StepHistoryItem>(Math.Min(25, sanitized.Length));

        int len = sanitized.Length;
        for (int i = 0; i < len; i++)
        {
            // Check cancellation periodically to allow instantaneous aborts without per-char overhead
            if ((i & 0x1FF) == 0) // Every 512 characters
            {
                cancellationToken.ThrowIfCancellationRequested();
            }

            char ch = sanitized[i];
            bool shouldRecord = (i == len - 1) || (i < 25);
            var (outChar, trace) = EncryptChar(ch, shouldRecord);
            sb.Append(outChar);

            if (trace != null)
            {
                lastTrace = trace;
                if (history.Count < 25)
                {
                    history.Add(new StepHistoryItem(
                        StepNum: i + 1,
                        ChIn: ch,
                        PosBefore: trace.PosBefore,
                        PawlAction: trace.PawlAction,
                        PosAfter: trace.PosAfter,
                        ChOut: outChar
                    ));
                }
            }
        }

        sw.Stop();

        return new EncryptResult(
            Ciphertext: sb.ToString(),
            FinalPositions: new[] { R1.Position, R2.Position, R3.Position },
            LastTrace: lastTrace,
            History: history,
            ElapsedMilliseconds: sw.Elapsed.TotalMilliseconds
        );
    }

    /// <summary>
    /// Asynchronously processes text on the thread pool to keep the UI dispatcher thread 100% responsive.
    /// </summary>
    public Task<EncryptResult> ProcessTextAsync(string? text, CancellationToken cancellationToken = default)
    {
        return Task.Run(() => ProcessText(text, cancellationToken), cancellationToken);
    }
}
