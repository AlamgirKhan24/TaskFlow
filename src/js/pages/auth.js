import { initPasswordToggles } from '../modules/password.js';
import { initTheme } from '../modules/theme.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPasswordToggles();
});