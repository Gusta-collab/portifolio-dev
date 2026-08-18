/* ---- Wave Color Title Effect ---- */
class WaveColorTitle {
  constructor(element) {
    this.element = element;
    this.rafId = null;
    this.progress = 0;   // 0 = sem cor, 1 = tudo colorido
    this.direction = 1;  // 1 = entrando, -1 = saindo
    this.spans = [];
    this.accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#d97706';
    this.baseColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--foreground').trim() || '#1a1a2e';
    this.init();
  }

  init() {
    // Quebrar o elemento em spans letra por letra, preservando spans filhos (como .accent)
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
    span.style.display = 'inline-block';
    span.style.whiteSpace = char === ' ' ? 'pre' : 'normal';
    span.style.transition = 'color 0.15s ease, font-weight 0.15s ease';
    return span;
  }

  // Interpola entre duas cores hex com base em t (0–1)
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
    if (this.rafId) return; // já está animando, só mudou direção
    this.tick();
  }

  tick() {
    // Velocidade: quanto o progresso avança por frame (60fps base)
    const speed = 0.035;
    this.progress = Math.min(1, Math.max(0, this.progress + this.direction * speed));

    const total = this.spans.length;

    this.spans.forEach(({ el, isAccent }, i) => {
      if (!el.textContent.trim()) return; // espaços: pular

      // Cada letra tem sua própria janela de progresso com "softness" nas bordas
      const softness = 0.4; // quanto da onda é gradiente suave (0 = rígido, 1 = muito suave)
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

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const yearSpan = document.getElementById('year');
  const contactForm = document.getElementById('contact-form');
  const btnText = document.getElementById('btn-text');

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
    // Guardar o valor definido no inline style do HTML (ex: "95%")
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