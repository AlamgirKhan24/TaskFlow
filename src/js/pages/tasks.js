import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';
import { save, load } from '../modules/storage.js';

/* ---- default seed data (used only the first time, before anything is saved) ---- */
const SEED = [
  { id: 1, name: 'Learn HTML tags and structure', project: 'HTML', priority: 'high', due: 'Today', status: 'done' },
  { id: 2, name: 'Build a page with headings and lists', project: 'HTML', priority: 'med', due: 'Mon', status: 'done' },
  { id: 3, name: 'Style a box with padding and margin', project: 'CSS', priority: 'high', due: 'Tomorrow', status: 'progress' },
  { id: 4, name: 'Practice Flexbox layout', project: 'CSS', priority: 'med', due: 'Wed', status: 'progress' },
  { id: 5, name: 'Make the page responsive', project: 'CSS', priority: 'low', due: 'Fri', status: 'todo' },
  { id: 6, name: 'Learn variables and functions', project: 'JS', priority: 'high', due: 'Thu', status: 'todo' },
  { id: 7, name: 'Add a button click event', project: 'JS', priority: 'med', due: 'Fri', status: 'todo' },
];

/* ---- state ---- */
// Bump SEED_VERSION whenever SEED changes, to refresh saved tasks with the new seed.
const SEED_VERSION = 2;
if (load('tasksSeedVersion', 0) !== SEED_VERSION) {
  save('tasks', SEED);
  save('tasksSeedVersion', SEED_VERSION);
}

let tasks = load('tasks', SEED);              // read saved tasks, or seed on first visit
let nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
let activeStatus = 'all';
let activePriority = 'all';
let searchTerm = '';
let sortBy = 'due';

const priorityOrder = { high: 0, med: 1, low: 2 };
const statusMeta = {
  todo:     { label: 'To Do',       dot: 'todo' },
  progress: { label: 'In Progress', dot: 'progress' },
  done:     { label: 'Done',        dot: 'done' },
};

const container = document.getElementById('taskContainer');

/* ---- persistence: save after every change ---- */
function persist() {
  save('tasks', tasks);
}

/* ---- small html helpers ---- */
function checkIcon() {
  return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#14100A" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
}
function priorityLabel(p) {
  return p === 'high' ? 'High' : p === 'med' ? 'Medium' : 'Low';
}

function taskRowHTML(t) {
  const done = t.status === 'done' ? 'done' : '';
  return `
    <div class="task-row" data-id="${t.id}">
      <div class="task-check ${done}" data-action="toggle">${t.status === 'done' ? checkIcon() : ''}</div>
      <div class="task-name ${done}" contenteditable="true" data-action="rename">${t.name}</div>
      <div class="col-project">${t.project}</div>
      <div class="col-due">${t.due}</div>
      <span class="tag ${t.priority}">${priorityLabel(t.priority)}</span>
      <div class="row-actions">
        <button class="icon-mini del" data-action="delete" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
    </div>`;
}

/* ---- the render function: state -> screen ---- */
function render() {
  let filtered = tasks.filter((t) => {
    if (activeStatus !== 'all' && t.status !== activeStatus) return false;
    if (activePriority !== 'all' && t.priority !== activePriority) return false;
    if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (sortBy === 'priority') {
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty">No tasks match your filters.</div>';
    return;
  }

  const groups = activeStatus === 'all' ? ['todo', 'progress', 'done'] : [activeStatus];
  let html = '';

  groups.forEach((g) => {
    const items = filtered.filter((t) => t.status === g);
    if (items.length === 0 && activeStatus === 'all') return;
    html += `
      <div class="group">
        <div class="group-head">
          <span class="group-dot ${statusMeta[g].dot}"></span>
          ${statusMeta[g].label}
          <span class="group-count">${items.length}</span>
        </div>
        <div class="task-list">${items.map(taskRowHTML).join('')}</div>
      </div>`;
  });

  container.innerHTML = html || '<div class="empty">No tasks match your filters.</div>';
}

/* ---- row actions: toggle done / delete (event delegation) ---- */
container.addEventListener('click', (e) => {
  const row = e.target.closest('.task-row');
  if (!row) return;
  const id = Number(row.dataset.id);
  const action = e.target.closest('[data-action]')?.dataset.action;

  if (action === 'toggle') {
    const t = tasks.find((t) => t.id === id);
    t.status = t.status === 'done' ? 'todo' : 'done';
    if (t.status === 'done') t.due = 'Completed';
    persist();
    render();
  }

  if (action === 'delete') {
    row.classList.add('fading');            // little fade-out before removal
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== id);
      persist();
      render();
    }, 180);
  }
});

/* ---- inline rename (save on blur) ---- */
container.addEventListener('blur', (e) => {
  if (e.target.dataset && e.target.dataset.action === 'rename') {
    const row = e.target.closest('.task-row');
    const id = Number(row.dataset.id);
    const t = tasks.find((t) => t.id === id);
    t.name = e.target.textContent.trim() || t.name;
    persist();
  }
}, true);   // useCapture = true so blur (which doesn't bubble) is caught

/* ---- filters / search / sort ---- */
document.getElementById('statusTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#statusTabs button').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activeStatus = btn.dataset.s;
  render();
});

document.getElementById('priorityChips').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#priorityChips button').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activePriority = btn.dataset.p;
  render();
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  searchTerm = e.target.value;
  render();
});

document.getElementById('sortSelect').addEventListener('change', (e) => {
  sortBy = e.target.value;
  render();
});

/* ---- modal: add new task ---- */
const overlay = document.getElementById('modalOverlay');
document.getElementById('openModalBtn').addEventListener('click', () => overlay.classList.add('open'));
document.getElementById('cancelModalBtn').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

document.getElementById('saveTaskBtn').addEventListener('click', () => {
  const name = document.getElementById('mName').value.trim();
  if (!name) return;
  tasks.push({
    id: nextId++,
    name,
    project: document.getElementById('mProject').value.trim() || 'TaskFlow Core',
    priority: document.getElementById('mPriority').value,
    due: document.getElementById('mDue').value.trim() || 'No date',
    status: 'todo',
  });
  document.getElementById('mName').value = '';
  document.getElementById('mProject').value = '';
  document.getElementById('mDue').value = '';
  overlay.classList.remove('open');
  persist();
  render();
});

/* ---- boot ---- */
initTheme();
initSidebar();
render();