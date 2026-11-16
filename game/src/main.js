// Lumen Drift — entry point. Owns the canvas, the loop and the screens
// (title / playing / paused / game over), and the deterministic ?shot=
// states the screenshots are taken from. The rules live in world.js, the
// drawing in render.js, the sound in audio.js.
import { CFG } from './config.js';
import { World } from './world.js';
import { draw } from './render.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const BEST_KEY = 'lumen-drift-best';
function loadBest() {
  try { return Number(localStorage.getItem(BEST_KEY) || 0) || 0; } catch { return 0; }
}
function saveBest(score) {
  try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* private mode */ }
}

const input = new Input(canvas);
const sfx = new Sfx();
let best = loadBest();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

let world = new World(seed);
let ui = 'title';
let last = performance.now();

// Deterministic scenes for the screenshots. Each one builds a fixed world
// and renders it once, frozen, so the shot is the same every time it runs.
function buildShot(kind) {
  if (kind === 'start') {
    world = new World(seed);
    ui = 'title';
  } else if (kind === 'play' || kind === 'late') {
    world = new World(seed);
    const late = kind === 'late';
    world.level = late ? 4 : 2;
    world.score = late ? 2140 : 860;
    world.combo = late ? 6 : 3;
    world.comboTimer = 2;
    world.bestCombo = late ? 7 : 4;
    world.motesCollected = late ? 74 : 33;
    world.charge = late ? 58 : 74;
    world.lives = late ? 2 : 3;
    world.time = late ? 96 : 41;
    // A busy, readable mid-game moment: motes ahead, glooms closing in.
    world.motes = [];
    const spots = late
      ? [[300, 200], [520, 150], [760, 260], [980, 180], [420, 430], [660, 500], [900, 430], [1080, 330]]
      : [[360, 240], [560, 180], [820, 300], [980, 220], [480, 460], [700, 520]];
    for (const [x, y] of spots) world.motes.push({ x, y, r: CFG.mote.radius, phase: 0.8, hue: 0.5 });
    world.glooms = [];
    const foes = late
      ? [[240, 300], [1020, 420], [700, 140], [520, 600], [1140, 200]]
      : [[280, 380], [980, 420], [700, 160]];
    for (const [x, y] of foes) world.glooms.push({ x, y, vx: 0, vy: 0, r: CFG.gloom.radius, phase: 1.2, wobble: 0.8 });
    world.player.x = 640;
    world.player.y = 380;
    world.player.face = -0.4;
    world.parts = [];
    world.texts = [{ x: 640, y: 300, life: 0.2, maxLife: 0.9, text: late ? '+60' : '+30', color: CFG.palette.cyan, size: 22 }];
    ui = 'playing';
  } else if (kind === 'end') {
    world = new World(seed);
    world.score = 2480;
    world.level = 4;
    world.motesCollected = 71;
    world.bestCombo = 6;
    world.lives = 0;
    world.charge = 12;
    world.dawnReached = false;
    world.time = 133;
    // A real game over saves the score as the best first, so the shot
    // shows the same: best is never below the run it just ended.
    best = Math.max(best, world.score);
    ui = 'over';
  } else {
    ui = 'title';
  }
  draw(ctx, world, ui, best);
}

function startGame() {
  world = new World((Math.random() * 1e9) | 0);
  ui = 'playing';
  sfx.unlock();
  sfx.click();
}

function toTitle() {
  world = new World((Math.random() * 1e9) | 0);
  ui = 'title';
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (ui === 'title') {
    world.time += dt;
    if (input.clicked || input.anyKey) startGame();
  } else if (ui === 'playing') {
    if (input.has('p') && !frame._pHeld) {
      ui = 'paused';
      frame._pHeld = true;
    } else if (!input.has('p')) {
      frame._pHeld = false;
    }
    if (input.has('m') && !frame._mHeld) {
      sfx.toggleMute();
      frame._mHeld = true;
    } else if (!input.has('m')) {
      frame._mHeld = false;
    }
    const livesBefore = world.lives;
    const levelBefore = world.level;
    world.update(dt, input);
    if (world.level > levelBefore) {
      if (world.level === CFG.dawnLevel) sfx.dawn(); else sfx.levelUp();
    }
    if (world.lives < livesBefore) {
      sfx.hit();
      if (world.lives <= 0) {
        if (world.score > best) { best = world.score; saveBest(best); }
        sfx.gameOver();
        ui = 'over';
      }
    }
  } else if (ui === 'paused') {
    if (input.has('p') && !frame._pHeld) {
      ui = 'playing';
      frame._pHeld = true;
    } else if (!input.has('p')) {
      frame._pHeld = false;
    }
  } else if (ui === 'over') {
    world.time += dt;
    if (input.clicked || input.has('r') || input.has('Enter')) startGame();
  }

  draw(ctx, world, ui, best);
  input.endFrame();
  requestAnimationFrame(frame);
}

if (shot) {
  // Screenshot mode: one frozen frame, drawn at once, no loop needed.
  buildShot(shot);
} else {
  draw(ctx, world, ui, best);
  requestAnimationFrame(frame);
}
