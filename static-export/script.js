/* ---- Wave Color Title Effect ---- */
class WaveColorTitle {
  constructor(element) {
    this.element = element;
    this.rafId = null;
    this.progress = 0;   // 0 = sem cor
    this.direction = 1;  // 1 = entrando
    this.spans = [];
    this.accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#d97706';
    this.baseColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--foreground').trim() || '#1a1a2e';
    this.init();
  }

  init() {
    const childNodes = Array.from(this.element.childNodes);
    this.element.innerHTML = '';

    childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        [...node.textContent].forEach((char) => {
          const span = this.createSpan(char, false);
          this.element.appendChild(span);
          this.spans.push({ el: span, isAccent: false });
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const wrapper = document.createElement(node.tagName);
        wrapper.className = node.className;
        [...node.textContent].forEach((char) => {
          const span = this.createSpan(char, true);
          wrapper.appendChild(span);
          this.spans.push({ el: span, isAccent: true });
        });
        this.element.appendChild(wrapper);
      }
    });

    const trigger = this.element.classList.contains('hero-title')
      ? this.element
      : this.element.parentElement;

    trigger.addEventListener('mouseenter', () => this.animateTo(1));
    trigger.addEventListener('mouseleave', () => this.animateTo(0));
  }

createSpan(char, isAccent) {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.display = 'inline'; 
    span.style.whiteSpace = char === ' ' ? 'pre' : 'normal';
    span.style.transition = 'color 0.15s ease, font-weight 0.15s ease';
    return span;
  }

  // Interpola entre duas cores
  lerpColor(a, b, t) {
    const ah = a.replace('#', '');
    const bh = b.replace('#', '');
    const ar = parseInt(ah.substring(0, 2), 16);
    const ag = parseInt(ah.substring(2, 4), 16);
    const ab = parseInt(ah.substring(4, 6), 16);
    const br = parseInt(bh.substring(0, 2), 16);
    const bg = parseInt(bh.substring(2, 4), 16);
    const bb = parseInt(bh.substring(4, 6), 16);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const b2 = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${b2})`;
  }

  animateTo(target) {
    this.direction = target === 1 ? 1 : -1;
    if (this.rafId) return; //muda direção da animação
    this.tick();
  }

  tick() {
    // Velocidade: quanto o progresso avança por frame
    const speed = 0.013;
    this.progress = Math.min(1, Math.max(0, this.progress + this.direction * speed));

    const total = this.spans.length;

    this.spans.forEach(({ el, isAccent }, i) => {
      if (!el.textContent.trim()) return; // espaços: pular

      // Cada letra tem sua própria janela de progresso com "softness" nas bordas
      const softness = 0.4; // quanto da onda é gradiente suave
      const center = i / (total - 1);
      const dist = this.progress - center;
      // t vai de 0 a 1 conforme a onda passa por essa letra
      const t = Math.min(1, Math.max(0, (dist + softness) / (softness * 2)));

      if (!isAccent) {
        el.style.color = this.lerpColor(this.baseColor, this.accentColor, t);
        el.style.fontWeight = t > 0.5 ? '600' : '400';
      }
      // letras .accent mantêm a cor delas, só animam o peso
      else {
        el.style.fontWeight = t > 0.5 ? '600' : '400';
      }
    });

    // Continuar se não chegou ao alvo
    if (
      (this.direction === 1 && this.progress < 1) ||
      (this.direction === -1 && this.progress > 0)
    ) {
      this.rafId = requestAnimationFrame(() => this.tick());
    } else {
      this.rafId = null;
    }
  }
}

/* ---- Custom Cursor Animation ---- */
class CustomCursor {
  constructor() {
    this.cursor = document.getElementById('custom-cursor');
    this.arrow = document.getElementById('cursor-arrow');
    this.label = document.getElementById('cursor-label');
    this.hero = document.getElementById('hero'); // Referência à primeira section
    
    // Cancela se estiver no celular (touch) ou se os elementos não existirem
    if (!this.cursor || window.matchMedia("(pointer: coarse)").matches) return;
    
    this.cursor.style.display = 'block';
    
    // Posições (inicia fora da tela para não piscar no (0,0))
    this.mouse = { x: -100, y: -100 };
    this.arrowPos = { x: -100, y: -100 };
    this.labelPos = { x: -100, y: -100 };
    
    // Distância da etiqueta em relação à seta
    this.labelOffset = { x: 25, y: 12 };
    this.isPressed = false;
    
    this.initEvents();
    this.animate();
  }
  
  initEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    window.addEventListener('mousedown', () => this.isPressed = true);
    window.addEventListener('mouseup', () => this.isPressed = false);
    
    // Controla a visibilidade da etiqueta baseada na section hero[cite: 7]
    if (this.hero && this.label) {
      // Inicia oculta caso a página carregue com o mouse fora
      this.label.style.opacity = '0';
      this.label.style.transition = 'opacity 0.2s ease';

      this.hero.addEventListener('mouseenter', () => {
        this.label.style.opacity = '1';
      });
      
      this.hero.addEventListener('mouseleave', () => {
        this.label.style.opacity = '0';
      });
    }
  }
  
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }
  
  animate() {
    // Interpolação da Seta (Rápida)
    this.arrowPos.x = this.lerp(this.arrowPos.x, this.mouse.x, 0.4);
    this.arrowPos.y = this.lerp(this.arrowPos.y, this.mouse.y, 0.4);
    
    // Interpolação da Etiqueta (Lenta)
    this.labelPos.x = this.lerp(this.labelPos.x, this.mouse.x + this.labelOffset.x, 0.15);
    this.labelPos.y = this.lerp(this.labelPos.y, this.mouse.y + this.labelOffset.y, 0.15);
    
    // Aplica o clique diminuindo a escala (bounce)
    const scale = this.isPressed ? 0.9 : 1;
    
    this.arrow.style.transform = `translate(${this.arrowPos.x}px, ${this.arrowPos.y}px) scale(${scale})`;
    this.label.style.transform = `translate(${this.labelPos.x}px, ${this.labelPos.y}px) scale(${scale})`;
    
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const yearSpan = document.getElementById('year');
  const contactForm = document.getElementById('contact-form');
  const btnText = document.getElementById('btn-text');
  new BlackHoleAnimation('blackhole-container');
  new CustomCursor();
  // Header scroll effect
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 24) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Mobile menu
  function openMenu() {
    if (mobileMenu) mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (mobileMenu) mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);

  // Close mobile menu when clicking a link
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Current year in footer
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  // Contact form mock submit
  if (contactForm && btnText) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      btnText.textContent = 'Mensagem enviada!';
      setTimeout(() => {
        btnText.textContent = 'Enviar mensagem';
        contactForm.reset();
      }, 3000);
    });
  }

  // Fade-in animations with IntersectionObserver
  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    fadeElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback: show all elements immediately if IntersectionObserver is not available
    fadeElements.forEach((el) => el.classList.add('is-visible'));
  }

  // Inicializar efeito de cor em onda nos títulos dos projetos
  document.querySelectorAll('.hover-letter-weight').forEach((element) => {
    new WaveColorTitle(element);
  });

  // Barras de skill: guardar largura original, zerar, e animar ao rolar até elas
  const skillFills = document.querySelectorAll('.skill-fill');
  skillFills.forEach((bar) => {
    // Guardar o valor definido no inline
    bar.dataset.width = bar.style.width || '0%';
    bar.style.width = '0';
  });

  if (skillFills.length > 0 && 'IntersectionObserver' in window) {
    const skillObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            // Pequeno delay escalonado baseado na posição da barra
            const index = Array.from(skillFills).indexOf(bar);
            setTimeout(() => {
              bar.style.width = bar.dataset.width;
            }, index * 150);
            skillObserver.unobserve(bar);
          }
        });
      },
      { threshold: 0.5 }
    );
    skillFills.forEach((bar) => skillObserver.observe(bar));
  }
});


/* ---- Black Hole Animation (Vanilla JS Port) ---- */
class BlackHoleAnimation {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.settings = {
      particleCount: 500,
      particleSize: 0.5 + (20 - 1) * (4 / 49),
      colors: ["#ffffff", "#e5e5e5", "#b3b3b3"], // Tons de cinza e branco
      voidRadius: 40,
      voidX: 50,
      voidY: 50,
      outerRadius: 120,
      tilt: 20,
      tiltSideway: 160,
      trailAlpha: Math.max(0.02, 1 - (40 / 50) * 0.98),
      orbitSpeed: 4,
      pullSpeed: 1 / 2,
      perspective: 1300
    };

    this.particles = [];
    this.size = { w: this.container.clientWidth, h: this.container.clientHeight };
    this.lastTime = performance.now();

    this.initDOM();
    this.initParticles();
    this.initResizeObserver();
    
    this.draw = this.draw.bind(this);
    requestAnimationFrame(this.draw);
  }

  initDOM() {
    this.canvas = document.createElement("canvas");
    this.fgCanvas = document.createElement("canvas");
    
    const style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
    this.canvas.style.cssText = style;
    this.fgCanvas.style.cssText = style + " pointer-events: none;";
    
    this.ctx = this.canvas.getContext("2d");
    this.fgCtx = this.fgCanvas.getContext("2d");

    this.container.appendChild(this.canvas);
    this.container.appendChild(this.fgCanvas);
  }

  getOuterRad() {
    const maxR = this.size.w / 2;
    const pct = Math.max(0, this.settings.outerRadius) / 150;
    return this.settings.voidRadius + pct * (maxR - this.settings.voidRadius);
  }

  initParticles() {
    this.particles = [];
    const outerRad = this.getOuterRad();
    
    for (let i = 0; i < this.settings.particleCount; i++) {
      const radius = this.settings.voidRadius + Math.pow(Math.random(), 2) * (outerRad - this.settings.voidRadius);
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: radius,
        height: (Math.random() - 0.5) * 16,
        speedOffset: 0.75 + Math.random() * 0.5,
        colorIdx: Math.floor(Math.random() * this.settings.colors.length)
      });
    }
  }

  initResizeObserver() {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        
        [this.canvas, this.fgCanvas].forEach(c => {
          c.width = width * dpr;
          c.height = height * dpr;
        });
        
        this.size = { w: width, h: height };
        this.initParticles(); // Reseeds particles on resize
      }
    });
    ro.observe(this.container);
  }

  draw(now) {
    const dt = Math.min((now - this.lastTime) / 16.667, 3);
    this.lastTime = now;

    const { w, h } = this.size;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.trailAlpha})`;
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.globalCompositeOperation = "source-over";

    this.fgCtx.globalCompositeOperation = "destination-out";
    this.fgCtx.fillStyle = `rgba(0, 0, 0, ${this.settings.trailAlpha})`;
    this.fgCtx.fillRect(0, 0, w, h);
    this.fgCtx.globalCompositeOperation = "source-over";

    const outerRad = this.getOuterRad();
    const voidCx = (this.settings.voidX / 100) * w;
    const voidCy = (this.settings.voidY / 100) * h;
    const tiltRad = (this.settings.tilt * Math.PI) / 180;
    const tiltSidewayRad = (this.settings.tiltSideway * Math.PI) / 180;

    const bgParticles = [];
    const fgParticles = [];

    this.particles.forEach(pt => {
      const speedFactor = Math.sqrt(this.settings.voidRadius / Math.max(pt.radius, 10));
      pt.angle += (this.settings.orbitSpeed * speedFactor * pt.speedOffset) * 0.012 * dt;
      pt.radius -= (this.settings.pullSpeed * speedFactor * pt.speedOffset) * dt;

      if (pt.radius < this.settings.voidRadius) {
        pt.radius = this.settings.voidRadius + 0.7 * (outerRad - this.settings.voidRadius) + Math.random() * 0.3 * (outerRad - this.settings.voidRadius);
        pt.angle = Math.random() * Math.PI * 2;
        pt.height = (Math.random() - 0.5) * 16;
        return;
      }

      const cosA = Math.cos(pt.angle);
      const sinA = Math.sin(pt.angle);
      
      const y1 = pt.height * Math.cos(tiltRad) + (pt.radius * sinA) * Math.sin(tiltRad);
      const z1 = -pt.height * Math.sin(tiltRad) + (pt.radius * sinA) * Math.cos(tiltRad);

      const x3d = (pt.radius * cosA) * Math.cos(tiltSidewayRad) - y1 * Math.sin(tiltSidewayRad);
      const y3d = (pt.radius * cosA) * Math.sin(tiltSidewayRad) + y1 * Math.cos(tiltSidewayRad);

      const scale = this.settings.perspective / (this.settings.perspective + z1);
      const px = voidCx + x3d * scale;
      const py = voidCy + y3d * scale;

      if (px < -30 || px > w + 30 || py < -30 || py > h + 30) return;

      const ptData = {
        x: px, y: py,
        size: Math.max(0.3, this.settings.particleSize * scale),
        alpha: Math.max(0.35, 1 - ((z1 + outerRad) / (2 * outerRad)) * 0.45),
        z: z1,
        color: this.settings.colors[pt.colorIdx % this.settings.colors.length]
      };

      (z1 >= 0 ? bgParticles : fgParticles).push(ptData);
    });

    bgParticles.sort((a, b) => b.z - a.z).forEach(pt => {
      this.ctx.globalAlpha = pt.alpha;
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw Void Sphere
    const sphereGrad = this.ctx.createRadialGradient(
      voidCx - this.settings.voidRadius * 0.25, voidCy - this.settings.voidRadius * 0.3, this.settings.voidRadius * 0.05,
      voidCx, voidCy, this.settings.voidRadius
    );
    sphereGrad.addColorStop(0, "rgba(8,8,8,1)");
    sphereGrad.addColorStop(0.65, "rgba(0,0,0,1)");
    sphereGrad.addColorStop(1, "rgba(18,18,18,0.9)");
    
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = sphereGrad;
    this.ctx.beginPath();
    this.ctx.arc(voidCx, voidCy, this.settings.voidRadius, 0, Math.PI * 2);
    this.ctx.fill();

    fgParticles.sort((a, b) => b.z - a.z).forEach(pt => {
      this.fgCtx.globalAlpha = pt.alpha;
      this.fgCtx.fillStyle = pt.color;
      this.fgCtx.beginPath();
      this.fgCtx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.fgCtx.fill();
    });

    requestAnimationFrame(this.draw);
  }
}