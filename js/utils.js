/* Talaba Studio — umumiy yordamchi funksiyalar (DOM, ikonkalar, xabarlar, dialoglar) */
(function () {
  'use strict';
  const TS = (window.TS = window.TS || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- Ikonkalar (ichki, doimiy SVG) ---------- */
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    article: '<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M8 9h7M8 13h5"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M4 20h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
    save: '<path d="M5 3h11l4 4v14H5z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
    text: '<path d="M5 6h14M12 6v13M9 19h6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    task: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>',
    sparkles: '<path d="M12 3l1.9 4.8L19 9.7l-4.1 3.5 1.3 5.3-4.2-2.8-4.2 2.8 1.3-5.3L4 9.7l5.1-1.9z"/>',
    refresh: '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    columns: '<rect x="3" y="3" width="8" height="18" rx="1.5"/><rect x="13" y="3" width="8" height="18" rx="1.5"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    telegram: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>'
  };

  function icon(name, size) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', size || 20);
    s.setAttribute('height', size || 20);
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.9');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.innerHTML = ICONS[name] || ''; // faqat yuqoridagi doimiy matnlar
    return s;
  }

  /* ---------- DOM yaratish (foydalanuvchi matni faqat textContent orqali) ---------- */
  const PROP_KEYS = new Set(['value', 'checked', 'disabled', 'selected']);
  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) {
      for (const k of Object.keys(props)) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.length > 2 && k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (PROP_KEYS.has(k)) el[k] = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (let i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach((x) => append(el, x));
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  }

  /* ---------- Kichik yordamchilar ---------- */
  const uid = () => 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  const words = (t) => ((t || '').trim().match(/\S+/g) || []).length;
  const chars = (t) => (t || '').length;
  const pad = (n) => String(n).padStart(2, '0');
  function fmtDate(ts) {
    const d = new Date(ts);
    if (isNaN(d)) return '—';
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function debounce(fn, ms) {
    let t;
    const w = function () {
      const a = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, a), ms);
    };
    w.flush = () => { clearTimeout(t); };
    return w;
  }
  function safeFileName(name, fallback) {
    const n = String(name || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return n || fallback || 'hujjat';
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* zaxira usuliga o‘tamiz */ }
    const ta = h('textarea', { 'aria-hidden': 'true', tabindex: '-1', style: { position: 'fixed', left: '-9999px', top: '0' } });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  /* ---------- Xabarlar (toast) ---------- */
  function toast(msg, type, ms) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = h('div', { class: 'toast toast-' + (type || 'info'), role: type === 'error' ? 'alert' : 'status' },
      icon(type === 'error' ? 'alert' : type === 'success' ? 'check' : 'info', 18),
      h('span', { text: msg }));
    box.appendChild(t);
    setTimeout(() => t.remove(), ms || (type === 'error' ? 7000 : 3800));
  }

  /* ---------- Dialoglar (<dialog> asosida) ---------- */
  function dialog(opts) {
    return new Promise((resolve) => {
      const dlg = h('dialog', { class: 'modal', 'aria-labelledby': 'dlg-title' });
      const form = h('form', { method: 'dialog' });
      const foot = h('div', { class: 'modal-foot' });
      (opts.actions || []).forEach((a) => {
        const b = h('button', { class: 'btn ' + (a.kind || 'ghost'), type: a.cancel ? 'button' : 'submit', value: a.value }, a.label);
        if (a.cancel) b.addEventListener('click', () => dlg.close(a.value));
        foot.appendChild(b);
      });
      form.append(h('h2', { id: 'dlg-title', class: 'modal-title', text: opts.title }), h('div', { class: 'modal-body' }, opts.content), foot);
      dlg.appendChild(form);
      dlg.addEventListener('close', () => {
        const v = dlg.returnValue;
        dlg.remove();
        resolve(v);
      });
      document.body.appendChild(dlg);
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      const first = dlg.querySelector('input,select,textarea');
      if (first) first.focus();
    });
  }
  async function confirmBox(title, message, o) {
    o = o || {};
    const content = Array.isArray(message) ? message : [message];
    const v = await dialog({
      title,
      content: content.map((m) => (m instanceof Node ? m : h('p', { text: m }))),
      actions: [
        { label: o.cancelLabel || 'Bekor qilish', value: 'cancel', cancel: true },
        { label: o.okLabel || 'Davom etish', value: 'ok', kind: o.danger ? 'danger' : 'primary' }
      ]
    });
    return v === 'ok';
  }
  async function promptBox(title, label, initial) {
    const input = h('input', { class: 'input', type: 'text', maxlength: '120', 'aria-label': label });
    input.value = initial || '';
    const v = await dialog({
      title,
      content: [h('label', { class: 'field' }, h('span', { class: 'label', text: label }), input)],
      actions: [
        { label: 'Bekor qilish', value: 'cancel', cancel: true },
        { label: 'Saqlash', value: 'ok', kind: 'primary' }
      ]
    });
    return v === 'ok' ? input.value.trim() : null;
  }
  function infoBox(title, nodes, okLabel) {
    return dialog({ title, content: nodes, actions: [{ label: okLabel || 'Tushunarli', value: 'ok', kind: 'primary' }] });
  }

  Object.assign(TS, { icon, h, clear, uid, words, chars, fmtDate, fmtTime, debounce, safeFileName, download, copyText, toast, dialog, confirmBox, promptBox, infoBox });
})();
