/* Talaba Studio — ma’lumotlar modeli, tekshiruvlar, eksport modeli, transliteratsiya va slaydlarga taqsimlash.
   Bu faylda DOM bilan ishlash yo‘q (Node.js’da sinash mumkin). */
(function () {
  'use strict';
  const TS = window.TS;

  const TYPES = {
    referat: { label: 'Referat', plural: 'Referatlar', noun: 'referat' },
    kurs: { label: 'Kurs ishi (BMI)', plural: 'Kurs ishlari', noun: 'kurs ishi' },
    mustaqil: { label: 'Mustaqil ish', plural: 'Mustaqil ishlar', noun: 'mustaqil ish' },
    maqola: { label: 'Maqola', plural: 'Maqolalar', noun: 'maqola' },
    prezentatsiya: { label: 'Prezentatsiya', plural: 'Prezentatsiyalar', noun: 'prezentatsiya' }
  };

  const REFERAT_META = [
    ['topic', 'Mavzu'], ['subject', 'Fan'], ['university', 'Universitet (OTM)'], ['faculty', 'Fakultet yoki yoʻnalish'],
    ['group', 'Guruh'], ['student', 'Talabaning F.I.Sh.'], ['teacher', 'Ustozning F.I.Sh.'], ['city', 'Shahar'], ['year', 'Yil']
  ];

  const KURS_META = [
    ['topic', 'Mavzu'], ['subject', 'Fan'], ['university', 'Universitet (OTM)'], ['faculty', 'Fakultet'],
    ['department', 'Kafedra'], ['direction', 'Taʼlim yoʻnalishi'], ['group', 'Guruh'],
    ['student', 'Talabaning F.I.Sh.'], ['supervisor', 'Ilmiy rahbar (ilmiy darajasi, F.I.Sh.)'],
    ['reviewer', 'Kafedra mudiri (F.I.Sh.)'], ['city', 'Shahar'], ['year', 'Yil']
  ];

  const MUSTAQIL_META = [
    ['topic', 'Mavzu'], ['subject', 'Fan'], ['university', 'Universitet (OTM)'],
    ['faculty', 'Fakultet yoki yoʻnalish'], ['group', 'Guruh'],
    ['student', 'Talabaning F.I.Sh.'], ['teacher', 'Tekshiruvchi oʻqituvchi F.I.Sh.'],
    ['city', 'Shahar'], ['year', 'Yil']
  ];

  const SECTION_KINDS = ['intro', 'main', 'ch1', 'ch2', 'ch3', 'conclusion', 'refs', 'appendix', 'custom'];
  const KIND_LABEL = {
    intro: 'Kirish',
    main: 'Asosiy bo‘lim',
    ch1: '1-Bob',
    ch2: '2-Bob',
    ch3: '3-Bob',
    conclusion: 'Xulosa va takliflar',
    refs: 'Foydalanilgan adabiyotlar',
    appendix: 'Ilovalar',
    custom: 'Bo‘lim'
  };

  const THEMES = {
    minimal: { label: 'Minimal light', bg: 'FFFFFF', ct: '111827', text: '374151', accent: '6A4CFF', band: null, tsBg: 'FFFFFF', tsTitle: '111827', tsSub: '4B5563' },
    academic: { label: 'Academic blue', bg: 'F3F6FD', ct: 'FFFFFF', text: '1B2A4A', accent: '1F4BB5', band: '173A87', tsBg: '173A87', tsTitle: 'FFFFFF', tsSub: 'C9D8F7' },
    violet: { label: 'Dark violet', bg: '16112E', ct: 'F5F3FF', text: 'DDD6FE', accent: 'A78BFA', band: null, tsBg: '16112E', tsTitle: 'FFFFFF', tsSub: 'C4B5FD' },
    emerald: { label: 'Emerald green', bg: 'F0FAF4', ct: 'FFFFFF', text: '133A26', accent: '0E8045', band: '0A5C31', tsBg: '0A5C31', tsTitle: 'FFFFFF', tsSub: 'C2EED7' },
    amber: { label: 'Warm amber', bg: 'FFFDF5', ct: 'FFFFFF', text: '3B2606', accent: 'B45309', band: '78350F', tsBg: '78350F', tsTitle: 'FFFFFF', tsSub: 'FDE68A' }
  };

  /* dyuymda (16:9 = 10 x 5.625) — ko‘rinish va PPTX bir xil geometriyadan foydalanadi */
  const GEOM = {
    W: 10, H: 5.625,
    band: { x: 0, y: 0, w: 10, h: 1.3 },
    cTitle: { x: 0.6, y: 0.28, w: 8.8, h: 0.8 },
    rule: { x: 0.6, y: 1.16, w: 0.9, h: 0.05 },
    body: { x: 0.6, y: 1.6, w: 8.8, h: 3.35 },
    bodyImg: { x: 0.6, y: 1.6, w: 4.8, h: 3.35 },
    img: { x: 5.7, y: 1.6, w: 3.7, h: 3.35 },
    col1: { x: 0.6, y: 1.6, w: 4.2, h: 3.35 },
    col2: { x: 5.2, y: 1.6, w: 4.2, h: 3.35 },
    tTitle: { x: 0.8, y: 1.2, w: 8.4, h: 1.8 },
    tLine: { x: 4.25, y: 3.15, w: 1.5, h: 0.06 },
    tSub: { x: 0.8, y: 3.4, w: 8.4, h: 1.4 }
  };

  const uid = () => TS.uid();
  const now = () => Date.now();
  const clean = (s) => String(s == null ? '' : s);

  /* ---------- Oʻzbekcha matn tozalash va standartlash (Smart Cleaner) ---------- */
  function cleanUzText(text) {
    if (!text) return '';
    let t = String(text);
    t = t.replace(/\u00A0/g, ' ');
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Qatorda sinib ketgan satrlarni (so'z oxirida tinish belgisi bo'lmasa) birlashtirish
    t = t.replace(/([^\n.!?…:;—\-])\n([a-zа-яёўқғҳ])/g, '$1 $2');
    // Ortiqcha probellarni bittaga keltirish
    t = t.replace(/[ \t]+/g, ' ');
    // Apostroflarni oʻ va gʻ uchun to'g'rilash
    t = t.replace(/([oO])['`‘ʼ’ʻ]/g, '$1ʻ');
    t = t.replace(/([gG])['`‘ʼ’ʻ]/g, '$1ʻ');
    // So'z o'rtasidagi tuturuq belgisi (ma'lumot -> maʼlumot)
    t = t.replace(/([a-zA-Zа-яА-ЯёЁ])['`‘’]([a-zA-Zа-яА-ЯёЁ])/g, '$1ʼ$2');
    // Tirelar: sonlar orasida en-dash, gapda em-dash
    t = t.replace(/(\d+)\s*-\s*(\d+)/g, '$1–$2');
    t = t.replace(/\s+-\s+/g, ' — ');
    // Qo'shtirnoqlar: "matn" -> «matn»
    t = t.replace(/(^|[\s(\[{])"([^"\n]+)"/g, '$1«$2»');
    // Ortiqcha bo'sh qatorlarni maksimal 2 taga qisqartirish
    t = t.split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n');
    return t.trim();
  }

  /* ---------- Oʻzbekcha Lotin ⇄ Kirill transliteratsiyasi ---------- */
  const LAT2CYR_MULTI = [
    [/sh/g, 'ш'], [/Sh/g, 'Ш'], [/SH/g, 'Ш'],
    [/ch/g, 'ч'], [/Ch/g, 'Ч'], [/CH/g, 'Ч'],
    [/yo/g, 'ё'], [/Yo/g, 'Ё'], [/YO/g, 'Ё'],
    [/yu/g, 'ю'], [/Yu/g, 'Ю'], [/YU/g, 'Ю'],
    [/ya/g, 'я'], [/Ya/g, 'Я'], [/YA/g, 'Я'],
    [/ye/g, 'е'], [/Ye/g, 'Е'], [/YE/g, 'Е'],
    [/o['`‘ʼ’ʻ]/g, 'ў'], [/O['`‘ʼ’ʻ]/g, 'Ў'],
    [/g['`‘ʼ’ʻ]/g, 'ғ'], [/G['`‘ʼ’ʻ]/g, 'Ғ'],
    [/ts/g, 'ц'], [/Ts/g, 'Ц'], [/TS/g, 'Ц']
  ];
  const LAT2CYR_SINGLE = {
    a: 'а', b: 'б', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж',
    k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р',
    s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з',
    A: 'А', B: 'Б', D: 'Д', F: 'Ф', G: 'Г', H: 'Ҳ', I: 'И', J: 'Ж',
    K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', Q: 'Қ', R: 'Р',
    S: 'С', T: 'Т', U: 'У', V: 'В', X: 'Х', Y: 'Й', Z: 'З',
    'ʼ': 'ъ', "'": 'ъ', '’': 'ъ', '`': 'ъ'
  };

  const CYR2LAT_MULTI = [
    [/ш/g, 'sh'], [/Ш/g, 'Sh'],
    [/ч/g, 'ch'], [/Ч/g, 'Ch'],
    [/ё/g, 'yo'], [/Ё/g, 'Yo'],
    [/ю/g, 'yu'], [/Ю/g, 'Yu'],
    [/я/g, 'ya'], [/Я/g, 'Ya'],
    [/ғ/g, 'gʻ'], [/Ғ/g, 'Gʻ'],
    [/ў/g, 'oʻ'], [/Ў/g, 'Oʻ'],
    [/ц/g, 'ts'], [/Ц/g, 'Ts'],
    [/щ/g, 'sh'], [/Щ/g, 'Sh']
  ];
  const CYR2LAT_SINGLE = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ж: 'j', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ҳ: 'h', қ: 'q',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Ж: 'J', З: 'Z', И: 'I',
    Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
    С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'X', Ҳ: 'H', Қ: 'Q',
    э: 'e', Э: 'E', ъ: 'ʼ', Ъ: 'ʼ', ь: '', Ь: ''
  };

  function translitUz(text, toScript) {
    if (!text) return '';
    let str = String(text);
    // Agar ko'rsatilmagan bo'lsa, qaysi alifbo ko'proq ekanini aniqlaymiz
    if (!toScript || toScript === 'auto') {
      const cyrCount = (str.match(/[а-яёўқғҳА-ЯЁЎҚҒҲ]/g) || []).length;
      const latCount = (str.match(/[a-zA-Z]/g) || []).length;
      toScript = cyrCount >= latCount ? 'lat' : 'cyr';
    }

    if (toScript === 'cyr') {
      // Lotin -> Kirill
      // So'z boshidagi 'e' larni 'э' ga o'zgartirish
      str = str.replace(/(^|[\s(\[{«"'\-])e/g, '$1э').replace(/(^|[\s(\[{«"'\-])E/g, '$1Э');
      // Unlilardan keyingi 'e' ni 'э' ga
      str = str.replace(/([aoeiuAOEIU])e/g, '$1э').replace(/([aoeiuAOEIU])E/g, '$1Э');
      LAT2CYR_MULTI.forEach(([re, rep]) => { str = str.replace(re, rep); });
      let out = '';
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        out += LAT2CYR_SINGLE[ch] !== undefined ? LAT2CYR_SINGLE[ch] : ch;
      }
      return out;
    } else {
      // Kirill -> Lotin
      // So'z boshidagi yoki unlidan keyingi 'е' ni 'ye' ga
      str = str.replace(/(^|[\s(\[{«"'\-])е/g, '$1ye').replace(/(^|[\s(\[{«"'\-])Е/g, '$1Ye');
      str = str.replace(/([аеёиоуэюяАЕЁИОУЭЮЯ])е/g, '$1ye').replace(/([аеёиоуэюяАЕЁИОУЭЮЯ])Е/g, '$1Ye');
      CYR2LAT_MULTI.forEach(([re, rep]) => { str = str.replace(re, rep); });
      let out = '';
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === 'е' || ch === 'Е') out += (ch === 'е' ? 'e' : 'E');
        else out += CYR2LAT_SINGLE[ch] !== undefined ? CYR2LAT_SINGLE[ch] : ch;
      }
      return out;
    }
  }

  /* ---------- Yangi loyihalar ---------- */
  function newFormat() {
    return TS.prefs ? TS.prefs.getFormat() : Object.assign({}, { page: 'A4', font: 'Times New Roman', size: 14, lineSpacing: 1.5, indent: 1.25, align: 'justify', mTop: 2, mBottom: 2, mLeft: 3, mRight: 1.5, pageNumbers: true });
  }
  const section = (kind, title, body) => ({ id: uid(), kind, title: title || '', body: body || '' });

  function referatStructure(nMain) {
    const list = [section('intro', 'Kirish')];
    for (let i = 0; i < nMain; i++) list.push(section('main', ''));
    list.push(section('conclusion', 'Xulosa'), section('refs', 'Foydalanilgan adabiyotlar'));
    return list;
  }

  function kursStructure(nChapters) {
    nChapters = Math.max(2, Math.min(4, parseInt(nChapters, 10) || 2));
    const introPh = `Mavzuning dolzarbligi: ...\n\nTadqiqotning maqsadi: ...\n\nTadqiqotning vazifalari:\n1. ...\n2. ...\n3. ...\n\nTadqiqot obyekti va predmeti: ...\n\nTadqiqot metodlari: ...\n\nIshning tuzilishi: Ish kirish, ${nChapters} ta bob, xulosa, adabiyotlar roʻyxatidan iborat.`;
    const list = [section('intro', 'Kirish', introPh)];
    for (let i = 1; i <= nChapters; i++) {
      const k = 'ch' + i;
      const bTitle = i === 1 ? '1-BOB. Nazariy-metodologik asoslar' : (i === 2 ? '2-BOB. Tahliliy-amaliy qism' : '3-BOB. Rivojlantirish istiqbollari va takliflar');
      const sampleBody = `${i}.1-fasl. Nazariy tushunchalar va mohiyati\nBu yerga fasl matnini kiriting.\n\n${i}.2-fasl. Zamonaviy holat va tahlil\nBu yerga keyingi fasl matnini kiriting.`;
      list.push(section(k, bTitle, sampleBody));
    }
    list.push(
      section('conclusion', 'Xulosa va takliflar'),
      section('refs', 'Foydalanilgan adabiyotlar roʻyxati'),
      section('appendix', 'Ilovalar')
    );
    return list;
  }

  function mustaqilStructure(nQuestions) {
    nQuestions = Math.max(1, Math.min(8, parseInt(nQuestions, 10) || 3));
    const list = [];
    for (let i = 1; i <= nQuestions; i++) {
      list.push(section('main', i + '-savol/topshiriq: '));
    }
    list.push(section('conclusion', 'Xulosa'), section('refs', 'Foydalanilgan adabiyotlar'));
    return list;
  }

  function newProject(type) {
    const t = now();
    const p = { id: uid(), type, name: 'Nomsiz ' + TYPES[type].noun, nameAuto: true, createdAt: t, updatedAt: t, data: null };
    if (type === 'referat') {
      p.data = { meta: { topic: '', subject: '', university: '', faculty: '', group: '', student: '', teacher: '', city: '', year: String(new Date().getFullYear()) }, sections: [], format: newFormat() };
    } else if (type === 'kurs') {
      p.data = { meta: { topic: '', subject: '', university: '', faculty: '', department: '', direction: '', group: '', student: '', supervisor: '', reviewer: '', city: '', year: String(new Date().getFullYear()) }, sections: [], format: newFormat() };
    } else if (type === 'mustaqil') {
      p.data = { meta: { topic: '', subject: '', university: '', faculty: '', group: '', student: '', teacher: '', city: '', year: String(new Date().getFullYear()) }, sections: [], format: newFormat() };
    } else if (type === 'maqola') {
      p.data = { title: '', author: '', institution: '', supervisor: '', abstract: '', keywords: '', intro: '', main: '', conclusion: '', refs: [], format: newFormat() };
    } else {
      p.data = { meta: { topic: '', author: '', group: '' }, theme: 'academic', src: '', slides: [] };
    }
    return p;
  }

  function autoName(p) {
    if (!p.nameAuto) return;
    const d = p.data;
    let t = '';
    if (p.type === 'referat' || p.type === 'kurs' || p.type === 'mustaqil') t = d.meta.topic;
    else if (p.type === 'maqola') t = d.title;
    else t = d.meta.topic;
    p.name = (t || '').trim().slice(0, 120) || 'Nomsiz ' + TYPES[p.type].noun;
  }

  /* ---------- Tekshirish va tozalash (import uchun) ---------- */
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max || 500000) : '');
  const ts = (v) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : now());
  function normImg(img) {
    if (!img || typeof img !== 'object' || typeof img.data !== 'string') return null;
    const m = /^data:image\/(png|jpeg);base64,/.exec(img.data);
    if (!m || img.data.length > 9000000) return null;
    if (!/^[A-Za-z0-9+/=]*$/.test(img.data.slice(m[0].length))) return null;
    const w = Number(img.w), h = Number(img.h);
    if (!(w > 0 && h > 0 && w < 20000 && h < 20000)) return null;
    return { data: img.data, w, h, name: str(img.name, 120) };
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !TYPES[raw.type] || !raw.data || typeof raw.data !== 'object') return null;
    const type = raw.type, d = raw.data;
    const p = newProject(type);
    p.id = typeof raw.id === 'string' && /^[\w-]{3,64}$/.test(raw.id) ? raw.id : uid();
    p.name = str(raw.name, 200).trim() || p.name;
    p.nameAuto = raw.nameAuto === true;
    p.createdAt = ts(raw.createdAt);
    p.updatedAt = ts(raw.updatedAt);

    if (type === 'referat' || type === 'kurs' || type === 'mustaqil') {
      const metaList = type === 'kurs' ? KURS_META : (type === 'mustaqil' ? MUSTAQIL_META : REFERAT_META);
      metaList.forEach(([k]) => { p.data.meta[k] = str(d.meta && d.meta[k], 400); });
      p.data.sections = (Array.isArray(d.sections) ? d.sections.slice(0, 80) : []).filter((s) => s && typeof s === 'object').map((s) => ({
        id: uid(), kind: SECTION_KINDS.includes(s.kind) ? s.kind : 'custom', title: str(s.title, 400), body: str(s.body)
      }));
      p.data.format = TS.prefs.sanitizeFormat(d.format);
    } else if (type === 'maqola') {
      ['title', 'author', 'institution', 'supervisor', 'keywords'].forEach((k) => { p.data[k] = str(d[k], 1000); });
      ['abstract', 'intro', 'main', 'conclusion'].forEach((k) => { p.data[k] = str(d[k]); });
      p.data.refs = (Array.isArray(d.refs) ? d.refs.slice(0, 300) : []).filter((r) => r && typeof r === 'object').map((r) => ({
        id: uid(), author: str(r.author, 500), title: str(r.title, 1000), year: str(r.year, 20), url: str(r.url, 2000)
      }));
      p.data.format = TS.prefs.sanitizeFormat(d.format);
    } else {
      ['topic', 'author', 'group'].forEach((k) => { p.data.meta[k] = str(d.meta && d.meta[k], 400); });
      p.data.theme = THEMES[d.theme] ? d.theme : 'academic';
      p.data.src = str(d.src);
      p.data.slides = (Array.isArray(d.slides) ? d.slides.slice(0, 100) : []).filter((s) => s && typeof s === 'object').map((s) => ({
        id: uid(), kind: ['title', 'split', 'closing'].includes(s.kind) ? s.kind : 'content', title: str(s.title, 600), body: str(s.body, 20000), img: normImg(s.img)
      }));
    }
    return p;
  }

  /* ---------- Matn yordamchilari ---------- */
  const paras = (t) => clean(t).replace(/\t/g, ' ').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const refLines = (body) => paras(body).map((l) => l.replace(/^\d+\s*[.)]\s*/, ''));
  function fmtRef(r) {
    const head = [r.author, r.title, r.year].map((x) => clean(x).trim()).filter(Boolean).map((x) => x.replace(/[.]+$/, '')).join('. ');
    const url = clean(r.url).trim();
    if (!head && !url) return '';
    return head ? head + '.' + (url ? ' ' + url : '') : url;
  }

  /* ---------- Eksport modellari (DOCX, PDF va TXT uchun umumiy) ---------- */
  function referatModel(p) {
    const d = p.data, m = d.meta, f = d.format;
    const title = [];
    const add = (t, o) => { t = clean(t).trim(); if (t) title.push(Object.assign({ t }, o)); };
    add(m.university, { sz: f.size, b: true, al: 'center' });
    add(m.faculty, { sz: f.size, al: 'center', gap: 4 });
    const hasAny = title.length || m.topic.trim() || m.student.trim();
    if (hasAny) add('REFERAT', { sz: 28, b: true, al: 'center', gap: 150 });
    if (m.topic.trim()) { add('Mavzu:', { sz: f.size, al: 'center', gap: 24 }); add(m.topic, { sz: f.size + 4, b: true, al: 'center', gap: 4 }); }
    if (m.subject.trim()) add('Fan: ' + m.subject.trim(), { sz: f.size, al: 'center', gap: 14 });
    let first = true;
    const right = (label, v) => { if (clean(v).trim()) { add(label + ': ' + clean(v).trim(), { sz: f.size, al: 'right', gap: first ? 110 : 4 }); first = false; } };
    right('Guruh', m.group); right('Bajardi', m.student); right('Qabul qildi', m.teacher);
    const place = [m.city.trim(), m.year.trim()].filter(Boolean).join(', ');
    if (place) add(place, { sz: f.size, al: 'center', gap: first ? 120 : 110 });

    const secs = d.sections.filter((s) => s.body.trim());
    const blocks = [];
    const toc = secs.map((s) => s.title.trim()).filter(Boolean);
    if (toc.length) {
      blocks.push({ k: 'h', t: 'Reja' });
      toc.forEach((t, i) => blocks.push({ k: 'plain', t: (i + 1) + '. ' + t, al: 'left' }));
    }
    secs.forEach((s, i) => {
      if (s.title.trim()) blocks.push({ k: 'h', t: s.title.trim(), pb: i === 0 && toc.length > 0 });
      if (s.kind === 'refs') refLines(s.body).forEach((l, n) => blocks.push({ k: 'plain', t: (n + 1) + '. ' + l, al: 'left' }));
      else paras(s.body).forEach((l) => blocks.push({ k: 'p', t: l }));
    });
    return { title: title.length ? title : null, blocks };
  }

  function kursModel(p) {
    const d = p.data, m = d.meta, f = d.format;
    const title = [];
    const add = (t, o) => { t = clean(t).trim(); if (t) title.push(Object.assign({ t }, o)); };

    add(m.university, { sz: f.size, b: true, al: 'center' });
    if (m.faculty.trim()) add(m.faculty, { sz: f.size, al: 'center', gap: 4 });
    if (m.department.trim()) add('«' + m.department + '» kafedrasi', { sz: f.size, al: 'center', gap: 4 });

    if (m.reviewer.trim()) {
      add('«HIMOYAGA RUXSAT ETILDI»', { sz: f.size - 1, b: true, al: 'right', gap: 60 });
      add('Kafedra mudiri: ' + m.reviewer, { sz: f.size - 1, al: 'right', gap: 4 });
      add('«____» ____________ 20___ yil', { sz: f.size - 1, al: 'right', gap: 4 });
    }

    add('KURS ISHI', { sz: 30, b: true, al: 'center', gap: m.reviewer.trim() ? 80 : 140 });
    if (m.topic.trim()) {
      add('Mavzu:', { sz: f.size, al: 'center', gap: 20 });
      add(m.topic, { sz: f.size + 4, b: true, al: 'center', gap: 4 });
    }
    if (m.subject.trim()) add('Fan: ' + m.subject.trim(), { sz: f.size, al: 'center', gap: 14 });
    if (m.direction.trim()) add('Yoʻnalish: ' + m.direction.trim(), { sz: f.size, al: 'center', gap: 4 });

    let first = true;
    const right = (label, v) => { if (clean(v).trim()) { add(label + ': ' + clean(v).trim(), { sz: f.size, al: 'right', gap: first ? 80 : 4 }); first = false; } };
    right('Bajaruvchi', m.student);
    right('Guruh', m.group);
    right('Ilmiy rahbar', m.supervisor);

    const place = [m.city.trim(), m.year.trim()].filter(Boolean).join(', ');
    if (place) add(place, { sz: f.size, al: 'center', gap: first ? 100 : 90 });

    const secs = d.sections.filter((s) => s.body.trim());
    const blocks = [];
    const toc = secs.map((s) => s.title.trim()).filter(Boolean);
    if (toc.length) {
      blocks.push({ k: 'h', t: 'Mundarija' });
      toc.forEach((t) => blocks.push({ k: 'plain', t, al: 'left' }));
    }

    secs.forEach((s, i) => {
      const isChapter = s.kind.startsWith('ch') || /^(\d+-bob|kirish|xulosa)/i.test(s.title);
      if (s.title.trim()) {
        blocks.push({ k: 'h', t: s.title.trim(), pb: i === 0 && toc.length > 0 ? true : isChapter });
      }
      if (s.kind === 'refs') {
        refLines(s.body).forEach((l, n) => blocks.push({ k: 'plain', t: (n + 1) + '. ' + l, al: 'left' }));
      } else {
        paras(s.body).forEach((l) => {
          if (/^\d+\.\d+[-.]?\s+[^\n]+$/.test(l)) {
            blocks.push({ k: 'subhead', t: l });
          } else {
            blocks.push({ k: 'p', t: l });
          }
        });
      }
    });

    return { title: title.length ? title : null, blocks };
  }

  function mustaqilModel(p) {
    const d = p.data, m = d.meta, f = d.format;
    const title = [];
    const add = (t, o) => { t = clean(t).trim(); if (t) title.push(Object.assign({ t }, o)); };
    add(m.university, { sz: f.size, b: true, al: 'center' });
    add(m.faculty, { sz: f.size, al: 'center', gap: 4 });
    add('MUSTAQIL TAʼLIM TOPSHIRIGʻI', { sz: 26, b: true, al: 'center', gap: 140 });
    if (m.topic.trim()) { add('Mavzu:', { sz: f.size, al: 'center', gap: 20 }); add(m.topic, { sz: f.size + 4, b: true, al: 'center', gap: 4 }); }
    if (m.subject.trim()) add('Fan: ' + m.subject.trim(), { sz: f.size, al: 'center', gap: 14 });
    let first = true;
    const right = (label, v) => { if (clean(v).trim()) { add(label + ': ' + clean(v).trim(), { sz: f.size, al: 'right', gap: first ? 110 : 4 }); first = false; } };
    right('Guruh', m.group); right('Talaba', m.student); right('Qabul qildi', m.teacher);
    const place = [m.city.trim(), m.year.trim()].filter(Boolean).join(', ');
    if (place) add(place, { sz: f.size, al: 'center', gap: first ? 120 : 110 });

    const secs = d.sections.filter((s) => s.body.trim());
    const blocks = [];
    const toc = secs.map((s) => s.title.trim()).filter(Boolean);
    if (toc.length) {
      blocks.push({ k: 'h', t: 'Topshiriq rejasi' });
      toc.forEach((t, i) => blocks.push({ k: 'plain', t: (i + 1) + '. ' + t, al: 'left' }));
    }
    secs.forEach((s, i) => {
      if (s.title.trim()) blocks.push({ k: 'h', t: s.title.trim(), pb: i === 0 && toc.length > 0 });
      if (s.kind === 'refs') refLines(s.body).forEach((l, n) => blocks.push({ k: 'plain', t: (n + 1) + '. ' + l, al: 'left' }));
      else paras(s.body).forEach((l) => blocks.push({ k: 'p', t: l }));
    });
    return { title: title.length ? title : null, blocks };
  }

  function maqolaModel(p) {
    const d = p.data;
    const blocks = [];
    const plain = (t, o) => { t = clean(t).trim(); if (t) blocks.push(Object.assign({ k: 'plain', t, al: 'center' }, o)); };
    plain(d.title, { b: true, sz: d.format.size + 2 });
    plain(d.author, { b: true });
    plain(d.institution, { i: true });
    if (d.supervisor.trim()) plain('Ilmiy rahbar: ' + d.supervisor.trim());
    if (d.abstract.trim()) blocks.push({ k: 'labeled', label: 'Annotatsiya.', t: paras(d.abstract).join(' ') });
    if (d.keywords.trim()) blocks.push({ k: 'labeled', label: 'Kalit so‘zlar:', t: d.keywords.trim() });
    [['intro', 'Kirish'], ['main', 'Asosiy qism'], ['conclusion', 'Xulosa']].forEach(([k, label]) => {
      if (d[k].trim()) { blocks.push({ k: 'h', t: label }); paras(d[k]).forEach((l) => blocks.push({ k: 'p', t: l })); }
    });
    const refs = d.refs.map(fmtRef).filter(Boolean);
    if (refs.length) {
      blocks.push({ k: 'h', t: 'Foydalanilgan adabiyotlar' });
      refs.forEach((r, i) => blocks.push({ k: 'plain', t: (i + 1) + '. ' + r, al: 'left' }));
    }
    return { title: null, blocks };
  }

  function exportModel(p) {
    if (p.type === 'referat') return referatModel(p);
    if (p.type === 'kurs') return kursModel(p);
    if (p.type === 'mustaqil') return mustaqilModel(p);
    if (p.type === 'maqola') return maqolaModel(p);
    return null;
  }

  function plainText(p) {
    if (p.type === 'prezentatsiya') {
      const d = p.data;
      const lines = ['PREZENTATSIYA: ' + (d.meta.topic || p.name)];
      if (d.meta.author) lines.push('Muallif: ' + d.meta.author + (d.meta.group ? ' (' + d.meta.group + ')' : ''));
      lines.push('='.repeat(40));
      d.slides.forEach((s, idx) => {
        lines.push('');
        lines.push(`${idx + 1}-SLAYD: ${s.title || (s.kind === 'title' ? 'Titul' : 'Sarlavhasiz')}`);
        if (s.body && s.body.trim()) lines.push(s.body.trim());
        if (s.img) lines.push('[Rasm ilova qilingan: ' + (s.img.name || 'rasm') + ']');
        lines.push('-'.repeat(30));
      });
      return lines.join('\n') + '\n';
    }

    const m = exportModel(p);
    if (!m) return '';
    const out = [];
    if (m.title) { out.push(m.title.map((l) => l.t).join('\n')); }
    m.blocks.forEach((b) => {
      if (b.k === 'labeled') out.push(b.label + ' ' + b.t);
      else if (b.k === 'h' || b.k === 'subhead') out.push('\n' + b.t);
      else out.push(b.t);
    });
    return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  /* ---------- Eksportdan oldingi tekshiruv ---------- */
  function precheck(p) {
    const r = { error: null, empty: [], missing: [], notes: [] };
    const d = p.data;

    if (p.type === 'referat' || p.type === 'kurs' || p.type === 'mustaqil') {
      if (!d.sections.length) { r.error = 'Avval «Tuzilma yaratish» tugmasini bosing.'; return r; }
      if (!d.sections.some((s) => s.body.trim())) { r.error = 'Eksport qilish uchun kamida bitta bo‘limga matn kiriting.'; return r; }
      let mainN = 0;
      d.sections.forEach((s) => {
        if (s.kind === 'main') mainN++;
        const name = s.title.trim() || (s.kind === 'main' ? 'Bo‘lim ' + mainN : (KIND_LABEL[s.kind] || 'Boʻlim'));
        if (!s.body.trim()) r.empty.push(name);
        else if (!s.title.trim()) r.notes.push('«' + name + '» bo‘limida sarlavha yo‘q — sarlavhasiz chiqadi.');
      });
      const metaKeys = p.type === 'kurs' ? KURS_META : (p.type === 'mustaqil' ? MUSTAQIL_META : REFERAT_META);
      metaKeys.forEach(([k, label]) => {
        if (!d.meta[k] || !d.meta[k].trim()) {
          if (['topic', 'student', 'university'].includes(k)) r.missing.push(label);
        }
      });
    } else if (p.type === 'maqola') {
      const any = ['title', 'author', 'institution', 'abstract', 'keywords', 'intro', 'main', 'conclusion'].some((k) => d[k].trim()) || d.refs.some((x) => fmtRef(x));
      if (!any) { r.error = 'Eksport qilish uchun kamida bitta maydonni to‘ldiring.'; return r; }
      [['abstract', 'Annotatsiya'], ['keywords', 'Kalit so‘zlar'], ['intro', 'Kirish'], ['main', 'Asosiy qism'], ['conclusion', 'Xulosa']].forEach(([k, l]) => { if (!d[k].trim()) r.empty.push(l); });
      if (!d.refs.some((x) => fmtRef(x))) r.empty.push('Foydalanilgan adabiyotlar');
      [['title', 'Maqola sarlavhasi'], ['author', 'Muallif'], ['institution', 'Taʼlim muassasasi']].forEach(([k, l]) => { if (!d[k].trim()) r.missing.push(l); });
    } else {
      if (!d.slides.length) { r.error = 'Avval slaydlar yarating.'; return r; }
      const isEmpty = (s) => !s.title.trim() && !s.body.trim() && !s.img;
      if (d.slides.every(isEmpty)) { r.error = 'Barcha slaydlar bo‘sh. Kamida bittasiga matn yoki rasm qo‘shing.'; return r; }
      d.slides.forEach((s, i) => {
        if (isEmpty(s)) r.empty.push((i + 1) + '-slayd');
        else if (s.kind !== 'title' && s.kind !== 'closing' && s.body.trim() && !bodyLayout(s.body, !!s.img).fits) r.notes.push((i + 1) + '-slaydda matn sig‘masligi mumkin (kichik shriftda ham). «Bo‘lish» tugmasidan foydalaning.');
      });
    }
    return r;
  }

  function stats(p) {
    const d = p.data;
    let text = '';
    if (p.type === 'referat' || p.type === 'kurs' || p.type === 'mustaqil') text = d.sections.map((s) => s.body).join('\n');
    else if (p.type === 'maqola') text = [d.abstract, d.keywords, d.intro, d.main, d.conclusion].join('\n') + '\n' + d.refs.map(fmtRef).join('\n');
    else text = d.slides.map((s) => s.title + '\n' + s.body).join('\n');
    return { words: TS.words(text), chars: TS.chars(text) };
  }

  /* ---------- Slaydlar ---------- */
  const newSlide = (kind) => ({ id: uid(), kind: kind || 'content', title: '', body: '', img: null });

  function titleSlide(meta) {
    const s = newSlide('title');
    s.title = clean(meta.topic).trim();
    s.body = [meta.author && 'Muallif: ' + meta.author.trim(), meta.group && 'Guruh: ' + meta.group.trim()].filter(Boolean).join('\n');
    return s;
  }

  function closingSlide() {
    const s = newSlide('closing');
    s.title = 'Eʼtiboringiz uchun rahmat!';
    s.body = 'Savollar va takliflar uchun';
    return s;
  }

  function blankDeck(meta, n) {
    n = Math.max(1, Math.min(40, parseInt(n, 10) || 8));
    const list = [titleSlide(meta)];
    for (let i = 1; i < n - 1; i++) list.push(newSlide('content'));
    if (n > 1) list.push(closingSlide());
    return list;
  }

  function parseBody(body) {
    return clean(body).replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = /^([-•*–])\s+(.*)$/.exec(l);
      return m ? { text: m[2], bullet: true } : { text: l, bullet: false };
    });
  }

  /* Shrift o‘lchamini matn hajmiga qarab tanlaydi; sig‘masa fits=false */
  function bodyLayout(body, hasImg, minPt) {
    const width = hasImg ? GEOM.bodyImg.w : GEOM.body.w;
    const height = GEOM.body.h;
    const lines = parseBody(body);
    if (!lines.length) return { pt: 24, fits: true };
    for (const pt of [24, 22, 20, 18, 16, 14]) {
      if (minPt && pt < minPt) break;
      const cpl = Math.max(8, Math.floor((width * 72) / (pt * 0.53)));
      let n = 0;
      lines.forEach((l) => { n += Math.max(1, Math.ceil((l.text.length + (l.bullet ? 3 : 0)) / cpl)); });
      const need = (n * pt * 1.22 + lines.length * pt * 0.4) / 72;
      if (need <= height) return { pt, fits: true };
    }
    return { pt: Math.max(14, minPt || 14), fits: false };
  }

  function titlePt(title, isTitleSlide) {
    const n = clean(title).length;
    if (isTitleSlide) return n <= 40 ? 40 : n <= 80 ? 34 : 28;
    return n <= 40 ? 32 : n <= 70 ? 28 : 24;
  }

  function fitImage(img, box) {
    const k = Math.min(box.w / img.w, box.h / img.h);
    const w = img.w * k, h = img.h * k;
    return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
  }

  /* Gaplarga ajratish: so‘z o‘rtasidan kesilmaydi */
  function sentences(line) {
    const bm = /^([-•*–]\s+)/.exec(line);
    const prefix = bm ? bm[1] : '';
    const text = line.slice(prefix.length);
    const parts = text.match(/[^.!?…]+(?:[.!?…]+["'»”’)]*|$)\s*/g) || [text];
    if (parts.join('').replace(/\s/g, '') !== text.replace(/\s/g, '')) return [line];
    return parts.map((x) => x.trim()).filter(Boolean).map((x) => prefix + x);
  }

  /* Bir qatordan chiqqan gaplar chunk ichida yana bitta qatorga (probel bilan) birlashtiriladi */
  function joinUnits(us) {
    const out = [];
    us.forEach((u) => {
      if (out.length && out[out.length - 1].k === u.k) out[out.length - 1].t += ' ' + u.t.replace(/^[-•*–]\s+/, '');
      else out.push({ t: u.t, k: u.k });
    });
    return out.map((x) => x.t).join('\n');
  }

  function chunkBody(body, hasImg, minPt) {
    const lines = clean(body).replace(/\r/g, '').split('\n').filter((s) => s.trim());
    const units = [];
    lines.forEach((l, k) => {
      if (bodyLayout(l, hasImg, minPt).fits) units.push({ t: l, k });
      else sentences(l).forEach((x) => units.push({ t: x, k }));
    });
    const chunks = [];
    let cur = [];
    units.forEach((u) => {
      if (cur.length && !bodyLayout(joinUnits(cur.concat(u)), hasImg, minPt).fits) { chunks.push(joinUnits(cur)); cur = [u]; } else cur.push(u);
    });
    if (cur.length) chunks.push(joinUnits(cur));
    return chunks.length ? chunks : [''];
  }

  /* Slaydni sig‘adigan bo‘laklarga bo‘ladi (birinchisi o‘z joyida qoladi) */
  function splitSlide(s) {
    const chunks = chunkBody(s.body, !!s.img, 18);
    if (chunks.length < 2) return [s];
    return chunks.map((c, i) => {
      if (i === 0) return Object.assign({}, s, { body: c });
      const n = newSlide('content');
      n.title = s.title.trim() ? s.title.trim() + ' (davomi)' : '';
      n.body = c;
      return n;
    });
  }

  function distribute(text, meta, requestedN) {
    const notes = [];
    const slides = [];
    if (clean(meta.topic).trim()) slides.push(titleSlide(meta));
    const lines = clean(text).replace(/\r/g, '').split('\n');
    const hasHeading = lines.some((l) => /^\s*#+\s*\S/.test(l));
    const groups = [];
    let cur = null;
    if (hasHeading) {
      lines.forEach((l) => {
        const m = /^\s*#+\s*(.*\S)\s*$/.exec(l);
        if (m) { cur = { title: m[1], lines: [] }; groups.push(cur); } else if (l.trim()) {
          if (!cur) { cur = { title: '', lines: [] }; groups.push(cur); }
          cur.lines.push(l.trim());
        }
      });
    } else {
      let block = [];
      const flush = () => { if (block.length) { groups.push({ title: '', lines: block }); block = []; } };
      lines.forEach((l) => { if (l.trim()) block.push(l.trim()); else flush(); });
      flush();
    }
    groups.forEach((g) => {
      chunkBody(g.lines.join('\n'), false, 18).forEach((c, i) => {
        const s = newSlide('content');
        s.title = i === 0 ? g.title : (g.title ? g.title + ' (davomi)' : '');
        s.body = c;
        slides.push(s);
      });
    });
    if (!groups.length) notes.push('Tayanch matn bo‘sh — faqat titul slaydi yaratildi.');
    const noTitle = slides.filter((s) => s.kind !== 'title' && !s.title.trim()).length;
    if (noTitle) notes.push(noTitle + ' ta slaydda sarlavha yo‘q. Sarlavha qo‘shish uchun matnda «# Sarlavha» qatoridan foydalaning yoki slaydni tahrirlang.');
    const n = parseInt(requestedN, 10);
    if (n && slides.length > n) notes.push('Siz ' + n + ' ta slayd so‘ragansiz, matn esa ' + slides.length + ' ta slaydga taqsimlandi. Matn qisqartirilmadi — slaydlar sonini o‘zingiz tahrirlab kamaytirishingiz mumkin.');
    else if (n && slides.length < n) notes.push('Matn ' + slides.length + ' ta slaydga bo‘lindi (so‘ralgan: ' + n + '). Kerak bo‘lsa, «Slayd qo‘shish» tugmasi bilan qo‘shing.');
    const over = slides.filter((s) => s.kind !== 'title' && s.kind !== 'closing' && !bodyLayout(s.body, false).fits).length;
    if (over) notes.push(over + ' ta slaydda matn juda uzun gap tufayli sig‘masligi mumkin — ularda «Bo‘lish» yoki qo‘lda tahrirlash kerak.');
    return { slides, notes };
  }

  TS.model = {
    TYPES, REFERAT_META, KURS_META, MUSTAQIL_META, KIND_LABEL, THEMES, GEOM,
    newProject, autoName, normalize, referatStructure, kursStructure, mustaqilStructure, section,
    paras, refLines, fmtRef, exportModel, plainText, precheck, stats,
    newSlide, titleSlide, closingSlide, blankDeck, parseBody, bodyLayout, titlePt, fitImage, splitSlide, distribute, chunkBody,
    cleanUzText, translitUz
  };
})();
