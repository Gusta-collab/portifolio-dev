/* Inicialização da página. As classes de animação são definidas em script.js. */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const syncThemeButton = () => {
      const light = root.dataset.theme === 'light';
      const action = light ? 'Ativar tema escuro' : 'Ativar tema claro';
      themeToggle.setAttribute('aria-pressed', String(light));
      themeToggle.setAttribute('aria-label', action);
      themeToggle.title = action;
      const label = themeToggle.querySelector('.theme-toggle-label');
      if (label) label.textContent = light ? 'Tema escuro' : 'Tema claro';
    };
    syncThemeButton();
    themeToggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('portfolio-theme', root.dataset.theme);
      } catch (_) {
        // A troca de tema também funciona quando o armazenamento está bloqueado.
      }
      syncThemeButton();
    });
  }

  document.querySelectorAll('.project-card').forEach(card => {
    const button = card.querySelector('.project-toggle');
    const details = button && document.getElementById(button.getAttribute('aria-controls'));
    if (!button || !details) return;

    let hovering = false;
    let focused = false;
    let pinned = false;
    let dismissed = false;
    let expandedOnPress = null;

    const render = () => {
      const expanded = !dismissed && (hovering || focused || pinned);
      card.classList.toggle('is-expanded', expanded);
      button.setAttribute('aria-expanded', String(expanded));
      details.inert = !expanded;
      details.setAttribute('aria-hidden', String(!expanded));
    };

    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hovering = true;
      dismissed = false;
      render();
    });
    card.addEventListener('pointerleave', () => {
      hovering = false;
      if (!focused) dismissed = false;
      render();
    });
    card.addEventListener('focusin', () => {
      focused = true;
      dismissed = false;
      render();
    });
    card.addEventListener('focusout', event => {
      if (card.contains(event.relatedTarget)) return;
      focused = false;
      dismissed = false;
      render();
    });
    button.addEventListener('pointerdown', () => {
      expandedOnPress = button.getAttribute('aria-expanded') === 'true';
    });
    button.addEventListener('pointercancel', () => { expandedOnPress = null; });
    button.addEventListener('click', event => {
      const wasExpanded = event.detail > 0 && expandedOnPress !== null
        ? expandedOnPress
        : button.getAttribute('aria-expanded') === 'true';
      pinned = !wasExpanded;
      dismissed = wasExpanded;
      expandedOnPress = null;
      render();
    });
    card.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      pinned = false;
      dismissed = true;
      render();
    });
    render();
  });

  const canvas = document.getElementById('shark-school');
  if (canvas && window.PortfolioEffects) new window.PortfolioEffects.SharkSchool(canvas);

  const whatsapp = document.getElementById('whatsapp-btn');
  if (whatsapp) {
    whatsapp.href = 'https://wa.me/' + '55' + '14' + '99189' + '5694';
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
  }

});
