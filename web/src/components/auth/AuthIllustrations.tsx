import React from 'react';

export const LoginRotorIllustration: React.FC = () => (
  <svg
    viewBox="0 0 560 300"
    className="w-full max-w-[380px] xl:max-w-[430px] h-auto select-none"
    role="img"
    aria-label="Enigma96 three-rotor glassmorphic cipher mechanism"
  >
    <defs>
      <radialGradient id="rotorAmbientGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.34" />
        <stop offset="65%" stopColor="#dbeafe" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#f4f7fe" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="glassDiscFace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
        <stop offset="55%" stopColor="#eaf1ff" stopOpacity="0.88" />
        <stop offset="100%" stopColor="#c7dafc" stopOpacity="0.82" />
      </linearGradient>

      <linearGradient id="glassRim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fbff" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#dbeafe" stopOpacity="0.78" />
        <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.85" />
      </linearGradient>

      <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
        <stop offset="100%" stopColor="#e2ecff" stopOpacity="0.9" />
      </linearGradient>

      <filter id="softGlassShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#1e3a8a" floodOpacity="0.14" />
      </filter>
    </defs>

    {/* Soft orbital halo */}
    <circle cx="280" cy="162" r="140" fill="url(#rotorAmbientGlow)" />
    <circle cx="280" cy="162" r="126" fill="none" stroke="#93c5fd" strokeOpacity="0.35" strokeWidth="1" />
    <circle cx="280" cy="162" r="144" fill="none" stroke="#bfdbfe" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="4 6" />
    <ellipse cx="280" cy="270" rx="145" ry="18" fill="#bfdbfe" fillOpacity="0.28" />

    {/* Left circuit traces (blue + orange) */}
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 155 128 H 96 L 78 110 H 34" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="28" cy="110" r="3.5" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.6" />

      <path d="M 148 144 H 86 L 68 128 H 42" stroke="#f97316" strokeWidth="1.4" strokeOpacity="0.82" />
      <circle cx="36" cy="128" r="3" fill="#f97316" />

      <path d="M 142 162 H 26" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="20" cy="162" r="3.5" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.6" />

      <path d="M 148 182 H 92 L 74 198 H 50" stroke="#93c5fd" strokeWidth="1.4" />
      <circle cx="44" cy="198" r="3" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.5" />

      <path d="M 156 198 H 104 L 84 218 H 32" stroke="#f97316" strokeWidth="1.4" strokeOpacity="0.82" />
      <circle cx="26" cy="218" r="3.5" fill="#ffffff" stroke="#f97316" strokeWidth="1.6" />
    </g>

    {/* Right circuit traces (blue + orange) */}
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 410 130 H 462 L 480 112 H 524" stroke="#f97316" strokeWidth="1.4" strokeOpacity="0.85" />
      <circle cx="530" cy="112" r="3.5" fill="#ffffff" stroke="#f97316" strokeWidth="1.6" />

      <path d="M 418 148 H 472 L 488 134 H 516" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="522" cy="134" r="3" fill="#60a5fa" />

      <path d="M 424 166 H 532" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="538" cy="166" r="3.5" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.6" />

      <path d="M 418 186 H 468 L 486 204 H 522" stroke="#93c5fd" strokeWidth="1.4" />
      <circle cx="528" cy="204" r="3" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.5" />

      <path d="M 408 202 H 456 L 474 222 H 508" stroke="#f97316" strokeWidth="1.4" strokeOpacity="0.82" />
      <circle cx="514" cy="222" r="3.2" fill="#f97316" />
    </g>

    {/* Right Rotor Disc (Symbols: + - * % @ ! #) */}
    <g filter="url(#softGlassShadow)">
      <ellipse cx="354" cy="162" rx="68" ry="88" fill="url(#glassRim)" stroke="#ffffff" strokeWidth="1.5" />
      <ellipse cx="364" cy="162" rx="66" ry="86" fill="url(#glassDiscFace)" stroke="#dbeafe" strokeWidth="1.5" />
      <ellipse cx="364" cy="162" rx="44" ry="58" fill="none" stroke="#bfdbfe" strokeWidth="1.2" />
      <g fill="#1d4ed8" fontSize="13" fontWeight="600" textAnchor="middle">
        <text x="364" y="96">+</text>
        <text x="387" y="106">-</text>
        <text x="403" y="124">*</text>
        <text x="411" y="148">%</text>
        <text x="412" y="174">@</text>
        <text x="404" y="199">!</text>
        <text x="387" y="218">%</text>
        <text x="364" y="232">#</text>
      </g>
    </g>

    {/* Middle Rotor Disc (Digits: 0 1 3 4 5 6 7 8 9) */}
    <g filter="url(#softGlassShadow)">
      <ellipse cx="272" cy="162" rx="70" ry="90" fill="url(#glassRim)" stroke="#ffffff" strokeWidth="1.5" />
      <ellipse cx="284" cy="162" rx="68" ry="88" fill="url(#glassDiscFace)" stroke="#dbeafe" strokeWidth="1.5" />
      <ellipse cx="284" cy="162" rx="46" ry="60" fill="none" stroke="#93c5fd" strokeOpacity="0.65" strokeWidth="1.2" />
      <g fill="#1e40af" fontSize="13.5" fontWeight="600" textAnchor="middle">
        <text x="284" y="94">0</text>
        <text x="307" y="102">1</text>
        <text x="323" y="119">3</text>
        <text x="331" y="141">4</text>
        <text x="333" y="165">5</text>
        <text x="328" y="189">6</text>
        <text x="317" y="210">7</text>
        <text x="300" y="226">8</text>
        <text x="280" y="235">9</text>
      </g>
    </g>

    {/* Front Rotor Disc (E 96 Hub + Alphabet Ring) */}
    <g filter="url(#softGlassShadow)">
      <ellipse cx="196" cy="162" rx="72" ry="92" fill="url(#glassRim)" stroke="#ffffff" strokeWidth="1.8" />
      <ellipse cx="208" cy="162" rx="70" ry="90" fill="url(#glassDiscFace)" stroke="#ffffff" strokeWidth="2" />
      <ellipse cx="208" cy="162" rx="50" ry="64" fill="none" stroke="#93c5fd" strokeOpacity="0.7" strokeWidth="1.4" />
      <ellipse cx="208" cy="162" rx="34" ry="44" fill="url(#hubGradient)" stroke="#bfdbfe" strokeWidth="1.6" />

      {/* Center E / 96 Hub */}
      <text x="208" y="156" fill="#1e3a8a" fontSize="29" fontWeight="700" textAnchor="middle">
        E
      </text>
      <text x="208" y="184" fill="#1d4ed8" fontSize="22" fontWeight="700" textAnchor="middle">
        96
      </text>

      {/* Alphabet glyphs around front rotor */}
      <g fill="#1e40af" fontSize="12.5" fontWeight="600" textAnchor="middle">
        <text x="192" y="94">A</text>
        <text x="214" y="91">B</text>
        <text x="234" y="98">C</text>
        <text x="250" y="112">D</text>
        <text x="260" y="131">E</text>
        <text x="264" y="154">F</text>
        <text x="262" y="177">G</text>
        <text x="253" y="199">H</text>
        <text x="238" y="218">I</text>
        <text x="218" y="230">J</text>
        <text x="195" y="232">K</text>
        <text x="174" y="224">L</text>
        <text x="158" y="206">M</text>
      </g>
    </g>

    {/* Subtle floating spark dots */}
    <circle cx="385" cy="272" r="3" fill="#60a5fa" fillOpacity="0.55" />
    <circle cx="152" cy="70" r="2.2" fill="#93c5fd" fillOpacity="0.7" />
    <circle cx="424" cy="76" r="2.2" fill="#f97316" fillOpacity="0.55" />
  </svg>
);

export const RegisterSecurityIllustration: React.FC = () => (
  <svg
    viewBox="0 20 540 190"
    className="w-full max-w-[300px] xl:max-w-[340px] h-auto select-none"
    role="img"
    aria-label="Enigma96 isometric security padlock on glass chip"
  >
    <defs>
      <radialGradient id="chipGlow" cx="50%" cy="52%" r="48%">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.34" />
        <stop offset="70%" stopColor="#dbeafe" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#f4f7fe" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="chipTopFace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
        <stop offset="60%" stopColor="#e8f0ff" stopOpacity="0.88" />
        <stop offset="100%" stopColor="#cfe0fe" stopOpacity="0.86" />
      </linearGradient>

      <linearGradient id="chipSideFace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.85" />
      </linearGradient>

      <linearGradient id="lockBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="55%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>

      <filter id="chipShadow" x="-20%" y="-20%" width="140%" height="145%">
        <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#1e3a8a" floodOpacity="0.16" />
      </filter>
    </defs>

    {/* Orbital rings */}
    <ellipse cx="270" cy="128" rx="135" ry="62" fill="url(#chipGlow)" />
    <ellipse cx="270" cy="134" rx="116" ry="52" fill="none" stroke="#93c5fd" strokeOpacity="0.35" strokeWidth="1" />
    <ellipse cx="270" cy="134" rx="142" ry="64" fill="none" stroke="#bfdbfe" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="4 6" />

    {/* Left circuit traces */}
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 180 112 H 104 L 84 94 H 38" stroke="#f97316" strokeWidth="1.4" strokeOpacity="0.85" />
      <circle cx="32" cy="94" r="3.5" fill="#ffffff" stroke="#f97316" strokeWidth="1.6" />

      <path d="M 168 128 H 96 L 78 144 H 28" stroke="#60a5fa" strokeWidth="1.5" />
      <circle cx="22" cy="144" r="3.5" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.6" />

      <path d="M 176 146 H 110 L 90 166 H 46" stroke="#93c5fd" strokeWidth="1.4" />
      <circle cx="40" cy="166" r="3.2" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.5" />

      <path d="M 192 162 H 128 L 106 184 H 66" stroke="#f97316" strokeWidth="1.3" strokeOpacity="0.82" />
      <circle cx="60" cy="184" r="3" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
    </g>

    {/* Right circuit traces */}
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 360 112 H 434 L 454 94 H 496" stroke="#f97316" strokeWidth="1.4" strokeOpacity="0.85" />
      <circle cx="502" cy="94" r="3.5" fill="#f97316" />

      <path d="M 372 128 H 446 L 464 142 H 510" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="516" cy="142" r="3.5" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.6" />

      <path d="M 364 146 H 432 L 450 164 H 498" stroke="#93c5fd" strokeWidth="1.4" />
      <circle cx="504" cy="164" r="3.2" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.5" />

      <path d="M 348 162 H 410 L 430 184 H 468" stroke="#f97316" strokeWidth="1.3" strokeOpacity="0.82" />
      <circle cx="474" cy="184" r="3" fill="#f97316" />
    </g>

    {/* Isometric Glass Chip Base */}
    <g filter="url(#chipShadow)">
      {/* Lower extruded bevel */}
      <path
        d="M 164 128 L 260 178 Q 270 183 280 178 L 376 128 L 376 148 L 280 198 Q 270 203 260 198 L 164 148 Z"
        fill="url(#chipSideFace)"
        stroke="#ffffff"
        strokeWidth="1.2"
      />
      {/* Top glass diamond */}
      <path
        d="M 270 72 L 370 124 Q 380 129 370 135 L 280 182 Q 270 187 260 182 L 170 135 Q 160 129 170 124 L 260 77 Q 270 72 270 72 Z"
        fill="url(#chipTopFace)"
        stroke="#ffffff"
        strokeWidth="1.8"
      />
      {/* Inner recessed ring */}
      <ellipse cx="270" cy="128" rx="64" ry="32" fill="none" stroke="#bfdbfe" strokeWidth="1.2" />
    </g>

    {/* Padlock Shadow */}
    <ellipse cx="270" cy="134" rx="34" ry="12" fill="#1d4ed8" fillOpacity="0.18" />

    {/* 3D Blue Padlock */}
    <g>
      {/* Shackle */}
      <path
        d="M 248 84 V 64 C 248 50 258 40 270 40 C 282 40 292 50 292 64 V 84"
        fill="none"
        stroke="#2563eb"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 248 84 V 64 C 248 50 258 40 270 40 C 282 40 292 50 292 64 V 84"
        fill="none"
        stroke="#60a5fa"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Lock Body */}
      <rect
        x="236"
        y="78"
        width="68"
        height="54"
        rx="14"
        fill="url(#lockBodyGrad)"
        stroke="#93c5fd"
        strokeOpacity="0.65"
        strokeWidth="1.5"
      />
      {/* Specular highlight */}
      <rect x="242" y="83" width="56" height="10" rx="5" fill="#ffffff" fillOpacity="0.18" />
      {/* Keyhole */}
      <circle cx="270" cy="100" r="6" fill="#dbeafe" />
      <path d="M 267 103 L 273 103 L 274 116 L 266 116 Z" fill="#dbeafe" />
    </g>
  </svg>
);
