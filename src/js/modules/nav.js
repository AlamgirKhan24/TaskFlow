export function initNav() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 20);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menuBtn = document.querySelector('[data-menu-toggle]');
  const links = document.querySelector('.navbar-links');

  if (menuBtn && links) {
    menuBtn.addEventListener('click', () => {
      links.classList.toggle('is-open');
    });
  }
}