/* Talaba Studio — eksport: DOCX, PDF (chop etish), TXT, nusxalash, PPTX va JSON zaxira */
(function () {
  'use strict';
  const TS = window.TS;
  const { h } = TS;

  const LIB_DOCX = 'DOCX kutubxonasi yuklanmadi (vendor/docx.iife.js). Sahifani yangilang yoki fayl joyida ekanini tekshiring. Muharrir ishlashda davom etadi — matnni TXT sifatida yuklab olishingiz yoki nusxalashingiz mumkin.';
  const LIB_PPTX = 'PPTX kutubxonasi yuklanmadi (vendor/pptxgen.bundle.js). Sahifani yangilang yoki fayl joyida ekanini tekshiring. Slaydlarni tahrirlash va namoyish qilish ishlashda davom etadi.';

  /* ---------- DOCX ---------- */
  function docxDocument(p) {
    const lib = window.docx;
    if (!lib) throw new Error(LIB_DOCX);
    const { Document, Paragraph, TextRun, AlignmentType, Footer, PageNumber, HeadingLevel } = lib;
    const f = p.data.format;
    const m = TS.model.exportModel(p);
    if (!m) throw new Error('Hujjat modelini tuzib boʻlmadi.');
    const sz = Math.round(f.size * 2);
    const line = Math.round(240 * f.lineSpacing);
    const cm = (v) => Math.round(v * 567);
    const AL = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED };
    const run = (t, o) => new TextRun(Object.assign({ text: t, font: f.font, size: sz }, o || {}));
    const pageSize = f.page === 'Letter' ? { width: 12240, height: 15840 } : { width: 11906, height: 16838 };
    const margin = { top: cm(f.mTop), bottom: cm(f.mBottom), left: cm(f.mLeft), right: cm(f.mRight) };

    const titleParas = (m.title || []).map((l) => new Paragraph({
      alignment: AL[l.al || 'left'],
      spacing: { before: Math.round((l.gap || 0) * 20), line: 276 },
      children: [run(l.t, { size: Math.round((l.sz || f.size) * 2), bold: !!l.b })]
    }));
    const body = m.blocks.map((b) => {
      if (b.k === 'h') {
        return new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AL.center, pageBreakBefore: !!b.pb, keepNext: true, spacing: { before: 240, after: 160, line }, children: [run(b.t, { bold: true })] });
      }
      if (b.k === 'subhead') {
        return new Paragraph({ heading: HeadingLevel.HEADING_2, alignment: AL[f.align], keepNext: true, spacing: { before: 180, after: 120, line }, children: [run(b.t, { bold: true })] });
      }
      if (b.k === 'p') {
        return new Paragraph({ alignment: AL[f.align], indent: { firstLine: Math.round(f.indent * 567) }, spacing: { line }, children: [run(b.t)] });
      }
      if (b.k === 'labeled') {
        return new Paragraph({ alignment: AL[f.align], spacing: { line, before: 120 }, children: [run(b.label + ' ', { bold: true }), run(b.t)] });
      }
      return new Paragraph({
        alignment: AL[b.al || 'left'], spacing: { line, before: 0, after: 0 },
        children: [run(b.t, { bold: !!b.b, italics: !!b.i, size: b.sz ? Math.round(b.sz * 2) : sz })]
      });
    });

    const sections = [];
    if (titleParas.length) sections.push({ properties: { page: { size: pageSize, margin } }, children: titleParas });
    const mainSection = {
      properties: { page: Object.assign({ size: pageSize, margin }, f.pageNumbers ? { pageNumbers: { start: titleParas.length ? 2 : 1 } } : {}) },
      children: body.length ? body : [new Paragraph({ children: [run('')] })]
    };
    if (f.pageNumbers) {
      mainSection.footers = { default: new Footer({ children: [new Paragraph({ alignment: AL.center, children: [new TextRun({ children: [PageNumber.CURRENT], font: f.font, size: sz })] })] }) };
    }
    sections.push(mainSection);

    return new Document({
      creator: 'Talaba Studio', title: p.name,
      styles: {
        default: { document: { run: { font: f.font, size: sz } } },
        paragraphStyles: [
          {
            id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { font: f.font, size: sz, bold: true, color: '000000' }, paragraph: { spacing: { before: 240, after: 160 } }
          },
          {
            id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { font: f.font, size: sz, bold: true, color: '000000' }, paragraph: { spacing: { before: 180, after: 120 } }
          }
        ]
      },
      sections
    });
  }
  async function docxBlob(p) {
    const doc = docxDocument(p);
    return window.docx.Packer.toBlob(doc);
  }

  /* ---------- PDF (brauzerning chop etish oynasi orqali) ---------- */
  function fillPrint(p) {
    const root = document.getElementById('print-root');
    TS.clear(root);
    const f = p.data.format;
    const m = TS.model.exportModel(p);
    if (!m) return;
    const wrap = h('div', { class: 'pp', style: { fontFamily: '"' + f.font + '", "Times New Roman", serif', fontSize: f.size + 'pt', lineHeight: String(f.lineSpacing) } });
    if (m.title) {
      const tp = h('div', { class: 'pp-title' });
      m.title.forEach((l) => tp.appendChild(h('div', { text: l.t, style: { textAlign: l.al || 'left', marginTop: (l.gap || 0) + 'pt', fontSize: (l.sz || f.size) + 'pt', fontWeight: l.b ? '700' : '400', lineHeight: '1.15' } })));
      wrap.appendChild(tp);
    }
    m.blocks.forEach((b) => {
      let el;
      if (b.k === 'h') el = h('h1', { text: b.t, class: b.pb ? 'pp-pb' : '' });
      else if (b.k === 'subhead') el = h('h2', { text: b.t, style: { fontSize: (f.size + 1) + 'pt', fontWeight: '700', textAlign: f.align, margin: '14pt 0 6pt' } });
      else if (b.k === 'p') el = h('p', { text: b.t, style: { textAlign: f.align, textIndent: f.indent + 'cm' } });
      else if (b.k === 'labeled') el = h('p', { style: { textAlign: f.align } }, h('b', { text: b.label + ' ' }), b.t);
      else el = h('p', { text: b.t, style: { textAlign: b.al || 'left', fontWeight: b.b ? '700' : '400', fontStyle: b.i ? 'italic' : 'normal', fontSize: (b.sz || f.size) + 'pt' } });
      wrap.appendChild(el);
    });
    root.appendChild(wrap);
    let st = document.getElementById('print-page-style');
    if (!st) { st = document.createElement('style'); st.id = 'print-page-style'; document.head.appendChild(st); }
    st.textContent = '@page{size:' + (f.page === 'Letter' ? 'letter' : 'A4') + ';margin:' + f.mTop + 'cm ' + f.mRight + 'cm ' + f.mBottom + 'cm ' + f.mLeft + 'cm}';
  }

  async function printPdf(p) {
    if (!TS.prefs.getFlag('print-tip-hide', false)) {
      const chk = h('input', { type: 'checkbox', id: 'tip-hide' });
      const v = await TS.dialog({
        title: 'PDF sifatida saqlash',
        content: [
          h('ol', { class: 'steps' },
            h('li', { text: 'Ochiladigan chop etish oynasida printer sifatida «PDF sifatida saqlash» (Save as PDF) ni tanlang.' }),
            h('li', { text: '«Qoʻshimcha sozlamalar» (More settings) ichida «Sarlavha va pastki kolontitul» (Headers and footers) belgisini oʻchiring — aks holda sahifada sana va sayt manzili chiqadi.' }),
            h('li', { text: 'Masshtab 100% va chetlar «Standart» (Default) boʻlsin — hujjat chetlari formatdan olinadi.' })),
          h('label', { class: 'check' }, chk, h('span', { text: 'Bu eslatmani qayta koʻrsatma' }))
        ],
        actions: [{ label: 'Bekor qilish', value: 'cancel', cancel: true }, { label: 'Chop etish oynasini ochish', value: 'ok', kind: 'primary' }]
      });
      if (chk.checked) TS.prefs.setFlag('print-tip-hide', true);
      if (v !== 'ok') return false;
    }
    fillPrint(p);
    const old = document.title;
    document.title = TS.safeFileName(p.name, 'hujjat');
    setTimeout(() => {
      try { window.print(); } finally { setTimeout(() => { document.title = old; }, 1500); }
    }, 60);
    return true;
  }

  /* ---------- PPTX ---------- */
  async function pptxBlob(p) {
    const Lib = window.PptxGenJS;
    if (!Lib) throw new Error(LIB_PPTX);
    const M = TS.model, G = M.GEOM, T = M.THEMES[p.data.theme] || M.THEMES.academic;
    const pptx = new Lib();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = p.name;
    pptx.author = p.data.meta.author || 'Talaba Studio';
    const list = p.data.slides.filter((s) => s.title.trim() || s.body.trim() || s.img);
    const FONT = 'Calibri';
    const runs = (body, center) => M.parseBody(body).map((l) => ({
      text: l.text,
      options: Object.assign({ breakLine: true, paraSpaceAfter: 6 }, l.bullet ? { bullet: true } : {}, center ? { align: 'center' } : {})
    }));

    list.forEach((s) => {
      const sl = pptx.addSlide();

      if (s.kind === 'title' || s.kind === 'closing') {
        sl.background = { color: T.tsBg };
        sl.addShape(pptx.ShapeType.rect, { x: G.tLine.x, y: G.tLine.y, w: G.tLine.w, h: G.tLine.h, fill: { color: T.accent }, line: { color: T.accent, width: 0 } });
        if (s.title.trim()) {
          sl.addText(s.title.trim(), {
            x: G.tTitle.x, y: G.tTitle.y, w: G.tTitle.w, h: G.tTitle.h,
            fontFace: FONT, fontSize: M.titlePt(s.title, true), bold: true, color: T.tsTitle, align: 'center', valign: 'bottom', margin: 0
          });
        }
        if (s.body.trim()) {
          sl.addText(runs(s.body, true), {
            x: G.tSub.x, y: G.tSub.y, w: G.tSub.w, h: G.tSub.h,
            fontFace: FONT, fontSize: 20, color: T.tsSub, align: 'center', valign: 'top', margin: 0
          });
        }
        return;
      }

      sl.background = { color: T.bg };
      if (T.band) sl.addShape(pptx.ShapeType.rect, { x: G.band.x, y: G.band.y, w: G.band.w, h: G.band.h, fill: { color: T.band }, line: { color: T.band, width: 0 } });
      else sl.addShape(pptx.ShapeType.rect, { x: G.rule.x, y: G.rule.y, w: G.rule.w, h: G.rule.h, fill: { color: T.accent }, line: { color: T.accent, width: 0 } });
      if (s.title.trim()) sl.addText(s.title.trim(), { x: G.cTitle.x, y: G.cTitle.y, w: G.cTitle.w, h: G.cTitle.h, fontFace: FONT, fontSize: M.titlePt(s.title, false), bold: true, color: T.ct, valign: 'middle', margin: 0 });

      if (s.kind === 'split' && s.body.includes('||')) {
        const parts = s.body.split('||');
        sl.addText(runs(parts[0] || '', false), { x: G.col1.x, y: G.col1.y, w: G.col1.w, h: G.col1.h, fontFace: FONT, fontSize: 18, color: T.text, valign: 'top', margin: 0 });
        sl.addText(runs(parts[1] || '', false), { x: G.col2.x, y: G.col2.y, w: G.col2.w, h: G.col2.h, fontFace: FONT, fontSize: 18, color: T.text, valign: 'top', margin: 0 });
        return;
      }

      const hasImg = !!s.img;
      if (s.body.trim()) {
        const box = hasImg ? G.bodyImg : G.body;
        sl.addText(runs(s.body, false), { x: box.x, y: box.y, w: box.w, h: box.h, fontFace: FONT, fontSize: M.bodyLayout(s.body, hasImg).pt, color: T.text, valign: 'top', margin: 0 });
      }
      if (hasImg) {
        const r = M.fitImage(s.img, hasImg && !s.body.trim() ? G.body : G.img);
        sl.addImage({ data: s.img.data, x: r.x, y: r.y, w: r.w, h: r.h });
      }
    });

    return pptx.write({ outputType: 'blob' });
  }

  /* ---------- Umumiy eksport oqimi ---------- */
  async function preflight(p) {
    const r = TS.model.precheck(p);
    if (r.error) { TS.toast(r.error, 'error'); return false; }
    if (!r.empty.length && !r.missing.length && !r.notes.length) return true;
    const list = (title, items) => items.length ? [h('p', { class: 'strong', text: title }), h('ul', { class: 'plain-list' }, items.map((x) => h('li', { text: x })))] : [];
    const isDeck = p.type === 'prezentatsiya';
    const content = [].concat(
      list(isDeck ? 'Quyidagi slaydlar boʻsh — ular eksportga kiritilmaydi:' : 'Quyidagi boʻlimlar boʻsh — ular eksportga kiritilmaydi:', r.empty),
      list('Quyidagi asosiy maydonlar kiritilmagan:', r.missing),
      list('Eslatmalar:', r.notes));
    return TS.confirmBox('Eksportdan oldin tekshiring', content, { okLabel: 'Baribir eksport qilish', cancelLabel: 'Tahrirlashga qaytish' });
  }

  async function run(p, kind, btn) {
    try {
      if (!(await preflight(p))) return;
      if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
      const name = TS.safeFileName(p.name, p.type);
      if (kind === 'docx') {
        const blob = await docxBlob(p);
        TS.download(blob, name + '.docx');
        TS.toast('DOCX fayl yuklab olindi.', 'success');
      } else if (kind === 'pptx') {
        const blob = await pptxBlob(p);
        TS.download(blob, name + '.pptx');
        TS.toast('PPTX fayl yuklab olindi.', 'success');
      } else if (kind === 'txt') {
        TS.download(new Blob(['\uFEFF' + TS.model.plainText(p)], { type: 'text/plain;charset=utf-8' }), name + '.txt');
        TS.toast('TXT fayl yuklab olindi.', 'success');
      } else if (kind === 'copy') {
        const ok = await TS.copyText(TS.model.plainText(p));
        TS.toast(ok ? 'Matn nusxalandi.' : 'Nusxalab bo‘lmadi. Brauzer ruxsatini tekshiring yoki TXT yuklab oling.', ok ? 'success' : 'error');
      } else if (kind === 'pdf') {
        await printPdf(p);
      }
    } catch (e) {
      console.error(e);
      TS.toast(e && e.message && /kutubxona/.test(e.message) ? e.message : 'Eksport amalga oshmadi: ' + ((e && e.message) || 'nomaʼlum xato') + '. Matningiz saqlanib qoldi.', 'error', 9000);
    } finally {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
    }
  }

  /* ---------- JSON zaxira ---------- */
  const MAX_IMPORT = 60 * 1024 * 1024;
  function backupBlob(list) {
    const data = { app: 'talaba-studio', version: 2, exportedAt: new Date().toISOString(), projects: list };
    return new Blob([JSON.stringify(data)], { type: 'application/json' });
  }

  async function readBackup(file) {
    if (!file) throw new Error('Fayl tanlanmadi.');
    if (file.size > MAX_IMPORT) throw new Error('Fayl juda katta (' + Math.round(file.size / 1048576) + ' MB). Ruxsat etilgan hajm — 60 MB gacha.');
    if (file.size === 0) throw new Error('Fayl boʻsh.');
    let raw;
    try { raw = JSON.parse(await file.text()); } catch (e) { throw new Error('Fayl yaroqli JSON emas yoki buzilgan.'); }
    let items;
    if (raw && raw.app === 'talaba-studio' && Array.isArray(raw.projects)) items = raw.projects;
    else if (raw && typeof raw === 'object' && raw.type && raw.data) items = [raw];
    else throw new Error('Bu Talaba Studio zaxira fayli emas.');
    if (items.length > 500) throw new Error('Faylda juda koʻp loyiha (500 tadan oshmasin).');
    const valid = [];
    let skipped = 0;
    items.forEach((it) => { const n = TS.model.normalize(it); if (n) valid.push(n); else skipped++; });
    if (!valid.length) throw new Error('Faylda tiklash mumkin boʻlgan yaroqli loyiha topilmadi.');
    return { valid, skipped };
  }

  async function importBackup(file) {
    const { valid, skipped } = await readBackup(file);
    const existing = new Set((await TS.store.all()).map((x) => x.id));
    valid.forEach((p) => {
      if (existing.has(p.id)) { p.id = TS.uid(); p.name = (p.name + ' (tiklangan)').slice(0, 200); }
      existing.add(p.id);
    });
    await TS.store.putMany(valid);
    return { count: valid.length, skipped };
  }

  TS.exporter = { run, docxDocument, docxBlob, pptxBlob, backupBlob, readBackup, importBackup, fillPrint };
})();
