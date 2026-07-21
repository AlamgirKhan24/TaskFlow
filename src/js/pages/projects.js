import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';
import { save, load } from '../modules/storage.js';

/* ---- seed data (used only the first time, before anything is saved) ---- */
const SEED = [
  {
    id: 1, name: 'Website Redesign', description: 'Refresh marketing site with new brand system.',
    status: 'active', progress: 65, tasksDone: 13, tasksTotal: 20, due: 'Aug 12',
    members: [{ i: 'AK', c: '#FFB454' }, { i: 'RS', c: '#82AAFF' }, { i: 'MJ', c: '#7FE7C4' }],
  },
  {
    id: 2, name: 'Mobile App v2', description: 'Native rebuild of the TaskFlow mobile client.',
    status: 'active', progress: 40, tasksDone: 8, tasksTotal: 20, due: 'Sep 3',
    members: [{ i: 'AK', c: '#FFB454' }, { i: 'TL', c: '#FF8A80' }],
  },
  {
    id: 3, name: 'Q3 Marketing Campaign', description: 'Cross-channel launch for the fall product line.',
    status: 'onhold', progress: 20, tasksDone: 2, tasksTotal: 10, due: 'Oct 1',
    members: [{ i: 'MJ', c: '#7FE7C4' }],
  },
  {
    id: 4, name: 'Internal Wiki Migration', description: 'Move docs from Confluence to Notion.',
    status: 'completed', progress: 100, tasksDone: 15, tasksTotal: 15, due: 'Jul 5',
    members: [{ i: 'RS', c: '#82AAFF' }, { i: 'AK', c: '#FFB454' }],
  },
  {
    id: 5, name: 'API v3 Migration', description: 'Deprecate v2 endpoints, migrate all consumers.',
    status: 'active', progress: 55, tasksDone: 11, tasksTotal: 20, due: 'Aug 28',
    members: [{ i: 'TL', c: '#FF8A80' }, { i: 'MJ', c: '#7FE7C4' }, { i: 'AK', c: '#FFB454' }],
  },
  {
    id: 6, name: 'Customer Onboarding Flow', description: 'Reduce time-to-first-task for new signups.',
    status: 'completed', progress: 100, tasksDone: 9, tasksTotal: 9, due: 'Jun 18',
    members: [{ i: 'RS', c: '#82AAFF' }],
  },
];

const SEED_VERSION = 1;
if (load('projectsSeedVersion', 0) !== SEED_VERSION) {
  save('projects', SEED);
  save('projectsSeedVersion', SEED_VERSION);
}

let projects = load('projects', SEED);
let nextId = projects.reduce((max, p) => Math.max(max, p.id), 0) + 1;
let activeStatus = 'all';
let searchTerm = '';

const STATUS_LABEL = { active: 'Active', completed: 'Completed', onhold: 'On Hold' };

const grid = document.getElementById('projGrid');
const emptyState = document.getElementById('projEmpty');

function persist() {
  save('projects', projects);
}

/* ---- stats ---- */
function renderStats() {
  document.getElementById('statTotal').textContent = projects.length;
  document.getElementById('statActive').textContent = projects.filter((p) => p.status === 'active').length;
  document.getElementById('statCompleted').textContent = projects.filter((p) => p.status === 'completed').length;
  document.getElementById('statHold').textContent = projects.filter((p) => p.status === 'onhold').length;
}

/* ---- one project card ---- */
function cardHTML(p) {
  const avatars = p.members.slice(0, 4).map((m) =>
    `<span class="mini-avatar" style="background:${m.c}">${m.i}</span>`
  ).join('');

  return `
    <div class="proj-card status-${p.status}" data-id="${p.id}">
      <div class="proj-card-top">
        <div class="proj-card-name">${p.name}</div>
        <span class="proj-badge status-${p.status}">${STATUS_LABEL[p.status]}</span>
      </div>

      <div class="proj-card-desc">${p.description}</div>

      <div>
        <div class="proj-progress-row">
          <span>${p.progress}% complete</span>
          <span>${p.tasksDone}/${p.tasksTotal} tasks</span>
        </div>
        <div class="proj-progress-track">
          <div class="proj-progress-fill" style="width:${p.progress}%"></div>
        </div>
      </div>

      <div class="proj-card-foot">
        <div class="avatar-stack">${avatars}</div>
        <div class="proj-due">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
          ${p.due}
        </div>
      </div>
    </div>`;
}

/* ---- render grid with search + status filter ---- */
function render() {
  renderStats();

  const filtered = projects.filter((p) => {
    const matchesStatus = activeStatus === 'all' || p.status === activeStatus;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    grid.innerHTML = filtered.map(cardHTML).join('');
  }
}

/* ---- search ---- */
document.getElementById('projSearch').addEventListener('input', (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  render();
});

/* ---- status filter tabs ---- */
const statusTabs = document.getElementById('statusTabs');
statusTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  statusTabs.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activeStatus = btn.dataset.status;
  render();
});

/* ---- new project modal ---- */
const overlay = document.getElementById('projModalOverlay');
const nameInput = document.getElementById('pName');
const descInput = document.getElementById('pDesc');
const dueInput = document.getElementById('pDue');
const statusPicker = document.getElementById('pStatusPicker');
let selectedStatus = 'active';

statusPicker.querySelectorAll('.cat-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    statusPicker.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    selectedStatus = pill.dataset.status;
  });
});

function openModal() {
  nameInput.value = '';
  descInput.value = '';
  dueInput.value = '';
  selectedStatus = 'active';
  statusPicker.querySelectorAll('.cat-pill').forEach((p) => p.classList.toggle('active', p.dataset.status === 'active'));
  overlay.classList.add('open');
}
function closeModal() {
  overlay.classList.remove('open');
}

document.getElementById('newProjectBtn').addEventListener('click', openModal);
document.getElementById('cancelProjModalBtn').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

document.getElementById('saveProjectBtn').addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return;

  projects.push({
    id: nextId++,
    name,
    description: descInput.value.trim() || 'No description yet.',
    status: selectedStatus,
    progress: selectedStatus === 'completed' ? 100 : 0,
    tasksDone: 0,
    tasksTotal: 0,
    due: dueInput.value.trim() || 'No date',
    members: [{ i: 'AK', c: '#FFB454' }],
  });

  persist();
  closeModal();
  render();
});

/* ---- boot ---- */
initTheme();
initSidebar();
render();