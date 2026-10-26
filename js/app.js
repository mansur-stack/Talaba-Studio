/* Talaba Studio — navigatsiya, marshrutlash va ishga tushirish */
(function () {
  'use strict';
  const TS = window.TS;
  const { h, icon } = TS;

  const NAV = [
    ['bosh', 'Bosh sahifa', 'Bosh', 'home'],
    ['referat', 'Referat', 'Referat', 'doc'],
    ['kurs', 'Kurs ishi (BMI)', 'Kurs ishi', 'book'],
    ['mustaqil', 'Mustaqil ish', 'Mustaqil', 'task'],
    ['maqola', 'Maqola', 'Maqola', 'article'],
    ['prezentatsiya', 'Prezentatsiya', 'Slayd', 'slides'],
    ['ishlar', 'Mening ishlarim', 'Ishlarim', 'folder'],
    ['yoriqnoma', 'Qoʻllanma', 'Qoʻllanma', 'help'],
    ['sozlamalar', 'Sozlamalar', 'Sozlama', 'settings']
  ];
  const TITLES = {
    bosh: 'Bosh sahifa',
    referat: 'Referat',
    kurs: 'Kurs ishi (BMI)',
    mustaqil: 'Mustaqil ish',
    maqola: 'Maqola',
    prezentatsiya: 'Prezentatsiya',
    ishlar: 'Mening ishlarim',
    yoriqnoma: 'Foydalanish qoʻllanmasi',
    sozlamalar: 'Sozlamalar'
  };
  let token = 0;
  TS.active = null;

  function buildNav() {
    const side = document.getElementById('nav-side');
    const bottom = document.getElementById('nav-bottom');
    const BOTTOM_KEYS = new Set(['bosh', 'referat', 'kurs', 'prezentatsiya', 'ishlar']);
    NAV.forEach(([key, label, short, ic]) => {
      side.appendChild(h('a', { href: '#/' + key, dataset: { route: key } }, icon(ic, 20), label));
      if (BOTTOM_KEYS.has(key)) bottom.appendChild(h('a', { href: '#/' + key, dataset: { route: key } }, icon(ic, 22), short));
    });
    ['brand-mark', 'brand-mark-m'].forEach((id) => { const el = document.getElementById(id); if (el) el.appendChild(icon('text', 20)); });
    const sm = document.getElementById('settings-m');
    if (sm) sm.appendChild(icon('settings', 18));
  }
  function markNav(route) {
    document.querySelectorAll('[data-route]').forEach((a) => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const sm = document.getElementById('settings-m');
    if (sm) { if (route === 'sozlamalar') sm.setAttribute('aria-current', 'page'); else sm.removeAttribute('aria-current'); }
  }

  /* Mavzu tugmalari */
  function isDark() { return document.documentElement.dataset.theme === 'dark'; }
  TS.syncThemeButtons = function () {
    ['theme-btn-side', 'theme-btn-top'].forEach((id) => {
      const b = document.getElementById(id);
      if (!b) return;
      TS.clear(b);
      b.append(icon(isDark() ? 'sun' : 'moon', 18));
      if (id === 'theme-btn-side') b.append(isDark() ? 'Yorugʻ mavzu' : 'Qorongʻi mavzu');
      b.setAttribute('aria-label', isDark() ? 'Yorugʻ mavzuga oʻtish' : 'Qorongʻi mavzuga oʻtish');
    });
  };
  function toggleTheme() { TS.prefs.setTheme(isDark() ? 'light' : 'dark'); TS.syncThemeButtons(); }

  /* Marshrut: #/nom/parametr */
  function parse() {
    const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    const name = TS.views[parts[0]] ? parts[0] : 'bosh';
    return { name, param: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  let busy = false;
  async function route() {
    const my = ++token;
    const { name, param } = parse();
    if (TS.active) { const a = TS.active; TS.active = null; try { await a.leave(); } catch (e) { console.error(e); } }
    if (my !== token) return;
    const root = document.getElementById('main');
    markNav(name);
    document.title = TITLES[name] + ' — Talaba Studio';
    TS.clear(root).append(h('div', { class: 'loading', text: 'Yuklanmoqda…' }));
    try {
      await TS.views[name](root, param, { stale: () => my !== token });
    } catch (e) {
      console.error(e);
      if (my === token) TS.clear(root).append(h('div', { class: 'page' }, h('div', { class: 'notice error', role: 'alert' }, icon('alert', 18), h('div', { text: 'Sahifani ochib boʻlmadi: ' + (e.message || 'nomaʼlum xato') + '. Sahifani yangilang; saqlangan ishlaringiz oʻzgarmagan.' }))));
    }
    if (my === token) {
      // «yangi» marshrutdan keyin manzilni oddiy ko‘rinishga qaytaramiz (yangilashda yana yangi ish ochilmasin)
      if (param === 'yangi') history.replaceState(null, '', '#/' + name);
      window.scrollTo(0, 0);
      if (!busy) { busy = true; root.focus({ preventScroll: true }); busy = false; }
    }
  }
  TS.go = function (hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  };

  window.addEventListener('hashchange', route);
  /* Saqlanmagan o‘zgarish bo‘lsa, yopishdan oldin ogohlantirish */
  window.addEventListener('beforeunload', (e) => {
    if (TS.active && TS.active.dirty) { e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && TS.active && TS.active.dirty && TS.prefs.getAutosave()) TS.active.saveNow(false);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && TS.active) { e.preventDefault(); TS.active.saveNow(true); }
  });

  async function init() {
    TS.prefs.applyTheme();
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const on = () => { if (TS.prefs.getTheme() === 'system') { TS.prefs.applyTheme(); TS.syncThemeButtons(); } };
      if (mq.addEventListener) mq.addEventListener('change', on);
    }
    buildNav();
    ['theme-btn-side', 'theme-btn-top'].forEach((id) => document.getElementById(id).addEventListener('click', toggleTheme));
    TS.syncThemeButtons();
    await TS.store.init();
    if (TS.store.mode === 'memory') TS.toast('Brauzer xotirasi mavjud emas (maxfiy rejim boʻlishi mumkin): ishlar faqat shu oynada saqlanadi.', 'error', 9000);
    route();
  }
  init();
})();
