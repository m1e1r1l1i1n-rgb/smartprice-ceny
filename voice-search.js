/* =============================================================
SmartPrice — voice-search.js
Голосовой поиск, импорт чека. Использует escapeHtml и preprocessImageForOcr из utils.js.
Добавлен haptic() при действиях.
============================================================= */
function injectVoiceAndReceiptStyles() {
if (window.__voiceAndReceiptStylesAdded) return;
window.__voiceAndReceiptStylesAdded = true;
const style = document.createElement('style');
style.textContent = `#add-store-modal .modal-content, #edit-store-modal .modal-content { background: var(--bg-color) !important; } .voice-modal-overlay, .receipt-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 13000; padding: 1rem; } .voice-modal-box, .receipt-box { width: 100%; max-width: 100%; background: var(--card-bg); color: var(--text-color); border-radius: 16px; padding: 1.15rem; box-shadow: 0 18px 50px rgba(0,0,0,.35); font-family: var(--font-family); box-sizing: border-box; } .receipt-box { max-height: 84vh; overflow: auto; } .receipt-box, .receipt-box * { font-family: var(--font-family); } .voice-modal-title, .receipt-title { font-weight: 900; font-size: 1.05rem; margin-bottom: .45rem; } .voice-modal-text { font-size: .92rem; line-height: 1.45; opacity: .92; margin-bottom: .9rem; white-space: pre-line; } .voice-modal-buttons { display: flex; gap: .6rem; } .voice-modal-buttons button { flex: 1; border: none; border-radius: .6rem; padding: .65rem .75rem; font-size: .95rem; font-weight: 900; cursor: pointer; } .voice-modal-ok { background: linear-gradient(145deg, var(--primary-color), var(--primary-hover)); color: #fff; } .voice-modal-settings { background: var(--border-color); color: var(--text-color); } .receipt-header { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-bottom: .75rem; } .receipt-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-color); } .receipt-note { font-size: .8rem; color: #777; line-height: 1.35; margin-bottom: .75rem; } .receipt-file-btn { display: flex; align-items: center; justify-content: center; gap: .5rem; width: 100%; border: none; border-radius: .6rem; padding: .7rem; font-weight: 900; cursor: pointer; color: #fff; margin-bottom: .5rem; font-size: .95rem; box-sizing: border-box; } .receipt-file-btn input { display: none; } .receipt-file-btn svg { width: 1.2rem; height: 1.2rem; flex-shrink: 0; } .receipt-file-btn:active { transform: translateY(1px); } .receipt-file-btn-camera { background: linear-gradient(145deg, #9C27B0, #7B1FA2); box-shadow: 0 3px 8px rgba(156,39,176,.3), inset 0 1px 0 rgba(255,255,255,.2); } .receipt-file-btn-gallery { background: linear-gradient(145deg, #42A5F5, #1976D2); box-shadow: 0 3px 8px rgba(25,118,210,.3), inset 0 1px 0 rgba(255,255,255,.2); } #receipt-preview { width: 100%; max-height: 220px; object-fit: contain; border-radius: .75rem; border: 1px solid var(--border-color); background: var(--bg-color); display: none; margin-bottom: .75rem; box-sizing: border-box; } .receipt-action-btn { width: 100%; border: none; border-radius: .6rem; padding: .7rem; font-size: .95rem; font-weight: 900; cursor: pointer; margin-bottom: .5rem; background: linear-gradient(145deg, var(--primary-color), var(--primary-hover)); color: #fff; box-sizing: border-box; } .receipt-action-btn:disabled { opacity: .5; cursor: not-allowed; } .receipt-status { font-size: .85rem; color: #777; margin-bottom: .75rem; white-space: pre-line; } .receipt-candidates { display: flex; flex-direction: column; gap: .4rem; margin-bottom: .75rem; } .receipt-candidate { display: flex; align-items: flex-start; flex-wrap: wrap; gap: .5rem; border: 1px solid var(--border-color); border-radius: .6rem; padding: .5rem; background: var(--bg-color); font-size: .88rem; cursor: pointer; box-sizing: border-box; } .receipt-candidate input { width: 1.05rem; height: 1.05rem; margin: 0; accent-color: var(--primary-color); flex-shrink: 0; margin-top: .1rem; } .receipt-candidate-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; } .receipt-candidate-price { font-weight: 900; color: var(--success-color); flex-shrink: 0; } .receipt-candidate-raw { width: 100%; font-size: .68rem; color: #999; word-break: break-word; } .receipt-raw-details { margin-top: .5rem; font-size: .75rem; color: #777; } .receipt-raw-details summary { cursor: pointer; font-weight: 700; margin-bottom: .35rem; } .receipt-raw-details pre { white-space: pre-wrap; word-break: break-word; font-size: .68rem; color: #888; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: .5rem; padding: .5rem; max-height: 160px; overflow: auto; margin: 0; } .receipt-scan-btn { margin-top: .5rem; width: 100%; border: none; color: #fff; font-weight: 900; border-radius: .6rem; padding: .7rem .75rem; cursor: pointer; background: linear-gradient(145deg, #fb923c, #ea580c); box-shadow: 0 4px 10px rgba(234,88,12,.35), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -2px 4px rgba(0,0,0,.15); display: flex; align-items: center; justify-content: center; gap: .5rem; font-size: .95rem; box-sizing: border-box; transition: transform .1s ease, box-shadow .1s ease; } .receipt-scan-btn:active { transform: translateY(1px); box-shadow: 0 1px 3px rgba(0,0,0,.12), inset 0 2px 4px rgba(0,0,0,.2); } .receipt-store-row { display: flex; gap: .5rem; align-items: center; margin-bottom: .75rem; } .receipt-store-row input { flex: 1; margin: 0; } .receipt-mode-note { font-size: .8rem; color: #777; margin-bottom: .75rem; } .receipt-edit-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: .75rem; } .receipt-edit-row { border: 1px solid var(--border-color); border-radius: .6rem; padding: .5rem; background: var(--card-bg); box-sizing: border-box; } .receipt-edit-line1 { display: flex; gap: .4rem; align-items: center; flex-wrap: wrap; } .receipt-edit-include { width: 1.1rem; height: 1.1rem; margin: 0; accent-color: var(--primary-color); flex-shrink: 0; } .receipt-edit-name { flex: 1; margin: 0; padding: .45rem .5rem; font-size: .9rem; min-width: 8rem; } .receipt-edit-cat { width: 7rem; margin: 0; padding: .4rem .3rem; font-size: .8rem; flex-shrink: 0; } .receipt-edit-price { width: 4.6rem; margin: 0; padding: .45rem .4rem; text-align: right; font-weight: 700; flex-shrink: 0; } .receipt-edit-cur { font-weight: 800; flex-shrink: 0; } .receipt-dup { margin-top: .4rem; padding: .4rem .5rem; border-radius: .5rem; background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.4); font-size: .75rem; color: #92400e; } [data-theme="dark"] .receipt-dup { color: #fbbf24; } .receipt-dup-buttons { display: flex; gap: .35rem; margin-top: .35rem; } .receipt-dup-btn { border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); border-radius: .45rem; padding: .3rem .5rem; font-size: .72rem; font-weight: 700; cursor: pointer; } .receipt-dup-btn.active { background: linear-gradient(145deg, var(--primary-color), var(--primary-hover)); color: #fff; border-color: var(--primary-color); } #stores-list .card > div:first-child > div:nth-child(2) > div:first-child { font-weight: 700 !important; font-size: 1.08rem !important; }`;
document.head.appendChild(style);
}
function showVoiceModal(title, message, showSettingsButton) {
injectVoiceAndReceiptStyles();
const overlay = document.createElement('div'); overlay.className = 'voice-modal-overlay';
const box = document.createElement('div'); box.className = 'voice-modal-box';
const t = document.createElement('div'); t.className = 'voice-modal-title'; t.textContent = title || 'Информация';
const m = document.createElement('div'); m.className = 'voice-modal-text'; m.textContent = message || '';
const b = document.createElement('div'); b.className = 'voice-modal-buttons';
if (showSettingsButton && typeof tryOpenSettings === 'function') { const s = document.createElement('button'); s.type = 'button'; s.className = 'voice-modal-settings'; s.textContent = 'Открыть настройки'; s.onclick = function () { overlay.remove(); tryOpenSettings(); }; b.appendChild(s); }
const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'voice-modal-ok'; ok.textContent = 'Понятно'; ok.onclick = function () { overlay.remove(); }; b.appendChild(ok);
box.appendChild(t); box.appendChild(m); box.appendChild(b); overlay.appendChild(box);
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
if (prod && !db.cart.some(i => i.id === prod.id)) { db.cart.push({ id: prod.id, qty: 1, checked: false }); added++; }
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
if (!SR) { document.querySelectorAll('.voice-search-btn').forEach(b => b.style.display = 'none'); return; }
const recognition = new SR();
recognition.lang = 'ru-RU'; recognition.interimResults = false; recognition.maxAlternatives = 1; recognition.continuous = false;
let currentInput = null, currentBtn = null, isActive = false;
function setListening(b, v) { if (b) b.classList.toggle('listening', !!v); }
function stopSafe() { try { recognition.stop(); } catch (e) {} }
function reset() { setListening(currentBtn, false); currentInput = null; currentBtn = null; isActive = false; }
recognition.onaudiostart = function () { isActive = true; setListening(currentBtn, true); };
recognition.onaudioend = function () { setListening(currentBtn, false); };
recognition.onend = function () { reset(); };
recognition.onerror = function (ev) { setListening(currentBtn, false); isActive = false; if (ev.error === 'aborted') return; if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { showVoiceModal('Нет доступа к микрофону', 'Для голосового поиска нужно разрешить доступ к микрофону.\n\nОткройте настройки браузера и разрешите доступ к микрофону.', true); return; } if (ev.error === 'network') { showVoiceModal('Нужен интернет', 'Для распознавания речи нужно подключение к интернету.', false); return; } if (ev.error === 'audio-capture') { showVoiceModal('Микрофон не найден', 'Не удалось найти микрофон.', false); return; } if (ev.error === 'no-speech') { if (typeof showToast === 'function') showToast('Речь не распознана'); return; } if (typeof showToast === 'function') showToast('Ошибка голосового поиска'); };
recognition.onresult = function (ev) { const tr = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : ''; if (!tr || !currentInput) return; if ((currentInput.id || '') === 'cart-search-input' && typeof addProductsByVoice === 'function') { const n = addProductsByVoice(tr); if (n > 0) { currentInput.value = ''; currentInput.dispatchEvent(new Event('input', { bubbles: true })); return; } } currentInput.value = tr; currentInput.dispatchEvent(new Event('input', { bubbles: true })); };
document.addEventListener('click', function (e) { const btn = e.target.closest('.voice-search-btn'); if (!btn) return; if (btn.classList.contains('listening') || isActive) { stopSafe(); reset(); return; } if (!navigator.onLine) { showVoiceModal('Нужен интернет', 'Для распознавания речи нужно подключение к интернету.', false); return; } const tid = btn.getAttribute('data-target'); const input = tid ? document.getElementById(tid) : null; if (!input) return; currentInput = input; currentBtn = btn; try { recognition.start(); } catch (err) { reset(); } });
}
/* ---------- импорт чека ---------- */
let receiptCurrentDataUrl = ''; let receiptCandidates = []; let receiptEditRows = []; let receiptRawText = '';
function injectReceiptScanButton() { const header = document.querySelector('#page-products .products-sticky-header'); if (!header) return; if (header.querySelector('.receipt-scan-btn')) return; const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'receipt-scan-btn'; btn.innerHTML = '🧾 Импорт чека'; btn.onclick = function () { openReceiptScanModal(); }; header.appendChild(btn); }
function loadTesseract() { if (window.Tesseract) return Promise.resolve(); if (window.__tesseractPromise) return window.__tesseractPromise; window.__tesseractPromise = new Promise(function (res, rej) { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; s.onload = function () { if (window.Tesseract) res(); else { window.__tesseractPromise = null; rej(new Error('Tesseract не загрузился')); } }; s.onerror = function () { window.__tesseractPromise = null; rej(new Error('Не удалось загрузить модуль')); }; document.head.appendChild(s); }); return window.__tesseractPromise; }
async function recognizeReceiptText(dataUrl, onProgress) {
const processed = await preprocessImageForOcr(dataUrl);
await loadTesseract();
let result;
try { result = await Tesseract.recognize(processed, 'rus', { logger: m => { if (typeof onProgress === 'function') onProgress(m); } }); }
catch (e) { try { result = await Tesseract.recognize(processed, 'eng', { logger: m => { if (typeof onProgress === 'function') onProgress(m); } }); } catch (e2) { throw e; } }
return (result && result.data) ? result.data : { text: '', lines: [] };
}
function normalizeReceiptLine(l) { return String(l || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').replace(/[|_~`]+/g, ' ').replace(/\s+/g, ' ').trim(); }
const RECEIPT_SERVICE_WORDS = ['внесено', 'сдача', 'наличн', 'оплата', 'итого', 'итог', 'скидк', 'спасибо', 'покупк', 'касса', 'чек', 'прода', 'терминал', 'мерчант', 'инн', 'кпп', 'фп', 'экпз', 'сруб', 'сумма', 'комиссия', 'ооо', 'зао', 'адрес', 'сайт', 'телефон', 'время', 'дата', 'смена', 'оператор', 'кассир', 'покупатель', 'клиент', 'карта', 'балл', 'бонус', 'акция', 'ндс', 'налог', 'фискальн', 'ккт', 'код', 'место', 'расчет', 'счет', 'цена', 'огрн', 'орн', 'субт', 'местекс'];
function isServiceReceiptLine(line) { const lower = String(line || '').toLowerCase(); if (lower.includes('№')) return true; if (lower.includes('#')) return true; if (/^\d{2}.\d{2}.\d{2,4}/.test(lower)) return true; if (/^(\d[\s-:]{0,5}){6,}/.test(lower)) return true; if (/\d{6,}/.test(lower)) return true; if (/(^|\s)[a-zа-яё]{2,}\s*:/.test(lower)) return true; for (let i = 0; i < RECEIPT_SERVICE_WORDS.length; i++) { if (lower.includes(RECEIPT_SERVICE_WORDS[i])) return true; } return false; }
function findLastPrice(line) { const re = /(\d{1,7}(?:[.,]\d{1,2})?)\s*(?:р|руб|₽|р.|бел.?\sруб|бел.?\sр|коп|к|бел)?/gi; let m, last = null; while ((m = re.exec(line)) !== null) { const p = parseFloat(m[1].replace(',', '.')); if (isFinite(p) && p > 0) last = { price: p, index: m.index, text: m[0] }; } return last; }
function cleanReceiptName(name) { if (!name) return ''; name = String(name).replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\d+[.,]\d+\s*[xх*]\s*\d+[.,]\d+\s*=?/g, ' ').replace(/[=≡]+\s*$/g, '').replace(/(^|\s)(р|руб|₽|р.|бел.?\sруб|бел.?\sр|коп|к)(\s|$)/gi, ' ').replace(/^\d{1,3}\s*[xх*]\s*\d/, '').replace(/^\d{1,3}\s+(?=[A-ZА-ЯЁa-zа-яё«"])/, '').replace(/[.,;:|•·-–—\s]+$/, '').replace(/\s{2,}/g, ' ').trim(); return name; }
function isGoodReceiptName(name) { if (!name || name.length < 3 || name.length > 90) return false; const letters = (name.match(/[A-Za-zА-Яа-яЁё]/g) || []).length; if (letters < 3) return false; const digits = (name.match(/\d/g) || []).length; if (digits > letters) return false; if (isServiceReceiptLine(name)) return false; return true; }
function parseReceiptLine(line) { const n = normalizeReceiptLine(line); if (!n || n.length < 5 || n.length > 160) return null; if (isServiceReceiptLine(n)) return null; const p = findLastPrice(n); if (!p) return null; let name = cleanReceiptName(n.slice(0, p.index).trim()); if (!isGoodReceiptName(name)) return null; return { name: name, price: p.price, raw: n }; }
function parseReceiptText(text, lines) { const candidates = []; const seen = new Set(); function add(c) { if (!c || !c.name) return; const k = c.name.toLowerCase().replace(/ё/g, 'е') + '|' + c.price; if (seen.has(k)) return; seen.add(k); candidates.push(c); } let src = []; if (Array.isArray(lines) && lines.length) src = lines.map(l => l && l.text ? l.text : l); else src = String(text || '').split(/\r?\n+/); src.forEach(l => add(parseReceiptLine(l))); if (candidates.length < 3) String(text || '').split(/\s{2,}/).forEach(ch => add(parseReceiptLine(ch))); return candidates.slice(0, 80); }
function normalizeForMatch(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/gi, ' ').trim(); }
function findDuplicateProduct(name) { const n = normalizeForMatch(name); if (n.length < 4) return null; let best = null; db.products.forEach(p => { const pn = normalizeForMatch(p.name); if (!pn || pn.length < 4) return; if (pn === n) { best = p; return; } if (!best && (pn.includes(n) || n.includes(pn))) { best = p; return; } if (!best && n.length >= 6 && pn.length >= 6 && pn.startsWith(n.slice(0, 6))) best = p; }); return best; }
function getAllCategoriesList() { const a = (typeof categories !== 'undefined') ? categories.slice() : []; const m = (typeof medCategories !== 'undefined') ? medCategories.slice() : []; return a.concat(m); }
function openReceiptScanModal() {
injectVoiceAndReceiptStyles();
receiptCurrentDataUrl = ''; receiptCandidates = []; receiptEditRows = []; receiptRawText = '';
const overlay = document.createElement('div'); overlay.className = 'receipt-overlay';
const box = document.createElement('div'); box.className = 'receipt-box';
box.innerHTML = `<div class="receipt-header"><div class="receipt-title">🧾 Импорт чека в перечень товаров</div><button type="button" class="receipt-close">✕</button></div> <div class="receipt-note">Сфотографируйте чек ровно, при хорошем свете. Для распознавания нужен интернет.</div> <label class="receipt-file-btn receipt-file-btn-camera"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>Сделать фото<input type="file" accept="image/*" capture="environment" id="receipt-camera-input"></label> <label class="receipt-file-btn receipt-file-btn-gallery"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>Выбрать из файла<input type="file" accept="image/*" id="receipt-file-input"></label> <img id="receipt-preview" alt=""> <button type="button" class="receipt-action-btn" id="receipt-recognize-btn">Распознать чек</button> <div class="receipt-status" id="receipt-status"></div> <div id="receipt-step-area"></div>`;
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
function onFilePicked(f) { if (!f) return; const r = new FileReader(); r.onload = function (ev) { receiptCurrentDataUrl = ev.target.result; preview.src = receiptCurrentDataUrl; preview.style.display = 'block'; setStatus('Фото загружено. Нажмите «Распознать чек».'); }; r.readAsDataURL(f); }
camInput.onchange = function () { onFilePicked(this.files && this.files[0]); };
fileInput.onchange = function () { onFilePicked(this.files && this.files[0]); };
recognizeBtn.onclick = async function () {
if (!navigator.onLine) { showVoiceModal('Нужен интернет', 'Функция распознавания чеков требует подключение к интернету.', false); return; }
if (!receiptCurrentDataUrl) { setStatus('Сначала выберите фото чека.'); return; }
recognizeBtn.disabled = true; setStatus('Загружаем модуль распознавания...');
try {
const data = await recognizeReceiptText(receiptCurrentDataUrl, m => { if (!m) return; if (m.status === 'recognizing text' && typeof m.progress === 'number') setStatus('Распознаём текст: ' + Math.round(m.progress * 100) + '%'); else if (m.status) setStatus('Распознаём чек...'); });
receiptRawText = data && data.text ? data.text : '';
const lines = data && Array.isArray(data.lines) ? data.lines : [];
receiptCandidates = parseReceiptText(receiptRawText, lines);
renderReceiptStepCandidates(box, setStatus);
if (receiptCandidates.length > 0) setStatus('Найдено товаров: ' + receiptCandidates.length + '\nОтметьте нужные и нажмите «Далее».');
else setStatus('Не удалось автоматически найти товары.\nОткройте «Показать распознанный текст».');
} catch (e) { console.error(e); setStatus('Ошибка распознавания.'); showVoiceModal('Ошибка распознавания', 'Не удалось распознать чек.\n\nПопробуйте другое фото или проверьте интернет.', false); }
finally { recognizeBtn.disabled = false; }
};
window.__receiptCloseOverlay = closeOverlay; window.__receiptBox = box;
}
function renderReceiptStepCandidates(box, setStatus) {
const area = box.querySelector('#receipt-step-area'); if (!area) return;
area.innerHTML = '';
if (!receiptCandidates.length) { const d = document.createElement('details'); d.className = 'receipt-raw-details'; d.innerHTML = `<summary>Показать распознанный текст</summary><pre>${escapeHtml(receiptRawText)}</pre>`; area.appendChild(d); return; }
const list = document.createElement('div'); list.className = 'receipt-candidates';
receiptCandidates.forEach((item, i) => { const label = document.createElement('label'); label.className = 'receipt-candidate'; label.innerHTML = `<input type="checkbox" checked data-index="${i}"><span class="receipt-candidate-name">${escapeHtml(item.name)}</span><span class="receipt-candidate-price">${escapeHtml(item.price)} Р</span><span class="receipt-candidate-raw">${escapeHtml(item.raw || '')}</span>`; list.appendChild(label); });
area.appendChild(list);
const d = document.createElement('details'); d.className = 'receipt-raw-details'; d.innerHTML = `<summary>Показать распознанный текст</summary><pre>${escapeHtml(receiptRawText)}</pre>`; area.appendChild(d);
const next = document.createElement('button'); next.type = 'button'; next.className = 'receipt-action-btn'; next.textContent = 'Далее →';
next.onclick = function () {
const checks = area.querySelectorAll('.receipt-candidate input[type="checkbox"]');
receiptEditRows = [];
checks.forEach(cb => { const i = parseInt(cb.getAttribute('data-index'), 10); const c = receiptCandidates[i]; if (!c) return; const dup = findDuplicateProduct(c.name); const guess = (typeof guessCategoryByName === 'function') ? guessCategoryByName(c.name) : null; receiptEditRows.push({ name: c.name, price: c.price, included: !!cb.checked, dupId: dup ? dup.id : null, dupName: dup ? dup.name : null, dupMode: dup ? 'update' : 'new', category: dup ? dup.category : (guess || 'other') }); });
if (!receiptEditRows.length) { if (typeof showToast === 'function') showToast('Нет выбранных товаров'); return; }
renderReceiptStepEdit(box, setStatus);
};
area.appendChild(next);
}
function renderReceiptStepEdit(box, setStatus) {
const area = box.querySelector('#receipt-step-area'); if (!area) return;
area.innerHTML = '';
const note = document.createElement('div'); note.className = 'receipt-mode-note';
note.textContent = 'После сохранения товары появятся в перечне. Категорию можно поменять в каждой строке.';
area.appendChild(note);
const storeRow = document.createElement('div'); storeRow.className = 'receipt-store-row';
const allStores = []; if (Array.isArray(db.stores)) allStores.push.apply(allStores, db.stores); if (Array.isArray(db.pharmacies)) allStores.push.apply(allStores, db.pharmacies);
const opts = allStores.map(s => `<option value="${escapeHtml(s.name)}"></option>`).join('');
storeRow.innerHTML = `<span>🏪</span><input type="text" id="receipt-store-name" list="receipt-stores-datalist" placeholder="Магазин из чека (например: Евроопт)"><datalist id="receipt-stores-datalist">${opts}</datalist>`;
area.appendChild(storeRow);
const allCats = getAllCategoriesList();
const editList = document.createElement('div'); editList.className = 'receipt-edit-list';
receiptEditRows.forEach((row, idx) => {
const rowEl = document.createElement('div'); rowEl.className = 'receipt-edit-row'; rowEl.dataset.idx = String(idx);
const catOptions = allCats.map(c => `<option value="${escapeHtml(c.id)}" ${c.id === row.category ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
let dupHtml = '';
if (row.dupName) dupHtml = `<div class="receipt-dup">⚠ Похожий товар уже есть: «${escapeHtml(row.dupName)}»<div class="receipt-dup-buttons"><button type="button" class="receipt-dup-btn ${row.dupMode === 'update' ? 'active' : ''}" data-dup="update">Обновить существующий</button><button type="button" class="receipt-dup-btn ${row.dupMode === 'new' ? 'active' : ''}" data-dup="new">Создать новый</button></div></div>`;
rowEl.innerHTML = `<div class="receipt-edit-line1"><input type="checkbox" class="receipt-edit-include" ${row.included ? 'checked' : ''}><input type="text" class="receipt-edit-name" value="${escapeHtml(row.name)}"><select class="receipt-edit-cat">${catOptions}</select><input type="number" step="0.01" class="receipt-edit-price" value="${escapeHtml(row.price)}"><span class="receipt-edit-cur">Р</span></div>${dupHtml}`;
editList.appendChild(rowEl);
});
area.appendChild(editList);
editList.querySelectorAll('.receipt-edit-row').forEach(rowEl => {
const idx = parseInt(rowEl.dataset.idx, 10); const row = receiptEditRows[idx]; if (!row) return;
rowEl.querySelector('.receipt-edit-include').addEventListener('change', function () { row.included = this.checked; });
rowEl.querySelector('.receipt-edit-name').addEventListener('input', function () { row.name = this.value; });
rowEl.querySelector('.receipt-edit-cat').addEventListener('change', function () { row.category = this.value; });
rowEl.querySelector('.receipt-edit-price').addEventListener('input', function () { row.price = parseFloat(this.value) || 0; });
rowEl.querySelectorAll('.receipt-dup-btn').forEach(btn => { btn.addEventListener('click', function () { row.dupMode = btn.dataset.dup; rowEl.querySelectorAll('.receipt-dup-btn').forEach(b => b.classList.toggle('active', b === btn)); }); });
});
const finalBtn = document.createElement('button'); finalBtn.type = 'button'; finalBtn.className = 'receipt-action-btn';
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
if (!storeObj) { const other = (list === db.stores) ? db.pharmacies : db.stores; if (Array.isArray(other)) storeObj = other.find(s => s.name.toLowerCase() === storeName.toLowerCase()); }
if (!storeObj) { const colors = (typeof presetColors !== 'undefined') ? presetColors : ['#00875a', '#3b82f6', '#d93838', '#f59e0b']; storeObj = { name: storeName, color: colors[db.stores.length % colors.length], image: '', address: '', type: (typeof currentProductsType !== 'undefined' && currentProductsType === 'meds') ? 'pharmacy' : 'store' }; list.push(storeObj); if (typeof showToast === 'function') showToast('🏪 Магазин «' + storeName + '» добавлен в список'); if (typeof renderStores === 'function') renderStores(); }
}
const now = new Date();
const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let saved = 0;
receiptEditRows.forEach(row => {
if (!row.included) return;
const name = String(row.name || '').trim(); if (!name) return;
let prod = null;
if (row.dupMode === 'update' && row.dupId) prod = db.products.find(p => p.id === row.dupId);
if (!prod) prod = db.products.find(p => normalizeForMatch(p.name) === normalizeForMatch(name));
if (!prod) { prod = { id: 'p_receipt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), name: name, category: row.category || 'other', unit: 'шт', image: '', prices: {}, dates: {}, priceHistory: {}, purchaseCount: 0 }; db.products.push(prod); }
else { prod.category = row.category || prod.category; }
if (storeObj && row.price > 0) { prod.prices[storeObj.name] = row.price; prod.dates[storeObj.name] = dateStr; if (!prod.priceHistory[storeObj.name]) prod.priceHistory[storeObj.name] = []; prod.priceHistory[storeObj.name].push({ price: row.price, date: dateStr }); }
saved++;
});
if (saved > 0) {
if (typeof saveDB === 'function') saveDB();
if (typeof renderProducts === 'function') renderProducts();
if (typeof renderCart === 'function') renderCart();
if (typeof renderStoresComparison === 'function') renderStoresComparison();
if (typeof showToast === 'function') showToast('💾 Сохранено товаров: ' + saved);
haptic(40);
}
else if (typeof showToast === 'function') showToast('Нет сохранённых товаров');
if (typeof closeOverlay === 'function') closeOverlay();
}
function initAllVoiceAndReceiptFeatures() { injectVoiceAndReceiptStyles(); initVoiceSearch(); injectReceiptScanButton(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAllVoiceAndReceiptFeatures, { once: true });
else initAllVoiceAndReceiptFeatures();