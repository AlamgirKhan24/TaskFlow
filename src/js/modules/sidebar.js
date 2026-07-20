export function initSidebar() {
  const app = document.querySelector('.app');
  if (!app) return;

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-sidebar-collapse]')) {
      const collapsed = app.getAttribute('data-collapsed') === 'true';
      app.setAttribute('data-collapsed', String(!collapsed));
    }

    if (e.target.closest('[data-sidebar-open]')) {
      app.setAttribute('data-sidebar-open', 'true');
    }

    if (e.target.closest('[data-sidebar-close]')) {
      app.setAttribute('data-sidebar-open', 'false');
    }
  });
}