// The game's state and rules: the moth, the motes, the glooms, the combo,
// the levels, the lives. No drawing here — render.js does that.
import { CFG } from './config.js';
import { mulberry32, range } from './random.js';

export class World {
  constructor(seed = 1) {
    this.rng = mulberry32(seed);
    this.time = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.level = 1;
    this.motesCollected = 0;
    this.lives = CFG.lives;
    this.charge = CFG.light.start;
    this.spawnTimer = 0;
    this.shake = 0;
    this.dawnReached = false;
    this.dawnTimer = 0;
    this.player = {
      x: CFG.W / 2, y: CFG.H / 2,
      vx: 0, vy: 0,
      r: CFG.player.radius,
      face: 0, // facing angle, for the wings
    };
    this.motes = [];
    this.glooms = [];
    this.parts = [];  // particles: {x,y,vx,vy,life,maxLife,size,color}
    this.texts = [];  // floating score text: {x,y,life,text,color,size}
    this.dust = [];
    for (let i = 0; i < 70; i++) {
      this.dust.push({
        x: this.rng() * CFG.W, y: this.rng() * CFG.H,
        z: 0.2 + this.rng() * 0.8, s: 0.6 + this.rng() * 1.6,
        tw: this.rng() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 6; i++) this.spawnMote(true);
    for (let i = 0; i < CFG.gloom.startCount; i++) this.spawnGloom(true);
  }

  lightRadius() {
    return CFG.light.baseRadius + this.charge * CFG.light.perCharge;
  }

  gloomTargetCount() {
    return Math.min(
      CFG.gloom.startCount + (this.level - 1) * CFG.gloom.extraPerLevel,
      CFG.gloom.maxCount,
    );
  }

  gloomSpeed() {
    return Math.min(
      CFG.gloom.baseSpeed + (this.level - 1) * CFG.gloom.speedPerLevel,
      CFG.gloom.maxSpeed,
    );
  }

  spawnMote(anywhere = false) {
    if (this.motes.length >= CFG.mote.maxOnField) return;
    const m = 70;
    this.motes.push({
      x: range(this.rng, m, CFG.W - m),
      y: range(this.rng, m + 40, CFG.H - m),
      r: CFG.mote.radius,
      phase: this.rng() * Math.PI * 2,
      hue: this.rng(),
    });
    void anywhere;
  }

  spawnGloom(anywhere = false) {
    const p = this.player;
    let x, y, tries = 0;
    do {
      x = range(this.rng, 40, CFG.W - 40);
      y = range(this.rng, 40, CFG.H - 40);
      tries++;
    } while (!anywhere && Math.hypot(x - p.x, y - p.y) < 320 && tries < 20);
    this.glooms.push({
      x, y,
      vx: 0, vy: 0,
      r: CFG.gloom.radius,
      phase: this.rng() * Math.PI * 2,
      wobble: 0.6 + this.rng() * 0.8,
    });
  }

  burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const s = speed * (0.3 + this.rng() * 0.7);
      this.parts.push({
        x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0, maxLife: 0.4 + this.rng() * 0.5,
        size: 1.5 + this.rng() * 3, color,
      });
    }
  }

  floatText(x, y, text, color, size = 20) {
    this.texts.push({ x, y, life: 0, maxLife: 0.9, text, color, size });
  }

  collectMote(m) {
    this.combo += 1;
    this.comboTimer = CFG.combo.windowSec;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    const mult = Math.min(this.combo, CFG.combo.maxMult);
    const gained = CFG.mote.baseScore * mult;
    this.score += gained;
    this.motesCollected += 1;
    this.charge = Math.min(CFG.light.max, this.charge + CFG.light.moteGain);
    this.burst(m.x, m.y, CFG.palette.amber, 10, 160);
    this.floatText(m.x, m.y - 14, `+${gained}`, mult >= 4 ? CFG.palette.cyan : CFG.palette.amber, 16 + Math.min(mult, 6) * 2);
    if (this.motesCollected % CFG.motesPerLevel === 0) this.levelUp();
    return mult;
  }

  levelUp() {
    this.level += 1;
    this.floatText(this.player.x, this.player.y - 40, `LEVEL ${this.level}`, CFG.palette.cyan, 30);
    this.burst(this.player.x, this.player.y, CFG.palette.cyan, 24, 220);
    if (this.level === CFG.dawnLevel && !this.dawnReached) {
      this.dawnReached = true;
      this.dawnTimer = 3;
      this.floatText(CFG.W / 2, CFG.H / 2 - 60, 'DAWN REACHED', CFG.palette.amberHot, 40);
    }
  }

  hitGloom(g) {
    this.lives -= 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.charge = Math.max(15, this.charge * 0.45);
    this.shake = 14;
    this.burst(this.player.x, this.player.y, CFG.palette.danger, 26, 260);
    this.floatText(this.player.x, this.player.y - 30, 'CAUGHT IN THE DARK', CFG.palette.danger, 22);
    // Shove the gloom away so one touch cannot chain into another.
    const dx = g.x - this.player.x, dy = g.y - this.player.y;
    const d = Math.hypot(dx, dy) || 1;
    g.x = this.player.x + (dx / d) * 260;
    g.y = this.player.y + (dy / d) * 260;
    g.vx = (dx / d) * 300;
    g.vy = (dy / d) * 300;
  }

  update(dt, input) {
    this.time += dt;
    const p = this.player;

    // Steering: keys accelerate; the pointer pulls the moth toward it.
    const ax = input.axis();
    let tx = ax.x * CFG.player.accel;
    let ty = ax.y * CFG.player.accel;
    if (input.mouseX !== null && (ax.x === 0 && ax.y === 0)) {
      const dx = input.mouseX - p.x, dy = input.mouseY - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 8) {
        const pull = Math.min(1, d / 140) * CFG.player.accel;
        tx = (dx / d) * pull;
        ty = (dy / d) * pull;
      }
    }
    p.vx += tx * dt;
    p.vy += ty * dt;
    const drag = Math.pow(CFG.player.drag, dt * 60);
    p.vx *= drag;
    p.vy *= drag;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > CFG.player.maxSpeed) {
      p.vx = (p.vx / sp) * CFG.player.maxSpeed;
      p.vy = (p.vy / sp) * CFG.player.maxSpeed;
    }
    p.x = Math.max(p.r, Math.min(CFG.W - p.r, p.x + p.vx * dt));
    p.y = Math.max(p.r, Math.min(CFG.H - p.r, p.y + p.vy * dt));
    if (sp > 20) p.face = Math.atan2(p.vy, p.vx);

    // The lantern drains; darkness is the real timer.
    this.charge = Math.max(0, this.charge - CFG.light.drainPerSec * dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.dawnTimer > 0) this.dawnTimer -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);

    // Motes drift and bob; collecting one feeds the light.
    this.spawnTimer += dt;
    if (this.spawnTimer >= CFG.mote.spawnEverySec) {
      this.spawnTimer = 0;
      this.spawnMote();
    }
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      m.phase += dt * 2;
      if (Math.hypot(m.x - p.x, m.y - p.y) < p.r + m.r + 4) {
        this.collectMote(m);
        this.motes.splice(i, 1);
      }
    }

    // Glooms hunt the moth but cannot stand in its light — and the light
    // only holds them back while it is charged. A dim lantern holds nothing
    // back: the repulsion scales with charge, and glooms grow bolder in the
    // dark, so standing still with an empty lantern is how the dark wins.
    while (this.glooms.length < this.gloomTargetCount()) this.spawnGloom();
    const lightR = this.lightRadius();
    const chargeFrac = this.charge / CFG.light.max;
    for (const g of this.glooms) {
      const dx = p.x - g.x, dy = p.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = this.gloomSpeed() * (1 + (1 - chargeFrac) * 0.6);
      let fx = (dx / d) * speed;
      let fy = (dy / d) * speed;
      const zone = CFG.gloom.repelRadius + lightR * 0.35;
      if (d < zone) {
        // Inside the glow the gloom is pushed back, harder the closer it is
        // and the brighter the lantern burns.
        const push = CFG.gloom.repelForce * chargeFrac * (1 - d / zone);
        fx -= (dx / d) * push;
        fy -= (dy / d) * push;
      }
      // A slow wobble so their paths never look mechanical.
      g.phase += dt * g.wobble;
      fx += Math.cos(g.phase) * 22;
      fy += Math.sin(g.phase * 1.3) * 22;
      g.vx += (fx - g.vx) * Math.min(1, dt * 2.5);
      g.vy += (fy - g.vy) * Math.min(1, dt * 2.5);
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.x = Math.max(g.r, Math.min(CFG.W - g.r, g.x));
      g.y = Math.max(g.r, Math.min(CFG.H - g.r, g.y));
      if (d < p.r + g.r - 2) this.hitGloom(g);
    }

    // Particles and floating text fade out.
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      q.life += dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 0.98;
      q.vy *= 0.98;
      if (q.life >= q.maxLife) this.parts.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life += dt;
      t.y -= 34 * dt;
      if (t.life >= t.maxLife) this.texts.splice(i, 1);
    }
    for (const d of this.dust) {
      d.tw += dt * 0.7;
      d.y += dt * 4 * d.z;
      if (d.y > CFG.H + 4) { d.y = -4; d.x = this.rng() * CFG.W; }
    }
  }
}
