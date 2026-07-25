/**
 * Pixel sprite library — all sprites drawn as character grids.
 * Legend (used across sprites):
 *  k = outline / ink (#1a1530)
 *  o = gold      (#ffd23f)
 *  O = gold-light (#ffe884)
 *  d = gold-dark (#d99a17)
 *  w = white/cream (#f5ead3)
 *  e = eye white (#ffffff)
 *  p = pupil/ink (#1a1530)
 *  b = body      (#ff9a3c) orange body
 *  B = body-dark (#e07a23)
 *  r = cheek pink (#ff8fb3)
 *  g = grass     (#4f9a4f)
 *  G = grass-light (#6fbf6f)
 *  m = mountain  (#4a5a8c)
 *  M = mountain-snow (#e8eef5)
 *  t = tree      (#2f6b34)
 *  T = tree-dark (#1f4a24)
 *  s = tree-trunk (#6b4a2a)
 *  c = cloud     (#f5ead3)
 *  C = cloud-shadow (#d8c9a6)
 *  y = sun/gold  (#ffd23f)
 *  Y = sun-light (#ffe884)
 *  x = accent pink (#ff5d8f)
 *  P = purple    (#8a6bbf)
 *  v = leaf green (#5fbf5f)
 *  f = fire      (#ff7a1a)
 *  F = fire-light (#ffd23f)
 *  u = ember red (#ff3b3b)
 *  l = log       (#6b4a2a)
 *  L = log-dark  (#4a3318)
 *  q = water     (#6ec6dd)
 *  Q = water-dark (#4a9fb8)
 *  n = star      (#ffe884)
 */

export const PALETTE: Record<string, string> = {
  k: '#1a1530',
  o: '#ffd23f',
  O: '#ffe884',
  d: '#d99a17',
  w: '#f5ead3',
  e: '#ffffff',
  p: '#1a1530',
  b: '#ff9a3c',
  B: '#e07a23',
  r: '#ff8fb3',
  g: '#4f9a4f',
  G: '#6fbf6f',
  m: '#4a5a8c',
  M: '#e8eef5',
  t: '#2f6b34',
  T: '#1f4a24',
  s: '#6b4a2a',
  c: '#f5ead3',
  C: '#d8c9a6',
  y: '#ffd23f',
  Y: '#ffe884',
  x: '#ff5d8f',
  P: '#8a6bbf',
  v: '#5fbf5f',
  f: '#ff7a1a',
  F: '#ffd23f',
  u: '#ff3b3b',
  l: '#6b4a2a',
  L: '#4a3318',
  q: '#6ec6dd',
  Q: '#4a9fb8',
  n: '#ffe884',
  z: '#9bd9e8',
  Z: '#6ec6dd',
};

/* ============================ MASCOT ============================
 * A chubby little coin-creature with a face on a coin body.
 * Base grid 16 wide x 16 tall.
 */
export const MASCOT_BODY: string[] = [
  '    kkkkkkkk    ',
  '   kOOOOOOOOk   ',
  '  kOOOOOOOOOO k ',
  ' kOOOOOOOOOOOO k',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOeekOOOOOOk',
  'kOOOOeekkeOOOOOk',
  'kOOOOeekkeOOOOOk',
  'kOOOOOOOOOOOOOOk',
  'kOOOOwwwwwOOOOOk',
  'kOOOOOwwwwOOOOOk',
  'kOOOOOOOOOOOOOOk',
  ' kOOOOOOOOOOOO k',
  '  kOOOOOOOOOO k ',
  '   kOOOOOOOOk   ',
  '    kkkkkkkk    ',
];

/* Mascot with open happy mouth (jump) */
export const MASCOT_JUMP: string[] = [
  '    kkkkkkkk    ',
  '   kOOOOOOOOk   ',
  '  kOOOOOOOOOO k ',
  ' kOOOOOOOOOOOO k',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOeekOOOOOOk',
  'kOOOOeekkeOOOOOk',
  'kOOOOeekkeOOOOOk',
  'kOOOOOkkkOOOOOOk',
  'kOOOOOkkkOOOOOOk',
  'kOOOOOkkkOOOOOOk',
  'kOOOOOkkkOOOOOOk',
  ' kOOOOOOOOOOOO k',
  '  kOOOOOOOOOO k ',
  '   kOOOOOOOOk   ',
  '    kkkkkkkk    ',
];

/* Mascot winking (wave) */
export const MASCOT_WINK: string[] = [
  '    kkkkkkkk    ',
  '   kOOOOOOOOk   ',
  '  kOOOOOOOOOO k ',
  ' kOOOOOOOOOOOO k',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOeekOOOOOOk',
  'kOOOOOeekOOOOOOk',
  'kOOOOeekkeOOOOOk',
  'kOOOOOOOOOOOOOOk',
  'kOOOOwwwwwOOOOOk',
  'kOOOOOwwwwOOOOOk',
  'kOOOOOOOOOOOOOOk',
  ' kOOOOOOOOOOOO k',
  '  kOOOOOOOOOO k ',
  '   kOOOOOOOOk   ',
  '    kkkkkkkk    ',
];

/* Tiny waving arm (separate sprite, positioned beside mascot) */
export const MASCOT_ARM: string[] = [
  'kkk',
  'kbb',
  'kbb',
  'kbk',
  ' kb',
  ' kb',
];

/* ============================ COIN ============================ */
export const COIN_FRONT: string[] = [
  '  kkkkkkkk  ',
  ' kOOOOOOOO k',
  'kOOOOOOOOOOk',
  'kOOOddOOdOOk',
  'kOOOdOOOOdOk',
  'kOOOOOOOOOOO',
  'kOOOdOOOOdOk',
  'kOOOddOOdOOk',
  'kOOOOOOOOOOk',
  ' kOOOOOOOO k',
  '  kkkkkkkk  ',
];

export const COIN_SIDE: string[] = [
  '  kkkkkk    ',
  ' kddddddk   ',
  'kdddddddk  ',
  'kdddddddk  ',
  'kdddddddk  ',
  'kdddddddk  ',
  'kdddddddk  ',
  'kdddddddk  ',
  ' kddddddk   ',
  '  kkkkkk    ',
];

/* ============================ CLOUD ============================ */
export const CLOUD: string[] = [
  '   ccc     ',
  '  ccCCCcc  ',
  ' ccCCCCCccc',
  'ccCCCCCCCCCc',
  ' cCCCCCCCCc ',
  '  cCCCCCCc  ',
];

/* ============================ MOUNTAIN ============================ */
export const MOUNTAIN: string[] = [
  '       m       ',
  '      mmm      ',
  '     mmmmm     ',
  '    mmmMmm     ',
  '   mmmMMMmm    ',
  '  mmmMMMMMmm   ',
  ' mmmMMMMMMmm   ',
  'mmmmMMMMMMMmm  ',
  'mmmMMMMMMMMMmm ',
  'mmMMMMMMMMMMMmm',
];

/* ============================ TREE ============================ */
export const TREE: string[] = [
  '    TTTT    ',
  '   TTTTTT   ',
  '  TTTTTTTT  ',
  ' TTTTTTTTTT ',
  'TTTTTTTTTTTT',
  ' TTTTTTTTTT ',
  '  TTTTTTTT  ',
  '    sss     ',
  '    sss     ',
];

/* ============================ BUSH ============================ */
export const BUSH: string[] = [
  '  TTTTTT  ',
  ' TTTTTTTT ',
  'TTTTTTTTTT',
  ' TTTTTTTT ',
];

/* ============================ FLOWER ============================ */
export const FLOWER_RED: string[] = [
  ' x x ',
  'xXxXx',
  ' xXx ',
  '  s  ',
  '  s  ',
];
export const FLOWER_RED_PAL: Record<string, string> = {
  x: '#ff5d8f',
  X: '#ffd23f',
  s: '#4f9a4f',
};

export const FLOWER_PURPLE: string[] = [
  ' P P ',
  'PXpXP',
  ' PXP ',
  '  s  ',
  '  s  ',
];
export const FLOWER_PURPLE_PAL: Record<string, string> = {
  P: '#a98fd6',
  X: '#ffd23f',
  p: '#5f4496',
  s: '#4f9a4f',
};

/* ============================ BIRD ============================ */
export const BIRD_A: string[] = [
  '      kk    ',
  '   kkkkkk   ',
  '  kkkkkkkk  ',
  ' kkkkkk     ',
];
export const BIRD_B: string[] = [
  ' kk          ',
  ' kkkkkk      ',
  '  kkkkkkkk   ',
  '      kkkkk  ',
];

/* ============================ STAR ============================ */
export const STAR: string[] = [
  '  n  ',
  '  n  ',
  'nnnnn',
  '  n  ',
  '  n  ',
];

/* ============================ HEART ============================ */
export const HEART: string[] = [
  ' xx xx ',
  'xxxxxxx',
  'xxxxxxx',
  ' xxxxx ',
  '  xxx  ',
  '   x   ',
];

/* ============================ CAMPFIRE ============================ */
export const CAMPFIRE: string[] = [
  '   F   ',
  '  FfF  ',
  ' FfufF ',
  '  fuf  ',
  '   u   ',
  '  lLl  ',
  ' lLlLl ',
  'lLLLLLl',
];

/* ============================ PIXEL GRASS BLADES ============================ */
export const GRASS_TUFT: string[] = [
  ' g g  g ',
  'gGgGggGg',
  'gGggGgGg',
  ' g g gg ',
];

/* ============================ SHROOM ============================ */
export const SHROOM: string[] = [
  '  xxxxx  ',
  ' xxxxxxx ',
  'xxwwxxxxx',
  'xxxxxxxxx',
  ' xxxxxxx ',
  '  wwwww  ',
  '  w   w  ',
  '  w   w  ',
];

/* ============================ ICONS for How To Buy ============================ */
export const ICON_WALLET: string[] = [
  'kkkkkkkkkkk',
  'kqqqqqqqqqk',
  'kqqqqqqqqqk',
  'kqqqkqqkqqk',
  'kqqqkqqkqqk',
  'kqqqqqqqqqk',
  'kqqqqqqqqqk',
  'kkkkkkkkkkk',
];

export const ICON_SOL: string[] = [
  'kkkkkkkkkkk',
  'kqqqqqkqqk ',
  'kqqqqkqqqk ',
  'kqqkqqqqqk ',
  'kqqqqqqqqqk',
  'kqqqqqkqqqk',
  'kqqqqkqqqqk',
  'kkkkkkkkkkk',
];

export const ICON_CONNECT: string[] = [
  'kkkkkkkkkkk',
  'kPPPPPPPPPk',
  'kPPPPPPPPPk',
  'kPPwwwwPPk ',
  'kPPwwwwPPk ',
  'kPPPPPPPPPk',
  'kPPPPPPPPPk',
  'kkkkkkkkkkk',
];

export const ICON_SWAP: string[] = [
  'kkkkkkkkkkk',
  'kqqqkqqqqk ',
  'kqqqkqqqqk ',
  'kqqqkqqqqk ',
  'kqqqqqqqkk ',
  'kqqqqkqqqk ',
  'kqqqqkqqqk ',
  'kkkkkkkkkkk',
];

/* ============================ PIXEL ARROW (down) ============================ */
export const ARROW_DOWN: string[] = [
  '  kk  ',
  '  kk  ',
  '  kk  ',
  ' kkkk ',
  'kkkkkk',
  ' kkkk ',
  '  kk  ',
];

/* ============================ PIXEL CONTROLLER (community) ============================ */
export const CONTROLLER: string[] = [
  '   kkkkkkkkk   ',
  ' kkkkkkkkkkkkk ',
  'kkPPPPPPPPPPPPk',
  'kPPwwwwPPwwPPk',
  'kPPwwwwPPwwPPk',
  'kkPPPPPPPPPPPPk',
  ' kkkkkkkkkkkkk ',
  '   kkkkkkkkk   ',
];
