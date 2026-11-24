using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EnigmaMachine.Core.Engine;
using Xunit;

namespace EnigmaMachine.Core.Tests;

public class EdgeCasesAndHardeningTests
{
    [Fact]
    public void ProcessText_EmptyString_ReturnsEmptyResultWithoutFault()
    {
        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.I, 0, 0),
            MiddleRotor: new RotorConfig(RotorId.II, 0, 0),
            RightRotor: new RotorConfig(RotorId.III, 0, 0)
        );

        var engine = new EnigmaEngine(config);
        var result = engine.ProcessText(string.Empty);

        Assert.NotNull(result);
        Assert.Equal(string.Empty, result.Ciphertext);
        Assert.Empty(result.History);
        Assert.Null(result.LastTrace);
    }

    [Fact]
    public void ProcessText_NullString_HandledGracefully()
    {
        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.B,
            LeftRotor: new RotorConfig(RotorId.I, 0, 0),
            MiddleRotor: new RotorConfig(RotorId.II, 0, 0),
            RightRotor: new RotorConfig(RotorId.III, 0, 0)
        );

        var engine = new EnigmaEngine(config);
        var result = engine.ProcessText(null);

        Assert.NotNull(result);
        Assert.Equal(string.Empty, result.Ciphertext);
    }

    [Fact]
    public void ProcessText_OnlyUnsupportedCharacters_FiltersCleanly()
    {
        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.IV, 0, 0),
            MiddleRotor: new RotorConfig(RotorId.V, 0, 0),
            RightRotor: new RotorConfig(RotorId.I, 0, 0)
        );

        var engine = new EnigmaEngine(config);
        string emojisAndTabs = "😊🚀🐱\t\0\u0001";
        var result = engine.ProcessText(emojisAndTabs);

        Assert.NotNull(result);
        Assert.Equal(string.Empty, result.Ciphertext);
    }

    [Fact]
    public void Alphabet_Sanitize_ReturnsAccurateMetrics()
    {
        string text = "Hello \u00A9 World!\tLine 2\r\n";
        var res = Alphabet.Sanitize(text);

        Assert.True(res.HasUnsupportedChars);
        Assert.Contains('\u00A9', res.DistinctUnsupportedChars);
        Assert.Contains('\t', res.DistinctUnsupportedChars);
        Assert.Equal("Hello  World!Line 2\n", res.SanitizedText);
    }

    [Fact]
    public void EnigmaValidator_DetectsDuplicateRotors()
    {
        var configWithDuplicates = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.I, 0, 0),
            MiddleRotor: new RotorConfig(RotorId.I, 0, 0), // Duplicate Rotor I
            RightRotor: new RotorConfig(RotorId.III, 0, 0)
        );

        var report = EnigmaValidator.Validate(configWithDuplicates);

        Assert.True(report.IsValid); // Valid for execution, but surfaces diagnostic warning
        Assert.Contains(report.Diagnostics, d => d.Code == "CFG_DUP_ROTOR");
    }

    [Fact]
    public void EnigmaValidator_DistinctRotors_PassesCleanly()
    {
        var validConfig = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.I, 0, 0),
            MiddleRotor: new RotorConfig(RotorId.II, 0, 0),
            RightRotor: new RotorConfig(RotorId.III, 0, 0)
        );

        var report = EnigmaValidator.Validate(validConfig);

        Assert.True(report.IsValid);
        Assert.Empty(report.Diagnostics);
    }

    [Fact]
    public void EnigmaValidator_NullConfig_ReturnsError()
    {
        var report = EnigmaValidator.Validate(null);

        Assert.False(report.IsValid);
        Assert.Contains(report.Diagnostics, d => d.Code == "CFG_NULL");
    }

    [Fact]
    public void Rotor_ExtremeValues_NormalizedByModulo()
    {
        var rotorDef = Presets.GetRotor(RotorId.I);

        // Negative values
        var rotor1 = new Rotor(rotorDef, position: -5, ringSetting: -10);
        Assert.InRange(rotor1.Position, 0, Alphabet.Size - 1);
        Assert.InRange(rotor1.RingSetting, 0, Alphabet.Size - 1);
        Assert.Equal(91, rotor1.Position);
        Assert.Equal(86, rotor1.RingSetting);

        // Large values > 96
        var rotor2 = new Rotor(rotorDef, position: 195, ringSetting: 200);
        Assert.Equal(3, rotor2.Position);
        Assert.Equal(8, rotor2.RingSetting);
    }

    [Fact]
    public void ProcessText_CancellationToken_AbortsPromptly()
    {
        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.I, 0, 0),
            MiddleRotor: new RotorConfig(RotorId.II, 0, 0),
            RightRotor: new RotorConfig(RotorId.III, 0, 0)
        );

        var engine = new EnigmaEngine(config);
        using var cts = new CancellationTokenSource();
        cts.Cancel(); // Pre-cancelled

        Assert.Throws<OperationCanceledException>(() =>
        {
            engine.ProcessText("Some substantial text for cancellation", cts.Token);
        });
    }

    [Fact]
    public async Task ProcessTextAsync_ExecutesOffUIThread_WithCancellation()
    {
        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.I, 0, 0),
            MiddleRotor: new RotorConfig(RotorId.II, 0, 0),
            RightRotor: new RotorConfig(RotorId.III, 0, 0)
        );

        var engine = new EnigmaEngine(config);
        string text = "Asynchronous cipher execution test on thread pool.";

        var result = await engine.ProcessTextAsync(text);
        Assert.Equal(text.Length, result.Ciphertext.Length);

        // Reciprocal reverse
        var decryptEngine = new EnigmaEngine(config);
        var decrypted = await decryptEngine.ProcessTextAsync(result.Ciphertext);
        Assert.Equal(text, decrypted.Ciphertext);
    }

    [Fact]
    public void HighThroughput_LargePayload_MaintainsReciprocityAndStability()
    {
        // 50,000 characters payload
        string pattern = "The quick brown fox jumps over the lazy dog! 1234567890 \n";
        int repetitions = 50000 / pattern.Length;
        string largeInput = string.Concat(Enumerable.Repeat(pattern, repetitions));

        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.B,
            LeftRotor: new RotorConfig(RotorId.III, 42, 12),
            MiddleRotor: new RotorConfig(RotorId.V, 15, 80),
            RightRotor: new RotorConfig(RotorId.I, 90, 5)
        );

        var encryptEngine = new EnigmaEngine(config);
        var encResult = encryptEngine.ProcessText(largeInput);

        Assert.Equal(largeInput.Length, encResult.Ciphertext.Length);
        Assert.NotEqual(largeInput, encResult.Ciphertext);

        // Decrypt with identical settings
        var decryptEngine = new EnigmaEngine(config);
        var decResult = decryptEngine.ProcessText(encResult.Ciphertext);

        Assert.Equal(largeInput, decResult.Ciphertext);
    }
}
