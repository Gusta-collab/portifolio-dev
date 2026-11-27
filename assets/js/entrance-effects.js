/* Linhas traçadas ao entrar em cada seção. */
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const seen = new WeakSet();

  function prepareTrace(element, edges) {
    if (!element) return;
    const lines = document.createElement('span');
    lines.className = 'trace-lines';
    lines.setAttribute('aria-hidden', 'true');
    edges.forEach(edge => {
      const line = document.createElement('span');
      line.className = `trace-edge trace-${edge}`;
      lines.append(line);
    });
    element.classList.add('trace-target');
    element.append(lines);
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          entry.target.dispatchEvent(new Event('trace-enter'));
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' })
    : null;

  function onEnter(element, delay = 0) {
    if (!element || seen.has(element)) return;
    seen.add(element);
    element.addEventListener('trace-enter', () => {
      window.setTimeout(() => {
        element.classList.add('is-tracing');
      }, delay);
    }, { once: true });
    if (observer) observer.observe(element);
    else element.dispatchEvent(new Event('trace-enter'));
  }

  const hero = document.getElementById('hero');
  prepareTrace(hero, ['top', 'right', 'bottom', 'left']);
  onEnter(hero, 180);

  document.querySelectorAll('.section-divider').forEach(divider => {
    prepareTrace(divider, ['top']);
    onEnter(divider);
  });

  const projectHeader = document.querySelector('#projects .section-header');
  prepareTrace(projectHeader, ['bottom']);
  onEnter(projectHeader, 80);

  document.querySelectorAll('.project-card').forEach((card, index) => {
    prepareTrace(card, ['top', 'right', 'bottom', 'left']);
    onEnter(card, 160 + index * 130);
  });

  const contact = document.getElementById('contact');
  prepareTrace(contact, ['top', 'right', 'bottom', 'left']);
  onEnter(contact, 100);
});
