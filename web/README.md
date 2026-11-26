# Modern Enigma 96 Cryptographic Cipher Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

An interactive, electromechanical simulation of the **Modern Enigma 96** cryptographic cipher engine, paired with **Enigma Drive** for timed multi-device file and clipboard sharing. Built with an expanded **Modulo-96** alphabet (Space, ASCII 33–126, and Newline), authentic 3-rotor double-stepping anomaly mechanics, strictly involutory reflection, and real-time reciprocal decipherment ($E(E(M)) = M$).

---

## Key Features

- **96-Character Involutory Cipher**: Full support for printable ASCII characters (`!` to `~`), Space (index `0`), and Enter/Newline (index `95`).
- **Reciprocal Encipherment ($E(E(M)) = M$)**: Enciphering any ciphertext under the exact same starting machine key recovers the original plaintext identically without switching modes.
- **Strictly Involutory Reflector**: Reflector pairings guarantee zero self-encipherment ($\text{Ref}(x) \neq x$).
- **Authentic Double-Stepping Pawl Mechanics**: Classical mechanical double-stepping anomaly faithfully reproduced across Slow ($R_1$), Medium ($R_2$), and Fast ($R_3$) rotor bays.
- **Customizable Rotor Bays & Pre-Randomization**: Interactive position stepping, ring offsets, and customizable turnover notches with smooth 5-item popover selection.
- **Enigma Drive (Timed Collaboration)**: Token-based ephemeral file sharing and live clipboard board backed by Supabase Edge Functions, Storage, and Realtime.
- **Authentication & Guest Mode**: Email/password sign-in, multi-account switcher, Google OAuth, Cloudflare Turnstile registration protection, and one-click Guest Mode.
- **Instant 3-Page PDF Specification Export**: Dynamically generates and downloads a structured 3-page PDF (`Page 1` settings, `Page 2` input buffer, `Page 3` ciphertext output).

---

## Project Structure

```text
web/
├── public/                 # Static assets (robots.txt)
├── src/
│   ├── __tests__/          # Vitest unit, integration & hardening tests
│   ├── components/
│   │   ├── auth/           # Login, Register, AuthLayout, TurnstileWidget
│   │   ├── drive/          # EnigmaDrive entry, session workspace, controls
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx      # Workspace tabs, PDF export & account menu
│   │   ├── InputCard.tsx
│   │   ├── OutputCard.tsx
│   │   ├── PresetsCard.tsx
│   │   └── SettingsCard.tsx
│   ├── contexts/           # Supabase auth & account switcher context
│   ├── engine/             # Core Modulo-96 Enigma engine
│   ├── hooks/              # Custom hooks (useEnigma, useRotorPresets)
│   ├── lib/                # Supabase client configuration
│   ├── services/           # Drive, Presets & Workspace persistence APIs
│   ├── types/              # Database schema types
│   ├── utils/              # Auth validation & lazy jsPDF export
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example            # Public environment variable template
├── index.html              # SEO metadata, Open Graph & JSON-LD schema
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Environment Setup

Copy `.env.example` to `.env` in `web/` and fill in your public Supabase & Turnstile values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_your_turnstile_site_key
```

---

## Getting Started

```bash
cd web
npm install
npm run dev          # Local development server (http://localhost:5173)
npm test -- --run    # Run full Vitest suite in single-pass mode
npm run build        # Typecheck + production Vite bundle
npm run preview      # Preview built dist/ bundle locally
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
