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
      this.bgStars = this.createBgStars();
      this.shapes = {
        reef: this.createAnatomy('reef'),
        hammerhead: this.createAnatomy('hammerhead'),
      };
      // Velocidade mais baixa e nado livre com raio de curva amplo (nunca gira sobre a cabeça)
      this.fish = [
        {
          type: 'hammerhead', palette: 'hammerhead',
          startX: 0.28, startY: 0.35, startHeading: 0.35,
          phase: 0.8, speed: 0.052, size: 1.06, beat: 1.85, amp: 0.92,
          seed1: randomBetween(0, 10), seed2: randomBetween(0, 10), seed3: randomBetween(0, 10),
        },
        {
          type: 'reef', palette: 'reefBlue',
          startX: 0.72, startY: 0.42, startHeading: 2.65,
          phase: 2.9, speed: 0.055, size: 1.12, beat: 2.05, amp: 0.92,
          seed1: randomBetween(0, 10), seed2: randomBetween(0, 10), seed3: randomBetween(0, 10),
        },
        {
          type: 'reef', palette: 'reefTeal',
          startX: 0.48, startY: 0.68, startHeading: -1.25,
          phase: 5.0, speed: 0.058, size: 0.94, beat: 2.25, amp: 0.88,
          seed1: randomBetween(0, 10), seed2: randomBetween(0, 10), seed3: randomBetween(0, 10),
        },
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
        const columns = this.shapes[fish.type].columns;
        fish.raw = columns.map(() => ({ x: 0, y: 0 }));
        fish.nodes = columns.map(() => ({ x: 0, y: 0, nx: 0, ny: 1 }));
        this.initFishPath(fish);
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

    // Cria o histórico inicial para que os tubarões já comecem completamente esticados em t=0
    initFishPath(fish) {
      const dt = 0.05;
      const backSteps = Math.round(18 / dt);
      let rx = fish.startX, ry = fish.startY, rHeading = fish.startHeading;
      const preHistory = [{ t: 0, x: rx, y: ry, heading: rHeading, speed: fish.speed }];
      for (let i = 1; i <= backSteps; i++) {
        const t = -i * dt;
        const wanderTurn = 0.08 * Math.sin(t * 0.25 + fish.seed1) + 0.06 * Math.cos(t * 0.18 + fish.seed2);
        rHeading -= wanderTurn * dt;
        rx -= Math.cos(rHeading) * fish.speed * dt;
        ry -= Math.sin(rHeading) * fish.speed * dt;
        preHistory.push({ t, x: rx, y: ry, heading: rHeading, speed: fish.speed });
      }
      fish.history = preHistory.reverse();
    }

    // Simula o nado com curvas bem abertas e suaves para nunca girar em falso sobre a cabeça
    advanceFishPath(fish, targetTime) {
      const dt = 0.04;
      let last = fish.history[fish.history.length - 1];
      while (last.t < targetTime + 0.2) {
        const t = last.t + dt;
        // Velocidade calma e constante (sem freadas)
        const speed = fish.speed * (1 + 0.08 * Math.sin(t * 0.22 + fish.phase));

        // Mudança de direção suave pelo espaço
        let desiredTurn = 0.14 * Math.sin(t * 0.21 + fish.seed1)
          + 0.11 * Math.cos(t * 0.34 + fish.seed2)
          + 0.08 * Math.sin(t * 0.13 + fish.seed3);

        // Sensor suave de bordas: começa a curvar com bastante antecedência
        const lookAhead = 0.28;
        const futureX = last.x + Math.cos(last.heading) * lookAhead;
        const futureY = last.y + Math.sin(last.heading) * lookAhead;
        const margin = 0.18;

        if (futureX < margin || futureX > 1 - margin || futureY < margin || futureY > 1 - margin) {
          // Aponta suavemente para uma zona interna ampla
          const targetX = 0.5 + 0.16 * Math.sin(t * 0.17 + fish.seed1);
          const targetY = 0.5 + 0.16 * Math.cos(t * 0.19 + fish.seed2);
          const angleToInner = Math.atan2(targetY - last.y, targetX - last.x);
          const diff = angleDifference(angleToInner, last.heading);
          const outX = Math.max(0, margin - futureX, futureX - (1 - margin)) / margin;
          const outY = Math.max(0, margin - futureY, futureY - (1 - margin)) / margin;
          const pull = clamp(Math.hypot(outX, outY), 0, 1);
          desiredTurn = desiredTurn * (1 - pull) + clamp(diff * 0.85, -0.26, 0.26) * (0.4 + 0.6 * pull);
        }

        // Limite estrito de curvatura: garante que o raio mínimo da curva seja sempre grande
        const turnRate = clamp(desiredTurn, -0.24, 0.24);
        const heading = last.heading + turnRate * dt;
        const x = last.x + Math.cos(heading) * speed * dt;
        const y = last.y + Math.sin(heading) * speed * dt;

        last = { t, x, y, heading, speed };
        fish.history.push(last);
      }

      const minTime = targetTime - 22;
      while (fish.history.length > 4 && fish.history[1].t < minTime) {
        fish.history.shift();
      }
    }

    // Cria os pontos do clique em camadas fixas e bem próximas umas das outras.
    createOrbPoints() {
      const points = [
        { x: 0, y: 0, color: 2, cross: false, threshold: 0.0 }
      ];
      const rings = [
        { radius: 0.20, count: 6, offset: 0.0, threshold: 0.12 },
        { radius: 0.39, count: 12, offset: 0.26, threshold: 0.28 },
        { radius: 0.58, count: 16, offset: 0.08, threshold: 0.46 },
        { radius: 0.78, count: 22, offset: 0.15, threshold: 0.66 },
        { radius: 0.96, count: 28, offset: 0.0, threshold: 0.84 },
      ];
      rings.forEach(ring => {
        for (let i = 0; i < ring.count; i++) {
          const angle = i / ring.count * Math.PI * 2 + ring.offset;
          const radius = ring.radius + randomBetween(-0.012, 0.012);
          const seed = Math.random();
          const threshold = clamp(ring.threshold + randomBetween(-0.03, 0.03), 0.02, 0.94);
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            color: seed < 0.65 ? 0 : seed < 0.9 ? 1 : 2,
            cross: seed > 0.90,
            threshold,
          });
        }
      });
      return points;
    }

    // Pontos de fundo com cintilação harmônica (mesma paleta dos tubarões)
    createBgStars() {
      const stars = [];
      const colors = ['#4b86bd', '#4c83ad', '#649047', '#9b914a', '#8e67af', '#5f7b99', '#a6a755'];
      for (let i = 0; i < 48; i++) {
        stars.push({
          xRatio: (i * 139.17 + 37) % 1000 / 1000,
          yRatio: (i * 83.31 + 17) % 1000 / 1000,
          baseColor: i % 3 ? 'rgba(68,102,147,0.28)' : 'rgba(141,153,163,0.24)',
          twinkleColor: colors[i % colors.length],
          period: 3.2 + (i * 19 % 55) * 0.1,
          phase: (i * 31.7) % 10,
          cross: i % 4 !== 0,
        });
      }
      return stars;
    }

    onSurfaceClick(event) {
      if (event.button !== 0 || event.target?.closest?.('a, button, input, textarea, select, [role="button"]')) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (!rect.width || !rect.height || x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      this.orbs.push({ x: x / rect.width, y: y / rect.height, born: performance.now(), duration: 1100 });
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

    // Pré-calcula a tabela anatômica contínua do tubarão para consultar rapidamente
    // quais pontos estáticos do mapa estão dentro do corpo dele a cada frame.
    createAnatomy(type) {
      const spec = SPECIES[type];
      const bodyHalf = smoothProfile(spec.body);
      const fins = spec.fins.map(d => parsePath(d));
      const columnStep = 4.0;
      const columns = [];

      for (let x = spec.start, c = 0; x <= SHAPE_LENGTH; x += columnStep, c++) {
        const half = bodyHalf(x);
        let maxExtent = half;
        for (let ay = 0; ay <= 90; ay += 1.5) {
          if (ay <= half || fins.some(poly => insidePolygon(poly, x, -ay))) {
            maxExtent = Math.max(maxExtent, ay);
          }
        }
        columns.push({
          index: c,
          x,
          tail: (x - spec.start) / (SHAPE_LENGTH - spec.start),
          half,
          extent: maxExtent + 2.3,
        });
      }

      return { spec, bodyHalf, fins, columns, columnStep };
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
      if (this.last) this.elapsed += Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.render();
      this.frame = requestAnimationFrame(this.draw);
    }

    // Interpola a posição e direção do tubarão em qualquer instante do histórico
    pose(fish, time, w, h) {
      this.advanceFishPath(fish, time);
      const hist = fish.history;
      let low = 0, high = hist.length - 2;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (hist[mid + 1].t < time) low = mid + 1;
        else if (hist[mid].t > time) high = mid - 1;
        else { low = mid; break; }
      }
      const idx = clamp(low, 0, hist.length - 2);
      const a = hist[idx];
      const b = hist[idx + 1];
      const f = clamp((time - a.t) / Math.max(b.t - a.t, 1e-6));

      const x = a.x + (b.x - a.x) * f;
      const y = a.y + (b.y - a.y) * f;
      const heading = a.heading + angleDifference(b.heading, a.heading) * f;
      const speed = a.speed + (b.speed - a.speed) * f;

      return {
        x: w * x,
        y: h * y,
        dx: w * Math.cos(heading),
        dy: h * Math.sin(heading),
        rate: speed,
      };
    }

    /*
     * Atualiza a espinha dorsal seguindo fielmente o caminho percorrido pela cabeça
     * (sem recalcular desvios artificiais em torno da cabeça, eliminando o giro em falso).
     */
    updateBody(fish, columns, time, w, h, scale) {
      const count = columns.length;
      const pose = this.pose(fish, time, w, h);
      const longitudinalScale = scale * BODY_COMPRESSION;
      const bodyLength = (columns[count - 1].x - columns[0].x) * longitudinalScale;
      const speed = Math.max(Math.hypot(pose.dx, pose.dy) * pose.rate, 1);
      const stepLength = 4.5 * scale;
      const dt = clamp(stepLength / speed, 0.01, 0.25);

      // Rastro real da cabeça no espaço, medido em comprimento de arco exato
      const trail = [{ x: pose.x, y: pose.y, s: 0 }];
      for (let j = 1; trail[trail.length - 1].s < bodyLength + stepLength * 2 && j < 260; j++) {
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

      // Mede a inclinação da curva no meio do corpo para animar as nadadeiras
      const headAngle = Math.atan2(raw[2].y - raw[0].y, raw[2].x - raw[0].x);
      const midIdx = Math.min(35, count - 1);
      const midAngle = Math.atan2(raw[midIdx].y - raw[midIdx - 2].y, raw[midIdx].x - raw[midIdx - 2].x);
      const bendMid = angleDifference(midAngle, headAngle);

      // Onda de natação que viaja da metade posterior até a ponta da cauda
      const nodes = fish.nodes;
      const amplitude = SHAPE_LENGTH * 0.082 * scale * fish.amp * (1 + 0.08 * Math.sin(time * 0.25 + fish.phase));
      const wavePhase = u => 5.0 * u - fish.beat * time + fish.phase;

      for (let i = 0; i < count; i++) {
        const previous = raw[Math.max(i - 1, 0)];
        const following = raw[Math.min(i + 1, count - 1)];
        const dx = following.x - previous.x, dy = following.y - previous.y;
        const length = Math.hypot(dx, dy) || 1;
        const u = columns[i].tail;
        // A cabeça do tubarão-martelo (u < 0.12) não ondula lateralmente, mantendo-se firme
        const startFlex = fish.type === 'hammerhead' ? 0.28 : 0.20;
        const tailFlex = clamp((u - startFlex) / (1 - startFlex));
        const bend = amplitude * Math.pow(tailFlex, 1.85) * Math.sin(wavePhase(u));
        nodes[i].x = raw[i].x - dy / length * bend;
        nodes[i].y = raw[i].y + dx / length * bend;
      }

      for (let i = 0; i < count; i++) {
        const previous = nodes[Math.max(i - 1, 0)];
        const following = nodes[Math.min(i + 1, count - 1)];
        const dx = following.x - previous.x, dy = following.y - previous.y;
        const length = Math.hypot(dx, dy) || 1;
        nodes[i].nx = -dy / length;
        nodes[i].ny = dx / length;
      }

      return {
        bank: clamp(bendMid / 0.65, -1, 1),
        spread: 0.74 + 0.26 * Math.abs(Math.cos(wavePhase(1))),
      };
    }

    // Avalia se um ponto estático do mapa (px, py) está dentro da anatomia do tubarão
    // e retorna a cor, tamanho e símbolo correspondente naquele instante.
    sampleStaticPoint(fish, anatomy, px, py, scale, bank, spread, t) {
      const { spec, fins, columns } = anatomy;
      const nodes = fish.nodes;
      const count = columns.length;

      // 1) Busca rápida pela coluna da espinha dorsal mais próxima de (px, py)
      let bestI = 0;
      let bestDistSq = Infinity;
      for (let i = 0; i < count; i += 3) {
        const dx = px - nodes[i].x;
        const dy = py - nodes[i].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestI = i;
        }
      }
      const startI = Math.max(0, bestI - 3);
      const endI = Math.min(count - 1, bestI + 3);
      for (let i = startI; i <= endI; i++) {
        const dx = px - nodes[i].x;
        const dy = py - nodes[i].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestI = i;
        }
      }

      // 2) Converte a coordenada de tela (px, py) para a coordenada anatômica local (bodyX, bodyY)
      let bodyX, bodyY, column;
      // Verifica primeiro se está na região da cabeça rígida do tubarão-martelo
      if (fish.type === 'hammerhead' && bestI <= 12) {
        const headAnchor = nodes[6];
        const headAnchorX = columns[6].x;
        const dx = (px - headAnchor.x) / scale;
        const dy = (py - headAnchor.y) / scale;
        const along = dx * headAnchor.ny - dy * headAnchor.nx;
        const candidateX = headAnchorX + along / BODY_COMPRESSION;
        if (candidateX >= spec.start && candidateX <= 36) {
          bodyX = candidateX;
          bodyY = dx * headAnchor.nx + dy * headAnchor.ny;
          const colIdx = clamp(Math.round((bodyX - spec.start) / 4.0), 0, count - 1);
          column = columns[colIdx];
        }
      }

      if (bodyX === undefined) {
        const node = nodes[bestI];
        column = columns[bestI];
        const dx = (px - node.x) / scale;
        const dy = (py - node.y) / scale;
        const along = dx * node.ny - dy * node.nx;
        // Se o ponto está muito longe longitudinalmente do segmento mais próximo, está fora do tubarão
        if (Math.abs(along) > 5.5) return null;
        bodyX = column.x + along / BODY_COMPRESSION;
        if (bodyX < spec.start || bodyX > SHAPE_LENGTH) return null;
        const spreadFactor = 1 + column.tail * (spread - 1);
        bodyY = (dx * node.nx + dy * node.ny) / Math.max(spreadFactor, 0.5);
      }

      const ay = Math.abs(bodyY);
      if (ay > column.extent) return null;

      // 3) Verifica se (bodyX, ay) pertence ao tronco ou a alguma das nadadeiras
      const inBody = column.half > 0 && ay <= column.half;
      const inFin = !inBody && fins.some(poly => insidePolygon(poly, bodyX, -ay));
      if (!inBody && !inFin) return null;

      // 4) Calcula cor, sombreamento e destaque exatamente como no modelo original
      const onFin = ay > column.half || bodyX > spec.tailStart;
      let shade, edge = 0;
      if (!onFin) {
        shade = 0.06 + 0.66 * Math.pow(clamp(ay / Math.max(column.half, 1)), 1.25);
      } else {
        const base = bodyX > spec.tailStart ? 0 : column.half;
        edge = clamp((ay - base) / Math.max(column.extent - base, 1));
        shade = 0.4 + 0.42 * edge;
      }

      // Semente estática baseada na posição do ponto no mapa
      const mapSeed = Math.abs(Math.sin(px * 12.9898 + py * 78.233) * 43758.5453) % 1;
      shade = clamp(shade + (mapSeed - 0.5) * 0.22);
      let color = Math.min(5, Math.floor(shade * 6));

      const accentSeed = Math.abs(Math.sin(px * 57.13 + py * 11.97) * 24634.6345) % 1;
      if (accentSeed >= 0.88) {
        color = accentSeed < 0.93 ? 7 : accentSeed < 0.965 ? 8 : accentSeed < 0.99 ? 9 : 10;
      }

      let radius = onFin ? 0.95 + 0.4 * (1 - edge) : 0.72 + 0.78 * (1 - Math.pow(shade, 1.3));
      const ridge = ay <= 2.5 && spec.ridges.some(([a, b]) => bodyX >= a && bodyX <= b);
      if (ridge) { color = 4; radius = 1.15; }

      // Suaviza o surgimento nas bordas externas para que a entrada dos pontos seja fluida
      const boundaryDist = inBody ? (column.half - ay) : 2.5;
      const edgeAppear = clamp((boundaryDist + 1.2) / 2.0, 0.35, 1);

      // Multiplica o raio do símbolo por 1.48 sem alterar o tamanho do corpo do tubarão
      const symbolBoost = 1.48;

      return {
        color,
        radius: radius * symbolBoost * scale * edgeAppear,
        onFin,
        bodyX,
        tailStart: spec.tailStart,
      };
    }

    render() {
      const { ctx, width: w, height: h } = this;
      if (!w || !h) return;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const t = this.elapsed;

      // Espaço onde eles nadam: pontos estáticos de fundo + efeito de pisca harmônico
      this.bgStars.forEach(star => {
        const x = star.xRatio * w;
        const y = star.yRatio * h;
        ctx.strokeStyle = star.baseColor;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        if (star.cross) {
          ctx.moveTo(x - 1.3, y); ctx.lineTo(x + 1.3, y);
          ctx.moveTo(x, y - 1.3); ctx.lineTo(x, y + 1.3);
        } else {
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        }
        ctx.stroke();

        if (!this.motion.matches) {
          const cycle = (t + star.phase) % star.period;
          const twDuration = 1.6;
          if (cycle < twDuration) {
            const alpha = Math.pow(Math.sin((cycle / twDuration) * Math.PI), 2);
            ctx.save();
            ctx.globalAlpha = alpha * 0.78;
            ctx.strokeStyle = star.twinkleColor;
            ctx.shadowColor = star.twinkleColor;
            ctx.shadowBlur = 2.5;
            ctx.lineWidth = 0.95;
            ctx.beginPath();
            if (star.cross) {
              ctx.moveTo(x - 1.6, y); ctx.lineTo(x + 1.6, y);
              ctx.moveTo(x, y - 1.6); ctx.lineTo(x, y + 1.6);
            } else {
              ctx.arc(x, y, 1.15, 0, Math.PI * 2);
            }
            ctx.stroke();
            ctx.restore();
          }
        }
      });

      const small = w < 600;
      const baseScale = clamp(w / 1280, 0.5, 1.05);
      // Espaçamento da grade hexagonal aumentado para dar mais respiro entre os símbolos,
      // mantendo o tamanho real dos tubarões (scale) intacto.
      const gridStepX = 6.8 * baseScale;
      const gridStepY = 7.2 * baseScale;

      this.fish.forEach(fish => {
        const anatomy = this.shapes[fish.type];
        const palette = this.palettes[fish.palette];
        const twinklePalette = this.twinklePalettes[fish.palette];
        const scale = baseScale * fish.size;
        const { bank, spread } = this.updateBody(fish, anatomy.columns, t, w, h, scale);

        // Calcula a caixa delimitadora (bounding box) atual do tubarão para iterar
        // apenas sobre os pontos estáticos do mapa próximos a ele.
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const margin = 88 * scale;
        const nodes = fish.nodes;
        for (let i = 0; i < nodes.length; i += 2) {
          const nx = nodes[i].x, ny = nodes[i].y;
          if (nx < minX) minX = nx;
          if (nx > maxX) maxX = nx;
          if (ny < minY) minY = ny;
          if (ny > maxY) maxY = ny;
        }
        minX = Math.max(0, minX - margin);
        maxX = Math.min(w, maxX + margin);
        minY = Math.max(0, minY - margin);
        maxY = Math.min(h, maxY + margin);

        const cStart = Math.floor(minX / gridStepX);
        const cEnd = Math.ceil(maxX / gridStepX);
        const rStart = Math.floor(minY / gridStepY);
        const rEnd = Math.ceil(maxY / gridStepY);

        ctx.save();
        // Separamos caminhos de contorno (bolinhas vazadas, '+', 'x') e preenchidos (bolinhas cheias)
        const strokePaths = palette.map(() => new Path2D());
        const fillPaths = palette.map(() => new Path2D());
        const highlights = [];

        for (let c = cStart; c <= cEnd; c++) {
          const px = c * gridStepX;
          const rowOffset = (c & 1) ? 0.5 * gridStepY : 0;
          for (let r = rStart; r <= rEnd; r++) {
            const py = r * gridStepY + rowOffset;
            const sample = this.sampleStaticPoint(fish, anatomy, px, py, scale, bank, spread, t);
            if (!sample) continue;

            // Mutação aleatória de forma ao longo do tempo conforme o tubarão nada:
            // 0 = bolinha vazada, 1 = bolinha preenchida, 2 = '+', 3 = 'x'
            const cellHash = Math.abs(Math.sin(c * 127.1 + r * 311.7) * 43758.5453);
            const morphSpeed = 0.7 + (cellHash % 1) * 0.9;
            const morphPhase = (cellHash * 17.3) % 10 + (this.motion.matches ? 0 : t * morphSpeed);
            const stateRoll = Math.abs(Math.sin(morphPhase)) % 1;

            let shapeType = 0; // Bolinha vazada (padrão)
            if (stateRoll > 0.84) {
              shapeType = 2; // '+'
            } else if (stateRoll > 0.68) {
              shapeType = 3; // 'x'
            } else if (stateRoll > 0.48) {
              shapeType = 1; // Bolinha preenchida
            }

            if (shapeType === 1) {
              this.drawSymbol(fillPaths[sample.color], shapeType, px, py, sample.radius);
            } else {
              this.drawSymbol(strokePaths[sample.color], shapeType, px, py, sample.radius);
            }

            // Cintilação de luzes no tronco do tubarão sobre a grade estática
            if (!this.motion.matches && !sample.onFin && sample.bodyX > 32 && sample.bodyX < sample.tailStart - 15) {
              const twPeriod = 4.5 + ((cellHash * 29) % 1) * 6.5;
              const twCycle = (t + (cellHash * 53) % twPeriod) % twPeriod;
              const twDur = 1.35;
              if (twCycle < twDur && ((c * 19 + r * 37) % 9 === 0)) {
                const alpha = Math.pow(Math.sin((twCycle / twDur) * Math.PI), 2);
                const hPath = new Path2D();
                this.drawSymbol(hPath, shapeType, px, py, sample.radius * 1.22);
                const twColor = twinklePalette[(c + r) % twinklePalette.length];
                highlights.push({ path: hPath, alpha, color: twColor, filled: shapeType === 1 });
              }
            }
          }
        }

        ctx.globalAlpha = (0.86 + Math.sin(t * 0.65 + fish.phase) * 0.04) * (small ? 0.8 : 1);
        // Traço mais encorpado para acompanhar o tamanho maior dos símbolos
        ctx.lineWidth = 0.95 * scale;
        palette.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.stroke(strokePaths[i]);
          ctx.fill(fillPaths[i]);
        });

        highlights.forEach(highlight => {
          ctx.globalAlpha = highlight.alpha * (small ? 0.8 : 0.98);
          ctx.fillStyle = highlight.color;
          ctx.strokeStyle = highlight.color;
          ctx.shadowColor = highlight.color;
          ctx.shadowBlur = 2.8 * scale;
          ctx.lineWidth = 1.2 * scale;
          if (highlight.filled) ctx.fill(highlight.path);
          else ctx.stroke(highlight.path);
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
      const maxRadius = clamp(Math.min(this.width, this.height) * 0.05, 22, 34);

      this.orbs.forEach(orb => {
        const progress = clamp((now - orb.born) / orb.duration);
        const openness = this.motion.matches ? 1 : Math.sin(progress * Math.PI);
        const fade = this.motion.matches
          ? 0.85
          : 0.95 * clamp(progress / 0.05) * (1 - clamp((progress - 0.88) / 0.12));
        const centerX = orb.x * this.width;
        const centerY = orb.y * this.height;
        const paths = palette.map(() => new Path2D());

        this.orbPoints.forEach(point => {
          const localShow = clamp((openness - point.threshold) / 0.08);
          if (localShow <= 0) return;
          const x = centerX + point.x * maxRadius;
          const y = centerY + point.y * maxRadius;
          const pointRadius = 1.15 * (0.4 + 0.6 * localShow);
          this.drawSymbol(paths[point.color], point.cross ? 2 : 0, x, y, pointRadius);
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

    // Desenha os 4 estados possíveis:
    // 0 = bolinha vazada, 1 = bolinha preenchida, 2 = sinal '+', 3 = sinal 'x'
    drawSymbol(path, shapeType, x, y, radius) {
      if (shapeType === 2) {
        const arm = radius * 1.28;
        path.moveTo(x - arm, y); path.lineTo(x + arm, y);
        path.moveTo(x, y - arm); path.lineTo(x, y + arm);
      } else if (shapeType === 3) {
        const arm = radius * 0.98;
        path.moveTo(x - arm, y - arm); path.lineTo(x + arm, y + arm);
        path.moveTo(x - arm, y + arm); path.lineTo(x + arm, y - arm);
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