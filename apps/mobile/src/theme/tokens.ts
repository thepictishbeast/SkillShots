// Skill Shots design tokens — single source of truth.
//
// SECURITY note: design system has no security implications, but it does have
// trust implications: legible currency, unambiguous CTAs, and visible time
// remaining on every challenge are how we keep the user oriented while real
// money moves.

export const palette = {
  // Backgrounds
  bg0: '#0B0F14',
  bg1: '#11161D',
  bg2: '#1A222C',
  bg3: '#26313D',

  // Text
  text0: '#F5F7FA',
  text1: '#C0C8D2',
  text2: '#7E8794',
  textInverse: '#0B0F14',

  // Accents — high-energy, competitive feel.
  accent: '#FFD23F',
  accentInk: '#0B0F14',
  positive: '#37D399',
  negative: '#FF5577',
  warning: '#FF9F43',
  info: '#5DA9FF',

  // Hairlines & dividers
  border: '#26313D',
  borderStrong: '#3D4A59',
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  s: 6,
  m: 10,
  l: 16,
  pill: 999,
} as const;

export const typo = {
  // Modular scale: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  h1: { fontSize: 28, lineHeight: 32, fontWeight: '800' as const },
  h0: { fontSize: 36, lineHeight: 40, fontWeight: '900' as const },
  display: { fontSize: 48, lineHeight: 52, fontWeight: '900' as const },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const motion = {
  fast: 120,
  base: 220,
  slow: 360,
} as const;
