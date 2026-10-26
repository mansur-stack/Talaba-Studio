# Talaba Studio

Talabalar uchun referat, kurs ishi (BMI), mustaqil ish, maqola va prezentatsiyani **oʻz matni asosida** tartiblab, DOCX / PPTX / PDF / TXT qilib yuklab olish platformasi.

**API’siz ishlaydi.** AI yoʻq, API kaliti yoʻq, backend yoʻq, hisob va toʻlov yoʻq. Hamma amal foydalanuvchi brauzerida bajariladi; ma’lumotlar tashqi serverlarga yuborilmaydi. PWA texnologiyasi orqali toʻliq oflayn ishlaydi va kompyuter yoki telefonga oʻrnatiladi.

Platforma matn yozib bermaydi, manba oʻylab topmaydi va "originalligi"ni tekshirmaydi. U siz kiritgan matnni tuzilmaga joylaydi, formatlaydi, saqlaydi va faylga aylantiradi.

## Ishga tushirish

1. Papkani arxivdan chiqaring.
2. `index.html` ni brauzerda oching (ikki marta bosing). Internet shart emas — kutubxonalar va shrift `vendor/` va `fonts/` ichida.
3. Xohlasangiz, lokal server bilan: `python -m http.server 8080` va `http://localhost:8080` ni oching.
4. **PWA oʻrnatish:** Brauzer manzil satridagi «Oʻrnatish» (Install) belgisini bosib, Talaba Studio ilovasini mustaqil dastur sifatida oʻrnatib olishingiz mumkin.

## Fayl daraxti

```
talaba-studio/
├─ index.html
├─ manifest.webmanifest PWA manifest fayli
├─ sw.js               Service Worker (100% oflayn kesh)
├─ README.md
├─ css/styles.css
├─ js/
│  ├─ utils.js         DOM yordamchilari, ikonkalar, xabarlar, dialoglar
│  ├─ storage.js       IndexedDB (ishlar) + localStorage (mavzu, sozlamalar)
│  ├─ model.js         ma’lumotlar modeli, transliteratsiya, matn tozalash, eksport modeli
│  ├─ export.js        DOCX, PDF (chop etish), TXT, nusxalash, PPTX, JSON zaxira
│  ├─ editor-doc.js    umumiy muharrir + Referat, Kurs ishi, Mustaqil ish va Maqola
│  ├─ editor-slides.js Prezentatsiya: 2 ustunli slayd, yakuniy slayd, oldindan koʻrish, namoyish
│  ├─ pages.js         Bosh sahifa (CV tugmasi, tezkor matn vositasi), Mening ishlarim, Sozlamalar
│  └─ app.js           navigatsiya va marshrutlash
├─ vendor/             docx, PptxGenJS (lokal) + LICENSES.md
└─ fonts/              Manrope (lokal) + litsenziya
```

## Funksiyalar

- **Referat**: titul varagʻi, «Tuzilma yaratish» (kirish, asosiy boʻlimlar, xulosa, adabiyotlar). Boʻlimlarni tartiblash, reja avtomatik tuzilishi, soʻz va belgi sanagichi.
- **Kurs ishi (BMI / Diplom ishi)**: kafedra mudiri («Himoyaga ruxsat etildi»), ilmiy rahbar, taʼlim yoʻnalishi, mundarija, kirish (dolzarbligi, maqsadi, vazifalari, metodlari), 1-bob, 2-bob, xulosa, adabiyotlar va ilovalar. DOCX formatida har bir bob avtomatik yangi sahifadan boshlanadi.
- **Mustaqil ish**: topshiriq savollari soni boʻyicha avtomatik tuzilma, savol-javob bloklari, xulosa va adabiyotlar.
- **Maqola**: sarlavha, muallif, muassasa, ilmiy rahbar, annotatsiya, kalit soʻzlar, kirish, asosiy qism, xulosa va manbalar roʻyxati.
- **Prezentatsiya**: boʻsh slaydlar, 2 ustunli slaydlar (taqqoslash), yakuniy slayd («Eʼtiboringiz uchun rahmat!») yoki matnni slaydlarga taqsimlash. Sigʻmagan slaydlarni boʻlish, rasmlar, namoyish rejimi. PPTX, TXT (nutq uchun) va nusxalash. Dizaynlar: Minimal light, Academic blue, Dark violet, Emerald green, Warm amber.
- **Talaba rezyumesi (CV)**: Bosh sahifadagi maxsus tugma orqali AI Resume Builder xizmatiga ulanish va professional rezyume shakllantirish.
- **Tezkor matn vositalari (Lotin ⇄ Kirill & Tozalash)**:
  - Notoʻgʻri apostroflarni standartlash (`oʻ`, `gʻ`, `ʼ`).
  - Ortiqcha probellar va sinib qolgan satrlarni birlashtirish.
  - Tirelar (` — `, `–`) va qoʻshtirnoqlarni («...») standartlash.
  - Bir bosishda Lotin ⇄ Kirill alifbosiga oʻgirish (transliteratsiya).
- **Mening ishlarim**: avto-saqlash va qoʻlda saqlash (Ctrl/⌘+S), qidiruv, tur boʻyicha filtr, nomini oʻzgartirish, nusxalash, tasdiq bilan oʻchirish, JSON zaxira va tiklash.

## Eksport

| Format | Qanday | Izoh |
|---|---|---|
| DOCX | `docx` kutubxonasi | Haqiqiy .docx. Titul alohida boʻlimda, asosiy qismda sahifa raqamlari. |
| PDF | brauzerning chop etish oynasi | «PDF sifatida saqlash»ni tanlang. **Sarlavha va pastki kolontitul (Headers and footers)** belgisini oʻchiring. PDF’da sahifa raqami brauzerdan olinadi. |
| TXT | UTF-8 (BOM bilan) | Oʻzbekcha harflar saqlanadi. |
| Nusxalash | clipboard | Brauzer ruxsat bermasa, TXT yuklang. |
| PPTX | PptxGenJS | Haqiqiy .pptx; sarlavha va matn PowerPointʼda tahrirlanadi; yuklangan rasmlar qoʻshiladi. |

Boshlangʻich hujjat formati: A4, Times New Roman 14 pt, 1,5 qator oraligʻi, chap 3 sm, oʻng 1,5 sm, yuqori va past 2 sm, abzats boshi 1,25 sm. Format muharrirdagi «Hujjat formati» panelida oʻzgartiriladi. **Bu hamma universitetlar uchun majburiy standart emas** — kafedra talabini tekshiring.

Eksportdan oldin: boʻsh boʻlimlar, titul varagʻida kiritilmagan maydonlar va sigʻmaydigan slaydlar haqida ogohlantiriladi. Boʻsh boʻlimlar/slaydlar fayllarga kiritilmaydi; yoʻriqnoma-placeholderlar hech qachon eksportga tushmaydi.

## Lokal saqlash

- Ishlar **IndexedDB** (`talaba-studio` bazasi), mavzu va sozlamalar **localStorage** da — faqat shu brauzerda.
- Brauzer ma’lumotlari tozalansa, maxfiy rejimda yoki boshqa brauzer/qurilmada ishlar koʻrinmaydi yoki yoʻqoladi. **Muhim ishlardan JSON zaxira oling** («Mening ishlarim»).
- Xotira toʻlsa yoki saqlash xatosi boʻlsa, matn sahifada qoladi va xabar chiqadi; eksport qilib qoʻyish mumkin.
- JSON tiklash: fayl hajmi (60 MB gacha) va tuzilmasi tekshiriladi; yaroqsiz fayl mavjud ishlarga tegmaydi; tiklash mavjud ishlarni **ustidan yozmaydi** (bir xil ID boʻlsa, nusxa sifatida qoʻshadi).

## Xavfsizlik

Foydalanuvchi matni faqat `textContent` / `value` orqali chiqariladi (HTML sifatida joylashtirilmaydi). Import qilingan JSON qayta tozalanadi (faqat ma’lum maydonlar, uzunlik cheklovi, rasm formati tekshiruvi).

## Cheklovlar

- Matn generatsiya qilinmaydi — faqat tuzilma, format va eksport.
- Reja sahifa raqamlarisiz (DOCX’da avtomatik mundarija maydoni ishlatilmagan).
- Matn oddiy: har bir yangi qator — yangi abzats; qalin/kursiv va jadval/formula yoʻq.
- PPTX’da shrift Calibri; slayd matni sigʻishi taxminiy hisob bilan baholanadi (PowerPointʼda koʻrib chiqing).
- Rasm kattaligi 1600 px gacha kichraytiriladi va brauzerda saqlanadi; juda koʻp rasm xotirani toʻldirishi mumkin.
- PDF — brauzer chop etish oynasi orqali; sahifalash brauzerga bogʻliq.

## Kutubxonalar va litsenziyalar

docx 9.14.0 (MIT), PptxGenJS 4.0.1 (MIT), Manrope (SIL OFL 1.1). Batafsil: `vendor/LICENSES.md`.

Kutubxona yuklanmasa, ilova aniq xabar beradi va muharrir ishlashda davom etadi (faqat tegishli eksport ishlamaydi).

## Tekshiruv holati

Haqiqatan tekshirilgan:
- Model va eksport mantigʻi Node.js’da: DOCX (python-docx bilan ochib: A4, chetlar 3/1,5/2/2 sm, Times New Roman 14, 1,5 oraliq, abzats boshi, 2 boʻlim, oʻzbekcha harflar) va PPTX (python-pptx bilan ochib: 16:9, 3 dizayn, rasm joylashgan).
- Ilova jsdom (soxta brauzer) ichida: sahifalar ochilishi, referat tuzilmasi, avto-saqlash IndexedDB’ga, eksport oldi ogohlantirish oynalari, maqola manbalari, matndan slaydlar, namoyish rejimida klaviatura, yaroqsiz JSON rad etilishi va zaxiradan tiklash; skript xatolari yoʻq.

Tekshirilmagan (haqiqiy brauzerda sinab koʻring): DOCX/PPTX yuklab olish tugmalarining brauzerdagi oxirigacha ishlashi, PDF chop etish, toʻliq ekran, rasm yuklash (canvas), mobil (360 px) va qorongʻi mavzudagi vizual koʻrinish, juda uzun matnlarda tezlik.
