import { initNav } from '../modules/nav.js';
import { initTheme } from '../modules/theme.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
});