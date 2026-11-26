import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Cloud,
  Cpu,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Info,
  KeyRound,
  Lock,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

export type LandingSection = 'home' | 'faq' | 'about' | 'privacy';

interface LandingPageProps {
  initialSection?: LandingSection;
  isAuthenticated?: boolean;
  onSectionChange?: (section: LandingSection) => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onOpenWorkspace: () => void;
}

const GITHUB_URL = 'https://github.com/ayushmaankothari2006/enigma-machine';
const TOTAL_FRAMES = 145;

function getFrameUrl(index: number): string {
  const clamped = Math.max(1, Math.min(TOTAL_FRAMES, index));
  return `/enigma-frames/frame-${String(clamped).padStart(3, '0')}.jpg`;
}

const NAV_ITEMS: ReadonlyArray<{ id: LandingSection; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'faq', label: 'FAQ' },
  { id: 'about', label: 'About' },
  { id: 'privacy', label: 'Privacy' },
];

const QUICK_STATS = [
  { value: '96', label: 'Characters', detail: 'Full printable ASCII (!–~), Space, & Newline' },
  { value: '3', label: 'Rotors + Reflector', detail: 'Authentic mechanical double-stepping' },
  { value: 'E(E(M)) = M', label: 'Reciprocal', detail: 'Zero-mode-switch reciprocal decryption' },
  { value: '3', label: 'Platforms', detail: 'Web, Native Android, & Native Windows' },
] as const;

const CORE_FEATURES = [
  {
    icon: KeyRound,
    title: 'Full 96-Character Alphabet',
    description:
      'No more A–Z-only limitations. Encrypt passwords, JSON, code snippets, punctuation, and multiline notes without losing a single character.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Reciprocal Engine',
    description:
      'Paste any ciphertext, match the starting rotor positions and ring offsets, and recover your exact original message instantly.',
  },
  {
    icon: Cloud,
    title: 'Cloud Presets & Auto-Restore (Web)',
    description:
      'Sign in with Email or Google to save custom rotor presets and automatically pick up right where you left off across sessions.',
  },
  {
    icon: FileText,
    title: '3-Page PDF Audit Export',
    description:
      'Generate a clean, structured 3-page PDF report containing your machine key configuration, plaintext buffer, and ciphertext output in one click.',
  },
] as const;

const PLATFORMS = [
  {
    icon: Globe,
    title: 'Web Workspace',
    badge: 'Cloud Sync',
    description:
      'Neo-glassmorphic React dashboard with multi-account switching and Supabase cloud sync.',
  },
  {
    icon: Smartphone,
    title: 'Native Android',
    badge: '100% Offline',
    description:
      'Built in Kotlin & Jetpack Compose—100% offline with zero internet permissions.',
  },
  {
    icon: Monitor,
    title: 'Native Windows',
    badge: 'Standalone .exe',
    description:
      'Built in .NET 8 WPF with Fluent Design—standalone .exe, zero web wrappers.',
  },
] as const;

const FAQ_ITEMS = [
  {
    question: '1. What is ENIGMA96 and how does it differ from a classic Enigma machine?',
    answer:
      'Classic Enigma machines only supported 26 uppercase letters (A–Z). ENIGMA96 expands the cipher to a full 96-character alphabet—supporting Space, all printable ASCII characters (! through ~), and Newline/Enter—while preserving authentic 3-rotor double-stepping mechanics and zero-self-encipherment reflection.',
  },
  {
    question: '2. How does reciprocal decryption work?',
    answer:
      'Because ENIGMA96 uses a strictly involutory reflector (E_k(E_k(M)) = M), there is no separate "Decrypt" mode. Simply paste your ciphertext into the input box using the exact same starting rotor models, positions, ring offsets, and turnover notches, and the original plaintext appears automatically.',
  },
  {
    question: '3. Can I decrypt a message on Android or Windows that I encrypted on the Web?',
    answer:
      'Yes. All three platforms (Web, Native Android, and Native Windows) run the exact same deterministic 96-character engine, rotor seeds (I–V), and reflector pairings (A–B). As long as the starting machine settings match, the output is 100% identical everywhere.',
  },
  {
    question: '4. Do I need an account to use ENIGMA96?',
    answer:
      'Web App: Signing in (via Email/Password or Google OAuth) lets you save custom rotor presets and automatically restores your last workspace text and settings when you return. Android & Windows Apps: No account or internet connection is required—they work 100% offline right out of the box.',
  },
  {
    question: '5. Is ENIGMA96 secure for sensitive passwords or top-secret data?',
    answer:
      'ENIGMA96 is a classical electromechanical cipher simulation built for education, cryptography exploration, and deterministic text scrambling. While your Web account and saved presets are protected by Supabase Row-Level Security (RLS), classical Enigma ciphers are not a replacement for modern AES-256-GCM encryption for high-stakes secrets.',
  },
  {
    question: '6. What happens if I switch accounts on the Web app?',
    answer:
      "ENIGMA96 supports multi-account switching. Each account's workspace text and rotor settings are isolated—switching accounts immediately saves your current state and loads the other account's saved workspace.",
  },
  {
    question: '7. Can I export my encrypted messages?',
    answer:
      'Yes. You can copy ciphertext with one tap, swap output back to input for instant verification, or generate a 3-page PDF specification report containing your rotor key configuration, plaintext buffer, and ciphertext payload.',
  },
  {
    question: '8. Is ENIGMA96 free?',
    answer: 'Yes—ENIGMA96 is completely free and open-source across Web, Android, and Windows.',
  },
] as const;

interface StoryBeat {
  id: string;
  range: [number, number];
  eyebrow: string;
  title: string;
  description: string;
  metric?: string;
}

const STORY_BEATS: ReadonlyArray<StoryBeat> = [
  {
    id: 'mechanical',
    range: [0.16, 0.36],
    eyebrow: '01 · MECHANICAL ENGINEERING BREAKDOWN',
    title: 'Three precision rotors. Authentic double-stepping.',
    description:
      'Every keystroke advances the fast rotor, triggers turnover notches on the middle pawl, and drives the slow rotor—reproducing the classical mechanical anomaly with zero-fixed-point reflection.',
    metric: 'Rotors I–V · Reflectors A–B',
  },
  {
    id: 'alphabet96',
    range: [0.38, 0.58],
    eyebrow: '02 · 96-CHARACTER ENCRYPTION TECHNOLOGY',
    title: '96 characters. Zero stripped symbols.',
    description:
      'Encrypt spaces, numbers, punctuation, JSON, source code, and multiline notes. Full printable ASCII (!–~), Space (0), and Newline (95) pass cleanly through every rotor.',
    metric: 'ASCII 32–126 + LF',
  },
  {
    id: 'reciprocal',
    range: [0.6, 0.8],
    eyebrow: '03 · ROTOR MECHANICS & RECIPROCAL ENCRYPTION',
    title: 'E(E(M)) = M. One engine, zero mode switches.',
    description:
      'Because the reflector wiring is strictly involutory, encrypting and decrypting use the exact same path. Match your starting rotor positions and ring offsets to recover plaintext instantly.',
    metric: '100% Deterministic Reciprocity',
  },
  {
    id: 'reassembly',
    range: [0.82, 1.01],
    eyebrow: '04 · REASSEMBLED FOR EVERY PLATFORM',
    title: 'Web cloud sync. Offline mobile and desktop.',
    description:
      'Save custom presets and auto-restore sessions on the Web, or run completely offline on Native Android and Native Windows with identical mathematical output.',
    metric: 'Web · Android · Windows',
  },
];

function computeBeatOpacity(progress: number, [start, end]: [number, number]): number {
  const fade = 0.045;
  if (progress < start - fade || progress > end + fade) return 0;
  if (progress < start) return (progress - (start - fade)) / fade;
  if (progress > end) return Math.max(0, 1 - (progress - end) / fade);
  return 1;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialSection = 'home',
  isAuthenticated = false,
  onSectionChange,
  onNavigateLogin,
  onNavigateRegister,
  onOpenWorkspace,
}) => {
  const [activeSection, setActiveSection] = useState<LandingSection>(initialSection);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [framesLoaded, setFramesLoaded] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Array<HTMLImageElement | null>>([]);
  const targetProgressRef = useRef(0);
  const renderedFrameRef = useRef(1);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const images = imagesRef.current;
    let img = images[frameIndex - 1] ?? null;
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Fall back to nearest already-loaded frame
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const back = images[frameIndex - 1 - offset];
        if (back && back.complete && back.naturalWidth > 0) {
          img = back;
          break;
        }
        const fwd = images[frameIndex - 1 + offset];
        if (fwd && fwd.complete && fwd.naturalWidth > 0) {
          img = fwd;
          break;
        }
      }
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const width = canvas.clientWidth || 1280;
    const height = canvas.clientHeight || 720;
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (targetW - drawW) / 2;
    const dy = (targetH - drawH) / 2;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, dx, dy, drawW, drawH);
  };

  // Preload image sequence progressively on Home section and clean up on unmount
  useEffect(() => {
    if (activeSection !== 'home' || typeof window === 'undefined') return;

    let cancelled = false;
    imagesRef.current = new Array(TOTAL_FRAMES).fill(null);

    const loadFrame = (oneBasedIndex: number) => {
      if (cancelled || imagesRef.current[oneBasedIndex - 1]) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        setFramesLoaded((prev) => prev + 1);
        if (oneBasedIndex === renderedFrameRef.current || oneBasedIndex === 1) {
          drawFrame(renderedFrameRef.current);
        }
      };
      img.onerror = () => {
        // Ignore single-frame load failure; drawFrame falls back to nearest loaded frame
      };
      img.src = getFrameUrl(oneBasedIndex);
      imagesRef.current[oneBasedIndex - 1] = img;
    };

    // Priority pass: load key frames first, then fill remaining frames
    for (let i = 1; i <= TOTAL_FRAMES; i += 10) {
      loadFrame(i);
    }
    loadFrame(TOTAL_FRAMES);

    const restTimer = window.setTimeout(() => {
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        loadFrame(i);
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(restTimer);
      for (const img of imagesRef.current) {
        if (img) {
          img.onload = null;
          img.onerror = null;
        }
      }
      imagesRef.current = [];
    };
  }, [activeSection]);

  // Demand-driven scroll-linked animation loop (sleeps when idle to avoid battery/CPU drain)
  useEffect(() => {
    if (activeSection !== 'home' || typeof window === 'undefined') return;

    let rafId = 0;
    let smoothed = targetProgressRef.current;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = () => {
      rafId = 0;
      const diff = targetProgressRef.current - smoothed;
      if (prefersReducedMotion || Math.abs(diff) < 0.0008) {
        smoothed = targetProgressRef.current;
      } else {
        smoothed += diff * 0.2;
      }

      const frame = Math.max(
        1,
        Math.min(TOTAL_FRAMES, 1 + Math.round(smoothed * (TOTAL_FRAMES - 1)))
      );
      if (frame !== renderedFrameRef.current) {
        renderedFrameRef.current = frame;
        drawFrame(frame);
      }

      if (!prefersReducedMotion && Math.abs(targetProgressRef.current - smoothed) >= 0.0008) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const updateProgressFromScroll = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const scrollable = Math.max(1, stage.offsetHeight - window.innerHeight);
      const raw = -rect.top / scrollable;
      const clamped = Math.max(0, Math.min(1, raw));
      targetProgressRef.current = clamped;
      setScrollProgress(clamped);
      scheduleTick();
    };

    updateProgressFromScroll();
    drawFrame(1);
    window.addEventListener('scroll', updateProgressFromScroll, { passive: true });
    window.addEventListener('resize', updateProgressFromScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateProgressFromScroll);
      window.removeEventListener('resize', updateProgressFromScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [activeSection]);

  const selectSection = (section: LandingSection) => {
    setActiveSection(section);
    onSectionChange?.(section);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToPlatforms = () => {
    if (activeSection !== 'home') {
      setActiveSection('home');
      onSectionChange?.('home');
      requestAnimationFrame(() => {
        document.getElementById('landing-platforms')?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }
    document.getElementById('landing-platforms')?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroOpacity = Math.max(0, Math.min(1, 1 - Math.max(0, scrollProgress - 0.04) / 0.12));

  return (
    <div className="landing-apple min-h-screen bg-[#FFFFFF] text-[#333333] flex flex-col justify-between antialiased selection:bg-[#0071E3] selection:text-white">
      {/* 1. Apple Minimalist Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-xl border-b border-black/[0.08]">
        <nav
          aria-label="Landing navigation"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 md:py-0 md:h-14 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3"
        >
          <button
            type="button"
            onClick={() => selectSection('home')}
            className="order-1 flex items-center gap-2 cursor-pointer text-left shrink-0"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[#0071E3] text-white flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">
              ENIGMA<span className="text-[#0071E3]">96</span>
            </span>
          </button>

          <div className="order-3 md:order-2 w-full md:w-auto flex justify-center">
            <div
              role="tablist"
              aria-label="Landing sections"
              className="inline-flex items-center gap-1 p-1 rounded-[980px] bg-[#F5F5F7] border border-black/[0.06]"
            >
              {NAV_ITEMS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeSection === id}
                  onClick={() => selectSection(id)}
                  className={`px-3.5 py-1 rounded-[980px] text-xs font-medium transition-colors cursor-pointer ${
                    activeSection === id
                      ? 'bg-[#FFFFFF] text-[#1D1D1F] shadow-sm'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="order-2 md:order-3 flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-xs sm:text-sm font-medium text-[#0071E3] hover:underline cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={isAuthenticated ? onOpenWorkspace : onNavigateRegister}
              className="rounded-[980px] bg-[#0071E3] hover:bg-[#0077ED] text-white px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {activeSection === 'home' && (
          <div>
            {/* Fullscreen Sticky Scrollytelling Canvas Sequence */}
            <div ref={stageRef} className="relative h-[460vh] w-full bg-[#F5F5F7]">
              <div className="sticky top-[5.75rem] md:top-14 h-[calc(100vh-5.75rem)] md:h-[calc(100vh-3.5rem)] w-full overflow-hidden flex items-center justify-center">
                {/* 3D Image Sequence Canvas */}
                <canvas
                  ref={canvasRef}
                  aria-label="ENIGMA96 3D mechanical disassembly sequence"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Soft top & bottom gradient veil for crisp legibility */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/75 via-transparent to-white/65"
                />

                {/* Chapter 0: Hero Introduction */}
                <section
                  style={{
                    opacity: heroOpacity,
                    transform: `translateY(${(1 - heroOpacity) * -24}px)`,
                    pointerEvents: heroOpacity > 0.15 ? 'auto' : 'none',
                  }}
                  className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 transition-transform duration-150"
                >
                  <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[980px] bg-white/85 backdrop-blur-md border border-black/[0.08] text-[11px] font-semibold tracking-wider text-[#0071E3] uppercase">
                    96-CHARACTER INVOLUTORY CIPHER ENGINE
                  </span>

                  <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.08]">
                    Classical Enigma Mechanics. Rebuilt for Modern Text.
                  </h1>

                  <p className="text-sm sm:text-lg text-[#333333] leading-relaxed max-w-2xl mx-auto bg-white/70 backdrop-blur-md rounded-[8px] px-4 py-2">
                    Encrypt and decrypt spaces, numbers, symbols, code, and multiline messages in
                    real time—powered by authentic 3-rotor double-stepping and instant reciprocal
                    decryption.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onOpenWorkspace}
                      className="rounded-[980px] bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-3 text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Open Web Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollToPlatforms}
                      className="rounded-[980px] bg-white/90 hover:bg-white text-[#0071E3] border border-[#0071E3]/30 px-6 py-3 text-sm font-medium transition-colors cursor-pointer"
                    >
                      Get Android &amp; Windows Apps
                    </button>
                  </div>

                  <p className="text-xs font-medium text-[#333333]/85 pt-1">
                    Free &amp; Open Source · Cloud Sync on Web · 100% Offline on Mobile &amp; Desktop
                  </p>
                </section>

                {/* Scroll-Linked Story Beat Overlays */}
                {STORY_BEATS.map((beat) => {
                  const opacity = computeBeatOpacity(scrollProgress, beat.range);
                  return (
                    <div
                      key={beat.id}
                      style={{
                        opacity,
                        transform: `translateY(${(1 - opacity) * 18}px)`,
                      }}
                      className="pointer-events-none absolute inset-x-0 bottom-12 sm:bottom-14 z-20 px-4 sm:px-8 flex justify-center"
                    >
                      <div className="max-w-xl w-full rounded-[8px] bg-white/90 backdrop-blur-xl border border-black/[0.08] p-4 sm:p-6 space-y-1.5 sm:space-y-2 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold tracking-wider text-[#0071E3] uppercase">
                            {beat.eyebrow}
                          </span>
                          {beat.metric && (
                            <span className="text-[11px] font-medium text-[#6E6E73]">
                              {beat.metric}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                          {beat.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                          {beat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Minimal Scroll Progress Rail */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-3 py-1 rounded-[980px] bg-white/75 backdrop-blur-md border border-black/[0.06] whitespace-nowrap"
                >
                  <div className="w-24 sm:w-28 h-1 rounded-full bg-black/10 overflow-hidden shrink-0">
                    <div
                      className="h-full bg-[#0071E3] transition-[width] duration-75"
                      style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[#6E6E73] tabular-nums whitespace-nowrap">
                    {framesLoaded > 0 ? 'Scroll to explore' : 'Loading 3D sequence'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Quick Stats / Spec Strip */}
            <section
              aria-label="Specifications"
              className="bg-[#FFFFFF] border-t border-black/[0.06] py-14 sm:py-16"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {QUICK_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[8px] bg-[#F5F5F7] p-5 space-y-1.5"
                  >
                    <div className="text-2xl sm:text-3xl font-semibold text-[#0071E3] tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
                      {stat.label}
                    </div>
                    <p className="text-xs sm:text-sm text-[#333333] leading-snug">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Core Features Grid */}
            <section className="bg-[#F5F5F7] py-16 sm:py-20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight">
                    96-Character Encryption Technology.
                  </h2>
                  <p className="text-sm sm:text-base text-[#333333]">
                    Engineered for modern text, deterministic reciprocity, and clean auditability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {CORE_FEATURES.map(({ icon: Icon, title, description }) => (
                    <div
                      key={title}
                      className="rounded-[8px] bg-[#FFFFFF] p-6 sm:p-7 border border-black/[0.05] flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-[8px] bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
                          {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 5. Cross-Platform Experience ("One Engine. Every Device.") */}
            <section id="landing-platforms" className="bg-[#FFFFFF] py-16 sm:py-20 scroll-mt-16">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight">
                    One Engine. Every Device.
                  </h2>
                  <p className="text-sm sm:text-base text-[#333333]">
                    Identical 96-character cipher math across browser, mobile, and desktop.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLATFORMS.map(({ icon: Icon, title, badge, description }) => (
                    <div
                      key={title}
                      className="rounded-[8px] bg-[#F5F5F7] p-6 flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-10 h-10 rounded-[8px] bg-[#FFFFFF] flex items-center justify-center">
                            <Icon className="w-5 h-5 text-[#0071E3]" />
                          </div>
                          <span className="px-2.5 py-0.5 rounded-[980px] bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold">
                            {badge}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[#1D1D1F]">{title}</h3>
                        <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                          {description}
                        </p>
                      </div>

                      <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-medium text-[#0071E3] hover:underline inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View on GitHub</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. Final Reassembly & Bottom CTA */}
            <section className="bg-[#F5F5F7] py-16 sm:py-20">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-4">
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight">
                  Ready to spin the rotors?
                </h2>
                <p className="text-sm sm:text-base text-[#333333]">
                  Start encrypting on the web in seconds, or download the offline native apps.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenWorkspace}
                    className="rounded-[980px] bg-[#0071E3] hover:bg-[#0077ED] text-white px-7 py-3 text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Launch ENIGMA96</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[980px] bg-[#F5F5F7] text-[11px] font-semibold tracking-wider text-[#0071E3] uppercase">
                <HelpCircle className="w-3.5 h-3.5" />
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h1 className="text-3xl sm:text-5xl font-semibold text-[#1D1D1F] tracking-tight">
                Everything You Need to Know.
              </h1>
              <p className="text-sm sm:text-base text-[#333333] max-w-2xl mx-auto">
                Quick answers about how ENIGMA96 works, cross-platform compatibility, cloud sync,
                and offline privacy.
              </p>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map(({ question, answer }) => (
                <article key={question} className="rounded-[8px] bg-[#F5F5F7] p-6 space-y-2">
                  <h2 className="text-base font-semibold text-[#1D1D1F]">{question}</h2>
                  <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">{answer}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[980px] bg-[#F5F5F7] text-[11px] font-semibold tracking-wider text-[#0071E3] uppercase">
                <Info className="w-3.5 h-3.5" />
                ABOUT ENIGMA96
              </span>
              <h1 className="text-3xl sm:text-5xl font-semibold text-[#1D1D1F] tracking-tight">
                Reimagining a Legend for the Modern Era.
              </h1>
              <p className="text-sm sm:text-base text-[#333333] max-w-2xl mx-auto">
                Why we built a 96-character, cross-platform Enigma cipher engine from the ground up.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="rounded-[8px] bg-[#F5F5F7] p-6 space-y-3">
                <h2 className="text-lg font-semibold text-[#1D1D1F]">
                  1. The Problem That Started It All
                </h2>
                <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                  Traditional Enigma simulators are stuck in the 1940s—restricted to 26 uppercase
                  letters (A–Z). The moment you type a space, a number, a punctuation mark, or press
                  Enter, it either gets stripped out or breaks the cipher.
                </p>
                <p className="text-xs sm:text-sm text-[#1D1D1F] font-medium italic leading-relaxed">
                  What would the Enigma machine look like if it were engineered for modern
                  developers, students, and cryptography enthusiasts today?
                </p>
              </section>

              <section className="rounded-[8px] bg-[#F5F5F7] p-6 space-y-3">
                <h2 className="text-lg font-semibold text-[#1D1D1F]">2. Our Solution</h2>
                <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                  ENIGMA96 keeps the soul of the historical machine—three mechanical rotors,
                  customizable ring offsets, turnover notches, the famous double-stepping anomaly,
                  and a strictly involutory reflector—and expands it to 96 characters (Space, all
                  printable ASCII 33–126, and Newline).
                </p>
                <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                  Whether you are encrypting a multiline note, a JSON snippet, or a secret puzzle,
                  every character is preserved and 100% reciprocally decryptable (E(E(M)) = M).
                </p>
              </section>
            </div>

            <section className="rounded-[8px] bg-[#F5F5F7] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">3. Mission &amp; Principles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-[8px] bg-[#FFFFFF] p-4 space-y-1.5">
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Deterministic Across Every Platform
                  </h3>
                  <p className="text-xs text-[#333333] leading-relaxed">
                    Write a message on Windows, decrypt it on Android, or sync your presets on the
                    Web—the math is identical everywhere.
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FFFFFF] p-4 space-y-1.5">
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">Private by Design</h3>
                  <p className="text-xs text-[#333333] leading-relaxed">
                    All cipher calculations run locally on your device. Native Android and Windows
                    apps require zero internet access, and Web presets enforce strict Row-Level
                    Security.
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FFFFFF] p-4 space-y-1.5">
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">Open &amp; Educational</h3>
                  <p className="text-xs text-[#333333] leading-relaxed">
                    Built with clean, modular TypeScript, Kotlin, and C# so anyone can inspect the
                    code, run the test suites, and learn how rotor cryptography works.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[8px] bg-[#F5F5F7] p-6 space-y-3">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">4. Built With</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-[#333333]">
                <div className="rounded-[8px] bg-[#FFFFFF] p-3.5">
                  <span className="font-semibold text-[#1D1D1F]">Web:</span> React 18, TypeScript,
                  Vite, Tailwind CSS, &amp; Supabase
                </div>
                <div className="rounded-[8px] bg-[#FFFFFF] p-3.5">
                  <span className="font-semibold text-[#1D1D1F]">Android:</span> Native Kotlin,
                  Jetpack Compose, &amp; Material Design 3
                </div>
                <div className="rounded-[8px] bg-[#FFFFFF] p-3.5">
                  <span className="font-semibold text-[#1D1D1F]">Windows:</span> Native C# .NET 8
                  &amp; WPF Fluent Design
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[980px] bg-[#F5F5F7] text-[11px] font-semibold tracking-wider text-[#0071E3] uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                PRIVACY POLICY
              </span>
              <h1 className="text-3xl sm:text-5xl font-semibold text-[#1D1D1F] tracking-tight">
                Private by Design.
              </h1>
              <p className="text-xs font-medium text-[#6E6E73]">
                Last Updated: November 26, 2026
              </p>
            </div>

            <div className="rounded-[8px] bg-[#F5F5F7] p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[#333333] leading-relaxed">
              <section className="space-y-1.5">
                <h2 className="text-base font-semibold text-[#1D1D1F]">1. Introduction</h2>
                <p>
                  ENIGMA96 is committed to protecting your privacy. This Privacy Policy explains what
                  information is processed when you use the ENIGMA96 Web, Android, and Windows
                  applications.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  2. Information We Collect
                </h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong className="text-[#1D1D1F]">Web Authentication:</strong> If you create an
                    account or sign in on the Web app, Supabase Auth processes your email address
                    (and display name/avatar if using Google OAuth) solely to authenticate your
                    session.
                  </li>
                  <li>
                    <strong className="text-[#1D1D1F]">Web Workspace &amp; Presets:</strong> When
                    signed in on the Web app, your saved rotor presets (<code>rotor_presets</code>)
                    and last active workspace state (<code>user_workspace_state</code>) are stored
                    in Supabase Postgres so your settings and text are restored when you return.
                  </li>
                  <li>
                    <strong className="text-[#1D1D1F]">Native Android &amp; Windows Apps:</strong>{' '}
                    Both native apps are 100% offline. They declare zero internet permissions,
                    collect zero personal data, and send zero telemetry or analytics.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  3. How Your Data Is Protected
                </h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong className="text-[#1D1D1F]">Client-Side Ciphering:</strong> All Enigma96
                    encryption, decryption, and PDF report generation happen locally in your browser
                    or on your device&apos;s CPU.
                  </li>
                  <li>
                    <strong className="text-[#1D1D1F]">Row-Level Security (RLS):</strong> On the
                    Web, all database tables enforce strict <code>auth.uid() = user_id</code>{' '}
                    policies—meaning no other user can read, modify, or delete your saved presets or
                    workspace state.
                  </li>
                  <li>
                    <strong className="text-[#1D1D1F]">Encrypted Transport:</strong> All
                    communication between the Web app and Supabase is encrypted over HTTPS.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  4. Third-Party Services (Web Only)
                </h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong className="text-[#1D1D1F]">Supabase:</strong> Handles user
                    authentication and Postgres database storage.
                  </li>
                  <li>
                    <strong className="text-[#1D1D1F]">Vercel:</strong> Hosts the Web application
                    frontend.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  5. Your Control &amp; Rights
                </h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    You can clear your workspace input, delete saved rotor presets, switch accounts,
                    or sign out at any time directly inside the Web app.
                  </li>
                  <li>
                    When you sign out, your local session tokens for that account are removed from
                    browser storage.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-base font-semibold text-[#1D1D1F]">6. Contact</h2>
                <p>
                  If you have any questions about this Privacy Policy, please reach out via our
                  GitHub repository:{' '}
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#0071E3] hover:underline"
                  >
                    github.com/ayushmaankothari2006/enigma-machine
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* 7. Minimalist Apple Footer */}
      <footer className="w-full bg-[#F5F5F7] border-t border-black/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E6E73]">
          <div className="inline-flex items-center gap-2 font-medium tracking-wider text-[#333333]">
            <Lock className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>ENIGMA96 • PRIVATE BY DESIGN</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 font-medium">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
                className="hover:text-[#0071E3] cursor-pointer"
              >
                {label}
              </button>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0071E3] hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
