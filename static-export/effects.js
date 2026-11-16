/* Efeitos locais, sem bibliotecas ou imagens externas. */
(() => {
  'use strict';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const angleDifference = (angle, reference) => Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));

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
      this.shapes = {
        reef: this.createPoints('reef'),
        hammerhead: this.createPoints('hammerhead'),
      };
      this.fish = [
        { type: 'hammerhead', x: 0.50, y: 0.48, rx: 0.34, ry: 0.33, phase: 3.5, speed: 0.125, size: 1.06 },
        { type: 'reef', x: 0.50, y: 0.49, rx: 0.36, ry: 0.30, phase: 0.5, speed: 0.11, size: 1.12 },
        { type: 'reef', x: 0.50, y: 0.53, rx: 0.28, ry: 0.35, phase: 1.6, speed: 0.135, size: 0.94 },
      ];
      this.palettes = {
        reef: ['#70a8d1', '#91a4b3', '#8cced5'],
        hammerhead: ['#c6b765', '#d1c687', '#a89d58'],
      };
      this.twinklePalettes = {
        reef: ['#a4d9ee', '#6fbdce', '#b4c9db', '#739ed3'],
        hammerhead: ['#e1cc82', '#cbb575', '#d9d3a0', '#b6bd7a'],
      };
      this.fish.forEach(fish => {
        fish.twinkles = new Map();
        fish.pointCooldowns = new Map();
        fish.nextTwinkleAt = randomBetween(2, 7);
      });
      this.draw = this.draw.bind(this);
      this.sync = this.sync.bind(this);
      this.resize = this.resize.bind(this);
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

    createPoints(type) {
      // Vista superior: a nadadeira caudal vertical aparece como uma cauda estreita.
      // O movimento lateral vem da coluna articulada, em vez de uma cauda em leque.
      const outlines = {
        reef:
          'M 3 0 C 4 -13 10 -24 26 -28 C 48 -34 75 -34 101 -28 ' +
          'Q 117 -34 142 -63 Q 154 -77 164 -76 Q 168 -72 158 -58 ' +
          'L 139 -27 Q 168 -23 196 -17 Q 207 -18 220 -31 ' +
          'Q 227 -35 223 -24 L 214 -12 Q 246 -10 277 -7 ' +
          'Q 311 -5 340 -3 L 392 0 L 340 3 Q 311 5 277 7 ' +
          'Q 246 10 214 12 L 223 24 Q 227 35 220 31 ' +
          'Q 207 18 196 17 Q 168 23 139 27 L 158 58 ' +
          'Q 168 72 164 76 Q 154 77 142 63 Q 117 34 101 28 ' +
          'C 75 34 48 34 26 28 C 10 24 4 13 3 0 Z',
        hammerhead:
          'M 5 0 Q 2 -16 3 -33 Q 3 -41 12 -43 Q 22 -44 30 -40 ' +
          'Q 35 -36 33 -30 L 29 -20 Q 43 -17 63 -19 ' +
          'Q 80 -20 94 -16 Q 106 -26 124 -41 Q 130 -45 130 -40 ' +
          'Q 124 -22 111 -15 Q 148 -14 182 -9 ' +
          'L 199 -18 Q 204 -19 201 -13 L 199 -6 Q 234 -5 267 -3 ' +
          'Q 304 -2 328 -1.5 L 392 0 L 328 1.5 Q 304 2 267 3 ' +
          'Q 234 5 199 6 L 201 13 Q 204 19 199 18 L 182 9 ' +
          'Q 148 14 111 15 Q 124 22 130 40 Q 130 45 124 41 ' +
          'Q 106 26 94 16 Q 80 20 63 19 Q 43 17 29 20 L 33 30 ' +
          'Q 35 36 30 40 Q 22 44 12 43 Q 3 41 3 33 Q 2 16 5 0 Z',
      };
      const shape = new Path2D(outlines[type]);
      const points = [];
      const columns = [];
      for (let x = 3; x <= 392; x += 5.5) {
        const column = { index: columns.length, x, tail: x / 392 };
        columns.push(column);
        for (let row = -15; row <= 15; row++) {
          const y = row * 5.5;
          if (this.ctx.isPointInPath(shape, x, y)) {
            const seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
            points.push({ column, y, color: seed < 0.52 ? 0 : seed < 0.9 ? 1 : 2, cross: seed > 0.84 });
          }
        }
      }
      return { points, columns };
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(rect.width * this.dpr);
      this.canvas.height = Math.round(rect.height * this.dpr);
      this.fish.forEach(fish => { fish.spine = null; });
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
      const phase = fish.phase + time * fish.speed;
      // Uma volta ampla com pequenas variações evita uma órbita perfeitamente mecânica.
      const ripple = phase * 2 + fish.phase;
      return {
        x: w * (fish.x + Math.cos(phase) * fish.rx + Math.sin(ripple) * 0.015),
        y: h * (fish.y + Math.sin(phase) * fish.ry + Math.cos(ripple) * 0.025),
        dx: w * (-Math.sin(phase) * fish.rx + Math.cos(ripple) * 0.03),
        dy: h * (Math.cos(phase) * fish.ry - Math.sin(ripple) * 0.05),
      };
    }

    updateSpine(fish, columns, pose, scale) {
      if (!fish.spine) {
        const speed = Math.hypot(pose.dx, pose.dy);
        fish.spine = columns.map(column => ({
          x: pose.x - pose.dx / speed * (column.x - 3) * scale,
          y: pose.y - pose.dy / speed * (column.x - 3) * scale,
        }));
      }
      fish.spine[0].x = pose.x;
      fish.spine[0].y = pose.y;
      const heading = Math.atan2(-pose.dy, -pose.dx);
      let previousAngle = heading;
      // O tronco conserva a forma; a flexibilidade cresce em direção à cauda.
      // Limites por articulação e em relação à cabeça impedem curvas fechadas no corpo.
      for (let i = 1; i < fish.spine.length; i++) {
        const previous = fish.spine[i - 1];
        const node = fish.spine[i];
        const dx = node.x - previous.x;
        const dy = node.y - previous.y;
        const u = columns[i].tail;
        const jointLimit = 0.012 + Math.pow(u, 3) * 0.038;
        const flexibility = u < 0.5 ? 0.10 + 0.20 * u : 0.20 + (u - 0.5) * 0.90;
        const desired = Math.atan2(dy, dx);
        let angle = previousAngle + clamp(angleDifference(desired, previousAngle), -jointLimit, jointLimit);
        angle = heading + clamp(angleDifference(angle, heading), -flexibility, flexibility);
        const segment = (columns[i].x - columns[i - 1].x) * scale;
        node.x = previous.x + Math.cos(angle) * segment;
        node.y = previous.y + Math.sin(angle) * segment;
        previousAngle = angle;
      }
    }

    updateTwinkles(fish, pointCount, time) {
      if (this.motion.matches) return;
      for (const [index, twinkle] of fish.twinkles) {
        if (time > twinkle.start + twinkle.duration) fish.twinkles.delete(index);
      }
      for (const [index, until] of fish.pointCooldowns) {
        if (time > until) fish.pointCooldowns.delete(index);
      }
      if (time < fish.nextTwinkleAt) return;
      // Pequenos grupos independentes, com pausas longas e sem piscar o cardume inteiro.
      const count = Math.min(1 + Math.floor(Math.random() * 3), 4 - fish.twinkles.size);
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * pointCount);
        if (fish.twinkles.has(index) || fish.pointCooldowns.has(index)) continue;
        const start = time + randomBetween(0, 1.2);
        const duration = randomBetween(1.4, 2.4);
        const palette = this.twinklePalettes[fish.type];
        fish.twinkles.set(index, {
          start, duration, color: palette[Math.floor(Math.random() * palette.length)],
        });
        fish.pointCooldowns.set(index, start + duration + randomBetween(14, 28));
      }
      fish.nextTwinkleAt = time + randomBetween(3.5, 7.5);
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
        ctx.strokeStyle = i % 3 ? 'rgba(96,165,224,0.36)' : 'rgba(200,215,230,0.3)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - 1.3, y); ctx.lineTo(x + 1.3, y);
        ctx.moveTo(x, y - 1.3); ctx.lineTo(x, y + 1.3);
        ctx.stroke();
      }
      this.fish.forEach((fish, index) => {
        const { points, columns } = this.shapes[fish.type];
        const palette = this.palettes[fish.type];
        const scale = clamp(w / 1280, 0.5, 1.05) * fish.size;
        const pose = this.pose(fish, t, w, h);
        this.updateSpine(fish, columns, pose, scale);
        this.updateTwinkles(fish, points.length, t);
        ctx.save();
        columns.forEach(column => {
          const u = column.tail;
          const wave = u * 5.4 - t * (1.9 + index * 0.13) + fish.phase;
          const tailFlex = clamp((u - 0.3) / 0.7);
          const bend = Math.sin(wave) * (0.15 + 22 * tailFlex * tailFlex) * scale;
          const node = fish.spine[column.index];
          const previous = fish.spine[Math.max(column.index - 1, 0)];
          const next = fish.spine[Math.min(column.index + 1, columns.length - 1)];
          const dx = next.x - previous.x;
          const dy = next.y - previous.y;
          const length = Math.hypot(dx, dy) || 1;
          column.normalX = -dy / length;
          column.normalY = dx / length;
          column.renderX = node.x + column.normalX * bend;
          column.renderY = node.y + column.normalY * bend;
        });
        const paths = palette.map(() => new Path2D());
        const highlights = [];
        points.forEach((point, pointIndex) => {
          // Os pontos acompanham a curvatura do corpo, inclusive nas nadadeiras.
          const column = point.column;
          const x = column.renderX + point.y * scale * column.normalX;
          const y = column.renderY + point.y * scale * column.normalY;
          const radius = 1.35 * scale;
          this.drawPoint(paths[point.color], point, x, y, radius);
          const twinkle = !this.motion.matches && fish.twinkles.get(pointIndex);
          if (twinkle && t >= twinkle.start) {
            const progress = clamp((t - twinkle.start) / twinkle.duration);
            const alpha = Math.pow(Math.sin(progress * Math.PI), 2);
            const path = new Path2D();
            this.drawPoint(path, point, x, y, radius);
            highlights.push({ path, alpha, color: twinkle.color });
          }
        });
        ctx.globalAlpha = (0.78 + Math.sin(t * 0.65 + fish.phase) * 0.07) * (w < 600 ? 0.65 : 1);
        ctx.lineWidth = 0.7 * scale;
        paths.forEach((path, color) => {
          ctx.strokeStyle = palette[color];
          ctx.stroke(path);
        });
        highlights.forEach(highlight => {
          ctx.globalAlpha = highlight.alpha * (w < 600 ? 0.75 : 0.95);
          ctx.strokeStyle = highlight.color;
          ctx.shadowColor = highlight.color;
          ctx.shadowBlur = 2.5 * scale;
          ctx.stroke(highlight.path);
        });
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }

    drawPoint(path, point, x, y, radius) {
      if (point.cross) {
        path.moveTo(x - radius, y); path.lineTo(x + radius, y);
        path.moveTo(x, y - radius); path.lineTo(x, y + radius);
      } else {
        path.moveTo(x + radius, y);
        path.arc(x, y, radius, 0, Math.PI * 2);
      }
    }

    destroy() {
      cancelAnimationFrame(this.frame);
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
