/* =============================================================
SmartPrice — products.js
+/✓ кнопка, автокатегория, мультивыделение, бесконечный скролл, умный поиск.
Использует compressImage и haptic из utils.js.
============================================================= */
let selectionMode = false;
let selectedProductIds = new Set();
let suppressNextClick = false;
/* ---------- Бесконечный скролл (Infinite Scroll) ---------- */
const PRODUCTS_PER_LOAD = 15;
const SCROLL_THRESHOLD = 200;
let loadedProductsCount = {};
let isLoadingMore = {};
function loadMoreProducts(catId) {
  if (isLoadingMore[catId]) return;
  isLoadingMore[catId] = true;
  const allProds = db.products.filter(p => p.category === catId && fuzzyMatch(p.name, document.getElementById('search-input').value.toLowerCase()));
  const currentLoaded = loadedProductsCount[catId] || PRODUCTS_PER_LOAD;
  if (currentLoaded < allProds.length) {
    loadedProductsCount[catId] = currentLoaded + PRODUCTS_PER_LOAD;
    renderProducts();
  }
  isLoadingMore[catId] = false;
}
function resetLoadedProducts(catId) {
  loadedProductsCount[catId] = PRODUCTS_PER_LOAD;
  isLoadingMore[catId] = false;
}
function checkScrollPosition() {
  const container = document.getElementById('categories-list');
  if (!container) return;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  if (scrollTop + windowHeight >= docHeight - SCROLL_THRESHOLD) {
    const cards = container.querySelectorAll('.card');
    if (cards.length > 0) {
      const lastCard = cards[cards.length - 1];
      const catId = lastCard.id.replace('cat-content-', '');
      if (catId && !isLoadingMore[catId]) {
        loadMoreProducts(catId);
      }
    }
  }
}
window.addEventListener('scroll', checkScrollPosition, { passive: true });
/* ---------- Умный поиск ---------- */
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}
function fuzzyMatch(text, query) {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerText.includes(lowerQuery)) return true;
  const words = lowerText.split(/\s+/);
  const queryWords = lowerQuery.split(/\s+/);
  for (const qw of queryWords) {
    if (qw.length < 3) continue;
    let found = false;
    for (const tw of words) {
      if (tw.length < 3) continue;
      if (levenshteinDistance(tw, qw) <= 2) { found = true; break; }
    }
    if (!found) return false;
  }
  return true;
}
/* ---------- Кэш цен ---------- */
let priceCache = { best: {}, worst: {} };
function invalidatePriceCache(productId) {
  if (productId) { delete priceCache.best[productId]; delete priceCache.worst[productId]; }
  else { priceCache.best = {}; priceCache.worst = {}; }
}
/* ---------- Debounce ---------- */
let priceDebounceTimers = {};
function debouncedUpdatePrice(prodId, store, val) {
  const key = prodId + '|' + store;
  if (priceDebounceTimers[key]) clearTimeout(priceDebounceTimers[key]);
  priceDebounceTimers[key] = setTimeout(function() {
    updatePrice(prodId, store, val);
    delete priceDebounceTimers[key];
  }, 400);
}
function injectProductsStyles() {
  if (window.__productsStylesAdded) return;
  window.__productsStylesAdded = true;
  const s = document.createElement('style');
  s.textContent = `.product-item { -webkit-user-select: none; user-select: none; } .product-item.selected { background: var(--badge-bg); border-radius: .5rem; padding-left: .4rem !important; padding-right: .4rem !important; } .prod-quick-add { width: 2.2rem; height: 2.2rem; border-radius: .55rem; border: none; background: linear-gradient(145deg, var(--primary-color), var(--primary-hover)); color: #fff; font-size: 1.2rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.3); } .prod-quick-add:active { transform: translateY(1px); } .prod-quick-add.in-cart { background: var(--badge-bg); color: var(--success-color); border: 1px solid var(--success-color); box-shadow: none; } #product-selection-bar { position: absolute; left: 1rem; right: 1rem; bottom: 4.6rem; z-index: 120; display: none; gap: .5rem; align-items: center; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: .75rem; padding: .5rem .75rem; box-shadow: 0 6px 16px rgba(0,0,0,.25); } #product-selection-bar span { flex: 1; font-weight: 800; font-size: .85rem; } #product-selection-bar button { border: none; border-radius: .55rem; padding: .5rem .7rem; font-weight: 800; cursor: pointer; } #selection-actions-btn { background: linear-gradient(145deg, var(--primary-color), var(--primary-hover)); color: #fff; } #selection-cancel-btn { background: var(--border-color); color: var(--text-color); } .sel-actions-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 13000; padding: 1rem; } .sel-actions-box { width: 100%; max-width: 320px; background: var(--card-bg); color: var(--text-color); border-radius: 16px; padding: 1rem; box-shadow: 0 18px 50px rgba(0,0,0,.35); } .sel-actions-title { font-weight: 900; margin-bottom: .75rem; } .sel-actions-box button { width: 100%; border: none; border-radius: .6rem; padding: .7rem; font-size: .95rem; font-weight: 900; cursor: pointer; margin-bottom: .5rem; } #sel-to-cart { background: linear-gradient(145deg, var(--primary-color), var(--primary-hover)); color: #fff; } #sel-delete { background: var(--danger-color); color: #fff; } #sel-cancel { background: var(--border-color); color: var(--text-color); }`;
  document.head.appendChild(s);
}
const CATEGORY_KEYWORDS = [
  ['milk', ['молок', 'сыр', 'творог', 'сметан', 'кефир', 'йогурт', 'ряженк', 'сливк', 'масл', 'снеда', 'милена']],
  ['meat', ['мяс', 'говяд', 'свин', 'кур', 'куриц', 'рыб', 'лосос', 'селёд', 'фарш', 'тушеная', 'говядина']],
  ['sausage', ['колбас', 'сосис', 'сардел', 'ветчин', 'шпикачк']],
  ['veg', ['овощ', 'фрукт', 'яблок', 'банан', 'огурец', 'помидор', 'томат', 'картоф', 'лук', 'морков', 'зелень', 'салат', 'апельсин', 'лимон', 'виноград', 'свекл', 'капуста']],
  ['bread', ['хлеб', 'булк', 'батон', 'выпечк', 'лаваш']],
  ['grocery', ['круп', 'рис', 'гречк', 'макарон', 'мука', 'сахар', 'соль', 'специ', 'чай', 'кофе', 'овсян', 'пшен', 'манка', 'горох', 'фасоль', 'печенье']],
  ['drinks', ['сок', 'вод', 'напит', 'пиво', 'газиров', 'квас', 'компот', 'морс']],
  ['frozen', ['замороз', 'пельмен', 'морож', 'полуфабрик']],
  ['snacks', ['чипс', 'конфет', 'шоколад', 'орех', 'зефир', 'мармелад', 'крекер']],
  ['canned', ['консерв', 'тушенк', 'шпрот', 'оливк', 'маслин']],
  ['household', ['тряпк', 'губк', 'мешк', 'перчатк', 'салфет', 'бумага', 'туалетн']],
  ['chem', ['шампун', 'мыл', 'порошок', 'зубн', 'паст', 'гель', 'стир']]
];
function guessCategoryByName(name) {
  const lower = String(name || '').toLowerCase().replace(/ё/g, 'е');
  if (!lower) return null;
  for (let i = 0; i < CATEGORY_KEYWORDS.length; i++) {
    const words = CATEGORY_KEYWORDS[i][1];
    for (let w = 0; w < words.length; w++) { if (lower.includes(words[w].replace(/ё/g, 'е'))) return CATEGORY_KEYWORDS[i][0]; }
  }
  return null;
}
function enterSelectionMode(id) { selectionMode = true; selectedProductIds = new Set([id]); renderProducts(); showSelectionBar(); }
function exitSelectionMode() { selectionMode = false; selectedProductIds.clear(); hideSelectionBar(); renderProducts(); }
function toggleSelected(id) { if (selectedProductIds.has(id)) selectedProductIds.delete(id); else selectedProductIds.add(id); renderProducts(); showSelectionBar(); }
function showSelectionBar() {
  let bar = document.getElementById('product-selection-bar');
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'product-selection-bar';
    bar.innerHTML = `<span id="selection-count"></span><button type="button" id="selection-actions-btn">⚙️ Действия</button><button type="button" id="selection-cancel-btn">✕</button>`;
    document.querySelector('.app-wrapper').appendChild(bar);
    document.getElementById('selection-actions-btn').onclick = openSelectionActionsModal;
    document.getElementById('selection-cancel-btn').onclick = exitSelectionMode;
  }
  document.getElementById('selection-count').textContent = 'Выбрано: ' + selectedProductIds.size;
  bar.style.display = 'flex';
}
function hideSelectionBar() { const bar = document.getElementById('product-selection-bar'); if (bar) bar.style.display = 'none'; }
function openSelectionActionsModal() {
  const n = selectedProductIds.size; if (!n) return;
  const overlay = document.createElement('div'); overlay.className = 'sel-actions-overlay';
  overlay.innerHTML = `<div class="sel-actions-box"><div class="sel-actions-title">Действия с выбранными (${n})</div><button type="button" id="sel-to-cart">🛒 Отправить в корзину</button><button type="button" id="sel-delete">🗑 Удалить из товаров</button><button type="button" id="sel-cancel">Отмена</button></div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('#sel-cancel').onclick = close;
  overlay.querySelector('#sel-to-cart').onclick = function () { close(); sendSelectedToCart(); };
  overlay.querySelector('#sel-delete').onclick = function () { close(); deleteSelectedProducts(); };
}
function sendSelectedToCart() {
  let added = 0;
  selectedProductIds.forEach(id => { if (!db.cart.some(i => i.id === id)) { db.cart.push({ id: id, qty: 1, checked: false }); added++; } });
  saveDB(); exitSelectionMode();
  if (typeof renderCart === 'function') renderCart();
  if (typeof renderStoresComparison === 'function') renderStoresComparison();
  if (typeof updateCartBadge === 'function') updateCartBadge();
  if (typeof showToast === 'function') showToast('🛒 В корзину: ' + added);
}
function showSelConfirm(message, onOk) {
  const overlay = document.createElement('div'); overlay.className = 'sel-actions-overlay';
  overlay.innerHTML = `<div class="sel-actions-box"><div class="sel-actions-title">${message}</div><button type="button" id="sel-ok" style="background:var(--danger-color);color:#fff;">Да, удалить</button><button type="button" id="sel-no" style="background:var(--border-color);color:var(--text-color);">Отмена</button></div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#sel-no').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('#sel-ok').onclick = function () { close(); onOk(); };
}
function deleteSelectedProducts() {
  const n = selectedProductIds.size;
  showSelConfirm('Удалить ' + n + ' товаров безвозвратно?', function () {
    db.products = db.products.filter(p => !selectedProductIds.has(p.id));
    db.cart = db.cart.filter(i => !selectedProductIds.has(i.id));
    saveDB(); exitSelectionMode();
    renderProducts();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof showToast === 'function') showToast('🗑 Удалено: ' + n);
  });
}
function attachLongPress(item, id) {
  let timer = null, sx = 0, sy = 0;
  item.addEventListener('pointerdown', function (e) {
    if (selectionMode) return;
    sx = e.clientX; sy = e.clientY;
    timer = setTimeout(function () {
      timer = null; suppressNextClick = true;
      enterSelectionMode(id);
      haptic(40);
    }, 500);
  });
  item.addEventListener('pointermove', function (e) {
    if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) { clearTimeout(timer); timer = null; }
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => {
    item.addEventListener(ev, function () { if (timer) { clearTimeout(timer); timer = null; } });
  });
  item.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}
function handleItemTap(id) {
  if (suppressNextClick) { suppressNextClick = false; return; }
  if (selectionMode) toggleSelected(id);
  else openProductModal(id);
}
function toggleProductInCart(id, btn) {
  const idx = db.cart.findIndex(i => i.id === id);
  if (idx >= 0) {
    db.cart.splice(idx, 1);
    if (typeof showToast === 'function') showToast('Убрано из корзины');
  } else {
    db.cart.push({ id: id, qty: 1, checked: false });
    flyToCartAnimation(btn);
    if (typeof showToast === 'function') showToast('✅ В корзину');
  }
  haptic(40);
  saveDB(); renderProducts();
  if (typeof renderCart === 'function') renderCart();
  if (typeof renderStoresComparison === 'function') renderStoresComparison();
  if (typeof updateCartBadge === 'function') updateCartBadge();
}
function switchProductsType(type) {
  currentProductsType = type;
  const b1 = document.getElementById('btn-products-type'), b2 = document.getElementById('btn-meds-type'), t = document.getElementById('products-page-title');
  if (b1) b1.classList.toggle('active', type === 'products');
  if (b2) b2.classList.toggle('active', type === 'meds');
  if (t) t.textContent = type === 'products' ? 'Товары' : 'Лекарства';
  renderProducts();
}
function toggleCategory(catId) {
  db.collapsedCategories[catId] = !db.collapsedCategories[catId];
  saveDB();
  resetLoadedProducts(catId);
  renderProducts();
}
function renderProducts() {
  injectProductsStyles();
  const container = document.getElementById('categories-list');
  const search = (document.getElementById('search-input').value || '').toLowerCase();
  container.innerHTML = '';
  const activeCategories = getActiveCategories();
  const sortedCats = activeCategories.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const isGridView = (db.settings.categoryViewMode === 'grid' && !search);
  if (isGridView) {
    const gridDiv = document.createElement('div'); gridDiv.className = 'categories-grid-view';
    sortedCats.forEach(cat => {
      const prods = db.products.filter(p => p.category === cat.id);
      const tile = document.createElement('div'); tile.className = 'category-tile cat-color-' + cat.id;
      tile.onclick = () => openCategoryModal(cat.id);
      // КРУЖОК ПОСЛЕ НАЗВАНИЯ — обёрнуты в один контейнер
      tile.innerHTML = `<div class="tile-icon">${cat.icon}</div><div class="tile-name-row"><span class="tile-name">${cat.name}</span><span class="tile-count">${prods.length}</span></div>`;
      gridDiv.appendChild(tile);
    });
    container.appendChild(gridDiv);
  } else {
    sortedCats.forEach(cat => {
      const allProds = db.products.filter(p => p.category === cat.id && fuzzyMatch(p.name, search));
      if (search && allProds.length === 0) return;
      const isCollapsed = !!db.collapsedCategories[cat.id] && !search;
      const loadedCount = loadedProductsCount[cat.id] || PRODUCTS_PER_LOAD;
      const prods = isCollapsed ? [] : allProds.slice(0, loadedCount);
      const div = document.createElement('div'); div.className = 'card cat-color-' + cat.id;
      div.innerHTML = `<div class="cat-header-row" onclick="toggleCategory('${cat.id}')"><div class="cat-header-left"><span class="cat-header-icon">${cat.icon}</span><span class="cat-header-name">${cat.name}</span><span class="cat-header-arrow" style="transition:transform 0.2s;transform:rotate(${isCollapsed ? '0deg' : '90deg'});">▶</span></div><span class="cat-header-count">${allProds.length}</span></div><div id="cat-content-${cat.id}" style="margin-top:0.625rem;display:${isCollapsed ? 'none' : 'block'};"></div>`;
      container.appendChild(div);
      if (!isCollapsed) {
        const contentDiv = div.querySelector('#cat-content-' + cat.id);
        prods.forEach(prod => {
          const best = getBestPrice(prod);
          const inCart = db.cart.some(i => i.id === prod.id);
          const selected = selectedProductIds.has(prod.id);
          const item = document.createElement('div');
          item.className = 'product-item' + (selected ? ' selected' : '');
          item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:0.625rem 0;border-top:1px solid var(--border-color);cursor:pointer;gap:0.5rem;';
          const img = document.createElement('img');
          img.src = prod.image || ''; img.className = 'prod-list-img';
          img.onerror = function () { this.style.background = 'var(--border-color)'; };
          img.addEventListener('click', function (e) { e.stopPropagation(); if (!selectionMode && prod.image) openFullscreenPhoto(prod.image); });
          const info = document.createElement('div'); info.style.cssText = 'min-width:0;flex:1;';
          info.innerHTML = `<div class="prod-list-name">${(selectionMode && selected ? '✅ ' : '') + prod.name}</div><div class="prod-list-cat">Категория: ${(activeCategories.find(c => c.id === prod.category) || {}).name || '—'}</div><div style="margin-top:0.125rem;">${best ? '<span class="prod-list-price-label">Лучшая цена: </span><span class="prod-list-store">' + best.price + ' Р · ' + best.store + '</span>' : '<span style="color:#999;font-size:0.85rem;">Цены не указаны</span>'}</div>`;
          const left = document.createElement('div'); left.style.cssText = 'display:flex;align-items:center;gap:0.625rem;flex:1;min-width:0;';
          left.appendChild(img); left.appendChild(info);
          const plusBtn = document.createElement('button');
          plusBtn.type = 'button';
          plusBtn.className = 'prod-quick-add' + (inCart ? ' in-cart' : '');
          plusBtn.innerHTML = inCart ? '✓' : '+';
          plusBtn.title = inCart ? 'Убрать из корзины' : 'В корзину';
          plusBtn.addEventListener('click', function (e) { e.stopPropagation(); if (suppressNextClick) { suppressNextClick = false; return; } toggleProductInCart(prod.id, plusBtn); });
          item.appendChild(left); item.appendChild(plusBtn);
          item.addEventListener('click', function () { handleItemTap(prod.id); });
          attachLongPress(item, prod.id);
          contentDiv.appendChild(item);
        });
      }
    });
  }
  updateToggleAllButton();
}
function saveProductFromModal() {
  const prod = db.products.find(p => p.id === currentModalProductId);
  if (!prod) return;
  const nameInput = document.getElementById('modal-prod-name');
  if (nameInput && nameInput.value.trim()) prod.name = nameInput.value.trim();
  haptic(20);
  saveDB(); closeModal();
  if (typeof showToast === 'function') showToast('💾 Сохранено');
}
function adjustProductModal() {
  const btn = document.getElementById('btn-add-to-cart');
  if (btn) { btn.innerHTML = '💾 Сохранить'; btn.onclick = function () { saveProductFromModal(); }; }
  const pencil = document.querySelector('#product-modal .edit-pencil-btn');
  if (pencil) pencil.style.marginLeft = '0.6rem';
}
const baseOpenProductModal = window.openProductModal;
window.openProductModal = function (id) { baseOpenProductModal(id); adjustProductModal(); };
const baseOpenAddProductModal = window.openAddProductModal;
window.openAddProductModal = function () {
  baseOpenAddProductModal();
  const nameInput = document.getElementById('new-name');
  const catSelect = document.getElementById('new-category');
  if (nameInput && catSelect) {
    nameInput.oninput = function () { const g = guessCategoryByName(nameInput.value); if (g) catSelect.value = g; };
  }
};
function getBestPrice(prod) {
  if (!prod || !prod.prices) return null;
  if (priceCache.best[prod.id]) return priceCache.best[prod.id];
  let prices = Object.entries(prod.prices).filter(([s, p]) => { const n = parseFloat(p); return !isNaN(n) && n > 0; });
  if (!prices.length) return null;
  let mp = Infinity, ms = null;
  prices.forEach(([st, pr]) => { const n = parseFloat(pr); if (n < mp) { mp = n; ms = st; } });
  const result = ms === null ? null : { store: ms, price: mp };
  priceCache.best[prod.id] = result;
  return result;
}
function getWorstPrice(prod) {
  if (!prod || !prod.prices) return null;
  if (priceCache.worst[prod.id]) return priceCache.worst[prod.id];
  let prices = Object.entries(prod.prices).filter(([s, p]) => { const n = parseFloat(p); return !isNaN(n) && n > 0; });
  if (prices.length < 2) return null;
  let mp = -Infinity, ms = null;
  prices.forEach(([st, pr]) => { const n = parseFloat(pr); if (n > mp) { mp = n; ms = st; } });
  const result = ms === null ? null : { store: ms, price: mp };
  priceCache.worst[prod.id] = result;
  return result;
}
function showFullPriceTooltip(wrapEl) { const input = wrapEl.querySelector('input'); if (!input) return; const full = input.dataset.fullValue || input.value; if (!full) return; let tip = wrapEl.querySelector('.price-full-tooltip'); if (!tip) { tip = document.createElement('div'); tip.className = 'price-full-tooltip'; wrapEl.appendChild(tip); } tip.textContent = full + ' Р'; wrapEl.classList.add('show-tooltip'); clearTimeout(wrapEl._hideT); wrapEl._hideT = setTimeout(() => wrapEl.classList.remove('show-tooltip'), 2200); }
function updatePrice(prodId, store, val) {
  const prod = db.products.find(p => p.id === prodId);
  if (!prod) return;
  if (!prod.prices) prod.prices = {};
  if (!prod.dates) prod.dates = {};
  if (!prod.priceHistory) prod.priceHistory = {};
  if (!prod.priceHistory[store]) prod.priceHistory[store] = [];
  const nv = parseFloat(val) || 0;
  const ov = parseFloat(prod.prices[store]) || 0;
  if (nv !== ov && nv > 0) {
    const now = new Date();
    const ds = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    prod.priceHistory[store].push({ price: nv, date: ds });
    prod.prices[store] = nv;
    prod.dates[store] = ds;
  } else if (nv === 0) {
    prod.prices[store] = 0;
    prod.dates[store] = '';
  }
  invalidatePriceCache(prodId);
  saveDB();
  const bestEl = document.getElementById('modal-prod-info-best');
  if (bestEl) {
    const best = getBestPrice(prod);
    bestEl.innerHTML = best ? 'Лучшая цена: ' + best.price + ' Р <span style="color:var(--success-color);font-weight:800;">· ' + best.store + '</span>' : 'Лучшая цена: —';
  }
}
function updateProductName() { const prod = db.products.find(p => p.id === currentModalProductId); if (!prod) return; prod.name = document.getElementById('modal-prod-name').value; saveDB(); }
function flyToCartAnimation(sourceEl) { if (!sourceEl) return; const cartTab = document.getElementById('nav-cart-btn'); if (!cartTab) return; const r = sourceEl.getBoundingClientRect(); const cr = cartTab.getBoundingClientRect(); const fly = document.createElement('div'); fly.className = 'fly-to-cart-anim'; const size = 30; fly.style.left = (r.left + r.width / 2 - size / 2) + 'px'; fly.style.top = (r.top + r.height / 2 - size / 2) + 'px'; fly.style.width = size + 'px'; fly.style.height = size + 'px'; const dx = (cr.left + cr.width / 2) - (r.left + r.width / 2); const dy = (cr.top + cr.height / 2) - (r.top + r.height / 2); document.body.appendChild(fly); fly.animate([{ transform: 'translate3d(0,0,0) scale(1)', opacity: 1 }, { transform: `translate3d(${dx * 0.5}px,${dy * 0.3 - 50}px,0) scale(0.7)`, opacity: 1, offset: 0.5 }, { transform: `translate3d(${dx}px,${dy}px,0) scale(0.2)`, opacity: 1 }], { duration: 800, easing: 'cubic-bezier(0.5,0,0.75,0)' }); setTimeout(() => fly.remove(), 850); const nav = document.getElementById('bottom-nav'); if (nav) { nav.classList.remove('nav-bounce'); void nav.offsetWidth; nav.classList.add('nav-bounce'); setTimeout(() => nav.classList.remove('nav-bounce'), 550); } setTimeout(() => { cartTab.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400 }); }, 700); }
function addToCartFromModal(event) {
  const prod = db.products.find(p => p.id === currentModalProductId);
  if (!prod) return;
  if (!db.cart.some(i => i.id === prod.id)) { db.cart.push({ id: prod.id, qty: 1, checked: false }); haptic(40); saveDB(); }
  const btn = document.getElementById('btn-add-to-cart');
  flyToCartAnimation(btn);
  setTimeout(() => { closeModal(); if (typeof renderCart === 'function') renderCart(); if (typeof renderStoresComparison === 'function') renderStoresComparison(); if (typeof showToast === 'function') showToast('✅ ' + prod.name + ' добавлен в корзину'); }, 400);
}
function deleteProductFromModal() {
  if (confirm('Удалить товар?')) {
    haptic(60);
    db.products = db.products.filter(p => p.id !== currentModalProductId);
    db.cart = db.cart.filter(i => i.id !== currentModalProductId);
    saveDB(); closeModal();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
  }
}
async function handleEditProductImage(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = async function (ev) {
    let imageData = ev.target.result;
    if (imageData.length > 300000) {
      imageData = await compressImage(imageData, 600, 0.7);
    }
    tempEditProductImage = imageData;
    const p = document.getElementById('edit-prod-preview'), ph = document.getElementById('edit-prod-placeholder');
    p.src = tempEditProductImage; p.style.display = 'block'; ph.style.display = 'none';
  };
  r.readAsDataURL(f);
}
function saveEditedProduct() {
  if (!editingProductId) return;
  const prod = db.products.find(p => p.id === editingProductId);
  if (!prod) return;
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { alert('Введите название'); return; }
  prod.name = name;
  prod.category = document.getElementById('edit-category').value;
  prod.unit = document.getElementById('edit-unit').value;
  prod.image = tempEditProductImage;
  haptic(20);
  saveDB();
  closeModalEl('edit-product-modal');
  editingProductId = null;
  tempEditProductImage = '';
  if (currentModalProductId) openProductModal(currentModalProductId);
  renderProducts();
}
function renderNewProductPricesBlock() {
  const listEl = document.getElementById('new-product-prices-list');
  const block = document.getElementById('new-product-prices-block');
  listEl.innerHTML = '';
  const storesList = getActiveStoresList();
  if (!storesList.length) { block.style.display = 'none'; return; }
  block.style.display = 'block';
  storesList.forEach((s, idx) => {
    const row = document.createElement('div');
    row.className = 'new-price-row';
    row.innerHTML = `<div class="store-color-dot" style="background-color:${s.color || '#00875a'}"></div><div class="store-name-label">${s.name}</div><input type="number" placeholder="0" step="0.01" data-store-idx="${idx}" class="new-store-price-input" style="width:5rem;margin:0;padding:0.375rem;text-align:center;font-weight:bold;"><span style="font-weight:bold;color:var(--text-color);">Р</span>`;
    listEl.appendChild(row);
  });
}
async function handleProductImage(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = async function (ev) {
    let imageData = ev.target.result;
    if (imageData.length > 300000) {
      imageData = await compressImage(imageData, 600, 0.7);
    }
    tempImage = imageData;
    const p = document.getElementById('new-prod-preview'), ph = document.getElementById('new-prod-placeholder');
    p.src = tempImage; p.style.display = 'block'; ph.style.display = 'none';
  };
  r.readAsDataURL(f);
}
function saveNewProduct() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) { alert('Введите название'); return; }
  const category = document.getElementById('new-category').value;
  const unit = document.getElementById('new-unit').value;
  const np = { id: 'p' + Date.now(), name: name, category: category, unit: unit, image: tempImage, prices: {}, dates: {}, priceHistory: {} };
  const inputs = document.querySelectorAll('.new-store-price-input');
  const storesList = getActiveStoresList();
  const now = new Date();
  const ds = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  inputs.forEach(inp => {
    const idx = parseInt(inp.dataset.storeIdx);
    const s = storesList[idx];
    if (!s) return;
    const v = parseFloat(inp.value);
    if (!isNaN(v) && v > 0) { np.prices[s.name] = v; np.dates[s.name] = ds; np.priceHistory[s.name] = [{ price: v, date: ds }]; }
  });
  db.products.push(np);
  haptic(40);
  saveDB();
  closeAddProductModal();
  renderProducts();
  if (typeof renderStoresComparison === 'function') renderStoresComparison();
  if (typeof showToast === 'function') showToast(currentProductsType === 'meds' ? `✅ Лекарство "${name}" добавлено` : `✅ Товар "${name}" добавлен`);
}
injectProductsStyles();