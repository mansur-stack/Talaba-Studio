/* Talaba Studio — saqlash: ishlar IndexedDB’da, sozlamalar localStorage’da */
(function () {
  'use strict';
  const TS = window.TS;
  const DB_NAME = 'talaba-studio';
  const STORE = 'projects';

  let dbPromise = null;
  let mode = 'idb'; // 'idb' | 'memory'
  const memory = new Map();

  const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((res, rej) => {
      if (!('indexedDB' in window) || !window.indexedDB) return rej(new Error('IndexedDB mavjud emas'));
      let req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { return rej(e); }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: 'id' });
          s.createIndex('updatedAt', 'updatedAt');
        }
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error || new Error('IndexedDB ochilmadi'));
      req.onblocked = () => rej(new Error('IndexedDB bloklangan'));
    });
    return dbPromise;
  }

  const store = {
    get mode() { return mode; },
    async init() {
      try { await open(); mode = 'idb'; } catch (e) { mode = 'memory'; }
      return mode;
    },
    async all() {
      if (mode === 'memory') return [...memory.values()].map(clone);
      const db = await open();
      return reqP(db.transaction(STORE).objectStore(STORE).getAll());
    },
    async get(id) {
      if (mode === 'memory') return memory.has(id) ? clone(memory.get(id)) : undefined;
      const db = await open();
      return reqP(db.transaction(STORE).objectStore(STORE).get(id));
    },
    async put(p) { return store.putMany([p]); },
    async putMany(list) {
      if (mode === 'memory') { list.forEach((p) => memory.set(p.id, clone(p))); return; }
      const db = await open();
      return new Promise((res, rej) => {
        let t;
        try { t = db.transaction(STORE, 'readwrite'); } catch (e) { return rej(e); }
        const st = t.objectStore(STORE);
        try { list.forEach((p) => st.put(p)); } catch (e) { try { t.abort(); } catch (x) { /* */ } return rej(e); }
        t.oncomplete = () => res();
        t.onerror = () => rej(t.error);
        t.onabort = () => rej(t.error || new Error('Saqlash bekor qilindi'));
      });
    },
    async remove(id) {
      if (mode === 'memory') { memory.delete(id); return; }
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).delete(id);
        t.oncomplete = () => res();
        t.onerror = () => rej(t.error);
        t.onabort = () => rej(t.error);
      });
    },
    async clear() {
      if (mode === 'memory') { memory.clear(); return; }
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).clear();
        t.oncomplete = () => res();
        t.onerror = () => rej(t.error);
        t.onabort = () => rej(t.error);
      });
    }
  };

  /* ---------- localStorage: mavzu va sozlamalar ---------- */
  const LS = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } }
  };

  const DEFAULT_FORMAT = {
    page: 'A4', font: 'Times New Roman', size: 14, lineSpacing: 1.5, indent: 1.25, align: 'justify',
    mTop: 2, mBottom: 2, mLeft: 3, mRight: 1.5, pageNumbers: true
  };
  const FONTS = ['Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Cambria'];

  const num = (v, min, max, d) => {
    v = parseFloat(String(v).replace(',', '.'));
    if (!isFinite(v)) return d;
    return Math.min(max, Math.max(min, v));
  };
  function sanitizeFormat(f) {
    f = f || {};
    const d = DEFAULT_FORMAT;
    return {
      page: f.page === 'Letter' ? 'Letter' : 'A4',
      font: FONTS.includes(f.font) ? f.font : d.font,
      size: num(f.size, 8, 24, d.size),
      lineSpacing: num(f.lineSpacing, 1, 3, d.lineSpacing),
      indent: num(f.indent, 0, 3, d.indent),
      align: ['left', 'justify'].includes(f.align) ? f.align : d.align,
      mTop: num(f.mTop, 0.5, 6, d.mTop),
      mBottom: num(f.mBottom, 0.5, 6, d.mBottom),
      mLeft: num(f.mLeft, 0.5, 6, d.mLeft),
      mRight: num(f.mRight, 0.5, 6, d.mRight),
      pageNumbers: f.pageNumbers !== false
    };
  }

  const prefs = {
    FONTS, DEFAULT_FORMAT,
    getTheme() { const t = LS.get('ts-theme', 'system'); return ['light', 'dark', 'system'].includes(t) ? t : 'system'; },
    setTheme(t) { LS.set('ts-theme', t); prefs.applyTheme(); },
    applyTheme() {
      const t = prefs.getTheme();
      const dark = t === 'dark' || (t === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#0b1226' : '#101a3d');
    },
    getFormat() { return sanitizeFormat(LS.get('ts-format', DEFAULT_FORMAT)); },
    setFormat(f) { return LS.set('ts-format', sanitizeFormat(f)); },
    resetFormat() { LS.del('ts-format'); },
    sanitizeFormat,
    getAutosave() { return LS.get('ts-autosave', true) !== false; },
    setAutosave(v) { LS.set('ts-autosave', !!v); },
    getLastId(type) { return LS.get('ts-last-' + type, null); },
    setLastId(type, id) { if (id) LS.set('ts-last-' + type, id); else LS.del('ts-last-' + type); },
    getFlag(k, d) { return LS.get('ts-flag-' + k, d); },
    setFlag(k, v) { LS.set('ts-flag-' + k, v); }
  };

  TS.store = store;
  TS.prefs = prefs;
})();
