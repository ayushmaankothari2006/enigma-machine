using System.Text;
using EnigmaMachine.Core.Engine;
using EnigmaMachine.Core.Export;
using Xunit;

namespace EnigmaMachine.Core.Tests;

public class EnigmaPdfExporterTests
{
    [Fact]
    public void GeneratePdf_ReturnsValidPdf14Document_WithThreePages()
    {
        var config = new EnigmaMachineConfig(
            ReflectorId.A,
            new RotorConfig(RotorId.I, 0, 0, 20),
            new RotorConfig(RotorId.II, 10, 5, 40),
            new RotorConfig(RotorId.III, 95, 95, 80)
        );

        string input = "Sample Plaintext Transmission for PDF Exporter Verification.";
        string output = new EnigmaEngine(config).ProcessText(input).Ciphertext;

        byte[] pdfBytes = EnigmaPdfExporter.GeneratePdf(config, input, output);

        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 500);

        string pdfText = Encoding.ASCII.GetString(pdfBytes);

        // Verify PDF Header & Trailer
        Assert.StartsWith("%PDF-1.4", pdfText);
        Assert.Contains("%%EOF", pdfText);

        // Verify 3 Pages
        Assert.Contains("/Count 3", pdfText);
        Assert.Contains("PAGE 1: MACHINE SPECIFICATIONS", pdfText);
        Assert.Contains("PAGE 2: PLAINTEXT INPUT BUFFER", pdfText);
        Assert.Contains("PAGE 3: CIPHERTEXT OUTPUT BUFFER", pdfText);
        Assert.Contains("MODERN 96-CHARACTER INVOLUTORY CIPHER ENGINE", pdfText);
    }
}
