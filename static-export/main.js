/* Inicialização da página. As classes de animação são definidas em script.js. */
document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

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

});
