let cartViewType = 'products';
let pricesViewType = 'products';
try { localStorage.removeItem('stores_comparison_collapsed'); } catch (e) {}
const round2 = x => Math.round(x * 100) / 100;
let shoppingModeActive = false;
let shoppingSearchQuery = '';
let shoppingFilterUnpurchasedOnly = false;

function toggleShoppingMode() {
    shoppingModeActive = !shoppingModeActive;
    if (shoppingModeActive) { saveShoppingModeState(); renderShoppingMode(); }
    else { closeShoppingMode(); }
}
function saveShoppingModeState() {
    try { localStorage.setItem('shopping_mode_state', JSON.stringify(db.cart.map(i => ({ id: i.id, checked: i.checked, qty: i.qty })))); } catch (e) {}
}
function restoreShoppingModeState() {
    try {
        const saved = localStorage.getItem('shopping_mode_state');
        if (!saved) return;
        const state = JSON.parse(saved);
        state.forEach(s => {
            const item = db.cart.find(i => i.id === s.id);
            if (item) { item.checked = s.checked; item.qty = s.qty; }
        });
    } catch (e) {}
}
function resetShoppingCheckmarks() {
    db.cart.forEach(i => i.checked = false);
    saveDB(); renderShoppingMode(); haptic(40);
}
function finishShopping() {
    showCartConfirm('Очистить корзину? Это действие нельзя отменить.', function () {
        db.cart = [];
        saveDB();
        shoppingModeActive = false;
        const overlay = document.getElementById('shopping-mode-overlay');
        if (overlay) overlay.remove();
        renderCartItems(); updateCartBadge();
        if (typeof showToast === 'function') showToast('🗑 Корзина очищена');
        haptic(60);
    }, 'Очистить');
}
function closeShoppingMode() {
    shoppingModeActive = false;
    shoppingSearchQuery = '';
    shoppingFilterUnpurchasedOnly = false;
    const overlay = document.getElementById('shopping-mode-overlay');
    if (overlay) overlay.remove();
    renderCartItems();
}
function getShoppingModeEntries() {
    let entries = db.cart.map((item, index) => ({ item, index, prod: db.products.find(p => p.id === item.id) }))
        .filter(e => e.prod && isProductOfType(e.prod, cartViewType));
    if (shoppingSearchQuery) {
        const q = shoppingSearchQuery.toLowerCase();
        entries = entries.filter(e => fuzzyMatch(e.prod.name, q));
    }
    const allCategories = categories.concat(medCategories);
    entries.sort((a, b) => {
        const catOrder = allCategories.map(c => c.id);
        const idxA = catOrder.indexOf(a.prod.category);
        const idxB = catOrder.indexOf(b.prod.category);
        if (idxA !== idxB) return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        return a.prod.name.localeCompare(b.prod.name, 'ru');
    });
    entries.sort((a, b) => {
        if (a.item.checked && !b.item.checked) return 1;
        if (!a.item.checked && b.item.checked) return -1;
        return 0;
    });
    if (shoppingFilterUnpurchasedOnly) {
        entries = entries.filter(e => !e.item.checked);
    }
    return entries;
}
function renderShoppingMode() {
    let overlay = document.getElementById('shopping-mode-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'shopping-mode-overlay';
        overlay.className = 'shopping-mode-overlay';
        document.querySelector('.app-wrapper').appendChild(overlay);
        overlay.innerHTML = `<div class="shopping-content-wrapper"> <div class="shopping-top-bar"> <button class="shopping-back-btn" onclick="closeShoppingMode()">← Назад к корзине</button> <label class="shopping-filter-label"> <input type="checkbox" id="shopping-filter-checkbox" onchange="shoppingFilterUnpurchasedOnly = this.checked; updateShoppingList();"> Только некупленные </label> </div> <div class="shopping-progress-wrap"> <div class="shopping-progress-header"> <span class="shopping-progress-title" id="shopping-progress-title">Куплено 0 из 0</span> <span class="shopping-progress-percent" id="shopping-progress-percent">0%</span> </div> <div class="shopping-progress-bar"> <div class="shopping-progress-bar-fill" id="shopping-progress-bar-fill" style="width: 0%;"></div> </div> </div> <div class="shopping-category-stats" id="shopping-category-stats"></div> <div class="shopping-search-wrap"> <input type="text" id="shopping-search-input" placeholder="Поиск по списку..." oninput="shoppingSearchQuery = this.value; updateShoppingList();"> <button class="voice-search-btn" data-target="shopping-search-input" title="Голосовой поиск"> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> </button> </div> <div class="shopping-hint">свайп влево: убрать | свайп вправо: купил</div> <div class="shopping-list" id="shopping-list"></div> </div> <div class="shopping-bottom-actions"> <button class="btn-reset" onclick="resetShoppingCheckmarks()">🔄 Сбросить галочки</button> <button class="btn-finish" onclick="finishShopping()">🗑 Завершить</button> </div>`;
    }
    updateShoppingModeData();
}
function updateShoppingModeData() {
    const entries = getShoppingModeEntries();
    const totalCount = db.cart.filter(i => isProductOfType(db.products.find(p => p.id === i.id), cartViewType)).length;
    const purchasedCount = db.cart.filter(i => i.checked && isProductOfType(db.products.find(p => p.id === i.id), cartViewType)).length;
    const progressPercent = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;
    const titleEl = document.getElementById('shopping-progress-title');
    const percentEl = document.getElementById('shopping-progress-percent');
    const barFillEl = document.getElementById('shopping-progress-bar-fill');
    if (titleEl) titleEl.textContent = `Куплено ${purchasedCount} из ${totalCount}`;
    if (percentEl) percentEl.textContent = `${progressPercent}%`;
    if (barFillEl) barFillEl.style.width = `${progressPercent}%`;
    const filterCheckbox = document.getElementById('shopping-filter-checkbox');
    if (filterCheckbox) filterCheckbox.checked = shoppingFilterUnpurchasedOnly;
    const allCategories = categories.concat(medCategories);
    const categoryStats = {};
    db.cart.forEach(i => {
        const prod = db.products.find(p => p.id === i.id);
        if (!prod || !isProductOfType(prod, cartViewType)) return;
        const cat = allCategories.find(c => c.id === prod.category);
        const catName = cat ? cat.name : 'Другое';
        if (!categoryStats[catName]) categoryStats[catName] = { total: 0, purchased: 0 };
        categoryStats[catName].total++;
        if (i.checked) categoryStats[catName].purchased++;
    });
    const statsContainer = document.getElementById('shopping-category-stats');
    if (statsContainer) {
        statsContainer.innerHTML = Object.entries(categoryStats).map(([name, stats]) => {
            const isLong = name.length > 18;
            const cls = isLong ? 'shopping-cat-stat-long' : 'shopping-cat-stat';
            const pct = stats.total > 0 ? Math.round((stats.purchased / stats.total) * 100) : 0;
            return `<div class="${cls}"><div class="shopping-cat-stat-header"><span>${escapeHtml(name)}</span><span style="color: #777;">${stats.purchased}/${stats.total}</span></div><div class="shopping-cat-stat-bar"><div class="shopping-cat-stat-bar-fill" style="width: ${pct}%;"></div></div></div>`;
        }).join('');
    }
    updateShoppingList();
}
function updateShoppingList() {
    const entries = getShoppingModeEntries();
    const allCategories = categories.concat(medCategories);
    const listContainer = document.getElementById('shopping-list');
    if (!listContainer) return;
    if (entries.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #777;">Нет товаров</div>';
        return;
    }
    listContainer.innerHTML = entries.map(e => {
        const cat = allCategories.find(c => c.id === e.prod.category);
        const catIcon = cat ? cat.icon : '📦';
        return `<div class="shopping-card ${e.item.checked ? 'purchased' : ''}" data-index="${e.index}">
            <div class="shopping-card-icon">${catIcon}</div>
            <div class="shopping-card-info">
                <div class="shopping-card-name">${escapeHtml(e.prod.name)}</div>
                <div class="shopping-card-qty">
                    <button class="shopping-qty-btn" onclick="changeQty(${e.index}, -1)">−</button>
                    <span class="shopping-qty-value">${e.item.qty}</span>
                    <button class="shopping-qty-btn" onclick="changeQty(${e.index}, 1)">+</button>
                </div>
            </div>
            <button class="shopping-check-btn ${e.item.checked ? 'checked' : ''}" onclick="toggleCartCheck(${e.index})">
                ${e.item.checked ? '✓' : ''}
            </button>
        </div>`;
    }).join('');
    setTimeout(() => {
        document.querySelectorAll('.shopping-card').forEach(card => {
            let startX = 0, currentX = 0, isSwiping = false, moved = false;
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                currentX = startX;
                isSwiping = true;
                moved = false;
            });
            card.addEventListener('touchmove', (e) => {
                if (!isSwiping) return;
                currentX = e.touches[0].clientX;
                const diff = currentX - startX;
                if (Math.abs(diff) > 10) moved = true;
                card.style.transform = `translateX(${diff}px)`;
            });
            card.addEventListener('touchend', () => {
                if (!isSwiping) return;
                isSwiping = false;
                const diff = currentX - startX;
                const threshold = 80;
                if (moved && diff > threshold) {
                    const index = parseInt(card.dataset.index);
                    if (!db.cart[index].checked) {
                        db.cart[index].checked = true;
                        haptic(40); saveDB(); updateShoppingModeData();
                    }
                } else if (moved && diff < -threshold) {
                    const index = parseInt(card.dataset.index);
                    db.cart.splice(index, 1);
                    haptic(60); saveDB(); updateShoppingModeData(); updateCartBadge();
                } else {
                    card.style.transform = '';
                }
            });
        });
    }, 50);
}
function isProductOfType(prod, type) { if (type === 'meds') return isMedProduct(prod); return !isMedProduct(prod); }
function getComparisonStores() { return pricesViewType === 'meds' ? db.pharmacies : db.stores; }
function injectCartStyles() {
    if (window.__cartStylesAdded) return;
    window.__cartStylesAdded = true;
}

// ИСПРАВЛЕНО: вместо хардкодного списка "мусорных" слов, функция теперь один раз 
// удаляет любые товары с именем короче 2 символов (защита от случайных нажатий).
function cleanupGarbageProducts() {
    if (window.__garbageCleaned) return;
    window.__garbageCleaned = true;
    let changed = false;
    const idsToRemove = new Set();
    
    db.products = db.products.filter(p => {
        const n = String(p.name || '').trim();
        if (n.length < 2) {
            idsToRemove.add(p.id);
            changed = true;
            return false;
        }
        return true;
    });
    
    if (changed) {
        db.cart = db.cart.filter(i => !idsToRemove.has(i.id));
        if (typeof invalidatePriceCache === 'function') invalidatePriceCache();
        saveDB();
    }
}

function showCartConfirm(message, onOk, okText) {
    injectCartStyles();
    const overlay = document.createElement('div'); overlay.className = 'cart-confirm-overlay';
    overlay.innerHTML = `<div class="cart-confirm-box"><div class="cart-confirm-title">${escapeHtml(message)}</div><button type="button" id="cc-ok" style="background:var(--danger-color);color:#fff;">${okText || 'Подтвердить'}</button><button type="button" id="cc-no" style="background:var(--border-color);color:var(--text-color);">Отмена</button></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#cc-no').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#cc-ok').onclick = function () { close(); onOk(); };
}
function getPurchaseHistory() { if (!Array.isArray(db.purchaseHistory)) db.purchaseHistory = []; return db.purchaseHistory; }
function openPurchaseHistoryModal() {
    injectCartStyles();
    const history = getPurchaseHistory();
    const overlay = document.createElement('div'); overlay.className = 'cart-confirm-overlay';
    const box = document.createElement('div'); box.className = 'cart-confirm-box';
    let html = `<div class="cart-confirm-title">📜 История покупок</div>`;
    if (!history.length) html += `<div style="text-align:center;color:#777;padding:1rem;">История пока пуста</div>`;
    else {
        history.slice().reverse().forEach(h => {
            const items = h.items.map(i => `<div class="history-item"><span>${escapeHtml(i.name)} ×${i.qty}</span><span>${i.sum} Р</span></div>`).join('');
            html += `<details class="history-entry"><summary>${escapeHtml(h.dateHuman)} · ${h.count} тов. · ${h.total} Р</summary><div class="history-items">${items}</div></details>`;
        });
        html += `<button type="button" id="history-clear" style="background:var(--border-color);color:var(--text-color);">Очистить историю</button>`;
    }
    html += `<button type="button" id="history-close" style="background:var(--primary-color);color:#fff;">Закрыть</button>`;
    box.innerHTML = html; overlay.appendChild(box); document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#history-close').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const clr = overlay.querySelector('#history-clear');
    if (clr) clr.onclick = function () { showCartConfirm('Очистить всю историю покупок?', function () { db.purchaseHistory = []; saveDB(); close(); openPurchaseHistoryModal(); }, 'Очистить'); };
}
function completeShoppingTrip() {
    const entries = db.cart.map(item => ({ item, prod: db.products.find(p => p.id === item.id) })).filter(e => e.prod && isProductOfType(e.prod, cartViewType));
    if (!entries.length) { if (typeof showToast === 'function') showToast('Корзина пуста'); return; }
    showCartConfirm('Завершить поход? Сохранится в историю, корзина очистится.', function () {
        const items = entries.map(e => { const best = getBestPrice(e.prod); const price = best ? best.price : 0; return { name: e.prod.name, qty: e.item.qty, price: price, sum: round2(price * e.item.qty) }; });
        const total = round2(items.reduce((s, i) => s + i.sum, 0));
        const now = new Date();
        getPurchaseHistory().push({ id: 'h_' + Date.now(), dateISO: now.toISOString(), dateHuman: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), count: items.length, total: total, items: items });
        const ids = new Set(entries.map(e => e.prod.id));
        db.cart = db.cart.filter(item => !ids.has(item.id));
        haptic(40); saveDB(); renderCart(); renderStoresComparison(); updateCartBadge();
        if (typeof showToast === 'function') showToast('🏁 Поход сохранён в историю');
    }, '🏁 Завершить');
}
function injectPricesTypeToggle() {
    const header = document.querySelector('.prices-sticky-header');
    if (!header) return;
    if (header.querySelector('.prices-type-toggle')) return;
    const toggle = document.createElement('div');
    toggle.className = 'prices-type-toggle cart-type-toggle';
    toggle.innerHTML = `<button type="button" class="cart-type-btn prices-type-btn" data-pt="products"><span class="btn-icon">🛒</span><span>Товары</span></button><button type="button" class="cart-type-btn prices-type-btn" data-pt="meds"><span class="btn-icon">💊</span><span>Лекарства</span></button>`;
    const title = header.querySelector('.prices-page-title') || header.querySelector('h2');
    if (title) title.insertAdjacentElement('afterend', toggle); else header.prepend(toggle);
    toggle.querySelectorAll('.prices-type-btn').forEach(btn => { btn.onclick = function () { pricesViewType = btn.dataset.pt; renderStoresComparison(); }; });
    updatePricesTypeToggle();
}
function updatePricesTypeToggle() { document.querySelectorAll('.prices-type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.pt === pricesViewType)); }
function switchCartViewType(type) {
    cartViewType = type;
    const btnProducts = document.getElementById('btn-cart-products');
    const btnMeds = document.getElementById('btn-cart-meds');
    if (btnProducts) btnProducts.classList.toggle('active', type === 'products');
    if (btnMeds) btnMeds.classList.toggle('active', type === 'meds');
    const addBtn = document.getElementById('cart-add-btn');
    if (addBtn) addBtn.innerHTML = type === 'meds' ? '+ Добавить лекарства' : '+ Добавить товар';
    renderCartItems(); updateCartBadge();
}
function filterCartItems() { renderCartItems(); }
function getFilteredCartEntries() {
    const searchInput = document.getElementById('cart-search-input');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    return db.cart.map((item, index) => ({ item, index, prod: db.products.find(p => p.id === item.id) }))
        .filter(e => e.prod && isProductOfType(e.prod, cartViewType))
        .filter(e => !search || e.prod.name.toLowerCase().includes(search))
        .sort((a, b) => { if (a.item.checked && !b.item.checked) return 1; if (!a.item.checked && b.item.checked) return -1; return 0; });
}
function getComparisonEntries() {
    return db.cart.map(item => ({ item, prod: db.products.find(p => p.id === item.id) }))
        .filter(e => e.prod && isProductOfType(e.prod, pricesViewType));
}
function priceAt(storeName, prod) { const v = prod.prices && prod.prices[storeName] ? parseFloat(prod.prices[storeName]) || 0 : 0; return v; }
function openStoreDetailsModal(storeName) {
    injectCartStyles();
    const allStores = (db.stores || []).concat(db.pharmacies || []);
    const store = allStores.find(s => s.name === storeName);
    if (!store) { if (typeof showToast === 'function') showToast('Магазин не найден'); return; }
    const overlay = document.createElement('div');
    overlay.className = 'cart-confirm-overlay';
    const imageHtml = store.image ? `<img class="store-modal-image" src="${store.image}" alt="${escapeHtml(storeName)}">` : '';
    const addressHtml = store.address ? `<div class="store-modal-info-row"><span class="ico"></span><span>${escapeHtml(store.address)}</span></div>` : '';
    const typeLabel = store.type === 'pharmacy' ? 'Аптека' : 'Магазин';
    const colorDot = store.color ? `<span style="display:inline-block;width:.85rem;height:.85rem;border-radius:50%;background:${store.color};vertical-align:middle;margin-right:.35rem;border:1px solid rgba(0,0,0,.15);"></span>` : '';
    overlay.innerHTML = `<div class="cart-confirm-box"><div class="cart-confirm-title" style="font-size:1.15rem;">${colorDot}${escapeHtml(storeName)}</div><div class="store-modal-info-row" style="font-size:.78rem;color:#888;margin-bottom:.75rem;"><span>${typeLabel}</span></div>${imageHtml}${addressHtml}${!store.address ? '<div style="text-align:center;color:#999;font-size:.85rem;padding:.5rem 0;">Нет дополнительной информации</div>' : ''}<button type="button" id="sdm-close" style="background:var(--primary-color);color:#fff;">Закрыть</button></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#sdm-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
function renderCart() {
    if (shoppingModeActive) { updateShoppingModeData(); }
    else { renderCartItems(); }
    updateCartBadge();
}
function renderCartItems() {
    injectCartStyles(); cleanupGarbageProducts();
    const before = db.cart.length;
    db.cart = db.cart.filter(item => db.products.some(p => p.id === item.id));
    if (db.cart.length !== before) saveDB();
    const container = document.getElementById('cart-items');
    const currentTypeItems = db.cart.filter(item => { const prod = db.products.find(p => p.id === item.id); return prod && isProductOfType(prod, cartViewType); });
    const totalCount = currentTypeItems.length;
    const purchasedCount = currentTypeItems.filter(item => item.checked).length;
    const progressPercent = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;
    const pt = document.getElementById('cart-progress-text'); const pp = document.getElementById('cart-progress-percent'); const pb = document.getElementById('cart-progress-bar');
    if (pt) pt.innerText = `Собрано ${purchasedCount} из ${totalCount} товаров`;
    if (pp) pp.innerText = `${progressPercent}%`;
    if (pb) pb.style.width = `${progressPercent}%`;
    if (totalCount === 0) {
        const emptyIcon = cartViewType === 'meds' ? '✨' : '🛒✨';
        const emptyTitle = cartViewType === 'meds' ? 'Лекарств в корзине нет' : 'Ваша корзина пуста';
        const emptySub = cartViewType === 'meds' ? 'Добавьте лекарства, чтобы рассчитать выгодную аптеку' : 'Добавьте товары, чтобы рассчитать выгодный магазин';
        container.innerHTML = `<div style="text-align:center;padding:1.5rem 1rem;"><div style="font-size:2.25rem;margin-bottom:.5rem;">${emptyIcon}</div><div style="font-weight:bold;font-size:1rem;margin-bottom:.25rem;">${emptyTitle}</div><div style="font-size:.8rem;color:#777;margin-bottom:1rem;">${emptySub}</div></div>`;
        setTimeout(attachRipple, 50); return;
    }
    const filteredEntries = getFilteredCartEntries();
    const searchInput = document.getElementById('cart-search-input');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    container.innerHTML = '';
    if (filteredEntries.length === 0) {
        const emptyMsg = search ? 'Ничего не найдено' : (cartViewType === 'meds' ? 'Лекарств в корзине нет' : 'Товаров в корзине нет');
        const emptyDiv = document.createElement('div'); emptyDiv.style.cssText = 'text-align:center;padding:1.5rem 1rem;color:#777;';
        emptyDiv.innerHTML = `<div style="font-size:1.5rem;margin-bottom:.5rem;">${search ? '🔍' : '📋'}</div><div style="font-size:.9rem;">${emptyMsg}</div>`;
        container.appendChild(emptyDiv); setTimeout(attachRipple, 50); return;
    }
    const allCategories = categories.concat(medCategories);
    const unpaidEntries = filteredEntries.filter(e => !e.item.checked);
    const paidEntries = filteredEntries.filter(e => e.item.checked);
    function renderEntries(entries) {
        if (!entries.length) return;
        if (db.settings.cartGroupByCategory) {
            const groups = {};
            entries.forEach(e => { const catId = e.prod.category || 'other'; if (!groups[catId]) groups[catId] = []; groups[catId].push(e); });
            const catOrder = allCategories.map(c => c.id);
            Object.keys(groups).sort((a, b) => { const ia = catOrder.indexOf(a); const ib = catOrder.indexOf(b); return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib); }).forEach(catId => {
                const cat = allCategories.find(c => c.id === catId);
                const groupDiv = document.createElement('div'); groupDiv.className = 'cart-category-group';
                groupDiv.innerHTML = `<div class="cart-category-header cat-color-${catId}">${cat ? cat.icon : ''} ${cat ? escapeHtml(cat.name) : 'Другое'} <span style="margin-left:auto;font-weight:500;opacity:.7;">${groups[catId].length}</span></div>`;
                container.appendChild(groupDiv);
                groups[catId].forEach(e => groupDiv.appendChild(renderCartItemCard(e.item, e.index, e.prod)));
            });
        } else entries.forEach(e => container.appendChild(renderCartItemCard(e.item, e.index, e.prod)));
    }
    renderEntries(unpaidEntries);
    if (paidEntries.length) {
        const divider = document.createElement('div'); divider.className = 'purchased-divider';
        divider.innerHTML = `<div class="divider-line"></div><div class="divider-label">КУПЛЕНО</div><div class="divider-line"></div>`;
        container.appendChild(divider);
    }
    renderEntries(paidEntries);
    setTimeout(attachRipple, 50);
}
function renderCartItemCard(itemObj, index, prod) {
    const best = getBestPrice(prod);
    const positionTotal = best && best.price > 0 ? round2(best.price * itemObj.qty) : null;
    const totalHtml = positionTotal !== null ? `<div style="font-size:.78rem;color:var(--success-color);font-weight:700;margin-top:.1rem;">Итого: ${positionTotal} Р</div>` : '';
    const qtyControls = `<button class="cart-qty-btn" onclick="changeQty(${index},-1)">−</button><span class="cart-qty-value">${itemObj.qty}</span><button class="cart-qty-btn" onclick="changeQty(${index},1)">+</button>`;
    const card = document.createElement('div');
    card.className = `card ${itemObj.checked ? 'purchased' : ''}`;
    card.id = `cart-card-${index}`;
    if (itemObj.checked) {
        card.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;padding-right:6rem;"><div style="display:flex;align-items:center;gap:.625rem;"><input type="checkbox" checked onchange="toggleCartCheck(${index})" style="width:1.25rem;height:1.25rem;accent-color:var(--primary-color);cursor:pointer;"><div><div style="font-weight:bold;text-decoration:line-through;color:#888;">${escapeHtml(prod.name)} (${escapeHtml(prod.unit)})</div><div style="font-size:.8rem;color:#777;">${best ? 'дешевле в ' + escapeHtml(best.store) + ' · ' + best.price + ' Р' : 'нет данных о ценах'}</div>${totalHtml}</div></div><div style="display:flex;align-items:center;gap:.375rem;">${qtyControls}</div></div><div class="purchased-badge" onclick="removeCartItemWithAnimation(${index})" title="Удалить"><button style="position:absolute;top:.25rem;right:.375rem;background:none;border:none;cursor:pointer;color:white;font-size:.75rem;opacity:.9;">🗑️</button><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:.375rem;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg></div>`;
    } else {
        card.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;"><div style="display:flex;align-items:center;gap:.625rem;"><input type="checkbox" onchange="toggleCartCheck(${index})" style="width:1.25rem;height:1.25rem;accent-color:var(--primary-color);cursor:pointer;"><div><div style="font-weight:bold;">${escapeHtml(prod.name)} (${escapeHtml(prod.unit)})</div><div style="font-size:.8rem;color:#777;">${best ? 'дешевле в ' + escapeHtml(best.store) + ' · ' + best.price + ' Р' : 'нет данных о ценах'}</div>${totalHtml}</div></div><div style="display:flex;align-items:center;gap:.6rem;"><div style="display:flex;align-items:center;gap:.375rem;">${qtyControls}</div><button onclick="removeCartItemWithAnimation(${index})" style="background:none;border:none;cursor:pointer;font-size:1.15rem;opacity:.7;" title="Удалить">🗑️</button></div></div>`;
    }
    return card;
}
function toggleCartCheck(index) {
    db.cart[index].checked = !db.cart[index].checked;
    haptic(40); saveDB();
    if (shoppingModeActive) { updateShoppingModeData(); } else { renderCart(); }
    renderStoresComparison(); updateCartBadge();
    setTimeout(attachRipple, 50);
}
function changeQty(index, delta) {
    db.cart[index].qty += delta;
    if (db.cart[index].qty <= 0) db.cart[index].qty = 1;
    haptic(40); saveDB();
    if (shoppingModeActive) { updateShoppingModeData(); } else { renderCart(); }
    renderStoresComparison(); updateCartBadge();
}
function removeCartItemWithAnimation(index) {
    const cardEl = document.getElementById(`cart-card-${index}`);
    if (cardEl) {
        cardEl.classList.add('flying-to-trash');
        haptic(60);
        setTimeout(() => {
            db.cart.splice(index, 1);
            saveDB();
            if (shoppingModeActive) { updateShoppingModeData(); } else { renderCart(); }
            renderStoresComparison(); updateCartBadge();
        }, 400);
    }
}
function clearCart() {
    db.cart = db.cart.filter(item => { const prod = db.products.find(p => p.id === item.id); if (!prod) return true; if (cartViewType === 'meds') return !isMedProduct(prod); return isMedProduct(prod); });
    haptic(60); saveDB();
    if (shoppingModeActive) { updateShoppingModeData(); } else { renderCart(); }
    renderStoresComparison(); updateCartBadge();
}
function updateCartBadge() {
    const productsUnchecked = db.cart.filter(item => { if (item.checked) return false; const prod = db.products.find(p => p.id === item.id); return prod && !isMedProduct(prod); }).length;
    const medsUnchecked = db.cart.filter(item => { if (item.checked) return false; const prod = db.products.find(p => p.id === item.id); return prod && isMedProduct(prod); }).length;
    const bp = document.getElementById('cart-badge-products'); const bm = document.getElementById('cart-badge-meds');
    if (bp) { if (productsUnchecked > 0) { bp.textContent = productsUnchecked; bp.classList.remove('hidden'); } else bp.classList.add('hidden'); }
    if (bm) { if (medsUnchecked > 0) { bm.textContent = medsUnchecked; bm.classList.remove('hidden'); } else bm.classList.add('hidden'); }
}
function toggleComparisonMode() {
    if (isTransitioningComparison) return;
    isTransitioningComparison = true;
    const container = document.getElementById('stores-comparison');
    for (let child of container.children) {
        if (child.classList.contains('comparison-banner') || child.classList.contains('stores-sticky-wrap')) { child.classList.remove('animate-swipe-left-in', 'animate-swipe-right-in'); if (comparisonMode === 'store') child.classList.add('animate-swipe-left-out'); else child.classList.add('animate-swipe-right-out'); }
        else if (child.classList.contains('card') || child.classList.contains('orange-group-wrap')) { child.classList.remove('curtain-item'); child.classList.add('curtain-item-out'); }
    }
    setTimeout(() => { comparisonMode = (comparisonMode === 'store') ? 'mixed' : 'store'; updateComparisonToggleIcon(); renderStoresComparison(); }, 250);
    setTimeout(() => { isTransitioningComparison = false; }, 500);
}
function showProductStoresModal(prodId, qty) {
    injectCartStyles();
    const prod = db.products.find(p => p.id === prodId);
    if (!prod) return;
    const stores = getComparisonStores();
    let best = null, worst = null;
    stores.forEach(s => { const p = priceAt(s.name, prod); if (p > 0) { if (!best || p < best.price) best = { store: s.name, price: p }; if (!worst || p > worst.price) worst = { store: s.name, price: p }; } });
    const rows = stores.map(s => {
        const p = priceAt(s.name, prod);
        const sum = round2(p * qty);
        let mark = '';
        if (p > 0) {
            if (best && p === best.price && best.store === s.name) mark = ' <span class="best-price-label">лучшая цена</span>';
            else if (worst && p === worst.price && worst.store === s.name && best.price !== worst.price) mark = ' <span class="worst-price-label">худшая цена</span>';
        }
        return `<div class="history-item"><span>${escapeHtml(s.name)} ${mark}</span><span>${p > 0 ? sum + ' Р' : 'нет цены'}</span></div>`;
    }).join('');
    const overlay = document.createElement('div'); overlay.className = 'cart-confirm-overlay';
    overlay.innerHTML = `<div class="cart-confirm-box"><div class="cart-confirm-title">🏷️ ${escapeHtml(prod.name)} ×${qty}</div><div class="history-items">${rows}</div><button type="button" id="ps-ok" style="background:var(--primary-color);color:#fff;">Закрыть</button></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#ps-ok').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
function computeRoute(entries, storeTotals, globalBestByProduct) {
    const avail = Object.entries(storeTotals).filter(([, d]) => d.availableCount > 0);
    if (!avail.length) return null;
    const sorted = avail.slice().sort((a, b) => {
        if (b[1].availableCount !== a[1].availableCount) return b[1].availableCount - a[1].availableCount;
        return a[1].total - b[1].total;
    });
    let leader = sorted[0][0];
    let assign = {};
    entries.forEach(e => {
        if (priceAt(leader, e.prod) > 0) assign[e.prod.id] = leader;
    });
    const missing = entries.filter(e => !assign[e.prod.id]);
    const additionalStoresSet = new Set();
    missing.forEach(e => {
        let bestStore = null, bestPrice = Infinity;
        avail.forEach(([name]) => {
            const p = priceAt(name, e.prod);
            if (p > 0 && p < bestPrice) { bestPrice = p; bestStore = name; }
        });
        if (bestStore) {
            assign[e.prod.id] = bestStore;
            if (bestStore !== leader) additionalStoresSet.add(bestStore);
        }
    });
    let changed = true, iterations = 0;
    while (changed && iterations < 5) {
        changed = false; iterations++;
        entries.forEach(e => {
            if (assign[e.prod.id] === leader) {
                const leaderPrice = priceAt(leader, e.prod);
                additionalStoresSet.forEach(addStore => {
                    const addPrice = priceAt(addStore, e.prod);
                    if (addPrice > 0 && addPrice < leaderPrice) { assign[e.prod.id] = addStore; changed = true; }
                });
            }
        });
        const counts = {};
        avail.forEach(([name]) => counts[name] = 0);
        entries.forEach(e => { if (assign[e.prod.id]) counts[assign[e.prod.id]]++; });
        let newLeader = leader, maxCount = counts[leader] || 0;
        let minTotal = entries.filter(e => assign[e.prod.id] === leader).reduce((s, e) => s + priceAt(leader, e.prod) * e.item.qty, 0);
        additionalStoresSet.forEach(addStore => {
            const c = counts[addStore] || 0;
            const t = entries.filter(e => assign[e.prod.id] === addStore).reduce((s, e) => s + priceAt(addStore, e.prod) * e.item.qty, 0);
            if (c > maxCount || (c === maxCount && t < minTotal)) { maxCount = c; minTotal = t; newLeader = addStore; }
        });
        if (newLeader !== leader) {
            additionalStoresSet.add(leader); leader = newLeader; additionalStoresSet.delete(leader); changed = true;
        }
    }
    const additional = Array.from(additionalStoresSet).map(name => ({
        name: name, total: round2(entries.filter(e => assign[e.prod.id] === name).reduce((s, e) => s + priceAt(name, e.prod) * e.item.qty, 0))
    })).sort((a, b) => b.total - a.total);
    const leaderTotal = round2(entries.filter(e => assign[e.prod.id] === leader).reduce((s, e) => s + priceAt(leader, e.prod) * e.item.qty, 0));
    const routeTotal = round2(entries.reduce((s, e) => {
        const store = assign[e.prod.id];
        return store ? s + priceAt(store, e.prod) * e.item.qty : s;
    }, 0));
    const bestCount = {};
    avail.forEach(([name]) => bestCount[name] = 0);
    entries.forEach(e => {
        const gb = globalBestByProduct[e.prod.id];
        if (gb && bestCount[gb.store] !== undefined) bestCount[gb.store]++;
    });
    return { leader, leaderTotal, additional, routeTotal, assign, bestCount };
}
function storeTypeWord() { return pricesViewType === 'meds' ? 'аптека' : 'магазин'; }
function storeTypeWordPlural() { return pricesViewType === 'meds' ? 'аптеки' : 'магазины'; }
function storeTypeWordPrep() { return pricesViewType === 'meds' ? 'аптеке' : 'магазине'; }
function renderStoresComparison() {
    injectCartStyles(); injectPricesTypeToggle(); updatePricesTypeToggle(); cleanupGarbageProducts();
    const container = document.getElementById('stores-comparison');
    if (!container) return;
    container.innerHTML = '';
    const compStores = getComparisonStores();
    const entries = getComparisonEntries();
    const globalBestByProduct = {}; const globalWorstByProduct = {};
    entries.forEach(e => { const b = getBestPrice(e.prod); if (b) globalBestByProduct[e.prod.id] = b; const w = getWorstPrice(e.prod); if (w) globalWorstByProduct[e.prod.id] = w; });
    let storeTotals = {};
    compStores.forEach(sObj => { storeTotals[sObj.name] = { total: 0, availableCount: 0, productPrices: {} }; });
    entries.forEach(e => {
        compStores.forEach(sObj => {
            const price = priceAt(sObj.name, e.prod);
            storeTotals[sObj.name].productPrices[e.prod.id] = { price, sum: price * e.item.qty, qty: e.item.qty, name: e.prod.name };
            if (price > 0) { storeTotals[sObj.name].total += price * e.item.qty; storeTotals[sObj.name].availableCount++; }
        });
    });
    if (entries.length === 0) {
        const banner = document.createElement('div');
        banner.className = 'comparison-banner banner-green';
        banner.onclick = openSelectProductsModal;
        banner.style.textAlign = 'center'; banner.style.fontWeight = '500'; banner.style.cursor = 'pointer';
        banner.innerHTML = `👆 Добавьте ${pricesViewType === 'meds' ? 'лекарства' : 'товары'} в корзине для сравнения`;
        container.appendChild(banner); setTimeout(attachRipple, 50); return;
    }
    const routeInfo = computeRoute(entries, storeTotals, globalBestByProduct);
    const safe = s => String(s).replace(/['"\\]/g, '\\$&');
    const additionalNames = new Set(routeInfo ? routeInfo.additional.map(a => a.name) : []);
    function sortEntriesForStore(store) {
        return entries.slice().sort((a, b) => {
            const pa = priceAt(store, a.prod), pb = priceAt(store, b.prod);
            const ga = globalBestByProduct[a.prod.id], gb = globalBestByProduct[b.prod.id];
            const aIn = pa > 0, bIn = pb > 0;
            const aBest = aIn && ga && ga.store === store && pa === ga.price;
            const bBest = bIn && gb && gb.store === store && pb === gb.price;
            const prioA = aBest ? 0 : 1, prioB = bBest ? 0 : 1;
            if (prioA !== prioB) return prioA - prioB;
            return (pb * b.item.qty) - (pa * a.item.qty);
        });
    }
    const renderStoreCard = (store, data, role, isLeader, assign, visitIndex) => {
        visitIndex = visitIndex || 0;
        const isBest = role === 'gold', isSilver = role === 'silver', isExtra = role === 'extra';
        const availableStores = Object.entries(storeTotals).filter(([, d]) => d.availableCount > 0);
        const sortedAvail = availableStores.slice().sort((a, b) => a[1].total - b[1].total);
        const isWorst = !isBest && !isSilver && !isExtra && sortedAvail.length > 1 && store === sortedAvail[sortedAvail.length - 1][0];
        const sCard = document.createElement('div');
        let cardClass = 'card';
        if (isBest || isSilver) cardClass += ' store-item-winner' + (isSilver ? ' silver' : '');
        else if (isExtra) cardClass += ' store-item-extra';
        else cardClass += ' store-card-normal';
        sCard.className = cardClass;
        const visitText = visitIndex === 0 ? 'Второй по посещению' : (visitIndex === 1 ? 'Третий по посещению' : (visitIndex + 2) + '-й по посещению');
        const storeLabel = isBest ? 'выгодно' : (isSilver ? 'обязательно' : (isExtra ? 'доп.' : ''));
        const winnerBadgeHtml = isBest ? '<div class="winner-badge">Лучший выбор</div>' : (isSilver ? `<div class="winner-badge silver">${visitText}</div>` : '');
        let chipHtml = '';
        if (storeLabel) {
            const chipStyle = isExtra ? 'background:var(--multi-store-color);color:#fff;' : (isSilver ? 'background:#cbd5e1;color:#475569;' : 'background:var(--badge-bg);color:var(--badge-text);');
            chipHtml = `<span style="font-size:.7rem;${chipStyle}padding:.125rem .375rem;border-radius:.25rem;font-weight:700;">${storeLabel.toUpperCase()}</span>`;
        }
        const inRoute = (assign && routeInfo && (store === routeInfo.leader || additionalNames.has(store)));
        const totalDisplay = inRoute ? round2(entries.filter(e => assign[e.prod.id] === store).reduce((s, e) => s + priceAt(store, e.prod) * e.item.qty, 0)) : data.total;
        const storeObj = compStores.find(s => s.name === store);
        const dotColor = storeObj && storeObj.color ? storeObj.color : 'var(--primary-color)';
        const sortedForStore = sortEntriesForStore(store);
        const allProductsHtml = sortedForStore.map(e => {
            const prod = e.prod;
            const priceData = data.productPrices[prod.id];
            const price = priceData ? priceData.price : 0;
            const sum = priceData ? round2(priceData.sum) : 0;
            const qty = e.item.qty;
            const bought = e.item.checked;
            const boughtBadge = bought ? `<span class="bought-badge" title="Уже куплено">🛒</span>` : '';
            const gb = globalBestByProduct[prod.id]; const gw = globalWorstByProduct[prod.id];
            if (price > 0) {
                const isGlobalBest = gb && gb.store === store && price === gb.price;
                const isGlobalWorst = gw && gw.store === store && price === gw.price && gw.price !== gb.price;
                const cheaperElsewhere = gb && gb.store !== store && gb.price < price;
                const assignedHere = assign && assign[prod.id] === store;
                let leftBadge = '', rightBadge = '', priceClass = '', priceStyle = '';
                if (assignedHere) {
                    leftBadge = '<span class="best-deal-badge">🛒 брать здесь</span>';
                    if (isGlobalBest) { rightBadge = '<span class="best-price-label">Лучшая цена</span>'; priceClass = 'price-best'; priceStyle = 'font-weight:bold;color:var(--success-color);'; }
                    else if (cheaperElsewhere || isGlobalWorst) { rightBadge = `<span class="neutral-price-label" onclick="event.stopPropagation(); showProductStoresModal('${safe(prod.id)}',${qty})" title="Есть дешевле вне маршрута">есть дешевле</span>`; priceStyle = 'font-weight:700;color:var(--text-color);'; }
                } else {
                    if (isGlobalBest) { rightBadge = '<span class="best-price-label">Лучшая цена</span>'; priceClass = 'price-best'; priceStyle = 'font-weight:bold;color:var(--success-color);'; }
                    else {
                        priceStyle = 'color:var(--danger-color);font-weight:700;';
                        if (isGlobalWorst) { rightBadge = '<span class="worst-price-label">худшая цена</span>'; priceClass = 'price-worst'; }
                        leftBadge = `<span class="worse-price-label" onclick="event.stopPropagation(); showProductStoresModal('${safe(prod.id)}',${qty})">есть лучше</span>`;
                    }
                }
                const badgesLine = leftBadge ? `<div class="spr-badges">${leftBadge}</div>` : '';
                return `<div class="store-product-row"><div class="spr-main">${badgesLine}<div class="spr-name">${escapeHtml(prod.name)} ×${qty}</div></div><div class="spr-right">${boughtBadge}${rightBadge}<span class="spr-price ${priceClass}" style="${priceStyle}">${sum} Р</span></div></div>`;
            } else {
                return `<div class="store-product-row price-row-missing"><div class="spr-main"><div class="spr-name">${escapeHtml(prod.name)} ×${qty}</div></div><div class="spr-right">${boughtBadge}<span class="spr-price">нет цены</span></div></div>`;
            }
        }).join('');
        let totalStyle;
        if (isBest) totalStyle = 'font-size:1.2rem;color:var(--success-color);font-weight:800;';
        else if (isSilver) totalStyle = 'font-size:1.2rem;color:#64748b;font-weight:800;';
        else if (isWorst) totalStyle = 'font-size:1.1rem;color:var(--danger-color);font-weight:700;';
        else totalStyle = 'font-size:1.1rem;color:var(--text-color);font-weight:700;';
        sCard.innerHTML = `${winnerBadgeHtml}<div style="display:flex;justify-content:space-between;align-items:flex-start;font-weight:bold;"><div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;flex:1;min-width:0;"><button type="button" class="store-name-btn" onclick="openStoreDetailsModal('${safe(store)}')"><span class="store-name-dot" style="background:${escapeHtml(dotColor)}"></span>${escapeHtml(store)}</button>${chipHtml}</div><span class="store-total-text" style="${totalStyle}flex-shrink:0;margin-left:.5rem;">${totalDisplay} Р</span></div><div style="margin-top:.5rem;font-size:.85rem;">${allProductsHtml}</div>`;
        return sCard;
    };
    const stickyTop = (function () { const header = document.querySelector('.prices-sticky-header'); return (header ? header.offsetHeight : 0) - 1; })();
    if (comparisonMode === 'store') {
        if (!routeInfo) {
            const banner = document.createElement('div'); banner.className = 'comparison-banner banner-green'; banner.onclick = toggleComparisonMode;
            banner.innerHTML = `<div style="text-align:center;font-weight:500;">Укажите цены на ${pricesViewType === 'meds' ? 'лекарства' : 'товары'} для сравнения</div>`;
            container.appendChild(banner); return;
        }
        const leader = routeInfo.leader;
        const leaderObj = compStores.find(s => s.name === leader);
        const addressHtml = leaderObj && leaderObj.address ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>${escapeHtml(leaderObj.address)}</span>` : '<span style="opacity:0;">—</span>';
        const extraBlock = routeInfo.additional.length ? `<div class="banner-extra-line">Дополнительные ${storeTypeWordPlural()} (обязательно):</div><div class="banner-extra-stores">${routeInfo.additional.map(a => `«${escapeHtml(a.name)}» — ${a.total} Р`).join('<br>')}</div>` : '';
        const banner = document.createElement('div'); banner.className = 'comparison-banner banner-green'; banner.onclick = toggleComparisonMode;
        banner.innerHTML = `<div class="banner-row-1">Лучшая цена — в ${storeTypeWordPrep()}</div><div class="banner-row-2">${escapeHtml(leader)} — ${routeInfo.leaderTotal} Р</div><div class="banner-row-3">${addressHtml}</div><div class="banner-row-4"><span class="total-label">Всего на:</span><span class="total-cart-icon">🛒</span><span class="price-in-box">${routeInfo.routeTotal} Р</span></div>${extraBlock}`;
        const stickyWrap = document.createElement('div'); stickyWrap.className = 'stores-sticky-wrap'; stickyWrap.style.top = stickyTop + 'px'; stickyWrap.appendChild(banner); container.appendChild(stickyWrap);
        const missingAtLeader = entries.filter(e => priceAt(leader, e.prod) <= 0).length;
        const cheaperElsewhere = entries.filter(e => routeInfo.assign[e.prod.id] !== leader && priceAt(leader, e.prod) > 0).length;
        if (missingAtLeader > 0 || cheaperElsewhere > 0) {
            const warning = document.createElement('div'); warning.className = 'multi-store-warning';
            const extraNames = routeInfo.additional.map(a => a.name).join(', ');
            let title, sub = '';
            if (missingAtLeader > 0) { title = `ВНИМАНИЕ — в «${escapeHtml(leader)}» нет ${missingAtLeader} тов.`; sub += extraNames ? `Купите их в: ${escapeHtml(extraNames)}.` : 'В других местах на них тоже нет цен.'; }
            else { title = `В «${escapeHtml(leader)}» не всё по лучшей цене`; }
            if (cheaperElsewhere > 0) sub += ` Ещё ${cheaperElsewhere} тов. выгоднее взять там же.`;
            warning.innerHTML = `<div class="warning-icon">⚠️</div><div class="warning-text"><div class="warning-title">${title}</div><div class="warning-sub">${sub}</div></div>`;
            container.appendChild(warning);
        }
        container.appendChild(renderStoreCard(leader, storeTotals[leader], 'gold', true, routeInfo.assign, 0));
        routeInfo.additional.forEach((a, i) => { container.appendChild(renderStoreCard(a.name, storeTotals[a.name], 'silver', false, routeInfo.assign, i)); });
        Object.entries(storeTotals).filter(([name]) => name !== leader && !additionalNames.has(name)).sort((a, b) => (routeInfo.bestCount[b[0]] - routeInfo.bestCount[a[0]]) || (b[1].total - a[1].total)).forEach(([name, data]) => container.appendChild(renderStoreCard(name, data, 'none', false, routeInfo.assign, 0)));
    } else {
        let mixedTotal = 0;
        entries.forEach(e => { const b = globalBestByProduct[e.prod.id]; if (b) mixedTotal += b.price * e.item.qty; });
        mixedTotal = round2(mixedTotal);
        const leader = routeInfo ? routeInfo.leader : null;
        const greenTotal = routeInfo ? routeInfo.routeTotal : mixedTotal;
        const savings = round2(greenTotal - mixedTotal);
        const middleText = leader ? (savings > 0 ? `Дешевле чем в «${escapeHtml(leader)}» на ${savings} Р` : `Не дешевле, чем в «${escapeHtml(leader)}»`) : '';
        const banner = document.createElement('div'); banner.className = 'comparison-banner banner-orange'; banner.onclick = toggleComparisonMode;
        banner.innerHTML = `<div class="orange-banner-row-1">🏆 Лучшая цена — по разным ${pricesViewType === 'meds' ? 'аптекам' : 'магазинам'}</div><div class="banner-row-2" style="font-size:1.1rem;">${middleText}</div><div class="banner-row-4"><span class="total-label">Всего на:</span><span class="total-cart-icon"></span><span class="price-in-box">${mixedTotal} Р</span></div>`;
        const stickyWrap = document.createElement('div'); stickyWrap.className = 'stores-sticky-wrap'; stickyWrap.style.top = stickyTop + 'px'; stickyWrap.appendChild(banner); container.appendChild(stickyWrap);
        const groups = {};
        entries.forEach(e => { const gb = globalBestByProduct[e.prod.id]; const key = gb ? gb.store : '__noprice__'; (groups[key] = groups[key] || []).push(e); });
        const groupList = Object.entries(groups).sort((a, b) => { if (a[0] === '__noprice__') return 1; if (b[0] === '__noprice__') return -1; return b[1].length - a[1].length; });
        groupList.forEach(([store, list]) => {
            const wrap = document.createElement('div'); wrap.className = 'orange-group-wrap';
            const header = store === '__noprice__' ? 'Нет цены' : `«${escapeHtml(store)}» — ${list.length} тов.`;
            let cardsHtml = '';
            list.forEach(e => {
                const gb = globalBestByProduct[e.prod.id];
                const sum = gb ? round2(gb.price * e.item.qty) : 0;
                cardsHtml += `<div class="card orange-product-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;"><div class="spr-name" style="font-weight:700;">${escapeHtml(e.prod.name)} <span style="color:#777;font-weight:500;font-size:.8rem;">×${e.item.qty}</span></div><button type="button" class="more-prices-btn" onclick="showProductStoresModal('${safe(e.prod.id)}', ${e.item.qty})">Еще цены</button></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:.4rem;"><span style="font-size:.85rem;color:var(--text-color);">${store === '__noprice__' ? 'нет цены' : escapeHtml(store)}</span><span style="font-weight:800;color:${gb ? 'var(--success-color)' : '#aaa'};">${gb ? sum + ' Р' : 'нет цены'}</span></div></div>`;
            });
            wrap.innerHTML = `<div class="orange-group-title">${header}</div>` + cardsHtml;
            container.appendChild(wrap);
        });
    }
    setTimeout(attachRipple, 50);
}