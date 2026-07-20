import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';

function initCharts() {
  if (!window.Chart) return;                    // Chart.js loaded from CDN
  Chart.defaults.color = '#8B93A8';
  Chart.defaults.font.family = "'Inter', sans-serif";

  const bar = document.getElementById('productivityChart');
  if (bar) {
    new Chart(bar, {
      type: 'bar',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{ data: [14,22,18,26,20,9,6], backgroundColor: '#FFB454', borderRadius: 6, maxBarThickness: 28 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(139,147,168,0.12)' }, ticks: { stepSize: 10 } }
        }
      }
    });
  }

  const donut = document.getElementById('donutChart');
  if (donut) {
    new Chart(donut, {
      type: 'doughnut',
      data: {
        labels: ['Done','Active','Overdue'],
        datasets: [{ data: [67,27,6], backgroundColor: ['#7FE7C4','#FFB454','#FF8A80'], borderColor: '#161C2C', borderWidth: 3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initCharts();
});