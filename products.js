/* =============================================================
SmartPrice — products.js
Товары и лекарства:
список, поиск, категории, мультивыбор, корзина, цены.
ИСПРАВЛЕНО: после сохранения цены списки обновляются сразу,
поэтому новая цена видна сразу после закрытия карточки товара.
ДОБАВЛЕНО: debounce для поиска (задержка 300 мс), чтобы
алгоритм Левенштейна не тормозил интерфейс при быстром вводе.
ДОБАВЛЕНО: валидация имени товара (минимум 2 символа).
============================================================= */
let selectionMode = false;
let selectedProductIds = new Set();
let suppressNextClick = false;
const PRODUCTS_PER_LOAD = 15;
const SCROLL_THRESHOLD = 200;
let loadedProductsCount = {};
let isLoadingMore = {};

/* =============================================================
Debounce для поиска (задержка 300 мс)
============================================================= */
let searchDebounceTimer = null;
function debouncedRenderProducts() {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function() {
        renderProducts();
    }, 300);
}

/* =============================================================
Подгрузка товаров
============================================================= */
function loadMoreProducts(catId) {
    if (isLoadingMore[catId]) return;
    const searchInput = document.getElementById('search-input');
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (search) return;
    isLoadingMore[catId] = true;
    const allProds = db.products.filter(function (p) {
        return p.category === catId && fuzzyMatch(p.name, search);
    });
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
    const mainContainer = document.getElementById('main-container');
    const container = document.getElementById('categories-list');
    if (!mainContainer || !container) return;
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) return;
    const scrollTop = mainContainer.scrollTop;
    const visibleHeight = mainContainer.clientHeight;
    const scrollHeight = mainContainer.scrollHeight;
    if (scrollTop + visibleHeight >= scrollHeight - SCROLL_THRESHOLD) {
        const cards = container.querySelectorAll('.card[id^="cat-card-"]');
        if (cards.length > 0) {
            const lastCard = cards[cards.length - 1];
            const catId = lastCard.id.replace('cat-card-', '');
            if (catId && !isLoadingMore[catId]) {
                loadMoreProducts(catId);
            }
        }
    }
}
function initProductsInfiniteScroll() {
    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) return;
    if (mainContainer.dataset.productsScrollAttached === '1') return;
    mainContainer.dataset.productsScrollAttached = '1';
    mainContainer.addEventListener('scroll', checkScrollPosition, { passive: true });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductsInfiniteScroll, { once: true });
} else {
    initProductsInfiniteScroll();
}

/* =============================================================
Умный поиск
============================================================= */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
function fuzzyMatch(text, query) {
    if (!query) return true;
    const lowerText = String(text || '').toLowerCase();
    const lowerQuery = String(query || '').toLowerCase();
    if (lowerText.includes(lowerQuery)) return true;
    const words = lowerText.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    for (const qw of queryWords) {
        if (qw.length < 3) continue;
        let found = false;
        for (const tw of words) {
            if (tw.length < 3) continue;
            if (levenshteinDistance(tw, qw) <= 2) {
                found = true;
                break;
            }
        }
        if (!found) return false;
    }
    return true;
}

/* =============================================================
Кэш лучших и худших цен
============================================================= */
let priceCache = { best: {}, worst: {} };
function invalidatePriceCache() {
    priceCache.best = {};
    priceCache.worst = {};
}
let priceDebounceTimers = {};
function debouncedUpdatePrice(prodId, store, val) {
    const key = prodId + '|' + store;
    if (priceDebounceTimers[key]) {
        clearTimeout(priceDebounceTimers[key]);
    }
    priceDebounceTimers[key] = setTimeout(function () {
        updatePrice(prodId, store, val);
        delete priceDebounceTimers[key];
    }, 400);
}

/* =============================================================
Стили
============================================================= */
function injectProductsStyles() {
    if (window.__productsStylesAdded) return;
    window.__productsStylesAdded = true;
}

/* =============================================================
Автоопределение категории по названию
============================================================= */
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
        for (let w = 0; w < words.length; w++) {
            if (lower.includes(words[w].replace(/ё/g, 'е'))) {
                return CATEGORY_KEYWORDS[i][0];
            }
        }
    }
    return null;
}

/* =============================================================
Мультивыделение товаров
============================================================= */
function enterSelectionMode(id) {
    selectionMode = true;
    selectedProductIds = new Set([id]);
    renderProducts();
    showSelectionBar();
}
function exitSelectionMode() {
    selectionMode = false;
    selectedProductIds.clear();
    hideSelectionBar();
    renderProducts();
}
function toggleSelected(id) {
    if (selectedProductIds.has(id)) {
        selectedProductIds.delete(id);
    } else {
        selectedProductIds.add(id);
    }
    renderProducts();
    showSelectionBar();
}
function showSelectionBar() {
    let bar = document.getElementById('product-selection-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'product-selection-bar';
        bar.innerHTML = `<span id="selection-count"></span> <button type="button" id="selection-actions-btn">⚙️ Действия</button> <button type="button" id="selection-cancel-btn">✕</button>`;
        document.querySelector('.app-wrapper').appendChild(bar);
        document.getElementById('selection-actions-btn').onclick = openSelectionActionsModal;
        document.getElementById('selection-cancel-btn').onclick = exitSelectionMode;
    }
    document.getElementById('selection-count').textContent = 'Выбрано: ' + selectedProductIds.size;
    bar.style.display = 'flex';
}
function hideSelectionBar() {
    const bar = document.getElementById('product-selection-bar');
    if (bar) bar.style.display = 'none';
}
function openSelectionActionsModal() {
    const n = selectedProductIds.size;
    if (!n) return;
    const overlay = document.createElement('div');
    overlay.className = 'sel-actions-overlay';
    overlay.innerHTML = `<div class="sel-actions-box"> <div class="sel-actions-title">Действия с выбранными (${n})</div> <button type="button" id="sel-to-cart">🛒 Отправить в корзину</button> <button type="button" id="sel-delete">🗑 Удалить из товаров</button> <button type="button" id="sel-cancel">Отмена</button> </div>`;
    document.body.appendChild(overlay);
    const close = function () { overlay.remove(); };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('#sel-cancel').onclick = close;
    overlay.querySelector('#sel-to-cart').onclick = function () { close(); sendSelectedToCart(); };
    overlay.querySelector('#sel-delete').onclick = function () { close(); deleteSelectedProducts(); };
}
function sendSelectedToCart() {
    let added = 0;
    selectedProductIds.forEach(function (id) {
        if (!db.cart.some(function (i) { return i.id === id; })) {
            db.cart.push({ id: id, qty: 1, checked: false });
            added++;
        }
    });
    saveDB();
    exitSelectionMode();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof showToast === 'function') showToast('В корзину: ' + added);
}
function showSelConfirm(message, onOk) {
    const overlay = document.createElement('div');
    overlay.className = 'sel-actions-overlay';
    overlay.innerHTML = `<div class="sel-actions-box"> <div class="sel-actions-title">${escapeHtml(message)}</div> <button type="button" id="sel-ok" style="background:var(--danger-color);color:#fff;">Да, удалить</button> <button type="button" id="sel-no" style="background:var(--border-color);color:var(--text-color);">Отмена</button> </div>`;
    document.body.appendChild(overlay);
    const close = function () { overlay.remove(); };
    overlay.querySelector('#sel-no').onclick = close;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('#sel-ok').onclick = function () { close(); onOk(); };
}
function deleteSelectedProducts() {
    const n = selectedProductIds.size;
    showSelConfirm('Удалить ' + n + ' товаров безвозвратно?', function () {
        db.products = db.products.filter(function (p) { return !selectedProductIds.has(p.id); });
        db.cart = db.cart.filter(function (i) { return !selectedProductIds.has(i.id); });
        saveDB();
        exitSelectionMode();
        renderProducts();
        if (typeof renderCart === 'function') renderCart();
        if (typeof renderStoresComparison === 'function') renderStoresComparison();
        if (typeof updateCartBadge === 'function') updateCartBadge();
        if (typeof showToast === 'function') showToast('🗑 Удалено: ' + n);
    });
}

/* =============================================================
Долгое нажатие и тап по товару
============================================================= */
function attachLongPress(item, id) {
    let timer = null, sx = 0, sy = 0;
    item.addEventListener('pointerdown', function (e) {
        if (selectionMode) return;
        sx = e.clientX; sy = e.clientY;
        timer = setTimeout(function () {
            timer = null;
            suppressNextClick = true;
            enterSelectionMode(id);
            haptic(40);
        }, 500);
    });
    item.addEventListener('pointermove', function (e) {
        if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) {
            clearTimeout(timer); timer = null;
        }
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
        item.addEventListener(ev, function () { if (timer) { clearTimeout(timer); timer = null; } });
    });
    item.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}
function handleItemTap(id) {
    if (suppressNextClick) { suppressNextClick = false; return; }
    if (selectionMode) { toggleSelected(id); } else { openProductModal(id); }
}
function toggleProductInCart(id, btn) {
    const idx = db.cart.findIndex(function (i) { return i.id === id; });
    if (idx >= 0) {
        db.cart.splice(idx, 1);
        if (typeof showToast === 'function') showToast('Убрано из корзины');
    } else {
        db.cart.push({ id: id, qty: 1, checked: false });
        flyToCartAnimation(btn);
        if (typeof showToast === 'function') showToast('✅ В корзину');
    }
    haptic(40); saveDB(); renderProducts();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
    if (typeof updateCartBadge === 'function') updateCartBadge();
}

/* =============================================================
Переключение товары/лекарства
============================================================= */
function switchProductsType(type) {
    currentProductsType = type;
    const b1 = document.getElementById('btn-products-type');
    const b2 = document.getElementById('btn-meds-type');
    const t = document.getElementById('products-page-title');
    if (b1) b1.classList.toggle('active', type === 'products');
    if (b2) b2.classList.toggle('active', type === 'meds');
    if (t) t.textContent = type === 'products' ? 'Товары' : 'Лекарства';
    renderProducts();
}
function toggleCategory(catId) {
    db.collapsedCategories[catId] = !db.collapsedCategories[catId];
    saveDB(); resetLoadedProducts(catId); renderProducts();
}

/* =============================================================
Рендер товаров
============================================================= */
function renderProducts() {
    injectProductsStyles();
    const container = document.getElementById('categories-list');
    if (!container) return;
    const searchInput = document.getElementById('search-input');
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    container.innerHTML = '';
    const activeCategories = getActiveCategories();
    const sortedCats = activeCategories.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    const isGridView = (db.settings.categoryViewMode === 'grid' && !search);
    
    if (isGridView) {
        const gridDiv = document.createElement('div');
        gridDiv.className = 'categories-grid-view';
        sortedCats.forEach(function (cat) {
            const prods = db.products.filter(function (p) { return p.category === cat.id; });
            const tile = document.createElement('div');
            tile.className = 'category-tile cat-color-' + cat.id;
            tile.onclick = function () { openCategoryModal(cat.id); };
            tile.innerHTML = `<div class="tile-icon">${cat.icon}</div><div class="tile-name-row"><span class="tile-name">${escapeHtml(cat.name)}</span><span class="tile-count">${prods.length}</span></div>`;
            gridDiv.appendChild(tile);
        });
        container.appendChild(gridDiv);
    } else {
        sortedCats.forEach(function (cat) {
            const allProds = db.products.filter(function (p) { return p.category === cat.id && fuzzyMatch(p.name, search); });
            if (search && allProds.length === 0) return;
            const isCollapsed = !!db.collapsedCategories[cat.id] && !search;
            const loadedCount = loadedProductsCount[cat.id] || PRODUCTS_PER_LOAD;
            const prods = isCollapsed ? [] : (search ? allProds : allProds.slice(0, loadedCount));
            const div = document.createElement('div');
            div.className = 'card cat-color-' + cat.id;
            div.id = 'cat-card-' + cat.id;
            div.innerHTML = `<div class="cat-header-row" onclick="toggleCategory('${cat.id}')"><div class="cat-header-left"><span class="cat-header-icon">${cat.icon}</span><span class="cat-header-name">${escapeHtml(cat.name)}</span><span class="cat-header-arrow" style="transition:transform 0.2s;transform:rotate(${isCollapsed ? '0deg' : '90deg'});">▶</span></div><span class="cat-header-count">${allProds.length}</span></div><div id="cat-content-${cat.id}" style="margin-top:0.625rem;display:${isCollapsed ? 'none' : 'block'};"></div>`;
            container.appendChild(div);
            if (!isCollapsed) {
                const contentDiv = div.querySelector('#cat-content-' + cat.id);
                prods.forEach(function (prod) {
                    const best = getBestPrice(prod);
                    const inCart = db.cart.some(function (i) { return i.id === prod.id; });
                    const selected = selectedProductIds.has(prod.id);
                    const item = document.createElement('div');
                    item.className = 'product-item' + (selected ? ' selected' : '');
                    item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:0.625rem 0;border-top:1px solid var(--border-color);cursor:pointer;gap:0.5rem;';
                    const img = document.createElement('img');
                    img.src = prod.image || '';
                    img.className = 'prod-list-img';
                    img.onerror = function () { this.style.background = 'var(--border-color)'; };
                    img.addEventListener('click', function (e) { e.stopPropagation(); if (!selectionMode && prod.image) openFullscreenPhoto(prod.image); });
                    const info = document.createElement('div');
                    info.style.cssText = 'min-width:0;flex:1;';
                    const displayName = escapeHtml(prod.name);
                    const categoryObject = activeCategories.find(function (c) { return c.id === prod.category; }) || {};
                    const categoryName = escapeHtml(categoryObject.name || '—');
                    let priceHtml = best ? `<span class="prod-list-price-label">Лучшая цена: </span><span class="prod-list-store">${best.price} Р · ${escapeHtml(best.store)}</span>` : `<span style="color:#999;font-size:0.85rem;">Цены не указаны</span>`;
                    info.innerHTML = `<div class="prod-list-name">${(selectionMode && selected ? '✅ ' : '') + displayName}</div><div class="prod-list-cat">Категория: ${categoryName}</div><div style="margin-top:0.125rem;">${priceHtml}</div>`;
                    const left = document.createElement('div');
                    left.style.cssText = 'display:flex;align-items:center;gap:0.625rem;flex:1;min-width:0;';
                    left.appendChild(img); left.appendChild(info);
                    const plusBtn = document.createElement('button');
                    plusBtn.type = 'button';
                    plusBtn.className = 'prod-quick-add' + (inCart ? ' in-cart' : '');
                    plusBtn.innerHTML = inCart ? '✓' : '+';
                    plusBtn.title = inCart ? 'Убрать из корзины' : 'В корзину';
                    plusBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (suppressNextClick) { suppressNextClick = false; return; }
                        toggleProductInCart(prod.id, plusBtn);
                    });
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

/* =============================================================
Карточка товара
============================================================= */
function saveProductFromModal() {
    const prod = db.products.find(function (p) { return p.id === currentModalProductId; });
    if (!prod) return;
    const nameInput = document.getElementById('modal-prod-name');
    if (nameInput && nameInput.value.trim()) { prod.name = nameInput.value.trim(); }
    haptic(20); saveDB(); closeModal();
    if (typeof showToast === 'function') showToast('💾 Сохранено');
}
function adjustProductModal() {
    const btn = document.getElementById('btn-add-to-cart');
    if (btn) { btn.innerHTML = '💾 Сохранить'; btn.onclick = function () { saveProductFromModal(); }; }
    const pencil = document.querySelector('#product-modal .edit-pencil-btn');
    if (pencil) pencil.style.marginLeft = '0.6rem';
}
const baseOpenProductModal = window.openProductModal;
window.openProductModal = function (id) {
    if (typeof baseOpenProductModal === 'function') baseOpenProductModal(id);
    adjustProductModal();
};
const baseOpenAddProductModal = window.openAddProductModal;
window.openAddProductModal = function () {
    if (typeof baseOpenAddProductModal === 'function') baseOpenAddProductModal();
    const nameInput = document.getElementById('new-name');
    const catSelect = document.getElementById('new-category');
    if (nameInput && catSelect) {
        nameInput.oninput = function () {
            const guessed = guessCategoryByName(nameInput.value);
            if (guessed) catSelect.value = guessed;
        };
    }
};

/* =============================================================
Правильная лучшая и худшая цена
============================================================= */
function getAllowedStoreNames(prod) {
    if (!prod || typeof getStoresForProduct !== 'function') return null;
    const list = getStoresForProduct(prod) || [];
    const map = {};
    list.forEach(function (storeObject) { if (storeObject && storeObject.name) map[storeObject.name] = true; });
    return map;
}
function getPriceCacheKey(prod) {
    const allowed = getAllowedStoreNames(prod);
    return allowed ? String(prod.id) + '|' + Object.keys(allowed).sort().join(',') : String(prod.id);
}
function getBestPrice(prod) {
    if (!prod || !prod.prices) return null;
    const cacheKey = getPriceCacheKey(prod);
    if (Object.prototype.hasOwnProperty.call(priceCache.best, cacheKey)) return priceCache.best[cacheKey];
    const allowed = getAllowedStoreNames(prod);
    let bestPrice = Infinity, bestStore = null;
    Object.keys(prod.prices).forEach(function (storeName) {
        if (allowed && !allowed[storeName]) return;
        const priceNumber = parseFloat(prod.prices[storeName]);
        if (!isNaN(priceNumber) && priceNumber > 0 && priceNumber < bestPrice) { bestPrice = priceNumber; bestStore = storeName; }
    });
    const result = bestStore === null ? null : { store: bestStore, price: bestPrice };
    priceCache.best[cacheKey] = result;
    return result;
}
function getWorstPrice(prod) {
    if (!prod || !prod.prices) return null;
    const cacheKey = getPriceCacheKey(prod);
    if (Object.prototype.hasOwnProperty.call(priceCache.worst, cacheKey)) return priceCache.worst[cacheKey];
    const allowed = getAllowedStoreNames(prod);
    let validCount = 0, worstPrice = -Infinity, worstStore = null;
    Object.keys(prod.prices).forEach(function (storeName) {
        if (allowed && !allowed[storeName]) return;
        const priceNumber = parseFloat(prod.prices[storeName]);
        if (!isNaN(priceNumber) && priceNumber > 0) {
            validCount++;
            if (priceNumber > worstPrice) { worstPrice = priceNumber; worstStore = storeName; }
        }
    });
    const result = (validCount >= 2 && worstStore !== null) ? { store: worstStore, price: worstPrice } : null;
    priceCache.worst[cacheKey] = result;
    return result;
}

/* =============================================================
Цены
============================================================= */
function showFullPriceTooltip(wrapEl) {
    const input = wrapEl.querySelector('input');
    if (!input) return;
    const full = input.dataset.fullValue || input.value;
    if (!full) return;
    let tip = wrapEl.querySelector('.price-full-tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'price-full-tooltip'; wrapEl.appendChild(tip); }
    tip.textContent = full + ' Р';
    wrapEl.classList.add('show-tooltip');
    clearTimeout(wrapEl._hideT);
    wrapEl._hideT = setTimeout(function () { wrapEl.classList.remove('show-tooltip'); }, 2200);
}
function updatePrice(prodId, store, val) {
    const prod = db.products.find(function (p) { return p.id === prodId; });
    if (!prod) return;
    if (!prod.prices) prod.prices = {};
    if (!prod.dates) prod.dates = {};
    if (!prod.priceHistory) prod.priceHistory = {};
    if (!prod.priceHistory[store]) prod.priceHistory[store] = [];
    const newValue = parseFloat(val) || 0;
    const oldValue = parseFloat(prod.prices[store]) || 0;
    if (newValue !== oldValue && newValue > 0) {
        const now = new Date();
        const displayDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        prod.priceHistory[store].push({ price: newValue, date: displayDate, iso: now.toISOString() });
        prod.prices[store] = newValue;
        prod.dates[store] = displayDate;
    } else if (newValue === 0) {
        prod.prices[store] = 0;
        prod.dates[store] = '';
    }
    invalidatePriceCache();
    saveDB();
    const bestEl = document.getElementById('modal-prod-info-best');
    if (bestEl) {
        const best = getBestPrice(prod);
        bestEl.innerHTML = best ? 'Лучшая цена: ' + best.price + ' Р <span style="color:var(--success-color);font-weight:800;">· ' + escapeHtml(best.store) + '</span>' : 'Лучшая цена: —';
    }
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
}
function updateProductName() {
    const prod = db.products.find(function (p) { return p.id === currentModalProductId; });
    if (!prod) return;
    prod.name = document.getElementById('modal-prod-name').value;
    saveDB();
}

/* =============================================================
Анимация в корзину
============================================================= */
function flyToCartAnimation(sourceEl) {
    if (!sourceEl) return;
    const cartTab = document.getElementById('nav-cart-btn');
    if (!cartTab) return;
    const r = sourceEl.getBoundingClientRect();
    const cr = cartTab.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly-to-cart-anim';
    const size = 30;
    fly.style.left = (r.left + r.width / 2 - size / 2) + 'px';
    fly.style.top = (r.top + r.height / 2 - size / 2) + 'px';
    fly.style.width = size + 'px';
    fly.style.height = size + 'px';
    const dx = (cr.left + cr.width / 2) - (r.left + r.width / 2);
    const dy = (cr.top + cr.height / 2) - (r.top + r.height / 2);
    document.body.appendChild(fly);
    fly.animate([
        { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
        { transform: `translate3d(${dx * 0.5}px,${dy * 0.3 - 50}px,0) scale(0.7)`, opacity: 1, offset: 0.5 },
        { transform: `translate3d(${dx}px,${dy}px,0) scale(0.2)`, opacity: 1 }
    ], { duration: 800, easing: 'cubic-bezier(0.5,0,0.75,0)' });
    setTimeout(function () { fly.remove(); }, 850);
    const nav = document.getElementById('bottom-nav');
    if (nav) {
        nav.classList.remove('nav-bounce');
        void nav.offsetWidth;
        nav.classList.add('nav-bounce');
        setTimeout(function () { nav.classList.remove('nav-bounce'); }, 550);
    }
    setTimeout(function () {
        cartTab.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400 });
    }, 700);
}
function addToCartFromModal(event) {
    const prod = db.products.find(function (p) { return p.id === currentModalProductId; });
    if (!prod) return;
    if (!db.cart.some(function (i) { return i.id === prod.id; })) {
        db.cart.push({ id: prod.id, qty: 1, checked: false });
        haptic(40); saveDB();
    }
    const btn = document.getElementById('btn-add-to-cart');
    flyToCartAnimation(btn);
    setTimeout(function () {
        closeModal();
        if (typeof renderCart === 'function') renderCart();
        if (typeof renderStoresComparison === 'function') renderStoresComparison();
        if (typeof showToast === 'function') showToast('✅ ' + prod.name + ' добавлен в корзину');
    }, 400);
}
function deleteProductFromModal() {
    const doDelete = function () {
        haptic(60);
        db.products = db.products.filter(function (p) { return p.id !== currentModalProductId; });
        db.cart = db.cart.filter(function (i) { return i.id !== currentModalProductId; });
        invalidatePriceCache(); saveDB(); closeModal();
        if (typeof renderStoresComparison === 'function') renderStoresComparison();
    };
    if (typeof appConfirm === 'function') {
        appConfirm('Удалить товар?', { title: 'Удаление товара', confirmText: 'Удалить', cancelText: 'Отмена', danger: true }).then(function (ok) { if (ok) doDelete(); });
    } else if (confirm('Удалить товар?')) {
        doDelete();
    }
}

/* =============================================================
Редактирование товара
============================================================= */
async function handleEditProductImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (ev) {
        let imageData = ev.target.result;
        if (imageData.length > 300000) imageData = await compressImage(imageData, 600, 0.7);
        tempEditProductImage = imageData;
        const preview = document.getElementById('edit-prod-preview');
        const placeholder = document.getElementById('edit-prod-placeholder');
        if (preview) { preview.src = tempEditProductImage; preview.style.display = 'block'; }
        if (placeholder) { placeholder.style.display = 'none'; }
    };
    reader.readAsDataURL(file);
}
function saveEditedProduct() {
    if (!editingProductId) return;
    const prod = db.products.find(function (p) { return p.id === editingProductId; });
    if (!prod) return;
    const name = document.getElementById('edit-name').value.trim();
    // ИСПРАВЛЕНО: валидация минимальной длины имени (минимум 2 символа)
    if (!name || name.length < 2) {
        if (typeof appAlert === 'function') {
            appAlert('Название товара должно содержать минимум 2 символа.', { title: 'Редактирование товара' });
        } else {
            alert('Название слишком короткое (минимум 2 символа)');
        }
        return;
    }
    prod.name = name;
    prod.category = document.getElementById('edit-category').value;
    prod.unit = document.getElementById('edit-unit').value;
    prod.image = tempEditProductImage;
    haptic(20); saveDB();
    forceCloseModal('edit-product-modal');
    editingProductId = null;
    tempEditProductImage = '';
    if (currentModalProductId) openProductModal(currentModalProductId);
    renderProducts();
}

/* =============================================================
Добавление товара
============================================================= */
function renderNewProductPricesBlock() {
    const listEl = document.getElementById('new-product-prices-list');
    const block = document.getElementById('new-product-prices-block');
    if (!listEl || !block) return;
    listEl.innerHTML = '';
    const storesList = getActiveStoresList();
    if (!storesList.length) { block.style.display = 'none'; return; }
    block.style.display = 'block';
    storesList.forEach(function (storeObject, idx) {
        const row = document.createElement('div');
        row.className = 'new-price-row';
        row.innerHTML = `<div class="store-color-dot" style="background-color:${escapeHtml(storeObject.color || '#00875a')}"></div><div class="store-name-label">${escapeHtml(storeObject.name)}</div><input type="number" placeholder="0" step="0.01" data-store-idx="${idx}" class="new-store-price-input" style="width:5rem;margin:0;padding:0.375rem;text-align:center;font-weight:bold;"><span style="font-weight:bold;color:var(--text-color);">Р</span>`;
        listEl.appendChild(row);
    });
}
async function handleProductImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (ev) {
        let imageData = ev.target.result;
        if (imageData.length > 300000) imageData = await compressImage(imageData, 600, 0.7);
        tempImage = imageData;
        const preview = document.getElementById('new-prod-preview');
        const placeholder = document.getElementById('new-prod-placeholder');
        if (preview) { preview.src = tempImage; preview.style.display = 'block'; }
        if (placeholder) { placeholder.style.display = 'none'; }
    };
    reader.readAsDataURL(file);
}
function generateProductId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function saveNewProduct() {
    const name = document.getElementById('new-name').value.trim();
    // ИСПРАВЛЕНО: валидация минимальной длины имени (минимум 2 символа)
    if (!name || name.length < 2) {
        if (typeof appAlert === 'function') {
            appAlert('Название товара должно содержать минимум 2 символа.', { title: 'Новый товар' });
        } else {
            alert('Название слишком короткое (минимум 2 символа)');
        }
        return;
    }
    const category = document.getElementById('new-category').value;
    const unit = document.getElementById('new-unit').value;
    const newProduct = {
        id: generateProductId(), name: name, category: category, unit: unit, image: tempImage,
        prices: {}, dates: {}, priceHistory: {}
    };
    const inputs = document.querySelectorAll('.new-store-price-input');
    const storesList = getActiveStoresList();
    const now = new Date();
    const displayDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isoDate = now.toISOString();
    inputs.forEach(function (inp) {
        const idx = parseInt(inp.dataset.storeIdx, 10);
        const storeObject = storesList[idx];
        if (!storeObject) return;
        const value = parseFloat(inp.value);
        if (!isNaN(value) && value > 0) {
            newProduct.prices[storeObject.name] = value;
            newProduct.dates[storeObject.name] = displayDate;
            newProduct.priceHistory[storeObject.name] = [{ price: value, date: displayDate, iso: isoDate }];
        }
    });
    db.products.push(newProduct);
    invalidatePriceCache(); haptic(40); saveDB();
    forceCloseModal('add-product-modal'); renderProducts();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
    if (typeof showToast === 'function') {
        showToast(currentProductsType === 'meds' ? `✅ Лекарство "${name}" добавлено` : `✅ Товар "${name}" добавлен`);
    }
}
injectProductsStyles();