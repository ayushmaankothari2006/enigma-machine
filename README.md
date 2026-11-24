# Modern Enigma 96 Cryptographic System

An organized, multi-platform cryptographic suite implementing the **Modern Enigma 96 Cryptographic System** across web, native mobile (Android), and native desktop (Windows) platforms.

---

## Repository Architecture

This repository is structured into dedicated, decoupled platform applications sharing an identical 96-character cryptographic specification:

```
enigma-machine/
├── web/        # Standalone Web Application (React, TypeScript, Vite, Tailwind CSS)
├── android/    # Standalone Native Android Application (Kotlin, Jetpack Compose, Material 3)
├── windows/    # Standalone Native Windows Desktop Application (.NET 8, WPF, Fluent Design)
└── README.md   # Multi-platform architecture overview
```

---

## Platform Projects

### 1. Web Application (`/web`)
- **Technology**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Features**: Real-time bidirectional encipherment/decipherment, interactive rotor dashboards, step-by-step cryptographic signal tracing, and audit PDF report export.
- **Quick Start**:
  ```bash
  cd web
  npm install
  npm run dev      # Launch local development server
  npm run build    # Build production bundle
  npm test         # Run Vitest cryptographic test suite (26 passing tests)
  ```
- Detailed documentation: [web/README.md](file:///web/README.md)

### 2. Native Android Application (`/android`)
- **Technology**: 100% Native Kotlin, Jetpack Compose, Material Design 3, MVVM Architecture.
- **Features**: Completely offline and privacy-focused (zero internet permissions declared), modern three-card Material Design layout (Plaintext Input, Ciphertext Output with one-tap copy, and Machine Settings Dashboard), real-time rotor stepping, and reciprocal decipherment.
- **Google Play Store Ready**: Min SDK 26, Target SDK 34, adaptive vector launcher icons, ProGuard/R8 optimization rules, ready to build release APKs and Android App Bundles (AAB).
- **Quick Start**:
  ```bash
  cd android
  ./gradlew test            # Run Android unit test suite
  ./gradlew assembleRelease # Build release APK
  ```
- Detailed documentation: [android/README.md](file:///android/README.md)

### 3. Native Windows Desktop Application (`/windows`)
- **Technology**: C#, .NET 8, 100% Native WPF (Windows Presentation Foundation), Windows Fluent Design, MVVM Architecture.
- **Features**: Real standalone native Windows app (zero web wrappers, zero Electron, zero WebViews), completely offline with CPU-based cryptographic stepping, modern three-card Fluent layout (editable input with character counter and sanitization alerts, monospace output with one-click copy visual confirmation and reciprocal transfer, and full machine settings dashboard for reflector, rotors, positions, and ring offsets).
- **Standalone Binary**: Publishes to a standalone, single-file `.exe` (or MSIX package) ready for direct execution on Windows 10/11 x64.
- **Quick Start**:
  ```powershell
  cd windows
  .\build.ps1               # Build Visual Studio solution
  .\test.ps1                # Run xUnit cryptographic & desktop test suite (50 passing tests)
  .\publish.ps1 -Standalone # Build standalone single-file .exe
  ```
- Detailed documentation: [windows/README.md](file:///windows/README.md)

---

## Cryptographic Specification

All three platforms implement the exact same deterministic 96-character Enigma cipher:

### Alphabet Set (Size: 96)
| Index | Character | Description |
|---|---|---|
| `0` | `' '` | Space (ASCII 32) |
| `1..94` | `'!'` to `'~'` | Printable ASCII characters (ASCII 33 to 126) |
| `95` | `'\n'` | Line Feed / Enter (ASCII 10) |

Input normalization automatically converts `\r\n` (CRLF) and `\r` (CR) to `\n` (LF) and filters characters outside the 96-character set.

### Rotor Catalog
- **Rotor I**: Seed 101, Turnover Notch 33 (`'A'`)
- **Rotor II**: Seed 202, Turnover Notch 65 (`'a'`)
- **Rotor III**: Seed 303, Turnover Notch 16 (`'0'`)
- **Rotor IV**: Seed 404, Turnover Notch 0 (`[Space]`)
- **Rotor V**: Seed 505, Turnover Notch 95 (`[Enter]`)

### Reflector Units
- **Reflector A**: Seed 606 (Involution, zero fixed points)
- **Reflector B**: Seed 707 (Involution, zero fixed points)

### Authentic Double-Stepping Mechanism
Accurately replicates the historical mechanical pawl anomaly: when the middle rotor reaches its notch, it steps both itself and the left rotor on the subsequent keystroke.

### Strict Mathematical Reciprocity
Due to the reflector involution property and reversible rotor wiring:
$$E_k(E_k(M)) = M$$
A ciphertext processed with identical starting rotor models, positions, ring offsets, and turnover notches produces the original plaintext.
