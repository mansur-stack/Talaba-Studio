/* Talaba Studio — Bosh sahifa, Mening ishlarim, Sozlamalar */
(function () {
  'use strict';
  const TS = window.TS;
  const { h, icon } = TS;
  const M = TS.model;
  const ui = TS.ui;

  const TYPE_ICON = {
    referat: 'doc',
    kurs: 'book',
    mustaqil: 'task',
    maqola: 'article',
    prezentatsiya: 'slides'
  };

  function projectCard(p, o) {
    o = o || {};
    const st = M.stats(p);
    const unit = p.type === 'prezentatsiya' ? p.data.slides.length + ' slayd' : st.words + ' soʻz';
    const acts = h('div', { class: 'acts' }, h('a', { class: 'btn sm primary', href: '#/' + p.type + '/' + p.id }, icon('edit', 16), 'Ochish'));
    if (!o.compact) {
      const b = (ic, label, fn, cls) => h('button', { class: 'btn sm ' + (cls || ''), type: 'button', onclick: fn }, icon(ic, 16), label);
      acts.append(
        b('edit', 'Nomi', async () => {
          const n = await TS.promptBox('Nomini oʻzgartirish', 'Ish nomi', p.name);
          if (n === null) return;
          if (!n) { TS.toast('Nom boʻsh boʻlmasligi kerak.', 'error'); return; }
          const full = await TS.store.get(p.id); if (!full) return;
          full.name = n.slice(0, 120); full.nameAuto = false; full.updatedAt = Date.now();
          try { await TS.store.put(full); o.reload(); } catch (e) { TS.toast('Nomni saqlab boʻlmadi.', 'error'); }
        }),
        b('copy', 'Nusxa', async () => {
          try {
            const full = await TS.store.get(p.id); if (!full) return;
            const c = M.normalize(full); c.id = TS.uid(); c.name = (full.name + ' (nusxa)').slice(0, 120); c.nameAuto = false; c.createdAt = c.updatedAt = Date.now();
            await TS.store.put(c); TS.toast('Nusxa yaratildi.', 'success', 2400); o.reload();
          } catch (e) { TS.toast('Nusxalab boʻlmadi: ' + (e.message || 'xato'), 'error'); }
        }),
        b('download', 'JSON', async () => { const full = await TS.store.get(p.id); if (full) TS.download(TS.exporter.backupBlob([full]), TS.safeFileName(p.name, 'ish') + '.json'); }),
        b('trash', 'Oʻchirish', async () => {
          const ok = await TS.confirmBox('Ishni oʻchirish', '«' + p.name + '» butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi — zarur boʻlsa, avval JSON zaxira yuklab oling.', { okLabel: 'Oʻchirish', danger: true });
          if (!ok) return;
          try {
            await TS.store.remove(p.id);
            if (TS.prefs.getLastId(p.type) === p.id) TS.prefs.setLastId(p.type, null);
            TS.toast('Ish oʻchirildi.', 'success', 2400); o.reload();
          } catch (e) { TS.toast('Oʻchirib boʻlmadi.', 'error'); }
        }, ''));
    }
    return h('article', { class: 'proj' },
      h('div', null, h('span', { class: 'badge' }, icon(TYPE_ICON[p.type] || 'doc', 14), (M.TYPES[p.type] && M.TYPES[p.type].label) || p.type)),
      h('h3', { text: p.name }),
      h('div', { class: 'meta' }, h('span', { text: 'Yangilangan: ' + TS.fmtDate(p.updatedAt) }), h('span', { text: unit })),
      acts);
  }

  const memWarn = () => TS.store.mode === 'memory' ? h('div', { class: 'notice error', role: 'alert', style: { marginBottom: '14px' } }, icon('alert', 18), h('div', { text: 'Brauzer xotirasi (IndexedDB) ishlamayapti — ishlar faqat shu oynada saqlanadi va oynani yopsangiz yoʻqoladi. Muhim ishlarni DOCX/PPTX yoki JSON sifatida yuklab oling.' })) : null;

  /* ---------- Bosh sahifa ---------- */
  TS.views.bosh = async function (root, param, ctx) {
    TS.clear(root);
    const recent = h('div', { class: 'proj-list' });
    const recentWrap = h('section', { 'aria-labelledby': 'rec-h' });
    const card = (href, ic, title, desc) => h('a', { class: 'work-card', href },
      h('span', { class: 'ico' }, icon(ic, 24)),
      h('h3', { text: title }),
      h('p', { text: desc }),
      h('span', { class: 'go' }, 'Boshlash', icon('right', 16)));

    // Rezyume (CV) uchun maxsus tashqi karta
    const cvCard = h('a', {
      class: 'work-card cv-card',
      href: 'https://mansur-stack.github.io/-AI-Resume-Builder-1.3v/',
      target: '_blank',
      rel: 'noopener noreferrer'
    },
      h('div', { class: 'cv-head' },
        h('span', { class: 'ico cv-ico' }, icon('user', 24)),
        h('span', { class: 'badge ok' }, icon('sparkles', 12), 'AI Xizmati')),
      h('h3', { text: 'Talaba rezyumesi (CV)' }),
      h('p', { text: 'AI yordamida zamonaviy, professional rezyume (CV) shakllantiring va PDF qilib yuklab oling.' }),
      h('span', { class: 'go cv-go' }, 'Rezyume yaratish', icon('external', 16)));

    /* Tezkor matn vositasi (Lotin-Kirill transliteratsiya va Matn tozalagich) */
    const quickTa = h('textarea', { class: 'textarea', rows: 4, placeholder: 'Matningizni shu yerga qoʻying (Kirill yoki Lotin, buzuq apostroflar bilan)...' });
    const quickCounter = h('span', { class: 'hint', text: '0 soʻz' });
    quickTa.addEventListener('input', () => { quickCounter.textContent = TS.words(quickTa.value) + ' soʻz · ' + TS.chars(quickTa.value) + ' belgi'; });

    const btnClean = h('button', { class: 'btn sm', type: 'button', onclick: () => {
      if (!quickTa.value.trim()) return;
      quickTa.value = M.cleanUzText(quickTa.value);
      quickCounter.textContent = TS.words(quickTa.value) + ' soʻz · ' + TS.chars(quickTa.value) + ' belgi';
      TS.toast('Matn tozalandi va apostroflar toʻgʻrilandi.', 'success', 2200);
    } }, icon('sparkles', 16), 'Matnni tozalash');

    const btnTranslit = h('button', { class: 'btn sm', type: 'button', onclick: () => {
      if (!quickTa.value.trim()) return;
      quickTa.value = M.translitUz(quickTa.value);
      quickCounter.textContent = TS.words(quickTa.value) + ' soʻz · ' + TS.chars(quickTa.value) + ' belgi';
      TS.toast('Lotin ⇄ Kirill alifbosiga oʻgirildi.', 'success', 2200);
    } }, icon('refresh', 16), 'Lotin ⇄ Kirill');

    const btnCopy = h('button', { class: 'btn sm', type: 'button', onclick: async () => {
      if (!quickTa.value.trim()) return;
      await TS.copyText(quickTa.value);
      TS.toast('Natija nusxalandi.', 'success', 2000);
    } }, icon('copy', 16), 'Nusxa olish');

    const quickToolsCard = h('section', { class: 'card quick-tools', style: { marginTop: '24px' } },
      h('div', { class: 'row', style: { marginBottom: '8px' } },
        h('h2', { text: 'Tezkor matn vositalari' }),
        h('span', { class: 'badge' }, icon('sparkles', 13), 'API’siz & Oflayn')),
      h('p', { class: 'sub', text: 'Internetdan yoki kitoblardan koʻchirilgan matnlarni bir zumda tozalang, apostroflarini standartlang yoki Lotin ⇄ Kirill alifbosiga oʻgiring.' }),
      quickTa,
      h('div', { class: 'row', style: { marginTop: '10px' } },
        btnClean, btnTranslit, btnCopy,
        h('span', { class: 'spacer' }),
        quickCounter));

    root.append(h('div', { class: 'page' },
      h('section', { class: 'hero' },
        h('div', null,
          h('h1', { text: 'Matningizni kiriting — hujjatni tartiblang.' }),
          h('p', { text: 'Referat, kurs ishi, mustaqil ish, maqola va prezentatsiyani tuzilma boʻyicha yigʻing, formatlang va DOCX, PPTX yoki PDF qilib yuklab oling.' }),
          h('div', { class: 'chips' },
            h('span', { class: 'chip' }, icon('shield', 14), 'APIʼsiz ishlaydi'),
            h('span', { class: 'chip' }, 'Ma’lumot brauzerda qoladi'),
            h('span', { class: 'chip' }, 'Oflayn rejim (PWA)'),
            h('span', { class: 'chip' }, 'Hisob va toʻlov yoʻq'))),
        h('div', { class: 'hero-art', 'aria-hidden': 'true' },
          h('div', { class: 'sheet a4' }, h('i'), h('i'), h('i'), h('i'), h('i'), h('i'), h('i'), h('i'), h('i')),
          h('div', { class: 'sheet slide' }, h('b'), h('i'), h('i'), h('i')))),
      h('div', { class: 'work-cards' },
        card('#/referat', 'doc', 'Referat', 'Titul varagʻi, reja, boʻlimlar va adabiyotlar tuzilmasi.'),
        card('#/kurs', 'book', 'Kurs ishi (BMI)', 'Kafedra tasdiqlari, mundarija, kirish, 1-bob, 2-bob va ilovalar.'),
        card('#/mustaqil', 'task', 'Mustaqil ish', 'Mustaqil taʼlim topshiriqlari, savollar va yechimlar formati.'),
        card('#/maqola', 'article', 'Maqola', 'Annotatsiya, kalit soʻzlar, asosiy qism va adabiyotlar roʻyxati.'),
        card('#/prezentatsiya', 'slides', 'Prezentatsiya', 'Slaydlar shabloni, 2 ustunli slayd, matndan taqsimlash va PPTX eksport.'),
        cvCard),
      quickToolsCard,
      h('div', { class: 'section-title' }, h('h2', { id: 'rec-h', text: 'Oxirgi loyihalar' }), h('a', { class: 'btn sm', href: '#/ishlar' }, 'Barchasi')),
      recentWrap,
      h('div', { class: 'section-title' },
        h('h2', { text: 'Qisqa yoʻriqnoma' }),
        h('a', { class: 'btn sm primary', href: '#/yoriqnoma' }, icon('help', 16), 'Toʻliq qoʻllanma')),
      h('ol', { class: 'guide' },
        h('li', null, h('strong', { text: 'Ish turini tanlang' }), 'Referat, kurs ishi, mustaqil ish, maqola yoki prezentatsiya.'),
        h('li', null, h('strong', { text: 'Maʼlumotlarni kiriting' }), 'Mavzu, OTM, F.I.Sh. kabi maydonlarni toʻldiring.'),
        h('li', null, h('strong', { text: 'Matnni toʻldiring' }), 'Tayyor matningizni joylashtiring yoki yozing. Tozalash tugmasi bilan tartiblang.'),
        h('li', null, h('strong', { text: 'Yuklab oling' }), 'DOCX, PPTX, PDF yoki TXT. Ish brauzeringizda avtomatik saqlanadi.')),
      h('div', { class: 'notice', style: { marginTop: '18px' } }, icon('info', 18), h('div', { text: 'Platforma matn yozib bermaydi va manba oʻylab topmaydi: u siz kiritgan matnni formatlaydi, saqlaydi va faylga aylantiradi. Ishlar shu brauzerning xotirasida turadi — muhim ishlardan vaqti-vaqti bilan JSON zaxira oling.' }))));

    root.querySelector('.page').prepend(memWarn() || document.createTextNode(''));

    const load = async () => {
      let list = [];
      try { list = (await TS.store.all()).map((x) => { const n = M.normalize(x); if (n) n.id = x.id; return n; }).filter(Boolean); } catch (e) { console.error(e); }
      if (ctx.stale()) return;
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      TS.clear(recentWrap);
      if (!list.length) { recentWrap.append(h('div', { class: 'empty' }, h('h3', { text: 'Hozircha ishlar yoʻq' }), h('p', { text: 'Yuqoridagi kartalardan birini tanlab, birinchi ishingizni boshlang.' }))); return; }
      TS.clear(recent);
      list.slice(0, 6).forEach((p) => recent.append(projectCard(p, { compact: true })));
      recentWrap.append(recent);
    };
    await load();
  };

  /* ---------- Mening ishlarim ---------- */
  TS.views.ishlar = async function (root, param, ctx) {
    TS.clear(root);
    let all = [], q = '', type = 'all';
    const list = h('div', { class: 'proj-list' });
    const status = h('p', { class: 'hint', role: 'status' });
    const search = h('input', { class: 'input', type: 'search', placeholder: 'Ishlar ichidan qidirish…', 'aria-label': 'Ishlarni qidirish' });
    search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); draw(); });
    const sel = h('select', { class: 'select', 'aria-label': 'Tur boʻyicha filtr', style: { maxWidth: '200px' } },
      h('option', { value: 'all', text: 'Barcha turlar' }), ...Object.keys(M.TYPES).map((k) => h('option', { value: k, text: M.TYPES[k].plural })));
    sel.addEventListener('change', () => { type = sel.value; draw(); });
    const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0]; file.value = '';
      if (!f) return;
      try {
        const r = await TS.exporter.importBackup(f);
        TS.toast(r.count + ' ta ish tiklandi' + (r.skipped ? ' (' + r.skipped + ' tasi yaroqsiz boʻlgani uchun oʻtkazib yuborildi)' : '') + '.', 'success', 5000);
        await reload();
      } catch (e) { TS.toast('Tiklab boʻlmadi: ' + e.message + ' Mavjud ishlaringiz oʻzgarmadi.', 'error', 9000); }
    });
    const backup = h('button', { class: 'btn', type: 'button', onclick: async () => {
      if (!all.length) { TS.toast('Zaxiralash uchun hali ish yoʻq.', 'error'); return; }
      const full = await TS.store.all();
      TS.download(TS.exporter.backupBlob(full), 'talaba-studio-zaxira-' + new Date().toISOString().slice(0, 10) + '.json');
      TS.toast('Zaxira nusxa yuklab olindi.', 'success');
    } }, icon('download', 18), 'JSON zaxira');
    const restore = h('button', { class: 'btn', type: 'button', onclick: () => file.click() }, icon('upload', 18), 'JSONdan tiklash');

    function draw() {
      TS.clear(list);
      const shown = all.filter((p) => (type === 'all' || p.type === type) && (!q || p.name.toLowerCase().includes(q)));
      status.textContent = all.length ? shown.length + ' ta ish koʻrsatilmoqda (jami ' + all.length + ')' : '';
      if (!all.length) {
        list.className = ''; list.append(h('div', { class: 'empty' }, h('h3', { text: 'Hozircha ishlar yoʻq' }), h('p', { text: 'Referat, kurs ishi, mustaqil ish yoki prezentatsiya boshlang — ishlaringiz shu yerda chiqadi.' }), h('a', { class: 'btn primary', href: '#/bosh' }, 'Bosh sahifaga')));
        return;
      }
      if (!shown.length) { list.className = ''; list.append(h('div', { class: 'empty' }, h('h3', { text: 'Hech narsa topilmadi' }), h('p', { text: 'Qidiruv soʻzini yoki turini oʻzgartirib koʻring.' }))); return; }
      list.className = 'proj-list';
      shown.forEach((p) => list.append(projectCard(p, { reload })));
    }

    async function reload() {
      try {
        const raw = await TS.store.all();
        all = raw.map((x) => { const n = M.normalize(x); if (n) n.id = x.id; return n; }).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
      } catch (e) { console.error(e); TS.toast('Ishlarni oʻqib boʻlmadi.', 'error'); all = []; }
      if (!ctx.stale()) draw();
    }

    root.append(h('div', { class: 'page' },
      ui.pageHead('Mening ishlarim', 'Barcha ishlar shu brauzerda saqlanadi. Brauzer maʼlumotlari oʻchirilsa, ishlar yoʻqolishi mumkin — shuning uchun vaqti-vaqti bilan JSON zaxira oling.'),
      memWarn(),
      h('div', { class: 'toolbar' }, h('div', { class: 'search' }, icon('search', 18), search), sel, h('span', { class: 'spacer' }), backup, restore, file),
      status, list));
    draw();
    await reload();
  };

  /* ---------- Sozlamalar ---------- */
  TS.views.sozlamalar = async function (root) {
    TS.clear(root);
    const theme = h('div', { class: 'theme-pick', role: 'radiogroup', 'aria-label': 'Mavzu' });
    [['light', 'Yorugʻ'], ['dark', 'Qorongʻi'], ['system', 'Tizim boʻyicha']].forEach(([v, t]) => {
      const r = h('input', { type: 'radio', name: 'thm', value: v, checked: TS.prefs.getTheme() === v });
      r.addEventListener('change', () => { TS.prefs.setTheme(v); TS.syncThemeButtons(); });
      theme.append(h('label', null, r, t));
    });
    const auto = h('input', { type: 'checkbox', checked: TS.prefs.getAutosave() });
    auto.addEventListener('change', () => { TS.prefs.setAutosave(auto.checked); TS.toast(auto.checked ? 'Avto-saqlash yoqildi.' : 'Avto-saqlash oʻchirildi: ishlarni «Saqlash» tugmasi bilan saqlang.', 'success', 3500); });
    const fmt = TS.prefs.getFormat();
    const fp = ui.formatPanel(fmt, (f) => { if (!TS.prefs.setFormat(f)) TS.toast('Sozlamani saqlab boʻlmadi (brauzer xotirasi).', 'error'); });
    fp.el.open = true;
    const storageInfo = h('p', { class: 'hint', text: 'Xotira maʼlumoti hisoblanmoqda…' });
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((e) => { storageInfo.textContent = 'Band: ' + (e.usage / 1048576).toFixed(1) + ' MB' + (e.quota ? ' / taxminan ' + Math.round(e.quota / 1048576) + ' MB ruxsat etilgan' : '') + '.'; }).catch(() => { storageInfo.textContent = 'Xotira hajmini aniqlab boʻlmadi.'; });
    } else storageInfo.textContent = 'Brauzeringiz xotira hajmini koʻrsatmaydi.';
    const lib = (ok, name) => h('li', null, h('span', { class: 'badge ' + (ok ? 'ok' : 'warn') }, ok ? 'Yuklangan' : 'Yuklanmadi'), ' ' + name);
    const wipe = h('button', { class: 'btn danger', type: 'button', onclick: async () => {
      const ok = await TS.confirmBox('Barcha ishlarni oʻchirish', 'Shu brauzerdagi barcha referat, kurs ishi, mustaqil ish, maqola va prezentatsiyalar butunlay oʻchiriladi. Avval JSON zaxira olganingizga ishonch hosil qiling.', { okLabel: 'Hammasini oʻchirish', danger: true });
      if (!ok) return;
      try {
        await TS.store.clear();
        Object.keys(M.TYPES).forEach((t) => TS.prefs.setLastId(t, null));
        TS.toast('Barcha ishlar oʻchirildi.', 'success');
      } catch (e) { TS.toast('Oʻchirib boʻlmadi.', 'error'); }
    } }, icon('trash', 18), 'Barcha ishlarni oʻchirish');

    root.append(h('div', { class: 'page' },
      ui.pageHead('Sozlamalar', 'Koʻrinish, boshlangʻich hujjat formati va ishlar bilan bogʻliq sozlamalar.'),
      h('div', { class: 'stack' },
        h('section', { class: 'card' }, h('h2', { text: 'Koʻrinish' }), theme),
        h('section', { class: 'card' }, h('h2', { text: 'Saqlash' }),
          h('label', { class: 'check', style: { margin: '8px 0' } }, auto, h('span', { text: 'Ishlarni avtomatik saqlash' })),
          h('p', { class: 'hint', text: 'Ishlar IndexedDB’da, mavzu va sozlamalar localStorage’da — faqat shu brauzerda saqlanadi, hech qanday serverga yuborilmaydi.' }), storageInfo),
        h('section', { class: 'card' }, h('h2', { text: 'Yangi hujjatlar uchun boshlangʻich format' }), h('p', { class: 'sub', text: 'Oʻzgartirishlar faqat yangi referat, kurs ishi va maqolalarga taʼsir qiladi. Mavjud ishlar oʻz formatini saqlaydi.' }), fp.el),
        h('section', { class: 'card' }, h('h2', { text: 'Kutubxonalar' }), h('ul', { class: 'plain-list', style: { listStyle: 'none', padding: 0 } }, lib(!!window.docx, 'docx (DOCX eksport, MIT)'), lib(!!window.PptxGenJS, 'PptxGenJS (PPTX eksport, MIT)'))),
        h('section', { class: 'card' }, h('h2', { text: 'Maʼlumotlarni boshqarish' }), h('p', { class: 'sub', text: 'Zaxira nusxa va tiklash — «Mening ishlarim» sahifasida.' }), h('div', { class: 'row' }, h('a', { class: 'btn', href: '#/ishlar' }, icon('folder', 18), 'Mening ishlarim'), wipe)))));
  };

  /* ---------- Qo‘llanma (Foydalanuvchi yo‘riqnomasi) ---------- */
  TS.views.yoriqnoma = async function (root) {
    TS.clear(root);

    const sec = (title, badgeText, contentNodes) => h('section', { class: 'card' },
      h('div', { class: 'row', style: { marginBottom: '8px' } },
        h('h2', { text: title }),
        badgeText ? h('span', { class: 'badge' }, badgeText) : null),
      contentNodes);

    const guideItem = (q, a) => h('details', { class: 'details', style: { marginBottom: '10px' } },
      h('summary', null, q),
      h('div', { class: 'inner stack', style: { paddingTop: '8px', fontSize: '14.5px', color: 'var(--text)' } }, a));

    root.append(h('div', { class: 'page' },
      ui.pageHead('Foydalanish qoʻllanmasi', 'Talaba Studio platformasida ishlash, hujjatlarni toʻgʻri formatlash, slaydlarni tayyorlash va eksport qilish boʻyicha toʻliq yoʻriqnoma.', h('span', { class: 'badge ok' }, icon('shield', 14), '100% Oflayn va Xavfsiz')),

      h('div', { class: 'stack' },
        sec('1. Platforma haqida qisqacha', 'Asosiy tushuncha', [
          h('p', { text: 'Talaba Studio — talabalar, tadqiqotchilar va oʻqituvchilar uchun referat, kurs ishi (BMI), mustaqil ish, ilmiy maqola va taqdimotlarni oʻz matni asosida tartiblab, professional DOCX, PPTX, PDF yoki TXT qilib yuklab olish platformasidir.' }),
          h('div', { class: 'notice', style: { marginTop: '10px' } }, icon('info', 18),
            h('div', { text: 'Platforma matn yozib bermaydi, manba toʻqib chiqarmaydi va internetda tekshirmaydi. Siz oʻz matningizni kiritasiz — platforma esa uni OTM standartlari boʻyicha tuzilmaga joylaydi, formatlaydi va faylga aylantiradi.' }))
        ]),

        sec('2. Ish turlari va ulardan foydalanish', 'Shablonlar', [
          guideItem('📄 Referat qanday tayyorlanadi?', [
            h('ol', { class: 'steps' },
              h('li', { text: '«Titul varagʻi maʼlumotlari» boʻlimida OTM, fakultet, mavzu, fan, talaba va ustoz F.I.Sh. kabi maʼlumotlarni kiriting.' }),
              h('li', { text: '«Asosiy boʻlimlar soni»ni tanlang (masalan, 3 ta) va «Tuzilma yaratish» tugmasini bosing.' }),
              h('li', { text: 'Kirish, asosiy boʻlimlar, xulosa va adabiyotlar boʻyicha matnlaringizni joylashtiring.' }),
              h('li', { text: 'Reja avtomatik tarzda boʻlimlar sarlavhasidan shakllanadi.' }),
              h('li', { text: 'Pastdagi «DOCX yuklab olish» tugmasini bosing — tayyor A4, Times New Roman 14pt, 1.5 oraliqli rasmiy fayl yuklanadi.' }))
          ]),

          guideItem('📚 Kurs ishi va BMI (Diplom ishi) qanday tayyorlanadi?', [
            h('p', { text: 'Kurs ishi OTMlarning maxsus qatʼiy talablari asosida shakllanadi:' }),
            h('ul', { class: 'plain-list' },
              h('li', { text: 'Titul varagʻida Kafedra mudiri («Himoyaga ruxsat etildi»), ilmiy rahbar va taʼlim yoʻnalishi joylashadi.' }),
              h('li', { text: 'Kirish qismida dolzarblik, maqsad, vazifalar, obyekt, predmet, tadqiqot usullari koʻrsatiladi.' }),
              h('li', { text: 'Boblar: Standart 2 yoki 3 ta bob tanlanadi. Har bir bob ichida fasllarni «1.1-fasl. ...» yoki «1.2-fasl. ...» koʻrinishida yozing.' }),
              h('li', { text: 'DOCX eksport qilinganda har bir bob avtomatik yangi sahifadan boshlanadi va Mundarija shakllanadi.' }))
          ]),

          guideItem('📋 Mustaqil ish qanday tayyorlanadi?', [
            h('p', { text: 'Mustaqil taʼlim topshiriqlari uchun savollar sonini (masalan, 3 yoki 5 ta) tanlang va «Tuzilma yaratish»ni bosing. Har bir savol boʻyicha javob va yechim matnini kiriting, xulosa qismini toʻldirib yuklab oling.' })
          ]),

          guideItem('📰 Ilmiy maqola qanday yoziladi?', [
            h('p', { text: 'Maqola sarlavhasi, muallif, muassasa va ilmiy rahbar kiritiladi. Annotatsiya (Abstract) va kalit soʻzlar qoʻshiladi. Kirish, asosiy qism va xulosadan soʻng «Manba qoʻshish» tugmasi bilan adabiyotlar (muallif, kitob nomi, yil, havola) kiritiladi.' })
          ]),

          guideItem('📊 Prezentatsiya (Slaydlar) qanday yaratiladi?', [
            h('ul', { class: 'plain-list' },
              h('li', { text: 'Boʻsh slaydlar shabloni yoki tayyor matnni avtomatik slaydlarga taqsimlash mumkin.' }),
              h('li', { text: 'Matndan taqsimlashda: har bir yangi slayd sarlavhasi «# Sarlavha» qatori bilan boshlanishi yoki abzatslar boʻsh qator bilan ajratilishi kerak.' }),
              h('li', { text: '2 ustunli slayd: Slayd matnida «||» belgisi qoʻyilsa, matn ikki ustunga ajraladi (taqqoslash yoki afzallik/kamchiliklar uchun qulay).' }),
              h('li', { text: 'Yakuniy slayd: «Eʼtiboringiz uchun rahmat!» slaydi bir bosishda qoʻshiladi.' }),
              h('li', { text: 'Matn slaydga sigʻmasa: «Bir necha slaydga boʻlish» tugmasi chiqadi va gap chegarasidan boʻlib beradi.' }),
              h('li', { text: 'Namoyish: «Toʻliq ekranda namoyish» tugmasini bosing (klaviatura oʻqlari, probel yoki telefonda surish bilan boshqariladi).' }))
          ])
        ]),

        sec('3. Smart matn vositalari', 'Tozalash & Translit', [
          h('p', { text: 'Har bir katta matn maydoni (textarea) yuqori qismida ikkita foydali tugma mavjud:' }),
          h('ul', { class: 'plain-list' },
            h('li', null, h('strong', { text: '✨ Tozalash (Smart Cleaner): ' }), 'Internetdan yoki PDF fayllardan koʻchirib olingan matndagi buzuq apostroflarni (o\', o`, g\') toʻgʻri oʻ va gʻ ga, soʻz oʻrtasidagi tuturuq belgisini ʼ ga almashtiradi. Singan qatorlarni birlashtiradi, koʻp boʻshliqlarni bittaga keltiradi va tirelarni standartlaydi.'),
            h('li', null, h('strong', { text: '🔄 Lotin ⇄ Kirill: ' }), 'Matnni bir zumda Kirilldan Lotinga yoki Lotindan Kirillga oʻgirib beradi (barcha oʻzbek tili qoidalari va harf birikmalari hisobga olingan).'))
        ]),

        sec('4. Eksport va fayllarni yuklab olish', 'DOCX, PPTX, PDF, TXT', [
          h('div', { class: 'grid c2' },
            h('div', { class: 'card' },
              h('h3', { text: '📄 DOCX va PPTX' }),
              h('p', { class: 'hint', text: 'Haqiqiy Microsoft Word (.docx) va PowerPoint (.pptx) fayllari hosil qilinadi. Ularni bemalol kompyuteringizdagi Office dasturlarida ochib, qayta tahrirlashingiz mumkin.' })),
            h('div', { class: 'card' },
              h('h3', { text: '🖨️ PDF sifatida saqlash' }),
              h('p', { class: 'hint', text: 'PDF tugmasini bosganda brauzerning chop etish oynasi ochiladi. Printerni «PDF sifatida saqlash» qilib tanlang va qoʻshimcha sozlamalarda «Sarlavha va kolontitul» (Headers/Footers) belgisini oʻchirib qoʻying.' })),
            h('div', { class: 'card' },
              h('h3', { text: '📝 TXT va Nusxalash' }),
              h('p', { class: 'hint', text: 'Referat, kurs ishi yoki prezentatsiya matnlarini nutq soʻzlash (doklad) uchun bitta bosishda TXT qilib yuklab oling yoki toʻliq nusxalang (UTF-8 BOM bilan harflar buzilmaydi).' })),
            h('div', { class: 'card' },
              h('h3', { text: '⚙️ Hujjat formati' }),
              h('p', { class: 'hint', text: 'Standart format: A4, Times New Roman 14 pt, 1.5 oraliq, chap 3 sm, oʻng 1.5 sm, yuqori va past 2 sm. «Hujjat formati» panelida kafedrangiz talabiga moslab oʻzgartirishingiz mumkin.' })))
        ]),

        sec('5. Saqlash, xavfsizlik va zaxira olish', 'Muhim eslatma', [
          h('ul', { class: 'plain-list' },
            h('li', { text: 'Avto-saqlash: Siz yozayotgan paytda har 900 ms da ishlar avtomatik saqlanadi. Shuningdek, klaviaturadan Ctrl+S (yoki Cmd+S) bosib qoʻlda saqlash mumkin.' }),
            h('li', { text: 'Ishlar faqat shu brauzerning IndexedDB xotirasida saqlanadi. Hech qanday serverga yuborilmaydi.' }),
            h('li', { text: 'Muhim: Agar brauzer tarixini (kesh va cookie) tozalab yuborsangiz yoki kompyuterni qayta oʻrnatsangiz, ishlar yoʻqolishi mumkin. Shuning uchun «Mening ishlarim» boʻlimidagi «JSON zaxira» tugmasi bilan ishlaringizning zaxira nusxasini yuklab qoʻying.' }),
            h('li', { text: 'Boshqa kompyuterda yoki brauzerda «JSONdan tiklash» tugmasi orqali ishlaringizni bir soniyada qaytarib olishingiz mumkin.' }))
        ]),

        sec('6. Koʻp beriladigan savollar (FAQ)', 'Savol-Javob', [
          guideItem('Internet boʻlmasa Talaba Studio ishlaydimi?', [
            h('p', { text: 'Ha! Talaba Studio toʻliq oflayn ishlaydi. Hatto kompyuteringizda yoki telefoningizda internet umuman boʻlmasa ham barcha boʻlimlar, matn tozalash, transliteratsiya, DOCX va PPTX eksport bekamu-koʻst ishlayveradi.' })
          ]),
          guideItem('Kompyuter yoki telefonga ilova qilib oʻrnatish mumkinmi?', [
            h('p', { text: 'Ha! Talaba Studio PWA (Progressive Web App) texnologiyasini qoʻllab-quvvatlaydi. Brauzeringizning manzil satridagi «Oʻrnatish» (Install) belgisini bosing — ilova ish stolingizga yoki telefon ekraningizga alohida dastur sifatida oʻrnatiladi.' })
          ]),
          guideItem('Mening referat yoki kurs ishimni boshqalar koʻra oladimi?', [
            h('p', { text: 'Yoʻq. Platformada backend yoki markaziy server mavjud emas. Hamma maʼlumot faqat sizning shaxsiy brauzeringiz xotirasida turadi.' })
          ]),
          guideItem('Rezyume (CV) qanday yaratiladi?', [
            h('p', { text: 'Bosh sahifadagi «Talaba rezyumesi (CV)» kartasini bosing. U sizni zamonaviy AI Resume Builder xizmatiga olib oʻtadi va u yerda professional CV tayyorlashingiz mumkin.' })
          ])
        ]))));
  };
})();
