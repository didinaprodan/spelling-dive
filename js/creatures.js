// Hand-drawn hologram creatures, PDA style. All face right in a 200x120 box.
// .b = body (tinted fill + bright outline), .l = line, .d = soft detail, .e = glowing eye.

const ART = {
  peeper: `
    <path class="b" d="M48 60 L14 34 Q22 60 14 86 Z"/>
    <path class="b" d="M88 31 Q102 6 124 33 Z"/>
    <path class="b" d="M92 87 Q104 106 118 88 Z"/>
    <path class="b" d="M150 60 C150 38 125 26 98 28 C72 30 52 44 46 60 C52 76 72 90 98 92 C125 94 150 82 150 60 Z"/>
    <path class="l" d="M70 44 Q77 60 70 76"/>
    <circle class="e" cx="124" cy="56" r="17"/>
    <circle cx="129" cy="56" r="8" class="pupil"/>
    <circle cx="132" cy="52" r="2.6" class="e"/>
    <path class="l" d="M147 70 Q141 75 135 72"/>`,

  'rabbit-ray': `
    <path class="b" d="M150 52 C165 40 182 30 196 30 C188 41 171 51 156 57 Z"/>
    <path class="b" d="M150 68 C165 80 182 90 196 90 C188 79 171 69 156 63 Z"/>
    <path class="b" d="M164 60 C150 40 120 18 92 14 C88 34 76 48 50 56 L6 60 L50 64 C76 72 88 86 92 106 C120 102 150 80 164 60 Z"/>
    <path class="l" d="M58 60 L150 60" opacity=".45"/>
    <circle class="d" cx="112" cy="42" r="4.5"/>
    <circle class="d" cx="112" cy="78" r="4.5"/>
    <circle class="d" cx="98" cy="60" r="5.5"/>
    <circle class="e" cx="150" cy="54" r="3.5"/>
    <circle class="e" cx="150" cy="66" r="3.5"/>`,

  stalker: `
    <path class="b" d="M92 45 L112 15 L123 43 Z"/>
    <path class="b" d="M110 77 L96 102 L129 79 Z"/>
    <path class="b" d="M196 62 L160 50 C140 40 110 38 84 44 C60 50 44 56 34 58 L10 36 L20 62 L10 88 L34 68 C48 74 66 80 90 80 C120 80 146 74 160 68 Z"/>
    <path class="l" d="M196 62 L158 60"/>
    <path class="l" d="M160 60 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 4 l4 -4"/>
    <path class="l" d="M137 50 Q133 60 137 70 M129 48 Q125 60 129 72"/>
    <path class="l" d="M64 52 Q60 62 64 72" opacity=".55"/>
    <circle class="e" cx="152" cy="53" r="3.5"/>`,

  'sand-shark': `
    <path class="b" d="M98 29 L112 8 L123 27 Z"/>
    <path class="b" d="M110 91 L99 112 L129 93 Z"/>
    <path class="b" d="M186 50 C182 30 158 22 128 24 C96 26 66 38 50 50 L16 30 L28 60 L16 90 L50 72 C70 86 100 96 132 96 C162 96 184 86 188 70 Z"/>
    <path class="mouth" d="M189 55 L146 64 L189 75 Z"/>
    <path class="l" d="M187 57 l-5 5 l-5 -4 l-5 5 l-5 -4 l-5 5 l-5 -4 l-5 4 M187 73 l-5 -5 l-5 4 l-5 -5 l-5 4 l-5 -5 l-5 4 l-5 -4"/>
    <circle class="d" cx="92" cy="54" r="4"/>
    <circle class="d" cx="108" cy="66" r="3.5"/>
    <circle class="d" cx="80" cy="70" r="3"/>
    <circle class="e" cx="160" cy="38" r="3.2"/>
    <circle class="e" cx="150" cy="33" r="2.6"/>
    <circle class="e" cx="169" cy="44" r="2.6"/>`,

  jellyray: `
    <path class="b" d="M168 60 C164 36 136 16 106 18 C96 34 84 46 64 54 L64 66 C84 74 96 86 106 102 C136 104 164 84 168 60 Z"/>
    <ellipse class="d" cx="128" cy="60" rx="27" ry="18" opacity=".35"/>
    <path class="l" d="M121 26 Q131 60 121 94 M141 30 Q151 60 141 90" opacity=".6"/>
    <path class="l" d="M64 60 C46 57 30 66 6 60"/>
    <circle class="e" cx="50" cy="59" r="3"/>
    <circle class="e" cx="33" cy="63" r="3"/>
    <circle class="e" cx="17" cy="61" r="3"/>
    <circle class="e" cx="158" cy="52" r="3"/>
    <circle class="e" cx="158" cy="68" r="3"/>`,

  crabsnake: `
    <path class="b" d="M10 94 C32 36 80 102 112 58 C128 36 148 30 164 35 L167 50 C150 46 136 52 124 72 C88 122 42 62 24 102 Z"/>
    <path class="l" d="M40 70 l10 8 M62 67 l8 10 M86 76 l6 10 M106 63 l10 6 M132 45 l8 10" opacity=".6"/>
    <ellipse class="b" cx="172" cy="42" rx="14" ry="10"/>
    <path class="l" d="M182 35 Q197 25 195 40 M182 49 Q197 59 195 44"/>
    <circle class="e" cx="176" cy="38" r="2.6"/>`,

  boneshark: `
    <path class="b" d="M104 80 L92 104 L124 82 Z"/>
    <path class="b" d="M190 62 L164 48 C140 36 108 34 80 42 C58 48 42 54 32 58 L8 40 L18 62 L8 84 L32 66 C48 74 70 82 96 82 C126 82 150 76 166 70 Z"/>
    <path class="b" d="M164 48 L178 34 L173 52 Z"/>
    <path class="mouth" d="M191 62 L160 61 L182 73 Z"/>
    <path class="plate" d="M151 46 Q141 30 127 38 M126 40 Q114 26 101 36 M100 38 Q88 27 76 41 M74 44 Q64 34 54 48"/>
    <path class="plate" d="M140 74 Q128 82 116 78 M112 80 Q100 86 88 80" opacity=".7"/>
    <circle class="e" cx="165" cy="56" r="3.2"/>`,

  crabsquid: `
    <path class="l" d="M74 50 C50 40 30 50 10 40 M72 60 C48 58 30 66 8 62 M74 70 C50 80 30 72 12 84"/>
    <path class="l" d="M146 48 C160 38 170 30 178 25 M146 72 C160 82 170 90 178 95"/>
    <path class="b" d="M176 27 C186 14 199 20 195 31 C189 27 183 27 180 33 Z"/>
    <path class="b" d="M176 93 C186 106 199 100 195 89 C189 93 183 93 180 87 Z"/>
    <path class="b" d="M70 60 C70 36 96 22 120 26 C140 30 152 46 152 60 C152 74 140 90 120 94 C96 98 70 84 70 60 Z"/>
    <path class="l" d="M96 34 Q104 60 96 86 M114 30 Q122 60 114 90" opacity=".55"/>
    <circle class="e" cx="139" cy="51" r="4.2"/>
    <circle class="e" cx="139" cy="69" r="4.2"/>`,

  'river-prowler': `
    <path class="b" d="M120 51 L132 33 L141 51 Z"/>
    <path class="b" d="M120 69 L132 87 L141 69 Z"/>
    <path class="b" d="M194 60 L170 52 C140 46 100 48 70 54 C50 57 36 58 24 58 L4 47 L12 60 L4 73 L24 62 C36 62 50 63 70 66 C100 72 140 74 170 68 Z"/>
    <path class="l" d="M60 55 v10 M74 53 v14 M88 51 v18 M102 50 v20 M116 50 v20 M130 50 v20 M144 50 v18 M156 51 v16" opacity=".6"/>
    <path class="l" d="M194 60 L166 62"/>
    <circle class="e" cx="167" cy="56" r="3"/>`,

  reaper: `
    <path class="b" d="M30 56 L16 34 L41 53 Z"/>
    <path class="b" d="M30 66 L16 88 L41 69 Z"/>
    <path class="b" d="M120 76 L105 98 L135 78 Z"/>
    <path class="b" d="M86 75 L71 94 L99 76 Z"/>
    <path class="b" d="M150 50 C122 40 92 42 66 48 C44 53 28 56 14 52 L3 43 L8 61 L3 79 L14 70 C28 66 44 68 66 73 C92 79 122 81 150 70 Z"/>
    <path class="l" d="M137 46 Q133 60 137 74 M123 44 Q119 60 123 76 M109 44 Q105 60 109 76 M95 45 Q91 60 95 75 M81 46 Q77 60 81 74 M67 48 Q63 60 67 72" opacity=".6"/>
    <path class="b" d="M162 45 C166 28 174 17 181 17 C177 26 173 36 171 46 Z"/>
    <path class="b" d="M162 75 C166 92 174 103 181 103 C177 94 173 84 171 74 Z"/>
    <path class="b" d="M148 48 C164 40 180 46 184 60 C180 74 164 80 148 72 Z"/>
    <path class="b" d="M172 46 C182 30 194 24 199 30 C191 32 185 40 181 50 Z"/>
    <path class="b" d="M172 74 C182 90 194 96 199 90 C191 88 185 80 181 70 Z"/>
    <circle class="e" cx="170" cy="57" r="3.2"/>
    <circle class="e" cx="164" cy="63" r="2.2"/>`,
};

const UNKNOWN = `
  <circle class="l" cx="100" cy="60" r="44" opacity=".5"/>
  <circle class="l" cx="100" cy="60" r="28" opacity=".35"/>
  <text x="100" y="74" text-anchor="middle" class="q">?</text>`;

export function creatureSvg(id, color, { locked = false } = {}) {
  const art = ART[id] || UNKNOWN;
  const cls = locked ? 'creature locked' : 'creature';
  return `<svg class="${cls}" viewBox="0 0 200 120" style="--c:${color}" aria-hidden="true">${art}</svg>`;
}

export function unknownSvg() {
  return `<svg class="creature unknown" viewBox="0 0 200 120" aria-hidden="true">${UNKNOWN}</svg>`;
}
