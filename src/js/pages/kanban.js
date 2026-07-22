import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';
import { save, load } from '../modules/storage.js';

// Shared seed with tasks.js — both pages read/write the same 'tasks' key in storage.
const SEED = [
  { id: 1, name: 'Learn HTML tags and structure',       project: 'HTML', priority: 'high', due: 'Today',     status: 'done'     },
  { id: 2, name: 'Build a page with headings and lists', project: 'HTML', priority: 'med',  due: 'Mon',       status: 'done'     },
  { id: 3, name: 'Style a box with padding and margin',  project: 'CSS',  priority: 'high', due: 'Tomorrow',  status: 'progress' },
  { id: 4, name: 'Practice Flexbox layout',              project: 'CSS',  priority: 'med',  due: 'Wed',       status: 'progress' },
  { id: 5, name: 'Make the page responsive',             project: 'CSS',  priority: 'low',  due: 'Fri',       status: 'todo'     },
  { id: 6, name: 'Learn variables and functions',        project: 'JS',   priority: 'high', due: 'Thu',       status: 'todo'     },
  { id: 7, name: 'Add a button click event',             project: 'JS',   priority: 'med',  due: 'Fri',       status: 'todo'     },
];

const SEED_VERSION = 2;
if (load('tasksSeedVersion', 0) !== SEED_VERSION) {
  save('tasks', SEED);
  save('tasksSeedVersion', SEED_VERSION);
}

let tasks = load('tasks', SEED);

const COLUMNS = [
  { key: 'todo',     label: 'To Do',       dot: 'todo'     },
  { key: 'progress', label: 'In Progress', dot: 'progress' },
  { key: 'done',     label: 'Done',        dot: 'done'     },
];

const board = document.getElementById('board');

function persist() {
  save('tasks', tasks);
}

function priorityLabel(p) {
  return p === 'high' ? 'High' : p === 'med' ? 'Medium' : 'Low';
}

function cardHTML(t) {
  return `
    <div class="kcard" data-id="${t.id}">
      <div class="kcard-top">
        <span class="kcard-proj">${t.project}</span>
        <span class="ktag ${t.priority}">${priorityLabel(t.priority)}</span>
      </div>
      <div class="kcard-name">${t.name}</div>
      <div class="kcard-foot">
        <span class="kcard-due">${t.due}</span>
      </div>
    </div>`;
}

function render() {
  board.innerHTML = COLUMNS.map((col) => {
    const items = tasks.filter((t) => t.status === col.key);
    const cards = items.length
      ? items.map(cardHTML).join('')
      : '<div class="kcol-empty">Drop tasks here</div>';
    return `
      <div class="col-kanban">
        <div class="col-head">
          <span class="col-dot ${col.dot}"></span>
          <span class="col-title">${col.label}</span>
          <span class="col-count">${items.length}</span>
        </div>
        <div class="col-list" data-status="${col.key}">
          ${cards}
        </div>
      </div>`;
  }).join('');

  wireDragAndDrop();
}

function wireDragAndDrop() {
  if (!window.Sortable) return;

  document.querySelectorAll('.col-list').forEach((list) => {
    new Sortable(list, {
      group: 'kanban', // shared group name allows cards to move between columns
      animation: 150,
      ghostClass: 'kghost',
      dragClass:  'kdrag',
      onEnd: handleDrop,
    });
  });
}

function handleDrop(evt) {
  const id        = Number(evt.item.dataset.id);
  const newStatus = evt.to.dataset.status;
  const t         = tasks.find((t) => t.id === id);

  if (t && t.status !== newStatus) {
    t.status = newStatus;
    if (newStatus === 'done') t.due = 'Completed';
    persist();
  }

  render();
}

initTheme();
initSidebar();
render();
