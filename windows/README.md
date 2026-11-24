# Modern Enigma 96 — Native Windows Desktop Application

A modern, high-performance, hardened, and completely offline native Windows 10/11 desktop application implementing the **Modern Enigma 96 Cryptographic System** using **C#**, **.NET 8**, and **WPF (Windows Presentation Foundation)** with modern **Windows Fluent Design**.

---

## Architecture & Hardening Standards

- **Framework**: .NET 8 (`net8.0-windows`)
- **Technology**: 100% Native WPF with modern Windows Fluent Design styling
- **Zero Heavy Web Wrappers**: Zero Electron, zero WebViews, zero JavaScript runtime overhead. Starts up instantly with minimal CPU and memory footprints.
- **Asynchronous ThreadPool Offloading**: All heavy cryptographic calculations and input sanitizations are offloaded to background threads via `Task.Run` and `CancellationTokenSource`. The UI dispatcher thread remains 100% free for stutter-free, buttery smooth 60Hz to 144Hz+ rendering.
- **Robust Error Handling & Native Feedback**: Includes native Windows **InfoBars** for real-time diagnostic reporting (unsupported symbol sanitization metrics, duplicate rotor model warnings, payload limits, and clipboard locked retry recovery).
- **Zero Compiler Warnings**: All projects compiled with `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
- **100% Offline & Sandboxed**: All cryptographic operations execute strictly on the local CPU with zero internet access, zero network calls, and zero external telemetry.
- **Standalone Binary**: Publishes to a standalone, self-contained single-file `.exe` (or framework-dependent binary) ready for direct distribution or MSIX packaging.

---

## Project Structure

```
windows/
├── EnigmaMachine.sln              # Master Visual Studio solution
├── build.ps1                      # Automated build script
├── test.ps1                       # Automated test suite runner (50 passing tests)
├── publish.ps1                    # Standalone single-file .exe publish script
├── README.md                      # Windows platform documentation
├── artifacts/
│   └── publish/                   # Standalone win-x64 executable output
└── src/
    ├── EnigmaMachine.Core/        # Pure .NET 8 cryptographic engine
    │   ├── Engine/
    │   │   ├── Alphabet.cs        # 96-character alphabet, O(1) mappings, sanitization metrics
    │   │   ├── Mulberry32.cs      # Seeded 32-bit PRNG and Fisher-Yates generator
    │   │   ├── Presets.cs         # Rotors I..V and Reflectors A..B catalogs
    │   │   ├── Rotor.cs           # Rotor pin contacts, effective shift, reversibility
    │   │   ├── Reflector.cs       # Involution reflection with zero fixed points
    │   │   ├── EnigmaEngine.cs    # Pawl stepping, double-step anomaly, async processing
    │   │   ├── EnigmaValidator.cs # Duplicate rotor & configuration diagnostics
    │   │   └── Types.cs           # Enums, configs, and trace telemetry records
    │   └── EnigmaMachine.Core.csproj
    │
    ├── EnigmaMachine.Core.Tests/  # Comprehensive Core xUnit test suite (41 tests)
    │   ├── AlphabetTests.cs       # Alphabet boundaries, CRLF normalization, sanitization
    │   ├── RotorTests.cs          # Reversibility across all positions and rings
    │   ├── ReflectorTests.cs      # Zero fixed points & strict involution verification
    │   ├── SteppingTests.cs       # Authentic double-stepping anomaly test
    │   ├── ReciprocityTests.cs    # End-to-end mathematical reciprocity E(E(M))=M
    │   ├── EdgeCasesAndHardeningTests.cs # Nulls, empty strings, cancellation, 50k payloads
    │   └── EnigmaMachine.Core.Tests.csproj
    │
    ├── EnigmaMachine.Desktop/     # Modern Fluent WPF desktop application
    │   ├── App.xaml / App.xaml.cs # Entry point and merged Fluent resource dictionaries
    │   ├── MainWindow.xaml / .cs  # Modern three-card Fluent interface with InfoBar
    │   ├── Converters/            # SeverityToBackground, SeverityToBorder, BoolToVisibility
    │   ├── Services/              # Hardened ClipboardService with retries & error handling
    │   ├── Themes/                # Windows Fluent color brushes and vector icon styles
    │   ├── ViewModels/            # MVVM architecture (MainViewModel, RotorSlotViewModel)
    │   ├── Resources/app.ico      # High-DPI application icon
    │   └── EnigmaMachine.Desktop.csproj
    │
    └── EnigmaMachine.Desktop.Tests/ # Desktop & ViewModel xUnit test suite (9 tests)
        ├── MainViewModelTests.cs  # Command verification, async cipher dispatch, state
        └── EnigmaMachine.Desktop.Tests.csproj
```

---

## User Interface: Modern Three-Card Fluent Layout

The desktop application implements the modern **Three-Card Layout** following Windows Fluent Design standards:

1. **Card 1: Plaintext Input**
   - Editable multiline text input with full keyboard entry and paste (`Ctrl+V`) support.
   - Live character length counter badge.
   - Quick **Sample** button to load cryptographic test vectors.
   - Quick **Clear** button.
   - Automatic input sanitization warning banner when unsupported characters (e.g. emojis or tabs) are filtered.

2. **Card 2: Ciphertext Output**
   - Read-only multiline output formatted with monospace font (`Cascadia Code` / `Consolas`).
   - Real-time CPU processing telemetry badge (e.g. `0.02 ms CPU`).
   - Live `CALCULATING...` progress badge and indeterminate progress bar during background processing.
   - **One-Click Copy Button** with visual confirmation toast (`Copied!` with checkmark feedback for 2 seconds).
   - **Use as Input Button**: Instantly transfers ciphertext back to plaintext input for immediate verification of reciprocal decryption ($E(E(M)) = M$).

3. **Card 3: Machine Settings**
   - **Reflector Selection**: Reflector A (Seed 606) or Reflector B (Seed 707) with zero fixed points and guaranteed involution.
   - **Three Rotor Columns**: Left (Slow Stepping), Middle (Double-Step Turnover), and Right (Fast Stepping).
   - **Rotor Model Dropdown**: Select between Rotors I, II, III, IV, and V with turnover notch displays.
   - **Starting Position Controls**: Stepper buttons (`+` / `-`) with decimal index and glyph preview (e.g., `33 ('A')`).
   - **Ring Setting / Offset Controls**: Stepper buttons (`+` / `-`) with decimal offset and glyph preview (e.g., `05 ('%')`).
   - **Randomize Button**: Randomly selects distinct physical rotors, starting positions, and ring settings.
   - **Reset Defaults Button**: Restores the machine to factory default configuration.

4. **Native InfoBar Feedback Banner**
   - Dynamically surfaces above the cards with severity-coded colors and dismiss action (`X`):
     - **Warning**: Details unsupported characters filtered from input, or alerts on duplicate rotor selections.
     - **Success**: Confirms clipboard copy operations.
     - **Error**: Reports clipboard lock contention or unexpected faults with user-friendly remediation messages.

---

## Quick Start & Verification

### 1. Build Solution (Zero Warnings)
```powershell
cd windows
.\build.ps1
# Or directly via dotnet CLI:
dotnet build EnigmaMachine.sln -c Release
```

### 2. Run Complete Test Suite (50 Passing Tests)
```powershell
.\test.ps1
# Or directly via dotnet CLI:
dotnet test EnigmaMachine.sln -c Release
```
*(Runs 50 unit tests across Core and Desktop projects covering positive/negative cryptographic scenarios, cancellation, high-throughput 50k payload stress tests, mechanical double-stepping pawl anomalies, and reciprocal decipherment).*

### 3. Publish Standalone Single-File `.exe`
```powershell
.\publish.ps1 -Standalone
```
This produces a self-contained, single-file executable `EnigmaMachine.exe` inside `windows\artifacts\publish\` ready to run on any Windows 10/11 x64 machine.
