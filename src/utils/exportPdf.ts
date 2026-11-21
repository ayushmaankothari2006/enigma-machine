import { jsPDF } from 'jspdf';
import { RotorConfig } from '../engine/types';
import { formatGlyph } from '../engine/alphabet';

export interface ExportPdfOptions {
  rotors: {
    left: RotorConfig;
    middle: RotorConfig;
    right: RotorConfig;
  };
  inputText: string;
  outputText: string;
}

export function exportEnigmaPDF({ rotors, inputText, outputText }: ExportPdfOptions, autoSave = true): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  const now = new Date();
  const dateStr = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const addHeader = (pageNumber: number, title: string) => {
    // Header brand background
    doc.setFillColor(29, 78, 216); // Royal Blue #1D4ED8
    doc.rect(margin, margin, contentWidth, 18, 'F');

    // Title text
    doc.setFont('courier', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('ENIGMA 96', margin + 6, margin + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(254, 215, 170); // Warm orange tint
    doc.text('MODERN 96-CHARACTER INVOLUTORY CIPHER ENGINE', margin + 6, margin + 14);

    // Date on right
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(dateStr, pageWidth - margin - 6, margin + 11, { align: 'right' });

    // Section Title Banner
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, margin + 22, contentWidth, 10, 2, 2, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 64, 175); // blue-900
    doc.text(title, margin + 6, margin + 28.5);

    // Page count pill
    doc.setFillColor(234, 88, 12); // Orange #EA580C
    doc.roundedRect(pageWidth - margin - 28, margin + 23.5, 24, 7, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('courier', 'bold');
    doc.text(`PAGE ${pageNumber}/3`, pageWidth - margin - 16, margin + 28, { align: 'center' });
  };

  const addFooter = (pageNumber: number) => {
    const footerY = pageHeight - margin + 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Modern Enigma 96 • Cryptographic Session Document', margin, footerY);
    doc.text(`Page ${pageNumber} of 3`, pageWidth - margin, footerY, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: MACHINE SETTINGS
  // ==========================================
  addHeader(1, 'PAGE 1: MACHINE SPECIFICATIONS & ROTOR KEY');

  let y = margin + 38;

  // Overview box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(219, 234, 254);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(29, 78, 216);
  doc.text('1. CORE ARCHITECTURAL PARAMETERS', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('• Alphabet: Modulo 96 (Space = 0, ASCII 33..126 = 1..94, Newline = 95)', margin + 5, y + 12);
  doc.text('• Involutory Reflector: Reflector A (Fixed, Zero Self-Encipherment: Ref(x) != x)', margin + 5, y + 17);
  doc.text('• Mechanical Stepping: Classical Double-Stepping with Anomaly Prevention', margin + 5, y + 22);

  y += 32;

  // Rotor bays section title
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(29, 78, 216);
  doc.text('2. 3-ROTOR ELECTROMECHANICAL PATHWAY CONFIGURATION', margin, y);

  y += 5;

  const rotorData = [
    {
      slot: 'LEFT ROTOR (R1 • SLOW)',
      badge: 'Step Rate: Turnover from R2',
      config: rotors.left,
    },
    {
      slot: 'MIDDLE ROTOR (R2 • MEDIUM)',
      badge: 'Step Rate: Double-Stepping Anomaly Trigger',
      config: rotors.middle,
    },
    {
      slot: 'RIGHT ROTOR (R3 • FAST)',
      badge: 'Step Rate: Advances on Every Keypress',
      config: rotors.right,
    },
  ];

  rotorData.forEach((item) => {
    const cardHeight = 34;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'FD');

    // Slot banner
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, contentWidth, 8, 3, 3, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 64, 175);
    doc.text(item.slot, margin + 4, y + 5.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(234, 88, 12);
    doc.text(item.badge, pageWidth - margin - 4, y + 5.5, { align: 'right' });

    // 3 Columns inside the card: Position, Ring Offset, Turnover Notch
    const colWidth = contentWidth / 3;
    const col1X = margin + 4;
    const col2X = margin + colWidth + 4;
    const col3X = margin + colWidth * 2 + 4;
    const dataY = y + 14;

    // Col 1: Position
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('STARTING POSITION (P):', col1X, dataY);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatGlyph(item.config.position)} (Index ${item.config.position + 1}/96)`, col1X, dataY + 6);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Raw Zero-based: ${item.config.position}`, col1X, dataY + 11);

    // Col 2: Ring Offset
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('RING OFFSET (R):', col2X, dataY);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Ring: ${item.config.ringSetting + 1} / 96`, col2X, dataY + 6);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Internal Offset: ${item.config.ringSetting}`, col2X, dataY + 11);

    // Col 3: Turnover Notch
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TURNOVER NOTCH (N):', col3X, dataY);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(234, 88, 12);
    doc.text(`${formatGlyph(item.config.turnoverNotch)} (Index ${item.config.turnoverNotch + 1}/96)`, col3X, dataY + 6);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Step Threshold: ${item.config.turnoverNotch}`, col3X, dataY + 11);

    y += cardHeight + 4;
  });

  // Mathematical Reciprocity Guarantee Note
  y += 2;
  doc.setFillColor(255, 247, 237); // orange-50
  doc.setDrawColor(254, 215, 170); // orange-200
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(194, 65, 12);
  doc.text('3. RECIPROCITY & RECOVERY THEOREM (E(E(M)) = M)', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 20, 7);
  const theoremLines = [
    '• Perfect Involutory Symmetry: Because reflector wire pairings are symmetric pairs ((x, y) <=> (y, x))',
    '  and the forward/backward rotor transformations satisfy T_back = T_fwd^(-1), enciphering any ciphertext',
    '  under the exact same initial rotor starting state recovers the original plaintext identically without special mode.',
    '• Stateless Synchronization: Enciphering multi-line buffers starts deterministically from the specified initial key,',
    '  ensuring seamless decipherment across machines configured with identical parameters.',
  ];
  doc.text(theoremLines, margin + 5, y + 12);

  addFooter(1);

  // ==========================================
  // PAGE 2: PLAINTEXT INPUT
  // ==========================================
  doc.addPage();
  addHeader(2, 'PAGE 2: PLAINTEXT INPUT BUFFER');

  let p2Y = margin + 38;

  // Metadata summary card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(219, 234, 254);
  doc.roundedRect(margin, p2Y, contentWidth, 14, 2, 2, 'FD');

  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const lineCount = inputText ? inputText.split('\n').length : 0;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175);
  doc.text(`TOTAL LENGTH: ${charCount} chars   |   WORDS: ${wordCount}   |   LINES: ${lineCount}`, margin + 5, p2Y + 9);

  p2Y += 19;

  // Input text container box
  const textBoxHeight = pageHeight - p2Y - margin - 10;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, p2Y, contentWidth, textBoxHeight, 3, 3, 'FD');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  if (inputText.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.setFont('courier', 'italic');
    doc.text('(Buffer Empty - No plaintext was entered for this session.)', margin + 6, p2Y + 10);
  } else {
    const wrappedInput = doc.splitTextToSize(inputText, contentWidth - 12);
    const maxLines = Math.floor((textBoxHeight - 12) / 4);
    const displayLines = wrappedInput.slice(0, maxLines);
    doc.text(displayLines, margin + 6, p2Y + 7);
    if (wrappedInput.length > maxLines) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text(`[Note: Text truncated to fit page. Total lines: ${wrappedInput.length}, displayed: ${maxLines}]`, margin + 6, p2Y + textBoxHeight - 4);
    }
  }

  addFooter(2);

  // ==========================================
  // PAGE 3: CIPHERTEXT OUTPUT
  // ==========================================
  doc.addPage();
  addHeader(3, 'PAGE 3: CIPHERTEXT OUTPUT BUFFER');

  let p3Y = margin + 38;

  // Metadata summary card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(219, 234, 254);
  doc.roundedRect(margin, p3Y, contentWidth, 14, 2, 2, 'FD');

  const outCharCount = outputText.length;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(234, 88, 12);
  doc.text(`CIPHERTEXT PAYLOAD: ${outCharCount} chars   |   STATUS: SYNCHRONOUS MODULO-96 SCRAMBLED`, margin + 5, p3Y + 9);

  p3Y += 19;

  // Output text container box
  const outBoxHeight = pageHeight - p3Y - margin - 10;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, p3Y, contentWidth, outBoxHeight, 3, 3, 'FD');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  if (outputText.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.setFont('courier', 'italic');
    doc.text('(Buffer Empty - No ciphertext generated.)', margin + 6, p3Y + 10);
  } else {
    const wrappedOutput = doc.splitTextToSize(outputText, contentWidth - 12);
    const maxLines = Math.floor((outBoxHeight - 12) / 4);
    const displayLines = wrappedOutput.slice(0, maxLines);
    doc.text(displayLines, margin + 6, p3Y + 7);
    if (wrappedOutput.length > maxLines) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text(`[Note: Text truncated to fit page. Total lines: ${wrappedOutput.length}, displayed: ${maxLines}]`, margin + 6, p3Y + outBoxHeight - 4);
    }
  }

  addFooter(3);

  // Trigger browser download if autoSave is true
  if (autoSave) {
    const dateStamp = now.toISOString().slice(0, 10);
    doc.save(`enigma96-specification-${dateStamp}.pdf`);
  }

  return doc;
}
