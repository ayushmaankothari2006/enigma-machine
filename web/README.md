# Modern Enigma 96 Cryptographic Cipher Engine

[![Tests](https://img.shields.io/badge/Tests-26%20Passed-emerald.svg)](./src/__tests__)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

An interactive, electromechanical simulation of the **Modern Enigma 96** cryptographic cipher engine. Built with an expanded **Modulo-96** alphabet (Space, ASCII 33–126, and Newline), authentic historical 3-rotor double-stepping anomaly mechanics, strictly involutory zero-self-encipherment reflection, and real-time reciprocal decipherment ($E(E(M)) = M$).

---

## Key Features

- **96-Character Involutory Cipher**: Full support for printable ASCII characters (`!` to `~`), Space (index `0`), and Enter/Newline (index `95`).
- **Reciprocal Encipherment ($E(E(M)) = M$)**: Enciphering any ciphertext under the exact same starting machine key recovers the original plaintext identically without switching modes.
- **Strictly Involutory Reflector**: Reflector A pairings guarantee zero self-encipherment ($\text{Ref}(x) \neq x$).
- **Authentic Double-Stepping Pawl Mechanics**: Classical mechanical double-stepping anomaly faithfully reproduced across Slow ($R_1$), Medium ($R_2$), and Fast ($R_3$) rotor bays.
- **Customizable Rotor Bays**: Interactive position stepping, ring offsets, and customizable turnover notches with smooth 5-item popover selection.
- **Claymorphism Design System**: Tactile 3D aesthetic featuring a Royal Blue (`#1D4ED8`), Vibrant Orange (`#F97316`), and Crisp White (`#FFFFFF`) palette, complete with bold Cascadia Mono typography.
- **Instant 3-Page PDF Specification Export**: Dynamically generates and downloads a structured 3-page PDF:
  - **Page 1**: Machine Specifications & Rotor Key Configuration
  - **Page 2**: Plaintext Input Buffer & Metrics
  - **Page 3**: Ciphertext Output Buffer & Scrambled Payload
- **Optimized & Fault-Tolerant**: $O(1)$ constant-time character indexing, dynamic code-splitting (lazy-loaded PDF engine reducing entry bundle to ~27 kB), and global React Error Boundary protection.

---

## Project Structure

```text
enigma-machine/
├── src/
│   ├── __tests__/          # Automated Vitest test suite (26 tests)
│   │   ├── edgeCases.test.ts
│   │   ├── enigma.test.ts
│   │   ├── exportPdf.test.ts
│   │   └── useEnigma.test.ts
│   ├── components/         # Modular React UI components
│   │   ├── ErrorBoundary.tsx   # Global crash recovery boundary
│   │   ├── Header.tsx          # Top navigation & PDF export action
│   │   ├── HoldButton.tsx      # Repeat stepper with press-and-hold
│   │   ├── InputCard.tsx       # Plaintext buffer card
│   │   ├── NotchDropdown.tsx   # 5-item rounded turnover notch selector
│   │   ├── OutputCard.tsx      # Ciphertext buffer & decipher action
│   │   ├── SettingsCard.tsx    # 3-rotor electromechanical dashboard
│   │   └── index.ts            # Clean barrel export
│   ├── engine/             # Core cryptographic engine
│   │   ├── alphabet.ts         # Modulo-96 definitions & O(1) math
│   │   ├── enigma.ts           # EnigmaMachine orchestrator & stepping
│   │   ├── presets.ts          # Rotor wirings & reflector configurations
│   │   ├── reflector.ts        # Involutory reflection logic
│   │   ├── rotor.ts            # Bidirectional rotor transformation
│   │   ├── types.ts            # Engine type definitions
│   │   └── index.ts            # Clean barrel export
│   ├── hooks/              # Custom React application hooks
│   │   ├── useEnigma.ts        # Machine state & synchronous re-encryption
│   │   └── index.ts            # Clean barrel export
│   ├── utils/              # Utility services
│   │   ├── exportPdf.ts        # 3-Page jsPDF export generator
│   │   └── index.ts            # Clean barrel export
│   ├── App.tsx             # Root workspace layout
│   ├── index.css           # Claymorphism shadows, pills & styles
│   └── main.tsx            # Application entry point
├── .gitignore              # Ignored build outputs and dependencies
├── index.html              # SEO-optimized HTML5 entry with Schema.org JSON-LD
├── package.json            # Scripts & project dependencies
├── postcss.config.js       # PostCSS plugins
├── tailwind.config.js      # Tailwind CSS theme configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build pipeline & chunk splitting
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Installation
```bash
npm install
```

### Development Server
Start the local Vite development server with hot-module replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Automated Tests
Execute the full Vitest suite (26 tests covering unit mechanics, edge cases, hooks, and PDF export):
```bash
npm test
# or run in single-pass mode:
npx vitest run
```

### Production Build
Compile TypeScript and bundle optimized production assets:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## Cryptographic Alphabet Mapping

| Index | Character / Glyph | Description |
|---|---|---|
| `0` | `' '` | Space |
| `1` – `94` | `ASCII 33..126` | Printable ASCII (`!` through `~`) |
| `95` | `'\n'` | Enter / Line Feed |

---

## License

Distributed for educational and cryptographic research purposes.
