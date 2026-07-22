import { initTheme } from '../modules/theme.js';
import { initSidebar } from '../modules/sidebar.js';

/* ---- accordion ---- */
document.querySelectorAll('.help-faq-item').forEach((item) => {
  const btn = item.querySelector('.help-faq-q');
  const ans = item.querySelector('.help-faq-a');

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // close all others
    document.querySelectorAll('.help-faq-item.open').forEach((other) => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.help-faq-a').style.maxHeight = null;
        other.querySelector('.help-faq-q').setAttribute('aria-expanded', 'false');
      }
    });

    // toggle this one
    if (isOpen) {
      item.classList.remove('open');
      ans.style.maxHeight = null;
      btn.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('open');
      ans.style.maxHeight = ans.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ---- topic card click → scroll to + open group ---- */
document.querySelectorAll('.help-topic').forEach((card) => {
  card.addEventListener('click', () => {
    const cat = card.dataset.topic;
    const label = document.querySelector(`.help-faq-group-label[data-category="${cat}"]`);
    if (!label) return;
    label.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---- live search ---- */
const searchInput  = document.getElementById('helpSearch');
const clearBtn     = document.getElementById('searchClear');
const faqList      = document.getElementById('faqList');
const noResults    = document.getElementById('helpNoResults');
const noResultsTerm = document.getElementById('noResultsTerm');
const faqCountEl   = document.getElementById('faqCount');

const allItems = Array.from(document.querySelectorAll('.help-faq-item'));
const allGroups = Array.from(document.querySelectorAll('.help-faq-group'));

function countVisible() {
  return allItems.filter((i) => i.style.display !== 'none').length;
}

function updateCount(n) {
  faqCountEl.textContent = `${n} article${n !== 1 ? 's' : ''}`;
}

function highlight(text, term) {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="help-highlight">$1</mark>');
}

function resetHighlights() {
  allItems.forEach((item) => {
    const qSpan = item.querySelector('.help-faq-q span');
    const p     = item.querySelector('.help-faq-a p');
    if (qSpan._orig) qSpan.innerHTML = qSpan._orig;
    if (p && p._orig) p.innerHTML = p._orig;
  });
}

function storeOriginals() {
  allItems.forEach((item) => {
    const qSpan = item.querySelector('.help-faq-q span');
    const p     = item.querySelector('.help-faq-a p');
    if (qSpan && !qSpan._orig) qSpan._orig = qSpan.innerHTML;
    if (p && !p._orig)         p._orig     = p.innerHTML;
  });
}

function runSearch(term) {
  const q = term.trim().toLowerCase();

  clearBtn.classList.toggle('visible', q.length > 0);
  resetHighlights();

  if (!q) {
    allItems.forEach((i) => (i.style.display = ''));
    allGroups.forEach((g) => (g.style.display = ''));
    noResults.classList.remove('show');
    faqList.style.display = '';
    updateCount(allItems.length);
    return;
  }

  let visibleCount = 0;

  allItems.forEach((item) => {
    const qSpan   = item.querySelector('.help-faq-q span');
    const p       = item.querySelector('.help-faq-a p');
    const qText   = (qSpan?._orig || qSpan?.textContent || '').toLowerCase();
    const aText   = (p?._orig     || p?.textContent     || '').toLowerCase();
    const matches = qText.includes(q) || aText.includes(q);

    item.style.display = matches ? '' : 'none';

    if (matches) {
      visibleCount++;
      if (qSpan) qSpan.innerHTML = highlight(qSpan._orig, term.trim());
      if (p)     p.innerHTML     = highlight(p._orig, term.trim());

      // auto-open matched items
      if (!item.classList.contains('open')) {
        item.classList.add('open');
        item.querySelector('.help-faq-a').style.maxHeight =
          item.querySelector('.help-faq-a').scrollHeight + 'px';
      }
    } else {
      item.classList.remove('open');
      item.querySelector('.help-faq-a').style.maxHeight = null;
    }
  });

  // hide groups that have no visible children
  allGroups.forEach((group) => {
    const hasVisible = Array.from(group.querySelectorAll('.help-faq-item')).some(
      (i) => i.style.display !== 'none'
    );
    group.style.display = hasVisible ? '' : 'none';
  });

  if (visibleCount === 0) {
    noResultsTerm.textContent = `"${term.trim()}"`;
    noResults.classList.add('show');
    faqList.style.display = 'none';
  } else {
    noResults.classList.remove('show');
    faqList.style.display = '';
  }

  updateCount(visibleCount);
}

searchInput.addEventListener('input', (e) => runSearch(e.target.value));

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  runSearch('');
  searchInput.focus();
});

/* ---- boot ---- */
initTheme();
initSidebar();
storeOriginals();
updateCount(allItems.length);
