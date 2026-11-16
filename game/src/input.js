// Keyboard + mouse state, in canvas coordinates. The game steers toward the
// pointer when the mouse moves, and WASD / arrow keys always work too, so
// the game is playable with keyboard alone or mouse alone.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouseX = null;
    this.mouseY = null;
    this.mouseDown = false;
    this.clicked = false;   // edge: true for one frame after a click
    this.anyKey = false;    // edge: true for one frame after any keydown

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!this.keys.has(e.key)) this.anyKey = true;
      this.keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    });
    canvas.addEventListener('pointerdown', (e) => {
      this.mouseDown = true;
      this.clicked = true;
      const r = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    });
    window.addEventListener('pointerup', () => { this.mouseDown = false; });
    window.addEventListener('blur', () => { this.keys.clear(); this.mouseDown = false; });
  }

  axis() {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('w') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) y += 1;
    return { x, y };
  }

  has(key) {
    return this.keys.has(key);
  }

  // Call once per frame after the game has read the edges.
  endFrame() {
    this.clicked = false;
    this.anyKey = false;
  }
}
