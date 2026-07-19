import { save, load } from './storage.js';

const STORAGE_NAME = 'theme';

function getInitialTheme() {
  const saved = load(STORAGE_NAME);
  if (saved === 'light' || saved === 'dark') return saved;

  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme() {
  applyTheme(getInitialTheme());

  const toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    applyTheme(next);
    save(STORAGE_NAME, next);
  });
}