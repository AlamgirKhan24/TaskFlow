export function initPasswordToggles() {
  const toggles = document.querySelectorAll('[data-password-toggle]');

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (!input) return;

      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      btn.classList.toggle('is-visible', hidden);
      btn.setAttribute(
        'aria-label',
        hidden ? 'Hide password' : 'Show password'
      );
    });
  });
}