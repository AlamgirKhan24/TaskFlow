import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';
import { load } from '../modules/storage.js';

/* ---- pull real, live data from the same storage keys tasks.js / projects.js use ---- */
const tasks = load('tasks', []);
const projects = load('projects', []);

const PRIORITY_COLORS = { high: '#FF8A80', med: '#FFB454', low: '#82AAFF' };
const STATUS_COLORS = { todo: '#82AAFF', progress: '#FFB454', done: '#7FE7C4' };
const PROJ_STATUS_COLORS = { active: '#82AAFF', completed: '#7FE7C4', onhold: '#FF8A80' };
const PROJ_STATUS_LABEL = { active: 'Active', completed: 'Completed', onhold: 'On Hold' };

/* ---- top stat cards ---- */
function renderStats() {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0;

  document.getElementById('statTotalTasks').textContent = totalTasks;
  document.getElementById('statCompletionRate').textContent = `${completionRate}%`;
  document.getElementById('statActiveProjects').textContent = activeProjects;
  document.getElementById('statAvgProgress').textContent = `${avgProgress}%`;
}

/* ---- build a small colored legend row under a doughnut chart ---- */
function renderLegend(containerId, entries) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = entries.map(({ label, value, color }) => `
    <div class="an-legend-item">
      <span class="an-legend-dot" style="background:${color}"></span>
      ${label} · ${value}
    </div>`).join('');
}

function initCharts() {
  if (!window.Chart) return;                    // Chart.js loaded from CDN
  Chart.defaults.color = '#8B93A8';
  Chart.defaults.font.family = "'Inter', sans-serif";

  const markEmpty = (canvasId, isEmpty) => {
    const canvas = document.getElementById(canvasId);
    const card = canvas ? canvas.closest('.an-chart-card') : null;
    if (card) card.classList.toggle('is-empty', isEmpty);
  };

  /* ---- 1. Tasks by Priority (bar) ---- */
  const priorityCounts = { high: 0, med: 0, low: 0 };
  tasks.forEach((t) => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });
  markEmpty('priorityChart', tasks.length === 0);

  const priorityEl = document.getElementById('priorityChart');
  if (priorityEl && tasks.length) {
    new Chart(priorityEl, {
      type: 'bar',
      data: {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
          data: [priorityCounts.high, priorityCounts.med, priorityCounts.low],
          backgroundColor: [PRIORITY_COLORS.high, PRIORITY_COLORS.med, PRIORITY_COLORS.low],
          borderRadius: 6,
          maxBarThickness: 46,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(139,147,168,0.12)' }, ticks: { precision: 0 } },
        },
      },
    });
  }

  /* ---- 2. Task Status (doughnut) ---- */
  const statusCounts = { todo: 0, progress: 0, done: 0 };
  tasks.forEach((t) => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });
  markEmpty('statusChart', tasks.length === 0);

  const statusEl = document.getElementById('statusChart');
  if (statusEl && tasks.length) {
    new Chart(statusEl, {
      type: 'doughnut',
      data: {
        labels: ['To Do', 'In Progress', 'Done'],
        datasets: [{
          data: [statusCounts.todo, statusCounts.progress, statusCounts.done],
          backgroundColor: [STATUS_COLORS.todo, STATUS_COLORS.progress, STATUS_COLORS.done],
          borderColor: '#161C2C',
          borderWidth: 3,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } },
    });
  }
  renderLegend('statusLegend', [
    { label: 'To Do', value: statusCounts.todo, color: STATUS_COLORS.todo },
    { label: 'In Progress', value: statusCounts.progress, color: STATUS_COLORS.progress },
    { label: 'Done', value: statusCounts.done, color: STATUS_COLORS.done },
  ]);

  /* ---- 3. Project Progress (horizontal bar) ---- */
  markEmpty('progressChart', projects.length === 0);

  const progressEl = document.getElementById('progressChart');
  if (progressEl && projects.length) {
    new Chart(progressEl, {
      type: 'bar',
      data: {
        labels: projects.map((p) => p.name),
        datasets: [{
          data: projects.map((p) => p.progress),
          backgroundColor: projects.map((p) => PROJ_STATUS_COLORS[p.status] || '#FFB454'),
          borderRadius: 6,
          maxBarThickness: 20,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(139,147,168,0.12)' }, min: 0, max: 100, ticks: { callback: (v) => `${v}%` } },
          y: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
        },
      },
    });
  }

  /* ---- 4. Projects by Status (doughnut) ---- */
  const projStatusCounts = { active: 0, completed: 0, onhold: 0 };
  projects.forEach((p) => { if (projStatusCounts[p.status] !== undefined) projStatusCounts[p.status]++; });
  markEmpty('projStatusChart', projects.length === 0);

  const projStatusEl = document.getElementById('projStatusChart');
  if (projStatusEl && projects.length) {
    new Chart(projStatusEl, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Completed', 'On Hold'],
        datasets: [{
          data: [projStatusCounts.active, projStatusCounts.completed, projStatusCounts.onhold],
          backgroundColor: [PROJ_STATUS_COLORS.active, PROJ_STATUS_COLORS.completed, PROJ_STATUS_COLORS.onhold],
          borderColor: '#161C2C',
          borderWidth: 3,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } },
    });
  }
  renderLegend('projStatusLegend', Object.keys(projStatusCounts).map((key) => ({
    label: PROJ_STATUS_LABEL[key],
    value: projStatusCounts[key],
    color: PROJ_STATUS_COLORS[key],
  })));
}

/* ---- boot ---- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  renderStats();
  initCharts();
});