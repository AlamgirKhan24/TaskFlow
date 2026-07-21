import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';
import { save, load } from '../modules/storage.js';

/* ---- helpers ---- */
function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_LABEL = { work: 'Work', meeting: 'Meeting', personal: 'Personal', deadline: 'Deadline' };

/* ---- seed data: a few sample events around today, so the calendar isn't empty on first visit ---- */
function buildSeed() {
  const today = new Date();
  const seed = {};
  const add = (offsetDays, title, time, category) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    const key = dateKey(d);
    if (!seed[key]) seed[key] = [];
    seed[key].push({ id: Date.now() + Math.random(), title, time, category });
  };

  add(0, 'Daily stand-up', '9:30 AM', 'meeting');
  add(0, 'Ship kanban fixes', '', 'deadline');
  add(2, 'Design review', '2:00 PM', 'meeting');
  add(5, 'Gym', '6:00 PM', 'personal');
  add(-1, 'Client call', '11:00 AM', 'meeting');

  return seed;
}

const SEED_VERSION = 1;
if (load('calendarSeedVersion', 0) !== SEED_VERSION) {
  save('calendarEvents', buildSeed());
  save('calendarSeedVersion', SEED_VERSION);
}

let events = load('calendarEvents', {});
let viewDate = new Date();          // month currently shown (day is irrelevant, always normalized to 1st)
let selectedKey = null;             // date key currently open in the modal

const grid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('calMonthLabel');

function persist() {
  save('calendarEvents', events);
}

/* ---- build the 6x7 month grid ---- */
function render() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  monthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();          // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  const today = new Date();
  let html = '';

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);

    const key = dateKey(cellDate);
    const isOtherMonth = cellDate.getMonth() !== month;
    const isToday = sameDay(cellDate, today);
    const dayEvents = events[key] || [];

    const visible = dayEvents.slice(0, 2);
    const extra = dayEvents.length - visible.length;

    const pills = visible.map((ev) =>
      `<div class="event-pill ${ev.category}">${ev.title}</div>`
    ).join('');
    const dots = visible.map((ev) => `<span class="day-dot ${ev.category}"></span>`).join('');
    const more = extra > 0 ? `<div class="day-more">+${extra} more</div>` : '';

    html += `
      <div class="day-cell${isOtherMonth ? ' other-month' : ''}${isToday ? ' is-today' : ''}" data-date="${key}">
        <span class="day-num">${cellDate.getDate()}</span>
        <div class="day-events">${pills}${dots}${more}</div>
      </div>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.day-cell').forEach((cell) => {
    cell.addEventListener('click', () => openDayModal(cell.dataset.date));
  });
}

/* ---- side panel: today card + legend + upcoming ---- */
function renderSidePanel() {
  const today = new Date();

  document.getElementById('todayDayNum').textContent = today.getDate();
  document.getElementById('todayWeekday').textContent = today.toLocaleDateString('en-US', { weekday: 'short' });
  document.getElementById('todayFullDate').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const todayEvents = events[dateKey(today)] || [];
  document.getElementById('todayCount').textContent = `${todayEvents.length} event${todayEvents.length === 1 ? '' : 's'}`;

  const counts = { work: 0, meeting: 0, personal: 0, deadline: 0 };
  Object.values(events).forEach((list) => list.forEach((ev) => { if (counts[ev.category] !== undefined) counts[ev.category]++; }));
  document.getElementById('legendWork').textContent = counts.work;
  document.getElementById('legendMeeting').textContent = counts.meeting;
  document.getElementById('legendPersonal').textContent = counts.personal;
  document.getElementById('legendDeadline').textContent = counts.deadline;

  /* build a flat, sorted list of upcoming events (today + future), next 6 */
  const upcoming = [];
  Object.keys(events).forEach((key) => {
    const [y, m, d] = key.split('-').map(Number);
    const evDate = new Date(y, m - 1, d);
    evDate.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    if (evDate >= todayMidnight) {
      events[key].forEach((ev) => upcoming.push({ ...ev, dateKey: key, dateObj: evDate }));
    }
  });
  upcoming.sort((a, b) => a.dateObj - b.dateObj);

  const upcomingList = document.getElementById('upcomingList');
  if (!upcoming.length) {
    upcomingList.innerHTML = '<div class="day-event-empty">Nothing coming up.</div>';
  } else {
    upcomingList.innerHTML = upcoming.slice(0, 6).map((ev) => {
      const isToday = sameDay(ev.dateObj, today);
      const label = isToday ? 'Today' : ev.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `
        <div class="upcoming-row" data-jump="${ev.dateKey}">
          <span class="event-dot ${ev.category}"></span>
          <div class="upcoming-info">
            <div class="upcoming-name">${ev.title}</div>
            <div class="upcoming-meta">${label}${ev.time ? ' · ' + ev.time : ''}</div>
          </div>
        </div>`;
    }).join('');

    upcomingList.querySelectorAll('[data-jump]').forEach((row) => {
      row.addEventListener('click', () => openDayModal(row.dataset.jump));
    });
  }
}

/* ---- day modal ---- */
const overlay = document.getElementById('dayModalOverlay');
const modalTitle = document.getElementById('dayModalTitle');
const eventList = document.getElementById('dayEventList');
const nameInput = document.getElementById('eName');
const timeInput = document.getElementById('eTime');
const categoryPicker = document.getElementById('eCategoryPicker');
let selectedCategory = 'work';

categoryPicker.querySelectorAll('.cat-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    categoryPicker.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    selectedCategory = pill.dataset.cat;
  });
});

function resetCategoryPicker() {
  selectedCategory = 'work';
  categoryPicker.querySelectorAll('.cat-pill').forEach((p) => p.classList.toggle('active', p.dataset.cat === 'work'));
}

function formatModalDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderEventList() {
  const dayEvents = events[selectedKey] || [];
  if (!dayEvents.length) {
    eventList.innerHTML = '<div class="day-event-empty">No events yet for this day.</div>';
    return;
  }

  eventList.innerHTML = dayEvents.map((ev) => `
    <div class="day-event-row" data-id="${ev.id}">
      <span class="event-dot ${ev.category}"></span>
      <div class="day-event-info">
        <div class="day-event-name">${ev.title}</div>
        ${ev.time ? `<div class="day-event-time">${ev.time} · ${CATEGORY_LABEL[ev.category]}</div>` : `<div class="day-event-time">${CATEGORY_LABEL[ev.category]}</div>`}
      </div>
      <button class="icon-mini del" data-remove="${ev.id}" aria-label="Remove event">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>`).join('');

  eventList.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.remove);
      events[selectedKey] = (events[selectedKey] || []).filter((e) => e.id !== id);
      if (!events[selectedKey].length) delete events[selectedKey];
      persist();
      renderEventList();
      render();
      renderSidePanel();
    });
  });
}

function openDayModal(key) {
  selectedKey = key;
  modalTitle.textContent = formatModalDate(key);
  nameInput.value = '';
  timeInput.value = '';
  resetCategoryPicker();
  renderEventList();
  overlay.classList.add('open');
}

function closeDayModal() {
  overlay.classList.remove('open');
}

document.getElementById('cancelDayModalBtn').addEventListener('click', closeDayModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDayModal(); });

document.getElementById('saveEventBtn').addEventListener('click', () => {
  const title = nameInput.value.trim();
  if (!title || !selectedKey) return;

  if (!events[selectedKey]) events[selectedKey] = [];
  events[selectedKey].push({
    id: Date.now() + Math.random(),
    title,
    time: timeInput.value.trim(),
    category: selectedCategory,
  });

  nameInput.value = '';
  timeInput.value = '';
  persist();
  renderEventList();
  render();
  renderSidePanel();
});

/* ---- month navigation ---- */
document.getElementById('prevMonthBtn').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  render();
});
document.getElementById('nextMonthBtn').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  render();
});
document.getElementById('todayBtn').addEventListener('click', () => {
  viewDate = new Date();
  render();
});

/* ---- quick "add event" button in the header: opens today's modal ---- */
document.getElementById('addEventBtn').addEventListener('click', () => {
  openDayModal(dateKey(new Date()));
});

/* ---- boot ---- */
initTheme();
initSidebar();
render();
renderSidePanel();