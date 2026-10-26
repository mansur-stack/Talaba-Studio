/* Talaba Studio — umumiy muharrir yordamchilari (maydonlar, avto-saqlash, format paneli) va
   Referat, Kurs ishi (BMI), Mustaqil ish hamda Maqola ko‘rinishlari */
(function () {
  'use strict';
  const TS = window.TS;
  const { h, icon } = TS;
  const M = TS.model;
  TS.views = TS.views || {};
  const ui = (TS.ui = {});

  /* ---------- Maydon (label + input/textarea + sanagich + vositalar) ---------- */
  ui.field = function (label, o) {
    o = o || {};
    const id = TS.uid();
    const el = o.multi
      ? h('textarea', { class: 'textarea', id, rows: o.rows || 6, placeholder: o.ph, spellcheck: 'false' })
      : h('input', { class: 'input', id, type: o.type || 'text', placeholder: o.ph, maxlength: o.max || 400, spellcheck: 'false', autocomplete: 'off' });
    el.value = o.value || '';
    const cnt = o.counter ? h('div', { class: 'counter' }) : null;
    const upd = () => { if (cnt) { TS.clear(cnt).append(h('span', { text: TS.words(el.value) + ' soʻz' }), h('span', { text: TS.chars(el.value) + ' belgi' })); } };
    el.addEventListener('input', () => { if (o.onInput) o.onInput(el.value); upd(); });
    upd();

    let tools = null;
    if (o.multi) {
      const cleanBtn = h('button', {
        class: 'btn-tiny', type: 'button', title: 'Apostroflar, tirelar va boʻshliqlarni toʻgʻrilash',
        onclick: () => {
          if (!el.value.trim()) return;
          el.value = M.cleanUzText(el.value);
          if (o.onInput) o.onInput(el.value);
          upd();
          TS.toast('Matn tozalandi va standartlandi.', 'success', 2000);
        }
      }, icon('sparkles', 13), 'Tozalash');

      const translitBtn = h('button', {
        class: 'btn-tiny', type: 'button', title: 'Lotin ⇄ Kirill alifbosiga oʻgirish',
        onclick: () => {
          if (!el.value.trim()) return;
          el.value = M.translitUz(el.value);
          if (o.onInput) o.onInput(el.value);
          upd();
          TS.toast('Alifbo oʻgirildi.', 'success', 2000);
        }
      }, icon('refresh', 13), 'Lotin ⇄ Kirill');

      tools = h('div', { class: 'field-tools' }, cleanBtn, translitBtn);
    }

    const head = h('div', { class: 'field-head' }, h('label', { class: 'label', for: id, text: label }), tools);

    return h('div', { class: 'field ' + (o.cls || '') },
      head, el,
      o.hint ? h('span', { class: 'hint', text: o.hint }) : null, cnt);
  };

  ui.pageHead = (title, desc, extra) => h('div', { class: 'page-head' }, h('div', null, h('h1', { text: title }), desc ? h('p', { text: desc }) : null), extra || null);

  /* ---------- Sessiya: avto-saqlash va holat ---------- */
  function isBlank(p) {
    const d = p.data;
    if (p.type === 'referat' || p.type === 'kurs' || p.type === 'mustaqil') {
      return !d.sections.length && !Object.keys(d.meta).some((k) => k !== 'year' && d.meta[k].trim());
    }
    if (p.type === 'maqola') {
      return !['title', 'author', 'institution', 'supervisor', 'abstract', 'keywords', 'intro', 'main', 'conclusion'].some((k) => d[k].trim()) && !d.refs.length;
    }
    return !d.slides.length && !d.meta.topic.trim() && !d.meta.author.trim() && !d.meta.group.trim();
  }

  ui.createSession = function (p, persisted) {
    const s = { p, persisted: !!persisted, dirty: false, timer: null, queue: Promise.resolve(), listeners: [], errToastAt: 0, nameInput: null };
    s.statusEl = h('span', { class: 'save-state', role: 'status' });
    s.setStatus = (kind, text) => {
      s.statusEl.className = 'save-state ' + kind;
      TS.clear(s.statusEl).append(icon(kind === 'ok' ? 'check' : kind === 'err' ? 'alert' : 'save', 16), text);
    };
    s.setStatus(persisted ? 'ok' : 'busy', persisted ? 'Saqlangan' : 'Yangi ish');
    const doSave = async (manual) => {
      if (!manual && !TS.prefs.getAutosave()) return;
      if (!manual && !s.persisted && isBlank(p)) { s.dirty = false; return; }
      s.setStatus('busy', 'Saqlanmoqda…');
      p.updatedAt = Date.now();
      M.autoName(p);
      try {
        await TS.store.put(p);
        s.persisted = true; s.dirty = false;
        TS.prefs.setLastId(p.type, p.id);
        if (TS.store.mode === 'memory') s.setStatus('err', 'Faqat shu oynada (brauzer xotirasi ishlamayapti)');
        else s.setStatus('ok', 'Saqlandi ' + TS.fmtTime(Date.now()).slice(0, 5));
      } catch (e) {
        console.error(e);
        s.setStatus('err', 'Saqlanmadi');
        if (Date.now() - s.errToastAt > 20000) {
          s.errToastAt = Date.now();
          const full = e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message)));
          TS.toast(full ? 'Brauzer xotirasi toʻlgan. Eski ishlarni oʻchiring yoki JSON zaxira yuklab oling. Matningiz shu sahifada saqlanib turibdi.' : 'Saqlab boʻlmadi. Matningiz shu sahifada saqlanib turibdi — eksport qilib qoʻying. (' + ((e && e.message) || 'xato') + ')', 'error', 9000);
        }
      }
    };
    s.saveNow = (manual) => { s.queue = s.queue.then(() => doSave(manual)); return s.queue; };
    s.touch = () => {
      s.dirty = true;
      M.autoName(p);
      if (s.nameInput && p.nameAuto) s.nameInput.value = p.name;
      s.listeners.forEach((f) => f());
      clearTimeout(s.timer);
      if (TS.prefs.getAutosave()) {
        s.setStatus('busy', 'Oʻzgarishlar…');
        s.timer = setTimeout(() => s.saveNow(false), 900);
      } else s.setStatus('busy', 'Saqlanmagan oʻzgarishlar');
    };
    s.onTouch = (f) => s.listeners.push(f);
    s.leave = async () => {
      clearTimeout(s.timer);
      if (!s.dirty) return;
      if (TS.prefs.getAutosave()) { await s.saveNow(false); return; }
      const ok = await TS.confirmBox('Saqlanmagan oʻzgarishlar', 'Avto-saqlash oʻchirilgan. Oʻzgarishlarni saqlaysizmi?', { okLabel: 'Saqlash', cancelLabel: 'Saqlamasdan chiqish' });
      if (ok) await s.saveNow(true);
    };
    TS.active = s;
    return s;
  };

  ui.loadProject = async function (type, param) {
    if (param === 'yangi') { TS.prefs.setLastId(type, null); return { p: M.newProject(type), persisted: false }; }
    const id = param || TS.prefs.getLastId(type);
    if (id) {
      try {
        const raw = await TS.store.get(id);
        if (raw && raw.type === type) {
          const p = M.normalize(raw);
          if (p) { p.id = raw.id; return { p, persisted: true }; }
        } else if (param) TS.toast('Bu ish topilmadi — yangisi ochildi.', 'error');
      } catch (e) { console.error(e); TS.toast('Saqlangan ishni ochib boʻlmadi.', 'error'); }
    }
    return { p: M.newProject(type), persisted: false };
  };

  /* ---------- Muharrir paneli: ish nomi, holat, Saqlash, Yangi ---------- */
  ui.projectBar = function (sess, o) {
    const p = sess.p;
    const name = h('input', { class: 'input', type: 'text', maxlength: '120', 'aria-label': 'Ish nomi', placeholder: 'Ish nomi' });
    name.value = p.name;
    name.style.maxWidth = '320px';
    name.addEventListener('input', () => { p.name = name.value; p.nameAuto = false; sess.touch(); });
    sess.nameInput = name;
    const saveBtn = h('button', { class: 'btn sm', type: 'button', onclick: async () => { await sess.saveNow(true); if (sess.persisted && !sess.dirty) TS.toast('Ish saqlandi.', 'success', 2200); } }, icon('save', 16), 'Saqlash');
    const newBtn = h('button', { class: 'btn sm', type: 'button', onclick: async () => { await sess.leave(); o.onNew(); } }, icon('plus', 16), 'Yangi');
    return h('div', { class: 'editor-bar' }, name, sess.statusEl, h('span', { class: 'spacer' }), saveBtn, newBtn);
  };

  ui.libNotice = function (need) {
    if (need === 'docx' && !window.docx) return h('div', { class: 'notice error', role: 'alert' }, icon('alert', 18), h('div', { text: 'DOCX kutubxonasi yuklanmadi — DOCX eksport ishlamaydi. Muharrir, TXT va PDF ishlayveradi.' }));
    if (need === 'pptx' && !window.PptxGenJS) return h('div', { class: 'notice error', role: 'alert' }, icon('alert', 18), h('div', { text: 'PPTX kutubxonasi yuklanmadi — PPTX eksport ishlamaydi. Slaydlarni tahrirlash va namoyish ishlayveradi.' }));
    return null;
  };

  /* ---------- Hujjat formati paneli ---------- */
  ui.formatPanel = function (fmt, onChange, o) {
    o = o || {};
    const refs = {};
    const sel = (key, label, opts) => {
      const id = TS.uid();
      const s = h('select', { class: 'select', id }, opts.map(([v, t]) => h('option', { value: v, text: t })));
      refs[key] = s;
      s.addEventListener('change', apply);
      return h('div', { class: 'field' }, h('label', { class: 'label', for: id, text: label }), s);
    };
    const num = (key, label, min, max, step) => {
      const id = TS.uid();
      const i = h('input', { class: 'input', id, type: 'number', min, max, step, inputmode: 'decimal' });
      refs[key] = i;
      i.addEventListener('change', apply);
      return h('div', { class: 'field' }, h('label', { class: 'label', for: id, text: label }), i);
    };
    const pn = h('input', { type: 'checkbox' });
    refs.pageNumbers = pn;
    pn.addEventListener('change', apply);
    function read() {
      return {
        page: refs.page.value, font: refs.font.value, size: refs.size.value, lineSpacing: refs.lineSpacing.value, indent: refs.indent.value,
        align: refs.align.value, mTop: refs.mTop.value, mBottom: refs.mBottom.value, mLeft: refs.mLeft.value, mRight: refs.mRight.value, pageNumbers: pn.checked
      };
    }
    function sync() {
      Object.keys(refs).forEach((k) => { if (k === 'pageNumbers') pn.checked = !!fmt.pageNumbers; else refs[k].value = String(fmt[k]); });
    }
    function apply() { Object.assign(fmt, TS.prefs.sanitizeFormat(read())); sync(); onChange(fmt); }
    const grid = h('div', { class: 'grid c4' },
      sel('page', 'Qogʻoz', [['A4', 'A4'], ['Letter', 'Letter']]),
      sel('font', 'Shrift', TS.prefs.FONTS.map((f) => [f, f])),
      num('size', 'Shrift oʻlchami (pt)', 8, 24, 0.5),
      num('lineSpacing', 'Qator oraligʻi', 1, 3, 0.05),
      num('indent', 'Abzats boshi (sm)', 0, 3, 0.05),
      sel('align', 'Matn tekislanishi', [['justify', 'Ikki chetga'], ['left', 'Chapga']]),
      num('mLeft', 'Chap chet (sm)', 0.5, 6, 0.1), num('mRight', 'Oʻng chet (sm)', 0.5, 6, 0.1),
      num('mTop', 'Yuqori chet (sm)', 0.5, 6, 0.1), num('mBottom', 'Pastki chet (sm)', 0.5, 6, 0.1));
    sync();
    const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { Object.assign(fmt, TS.prefs.DEFAULT_FORMAT); sync(); onChange(fmt); TS.toast('Boshlangʻich format tiklandi.', 'success', 2200); } }, 'Boshlangʻich formatga qaytarish');
    const inner = h('div', { class: 'inner stack' },
      h('p', { class: 'hint', text: 'Boshlangʻich format: A4, Times New Roman 14 pt, 1,5 qator oraligʻi, chap 3 sm, oʻng 1,5 sm, yuqori va past 2 sm. Bu hamma universitetlar uchun majburiy standart emas — oʻz kafedrangiz talabiga moslab oʻzgartiring.' }),
      grid,
      h('div', { class: 'row' }, h('label', { class: 'check' }, pn, h('span', { text: 'Sahifa raqamlari (DOCX)' })), h('span', { class: 'spacer' }), o.noReset ? null : reset));
    const el = h('details', { class: 'details' }, h('summary', null, icon('settings', 18), 'Hujjat formati'), inner);
    return { el, sync };
  };

  /* ---------- Eksport tugmalari ---------- */
  ui.exportCard = function (p, sess, items, note) {
    const row = h('div', { class: 'export-grid' });
    items.forEach(([kind, label, ic, kindClass]) => {
      const b = h('button', { class: 'btn ' + (kindClass || ''), type: 'button' }, icon(ic, 18), label);
      b.addEventListener('click', async () => { await sess.saveNow(false); TS.exporter.run(p, kind, b); });
      row.appendChild(b);
    });
    return h('section', { class: 'card', 'aria-labelledby': 'exp-h' },
      h('h2', { id: 'exp-h', text: 'Yuklab olish' }),
      h('p', { class: 'sub', text: note || 'Eksportdan oldin boʻsh boʻlimlar haqida ogohlantiramiz. Boʻsh boʻlimlar hujjatga kiritilmaydi.' }), row);
  };

  const PH = {
    intro: 'Kirish matnini shu yerga yozing yoki tayyor matningizni joylashtiring. Har bir yangi qator — yangi abzats.',
    main: 'Bu boʻlim matnini oʻzingiz yozing yoki tayyor matningizni joylashtiring. Har bir yangi qator — yangi abzats.',
    ch1: '1-bob matnini va fasllarini shu yerga kiriting.',
    ch2: '2-bob matnini va fasllarini shu yerga kiriting.',
    ch3: '3-bob matnini va takliflarini shu yerga kiriting.',
    conclusion: 'Xulosa va takliflar matnini shu yerga kiriting.',
    refs: 'Har bir manbani alohida qatorga yozing. Raqamlash eksportda avtomatik qoʻyiladi.',
    appendix: 'Ilovalar matni, statistik jadvallar yoki hisob-kitoblar roʻyxati.',
    custom: 'Bu boʻlim matnini shu yerga kiriting. Har bir yangi qator — yangi abzats.'
  };

  /* ============================== REFERAT ============================== */
  TS.views.referat = async function (root, param, ctx) {
    const { p, persisted } = await ui.loadProject('referat', param);
    if (ctx.stale()) return;
    const sess = ui.createSession(p, persisted);
    const d = p.data;
    TS.clear(root);

    const metaGrid = h('div', { class: 'grid c3' });
    M.REFERAT_META.forEach(([k, label]) => {
      metaGrid.appendChild(ui.field(label, { value: d.meta[k], cls: k === 'topic' ? 'span-all' : '', ph: k === 'topic' ? 'Referat mavzusini kiriting' : '', onInput: (v) => { d.meta[k] = v; sess.touch(); } }));
    });
    const nMain = h('input', { class: 'input', id: 'nmain', type: 'number', min: 1, max: 10, value: Math.max(1, d.sections.filter((s) => s.kind === 'main').length || 3), 'aria-label': 'Asosiy boʻlimlar soni' });
    nMain.style.maxWidth = '110px';
    const buildBtn = h('button', { class: 'btn primary', type: 'button' });
    const setBuildLabel = () => { TS.clear(buildBtn).append(icon('doc', 18), d.sections.length ? 'Tuzilmani qayta yaratish' : 'Tuzilma yaratish'); };
    setBuildLabel();
    buildBtn.addEventListener('click', async () => {
      const n = Math.min(10, Math.max(1, parseInt(nMain.value, 10) || 3));
      nMain.value = n;
      if (d.sections.some((s) => s.body.trim() || (s.kind === 'main' && s.title.trim()))) {
        const ok = await TS.confirmBox('Tuzilma qayta yaratilsinmi?', 'Hozirgi boʻlimlar va ularga kiritilgan matnlar oʻchib ketadi. Davom etasizmi?', { okLabel: 'Qayta yaratish', danger: true });
        if (!ok) return;
      }
      d.sections = M.referatStructure(n);
      sess.touch(); sess.saveNow(false); setBuildLabel(); renderSections();
      TS.toast('Tuzilma yaratildi. Endi matnlarni kiriting.', 'success', 2600);
    });

    const secRegion = h('div');
    const planList = h('ol', { class: 'steps', style: { margin: 0 } });
    const totals = h('div', { class: 'counter' });
    const updTotals = () => {
      const s = M.stats(p);
      TS.clear(totals).append(h('span', { text: 'Jami: ' + s.words + ' soʻz' }), h('span', { text: s.chars + ' belgi' }));
    };
    const renderPlan = () => {
      TS.clear(planList);
      const titled = d.sections.filter((s) => s.title.trim());
      if (!titled.length) { planList.appendChild(h('li', { class: 'hint', text: 'Boʻlim sarlavhalari kiritilgach, reja shu yerda avtomatik paydo boʻladi.' })); return; }
      titled.forEach((s) => planList.appendChild(h('li', null, s.title.trim(), s.body.trim() ? null : h('span', { class: 'hint', text: ' — matn yoʻq, rejaga kirmaydi' }))));
    };
    sess.onTouch(() => { updTotals(); renderPlan(); });

    function renderSections(focusSel) {
      TS.clear(secRegion);
      if (!d.sections.length) {
        secRegion.appendChild(h('div', { class: 'empty' }, h('h3', { text: 'Tuzilma hali yaratilmagan' }), h('p', { text: 'Yuqoridagi maʼlumotlarni kiriting va «Tuzilma yaratish» tugmasini bosing — titul varagʻi, reja, kirish, asosiy boʻlimlar, xulosa va adabiyotlar boʻlimlari tayyor boʻladi.' })));
        updTotals(); renderPlan();
        return;
      }
      let mainIdx = 0;
      d.sections.forEach((s, i) => {
        if (s.kind === 'main') mainIdx++;
        const kindText = s.kind === 'main' ? 'Asosiy boʻlim ' + mainIdx : (M.KIND_LABEL[s.kind] || 'Boʻlim');
        const ti = h('input', { class: 'input', type: 'text', maxlength: '300', spellcheck: 'false', 'aria-label': 'Sarlavha — ' + kindText, placeholder: s.kind === 'main' || s.kind === 'custom' ? 'Boʻlim sarlavhasi' : 'Sarlavha' });
        ti.value = s.title;
        ti.addEventListener('input', () => { s.title = ti.value; sess.touch(); });
        const mv = (dir) => {
          const j = i + dir;
          if (j < 0 || j >= d.sections.length) return;
          [d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]];
          sess.touch(); renderSections('[data-sec="' + s.id + '"] [data-act="' + (dir < 0 ? 'up' : 'down') + '"]');
        };
        const del = async () => {
          if (s.body.trim() || s.title.trim()) {
            const ok = await TS.confirmBox('Boʻlimni oʻchirish', '«' + (s.title.trim() || kindText) + '» boʻlimi va uning matni oʻchiriladi. Davom etasizmi?', { okLabel: 'Oʻchirish', danger: true });
            if (!ok) return;
          }
          d.sections.splice(i, 1); sess.touch(); setBuildLabel(); renderSections();
        };
        const act = (name, ic, label, fn, dis) => h('button', { class: 'btn icon sm', type: 'button', 'aria-label': label + ' — ' + kindText, title: label, dataset: { act: name }, disabled: dis, onclick: fn }, icon(ic, 16));
        const body = ui.field('Matn', {
          value: s.body, multi: true, rows: s.kind === 'refs' ? 5 : 9, counter: true, ph: PH[s.kind] || PH.custom,
          onInput: (v) => { s.body = v; sess.touch(); }
        });
        secRegion.appendChild(h('section', { class: 'sec-card', dataset: { sec: s.id }, 'aria-label': kindText },
          h('div', { class: 'sec-head' }, h('span', { class: 'kind', text: kindText }), ti,
            act('up', 'up', 'Yuqoriga', () => mv(-1), i === 0), act('down', 'down', 'Pastga', () => mv(1), i === d.sections.length - 1), act('del', 'trash', 'Oʻchirish', del)),
          body));
      });
      const add = h('button', { class: 'btn', type: 'button', style: { marginTop: '14px' }, onclick: () => {
        let at = d.sections.findIndex((s) => s.kind === 'conclusion');
        if (at < 0) at = d.sections.length;
        const ns = M.section('custom', '');
        d.sections.splice(at, 0, ns);
        sess.touch(); renderSections('[data-sec="' + ns.id + '"] input');
      } }, icon('plus', 18), 'Boʻlim qoʻshish');
      secRegion.appendChild(add);
      updTotals(); renderPlan();
      if (focusSel) { const f = secRegion.querySelector(focusSel); if (f) f.focus(); }
    }

    const fmtPanel = ui.formatPanel(d.format, () => sess.touch());
    root.append(h('div', { class: 'page' },
      ui.pageHead('Referat tayyorlash', 'Matningizni kiriting — hujjatni tartiblang. Platforma matn yozib bermaydi: u tuzilma, format va eksportni oʻz zimmasiga oladi.', h('span', { class: 'badge ok' }, icon('shield', 14), 'APIʼsiz ishlaydi')),
      ui.projectBar(sess, { onNew: () => TS.go('#/referat/yangi') }),
      ui.libNotice('docx'),
      h('div', { class: 'stack' },
        h('section', { class: 'card' },
          h('h2', { text: 'Titul varagʻi maʼlumotlari' }),
          h('p', { class: 'sub', text: 'Kiritilmagan maydonlar titul varagʻida chiqmaydi.' }),
          metaGrid,
          h('div', { class: 'row', style: { marginTop: '16px' } },
            h('label', { class: 'label', for: 'nmain', text: 'Asosiy boʻlimlar soni' }), nMain, buildBtn)),
        h('section', { class: 'card' }, h('h2', { text: 'Reja' }), h('p', { class: 'sub', text: 'Boʻlim sarlavhalaridan avtomatik tuziladi (sahifa raqamlarisiz).' }), planList),
        h('div', null, h('div', { class: 'section-title', style: { margin: '6px 0 12px' } }, h('h2', { text: 'Boʻlimlar' }), totals), secRegion),
        fmtPanel.el,
        ui.exportCard(p, sess, [['docx', 'DOCX', 'download', 'primary'], ['pdf', 'PDF (chop etish)', 'print'], ['txt', 'TXT', 'text'], ['copy', 'Matnni nusxalash', 'copy']]))));
    renderSections();
    updTotals();
  };

  /* ============================== KURS ISHI (BMI) ============================== */
  TS.views.kurs = async function (root, param, ctx) {
    const { p, persisted } = await ui.loadProject('kurs', param);
    if (ctx.stale()) return;
    const sess = ui.createSession(p, persisted);
    const d = p.data;
    TS.clear(root);

    const metaGrid = h('div', { class: 'grid c3' });
    M.KURS_META.forEach(([k, label]) => {
      metaGrid.appendChild(ui.field(label, {
        value: d.meta[k],
        cls: (k === 'topic' || k === 'supervisor' || k === 'reviewer') ? 'span-all' : '',
        ph: k === 'topic' ? 'Kurs ishi mavzusini kiriting' : '',
        onInput: (v) => { d.meta[k] = v; sess.touch(); }
      }));
    });

    const nChapters = h('input', { class: 'input', id: 'nkurs', type: 'number', min: 2, max: 4, value: Math.max(2, d.sections.filter((s) => s.kind.startsWith('ch')).length || 2), 'aria-label': 'Boblar soni' });
    nChapters.style.maxWidth = '110px';
    const buildBtn = h('button', { class: 'btn primary', type: 'button' });
    const setBuildLabel = () => { TS.clear(buildBtn).append(icon('book', 18), d.sections.length ? 'Tuzilmani qayta yaratish' : 'Tuzilma yaratish'); };
    setBuildLabel();

    buildBtn.addEventListener('click', async () => {
      const n = Math.min(4, Math.max(2, parseInt(nChapters.value, 10) || 2));
      nChapters.value = n;
      if (d.sections.some((s) => s.body.trim())) {
        const ok = await TS.confirmBox('Tuzilma qayta yaratilsinmi?', 'Hozirgi boblar va kiritilgan matnlar oʻchib ketadi. Davom etasizmi?', { okLabel: 'Qayta yaratish', danger: true });
        if (!ok) return;
      }
      d.sections = M.kursStructure(n);
      sess.touch(); sess.saveNow(false); setBuildLabel(); renderSections();
      TS.toast('Kurs ishi tuzilmasi tayyorlandi.', 'success', 2600);
    });

    const secRegion = h('div');
    const planList = h('ol', { class: 'steps', style: { margin: 0 } });
    const totals = h('div', { class: 'counter' });
    const updTotals = () => {
      const s = M.stats(p);
      TS.clear(totals).append(h('span', { text: 'Jami: ' + s.words + ' soʻz' }), h('span', { text: s.chars + ' belgi' }));
    };
    const renderPlan = () => {
      TS.clear(planList);
      const titled = d.sections.filter((s) => s.title.trim());
      if (!titled.length) { planList.appendChild(h('li', { class: 'hint', text: 'Bob sarlavhalari kiritilgach, mundarija shu yerda avtomatik aks etadi.' })); return; }
      titled.forEach((s) => planList.appendChild(h('li', null, s.title.trim())));
    };
    sess.onTouch(() => { updTotals(); renderPlan(); });

    function renderSections(focusSel) {
      TS.clear(secRegion);
      if (!d.sections.length) {
        secRegion.appendChild(h('div', { class: 'empty' }, h('h3', { text: 'Tuzilma hali yaratilmagan' }), h('p', { text: 'Yuqoridagi maʼlumotlarni toʻldiring va «Tuzilma yaratish» tugmasini bosing — titul varagʻi, mundarija, kirish, 1-bob, 2-bob, xulosa va adabiyotlar tuzilmasi tayyorlanadi.' })));
        updTotals(); renderPlan();
        return;
      }
      d.sections.forEach((s, i) => {
        const kindText = M.KIND_LABEL[s.kind] || 'Boʻlim';
        const ti = h('input', { class: 'input', type: 'text', maxlength: '300', spellcheck: 'false', 'aria-label': 'Sarlavha — ' + kindText, placeholder: 'Sarlavha' });
        ti.value = s.title;
        ti.addEventListener('input', () => { s.title = ti.value; sess.touch(); });

        const mv = (dir) => {
          const j = i + dir;
          if (j < 0 || j >= d.sections.length) return;
          [d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]];
          sess.touch(); renderSections('[data-sec="' + s.id + '"] [data-act="' + (dir < 0 ? 'up' : 'down') + '"]');
        };
        const del = async () => {
          if (s.body.trim() || s.title.trim()) {
            const ok = await TS.confirmBox('Boʻlimni oʻchirish', '«' + (s.title.trim() || kindText) + '» oʻchiriladi. Davom etasizmi?', { okLabel: 'Oʻchirish', danger: true });
            if (!ok) return;
          }
          d.sections.splice(i, 1); sess.touch(); setBuildLabel(); renderSections();
        };
        const act = (name, ic, label, fn, dis) => h('button', { class: 'btn icon sm', type: 'button', 'aria-label': label + ' — ' + kindText, title: label, dataset: { act: name }, disabled: dis, onclick: fn }, icon(ic, 16));
        const body = ui.field('Matn (fasllar: 1.1, 1.2 koʻrinishida yozing)', {
          value: s.body, multi: true, rows: s.kind === 'refs' ? 6 : 12, counter: true, ph: PH[s.kind] || PH.custom,
          onInput: (v) => { s.body = v; sess.touch(); }
        });
        secRegion.appendChild(h('section', { class: 'sec-card', dataset: { sec: s.id }, 'aria-label': kindText },
          h('div', { class: 'sec-head' }, h('span', { class: 'kind', text: kindText }), ti,
            act('up', 'up', 'Yuqoriga', () => mv(-1), i === 0), act('down', 'down', 'Pastga', () => mv(1), i === d.sections.length - 1), act('del', 'trash', 'Oʻchirish', del)),
          body));
      });
      const add = h('button', { class: 'btn', type: 'button', style: { marginTop: '14px' }, onclick: () => {
        let at = d.sections.findIndex((s) => s.kind === 'conclusion');
        if (at < 0) at = d.sections.length;
        const ns = M.section('custom', 'Qoʻshimcha boʻlim');
        d.sections.splice(at, 0, ns);
        sess.touch(); renderSections('[data-sec="' + ns.id + '"] input');
      } }, icon('plus', 18), 'Boʻlim / Bob qoʻshish');
      secRegion.appendChild(add);
      updTotals(); renderPlan();
      if (focusSel) { const f = secRegion.querySelector(focusSel); if (f) f.focus(); }
    }

    const fmtPanel = ui.formatPanel(d.format, () => sess.touch());
    root.append(h('div', { class: 'page' },
      ui.pageHead('Kurs ishi / BMI tayyorlash', 'Kurs ishi yoki diplom ishi (BMI) uchun rasmiy OTM talablariga mos tuzilma, titul varagʻi va boblarni shakllantiring.', h('span', { class: 'badge ok' }, icon('shield', 14), 'APIʼsiz ishlaydi')),
      ui.projectBar(sess, { onNew: () => TS.go('#/kurs/yangi') }),
      ui.libNotice('docx'),
      h('div', { class: 'stack' },
        h('section', { class: 'card' },
          h('h2', { text: 'Titul varagʻi va kafedra maʼlumotlari' }),
          h('p', { class: 'sub', text: 'Kafedra mudiri, ilmiy rahbar va taʼlim yoʻnalishi toʻliq titul varagʻiga tushadi.' }),
          metaGrid,
          h('div', { class: 'row', style: { marginTop: '16px' } },
            h('label', { class: 'label', for: 'nkurs', text: 'Asosiy boblar soni' }), nChapters, buildBtn)),
        h('section', { class: 'card' }, h('h2', { text: 'Mundarija' }), h('p', { class: 'sub', text: 'Bob sarlavhalaridan avtomatik shakllanadi; har bir bob yangi sahifadan boshlanadi.' }), planList),
        h('div', null, h('div', { class: 'section-title', style: { margin: '6px 0 12px' } }, h('h2', { text: 'Boblar va boʻlimlar' }), totals), secRegion),
        fmtPanel.el,
        ui.exportCard(p, sess, [['docx', 'DOCX yuklab olish', 'download', 'primary'], ['pdf', 'PDF (chop etish)', 'print'], ['txt', 'TXT', 'text'], ['copy', 'Matnni nusxalash', 'copy']], 'DOCX formatida har bir bob avtomatik yangi sahifadan boshlanadi va sahifa raqamlari qoʻyiladi.'))));
    renderSections();
    updTotals();
  };

  /* ============================== MUSTAQIL ISH ============================== */
  TS.views.mustaqil = async function (root, param, ctx) {
    const { p, persisted } = await ui.loadProject('mustaqil', param);
    if (ctx.stale()) return;
    const sess = ui.createSession(p, persisted);
    const d = p.data;
    TS.clear(root);

    const metaGrid = h('div', { class: 'grid c3' });
    M.MUSTAQIL_META.forEach(([k, label]) => {
      metaGrid.appendChild(ui.field(label, { value: d.meta[k], cls: k === 'topic' ? 'span-all' : '', ph: k === 'topic' ? 'Mustaqil ish mavzusi' : '', onInput: (v) => { d.meta[k] = v; sess.touch(); } }));
    });
    const nQ = h('input', { class: 'input', id: 'nmustaqil', type: 'number', min: 1, max: 8, value: Math.max(1, d.sections.filter((s) => s.kind === 'main').length || 3), 'aria-label': 'Savollar soni' });
    nQ.style.maxWidth = '110px';
    const buildBtn = h('button', { class: 'btn primary', type: 'button' });
    const setBuildLabel = () => { TS.clear(buildBtn).append(icon('task', 18), d.sections.length ? 'Topshiriqlarni qayta tuzish' : 'Tuzilma yaratish'); };
    setBuildLabel();

    buildBtn.addEventListener('click', async () => {
      const n = Math.min(8, Math.max(1, parseInt(nQ.value, 10) || 3));
      nQ.value = n;
      if (d.sections.some((s) => s.body.trim())) {
        const ok = await TS.confirmBox('Tuzilma qayta yaratilsinmi?', 'Hozirgi savollar va kiritilgan yechimlar oʻchib ketadi. Davom etasizmi?', { okLabel: 'Qayta yaratish', danger: true });
        if (!ok) return;
      }
      d.sections = M.mustaqilStructure(n);
      sess.touch(); sess.saveNow(false); setBuildLabel(); renderSections();
      TS.toast('Mustaqil ish topshiriqlari tayyorlandi.', 'success', 2600);
    });

    const secRegion = h('div');
    const planList = h('ol', { class: 'steps', style: { margin: 0 } });
    const totals = h('div', { class: 'counter' });
    const updTotals = () => {
      const s = M.stats(p);
      TS.clear(totals).append(h('span', { text: 'Jami: ' + s.words + ' soʻz' }), h('span', { text: s.chars + ' belgi' }));
    };
    const renderPlan = () => {
      TS.clear(planList);
      const titled = d.sections.filter((s) => s.title.trim());
      if (!titled.length) { planList.appendChild(h('li', { class: 'hint', text: 'Savollar kiritilgach, reja shu yerda chiqadi.' })); return; }
      titled.forEach((s) => planList.appendChild(h('li', null, s.title.trim())));
    };
    sess.onTouch(() => { updTotals(); renderPlan(); });

    function renderSections(focusSel) {
      TS.clear(secRegion);
      if (!d.sections.length) {
        secRegion.appendChild(h('div', { class: 'empty' }, h('h3', { text: 'Topshiriqlar tuzilmagan' }), h('p', { text: 'Savollar sonini tanlang va «Tuzilma yaratish» tugmasini bosing.' })));
        updTotals(); renderPlan();
        return;
      }
      d.sections.forEach((s, i) => {
        const kindText = s.kind === 'main' ? (i + 1) + '-savol' : (M.KIND_LABEL[s.kind] || 'Boʻlim');
        const ti = h('input', { class: 'input', type: 'text', maxlength: '300', spellcheck: 'false', 'aria-label': 'Sarlavha — ' + kindText, placeholder: 'Topshiriq / Savol sarlavhasi' });
        ti.value = s.title;
        ti.addEventListener('input', () => { s.title = ti.value; sess.touch(); });

        const mv = (dir) => {
          const j = i + dir;
          if (j < 0 || j >= d.sections.length) return;
          [d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]];
          sess.touch(); renderSections('[data-sec="' + s.id + '"] [data-act="' + (dir < 0 ? 'up' : 'down') + '"]');
        };
        const del = async () => {
          if (s.body.trim() || s.title.trim()) {
            const ok = await TS.confirmBox('Savolni oʻchirish', '«' + (s.title.trim() || kindText) + '» oʻchiriladi. Davom etasizmi?', { okLabel: 'Oʻchirish', danger: true });
            if (!ok) return;
          }
          d.sections.splice(i, 1); sess.touch(); setBuildLabel(); renderSections();
        };
        const act = (name, ic, label, fn, dis) => h('button', { class: 'btn icon sm', type: 'button', 'aria-label': label + ' — ' + kindText, title: label, dataset: { act: name }, disabled: dis, onclick: fn }, icon(ic, 16));
        const body = ui.field('Javob / Yechim matni', {
          value: s.body, multi: true, rows: s.kind === 'refs' ? 5 : 8, counter: true, ph: 'Topshiriq boʻyicha javob matnini kiriting...',
          onInput: (v) => { s.body = v; sess.touch(); }
        });
        secRegion.appendChild(h('section', { class: 'sec-card', dataset: { sec: s.id }, 'aria-label': kindText },
          h('div', { class: 'sec-head' }, h('span', { class: 'kind', text: kindText }), ti,
            act('up', 'up', 'Yuqoriga', () => mv(-1), i === 0), act('down', 'down', 'Pastga', () => mv(1), i === d.sections.length - 1), act('del', 'trash', 'Oʻchirish', del)),
          body));
      });
      const add = h('button', { class: 'btn', type: 'button', style: { marginTop: '14px' }, onclick: () => {
        let at = d.sections.findIndex((s) => s.kind === 'conclusion');
        if (at < 0) at = d.sections.length;
        const ns = M.section('main', (at + 1) + '-savol: ');
        d.sections.splice(at, 0, ns);
        sess.touch(); renderSections('[data-sec="' + ns.id + '"] input');
      } }, icon('plus', 18), 'Yana savol qoʻshish');
      secRegion.appendChild(add);
      updTotals(); renderPlan();
      if (focusSel) { const f = secRegion.querySelector(focusSel); if (f) f.focus(); }
    }

    const fmtPanel = ui.formatPanel(d.format, () => sess.touch());
    root.append(h('div', { class: 'page' },
      ui.pageHead('Mustaqil ish tayyorlash', 'Mustaqil taʼlim topshiriqlari, savollar va yechimlarni tartibli hujjatga keltiring va yuklab oling.', h('span', { class: 'badge ok' }, icon('shield', 14), 'APIʼsiz ishlaydi')),
      ui.projectBar(sess, { onNew: () => TS.go('#/mustaqil/yangi') }),
      ui.libNotice('docx'),
      h('div', { class: 'stack' },
        h('section', { class: 'card' },
          h('h2', { text: 'Titul varagʻi maʼlumotlari' }),
          metaGrid,
          h('div', { class: 'row', style: { marginTop: '16px' } },
            h('label', { class: 'label', for: 'nmustaqil', text: 'Topshiriq / Savollar soni' }), nQ, buildBtn)),
        h('section', { class: 'card' }, h('h2', { text: 'Topshiriq rejasi' }), planList),
        h('div', null, h('div', { class: 'section-title', style: { margin: '6px 0 12px' } }, h('h2', { text: 'Savollar va javoblar' }), totals), secRegion),
        fmtPanel.el,
        ui.exportCard(p, sess, [['docx', 'DOCX', 'download', 'primary'], ['pdf', 'PDF (chop etish)', 'print'], ['txt', 'TXT', 'text'], ['copy', 'Matnni nusxalash', 'copy']]))));
    renderSections();
    updTotals();
  };

  /* ============================== MAQOLA ============================== */
  TS.views.maqola = async function (root, param, ctx) {
    const { p, persisted } = await ui.loadProject('maqola', param);
    if (ctx.stale()) return;
    const sess = ui.createSession(p, persisted);
    const d = p.data;
    TS.clear(root);
    const f = (key, label, o) => ui.field(label, Object.assign({ value: d[key], onInput: (v) => { d[key] = v; sess.touch(); } }, o));
    const refRegion = h('div');
    const totals = h('div', { class: 'counter' });
    const updTotals = () => { const s = M.stats(p); TS.clear(totals).append(h('span', { text: 'Jami: ' + s.words + ' soʻz' }), h('span', { text: s.chars + ' belgi' })); };
    sess.onTouch(updTotals);

    function renderRefs(focusSel) {
      TS.clear(refRegion);
      if (!d.refs.length) refRegion.appendChild(h('div', { class: 'empty' }, h('h3', { text: 'Manbalar kiritilmagan' }), h('p', { text: 'Foydalangan manbalaringizni oʻzingiz kiriting. Platforma manbalarni internetdan tekshirmaydi va oʻylab topmaydi.' })));
      d.refs.forEach((r, i) => {
        const cell = (key, label, cls, ph) => ui.field(label, { value: r[key], cls, ph, max: key === 'url' ? 2000 : 500, onInput: (v) => { r[key] = v; sess.touch(); } });
        refRegion.appendChild(h('div', { class: 'ref-row', dataset: { ref: r.id } },
          cell('author', 'Muallif'), cell('title', 'Nomi', 'wide'), cell('year', 'Yil'), cell('url', 'Havola (ixtiyoriy)', 'wide'),
          h('button', { class: 'btn icon sm', type: 'button', 'aria-label': (i + 1) + '-manbani oʻchirish', title: 'Oʻchirish', onclick: () => { d.refs.splice(i, 1); sess.touch(); renderRefs(); } }, icon('trash', 16))));
      });
      if (focusSel) { const x = refRegion.querySelector(focusSel); if (x) x.focus(); }
    }
    const addRef = h('button', { class: 'btn', type: 'button', onclick: () => {
      const r = { id: TS.uid(), author: '', title: '', year: '', url: '' };
      d.refs.push(r); sess.touch(); renderRefs('[data-ref="' + r.id + '"] input');
    } }, icon('plus', 18), 'Manba qoʻshish');

    const fmtPanel = ui.formatPanel(d.format, () => sess.touch());
    root.append(h('div', { class: 'page' },
      ui.pageHead('Maqola tayyorlash', 'Maqola maydonlarini oʻzingiz toʻldiring — platforma ularni tartibli hujjatga aylantiradi. Tadqiqot, statistika yoki manbalar oʻylab topilmaydi.', h('span', { class: 'badge ok' }, icon('shield', 14), 'APIʼsiz ishlaydi')),
      ui.projectBar(sess, { onNew: () => TS.go('#/maqola/yangi') }),
      ui.libNotice('docx'),
      h('div', { class: 'stack' },
        h('section', { class: 'card' }, h('h2', { text: 'Maqola maʼlumotlari' }), h('p', { class: 'sub', text: 'Kiritilmagan maydonlar hujjatda chiqmaydi.' }),
          h('div', { class: 'grid c2' },
            f('title', 'Maqola sarlavhasi', { cls: 'span-all', max: 600 }),
            f('author', 'Muallif'), f('institution', 'Taʼlim muassasasi'),
            f('supervisor', 'Ilmiy rahbar (ixtiyoriy)', { cls: 'span-all' }))),
        h('section', { class: 'card' }, h('h2', { text: 'Annotatsiya va kalit soʻzlar' }),
          h('div', { class: 'stack' },
            f('abstract', 'Annotatsiya', { multi: true, rows: 5, counter: true, ph: 'Maqolaning qisqacha mazmunini kiriting.' }),
            f('keywords', 'Kalit soʻzlar', { hint: 'Vergul bilan ajrating.', max: 1000 }))),
        h('section', { class: 'card' }, h('h2', { text: 'Maqola matni' }), h('p', { class: 'sub', text: 'Har bir yangi qator — yangi abzats.' }),
          h('div', { class: 'stack' },
            f('intro', 'Kirish', { multi: true, rows: 8, counter: true, ph: 'Kirish matnini yozing yoki joylashtiring.' }),
            f('main', 'Asosiy qism', { multi: true, rows: 14, counter: true, ph: 'Asosiy qism matnini yozing yoki joylashtiring.' }),
            f('conclusion', 'Xulosa', { multi: true, rows: 6, counter: true, ph: 'Xulosa matnini kiriting.' })),
          h('div', { style: { marginTop: '10px' } }, totals)),
        h('section', { class: 'card' }, h('h2', { text: 'Foydalanilgan adabiyotlar' }),
          h('div', { class: 'notice warn', style: { marginBottom: '10px' } }, icon('info', 18), h('div', { text: 'Manbalar qoʻlda kiritiladi va internetda tekshirilmaydi. Muallif, nom, yil va havolaning toʻgʻriligiga oʻzingiz javob berasiz.' })),
          refRegion, h('div', { style: { marginTop: '12px' } }, addRef)),
        fmtPanel.el,
        ui.exportCard(p, sess, [['docx', 'DOCX', 'download', 'primary'], ['pdf', 'PDF (chop etish)', 'print'], ['txt', 'TXT', 'text'], ['copy', 'Matnni nusxalash', 'copy']]))));
    renderRefs();
    updTotals();
  };
})();
