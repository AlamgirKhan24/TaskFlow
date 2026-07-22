import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';
import { save, load } from '../modules/storage.js';

/* ---- profile ---- */
const DEFAULT_PROFILE = { name: 'Alamgir Khan', email: 'you@company.com' };
let profile = load('profile', DEFAULT_PROFILE);

function initialsFrom(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'AK';
}

function renderProfileForm() {
  document.getElementById('profName').value = profile.name;
  document.getElementById('profEmail').value = profile.email;
  document.getElementById('profileAvatarPreview').textContent = initialsFrom(profile.name);
}

/* live initials preview while typing */
document.getElementById('profName').addEventListener('input', (e) => {
  const initials = initialsFrom(e.target.value) || initialsFrom(profile.name);
  document.getElementById('profileAvatarPreview').textContent = initials;
});

document.getElementById('saveProfileBtn').addEventListener('click', () => {
  const name  = document.getElementById('profName').value.trim()  || DEFAULT_PROFILE.name;
  const email = document.getElementById('profEmail').value.trim() || DEFAULT_PROFILE.email;
  profile = { name, email, initials: initialsFrom(name) };
  save('profile', profile);
  renderProfileForm();
  applySidebarProfile();

  const tag = document.getElementById('profileSavedTag');
  tag.classList.add('show');
  setTimeout(() => tag.classList.remove('show'), 2000);
});

function applySidebarProfile() {
  const nameEl   = document.querySelector('.sidebar-user-name');
  const mailEl   = document.querySelector('.sidebar-user-mail');
  const avatarEl = document.querySelector('.sidebar-avatar');
  if (nameEl)   nameEl.textContent   = profile.name;
  if (mailEl)   mailEl.textContent   = profile.email;
  if (avatarEl) avatarEl.textContent = initialsFrom(profile.name);
}

/* ---- appearance: dark / light picker ---- */
function renderThemePicker() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  document.querySelectorAll('.theme-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.theme === current);
  });
}

document.getElementById('themePicker').addEventListener('click', (e) => {
  const pill = e.target.closest('.theme-pill');
  if (!pill) return;
  document.documentElement.setAttribute('data-theme', pill.dataset.theme);
  save('theme', pill.dataset.theme);
  renderThemePicker();
});

/* ---- notification toggles ---- */
const DEFAULT_PREFS = { emailNotifs: true, taskReminders: true, weeklyDigest: false, defaultPriority: 'med' };
let prefs = load('preferences', DEFAULT_PREFS);

function renderSwitches() {
  document.querySelectorAll('.switch').forEach((sw) => {
    const on = !!prefs[sw.dataset.pref];
    sw.classList.toggle('on', on);
    sw.setAttribute('aria-checked', String(on));
  });
}

document.querySelectorAll('.switch').forEach((sw) => {
  sw.addEventListener('click', () => {
    prefs[sw.dataset.pref] = !prefs[sw.dataset.pref];
    save('preferences', prefs);
    renderSwitches();
  });
});

/* ---- default priority picker ---- */
function renderDefaultPriority() {
  document.querySelectorAll('#defaultPriorityPicker .cat-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.priority === prefs.defaultPriority);
  });
}

document.getElementById('defaultPriorityPicker').addEventListener('click', (e) => {
  const pill = e.target.closest('.cat-pill');
  if (!pill) return;
  prefs.defaultPriority = pill.dataset.priority;
  save('preferences', prefs);
  renderDefaultPriority();
});

/* ---- settings nav: highlight active section on scroll ---- */
const navLinks   = document.querySelectorAll('.set-nav-link[data-section]');
const sections   = document.querySelectorAll('.set-card[id]');
const scrollRoot = document.querySelector('.app-main');

function updateActiveNav() {
  const rootTop = scrollRoot.getBoundingClientRect().top;
  let activeId  = sections[0]?.id;

  sections.forEach((section) => {
    const relTop = section.getBoundingClientRect().top - rootTop;
    if (relTop <= 120) activeId = section.id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.section === activeId);
  });
}

scrollRoot.addEventListener('scroll', updateActiveNav, { passive: true });

navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(link.dataset.section);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---- danger zone: clear all local data ---- */
const clearOverlay = document.getElementById('confirmClearOverlay');
document.getElementById('clearDataBtn').addEventListener('click',   () => clearOverlay.classList.add('open'));
document.getElementById('cancelClearBtn').addEventListener('click', () => clearOverlay.classList.remove('open'));
clearOverlay.addEventListener('click', (e) => { if (e.target === clearOverlay) clearOverlay.classList.remove('open'); });

document.getElementById('confirmClearBtn').addEventListener('click', () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('flowline:'))
    .forEach((k) => localStorage.removeItem(k));
  window.location.reload();
});

/* ---- boot ---- */
initTheme();
initSidebar();
renderProfileForm();
renderThemePicker();
renderSwitches();
renderDefaultPriority();
updateActiveNav();
