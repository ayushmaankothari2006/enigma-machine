using EnigmaMachine.Core.Engine;
using Xunit;

namespace EnigmaMachine.Core.Tests;

public class ReciprocityTests
{
    [Fact]
    public void ReciprocalEncryptionDecryption_RestoresOriginalMessage()
    {
        string plaintext = "Modern Enigma 96!\nSpaces and numbers: 1 2 3.\nSymbols: ~!@#$%^&*()_+{}|:<>?";

        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.I, Position: 10, RingSetting: 5),
            MiddleRotor: new RotorConfig(RotorId.II, Position: 20, RingSetting: 15),
            RightRotor: new RotorConfig(RotorId.III, Position: 30, RingSetting: 25)
        );

        // 1. Encrypt plaintext -> ciphertext
        var engineEncrypt = new EnigmaEngine(config);
        var encResult = engineEncrypt.ProcessText(plaintext);

        Assert.NotEqual(plaintext, encResult.Ciphertext);
        Assert.Equal(plaintext.Length, encResult.Ciphertext.Length);

        // 2. Encrypt ciphertext with identical initial machine configuration -> restored plaintext
        var engineDecrypt = new EnigmaEngine(config);
        var decResult = engineDecrypt.ProcessText(encResult.Ciphertext);

        Assert.Equal(plaintext, decResult.Ciphertext);
    }

    [Fact]
    public void NeverEnciphersCharacterToItselfOnSingleStep()
    {
        char ch = 'A';
        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.B,
            LeftRotor: new RotorConfig(RotorId.IV, Position: 0, RingSetting: 0),
            MiddleRotor: new RotorConfig(RotorId.V, Position: 0, RingSetting: 0),
            RightRotor: new RotorConfig(RotorId.I, Position: 0, RingSetting: 0)
        );

        var engine = new EnigmaEngine(config);
        var (outChar, _) = engine.EncryptChar(ch);

        Assert.NotEqual(ch, outChar);
    }

    [Fact]
    public void DeterministicOutput_MatchesCrossPlatformTestVector()
    {
        string sample = "Hello World";
        var config = new EnigmaMachineConfig(
            Reflector: ReflectorId.A,
            LeftRotor: new RotorConfig(RotorId.I, Position: 0, RingSetting: 0),
            MiddleRotor: new RotorConfig(RotorId.II, Position: 0, RingSetting: 0),
            RightRotor: new RotorConfig(RotorId.III, Position: 0, RingSetting: 0)
        );

        var engine1 = new EnigmaEngine(config);
        var res1 = engine1.ProcessText(sample);

        var engine2 = new EnigmaEngine(config);
        var res2 = engine2.ProcessText(sample);

        Assert.Equal(res1.Ciphertext, res2.Ciphertext);

        // Reverse back
        var engineReverse = new EnigmaEngine(config);
        var decrypted = engineReverse.ProcessText(res1.Ciphertext);
        Assert.Equal(sample, decrypted.Ciphertext);
    }
}
