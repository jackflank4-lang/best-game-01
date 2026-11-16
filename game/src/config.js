// Tuning and art direction for Lumen Drift. One place for every number the
// game balances on, so tuning never means hunting through logic files.
export const CFG = {
  W: 1280,
  H: 720,

  player: {
    radius: 16,
    accel: 2600,      // px/s^2 toward the pointer / keys
    maxSpeed: 340,    // px/s
    drag: 0.86,       // velocity kept per 60fps frame
  },

  // The lantern. Charge 0..100; the light radius grows with it, and it drains
  // slowly so the player must keep collecting.
  light: {
    baseRadius: 80,
    perCharge: 1.5,   // extra px of light radius per point of charge
    drainPerSec: 2.0,
    moteGain: 9,
    max: 100,
    start: 70,
  },

  mote: {
    radius: 9,
    baseScore: 10,
    spawnEverySec: 0.85,
    maxOnField: 14,
    bobAmp: 3,
  },

  gloom: {
    radius: 18,
    baseSpeed: 55,
    speedPerLevel: 11,
    maxSpeed: 210,
    repelRadius: 170, // light pushes glooms back inside this range
    repelForce: 420,
    startCount: 3,
    extraPerLevel: 1,
    maxCount: 9,
  },

  combo: {
    windowSec: 2.5,   // time between motes before the combo resets
    maxMult: 8,
  },

  lives: 3,
  motesPerLevel: 20,
  dawnLevel: 5,       // reaching this level is the game's soft "win" moment

  palette: {
    bgDeep: '#05070f',
    bgMid: '#0b1026',
    bgEdge: '#141c3d',
    amber: '#ffc85e',
    amberHot: '#ffe9a8',
    cyan: '#6ee7ff',
    violet: '#b388ff',
    gloomBody: '#191029',
    gloomEye: '#c9a6ff',
    text: '#f4ead2',
    dim: '#8b93b8',
    danger: '#ff6b6b',
  },
};
