/* Inicialização da página. As classes de animação são definidas em script.js. */
document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  function setMenu(open) {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('open', open);
    mobileMenu.inert = !open;
    menuToggle?.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menuClose?.focus();
    else menuToggle?.focus({ preventScroll: true });
  }
  if (mobileMenu) mobileMenu.inert = true;
  menuToggle?.setAttribute('aria-controls', 'mobile-menu');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.addEventListener('click', () => setMenu(true));
  menuClose?.addEventListener('click', () => setMenu(false));
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMenu?.classList.contains('open')) setMenu(false);
  });

  const links = [...document.querySelectorAll('.nav-pill a')];
  let scrollFrame = 0;
  function updateNavigation() {
    scrollFrame = 0;
    header?.classList.toggle('scrolled', window.scrollY > 24);
    const current = [...document.querySelectorAll('main section[id]')]
      .filter(section => section.getBoundingClientRect().top <= window.innerHeight * 0.4).at(-1);
    links.forEach(link => {
      const active = link.hash === '#' + (current?.id || 'hero');
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
  }, { passive: true });
  updateNavigation();

  const fades = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    fades.forEach(element => observer.observe(element));
  } else {
    fades.forEach(element => element.classList.add('is-visible'));
  }

  const canvas = document.getElementById('shark-school');
  if (canvas && window.PortfolioEffects) new window.PortfolioEffects.SharkSchool(canvas);
  const signature = document.getElementById('footer-signature');
  if (signature && window.PortfolioEffects) new window.PortfolioEffects.ScrollSignature(signature);

  const whatsapp = document.getElementById('whatsapp-btn');
  if (whatsapp) {
    whatsapp.href = 'https://wa.me/' + '55' + '14' + '99189' + '5694';
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
  }

  const cursor = document.getElementById('custom-cursor');
  const arrow = document.getElementById('cursor-arrow');
  const label = document.getElementById('cursor-label');
  const hero = document.getElementById('hero');
  if (cursor && arrow && label && window.matchMedia('(pointer: fine)').matches) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let mouseX = -100, mouseY = -100, labelX = -100, labelY = -100;
    let frame = 0;
    function drawCursor() {
      frame = 0;
      labelX += (mouseX + 25 - labelX) * (reducedMotion.matches ? 1 : 0.2);
      labelY += (mouseY + 12 - labelY) * (reducedMotion.matches ? 1 : 0.2);
      arrow.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
      label.style.transform = 'translate(' + labelX + 'px,' + labelY + 'px)';
      if (Math.abs(labelX - mouseX - 25) + Math.abs(labelY - mouseY - 12) > 0.2) {
        frame = requestAnimationFrame(drawCursor);
      }
    }
    document.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursor.style.display = 'block';
      document.documentElement.classList.add('has-custom-cursor');
      label.style.opacity = hero?.contains(event.target) ? '1' : '0';
      if (!frame) frame = requestAnimationFrame(drawCursor);
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
      cursor.style.display = 'none';
      document.documentElement.classList.remove('has-custom-cursor');
      cancelAnimationFrame(frame);
      frame = 0;
    });
  }
});
