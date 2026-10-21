// ===== Shared canvas palette (single source of truth for JS drawing code) =====
// The two brand colors used by all canvas (2D context) rendering, plus the A-line
// particle link blue. CSS mirrors these as custom properties in styles/main.css
// (--accent: #38d6ff; --warm: #ffb45c); canvas code cannot read CSS variables
// cheaply, so the JS side lives HERE.
// If a brand color ever changes, update BOTH this file and styles/main.css.

// Cyan accent #38d6ff — the "system response" color (ink-framework readouts,
// halos, ticks, template strokes).
export const ACCENT = { r: 56, g: 214, b: 255 }

// Warm amber #ffb45c — the "human input" color (user strokes, dwell ring,
// reward bursts).
export const WARM = { r: 255, g: 180, b: 92 }

// Soft link blue #5aaaff — idle particles and their connecting lines (A-line
// hero canvas), kept dimmer than ACCENT on purpose.
export const LINK = { r: 90, g: 170, b: 255 }

// Build an `rgba()` string for one of the constants above.
export const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`

// Linear RGB interpolation between two palette constants, u in [0, 1].
// Returns an [r, g, b] array of rounded integers.
export const mixRgb = (c1, c2, u) => [
  Math.round(c1.r + (c2.r - c1.r) * u),
  Math.round(c1.g + (c2.g - c1.g) * u),
  Math.round(c1.b + (c2.b - c1.b) * u),
]
