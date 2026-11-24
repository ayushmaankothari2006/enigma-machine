using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using EnigmaMachine.Core.Engine;

namespace EnigmaMachine.Core.Export;

/// <summary>
/// Native zero-dependency 3-page PDF exporter for Enigma 96.
/// Generates standard PDF 1.4 documents matching web/src/utils/exportPdf.ts:
/// - Page 1: Machine Specifications & 3-Rotor Electromechanical Pathway
/// - Page 2: Plaintext Input Buffer
/// - Page 3: Ciphertext Output Buffer
/// </summary>
public static class EnigmaPdfExporter
{
    private const double A4WidthPt = 595.28;  // 210 mm
    private const double A4HeightPt = 841.89; // 297 mm
    private const double MmToPt = 2.83465;

    public static byte[] GeneratePdf(EnigmaMachineConfig config, string inputText, string outputText)
    {
        using var ms = new MemoryStream();
        GeneratePdf(config, inputText, outputText, ms);
        return ms.ToArray();
    }

    public static void GeneratePdf(EnigmaMachineConfig config, string inputText, string outputText, Stream outputStream)
    {
        var builder = new PdfDocumentBuilder();

        // Page 1: Machine Specifications & Key
        string page1Content = BuildPage1(config);
        builder.AddPage(page1Content);

        // Page 2: Plaintext Input Buffer
        string page2Content = BuildPage2(inputText);
        builder.AddPage(page2Content);

        // Page 3: Ciphertext Output Buffer
        string page3Content = BuildPage3(outputText);
        builder.AddPage(page3Content);

        builder.WriteTo(outputStream);
    }

    private static string BuildPage1(EnigmaMachineConfig config)
    {
        var sb = new StringBuilder();
        double margin = 15 * MmToPt;
        double contentWidth = A4WidthPt - (margin * 2);
        string dateStr = DateTime.Now.ToString("MMM d, yyyy, hh:mm:ss tt");

        AddHeader(sb, 1, "PAGE 1: MACHINE SPECIFICATIONS & ROTOR KEY", dateStr);

        double y = A4HeightPt - (margin + (38 * MmToPt));

        // 1. Core Architectural Parameters box
        double box1H = 26 * MmToPt;
        y -= box1H;
        // Background #F8FAFC
        sb.AppendLine($"{0.972:F3} {0.980:F3} {0.988:F3} rg");
        sb.AppendLine($"{0.858:F3} {0.917:F3} {0.996:F3} RG 1 w");
        sb.AppendLine($"{margin:F2} {y:F2} {contentWidth:F2} {box1H:F2} re B");

        // Box 1 Title
        sb.AppendLine("BT /F2 9.5 Tf");
        sb.AppendLine($"{0.113:F3} {0.305:F3} {0.847:F3} rg");
        sb.AppendLine($"1 0 0 1 {(margin + 14):F2} {(y + box1H - 16):F2} Tm");
        sb.AppendLine($"({EscapePdf("1. CORE ARCHITECTURAL PARAMETERS")}) Tj ET");

        // Box 1 Items
        sb.AppendLine("BT /F3 8.5 Tf");
        sb.AppendLine($"{0.200:F3} {0.254:F3} {0.333:F3} rg");
        sb.AppendLine($"1 0 0 1 {(margin + 14):F2} {(y + box1H - 32):F2} Tm");
        sb.AppendLine($"({EscapePdf("* Alphabet: Modulo 96 (Space = 0, ASCII 33..126 = 1..94, Newline = 95)")}) Tj ET");

        sb.AppendLine("BT /F3 8.5 Tf");
        sb.AppendLine($"1 0 0 1 {(margin + 14):F2} {(y + box1H - 46):F2} Tm");
        sb.AppendLine($"({EscapePdf($"* Involutory Reflector: Reflector {config.Reflector} (Zero Self-Encipherment)")}) Tj ET");

        sb.AppendLine("BT /F3 8.5 Tf");
        sb.AppendLine($"1 0 0 1 {(margin + 14):F2} {(y + box1H - 60):F2} Tm");
        sb.AppendLine($"({EscapePdf("* Mechanical Stepping: Classical Double-Stepping with Anomaly Prevention")}) Tj ET");

        // 2. 3-Rotor Pathway Configuration Title
        y -= 26;
        sb.AppendLine("BT /F2 9.5 Tf");
        sb.AppendLine($"{0.113:F3} {0.305:F3} {0.847:F3} rg");
        sb.AppendLine($"1 0 0 1 {margin:F2} {y:F2} Tm");
        sb.AppendLine($"({EscapePdf("2. 3-ROTOR ELECTROMECHANICAL PATHWAY CONFIGURATION")}) Tj ET");

        // 3 Rotor Cards
        var rotors = new[]
        {
            (Slot: "LEFT ROTOR (R1 * SLOW)", Badge: "Step Rate: Turnover from R2", Cfg: config.LeftRotor),
            (Slot: "MIDDLE ROTOR (R2 * MEDIUM)", Badge: "Step Rate: Double-Stepping Anomaly Trigger", Cfg: config.MiddleRotor),
            (Slot: "RIGHT ROTOR (R3 * FAST)", Badge: "Step Rate: Advances on Every Keypress", Cfg: config.RightRotor)
        };

        y -= 12;
        double cardH = 34 * MmToPt;

        foreach (var r in rotors)
        {
            y -= cardH;
            // Card background
            sb.AppendLine("1.0 1.0 1.0 rg 0.796 0.835 0.882 RG 1 w");
            sb.AppendLine($"{margin:F2} {y:F2} {contentWidth:F2} {cardH:F2} re B");

            // Slot banner #EFF6FF
            double bannerH = 8 * MmToPt;
            sb.AppendLine("0.937 0.964 1.0 rg");
            sb.AppendLine($"{margin:F2} {(y + cardH - bannerH):F2} {contentWidth:F2} {bannerH:F2} re f");

            // Title
            sb.AppendLine("BT /F2 8.5 Tf 0.117 0.250 0.686 rg");
            sb.AppendLine($"1 0 0 1 {(margin + 12):F2} {(y + cardH - bannerH + 6):F2} Tm");
            sb.AppendLine($"({EscapePdf(r.Slot)}) Tj ET");

            // Badge
            sb.AppendLine("BT /F3 7.5 Tf 0.917 0.345 0.047 rg");
            sb.AppendLine($"1 0 0 1 {(margin + contentWidth - 190):F2} {(y + cardH - bannerH + 6):F2} Tm");
            sb.AppendLine($"({EscapePdf(r.Badge)}) Tj ET");

            // 3 Columns
            double colW = contentWidth / 3.0;
            double col1X = margin + 12;
            double col2X = margin + colW + 12;
            double col3X = margin + (colW * 2) + 12;
            double dataY = y + cardH - bannerH - 18;

            // Col 1: Position
            sb.AppendLine("BT /F2 8.0 Tf 0.392 0.454 0.545 rg");
            sb.AppendLine($"1 0 0 1 {col1X:F2} {dataY:F2} Tm ({EscapePdf("STARTING POSITION (P):")}) Tj ET");
            sb.AppendLine("BT /F2 10.5 Tf 0.058 0.090 0.164 rg");
            sb.AppendLine($"1 0 0 1 {col1X:F2} {(dataY - 16):F2} Tm ({EscapePdf($"{Alphabet.FormatGlyph(r.Cfg.Position)} (Index {r.Cfg.Position + 1}/96)")}) Tj ET");
            sb.AppendLine("BT /F3 7.5 Tf 0.392 0.454 0.545 rg");
            sb.AppendLine($"1 0 0 1 {col1X:F2} {(dataY - 30):F2} Tm ({EscapePdf($"Raw Zero-based: {r.Cfg.Position}")}) Tj ET");

            // Col 2: Ring Offset
            sb.AppendLine("BT /F2 8.0 Tf 0.392 0.454 0.545 rg");
            sb.AppendLine($"1 0 0 1 {col2X:F2} {dataY:F2} Tm ({EscapePdf("RING OFFSET (R):")}) Tj ET");
            sb.AppendLine("BT /F2 10.5 Tf 0.058 0.090 0.164 rg");
            sb.AppendLine($"1 0 0 1 {col2X:F2} {(dataY - 16):F2} Tm ({EscapePdf($"Ring: {r.Cfg.RingSetting + 1} / 96")}) Tj ET");
            sb.AppendLine("BT /F3 7.5 Tf 0.392 0.454 0.545 rg");
            sb.AppendLine($"1 0 0 1 {col2X:F2} {(dataY - 30):F2} Tm ({EscapePdf($"Internal Offset: {r.Cfg.RingSetting}")}) Tj ET");

            int notch = r.Cfg.CustomTurnoverNotch ?? Presets.GetRotor(r.Cfg.Id).Notch;
            sb.AppendLine("BT /F2 8.0 Tf 0.392 0.454 0.545 rg");
            sb.AppendLine($"1 0 0 1 {col3X:F2} {dataY:F2} Tm ({EscapePdf("TURNOVER NOTCH (N):")}) Tj ET");
            sb.AppendLine("BT /F2 10.5 Tf 0.917 0.345 0.047 rg");
            sb.AppendLine($"1 0 0 1 {col3X:F2} {(dataY - 16):F2} Tm ({EscapePdf($"{Alphabet.FormatGlyph(notch)} (Index {notch + 1}/96)")}) Tj ET");
            sb.AppendLine("BT /F3 7.5 Tf 0.392 0.454 0.545 rg");
            sb.AppendLine($"1 0 0 1 {col3X:F2} {(dataY - 30):F2} Tm ({EscapePdf($"Step Threshold: {notch}")}) Tj ET");

            y -= 10;
        }

        // 3. Reciprocity Box #FFF7ED
        double box3H = 32 * MmToPt;
        y -= box3H;
        sb.AppendLine("1.0 0.968 0.929 rg 0.996 0.843 0.666 RG 1 w");
        sb.AppendLine($"{margin:F2} {y:F2} {contentWidth:F2} {box3H:F2} re B");

        sb.AppendLine("BT /F2 8.5 Tf 0.760 0.254 0.047 rg");
        sb.AppendLine($"1 0 0 1 {(margin + 12):F2} {(y + box3H - 16):F2} Tm");
        sb.AppendLine($"({EscapePdf("3. RECIPROCITY & RECOVERY THEOREM (E(E(M)) = M)")}) Tj ET");

        sb.AppendLine("BT /F3 7.5 Tf 0.262 0.078 0.027 rg");
        sb.AppendLine($"1 0 0 1 {(margin + 12):F2} {(y + box3H - 32):F2} Tm");
        sb.AppendLine($"({EscapePdf("* Perfect Involutory Symmetry: Reflector wire pairings are symmetric pairs ((x, y) <=> (y, x))")}) Tj ET");

        sb.AppendLine("BT /F3 7.5 Tf");
        sb.AppendLine($"1 0 0 1 {(margin + 12):F2} {(y + box3H - 46):F2} Tm");
        sb.AppendLine($"({EscapePdf("  Forward/backward transformations satisfy T_back = T_fwd^(-1). Feeding ciphertext back yields plaintext.")}) Tj ET");

        sb.AppendLine("BT /F3 7.5 Tf");
        sb.AppendLine($"1 0 0 1 {(margin + 12):F2} {(y + box3H - 60):F2} Tm");
        sb.AppendLine($"({EscapePdf("* Deterministic Stepping: Enciphering starts deterministically from the specified initial key.")}) Tj ET");

        AddFooter(sb, 1);
        return sb.ToString();
    }

    private static string BuildPage2(string inputText)
    {
        var sb = new StringBuilder();
        double margin = 15 * MmToPt;
        double contentWidth = A4WidthPt - (margin * 2);
        string dateStr = DateTime.Now.ToString("MMM d, yyyy, hh:mm:ss tt");

        AddHeader(sb, 2, "PAGE 2: PLAINTEXT INPUT BUFFER", dateStr);

        double y = A4HeightPt - (margin + (38 * MmToPt));

        // Metadata box
        double metaH = 14 * MmToPt;
        y -= metaH;
        sb.AppendLine("0.972 0.980 0.988 rg 0.858 0.917 0.996 RG 1 w");
        sb.AppendLine($"{margin:F2} {y:F2} {contentWidth:F2} {metaH:F2} re B");

        int charCount = inputText.Length;
        int wordCount = string.IsNullOrWhiteSpace(inputText) ? 0 : inputText.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
        int lineCount = string.IsNullOrEmpty(inputText) ? 0 : inputText.Split('\n').Length;

        sb.AppendLine("BT /F2 8.5 Tf 0.117 0.250 0.686 rg");
        sb.AppendLine($"1 0 0 1 {(margin + 12):F2} {(y + (metaH / 2) - 3):F2} Tm");
        sb.AppendLine($"({EscapePdf($"TOTAL LENGTH: {charCount} chars   |   WORDS: {wordCount}   |   LINES: {lineCount}")}) Tj ET");

        // Text box
        y -= 16;
        double textBoxH = y - margin - 20;
        sb.AppendLine("1.0 1.0 1.0 rg 0.796 0.835 0.882 RG 1 w");
        sb.AppendLine($"{margin:F2} {(y - textBoxH):F2} {contentWidth:F2} {textBoxH:F2} re B");

        if (string.IsNullOrEmpty(inputText))
        {
            sb.AppendLine("BT /F1 8.5 Tf 0.580 0.639 0.721 rg");
            sb.AppendLine($"1 0 0 1 {(margin + 14):F2} {(y - 24):F2} Tm");
            sb.AppendLine($"({EscapePdf("(Buffer Empty - No plaintext was entered for this session.)")}) Tj ET");
        }
        else
        {
            RenderWrappedText(sb, inputText, margin + 14, y - 20, contentWidth - 28, textBoxH - 30);
        }

        AddFooter(sb, 2);
        return sb.ToString();
    }

    private static string BuildPage3(string outputText)
    {
        var sb = new StringBuilder();
        double margin = 15 * MmToPt;
        double contentWidth = A4WidthPt - (margin * 2);
        string dateStr = DateTime.Now.ToString("MMM d, yyyy, hh:mm:ss tt");

        AddHeader(sb, 3, "PAGE 3: CIPHERTEXT OUTPUT BUFFER", dateStr);

        double y = A4HeightPt - (margin + (38 * MmToPt));

        // Metadata box
        double metaH = 14 * MmToPt;
        y -= metaH;
        sb.AppendLine("0.972 0.980 0.988 rg 0.858 0.917 0.996 RG 1 w");
        sb.AppendLine($"{margin:F2} {y:F2} {contentWidth:F2} {metaH:F2} re B");

        int charCount = outputText.Length;

        sb.AppendLine("BT /F2 8.5 Tf 0.917 0.345 0.047 rg");
        sb.AppendLine($"1 0 0 1 {(margin + 12):F2} {(y + (metaH / 2) - 3):F2} Tm");
        sb.AppendLine($"({EscapePdf($"CIPHERTEXT PAYLOAD: {charCount} chars   |   STATUS: SYNCHRONOUS MODULO-96 SCRAMBLED")}) Tj ET");

        // Text box
        y -= 16;
        double textBoxH = y - margin - 20;
        sb.AppendLine("1.0 1.0 1.0 rg 0.796 0.835 0.882 RG 1 w");
        sb.AppendLine($"{margin:F2} {(y - textBoxH):F2} {contentWidth:F2} {textBoxH:F2} re B");

        if (string.IsNullOrEmpty(outputText))
        {
            sb.AppendLine("BT /F1 8.5 Tf 0.580 0.639 0.721 rg");
            sb.AppendLine($"1 0 0 1 {(margin + 14):F2} {(y - 24):F2} Tm");
            sb.AppendLine($"({EscapePdf("(Buffer Empty - No ciphertext generated.)")}) Tj ET");
        }
        else
        {
            RenderWrappedText(sb, outputText, margin + 14, y - 20, contentWidth - 28, textBoxH - 30);
        }

        AddFooter(sb, 3);
        return sb.ToString();
    }

    private static void AddHeader(StringBuilder sb, int pageNumber, string title, string dateStr)
    {
        double margin = 15 * MmToPt;
        double contentWidth = A4WidthPt - (margin * 2);
        double topY = A4HeightPt - margin;

        // Royal Blue header box #1D4ED8
        double h1 = 18 * MmToPt;
        sb.AppendLine("0.113 0.305 0.847 rg");
        sb.AppendLine($"{margin:F2} {(topY - h1):F2} {contentWidth:F2} {h1:F2} re f");

        // Brand Text
        sb.AppendLine("BT /F2 15 Tf 1.0 1.0 1.0 rg");
        sb.AppendLine($"1 0 0 1 {(margin + 16):F2} {(topY - 22):F2} Tm");
        sb.AppendLine($"({EscapePdf("ENIGMA 96")}) Tj ET");

        // Subtitle
        sb.AppendLine("BT /F3 8.5 Tf 0.996 0.843 0.666 rg");
        sb.AppendLine($"1 0 0 1 {(margin + 16):F2} {(topY - 38):F2} Tm");
        sb.AppendLine($"({EscapePdf("MODERN 96-CHARACTER INVOLUTORY CIPHER ENGINE")}) Tj ET");

        // Date on right
        sb.AppendLine("BT /F3 8.0 Tf 1.0 1.0 1.0 rg");
        sb.AppendLine($"1 0 0 1 {(A4WidthPt - margin - 160):F2} {(topY - 30):F2} Tm");
        sb.AppendLine($"({EscapePdf(dateStr)}) Tj ET");

        // Section Title Banner #F1F5F9
        double bannerY = topY - h1 - 10;
        double bannerH = 10 * MmToPt;
        sb.AppendLine("0.945 0.961 0.976 rg 0.796 0.835 0.882 RG 1 w");
        sb.AppendLine($"{margin:F2} {(bannerY - bannerH):F2} {contentWidth:F2} {bannerH:F2} re B");

        // Title text
        sb.AppendLine("BT /F2 10.0 Tf 0.117 0.250 0.686 rg");
        sb.AppendLine($"1 0 0 1 {(margin + 14):F2} {(bannerY - bannerH + 9):F2} Tm");
        sb.AppendLine($"({EscapePdf(title)}) Tj ET");

        // Page count pill #EA580C
        double pillW = 24 * MmToPt;
        double pillH = 7 * MmToPt;
        double pillX = A4WidthPt - margin - pillW - 6;
        double pillY = bannerY - bannerH + 4;
        sb.AppendLine("0.917 0.345 0.047 rg");
        sb.AppendLine($"{pillX:F2} {pillY:F2} {pillW:F2} {pillH:F2} re f");

        sb.AppendLine("BT /F2 8.0 Tf 1.0 1.0 1.0 rg");
        sb.AppendLine($"1 0 0 1 {(pillX + 8):F2} {(pillY + 6):F2} Tm");
        sb.AppendLine($"({EscapePdf($"PAGE {pageNumber}/3")}) Tj ET");
    }

    private static void AddFooter(StringBuilder sb, int pageNumber)
    {
        double margin = 15 * MmToPt;
        double footerY = margin + 12;

        // Line #E2E8F0
        sb.AppendLine("0.886 0.910 0.941 RG 0.5 w");
        sb.AppendLine($"{margin:F2} {(footerY + 14):F2} m {(A4WidthPt - margin):F2} {(footerY + 14):F2} l S");

        // Footer Text
        sb.AppendLine("BT /F3 8.0 Tf 0.392 0.454 0.545 rg");
        sb.AppendLine($"1 0 0 1 {margin:F2} {footerY:F2} Tm");
        sb.AppendLine($"({EscapePdf("Modern Enigma 96 * Cryptographic Session Document")}) Tj ET");

        sb.AppendLine("BT /F3 8.0 Tf");
        sb.AppendLine($"1 0 0 1 {(A4WidthPt - margin - 60):F2} {footerY:F2} Tm");
        sb.AppendLine($"({EscapePdf($"Page {pageNumber} of 3")}) Tj ET");
    }

    private static void RenderWrappedText(StringBuilder sb, string text, double startX, double startY, double maxWidth, double maxHeight)
    {
        double lineHeight = 12.0;
        int maxLines = (int)Math.Max(1, Math.Floor(maxHeight / lineHeight));
        int charsPerLine = (int)Math.Max(10, Math.Floor(maxWidth / 5.2)); // ~5.2pt per char for 8.5pt Courier

        var rawLines = text.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
        var wrappedLines = new List<string>();

        foreach (var rLine in rawLines)
        {
            if (rLine.Length <= charsPerLine)
            {
                wrappedLines.Add(rLine);
            }
            else
            {
                int idx = 0;
                while (idx < rLine.Length)
                {
                    int take = Math.Min(charsPerLine, rLine.Length - idx);
                    wrappedLines.Add(rLine.Substring(idx, take));
                    idx += take;
                }
            }
        }

        double curY = startY;
        int linesToPrint = Math.Min(wrappedLines.Count, maxLines);

        for (int i = 0; i < linesToPrint; i++)
        {
            sb.AppendLine("BT /F1 8.5 Tf 0.058 0.090 0.164 rg");
            sb.AppendLine($"1 0 0 1 {startX:F2} {curY:F2} Tm");
            sb.AppendLine($"({EscapePdf(wrappedLines[i])}) Tj ET");
            curY -= lineHeight;
        }

        if (wrappedLines.Count > maxLines)
        {
            sb.AppendLine("BT /F3 7.5 Tf 0.917 0.345 0.047 rg");
            sb.AppendLine($"1 0 0 1 {startX:F2} {(startY - maxHeight + 10):F2} Tm");
            sb.AppendLine($"({EscapePdf($"[Note: Text truncated to fit page. Total lines: {wrappedLines.Count}, displayed: {maxLines}]")}) Tj ET");
        }
    }

    private static string EscapePdf(string s)
    {
        if (string.IsNullOrEmpty(s)) return string.Empty;
        var sb = new StringBuilder();
        foreach (char c in s)
        {
            if (c == '\\') sb.Append("\\\\");
            else if (c == '(') sb.Append("\\(");
            else if (c == ')') sb.Append("\\)");
            else if (c >= 32 && c <= 126) sb.Append(c);
            else sb.Append(' ');
        }
        return sb.ToString();
    }

    private sealed class PdfDocumentBuilder
    {
        private readonly List<string> _pages = new();

        public void AddPage(string streamContent)
        {
            _pages.Add(streamContent);
        }

        public void WriteTo(Stream stream)
        {
            using var writer = new StreamWriter(stream, Encoding.ASCII, 4096, leaveOpen: true);
            var byteOffsets = new List<long>();
            long currentPos = 0;

            void WriteBytes(string s)
            {
                byte[] bytes = Encoding.ASCII.GetBytes(s);
                writer.BaseStream.Write(bytes, 0, bytes.Length);
                currentPos += bytes.Length;
            }

            // Header
            WriteBytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

            // Obj 1: Catalog
            byteOffsets.Add(currentPos);
            WriteBytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

            // We have:
            // 1: Catalog
            // 2: Pages
            // Fonts: 3: Courier, 4: Courier-Bold, 5: Helvetica
            // For each page i (0..2):
            // Page Obj: 6 + (i * 2)
            // Stream Obj: 7 + (i * 2)

            int font1Id = 3;
            int font2Id = 4;
            int font3Id = 5;

            var pageObjIds = new List<int>();
            for (int i = 0; i < _pages.Count; i++)
            {
                pageObjIds.Add(6 + (i * 2));
            }

            // Obj 2: Pages Collection
            byteOffsets.Add(currentPos);
            string kids = string.Join(" ", pageObjIds.ConvertAll(id => $"{id} 0 R"));
            WriteBytes($"2 0 obj\n<< /Type /Pages /Kids [{kids}] /Count {_pages.Count} /MediaBox [0 0 {A4WidthPt:F2} {A4HeightPt:F2}] >>\nendobj\n");

            // Obj 3: Courier (F1)
            byteOffsets.Add(currentPos);
            WriteBytes($"{font1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n");

            // Obj 4: Courier-Bold (F2)
            byteOffsets.Add(currentPos);
            WriteBytes($"{font2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n");

            // Obj 5: Helvetica (F3)
            byteOffsets.Add(currentPos);
            WriteBytes($"{font3Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

            // Page Objects & Content Streams
            for (int i = 0; i < _pages.Count; i++)
            {
                int pageId = pageObjIds[i];
                int contentId = pageId + 1;
                byte[] contentBytes = Encoding.ASCII.GetBytes(_pages[i]);

                // Page Object
                byteOffsets.Add(currentPos);
                WriteBytes($"{pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 {font1Id} 0 R /F2 {font2Id} 0 R /F3 {font3Id} 0 R >> >> /Contents {contentId} 0 R >>\nendobj\n");

                // Content Stream Object
                byteOffsets.Add(currentPos);
                WriteBytes($"{contentId} 0 obj\n<< /Length {contentBytes.Length} >>\nstream\n");
                writer.BaseStream.Write(contentBytes, 0, contentBytes.Length);
                currentPos += contentBytes.Length;
                WriteBytes("\nendstream\nendobj\n");
            }

            // XRef Table
            long xrefPos = currentPos;
            int totalObjs = 1 + byteOffsets.Count;
            WriteBytes($"xref\n0 {totalObjs}\n0000000000 65535 f \n");
            foreach (long offset in byteOffsets)
            {
                WriteBytes($"{offset:D10} 00000 n \n");
            }

            // Trailer
            WriteBytes($"trailer\n<< /Size {totalObjs} /Root 1 0 R >>\nstartxref\n{xrefPos}\n%%EOF\n");
            writer.Flush();
        }
    }
}
