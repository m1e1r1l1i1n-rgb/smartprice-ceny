/* =============================================================
SmartPrice — voice-search.js
Голосовой поиск, импорт чека.
РАСКЛАДКА ИНТЕРФЕЙСА ЧЕКА (аккуратная, в две строки):
строка 1 — название + единица;
строка 2 — категория + цена;
строка 3 — распознанный текст чека (мелко).
Логика распознавания — как в версии, которая находит больше товаров.
============================================================= */

function injectVoiceAndReceiptStyles() {
  if (window.__voiceAndReceiptStylesAdded) return;
  window.__voiceAndReceiptStylesAdded = true;
  // Стили перенесены в ui-fixes.css
}

function showVoiceModal(title, message, showSettingsButton) {
  injectVoiceAndReceiptStyles();
  const overlay = document.createElement('div');
  overlay.className = 'voice-modal-overlay';
  const box = document.createElement('div');
  box.className = 'voice-modal-box';
  const t = document.createElement('div');
  t.className = 'voice-modal-title';
  t.textContent = title || 'Информация';
  const m = document.createElement('div');
  m.className = 'voice-modal-text';
  m.textContent = message || '';
  const b = document.createElement('div');
  b.className = 'voice-modal-buttons';
  if (showSettingsButton && typeof tryOpenSettings === 'function') {
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'voice-modal-settings';
    s.textContent = 'Открыть настройки';
    s.onclick = function () { overlay.remove(); tryOpenSettings(); };
    b.appendChild(s);
  }
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'voice-modal-ok';
  ok.textContent = 'Понятно';
  ok.onclick = function () { overlay.remove(); };
  b.appendChild(ok);
  box.appendChild(t);
  box.appendChild(m);
  box.appendChild(b);
  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  (document.querySelector('.app-wrapper') || document.body).appendChild(overlay);
}

if (typeof window.addProductsByVoice !== 'function') {
  window.addProductsByVoice = function (transcript) {
    if (!transcript) return 0;
    if (typeof db === 'undefined' || !db || !Array.isArray(db.products)) return 0;
    const text = String(transcript).toLowerCase().replace(/ё/g, 'е');
    const parts = text.split(/,| и |\n|;/).map(s => s.trim()).filter(Boolean);
    let added = 0;
    parts.forEach(part => {
      if (part.length < 2) return;
      let prod = db.products.find(p => p.name && p.name.toLowerCase().replace(/ё/g, 'е') === part);
      if (!prod) prod = db.products.find(p => p.name && p.name.toLowerCase().replace(/ё/g, 'е').includes(part));
      if (prod && !db.cart.some(i => i.id === prod.id)) {
        db.cart.push({ id: prod.id, qty: 1, checked: false });
        added++;
      }
    });
    if (added > 0) {
      if (typeof saveDB === 'function') saveDB();
      if (typeof renderCart === 'function') renderCart();
      if (typeof renderStoresComparison === 'function') renderStoresComparison();
      if (typeof updateCartBadge === 'function') updateCartBadge();
      if (typeof showToast === 'function') showToast('✅ Добавлено товаров: ' + added);
      haptic(40);
    }
    return added;
  };
}

function initVoiceSearch() {
  if (window.__voiceSearchInitialized) return;
  window.__voiceSearchInitialized = true;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.querySelectorAll('.voice-search-btn').forEach(b => b.style.display = 'none');
    return;
  }

  const recognition = new SR();
  recognition.lang = 'ru-RU';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  let currentInput = null, currentBtn = null, isActive = false;

  function setListening(b, v) { if (b) b.classList.toggle('listening', !!v); }
  function stopSafe() { try { recognition.stop(); } catch (e) {} }
  function reset() { setListening(currentBtn, false); currentInput = null; currentBtn = null; isActive = false; }

  recognition.onaudiostart = function () { isActive = true; setListening(currentBtn, true); };
  recognition.onaudioend = function () { setListening(currentBtn, false); };
  recognition.onend = function () { reset(); };
  recognition.onerror = function (ev) {
    setListening(currentBtn, false);
    isActive = false;
    if (ev.error === 'aborted') return;
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      showVoiceModal('Нет доступа к микрофону', 'Для голосового поиска нужно разрешить доступ к микрофону.\n\nОткройте настройки браузера и разрешите доступ к микрофону.', true);
      return;
    }
    if (ev.error === 'network') {
      showVoiceModal('Нужен интернет', 'Для распознавания речи нужно подключение к интернету.', false);
      return;
    }
    if (ev.error === 'audio-capture') {
      showVoiceModal('Микрофон не найден', 'Не удалось найти микрофон.', false);
      return;
    }
    if (ev.error === 'no-speech') {
      if (typeof showToast === 'function') showToast('Речь не распознана');
      return;
    }
    if (typeof showToast === 'function') showToast('Ошибка голосового поиска');
  };
  recognition.onresult = function (ev) {
    const tr = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
    if (!tr || !currentInput) return;
    if ((currentInput.id || '') === 'cart-search-input' && typeof addProductsByVoice === 'function') {
      const n = addProductsByVoice(tr);
      if (n > 0) {
        currentInput.value = '';
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
    currentInput.value = tr;
    currentInput.dispatchEvent(new Event('input', { bubbles: true }));
  };

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.voice-search-btn');
    if (!btn) return;
    if (btn.classList.contains('listening') || isActive) { stopSafe(); reset(); return; }
    if (!navigator.onLine) {
      showVoiceModal('Нужен интернет', 'Для распознавания речи нужно подключение к интернету.', false);
      return;
    }
    const tid = btn.getAttribute('data-target');
    const input = tid ? document.getElementById(tid) : null;
    if (!input) return;
    currentInput = input;
    currentBtn = btn;
    try { recognition.start(); } catch (err) { reset(); }
  });
}

/* =============================================================
ИМПОРТ ЧЕКА
============================================================= */
let receiptCurrentDataUrl = '';
let receiptCandidates = [];
let receiptEditRows = [];
let receiptRawText = '';
let receiptDetectedStore = '';

/* ---------- Определение магазина из текста чека ---------- */
const RECEIPT_CHAIN_NAMES = [
  ['лента', 'Лента'],
  ['магнит', 'Магнит'],
  ['пятёрочка', 'Пятёрочка'],
  ['пятерочка', 'Пятёрочка'],
  ['перекрёсток', 'Перекрёсток'],
  ['перекресток', 'Перекрёсток'],
  ['ашан', 'Ашан'],
  ['дикси', 'Дикси'],
  ['верный', 'Верный'],
  ['монетка', 'Монетка'],
  ['карусель', 'Карусель'],
  ['окей', 'Окей'],
  ['метро', 'Метро'],
  ['глобус', 'Глобус'],
  ['вкусвилл', 'ВкусВилл'],
  ['спар', 'Spar'],
  ['евроопт', 'Евроопт'],
  ['соседи', 'Соседи'],
  ['корона', 'Корона'],
  ['гиппо', 'Гиппо'],
  ['мария', 'Мария'],
  ['остров', 'Остров'],
  ['зелёный', 'Зелёный'],
  ['зеленый', 'Зелёный']
];

function detectReceiptStore(rawText) {
  const lower = String(rawText || '').toLowerCase();
  if (!lower) return '';
  const all = [];
  if (Array.isArray(db.stores)) all.push.apply(all, db.stores);
  if (Array.isArray(db.pharmacies)) all.push.apply(all, db.pharmacies);
  for (let i = 0; i < all.length; i++) {
    const nm = all[i] && all[i].name;
    if (nm && nm.length >= 4 && lower.includes(String(nm).toLowerCase())) return nm;
  }
  for (let i = 0; i < RECEIPT_CHAIN_NAMES.length; i++) {
    if (lower.includes(RECEIPT_CHAIN_NAMES[i][0])) return RECEIPT_CHAIN_NAMES[i][1];
  }
  return '';
}

/* ---------- Подбор единицы измерения по названию ---------- */
function guessUnitByName(name) {
  const s = String(name || '').toLowerCase();
  const units = (typeof getActiveUnits === 'function') ? getActiveUnits() : ['шт', 'кг', 'л', 'упаковка', 'пачка'];
  function pick(u) { return units.includes(u) ? u : 'шт'; }
  if (/\d\s*кг/.test(s) || /(^|\s)кг(\s|$|\.|,)/.test(s) || /\bвес\b/.test(s) || /весов/.test(s)) return pick('кг');
  if (/\d\s*мл/.test(s) || /(^|\s)мл(\s|$|\.|,)/.test(s)) return pick('мл');
  if (/\d\s*л(\s|$|\.|,)/.test(s) || /литр/.test(s)) return pick('л');
  if (/пачк/.test(s)) return pick('пачка');
  if (/упак/.test(s)) return pick('упаковка');
  if (/порци/.test(s)) return pick('порция');
  if (/(^|\s)доз/.test(s)) return pick('доз');
  return 'шт';
}

function injectReceiptScanButton() {
  const header = document.querySelector('#page-products .products-sticky-header');
  if (!header) return;
  if (header.querySelector('.receipt-scan-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'receipt-scan-btn';
  btn.innerHTML = '🧾 Импорт чека';
  btn.onclick = function () { openReceiptScanModal(); };
  header.appendChild(btn);
}

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (window.__tesseractPromise) return window.__tesseractPromise;
  window.__tesseractPromise = new Promise(function (res, rej) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = function () {
      if (window.Tesseract) res();
      else { window.__tesseractPromise = null; rej(new Error('Tesseract не загрузился')); }
    };
    s.onerror = function () { window.__tesseractPromise = null; rej(new Error('Не удалось загрузить модуль')); };
    document.head.appendChild(s);
  });
  return window.__tesseractPromise;
}

/* ---------- Подготовка фото чека: увеличение + ч/б + порог ---------- */
function prepareReceiptImage(dataUrl) {
  return new Promise(function (resolve) {
    const img = new Image();
    img.onload = function () {
      try {
        const w0 = img.naturalWidth || img.width;
        const h0 = img.naturalHeight || img.height;
        if (!w0 || !h0) { resolve(dataUrl); return; }

        let scale = 2200 / Math.max(w0, h0);
        if (scale < 1) scale = 1;
        if (scale > 3) scale = 3;
        const w = Math.max(1, Math.round(w0 * scale));
        const h = Math.max(1, Math.round(h0 * scale));

        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        const n = w * h;
        const gray = new Uint8ClampedArray(n);

        for (let i = 0, p = 0; p < n; i += 4, p++) {
          gray[p] = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
        }

        const hist = new Array(256).fill(0);
        for (let p = 0; p < n; p++) hist[gray[p]]++;
        let sum = 0;
        for (let t = 0; t < 256; t++) sum += t * hist[t];
        let sumB = 0, wB = 0, wF = 0, varMax = 0, thr = 128;
        for (let t = 0; t < 256; t++) {
          wB += hist[t];
          if (!wB) continue;
          wF = n - wB;
          if (!wF) break;
          sumB += t * hist[t];
          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const between = wB * wF * (mB - mF) * (mB - mF);
          if (between > varMax) { varMax = between; thr = t; }
        }

        for (let i = 0, p = 0; p < n; i += 4, p++) {
          const v = gray[p] > thr ? 255 : 0;
          d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
        }

        ctx.putImageData(id, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = function () { resolve(dataUrl); };
    img.src = dataUrl;
  });
}

async function recognizeReceiptText(dataUrl, onProgress) {
  const processed = await prepareReceiptImage(dataUrl);
  await loadTesseract();
  const opts = {
    logger: m => { if (typeof onProgress === 'function') onProgress(m); },
    parameters: {
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1'
    }
  };
  let result;
  try {
    result = await Tesseract.recognize(processed, 'rus', opts);
  } catch (e) {
    try {
      result = await Tesseract.recognize(processed, 'rus+eng', opts);
    } catch (e2) { throw e; }
  }
  return (result && result.data) ? result.data : { text: '', lines: [] };
}

/* ---------- Разбор текста чека ---------- */
function normalizeReceiptLine(l) {
  return String(l || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/[|~`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const RECEIPT_SERVICE_WORDS = ['внесено', 'сдача', 'наличн', 'безналич', 'оплата', 'итого', 'итог', 'скидк', 'спасибо', 'покупк', 'касса', 'кассов', 'чек', 'прода', 'терминал', 'мерчант', 'мастеркард', 'mastercard', 'инн', 'кпп', 'фп', 'экпз', 'сруб', 'сумма', 'комиссия', 'ооо', 'зао', 'адрес', 'сайт', 'телефон', 'время', 'дата', 'смена', 'оператор', 'кассир', 'покупатель', 'клиент', 'карта', 'балл', 'бонус', 'акция', 'налог', 'фискальн', 'ккт', 'зн ккт', 'код', 'место', 'расчет', 'расчётов', 'счет', 'огрн', 'орн', 'субт', 'местекс', 'повтор', 'документ', 'подпись', 'требуется', 'корректировка', 'погасян', 'приход', 'расход', 'rnн', 'rrn', 'к/а', 'фд', 'фн', 'рн ккт', 'магазин', 'метатрон', 'тандер', 'ул.', 'р-н', 'пгт', 'корп', 'пин', 'авторизаци', 'ссылк', 'операци', 'применена', 'баланс', 'начислено', 'фишек', 'проверьте', 'taxcom', 'receipt', 'nalog', 'оплат'];

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isServiceReceiptLine(line) {
  const lower = String(line || '').toLowerCase();
  if (!lower) return true;
  if (lower.includes('№')) return true;
  if (lower.includes('#')) return true;
  if (/(\*){3,}/.test(lower)) return true;
  if (/^\d{2}[.\/]\d{2}[.\/]\d{2,4}/.test(lower)) return true;
  if (/^(\d[\s-:]{0,5}){6,}/.test(lower)) return true;
  if (/\d{6,}/.test(lower)) return true;
  if (/(^|\s)[a-zа-яё]{2,}\s*:/.test(lower)) return true;
  for (let i = 0; i < RECEIPT_SERVICE_WORDS.length; i++) {
    const w = RECEIPT_SERVICE_WORDS[i];
    if (w.length <= 4) {
      const re = new RegExp('(^|[^a-zа-яё])' + escapeRegExp(w) + '([^a-zа-яё]|$)');
      if (re.test(lower)) return true;
    } else if (lower.includes(w)) {
      return true;
    }
  }
  return false;
}

function isPriceLine(line) {
  const l = String(line || '').replace(/\s+/g, ' ').trim();
  if (!l) return false;
  if (!/\d+[.,]\d{1,2}/.test(l)) return false;
  const letters = (l.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  return letters <= 4;
}

function hasNameLike(line) {
  const letters = (String(line || '').match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  return letters >= 4;
}

function mergeReceiptLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let cur = lines[i];
    if (i + 1 < lines.length && hasNameLike(cur) && !isPriceLine(cur) && isPriceLine(lines[i + 1])) {
      cur = cur + ' ' + lines[i + 1];
      i++;
    }
    out.push(cur);
  }
  return out;
}

function extractReceiptPrice(line) {
  const mUnit = line.match(/(\d{1,7}[.,]\d{1,2})\s*[*xх×]\s*(\d+[.,]?\d*)\s*=/i);
  if (mUnit) {
    const p = parseFloat(mUnit[1].replace(',', '.'));
    if (isFinite(p) && p > 0.01 && p < 50000) return { price: p, index: mUnit.index };
  }
  const re = /(\d{1,7}[.,]\d{1,2})(?!\s*%)(?!\d)/g;
  let m, last = null;
  while ((m = re.exec(line)) !== null) {
    const p = parseFloat(m[1].replace(',', '.'));
    if (isFinite(p) && p > 0.01 && p < 50000) last = { price: p, index: m.index };
  }
  return last;
}

function cleanReceiptName(name) {
  if (!name) return '';
  name = String(name)
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\d+[.,]\d{2,}/g, ' ')
    .replace(/\d*\s*[xх*×]\s*\d+[.,]?\d*/gi, ' ')
    .replace(/\d+\s*(ШТ|WT|PCS|ШТ\.)/gi, ' ')
    .replace(/[=≡]+\s*$/g, '')
    .replace(/(^|\s)(р|руб|₽|р.|бел.?\sруб|бел.?\sр|коп|к)(\s|$)/gi, ' ')
    .replace(/[()\/\\|•·*#=+<>_«»"]/g, ' ')
    .replace(/%/g, ' ')
    .replace(/(^|\s)\d{1,3}(\s|$)/g, ' ')
    .replace(/^[:\s]+/, '')
    .replace(/[.,;:|\s]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return name;
}

function isGoodReceiptName(name) {
  if (!name || name.length < 4 || name.length > 90) return false;
  const letters = (name.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  if (letters < 4) return false;
  const digits = (name.match(/\d/g) || []).length;
  if (digits > letters * 0.5) return false;
  if (/^[0-9A-ZА-ЯЁ]{10,}$/i.test(name.replace(/\s/g, ''))) return false;
  if (/\*|ПОВТОР|ДОКУМЕНТ/i.test(name)) return false;
  if (isServiceReceiptLine(name)) return false;
  return true;
}

function parseReceiptLine(line) {
  let n = normalizeReceiptLine(line);
  if (!n || n.length < 5 || n.length > 200) return null;
  n = n.replace(/НДС\s*\d{1,2}\s*%/gi, ' ').replace(/НДС/gi, ' ').replace(/\s+/g, ' ').trim();
  if (isServiceReceiptLine(n)) return null;
  const p = extractReceiptPrice(n);
  if (!p) return null;
  let name = cleanReceiptName(n.slice(0, p.index).trim());
  if (!isGoodReceiptName(name)) return null;
  return { name: name, price: p.price, raw: n };
}

function parseReceiptText(text, lines) {
  const candidates = [];
  const seen = new Set();

  function add(c) {
    if (!c || !c.name) return;
    const k = c.name.toLowerCase().replace(/ё/g, 'е') + '|' + c.price;
    if (seen.has(k)) return;
    seen.add(k);
    candidates.push(c);
  }

  let src = [];
  if (Array.isArray(lines) && lines.length) {
    src = lines
      .filter(l => l && (l.confidence === undefined || l.confidence >= 30))
      .map(l => (l && l.text) ? l.text : l);
  } else {
    src = String(text || '').split(/\r?\n+/);
  }
  src = src.map(normalizeReceiptLine).filter(Boolean);
  const merged = mergeReceiptLines(src);
  merged.forEach(l => add(parseReceiptLine(l)));

  if (candidates.length < 3) {
    String(text || '').split(/\s{2,}/).forEach(ch => add(parseReceiptLine(ch)));
  }

  return candidates.slice(0, 80);
}

function normalizeForMatch(s) {
  return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/gi, ' ').trim();
}

function findDuplicateProduct(name) {
  const n = normalizeForMatch(name);
  if (n.length < 4) return null;
  let best = null;
  db.products.forEach(p => {
    const pn = normalizeForMatch(p.name);
    if (!pn || pn.length < 4) return;
    if (pn === n) { best = p; return; }
    if (!best && (pn.includes(n) || n.includes(pn))) { best = p; return; }
    if (!best && n.length >= 6 && pn.length >= 6 && pn.startsWith(n.slice(0, 6))) best = p;
  });
  return best;
}

function getAllCategoriesList() {
  const a = (typeof categories !== 'undefined') ? categories.slice() : [];
  const m = (typeof medCategories !== 'undefined') ? medCategories.slice() : [];
  return a.concat(m);
}

function openReceiptScanModal() {
  injectVoiceAndReceiptStyles();
  receiptCurrentDataUrl = '';
  receiptCandidates = [];
  receiptEditRows = [];
  receiptRawText = '';
  receiptDetectedStore = '';

  const overlay = document.createElement('div');
  overlay.className = 'receipt-overlay';
  const box = document.createElement('div');
  box.className = 'receipt-box';
  box.innerHTML = `
    <div class="receipt-header">
      <div class="receipt-title">Импорт чека в перечень товаров</div>
      <button type="button" class="receipt-close">✕</button>
    </div>
    <div class="receipt-note">Снимайте чек крупно, ровно и при хорошем свете (без вспышки) — чем больше чек в кадре, тем точнее распознавание. Нужен интернет.</div>
    <label class="receipt-file-btn receipt-file-btn-camera">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>Сделать фото
      <input type="file" accept="image/*" capture="environment" id="receipt-camera-input">
    </label>
    <label class="receipt-file-btn receipt-file-btn-gallery">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>Выбрать из файла
      <input type="file" accept="image/*" id="receipt-file-input">
    </label>
    <img id="receipt-preview" alt="">
    <button type="button" class="receipt-action-btn" id="receipt-recognize-btn">Распознать чек</button>
    <div class="receipt-status" id="receipt-status"></div>
    <div id="receipt-step-area"></div>
  `;
  overlay.appendChild(box);
  (document.querySelector('.app-wrapper') || document.body).appendChild(overlay);

  const closeBtn = box.querySelector('.receipt-close');
  const camInput = box.querySelector('#receipt-camera-input');
  const fileInput = box.querySelector('#receipt-file-input');
  const preview = box.querySelector('#receipt-preview');
  const recognizeBtn = box.querySelector('#receipt-recognize-btn');
  const statusEl = box.querySelector('#receipt-status');

  function setStatus(t) { if (statusEl) statusEl.textContent = t || ''; }
  function closeOverlay() { overlay.remove(); }

  closeBtn.onclick = closeOverlay;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });

  function onFilePicked(f) {
    if (!f) return;
    const r = new FileReader();
    r.onload = function (ev) {
      receiptCurrentDataUrl = ev.target.result;
      preview.src = receiptCurrentDataUrl;
      preview.style.display = 'block';
      setStatus('Фото загружено. Нажмите «Распознать чек».');
    };
    r.readAsDataURL(f);
  }

  camInput.onchange = function () { onFilePicked(this.files && this.files[0]); };
  fileInput.onchange = function () { onFilePicked(this.files && this.files[0]); };

  recognizeBtn.onclick = async function () {
    if (!navigator.onLine) {
      showVoiceModal('Нужен интернет', 'Функция распознавания чеков требует подключение к интернету.', false);
      return;
    }
    if (!receiptCurrentDataUrl) { setStatus('Сначала выберите фото чека.'); return; }
    recognizeBtn.disabled = true;
    setStatus('Готовим фото и загружаем модуль распознавания...');
    try {
      const data = await recognizeReceiptText(receiptCurrentDataUrl, m => {
        if (!m) return;
        if (m.status === 'recognizing text' && typeof m.progress === 'number') setStatus('Распознаём текст: ' + Math.round(m.progress * 100) + '%');
        else if (m.status) setStatus('Распознаём чек...');
      });
      receiptRawText = data && data.text ? data.text : '';
      const lines = data && Array.isArray(data.lines) ? data.lines : [];
      receiptDetectedStore = detectReceiptStore(receiptRawText);
      receiptCandidates = parseReceiptText(receiptRawText, lines);
      renderReceiptStepCandidates(box, setStatus);
      if (receiptCandidates.length > 0) {
        let msg = 'Найдено товаров: ' + receiptCandidates.length;
        if (receiptDetectedStore) msg += '\n🏪 Магазин: ' + receiptDetectedStore;
        msg += '\nОтметьте нужные и нажмите «Далее».';
        setStatus(msg);
      } else {
        setStatus('Не удалось автоматически найти товары.\nПроверьте фото: чек должен занимать весь кадр.\nМожно открыть «Показать распознанный текст».');
      }
    } catch (e) {
      console.error(e);
      setStatus('Ошибка распознавания.');
      showVoiceModal('Ошибка распознавания', 'Не удалось распознать чек.\n\nПопробуйте другое фото или проверьте интернет.', false);
    } finally {
      recognizeBtn.disabled = false;
    }
  };

  window.__receiptCloseOverlay = closeOverlay;
  window.__receiptBox = box;
}

function renderReceiptStepCandidates(box, setStatus) {
  const area = box.querySelector('#receipt-step-area');
  if (!area) return;
  area.innerHTML = '';

  if (!receiptCandidates.length) {
    const d = document.createElement('details');
    d.className = 'receipt-raw-details';
    d.innerHTML = `<summary>Показать распознанный текст</summary><pre>${escapeHtml(receiptRawText)}</pre>`;
    area.appendChild(d);
    return;
  }

  const list = document.createElement('div');
  list.className = 'receipt-candidates';
  receiptCandidates.forEach((item, i) => {
    const guessCatId = (typeof guessCategoryByName === 'function') ? guessCategoryByName(item.name) : null;
    const catObj = guessCatId ? findCategoryById(guessCatId) : null;
    const unitGuess = guessUnitByName(item.name);
    const label = document.createElement('label');
    label.className = 'receipt-candidate';
    label.innerHTML = `
      <input type="checkbox" checked data-index="${i}">
      <span class="receipt-candidate-name">${escapeHtml(item.name)}</span>
      <span style="flex-shrink:0;font-size:.68rem;font-weight:700;color:var(--text-muted);background:var(--btn-secondary-bg);border:1px solid var(--btn-secondary-border);border-radius:.4rem;padding:.1rem .35rem;">${escapeHtml(unitGuess)}</span>
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:.5rem;">
        <span style="font-size:.7rem;color:#888;">Категория: ${escapeHtml(catObj ? catObj.name : 'Другое')}</span>
        <span class="receipt-candidate-price">${escapeHtml(item.price)} Р</span>
      </div>
      <span class="receipt-candidate-raw">${escapeHtml(item.raw || '')}</span>
    `;
    list.appendChild(label);
  });
  area.appendChild(list);

  const d = document.createElement('details');
  d.className = 'receipt-raw-details';
  d.innerHTML = `<summary>Показать распознанный текст</summary><pre>${escapeHtml(receiptRawText)}</pre>`;
  area.appendChild(d);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'receipt-action-btn';
  next.textContent = 'Далее →';
  next.onclick = function () {
    const checks = area.querySelectorAll('.receipt-candidate input[type="checkbox"]');
    receiptEditRows = [];
    checks.forEach(cb => {
      const i = parseInt(cb.getAttribute('data-index'), 10);
      const c = receiptCandidates[i];
      if (!c) return;
      const dup = findDuplicateProduct(c.name);
      const guess = (typeof guessCategoryByName === 'function') ? guessCategoryByName(c.name) : null;
      receiptEditRows.push({
        name: c.name,
        price: c.price,
        included: !!cb.checked,
        dupId: dup ? dup.id : null,
        dupName: dup ? dup.name : null,
        dupMode: dup ? 'update' : 'new',
        category: dup ? dup.category : (guess || 'other'),
        unit: dup ? (dup.unit || guessUnitByName(c.name)) : guessUnitByName(c.name)
      });
    });
    if (!receiptEditRows.length) {
      if (typeof showToast === 'function') showToast('Нет выбранных товаров');
      return;
    }
    renderReceiptStepEdit(box, setStatus);
  };
  area.appendChild(next);
}

function renderReceiptStepEdit(box, setStatus) {
  const area = box.querySelector('#receipt-step-area');
  if (!area) return;
  area.innerHTML = '';

  const note = document.createElement('div');
  note.className = 'receipt-mode-note';
  note.textContent = 'После сохранения товары появятся в перечне. Категорию и единицу можно поменять в каждой строке.';
  area.appendChild(note);

  const storeRow = document.createElement('div');
  storeRow.className = 'receipt-store-row';
  const allStores = [];
  if (Array.isArray(db.stores)) allStores.push.apply(allStores, db.stores);
  if (Array.isArray(db.pharmacies)) allStores.push.apply(allStores, db.pharmacies);
  const opts = allStores.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');
  storeRow.innerHTML = `
    <span>🏪</span>
    <input type="text" id="receipt-store-name" list="receipt-stores-datalist" placeholder="Магазин из чека (например: Евроопт)">
    <datalist id="receipt-stores-datalist">${opts}</datalist>
  `;
  area.appendChild(storeRow);

  const storeInput = storeRow.querySelector('#receipt-store-name');
  if (storeInput && receiptDetectedStore) storeInput.value = receiptDetectedStore;

  const allCats = getAllCategoriesList();
  const allUnits = (typeof getActiveUnits === 'function') ? getActiveUnits() : ['шт', 'кг', 'л', 'упаковка', 'пачка'];
  const editList = document.createElement('div');
  editList.className = 'receipt-edit-list';

  receiptEditRows.forEach((row, idx) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'receipt-edit-row';
    rowEl.dataset.idx = String(idx);
    const catOptions = allCats.map(c => `<option value="${escapeHtml(c.id)}" ${c.id === row.category ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
    const unitOptions = allUnits.map(u => `<option value="${escapeHtml(u)}" ${u === row.unit ? 'selected' : ''}>${escapeHtml(u)}</option>`).join('');
    let dupHtml = '';
    if (row.dupName) {
      dupHtml = `
        <div class="receipt-dup">⚠ Похожий товар уже есть: «${escapeHtml(row.dupName)}»
          <div class="receipt-dup-buttons">
            <button type="button" class="receipt-dup-btn ${row.dupMode === 'update' ? 'active' : ''}" data-dup="update">Обновить существующий</button>
            <button type="button" class="receipt-dup-btn ${row.dupMode === 'new' ? 'active' : ''}" data-dup="new">Создать новый</button>
          </div>
        </div>`;
    }
    rowEl.innerHTML = `
      <div class="receipt-edit-line1">
        <input type="checkbox" class="receipt-edit-include" ${row.included ? 'checked' : ''}>
        <input type="text" class="receipt-edit-name" value="${escapeHtml(row.name)}">
        <select class="receipt-edit-unit" style="width:4.6rem;margin:0;padding:.4rem .2rem;font-size:.8rem;flex-shrink:0;">${unitOptions}</select>
      </div>
      <div style="display:flex;gap:.4rem;align-items:center;margin-top:.4rem;flex-wrap:wrap;">
        <select class="receipt-edit-cat" style="flex:1;min-width:7rem;margin:0;padding:.4rem .3rem;font-size:.8rem;">${catOptions}</select>
        <input type="number" step="0.01" class="receipt-edit-price" value="${escapeHtml(row.price)}">
        <span class="receipt-edit-cur">Р</span>
      </div>${dupHtml}`;
    editList.appendChild(rowEl);
  });

  area.appendChild(editList);

  editList.querySelectorAll('.receipt-edit-row').forEach(rowEl => {
    const idx = parseInt(rowEl.dataset.idx, 10);
    const row = receiptEditRows[idx];
    if (!row) return;
    rowEl.querySelector('.receipt-edit-include').addEventListener('change', function () { row.included = this.checked; });
    rowEl.querySelector('.receipt-edit-name').addEventListener('input', function () { row.name = this.value; });
    rowEl.querySelector('.receipt-edit-cat').addEventListener('change', function () { row.category = this.value; });
    rowEl.querySelector('.receipt-edit-unit').addEventListener('change', function () { row.unit = this.value; });
    rowEl.querySelector('.receipt-edit-price').addEventListener('input', function () { row.price = parseFloat(this.value) || 0; });
    rowEl.querySelectorAll('.receipt-dup-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        row.dupMode = btn.dataset.dup;
        rowEl.querySelectorAll('.receipt-dup-btn').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  });

  const finalBtn = document.createElement('button');
  finalBtn.type = 'button';
  finalBtn.className = 'receipt-action-btn';
  finalBtn.textContent = '💾 Сохранить в перечень товаров';
  finalBtn.onclick = function () { finalizeReceiptImport(window.__receiptCloseOverlay); };
  area.appendChild(finalBtn);
}

function finalizeReceiptImport(closeOverlay) {
  const storeInput = document.getElementById('receipt-store-name');
  const storeName = storeInput ? storeInput.value.trim() : '';
  let storeObj = null;

  if (storeName) {
    const list = (typeof getActiveStoresList === 'function') ? getActiveStoresList() : db.stores;
    storeObj = list.find(s => s.name.toLowerCase() === storeName.toLowerCase());
    if (!storeObj) {
      const other = (list === db.stores) ? db.pharmacies : db.stores;
      if (Array.isArray(other)) storeObj = other.find(s => s.name.toLowerCase() === storeName.toLowerCase());
    }
    if (!storeObj) {
      const colors = (typeof presetColors !== 'undefined') ? presetColors : ['#00875a', '#3b82f6', '#d93838', '#f59e0b'];
      storeObj = {
        name: storeName,
        color: colors[db.stores.length % colors.length],
        image: '',
        address: '',
        type: (typeof currentProductsType !== 'undefined' && currentProductsType === 'meds') ? 'pharmacy' : 'store'
      };
      list.push(storeObj);
      if (typeof showToast === 'function') showToast('Магазин «' + storeName + '» добавлен в список');
      if (typeof renderStores === 'function') renderStores();
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isoStr = now.toISOString();
  let saved = 0;

  receiptEditRows.forEach(row => {
    if (!row.included) return;
    const name = String(row.name || '').trim();
    if (!name) return;

    let prod = null;
    if (row.dupMode === 'update' && row.dupId) prod = db.products.find(p => p.id === row.dupId);
    if (!prod) prod = db.products.find(p => normalizeForMatch(p.name) === normalizeForMatch(name));

    if (!prod) {
      prod = {
        id: 'p_receipt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
        name: name,
        category: row.category || 'other',
        unit: row.unit || 'шт',
        image: '',
        prices: {},
        dates: {},
        priceHistory: {},
        purchaseCount: 0
      };
      db.products.push(prod);
    } else {
      prod.category = row.category || prod.category;
      if (row.unit) prod.unit = row.unit;
    }

    if (storeObj && row.price > 0) {
      prod.prices[storeObj.name] = row.price;
      prod.dates[storeObj.name] = dateStr;
      if (!prod.priceHistory[storeObj.name]) prod.priceHistory[storeObj.name] = [];
      prod.priceHistory[storeObj.name].push({ price: row.price, date: dateStr, iso: isoStr });
    }
    saved++;
  });

  if (saved > 0) {
    if (typeof invalidatePriceCache === 'function') invalidatePriceCache();
    if (typeof saveDB === 'function') saveDB();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
    if (typeof showToast === 'function') showToast('💾 Сохранено товаров: ' + saved);
    haptic(40);
  } else if (typeof showToast === 'function') {
    showToast('Нет сохранённых товаров');
  }

  if (typeof closeOverlay === 'function') closeOverlay();
}

function initAllVoiceAndReceiptFeatures() {
  injectVoiceAndReceiptStyles();
  initVoiceSearch();
  injectReceiptScanButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllVoiceAndReceiptFeatures, { once: true });
} else {
  initAllVoiceAndReceiptFeatures();
}