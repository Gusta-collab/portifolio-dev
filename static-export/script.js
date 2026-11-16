/* Efeitos locais, sem bibliotecas ou imagens externas. */
(() => {
  'use strict';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const angleDifference = (angle, reference) => Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));

  /* ------------------------------------------------------------------ *
   * Anatomia dos tubarões (vista superior)
   *
   * O eixo x vai do focinho (0) até a ponta da cauda (392); y é a largura.
   * Tudo é desenhado só no lado y < 0 e espelhado, o que garante simetria.
   *  - body:  meia-largura do tronco em cada ponto x (curva suave);
   *  - fins:  contornos das nadadeiras (peitorais, pélvicas e caudal);
   *  - ridges: trechos das nadadeiras dorsais.
   * ------------------------------------------------------------------ */
  const SHAPE_LENGTH = 392;
  const BODY_COMPRESSION = 0.96;
  const SPECIES = {
    // Tubarão-de-recife: focinho arredondado, tronco robusto e cauda em foice.
    reef: {
      start: 1.5,
      tailStart: 296,
      body: [
        [0, 0], [1.5, 3.4], [4, 6], [8, 9], [14, 12.4], [24, 16.6], [38, 20.8], [56, 24.2],
        [76, 26.4], [96, 27.4], [120, 27.2], [145, 25.8], [170, 23.6], [195, 20.6],
        [220, 17.2], [245, 13.4], [270, 10], [290, 7.6], [305, 6.3], [335, 5.4],
      ],
      fins: [
        // peitoral: borda frontal convexa e borda posterior côncava (formato de foice)
        'M 80 -22 C 98 -38 130 -60 170 -80 Q 152 -54 153 -20 Z',
        // pélvica
        'M 210 -14 Q 226 -26 247 -35 Q 240 -26 238 -12 Z',
        // caudal: lobos finos e abertos, com entalhe central
        'M 296 -4 C 322 -9 354 -18 391 -38 Q 382 -16 349 0 L 349 3 L 296 3 Z',
      ],
      ridges: [[126, 170], [252, 262]],
    },
    // Tubarão-martelo: cefalofólio largo, tronco esguio e cauda longa.
    hammerhead: {
      start: 1.5,
      tailStart: 300,
      body: [
        [0, 0], [1, 10], [2, 22], [4, 38], [7, 50], [11, 55], [16, 56.5], [20, 55],
        [23, 49], [26, 39], [29, 29], [33, 21.5], [38, 17.8], [46, 16.4], [58, 17.6],
        [70, 19.6], [90, 22.6], [112, 23.6], [135, 22.8], [160, 21], [190, 17.6],
        [220, 14.2], [250, 11.2], [280, 8.4], [300, 6.6], [335, 5.4],
      ],
      fins: [
        'M 92 -21 C 110 -36 142 -58 182 -76 Q 162 -52 158 -20 Z',
        'M 216 -13 Q 232 -24 252 -32 Q 246 -24 244 -11 Z',
        'M 300 -4 C 330 -8 358 -16 391 -34 Q 384 -14 352 0 L 352 3 L 300 3 Z',
      ],
      ridges: [[112, 176], [254, 266]],
    },
  };

  // Converte um caminho SVG simples (M, L, Q, C, Z em coordenadas absolutas) em polígono.
  const parsePath = (d, steps = 12) => {
    const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+/g);
    const polygon = [];
    let i = 0, command = '', cx = 0, cy = 0;
    const next = () => parseFloat(tokens[i++]);
    while (i < tokens.length) {
      if (/[A-Z]/.test(tokens[i])) command = tokens[i++];
      if (command === 'Z') continue;
      if (command === 'M' || command === 'L') {
        cx = next(); cy = next();
        polygon.push([cx, cy]);
      } else if (command === 'Q') {
        const x1 = next(), y1 = next(), x = next(), y = next();
        for (let s = 1; s <= steps; s++) {
          const t = s / steps, m = 1 - t;
          polygon.push([m * m * cx + 2 * m * t * x1 + t * t * x, m * m * cy + 2 * m * t * y1 + t * t * y]);
        }
        cx = x; cy = y;
      } else if (command === 'C') {
        const x1 = next(), y1 = next(), x2 = next(), y2 = next(), x = next(), y = next();
        for (let s = 1; s <= steps; s++) {
          const t = s / steps, m = 1 - t;
          polygon.push([
            m * m * m * cx + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x,
            m * m * m * cy + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y,
          ]);
        }
        cx = x; cy = y;
      }
    }
    return polygon;
  };

  const insidePolygon = (polygon, x, y) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  // Interpolação cúbica suave (sem ondulações) para a largura do corpo.
  const smoothProfile = table => {
    const n = table.length;
    const slopes = table.map((_, i) => {
      const a = table[Math.max(i - 1, 0)];
      const b = table[Math.min(i + 1, n - 1)];
      return (b[1] - a[1]) / Math.max(b[0] - a[0], 1e-6);
    });
    return x => {
      if (x < table[0][0] || x > table[n - 1][0]) return 0;
      let i = 0;
      while (i < n - 2 && x > table[i + 1][0]) i++;
      const [x0, y0] = table[i];
      const [x1, y1] = table[i + 1];
      const h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
      const value = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * slopes[i]
        + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * slopes[i + 1];
      return Math.max(value, 0);
    };
  };

  class SharkSchool {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      if (!this.ctx) return;
      this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.frame = 0;
      this.elapsed = 0;
      this.last = 0;
      this.visible = false;
      this.orbs = [];
      this.orbExpiryTimer = 0;
      this.orbPoints = this.createOrbPoints();
      this.shapes = {
        reef: this.createPoints('reef'),
        hammerhead: this.createPoints('hammerhead'),
      };
      // beat: frequência da batida da cauda (rad/s); amp: amplitude relativa da ondulação.
      // Fases separadas por um terço de volta e faixas mais amplas distribuem o cardume.
      this.fish = [
        { type: 'hammerhead', palette: 'hammerhead', x: 0.48, y: 0.48, rx: 0.39, ry: 0.34, phase: 3.5, speed: 0.12, size: 1.06, beat: 2.6, amp: 1.0 },
        { type: 'reef', palette: 'reefBlue', x: 0.52, y: 0.49, rx: 0.38, ry: 0.34, phase: 3.5 + Math.PI * 2 / 3, speed: 0.12, size: 1.12, beat: 3.0, amp: 1.0 },
        { type: 'reef', palette: 'reefTeal', x: 0.50, y: 0.53, rx: 0.36, ry: 0.35, phase: 3.5 + Math.PI * 4 / 3, speed: 0.12, size: 0.94, beat: 3.3, amp: 0.95 },
      ];
      // Tons discretos próximos à referência: azul profundo e amarelo-oliva.
      // 0–5: corpo; 6: tom intermediário; 7–10: detalhes coloridos esparsos.
      this.palettes = {
        reefBlue: ['#27456f', '#2c5080', '#315b90', '#37669d', '#3b6fa8', '#477bad', '#6883a6', '#7f8035', '#527c3a', '#785597', '#b0833b'],
        reefTeal: ['#294967', '#2c5377', '#315e87', '#376994', '#3b739f', '#477eaa', '#6989a3', '#78823b', '#527e47', '#70588f', '#a78b43'],
        hammerhead: ['#4c532b', '#59622f', '#667036', '#747c3c', '#858a46', '#949855', '#a4a464', '#3c5e83', '#5e8141', '#6e5a85', '#ad9751'],
      };
      this.twinklePalettes = {
        reefBlue: ['#4b86bd', '#649047', '#9b914a', '#8e67af'],
        reefTeal: ['#4c83ad', '#68904e', '#96954f', '#8267a3'],
        hammerhead: ['#a6a755', '#8e9d4f', '#5f7b99', '#a88761'],
      };
      this.fish.forEach(fish => {
        fish.twinkles = new Map();
        fish.pointCooldowns = new Map();
        fish.nextTwinkleAt = randomBetween(1, 3.5);
        fish.twinkleCandidates = this.shapes[fish.type].twinkleCandidates;
        const columns = this.shapes[fish.type].columns;
        fish.raw = columns.map(() => ({ x: 0, y: 0 }));
        fish.spine = columns.map(() => ({ x: 0, y: 0 }));
        fish.nodes = columns.map(() => ({ x: 0, y: 0, nx: 0, ny: 1 }));
      });
      this.draw = this.draw.bind(this);
      this.sync = this.sync.bind(this);
      this.resize = this.resize.bind(this);
      this.onSurfaceClick = this.onSurfaceClick.bind(this);
      this.surface = canvas.closest('#contact') || canvas.parentElement;
      this.surface?.addEventListener('click', this.onSurfaceClick);
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(canvas);
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.sync();
      }, { rootMargin: '80px' });
      this.observer.observe(canvas);
      this.motion.addEventListener('change', this.sync);
      document.addEventListener('visibilitychange', this.sync);
      this.resize();
    }

    createOrbPoints() {
      const points = [];
      const rings = [
        { radius: 0.64, count: 16, offset: 0.12 },
        { radius: 0.82, count: 24, offset: 0.04 },
        { radius: 1, count: 32, offset: 0 },
      ];
      rings.forEach(ring => {
        for (let i = 0; i < ring.count; i++) {
          const angle = i / ring.count * Math.PI * 2 + ring.offset;
          const radius = ring.radius + randomBetween(-0.012, 0.012);
          const seed = Math.random();
          points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, color: seed < 0.65 ? 0 : seed < 0.9 ? 1 : 2, cross: seed > 0.92 });
        }
      });
      return points;
    }

    onSurfaceClick(event) {
      if (event.button !== 0 || event.target?.closest?.('a, button, input, textarea, select, [role="button"]')) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (!rect.width || !rect.height || x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      this.orbs.push({ x: x / rect.width, y: y / rect.height, born: performance.now(), duration: 2200 });
      if (this.orbs.length > 8) this.orbs.shift();
      this.render();
      this.scheduleOrbExpiry();
    }

    scheduleOrbExpiry() {
      clearTimeout(this.orbExpiryTimer);
      this.orbExpiryTimer = 0;
      if (!this.orbs.length) return;
      const next = Math.min(...this.orbs.map(orb => orb.born + orb.duration));
      this.orbExpiryTimer = setTimeout(() => {
        const now = performance.now();
        this.orbs = this.orbs.filter(orb => now < orb.born + orb.duration);
        if (!document.hidden) this.render();
        this.scheduleOrbExpiry();
      }, Math.max(20, next - performance.now() + 20));
    }

    createPoints(type) {
      const spec = SPECIES[type];
      const bodyHalf = smoothProfile(spec.body);
      const fins = spec.fins.map(d => parsePath(d));
      const inFin = (x, ay) => fins.some(polygon => insidePolygon(polygon, x, -ay));
      const columnStep = 4.0;
      const rowStep = 4.6;
      const columns = [];
      const points = [];
      const twinkleCandidates = [];
      // Grade hexagonal: parece um pontilhado orgânico em vez de uma malha quadrada.
      for (let x = spec.start, c = 0; x <= SHAPE_LENGTH; x += columnStep, c++) {
        const column = { index: c, x, tail: (x - spec.start) / (SHAPE_LENGTH - spec.start), half: bodyHalf(x), extent: 0 };
        columns.push(column);
        const offset = c % 2 ? 0.5 : 0;
        const rows = [];
        for (let row = -24; row <= 24; row++) {
          const y = (row + offset) * rowStep;
          const ay = Math.abs(y);
          if ((column.half > 0 && ay <= column.half) || inFin(x, ay)) rows.push(y);
        }
        column.extent = rows.reduce((max, y) => Math.max(max, Math.abs(y)), 0) + rowStep / 2;
        rows.forEach(y => {
          const ay = Math.abs(y);
          const seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          const tail = clamp((x - spec.tailStart) / 50);
          const onFin = ay > column.half || x > spec.tailStart;
          let shade, fin = 0, edge = 0;
          if (!onFin) {
            // Contrassombreamento: dorso escuro no centro, flancos mais claros.
            shade = 0.06 + 0.66 * Math.pow(clamp(ay / Math.max(column.half, 1)), 1.25);
          } else {
            // Nadadeiras e cauda clareiam em direção às pontas, sem sumir no fundo.
            const base = x > spec.tailStart ? 0 : column.half;
            edge = clamp((ay - base) / Math.max(column.extent - base, 1));
            shade = 0.4 + 0.42 * edge;
            fin = clamp((ay - column.half) / 14) * (1 - tail);
          }
          shade = clamp(shade + (seed - 0.5) * 0.22);
          let color = Math.min(5, Math.floor(shade * 6));
          // A maior parte do corpo conserva sua cor. Cerca de 12% dos pontos
          // recebe variações oliva, verdes, violetas e âmbar, sem faixas artificiais.
          const accentSeed = Math.abs(Math.sin(x * 57.13 + y * 11.97) * 24634.6345) % 1;
          if (accentSeed >= 0.88) {
            color = accentSeed < 0.93 ? 7 : accentSeed < 0.965 ? 8 : accentSeed < 0.99 ? 9 : 10;
          }
          // Pontos maiores no escuro e menores no claro dão volume, como um meio-tom.
          let radius = onFin ? 0.95 + 0.4 * (1 - edge) : 0.72 + 0.78 * (1 - Math.pow(shade, 1.3));
          const ridge = ay <= rowStep * 0.55 && spec.ridges.some(([a, b]) => x >= a && x <= b);
          if (ridge) { color = 4; radius = 1.15; }
          const pectoral = ay > column.half && insidePolygon(fins[0], x, -ay);
          if (!onFin && x > 40 && x < spec.tailStart - 15) twinkleCandidates.push(points.length);
          points.push({ column, y, color, radius, fin, tail, pectoral, cross: !ridge && seed > 0.91 });
        });
      }
      return { points, columns, twinkleCandidates };
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(rect.width * this.dpr);
      this.canvas.height = Math.round(rect.height * this.dpr);
      this.render();
    }

    sync() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.last = 0;
      this.render();
      if (this.visible && !document.hidden && !this.motion.matches) {
        this.frame = requestAnimationFrame(this.draw);
      }
    }

    draw(now) {
      // Acompanha a taxa de atualização da tela, com movimento baseado no tempo.
      if (this.last) this.elapsed += Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.render();
      this.frame = requestAnimationFrame(this.draw);
    }

    pose(fish, time, w, h) {
      // O ritmo médio é compartilhado para que os tubarões não se alcancem.
      // Uma pequena variação individual mantém acelerações naturais e espaçadas.
      const slowWave = time * 0.21 + 1.3;
      const longWave = time * 0.083 + 2.1;
      const individualWave = time * 0.17 + fish.phase;
      const phase = fish.phase + fish.speed * (
        time + 0.24 / 0.21 * (Math.cos(1.3) - Math.cos(slowWave))
        + 0.08 / 0.083 * (Math.cos(2.1) - Math.cos(longWave))
      ) + 0.10 * (Math.sin(individualWave) - Math.sin(fish.phase));
      const rate = fish.speed * (1 + 0.24 * Math.sin(slowWave) + 0.08 * Math.sin(longWave))
        + 0.017 * Math.cos(individualWave);
      // Uma volta ampla com pequenas variações evita uma órbita perfeitamente mecânica.
      const ripple = phase * 2 + fish.phase;
      return {
        x: w * (fish.x + Math.cos(phase) * fish.rx + Math.sin(ripple) * 0.015),
        y: h * (fish.y + Math.sin(phase) * fish.ry + Math.cos(ripple) * 0.025),
        dx: w * (-Math.sin(phase) * fish.rx + Math.cos(ripple) * 0.03),
        dy: h * (Math.cos(phase) * fish.ry - Math.sin(ripple) * 0.05),
        rate,
      };
    }

    /*
     * Corpo flexível em duas etapas:
     * 1) a coluna segue o rastro da cabeça (como um tubarão de verdade, o corpo
     *    percorre o caminho da cabeça), com curvatura suavemente limitada;
     * 2) uma onda viaja da cabeça à cauda, com amplitude crescente, e os pontos
     *    giram junto com a coluna, então o corpo realmente dobra.
     */
    updateBody(fish, columns, time, w, h, scale) {
      const count = columns.length;
      const pose = this.pose(fish, time, w, h);
      const longitudinalScale = scale * BODY_COMPRESSION;
      const bodyLength = (columns[count - 1].x - columns[0].x) * longitudinalScale;
      const speed = Math.max(Math.hypot(pose.dx, pose.dy) * pose.rate, 1);
      const stepLength = 5 * scale;
      const dt = clamp(stepLength / speed, 0.01, 0.6);

      // Rastro da cabeça, medido em comprimento de arco.
      const trail = [{ x: pose.x, y: pose.y, s: 0 }];
      for (let j = 1; trail[trail.length - 1].s < bodyLength + stepLength && j < 220; j++) {
        const p = this.pose(fish, time - j * dt, w, h);
        const prev = trail[trail.length - 1];
        trail.push({ x: p.x, y: p.y, s: prev.s + Math.hypot(p.x - prev.x, p.y - prev.y) });
      }
      const raw = fish.raw;
      let k = 0;
      for (let i = 0; i < count; i++) {
        const s = (columns[i].x - columns[0].x) * longitudinalScale;
        while (k < trail.length - 2 && trail[k + 1].s < s) k++;
        const a = trail[k], b = trail[k + 1];
        const f = clamp((s - a.s) / Math.max(b.s - a.s, 1e-6));
        raw[i].x = a.x + (b.x - a.x) * f;
        raw[i].y = a.y + (b.y - a.y) * f;
      }

      // Curvatura limitada de forma suave (tanh): curvas leves passam intactas,
      // curvas fechadas demais são suavizadas em vez de dobrar o corpo em "U".
      const spine = fish.spine;
      const heading = Math.atan2(-pose.dy, -pose.dx);
      spine[0].x = raw[0].x;
      spine[0].y = raw[0].y;
      let previousAngle = heading;
      let deviation = 0;
      let bendMid = 0;
      for (let i = 1; i < count; i++) {
        const angle = Math.atan2(raw[i].y - raw[i - 1].y, raw[i].x - raw[i - 1].x);
        deviation += angleDifference(angle, previousAngle);
        previousAngle = angle;
        const u = columns[i].tail;
        if (u <= 0.6) bendMid = deviation;
        const limit = 0.45 + 0.9 * u;
        const soft = limit * Math.tanh(deviation / limit);
        const segment = (columns[i].x - columns[i - 1].x) * longitudinalScale;
        spine[i].x = spine[i - 1].x + Math.cos(heading + soft) * segment;
        spine[i].y = spine[i - 1].y + Math.sin(heading + soft) * segment;
      }

      // Onda de natação: amplitude pequena na cabeça e grande na cauda.
      const nodes = fish.nodes;
      const amplitude = SHAPE_LENGTH * 0.092 * scale * fish.amp * (1 + 0.1 * Math.sin(time * 0.31 + fish.phase));
      const wavePhase = u => 5.2 * u - fish.beat * time + fish.phase;
      for (let i = 0; i < count; i++) {
        const previous = spine[Math.max(i - 1, 0)];
        const following = spine[Math.min(i + 1, count - 1)];
        const dx = following.x - previous.x, dy = following.y - previous.y;
        const length = Math.hypot(dx, dy) || 1;
        const u = columns[i].tail;
        const tailFlex = clamp((u - 0.38) / 0.62);
        const bend = amplitude * (0.015 + 0.985 * Math.pow(tailFlex, 1.8)) * Math.sin(wavePhase(u));
        nodes[i].x = spine[i].x - dy / length * bend;
        nodes[i].y = spine[i].y + dx / length * bend;
      }
      // As normais saem da curva já ondulada, para a seção do corpo girar com ela.
      for (let i = 0; i < count; i++) {
        const previous = nodes[Math.max(i - 1, 0)];
        const following = nodes[Math.min(i + 1, count - 1)];
        const dx = following.x - previous.x, dy = following.y - previous.y;
        const length = Math.hypot(dx, dy) || 1;
        nodes[i].nx = -dy / length;
        nodes[i].ny = dx / length;
      }
      return {
        // Na curva, a nadadeira de dentro "afunda" e a de fora se estende.
        bank: clamp(bendMid / 0.8, -1, 1),
        // A caudal abre mais quando atravessa o centro da batida.
        spread: 0.72 + 0.28 * Math.abs(Math.cos(wavePhase(1))),
      };
    }

    updateTwinkles(fish, time) {
      if (this.motion.matches) return;
      for (const [index, twinkle] of fish.twinkles) {
        if (time > twinkle.start + twinkle.duration) fish.twinkles.delete(index);
      }
      for (const [index, until] of fish.pointCooldowns) {
        if (time > until) fish.pointCooldowns.delete(index);
      }
      if (time < fish.nextTwinkleAt) return;
      // As piscadas se concentram no tronco, com escolha e ritmo independentes.
      const candidates = fish.twinkleCandidates;
      const count = Math.min(2 + Math.floor(Math.random() * 3), 8 - fish.twinkles.size);
      let added = 0;
      for (let attempt = 0; attempt < count * 5 && added < count && candidates.length; attempt++) {
        const index = candidates[Math.floor(Math.random() * candidates.length)];
        if (fish.twinkles.has(index) || fish.pointCooldowns.has(index)) continue;
        const start = time + randomBetween(0, 0.9);
        const duration = randomBetween(1.1, 1.9);
        const palette = this.twinklePalettes[fish.palette];
        fish.twinkles.set(index, {
          start, duration, color: palette[Math.floor(Math.random() * palette.length)],
        });
        fish.pointCooldowns.set(index, start + duration + randomBetween(10, 22));
        added++;
      }
      fish.nextTwinkleAt = time + randomBetween(2.2, 4.8);
    }

    render() {
      const { ctx, width: w, height: h } = this;
      if (!w || !h) return;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const t = this.elapsed;
      // Pequenos sinais de fundo, na mesma linguagem dos pontos dos tubarões.
      for (let i = 0; i < 36; i++) {
        const x = ((i * 139.17 + 37) % w);
        const y = ((i * 83.31 + 17) % h);
        ctx.strokeStyle = i % 3 ? 'rgba(68,102,147,0.28)' : 'rgba(141,153,163,0.24)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - 1.3, y); ctx.lineTo(x + 1.3, y);
        ctx.moveTo(x, y - 1.3); ctx.lineTo(x, y + 1.3);
        ctx.stroke();
      }
      const small = w < 600;
      this.fish.forEach(fish => {
        const { points, columns } = this.shapes[fish.type];
        const palette = this.palettes[fish.palette];
        const scale = clamp(w / 1280, 0.5, 1.05) * fish.size;
        const { bank, spread } = this.updateBody(fish, columns, t, w, h, scale);
        this.updateTwinkles(fish, t);
        const nodes = fish.nodes;
        const pectoralAnchor = nodes[Math.round((126 - columns[0].x) / 4)];
        const anchorX = columns[Math.round((126 - columns[0].x) / 4)].x;
        // As peitorais usam um apoio rígido no tronco e apenas uma oscilação discreta.
        const flutter = [Math.sin(t * 0.9 + fish.phase), Math.sin(t * 0.9 + fish.phase + 1.3)];

        ctx.save();
        const discs = palette.map(() => new Path2D());
        const crosses = palette.map(() => new Path2D());
        const highlights = [];
        points.forEach((point, pointIndex) => {
          const node = point.pectoral ? pectoralAnchor : nodes[point.column.index];
          const side = point.y < 0 ? -1 : 1;
          // Cada ponto acompanha a curvatura do corpo, e as nadadeiras têm vida própria.
          let lateral = point.y * (1 + point.tail * (spread - 1));
          let along = point.pectoral ? (point.column.x - anchorX) * BODY_COMPRESSION : 0;
          if (point.fin > 0) {
            const movement = point.pectoral ? 0.18 : 1;
            lateral *= 1 - bank * side * 0.17 * point.fin * movement + flutter[side < 0 ? 0 : 1] * 0.05 * point.fin * movement;
            along += Math.abs(point.y) * 0.1 * point.fin * movement * (flutter[side < 0 ? 1 : 0] - bank * side * 0.8);
          }
          lateral *= scale; along *= scale;
          const x = node.x + node.nx * lateral + node.ny * along;
          const y = node.y + node.ny * lateral - node.nx * along;
          const radius = point.radius * scale;
          this.drawPoint(point.cross ? crosses[point.color] : discs[point.color], point, x, y, radius);
          const twinkle = !this.motion.matches && fish.twinkles.get(pointIndex);
          if (twinkle && t >= twinkle.start) {
            const progress = clamp((t - twinkle.start) / twinkle.duration);
            const alpha = Math.pow(Math.sin(progress * Math.PI), 2);
            const path = new Path2D();
            this.drawPoint(path, point, x, y, radius * 1.18);
            highlights.push({ path, alpha, color: twinkle.color });
          }
        });
        ctx.globalAlpha = (0.84 + Math.sin(t * 0.65 + fish.phase) * 0.04) * (small ? 0.8 : 1);
        ctx.lineWidth = 0.65 * scale;
        palette.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.stroke(discs[i]);
          ctx.stroke(crosses[i]);
        });
        highlights.forEach(highlight => {
          ctx.globalAlpha = highlight.alpha * (small ? 0.8 : 0.98);
          ctx.fillStyle = highlight.color;
          ctx.strokeStyle = highlight.color;
          ctx.shadowColor = highlight.color;
          ctx.shadowBlur = 2.4 * scale;
          ctx.lineWidth = 0.9 * scale;
          ctx.stroke(highlight.path);
        });
        ctx.shadowBlur = 0;

        ctx.restore();
      });
      this.renderOrbs();
      ctx.globalAlpha = 1;
    }

    renderOrbs() {
      const now = performance.now();
      this.orbs = this.orbs.filter(orb => now < orb.born + orb.duration);
      if (!this.orbs.length) return;
      const palette = ['#347bca', '#58a6e9', '#82cfee'];
      const ctx = this.ctx;
      ctx.save();
      this.orbs.forEach(orb => {
        const progress = clamp((now - orb.born) / orb.duration);
        // Abre e fecha no mesmo lugar: a contração acontece antes do desaparecimento.
        const openness = (1 - Math.cos(progress * Math.PI * 2)) / 2;
        const maxRadius = clamp(Math.min(this.width, this.height) * 0.10, 42, 62);
        const radius = this.motion.matches ? 30 : 8 + (maxRadius - 8) * openness;
        const fade = this.motion.matches ? 0.85 : 0.95 * clamp(progress / 0.06) * (1 - clamp((progress - 0.87) / 0.13));
        const centerX = orb.x * this.width;
        const centerY = orb.y * this.height;
        const paths = palette.map(() => new Path2D());
        this.orbPoints.forEach(point => {
          this.drawPoint(paths[point.color], point, centerX + point.x * radius, centerY + point.y * radius, 1.1);
        });
        ctx.globalAlpha = fade;
        ctx.lineWidth = 0.85;
        ctx.shadowBlur = 2;
        paths.forEach((path, index) => {
          ctx.strokeStyle = palette[index];
          ctx.shadowColor = palette[index];
          ctx.stroke(path);
        });
      });
      ctx.restore();
    }

    drawPoint(path, point, x, y, radius) {
      if (point.cross) {
        const arm = radius * 1.25;
        path.moveTo(x - arm, y); path.lineTo(x + arm, y);
        path.moveTo(x, y - arm); path.lineTo(x, y + arm);
      } else {
        path.moveTo(x + radius, y);
        path.arc(x, y, radius, 0, Math.PI * 2);
      }
    }

    destroy() {
      cancelAnimationFrame(this.frame);
      clearTimeout(this.orbExpiryTimer);
      this.orbs = [];
      this.surface?.removeEventListener('click', this.onSurfaceClick);
      this.resizeObserver.disconnect();
      this.observer.disconnect();
      this.motion.removeEventListener('change', this.sync);
      document.removeEventListener('visibilitychange', this.sync);
    }
  }

  class ScrollSignature {
    constructor(container) {
      this.container = container;
      this.group = container.querySelector('.footer-letters');
      this.original = this.group.querySelector('text');
      this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.frame = 0;
      this.letters = [];
      this.update = this.update.bind(this);
      this.schedule = this.schedule.bind(this);
      // As medidas vêm do texto renderizado, preservando espaços e proporções.
      const name = this.original.textContent;
      const ns = 'http://www.w3.org/2000/svg';
      [...name].forEach((character, index) => {
        if (character === ' ') return;
        const position = this.original.getStartPositionOfChar(index);
        const width = this.original.getSubStringLength(index, 1);
        const group = document.createElementNS(ns, 'g');
        group.classList.add('footer-letter');
        const glyph = document.createElementNS(ns, 'text');
        glyph.textContent = character;
        glyph.setAttribute('x', position.x);
        glyph.setAttribute('y', position.y);
        glyph.setAttribute('textLength', width);
        glyph.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        group.appendChild(glyph);
        this.letters.push(group);
      });
      this.group.replaceChildren(...this.letters);
      window.addEventListener('scroll', this.schedule, { passive: true });
      window.addEventListener('resize', this.schedule);
      this.motion.addEventListener('change', this.schedule);
      this.update();
    }

    schedule() {
      if (!this.frame) this.frame = requestAnimationFrame(this.update);
    }

    update() {
      this.frame = 0;
      const rect = this.container.getBoundingClientRect();
      const progress = clamp((window.innerHeight - rect.top) / Math.max(rect.height, 1));
      this.letters.forEach((letter, index) => {
        const delay = index / Math.max(this.letters.length - 1, 1) * 0.52;
        const local = this.motion.matches ? 1 : clamp((progress - delay) / 0.48);
        const eased = 1 - Math.pow(1 - local, 3);
        letter.setAttribute('transform', `translate(0 ${((1 - eased) * 225).toFixed(2)})`);
        letter.setAttribute('opacity', (local * 0.9).toFixed(3));
      });
    }

    destroy() {
      cancelAnimationFrame(this.frame);
      window.removeEventListener('scroll', this.schedule);
      window.removeEventListener('resize', this.schedule);
      this.motion.removeEventListener('change', this.schedule);
    }
  }

  window.PortfolioEffects = { SharkSchool, ScrollSignature };
})();
