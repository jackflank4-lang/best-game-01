// Everything the player sees: the cavern, the glow, the moth, the motes,
// the glooms, the particles, the HUD, and the title / game-over screens.
// Canvas 2D only, no images, no fonts to load — the whole look is code.
import { CFG } from './config.js';

const P = CFG.palette;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBackground(ctx, world, t) {
  const g = ctx.createRadialGradient(CFG.W / 2, CFG.H * 0.42, 60, CFG.W / 2, CFG.H / 2, 760);
  g.addColorStop(0, P.bgEdge);
  g.addColorStop(0.55, P.bgMid);
  g.addColorStop(1, P.bgDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  // Slow dust motes drifting through the dark.
  for (const d of world.dust) {
    const a = 0.10 + 0.14 * (0.5 + 0.5 * Math.sin(d.tw));
    ctx.fillStyle = `rgba(190, 205, 255, ${a * d.z})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint cavern ribs along the top and bottom edges.
  ctx.fillStyle = 'rgba(20, 28, 61, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= CFG.W; x += 80) ctx.lineTo(x, 26 + 18 * Math.sin(x * 0.011 + 1.7));
  ctx.lineTo(CFG.W, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, CFG.H);
  for (let x = 0; x <= CFG.W; x += 80) ctx.lineTo(x, CFG.H - 22 - 16 * Math.sin(x * 0.013 + 0.4));
  ctx.lineTo(CFG.W, CFG.H);
  ctx.closePath();
  ctx.fill();
}

function drawMotes(ctx, world, t) {
  for (const m of world.motes) {
    const bob = Math.sin(m.phase) * CFG.mote.bobAmp;
    const pulse = 0.75 + 0.25 * Math.sin(m.phase * 1.7);
    const x = m.x, y = m.y + bob;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 26 * pulse);
    glow.addColorStop(0, 'rgba(255, 220, 130, 0.9)');
    glow.addColorStop(0.35, 'rgba(255, 200, 94, 0.35)');
    glow.addColorStop(1, 'rgba(255, 200, 94, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 26 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.amberHot;
    ctx.beginPath();
    ctx.arc(x, y, m.r * 0.62 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlooms(ctx, world, t) {
  for (const g of world.glooms) {
    const wob = Math.sin(g.phase * 2) * 2;
    // A smoky body: two offset circles read as one shifting blob.
    ctx.fillStyle = P.gloomBody;
    ctx.beginPath();
    ctx.arc(g.x + wob, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(38, 22, 58, 0.9)';
    ctx.beginPath();
    ctx.arc(g.x - wob * 0.6, g.y + 5, g.r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    // Two violet eyes, looking toward the moth.
    const dx = world.player.x - g.x, dy = world.player.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    const ex = (dx / d) * 3, ey = (dy / d) * 3;
    ctx.fillStyle = P.gloomEye;
    ctx.beginPath();
    ctx.arc(g.x - 6 + ex, g.y - 3 + ey, 3.4, 0, Math.PI * 2);
    ctx.arc(g.x + 6 + ex, g.y - 3 + ey, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(179, 136, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, world, t) {
  const p = world.player;
  const lightR = world.lightRadius();
  const flicker = 1 + 0.03 * Math.sin(t * 9) + 0.02 * Math.sin(t * 23);

  // The lantern light itself, pooled on the floor of the cavern.
  const glow = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, lightR * flicker);
  glow.addColorStop(0, 'rgba(255, 214, 130, 0.55)');
  glow.addColorStop(0.45, 'rgba(255, 190, 90, 0.18)');
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, lightR * flicker, 0, Math.PI * 2);
  ctx.fill();

  // The moth: a small glowing body with two beating wings.
  const wing = Math.sin(t * 22) * 0.55;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.face);
  ctx.fillStyle = 'rgba(255, 232, 168, 0.85)';
  ctx.beginPath();
  ctx.ellipse(0, -12, 12, 5 + wing * 4, -0.7 - wing * 0.25, 0, Math.PI * 2);
  ctx.ellipse(0, 12, 12, 5 + wing * 4, 0.7 + wing * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = P.amberHot;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a5a1e';
  ctx.beginPath();
  ctx.arc(7, -3, 1.8, 0, Math.PI * 2);
  ctx.arc(7, 3, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A thin ring marks the edge of the light, so the player can read it.
  ctx.strokeStyle = 'rgba(255, 200, 94, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, lightR * flicker, 0, Math.PI * 2);
  ctx.stroke();
}

function drawParticles(ctx, world) {
  for (const q of world.parts) {
    const a = 1 - q.life / q.maxLife;
    ctx.fillStyle = q.color;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.size * a + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTexts(ctx, world) {
  ctx.textAlign = 'center';
  for (const t of world.texts) {
    const a = 1 - t.life / t.maxLife;
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = `bold ${t.size}px system-ui, sans-serif`;
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, world) {
  ctx.textBaseline = 'alphabetic';
  // Score, top left.
  ctx.textAlign = 'left';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = P.text;
  ctx.fillText(`SCORE ${world.score}`, 24, 44);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = P.dim;
  ctx.fillText(`LEVEL ${world.level}  ·  MOTES ${world.motesCollected}`, 24, 70);

  // Combo, top centre, only while it lives.
  if (world.combo >= 2) {
    const mult = Math.min(world.combo, CFG.combo.maxMult);
    ctx.textAlign = 'center';
    ctx.font = `bold ${26 + Math.min(mult, 6) * 2}px system-ui, sans-serif`;
    ctx.fillStyle = mult >= 4 ? P.cyan : P.amber;
    ctx.fillText(`COMBO x${mult}`, CFG.W / 2, 46);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = P.dim;
    ctx.fillText(`${world.combo} in a row`, CFG.W / 2, 68);
  }

  // Lives as hearts, top right.
  ctx.textAlign = 'right';
  for (let i = 0; i < CFG.lives; i++) {
    const x = CFG.W - 30 - i * 34;
    const y = 34;
    ctx.fillStyle = i < world.lives ? '#ff8f8f' : 'rgba(139, 147, 184, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y + 7);
    ctx.bezierCurveTo(x - 11, y - 3, x - 6, y - 12, x, y - 5);
    ctx.bezierCurveTo(x + 6, y - 12, x + 11, y - 3, x, y + 7);
    ctx.fill();
  }

  // Light meter, bottom centre.
  const bw = 260, bh = 10, bx = (CFG.W - bw) / 2, by = CFG.H - 34;
  ctx.fillStyle = 'rgba(139, 147, 184, 0.25)';
  roundRect(ctx, bx, by, bw, bh, 5);
  ctx.fill();
  const frac = world.charge / CFG.light.max;
  ctx.fillStyle = frac < 0.25 ? P.danger : P.amber;
  if (frac > 0.01) {
    roundRect(ctx, bx, by, bw * frac, bh, 5);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = P.dim;
  ctx.fillText('LANTERN', CFG.W / 2, by - 8);
  if (world.charge < 25) {
    ctx.fillStyle = P.danger;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('YOUR LIGHT IS FADING — FIND A MOTE', CFG.W / 2, by - 30);
  }
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(5, 7, 15, 0.55)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  ctx.textAlign = 'center';
  ctx.fillStyle = P.amberHot;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.shadowColor = 'rgba(255, 200, 94, 0.8)';
  ctx.shadowBlur = 42;
  ctx.fillText('LUMEN DRIFT', CFG.W / 2, 250);
  ctx.shadowBlur = 0;
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillStyle = P.text;
  ctx.fillText('a lantern-moth’s drift through the hollow dark', CFG.W / 2, 296);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = P.dim;
  ctx.fillText('Gather light motes to feed your lantern. Your glow holds the glooms back.', CFG.W / 2, 360);
  ctx.fillText('Steer with the mouse or WASD / arrow keys.  ·  P pauses  ·  M mutes', CFG.W / 2, 392);
  ctx.fillText('Three lives. Reach level 5 and see the dawn.', CFG.W / 2, 424);
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillStyle = P.amber;
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillText('CLICK OR PRESS ENTER TO START', CFG.W / 2, 500);
  ctx.globalAlpha = 1;
  if (best > 0) {
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = P.cyan;
    ctx.fillText(`BEST SCORE  ${best}`, CFG.W / 2, 548);
  }
}

function drawGameOver(ctx, world, best) {
  ctx.fillStyle = 'rgba(5, 7, 15, 0.72)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  ctx.textAlign = 'center';
  ctx.fillStyle = P.danger;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE DARK CLOSES IN', CFG.W / 2, 230);
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillStyle = P.text;
  ctx.fillText(`SCORE  ${world.score}`, CFG.W / 2, 300);
  ctx.fillStyle = P.dim;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Level ${world.level}  ·  ${world.motesCollected} motes gathered  ·  Best combo x${Math.min(world.bestCombo, CFG.combo.maxMult)}`, CFG.W / 2, 340);
  if (world.dawnReached) {
    ctx.fillStyle = P.amber;
    ctx.fillText('You reached the dawn — the hollow remembers your light.', CFG.W / 2, 376);
  }
  ctx.fillStyle = P.cyan;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`BEST SCORE  ${best}`, CFG.W / 2, 420);
  ctx.fillStyle = P.amber;
  ctx.font = 'bold 26px system-ui, sans-serif';
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillText('PRESS R OR CLICK TO DRIFT AGAIN', CFG.W / 2, 490);
  ctx.globalAlpha = 1;
}

export function draw(ctx, world, ui, best) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawBackground(ctx, world, world.time);
  drawMotes(ctx, world, world.time);
  drawGlooms(ctx, world, world.time);
  drawPlayer(ctx, world, world.time);
  drawParticles(ctx, world);
  drawTexts(ctx, world);
  if (ui === 'playing' || ui === 'paused') drawHud(ctx, world);
  if (ui === 'paused') {
    ctx.fillStyle = 'rgba(5, 7, 15, 0.6)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = P.text;
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('PAUSED', CFG.W / 2, CFG.H / 2);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = P.dim;
    ctx.fillText('Press P to carry on', CFG.W / 2, CFG.H / 2 + 40);
  }
  if (ui === 'title') drawTitle(ctx, world, best);
  if (ui === 'over') drawGameOver(ctx, world, best);
  ctx.restore();
}
