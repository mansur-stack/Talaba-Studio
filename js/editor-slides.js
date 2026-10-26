/* Talaba Studio — Prezentatsiya: shablon, matnni taqsimlash, slayd muharriri, oldindan ko‘rish, namoyish */
(function () {
  'use strict';
  const TS = window.TS;
  const { h, icon } = TS;
  const M = TS.model;
  const ui = TS.ui;

  /* ---------- Slaydni HTML sifatida chizish (PPTX bilan bir xil geometriya) ---------- */
  function slideEl(s, themeKey) {
    const T = M.THEMES[themeKey] || M.THEMES.academic, G = M.GEOM;
    const pos = (b) => ({ left: (b.x / G.W * 100) + '%', top: (b.y / G.H * 100) + '%', width: (b.w / G.W * 100) + '%', height: (b.h / G.H * 100) + '%' });
    const fs = (pt) => ({ fontSize: (pt / (G.W * 72) * 100) + 'cqw' });
    const box = (cls, b, style, kids) => h('div', { class: cls, style: Object.assign(pos(b), style || {}) }, kids);
    const paras = (body) => M.parseBody(body).map((l) => h('p', { class: l.bullet ? 'b' : '', text: l.text }));
    const slide = h('div', { class: 'slide', role: 'img', 'aria-label': 'Slayd oldindan koʻrinishi' });

    if (s.kind === 'title' || s.kind === 'closing') {
      slide.style.background = '#' + T.tsBg;
      slide.append(
        box('s-rule', G.tLine, { background: '#' + T.accent }),
        box('s-title center', G.tTitle, Object.assign(fs(M.titlePt(s.title, true)), { color: '#' + T.tsTitle }), s.title.trim() || (s.kind === 'closing' ? 'Eʼtiboringiz uchun rahmat!' : '')),
        box('s-body center', G.tSub, Object.assign(fs(20), { color: '#' + T.tsSub }), paras(s.body)));
    } else {
      slide.style.background = '#' + T.bg;
      if (T.band) slide.append(box('s-band', G.band, { background: '#' + T.band }));
      else slide.append(box('s-rule', G.rule, { background: '#' + T.accent }));
      slide.append(box('s-title', G.cTitle, Object.assign(fs(M.titlePt(s.title, false)), { color: '#' + T.ct }), s.title.trim()));

      if (s.kind === 'split' && s.body.includes('||')) {
        const parts = s.body.split('||');
        slide.append(
          box('s-body', G.col1, Object.assign(fs(18), { color: '#' + T.text }), paras(parts[0] || '')),
          box('s-body', G.col2, Object.assign(fs(18), { color: '#' + T.text }), paras(parts[1] || ''))
        );
      } else {
        const hasImg = !!s.img;
        const lay = M.bodyLayout(s.body, hasImg);
        slide.append(box('s-body', hasImg ? G.bodyImg : G.body, Object.assign(fs(lay.pt), { color: '#' + T.text }), paras(s.body)));
        if (hasImg) {
          const r = M.fitImage(s.img, s.body.trim() ? G.img : G.body);
          const im = h('img', { src: s.img.data, alt: 'Slayd rasmi' });
          Object.assign(im.style, pos(r));
          slide.append(im);
        }
        if (!lay.fits && s.body.trim()) slide.classList.add('over');
      }
    }
    return h('div', { class: 'slide-wrap' }, slide);
  }

  /* ---------- Lokal rasm: o‘lchamini kichraytirib, brauzer ichida saqlaydi ---------- */
  async function loadImage(file) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('Faqat PNG, JPG, WEBP yoki GIF rasm yuklash mumkin.');
    if (file.size > 12 * 1024 * 1024) throw new Error('Rasm hajmi 12 MB dan oshmasin.');
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('Rasmni ochib boʻlmadi — fayl buzilgan boʻlishi mumkin.'));
        i.src = url;
      });
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * k)), hh = Math.max(1, Math.round(img.naturalHeight * k));
      const c = document.createElement('canvas');
      c.width = w; c.height = hh;
      const ctx = c.getContext('2d');
      const png = file.type === 'image/png';
      if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hh); }
      ctx.drawImage(img, 0, 0, w, hh);
      const data = c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.88);
      if (data.length > 7000000) throw new Error('Rasm saqlash uchun juda katta. Kichikroq rasm tanlang.');
      return { data, w, h: hh, name: file.name.slice(0, 120) };
    } finally { URL.revokeObjectURL(url); }
  }

  /* ---------- To‘liq ekranli namoyish ---------- */
  function present(p, start) {
    const list = p.data.slides.filter((s) => s.title.trim() || s.body.trim() || (s.img && s.kind !== 'title'));
    if (!list.length) { TS.toast('Namoyish uchun kamida bitta slaydga matn kiriting.', 'error'); return; }
    const startSlide = p.data.slides[start];
    let i = Math.max(0, list.indexOf(startSlide));
    const prev = document.activeElement;
    const stage = h('div', { class: 'stage' });
    const count = h('span', { 'aria-live': 'polite' });
    const b = (ic, label, fn) => h('button', { class: 'btn icon sm', type: 'button', 'aria-label': label, title: label, onclick: fn }, icon(ic, 18));
    const ov = h('div', { class: 'present', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Prezentatsiya namoyishi', tabindex: '-1' },
      stage, h('div', { class: 'pbar' }, b('left', 'Oldingi slayd', () => go(-1)), count, b('right', 'Keyingi slayd', () => go(1)), b('x', 'Namoyishni yopish', close)));

    function show() {
      TS.clear(stage).append(slideEl(list[i], p.data.theme));
      count.textContent = (i + 1) + ' / ' + list.length;
    }
    function go(d) { i = Math.min(list.length - 1, Math.max(0, i + d)); show(); }
    function key(e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      else if (e.key === 'Home') { i = 0; show(); } else if (e.key === 'End') { i = list.length - 1; show(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    }
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', key);
      document.removeEventListener('fullscreenchange', fsChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      ov.remove();
      if (prev && prev.focus) prev.focus();
    }
    function fsChange() { if (!document.fullscreenElement) close(); }
    let x0 = null;
    ov.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
    ov.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; }, { passive: true });
    document.addEventListener('keydown', key);
    document.body.appendChild(ov);
    show();
    ov.focus();
    if (ov.requestFullscreen) {
      ov.requestFullscreen().then(() => document.addEventListener('fullscreenchange', fsChange)).catch(() => {});
    }
  }

  /* ============================== PREZENTATSIYA ============================== */
  TS.views.prezentatsiya = async function (root, param, ctx) {
    const { p, persisted } = await ui.loadProject('prezentatsiya', param);
    if (ctx.stale()) return;
    const sess = ui.createSession(p, persisted);
    const d = p.data;
    let cur = 0;
    let want = 8;
    let method = 'blank';
    let notes = [];
    TS.clear(root);
    const body = h('div', { class: 'stack' });

    const metaFields = () => [
      ui.field('Mavzu', { value: d.meta.topic, cls: 'span-all', ph: 'Prezentatsiya mavzusi', onInput: (v) => { d.meta.topic = v; sess.touch(); } }),
      ui.field('Muallif', { value: d.meta.author, onInput: (v) => { d.meta.author = v; sess.touch(); } }),
      ui.field('Guruh', { value: d.meta.group, onInput: (v) => { d.meta.group = v; sess.touch(); } })
    ];
    const themePicker = (onPick) => {
      const wrap = h('div', { class: 'theme-pick', role: 'radiogroup', 'aria-label': 'Dizayn mavzusi' });
      Object.keys(M.THEMES).forEach((k) => {
        const T = M.THEMES[k];
        const r = h('input', { type: 'radio', name: 'theme', value: k, checked: d.theme === k });
        r.addEventListener('change', () => { d.theme = k; sess.touch(); if (onPick) onPick(); });
        wrap.appendChild(h('label', null, r, h('span', { class: 'swatch', style: { background: '#' + (T.band || T.tsBg) } }), T.label));
      });
      return wrap;
    };
    const srcField = (rows) => ui.field('Tayanch matn', {
      value: d.src, multi: true, rows, counter: true, max: 500000,
      ph: 'Matningizni shu yerga joylashtiring. «# Sarlavha» qatori yangi slayd sarlavhasini bildiradi; sarlavhasiz matnda boʻsh qator bilan ajratilgan abzatslar alohida slaydlarga boʻlinadi.',
      hint: 'Matn AI bilan qayta yozilmaydi va yashirincha qisqartirilmaydi — faqat sarlavha, abzats va gap chegaralari boʻyicha taqsimlanadi.',
      onInput: (v) => { d.src = v; sess.touch(); }
    });

    /* ----- 1) Boshlang‘ich sozlash ----- */
    function renderSetup() {
      TS.clear(body);
      const textWrap = h('div', { hidden: method !== 'text' }, srcField(10));
      const radio = (val, title, desc) => {
        const r = h('input', { type: 'radio', name: 'method', value: val, checked: method === val });
        r.addEventListener('change', () => { method = val; textWrap.hidden = method !== 'text'; });
        return h('label', null, r, h('strong', { text: title }), h('span', { text: desc }));
      };
      const cnt = h('input', { class: 'input', id: 'want', type: 'number', min: 1, max: 40, value: want, 'aria-label': 'Slaydlar soni' });
      cnt.style.maxWidth = '120px';
      cnt.addEventListener('input', () => { want = parseInt(cnt.value, 10) || 8; });
      const go = h('button', { class: 'btn primary', type: 'button' }, icon('slides', 18), 'Slaydlarni yaratish');
      go.addEventListener('click', () => {
        d.meta.topic = d.meta.topic.trim(); d.meta.author = d.meta.author.trim(); d.meta.group = d.meta.group.trim();
        if (method === 'blank') { d.slides = M.blankDeck(d.meta, want); notes = []; } else {
          if (!d.src.trim()) { TS.toast('Tayanch matn boʻsh. Matn kiriting yoki «Boʻsh slaydlar shabloni» ni tanlang.', 'error'); return; }
          const r = M.distribute(d.src, d.meta, want);
          if (!r.slides.length) { TS.toast('Matndan slayd hosil qilib boʻlmadi.', 'error'); return; }
          d.slides = r.slides; notes = r.notes;
        }
        cur = 0; sess.touch(); sess.saveNow(false); renderMain();
        TS.toast(d.slides.length + ' ta slayd yaratildi.', 'success', 2600);
      });
      body.append(
        h('section', { class: 'card' }, h('h2', { text: 'Prezentatsiya maʼlumotlari' }), h('p', { class: 'sub', text: 'Titul slaydi shu maʼlumotlardan tuziladi. Kiritilmagan maydonlar chiqmaydi.' }), h('div', { class: 'grid c2' }, metaFields())),
        h('section', { class: 'card' }, h('h2', { text: 'Qanday boshlaymiz?' }),
          h('div', { class: 'method', style: { margin: '10px 0 14px' } },
            radio('blank', 'Boʻsh slaydlar shabloni', 'Sarlavhali boʻsh slaydlar tayyor boʻladi, matnni oʻzingiz yozasiz.'),
            radio('text', 'Matnni slaydlarga taqsimlash', 'Tayyor matningizni sarlavha va abzatslar boʻyicha slaydlarga ajratamiz.')),
          h('div', { class: 'row', style: { marginBottom: '12px' } }, h('label', { class: 'label', for: 'want', text: 'Slaydlar soni' }), cnt),
          textWrap),
        h('section', { class: 'card' }, h('h2', { text: 'Dizayn mavzusi' }), themePicker(), h('div', { class: 'row end', style: { marginTop: '16px' } }, go)));
    }

    /* ----- 2) Slayd muharriri ----- */
    function renderEditor() {
      TS.clear(body);
      if (cur >= d.slides.length) cur = d.slides.length - 1;
      if (cur < 0) cur = 0;
      const s = d.slides[cur];

      const thumbs = h('div', { class: 'thumbs', role: 'list', 'aria-label': 'Slaydlar roʻyxati' });
      const thumbBtns = [];
      const thumbLabel = (sl, i) => {
        const over = sl.kind !== 'title' && sl.kind !== 'closing' && sl.body.trim() && !M.bodyLayout(sl.body, !!sl.img).fits;
        const t = sl.title.trim();
        const btn = thumbBtns[i];
        const kindBadge = sl.kind === 'closing' ? ' [Yakun]' : sl.kind === 'split' ? ' [2 ustun]' : '';
        TS.clear(btn).append(
          h('span', { class: 'n', text: String(i + 1) }),
          h('span', { class: 't' + (t ? '' : ' empty-t') },
            over ? h('span', { class: 'warn-dot', title: 'Matn sigʻmasligi mumkin', text: '⚠ ' }) : null,
            (t || (sl.body.trim() ? 'Sarlavhasiz slayd' : 'Boʻsh slayd')) + kindBadge
          )
        );
      };

      d.slides.forEach((sl, i) => {
        const btn = h('button', { class: 'thumb', type: 'button', role: 'listitem', 'aria-label': (i + 1) + '-slayd' }, '');
        btn.setAttribute('aria-current', i === cur ? 'true' : 'false');
        btn.addEventListener('click', () => { cur = i; renderEditor(); const t = body.querySelectorAll('.thumb')[i]; if (t) t.focus(); });
        btn.addEventListener('keydown', (e) => {
          const j = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i - 1 : -1;
          if (j >= 0 && j < d.slides.length) { e.preventDefault(); cur = j; renderEditor(); const t = body.querySelectorAll('.thumb')[j]; if (t) t.focus(); }
        });
        thumbBtns.push(btn);
        thumbs.appendChild(btn);
        thumbLabel(sl, i);
      });

      const previewBox = h('div');
      const warnBox = h('div');
      const refresh = () => {
        TS.clear(previewBox).append(slideEl(s, d.theme));
        thumbLabel(s, cur);
        TS.clear(warnBox);
        if (s.kind !== 'title' && s.kind !== 'closing' && s.body.trim() && !M.bodyLayout(s.body, !!s.img).fits) {
          warnBox.append(h('div', { class: 'notice warn', role: 'status' }, icon('alert', 18),
            h('div', null, h('div', { text: 'Matn bu slaydga sigʻmasligi mumkin (kichik shriftda ham). Matn kesilmaydi — uni bir necha slaydga boʻlishni taklif qilamiz.' }),
              h('button', { class: 'btn sm', type: 'button', style: { marginTop: '8px' }, onclick: () => {
                const parts = M.splitSlide(s);
                if (parts.length < 2) { TS.toast('Matnni boʻlib boʻlmadi: bitta gap juda uzun. Uni qoʻlda qisqartiring yoki ikkiga ajrating.', 'error', 6000); return; }
                d.slides.splice(cur, 1, ...parts);
                sess.touch(); renderEditor();
                TS.toast('Matn ' + parts.length + ' ta slaydga boʻlindi.', 'success', 3000);
              } }, 'Bir necha slaydga boʻlish'))));
        }
      };

      const isTitle = s.kind === 'title';
      const isClosing = s.kind === 'closing';
      const isSplit = s.kind === 'split';

      const titleF = ui.field(isTitle ? 'Prezentatsiya nomi' : (isClosing ? 'Yakuniy sarlavha' : 'Slayd sarlavhasi'), {
        value: s.title, max: 600, ph: isTitle ? 'Mavzu' : (isClosing ? 'Eʼtiboringiz uchun rahmat!' : 'Sarlavha'),
        onInput: (v) => { s.title = v; sess.touch(); refresh(); }
      });

      const bodyPh = isTitle ? '' : (isClosing ? 'Savollar va fikrlar uchun...' : (isSplit ? 'Chap ustun matni...\n||\nOʻng ustun matni...' : 'Matnni yozing yoki joylashtiring. «- » bilan boshlansa — punkt.'));
      const bodyF = ui.field(isTitle ? 'Pastki matn (muallif, guruh)' : (isSplit ? 'Slayd matni (ustunlarni "||" bilan ajrating)' : 'Slayd matni'), {
        value: s.body, multi: true, rows: 8, max: 20000, counter: true,
        ph: bodyPh,
        onInput: (v) => { s.body = v; sess.touch(); refresh(); }
      });

      let imgPanel = null;
      if (!isTitle && !isClosing) {
        const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', hidden: true, id: 'img-file' });
        file.addEventListener('change', async () => {
          const f = file.files && file.files[0];
          if (!f) return;
          try { s.img = await loadImage(f); sess.touch(); renderEditor(); TS.toast('Rasm qoʻshildi.', 'success', 2200); } catch (e) { TS.toast(e.message || 'Rasmni yuklab boʻlmadi.', 'error', 6000); }
          file.value = '';
        });
        imgPanel = h('div', { class: 'row' },
          file,
          h('button', { class: 'btn sm', type: 'button', onclick: () => file.click() }, icon('image', 16), s.img ? 'Rasmni almashtirish' : 'Rasm yuklash'),
          s.img ? h('span', { class: 'hint', text: s.img.name || 'rasm' }) : h('span', { class: 'hint', text: 'Rasm qurilmangizdan olinadi va tashqariga yuborilmaydi.' }),
          s.img ? h('button', { class: 'btn sm', type: 'button', onclick: () => { s.img = null; sess.touch(); renderEditor(); } }, icon('trash', 16), 'Olib tashlash') : null);
      }

      const mv = (dir) => {
        const j = cur + dir;
        if (j < 0 || j >= d.slides.length) return;
        [d.slides[cur], d.slides[j]] = [d.slides[j], d.slides[cur]];
        cur = j; sess.touch(); renderEditor();
      };

      const addSlideMenu = h('div', { class: 'row' },
        h('button', { class: 'btn sm', type: 'button', onclick: () => { const ns = M.newSlide('content'); d.slides.splice(cur + 1, 0, ns); cur++; sess.touch(); renderEditor(); } }, icon('plus', 16), 'Slayd qoʻshish'),
        h('button', { class: 'btn sm', type: 'button', title: 'Matnni ikki ustunga ajratib yozish', onclick: () => { const ns = M.newSlide('split'); ns.title = 'Taqqoslash / 2 ustun'; ns.body = '- Chap ustun maʼlumoti\n- Ikkinchi band\n||\n- Oʻng ustun maʼlumoti\n- Ikkinchi band'; d.slides.splice(cur + 1, 0, ns); cur++; sess.touch(); renderEditor(); } }, icon('columns', 16), '2 ustunli slayd'),
        h('button', { class: 'btn sm', type: 'button', title: 'Taqdimot yakuniy slaydi', onclick: () => { const ns = M.closingSlide(); d.slides.splice(cur + 1, 0, ns); cur++; sess.touch(); renderEditor(); } }, icon('check', 16), 'Yakuniy slayd'));

      const tools = h('div', { class: 'slide-tools' },
        addSlideMenu,
        h('button', { class: 'btn icon sm', type: 'button', 'aria-label': 'Slaydni yuqoriga', title: 'Yuqoriga', disabled: cur === 0, onclick: () => mv(-1) }, icon('up', 16)),
        h('button', { class: 'btn icon sm', type: 'button', 'aria-label': 'Slaydni pastga', title: 'Pastga', disabled: cur === d.slides.length - 1, onclick: () => mv(1) }, icon('down', 16)),
        h('button', { class: 'btn sm', type: 'button', onclick: async () => {
          if (s.title.trim() || s.body.trim() || s.img) {
            const ok = await TS.confirmBox('Slaydni oʻchirish', (cur + 1) + '-slayd va uning matni oʻchiriladi. Davom etasizmi?', { okLabel: 'Oʻchirish', danger: true });
            if (!ok) return;
          }
          d.slides.splice(cur, 1); sess.touch();
          if (!d.slides.length) renderMain(); else renderEditor();
        } }, icon('trash', 16), 'Oʻchirish'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn sm primary', type: 'button', onclick: () => present(p, cur) }, icon('play', 16), 'Toʻliq ekranda namoyish'));

      const counts = h('p', { class: 'hint', text: 'Slaydlar: ' + d.slides.length + ' · Hozir: ' + (cur + 1) + '-slayd' });
      const infoBox = notes.length ? h('div', { class: 'notice warn', role: 'status' }, icon('info', 18), h('div', null, h('strong', { text: 'Taqsimlash natijasi' }), h('ul', null, notes.map((n) => h('li', { text: n }))),
        h('button', { class: 'btn sm', type: 'button', onclick: () => { notes = []; renderEditor(); } }, 'Yopish'))) : null;

      /* maʼlumot va tayanch matn */
      const addFromText = h('button', { class: 'btn', type: 'button' }, icon('plus', 18), 'Matndan qoʻshimcha slaydlar qoʻshish');
      addFromText.addEventListener('click', () => {
        if (!d.src.trim()) { TS.toast('Avval tayanch matnni kiriting.', 'error'); return; }
        const r = M.distribute(d.src, { topic: '' }, 0);
        if (!r.slides.length) { TS.toast('Matndan slayd hosil qilib boʻlmadi.', 'error'); return; }
        d.slides.push(...r.slides); notes = r.notes; cur = d.slides.length - r.slides.length;
        sess.touch(); sess.saveNow(false); renderEditor();
        TS.toast(r.slides.length + ' ta slayd oxiriga qoʻshildi.', 'success', 3000);
      });
      const detail = h('details', { class: 'details' }, h('summary', null, icon('settings', 18), 'Maʼlumotlar, dizayn va tayanch matn'),
        h('div', { class: 'inner stack' },
          h('div', { class: 'grid c2' }, metaFields()),
          h('p', { class: 'hint', text: 'Titul slaydi allaqachon yaratilgan; uning matnini slayd ichida tahrirlang.' }),
          h('div', null, h('div', { class: 'label', text: 'Dizayn mavzusi', style: { marginBottom: '6px' } }), themePicker(() => renderEditor())),
          srcField(6), h('div', null, addFromText)));

      body.append(
        infoBox,
        h('div', { class: 'deck' },
          h('div', null, h('div', { class: 'label', text: 'Slaydlar', style: { margin: '0 0 8px 4px' } }), thumbs),
          h('div', { class: 'stack' }, tools, h('div', { class: 'editor-split' },
            h('section', { class: 'card stack' }, titleF, bodyF, imgPanel, warnBox, counts),
            h('section', { class: 'card' }, h('h2', { text: 'Oldindan koʻrish' }), h('p', { class: 'sub', text: 'Koʻrinish PowerPoint eksportiga mos.' }), previewBox)))),
        detail,
        ui.exportCard(p, sess, [
          ['pptx', 'PPTX yuklab olish', 'download', 'primary'],
          ['txt', 'TXT matn (nutq uchun)', 'text'],
          ['copy', 'Matnni nusxalash', 'copy']
        ], 'Sarlavha va matnlar PowerPointʼda tahrirlanadi, yuklagan rasmlaringiz ham qoʻshiladi. Slayd matnlarini nutq uchun TXT formatida ham olishingiz mumkin.'));
      refresh();
    }

    function renderMain() { if (d.slides.length) renderEditor(); else renderSetup(); }

    root.append(h('div', { class: 'page' },
      ui.pageHead('Prezentatsiya tayyorlash', 'Boʻsh slaydlar shablonini yarating yoki oʻz matningizni slaydlarga taqsimlang. Matn mazmuni oʻzgartirilmaydi.', h('span', { class: 'badge ok' }, icon('shield', 14), 'APIʼsiz ishlaydi')),
      ui.projectBar(sess, { onNew: () => TS.go('#/prezentatsiya/yangi') }),
      ui.libNotice('pptx'),
      body));
    renderMain();
  };
})();
