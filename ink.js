// Ink reveal over the hero title (desktop, WebGL2). The cursor drops "ink" into a small fluid field;
// each frame the ink drifts with its velocity, bleeds into its neighbours along a noisy warp and
// fades. A final pass draws an inverted copy of the title (light text on blue) wherever the ink is
// dense enough, with a crisp but ragged edge. Remove this file and its two hooks in app.js to drop it.
window.HeroInk = (() => {
  'use strict';

  const PAD = 56;                 // px of canvas around the title, so ink can spill past the letters
  const BRUSH = 38;               // px, splat radius
  const EDGE = [0.32, 0.335];       // ink density range that becomes the visible edge
  const IDLE_STOP = 7000;         // ms after the last move before the loop sleeps
  const COLORS = { bg: '#0339F8', text: '#F3F3F1', accent: '#121211' };

  const VERT = `#version 300 es
  in vec2 aPos; out vec2 vUv;
  void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const NOISE = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }`;

  // Adds a soft blob of ink (r) and pushes velocity (gb) at the cursor.
  const SPLAT = `#version 300 es
  precision highp float;
  in vec2 vUv; out vec4 o;
  uniform sampler2D uField;
  uniform vec2 uPoint, uForce;
  uniform float uRadius, uAspect, uAmount;
  void main() {
    vec2 p = vUv - uPoint; p.x *= uAspect;
    float g = exp(-dot(p, p) / uRadius);
    vec4 f = texture(uField, vUv);
    o = vec4(min(f.r + g * uAmount, 1.6), f.gb + g * uForce, 1.0);
  }`;

  // Moves ink along its velocity, lets it bleed into a noisy neighbourhood, then fades it.
  const STEP = `#version 300 es
  precision highp float;
  in vec2 vUv; out vec4 o;
  uniform sampler2D uField;
  uniform vec2 uTexel;
  uniform float uDt, uTime, uDecay, uDamp;
  ${NOISE}
  void main() {
    vec2 c = vUv - texture(uField, vUv).gb * uDt;
    float t = uTime * 0.35;
    vec2 warp = (vec2(noise(vUv * 13.0 + t), noise(vUv * 13.0 + 19.7 - t)) - 0.5) * 3.2 * uTexel;
    vec4 s = texture(uField, c);
    vec4 n = texture(uField, c + vec2(uTexel.x, 0.0) + warp) + texture(uField, c - vec2(uTexel.x, 0.0) + warp)
           + texture(uField, c + vec2(0.0, uTexel.y) - warp) + texture(uField, c - vec2(0.0, uTexel.y) - warp);
    vec4 m = mix(s, n * 0.25, 0.42);
    o = vec4(m.r * uDecay, m.gb * uDamp, 1.0);
  }`;

  // Inverted title where the ink is dense enough; transparent elsewhere.
  const SHOW = `#version 300 es
  precision highp float;
  in vec2 vUv; out vec4 o;
  uniform sampler2D uField, uText;
  uniform vec3 uBg;
  uniform vec2 uEdge, uGrain;
  uniform float uTime;
  ${NOISE}
  void main() {
    float d = texture(uField, vUv).r;
    float n = noise(vUv * uGrain + uTime * 0.15) - 0.5;
    float a = smoothstep(uEdge.x, uEdge.y, d + n * 0.05);
    vec4 tx = texture(uText, vUv);
    o = vec4(mix(uBg, tx.rgb, tx.a), a);
  }`;

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);

  let gl, canvas, textCanvas, progs, quad, fields, textTex;
  let hero, title, cssW = 0, cssH = 0, dpr = 1, simW = 0, simH = 0;
  let raf = 0, lastMove = 0, lastFrame = 0, dirtyText = true, readyAt = Infinity;
  const pointer = { x: 0, y: 0, px: 0, py: 0, moved: false, inside: false };

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function program(frag) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  function target(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo };
  }

  function init() {
    canvas = document.createElement('canvas');
    canvas.className = 'hero-ink';
    canvas.setAttribute('aria-hidden', 'true');
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return false;
    progs = { splat: program(SPLAT), step: program(STEP), show: program(SHOW) };
    quad = gl.createVertexArray();
    gl.bindVertexArray(quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    textCanvas = document.createElement('canvas');
    textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return true;
  }

  // Fits the canvas around the title and (re)creates the fluid field at about a third of its size.
  function layout() {
    const hr = hero.getBoundingClientRect();
    const tr = title.getBoundingClientRect();
    const w = Math.round(tr.width + PAD * 2), h = Math.round(tr.height + PAD * 2);
    canvas.style.left = `${tr.left - hr.left - PAD}px`;
    canvas.style.top = `${tr.top - hr.top - PAD}px`;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    if (w === cssW && h === cssH && fields) return;
    cssW = w; cssH = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const k = Math.min(1 / 3, 512 / Math.max(w, h));
    simW = Math.max(64, Math.round(w * k));
    simH = Math.max(64, Math.round(h * k));
    fields = [target(simW, simH), target(simW, simH)];
    dirtyText = true;
  }

  // Draws the inverted title into a 2D canvas, word by word at the exact DOM positions.
  function drawText() {
    const cr = canvas.getBoundingClientRect();
    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;
    const ctx = textCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const cs = getComputedStyle(title);
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
    ctx.textBaseline = 'alphabetic';
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent;
      if (!text.trim()) continue;
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      const m = ctx.measureText(text);
      ctx.fillStyle = node.parentElement.closest('.accent') ? COLORS.accent : COLORS.text;
      ctx.fillText(text, r.left - cr.left, r.top - cr.top + m.fontBoundingBoxAscent);
    }
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    dirtyText = false;
  }

  function pass(prog, out, setup) {
    gl.useProgram(prog.p);
    setup(prog.u);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null);
    gl.viewport(0, 0, out ? simW : canvas.width, out ? simH : canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function bindTex(unit, tex) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return unit;
  }

  function splat(x, y, fx, fy) {
    pass(progs.splat, fields[1], u => {
      gl.uniform1i(u.uField, bindTex(0, fields[0].tex));
      gl.uniform2f(u.uPoint, x, y);
      gl.uniform2f(u.uForce, fx, fy);
      gl.uniform1f(u.uRadius, (BRUSH / cssH) ** 2);
      gl.uniform1f(u.uAspect, cssW / cssH);
      gl.uniform1f(u.uAmount, 0.7);
    });
    fields.reverse();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    if (dirtyText) drawText();

    if (pointer.moved) {
      // Fill the gap between pointer samples so fast strokes stay continuous.
      const dx = pointer.x - pointer.px, dy = pointer.y - pointer.py;
      const steps = Math.min(12, Math.max(1, Math.ceil(Math.hypot(dx * cssW, dy * cssH) / (BRUSH * 0.5))));
      const fx = dx / dt * 0.35, fy = dy / dt * 0.35;
      for (let i = 1; i <= steps; i++) splat(pointer.px + dx * i / steps, pointer.py + dy * i / steps, fx / steps, fy / steps);
      pointer.px = pointer.x; pointer.py = pointer.y;
      pointer.moved = false;
    }

    pass(progs.step, fields[1], u => {
      gl.uniform1i(u.uField, bindTex(0, fields[0].tex));
      gl.uniform2f(u.uTexel, 1 / simW, 1 / simH);
      gl.uniform1f(u.uDt, dt);
      gl.uniform1f(u.uTime, now / 1000);
      gl.uniform1f(u.uDecay, Math.pow(0.991, dt * 60));
      gl.uniform1f(u.uDamp, Math.pow(0.9, dt * 60));
    });
    fields.reverse();

    pass(progs.show, null, u => {
      gl.uniform1i(u.uField, bindTex(0, fields[0].tex));
      gl.uniform1i(u.uText, bindTex(1, textTex));
      gl.uniform3fv(u.uBg, hex(COLORS.bg));
      gl.uniform2f(u.uEdge, EDGE[0], EDGE[1]);
      gl.uniform2f(u.uGrain, cssW / 9, cssH / 9);
      gl.uniform1f(u.uTime, now / 1000);
    });

    raf = now - lastMove < IDLE_STOP ? requestAnimationFrame(frame) : 0;
  }

  function onMove(e) {
    if (performance.now() < readyAt || !canvas.isConnected) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    if (!inside) { pointer.inside = false; return; }
    if (!pointer.inside) { pointer.px = x; pointer.py = y; } // start a new stroke without a jump
    pointer.inside = true;
    pointer.x = x; pointer.y = y; pointer.moved = true;
    lastMove = performance.now();
    if (!raf) { lastFrame = lastMove; raf = requestAnimationFrame(frame); }
  }

  let listening = false;

  return {
    // Mounts into a freshly rendered hero (called after every page render).
    mount(heroEl) {
      if (!heroEl) return;
      if (!gl && !init()) { this.mount = () => {}; return; }
      hero = heroEl;
      title = hero.querySelector('.hero-title');
      if (!title) return;
      hero.appendChild(canvas);
      layout();
      fields.forEach(f => { gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo); gl.clear(gl.COLOR_BUFFER_BIT); });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      dirtyText = true;
      if (!listening) {
        listening = true;
        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('resize', () => { if (hero) { layout(); dirtyText = true; } });
      }
    },
    // Starts reacting to the cursor, `delay` ms from now (lets the title finish animating in).
    enable(delay = 0) { readyAt = performance.now() + delay; },
    // Line breaks or fonts changed: re-measure on the next frame.
    refresh() { if (hero && gl) { layout(); dirtyText = true; } },
  };
})();
