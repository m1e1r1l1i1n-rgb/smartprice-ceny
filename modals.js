var storeColorPickerMode = 'add';
function openGpsErrorModal(errorCode) {
const titleEl = document.getElementById('gps-error-title');
const messageEl = document.getElementById('gps-error-message');
const instructionEl = document.getElementById('gps-error-instruction');
let title = 'Нет доступа к геолокации';
let message = 'Разрешите доступ к местоположению в настройках телефона, чтобы использовать эту функцию.';
let instruction = '<strong>Как разрешить доступ:</strong><ol><li>Откройте <b>Настройки</b> телефона</li><li>Перейдите в <b>Приложения</b> → ваш браузер</li><li>Нажмите <b>Разрешения</b> → <b>Местоположение</b></li><li>Выберите <b>«Разрешить»</b></li></ol>';
if (errorCode === 1) { title = 'Доступ к геолокации запрещён'; message = 'Вы запретили доступ к местоположению. Разрешите его в настройках телефона, чтобы использовать GPS.'; }
else if (errorCode === 2) { title = 'GPS недоступен'; message = 'Не удалось определить местоположение. Проверьте, включён ли GPS и есть ли сигнал.'; instruction = '<strong>Что проверить:</strong><ol><li>Включите <b>Геолокацию / GPS</b></li><li>Выйдите на открытое пространство</li><li>Проверьте интернет</li><li>Перезагрузите браузер</li></ol>'; }
else if (errorCode === 3) { title = 'Превышено время ожидания'; message = 'GPS не смог определить местоположение за отведённое время. Попробуйте ещё раз.'; instruction = '<strong>Советы:</strong><ol><li>Выйдите на открытое пространство</li><li>Включите Wi-Fi для точности</li><li>Перезагрузите GPS</li><li>Нажмите кнопку GPS ещё раз</li></ol>'; }
titleEl.textContent = title; messageEl.textContent = message; instructionEl.innerHTML = instruction;
openModalEl('gps-error-modal');
}
function closeGpsErrorModal() { haptic(20); closeModalEl('gps-error-modal'); }
function closeGpsErrorModalOnOutside(e) { if (e.target.id === 'gps-error-modal') closeGpsErrorModal(); }
function tryOpenSettings() {
const isAndroid = /android/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
let opened = false;
if (isAndroid) {
const schemes = ['app-settings:', 'intent://settings/applications#Intent;scheme=android-app;end', 'settings://', 'android-app://com.android.settings/'];
for (const scheme of schemes) { try { const link = document.createElement('a'); link.href = scheme; link.style.display = 'none'; document.body.appendChild(link); link.click(); setTimeout(() => document.body.removeChild(link), 1000); opened = true; break; } catch (e) { continue; } }
} else if (isIOS) { try { window.location.href = 'App-Prefs:root=General'; opened = true; } catch (e) {} }
if (!opened) showToast('📱 Откройте Настройки → Приложения → ваш браузер → Разрешения');
closeGpsErrorModal();
}
function updateCategoryModalViewIcon() { const el = document.getElementById('category-modal-view-icon'); if (el) el.innerHTML = db.settings.categoryModalViewMode === 'grid' ? ICON_LIST : ICON_GRID; }
function toggleCategoryModalViewMode() { db.settings.categoryModalViewMode = (db.settings.categoryModalViewMode === 'grid') ? 'list' : 'grid'; saveDB(); updateCategoryModalViewIcon(); if (currentCategoryModalCatId) renderCategoryModalContent(currentCategoryModalCatId); }
function renderCategoryModalContent(catId) {
const listEl = document.getElementById('category-modal-products');
listEl.innerHTML = '';
const prods = db.products.filter(p => p.category === catId);
if (prods.length === 0) { listEl.innerHTML = '<div style="text-align: center; padding: 1.25rem; color: #777;">В этой группе пока нет товаров</div>'; return; }
if (db.settings.categoryModalViewMode === 'grid') {
listEl.style.display = 'grid'; listEl.className = 'cat-modal-grid'; listEl.style.gap = '0.5rem';
prods.forEach(prod => {
const best = getBestPrice(prod);
const tile = document.createElement('div');
tile.className = 'cat-modal-tile';
tile.onclick = () => { closeCategoryModal(); openProductModal(prod.id); };
tile.innerHTML = '<img src="' + (prod.image || '') + '" alt="" onerror="this.style.background=\'var(--bg-color)\'"><div class="tile-prod-name">' + escapeHtml(prod.name) + '</div><div class="tile-prod-price">' + (best ? 'Лучшая: ' + best.price + ' Р' : 'нет цены') + '</div>' + (best ? '<div class="tile-prod-store">📍 ' + escapeHtml(best.store) + '</div>' : '');
listEl.appendChild(tile);
});
} else {
listEl.style.display = 'flex'; listEl.style.flexDirection = 'column'; listEl.style.gap = '0.5rem';
prods.forEach(prod => {
const best = getBestPrice(prod);
const cat = findCategoryById(prod.category);
const item = document.createElement('div');
item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 0.5rem; cursor: pointer;';
item.onclick = () => { closeCategoryModal(); openProductModal(prod.id); };
const safeImg = String(prod.image || '').replace(/'/g, "\'");
item.innerHTML = '<div style="display: flex; align-items: center; gap: 0.625rem; flex: 1; min-width: 0;"><img src="' + escapeHtml(prod.image || '') + '" class="prod-list-img" onclick="event.stopPropagation(); openFullscreenPhoto(\'' + safeImg + '\')" onerror="this.style.background=\'var(--border-color)\'"><div style="min-width: 0;"><div class="prod-list-name">' + escapeHtml(prod.name) + '</div><div class="prod-list-cat">Категория: ' + (cat ? escapeHtml(cat.name) : '—') + ' · Ед: ' + escapeHtml(prod.unit) + '</div><div style="margin-top: 0.125rem;">' + (best ? '<span class="prod-list-price-label">Лучшая цена: </span><span class="prod-list-store">' + best.price + ' Р · ' + escapeHtml(best.store) + '</span>' : '<span style="color: #999; font-size: 0.85rem;">Цены не указаны</span>') + '</div></div></div><span style="color: var(--primary-color); flex-shrink: 0;">→</span>';
listEl.appendChild(item);
});
}
}
function openBgPaletteModal() { renderColorPicker('bg-palette-grid', db.settings.bgColor || (db.settings.darkMode ? '#121212' : '#f4f6f8'), c => { changeBgColor(c); closeBgPaletteModal(); }); openModalEl('bg-palette-modal'); }
function closeBgPaletteModal() { haptic(20); closeModalEl('bg-palette-modal'); }
function closeBgPaletteModalOnOutside(e) { if (e.target.id === 'bg-palette-modal') closeBgPaletteModal(); }
function openMultiStoreColorPalette() { renderColorPicker('multi-store-palette-grid', db.settings.multiStoreColor || '#d93838', c => { changeMultiStoreColor(c); closeMultiStoreColorPalette(); }); openModalEl('multi-store-palette-modal'); }
function closeMultiStoreColorPalette() { haptic(20); closeModalEl('multi-store-palette-modal'); }
function closeMultiStorePaletteOnOutside(e) { if (e.target.id === 'multi-store-palette-modal') closeMultiStoreColorPalette(); }
function openAddProductBtnColorPalette() { renderColorPicker('add-product-btn-palette-grid', db.settings.addProductBtnColor || '#27AA5A', c => { changeAddProductBtnColor(c); closeAddProductBtnColorPalette(); }); openModalEl('add-product-btn-palette-modal'); }
function closeAddProductBtnColorPalette() { haptic(20); closeModalEl('add-product-btn-palette-modal'); }
function closeAddProductBtnPaletteOnOutside(e) { if (e.target.id === 'add-product-btn-palette-modal') closeAddProductBtnColorPalette(); }
function openFullscreenPhoto(src) { if (!src) return; document.getElementById('fullscreen-img').src = src; document.getElementById('fullscreen-viewer').style.display = 'flex'; }
function closeFullscreenPhoto() { haptic(20); document.getElementById('fullscreen-viewer').style.display = 'none'; }
function openCategoryModal(catId) {
const cat = findCategoryById(catId);
if (!cat) return;
currentCategoryModalCatId = catId;
document.getElementById('category-modal-title').innerHTML = cat.icon + ' ' + escapeHtml(cat.name);
updateCategoryModalViewIcon();
renderCategoryModalContent(catId);
openModalEl('category-modal');
}
function closeCategoryModal() { haptic(20); closeModalEl('category-modal'); currentCategoryModalCatId = null; }
function closeCategoryModalOnOutside(e) { if (e.target.id === 'category-modal') closeCategoryModal(); }
function openProductModal(id) {
currentModalProductId = id;
const prod = db.products.find(p => p.id === id);
if (!prod) return;
document.getElementById('modal-prod-img').src = prod.image || '';
document.getElementById('modal-prod-name').value = prod.name;
const cat = findCategoryById(prod.category);
const best = getBestPrice(prod);
const worst = getWorstPrice(prod);
document.getElementById('modal-prod-info-cat').innerText = 'Категория: ' + (cat ? cat.name : '—');
document.getElementById('modal-prod-info-unit').innerText = 'Единица: ' + prod.unit;
document.getElementById('modal-prod-info-best').innerHTML = best ? 'Лучшая цена: ' + best.price + ' Р <span style="color: var(--success-color); font-weight: 800;">· ' + escapeHtml(best.store) + '</span>' : 'Лучшая цена: —';
/* ===== ЗАДАЧА 5 (прошлая): заголовок цен зависит от типа (товар/лекарство) ===== */
const pricesHeader = document.querySelector('#product-modal h4');
if (pricesHeader) pricesHeader.textContent = isMedProduct(prod) ? 'Цены в аптеках' : 'Цены в магазинах';
const pricesList = document.getElementById('modal-prices-list');
pricesList.innerHTML = '';
getStoresForProduct(prod).forEach(storeObj => {
const storeName = storeObj.name;
const storeColor = storeObj.color || '#00875a';
const rawPrice = prod.prices && prod.prices[storeName] !== undefined ? prod.prices[storeName] : '';
const pVal = (rawPrice === '' || rawPrice === null || rawPrice === 0) ? '' : rawPrice;
const pDate = prod.dates && prod.dates[storeName] ? prod.dates[storeName] : '';
const isBest = best && best.store === storeName && parseFloat(pVal) === best.price;
const isWorst = worst && worst.store === storeName && parseFloat(pVal) === worst.price && best.price !== worst.price;
const worstStyle = isWorst ? 'color: var(--danger-color); font-weight: 700;' : '';
const row = document.createElement('div');
row.className = 'card';
row.style.cssText = 'margin-bottom: 0.5rem; padding: 0.625rem;';
row.innerHTML = '<div class="store-row-header store-row-clickable" onclick="showFullPriceTooltip(this.querySelector(\'.price-input-wrap\'))"><div class="store-row-left"><div class="store-icon-box" style="background-color: ' + storeColor + ';"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></div><div class="store-info"><div class="store-name" style="' + (isBest ? 'color: var(--success-color);' : (isWorst ? 'color: var(--danger-color);' : '')) + '">' + escapeHtml(storeName) + '</div><div class="store-date" onclick="event.stopPropagation(); showPriceHistory(\'' + prod.id + '\', \'' + storeName + '\')">' + (pDate || 'нет даты') + '</div></div></div><div class="price-input-wrap"><input type="number" value="' + pVal + '" placeholder="0" data-full-value="' + pVal + '" style="width: 5rem; margin: 0; padding: 0.375rem 0.25rem 0.375rem 0.5rem; text-align: right; font-weight: bold; font-size: 1.06rem; ' + (isBest ? 'color: var(--success-color);' : '') + ' ' + worstStyle + '" oninput="debouncedUpdatePrice(\'' + prod.id + '\', \'' + storeName + '\', this.value)" onclick="event.stopPropagation()"><span class="price-currency" style="' + (isBest ? 'color: var(--success-color);' : '') + ' ' + worstStyle + '">Р</span></div></div>';
pricesList.appendChild(row);
});
const addModal = document.getElementById('add-product-modal');
const prodModal = document.getElementById('product-modal');
if (addModal && prodModal) {
const addDialog = addModal.querySelector('.modal-content') || addModal.children[0];
const prodDialog = prodModal.querySelector('.modal-content') || prodModal.children[0];
if (addDialog && prodDialog) {
prodDialog.style.removeProperty('background-color');
const bg = window.getComputedStyle(addDialog).backgroundColor;
if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') prodDialog.style.backgroundColor = bg;
}
}
openModalEl('product-modal');
setTimeout(attachRipple, 50);
}
function closeModal() { haptic(20); closeModalEl('product-modal'); renderProducts(); renderCart(); renderStoresComparison(); }
function closeModalOnOutside(e) { if (e.target.id === 'product-modal') closeModal(); }
function showPriceHistory(prodId, storeName) {
const prod = db.products.find(p => p.id === prodId);
if (!prod) return;
document.getElementById('history-modal-title').innerText = 'История цен: ' + storeName + ' (' + prod.name + ')';
const hc = document.getElementById('history-modal-content');
hc.innerHTML = '';
const history = (prod.priceHistory && prod.priceHistory[storeName]) ? prod.priceHistory[storeName] : [];
if (!history.length) hc.innerHTML = '<div style="text-align: center; color: #777; padding: 0.93rem;">История изменений пока пуста</div>';
else history.slice().reverse().forEach(entry => {
const row = document.createElement('div');
row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 0.5rem;';
row.innerHTML = '<span style="font-size: 0.8rem; color: #777;">' + escapeHtml(entry.date) + '</span><span style="font-weight: bold; font-size: 0.93rem; color: var(--primary-color);">' + entry.price + ' Р</span>';
hc.appendChild(row);
});
openModalEl('price-history-modal');
}
function closeHistoryModal() { haptic(20); closeModalEl('price-history-modal'); }
function closeHistoryModalOnOutside(e) { if (e.target.id === 'price-history-modal') closeHistoryModal(); }
function openEditProductModal(prodId) {
const prod = db.products.find(p => p.id === prodId);
if (!prod) return;
editingProductId = prodId;
tempEditProductImage = prod.image || '';
document.getElementById('edit-name').value = prod.name;
const catSelect = document.getElementById('edit-category');
catSelect.innerHTML = getCategoriesForProduct(prod).map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
catSelect.value = prod.category;
const unitSelect = document.getElementById('edit-unit');
if (unitSelect) { unitSelect.innerHTML = getUnitsForProduct(prod).map(u => '<option value="' + u + '">' + u + '</option>').join(''); unitSelect.value = prod.unit; }
const t = document.getElementById('edit-product-modal-title');
if (t) t.textContent = isMedProduct(prod) ? 'Редактировать лекарство' : 'Редактировать товар';
const prev = document.getElementById('edit-prod-preview');
const ph = document.getElementById('edit-prod-placeholder');
if (tempEditProductImage) { prev.src = tempEditProductImage; prev.style.display = 'block'; ph.style.display = 'none'; }
else { prev.src = ''; prev.style.display = 'none'; ph.style.display = 'block'; }
closeModalEl('product-modal');
openModalEl('edit-product-modal');
}
function closeEditProductModal() { haptic(20); closeModalEl('edit-product-modal'); editingProductId = null; tempEditProductImage = ''; if (currentModalProductId) openProductModal(currentModalProductId); }
function openAddProductModal() {
tempImage = '';
const prev = document.getElementById('new-prod-preview');
const ph = document.getElementById('new-prod-placeholder');
prev.src = ''; prev.style.display = 'none'; ph.style.display = 'block';
document.getElementById('new-name').value = '';
document.getElementById('new-category').innerHTML = getActiveCategories().map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
const u = document.getElementById('new-unit');
if (u) u.innerHTML = getActiveUnits().map(x => '<option value="' + x + '">' + x + '</option>').join('');
const t = document.getElementById('add-prod-title');
if (t) t.textContent = currentProductsType === 'meds' ? 'Новое лекарство' : 'Новый товар';
/* ===== ЗАДАЧА 1: живая надпись цен в окне нового товара/лекарства (по id из index.html) ===== */
const pl = document.getElementById('new-prices-label');
if (pl) pl.textContent = currentProductsType === 'meds' ? '💰 Цены в аптеках (необязательно)' : '💰 Цены в магазинах (необязательно)';
renderNewProductPricesBlock();
openModalEl('add-product-modal');
}
function closeAddProductModal() { haptic(20); closeModalEl('add-product-modal'); }
let selectCurrentCategory = 'all';
let selectTypeProductsCache = [];
let selectCurrentType = 'products';
function openSelectProductsModal() {
const listEl = document.getElementById('select-products-list');
listEl.innerHTML = '';
selectCurrentType = (typeof cartViewType !== 'undefined') ? cartViewType : 'products';
selectTypeProductsCache = db.products.filter(p => selectCurrentType === 'meds' ? isMedProduct(p) : !isMedProduct(p));
selectCurrentCategory = 'all';
const titleEl = document.getElementById('select-products-title');
if (titleEl) { titleEl.textContent = selectCurrentType === 'meds' ? 'ЛЕКАРСТВА' : 'ТОВАРЫ'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.25rem'; titleEl.style.letterSpacing = '1px'; }
const htmlSearch = document.getElementById('select-products-search-input');
if (htmlSearch) htmlSearch.value = '';
if (selectTypeProductsCache.length === 0) {
const emptyText = selectCurrentType === 'meds' ? 'У вас пока нет добавленных лекарств. <br>Перейдите во вкладку «Лекарства», чтобы добавить их.' : 'У вас пока нет добавленных товаров. <br>Перейдите во вкладку «Товары», чтобы добавить их.';
listEl.innerHTML = '<div style="text-align: center; padding: 1.25rem; color: #777;">' + emptyText + '</div>';
openModalEl('select-products-modal'); setTimeout(attachRipple, 50); return;
}
const activeCats = selectCurrentType === 'meds' ? medCategories : categories;
const sortedCats = activeCats.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
const catBarWrap = document.createElement('div');
catBarWrap.className = 'select-category-bar-wrap';
catBarWrap.style.cssText = 'display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.5rem;';
const catBar = document.createElement('div');
catBar.className = 'select-category-bar';
const arrowLeft = document.createElement('button');
arrowLeft.style.cssText = 'flex-shrink: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 0.375rem; padding: 0.25rem 0.375rem; cursor: pointer; font-size: 0.85rem; color: var(--text-color); line-height: 1;';
arrowLeft.innerHTML = '‹'; arrowLeft.title = 'Назад';
arrowLeft.onclick = () => catBar.scrollBy({ left: -200, behavior: 'smooth' });
const arrowRight = document.createElement('button');
arrowRight.style.cssText = arrowLeft.style.cssText;
arrowRight.innerHTML = '›'; arrowRight.title = 'Вперёд';
arrowRight.onclick = () => catBar.scrollBy({ left: 200, behavior: 'smooth' });
const allBtn = document.createElement('button');
allBtn.className = 'select-cat-btn active'; allBtn.textContent = 'Все'; allBtn.dataset.catId = 'all';
allBtn.onclick = () => selectCategoryFilter('all');
catBar.appendChild(allBtn);
sortedCats.forEach(cat => {
const btn = document.createElement('button');
btn.className = 'select-cat-btn'; btn.textContent = cat.name; btn.dataset.catId = cat.id;
btn.onclick = () => selectCategoryFilter(cat.id);
catBar.appendChild(btn);
});
catBarWrap.appendChild(arrowLeft); catBarWrap.appendChild(catBar); catBarWrap.appendChild(arrowRight);
listEl.appendChild(catBarWrap);
renderSelectProductsList('');
openModalEl('select-products-modal');
setTimeout(() => { attachRipple(); if (htmlSearch) htmlSearch.focus(); }, 100);
}
function selectCategoryFilter(catId) {
selectCurrentCategory = catId;
const bar = document.querySelector('.select-category-bar');
if (bar) {
bar.querySelectorAll('.select-cat-btn').forEach(b => b.classList.remove('active'));
const t = bar.querySelector('.select-cat-btn[data-cat-id="' + catId + '"]');
if (t) t.classList.add('active');
}
filterSelectProducts();
}
function filterSelectProducts() {
const si = document.getElementById('select-products-search-input') || document.getElementById('select-products-search');
renderSelectProductsList(si ? si.value.toLowerCase() : '');
}
function renderSelectProductsList(query) {
const listEl = document.getElementById('select-products-list');
const catBarWrap = listEl.querySelector('.select-category-bar-wrap');
if (!catBarWrap) { listEl.innerHTML = ''; return; }
while (catBarWrap.nextSibling) listEl.removeChild(catBarWrap.nextSibling);
let filtered = selectTypeProductsCache;
if (selectCurrentCategory !== 'all') filtered = filtered.filter(p => p.category === selectCurrentCategory);
if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
if (filtered.length === 0) {
const d = document.createElement('div');
d.style.cssText = 'text-align: center; padding: 1.25rem; color: #777;';
d.innerHTML = '<div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>Ничего не найдено';
listEl.appendChild(d); return;
}
filtered.forEach(prod => {
const inCart = db.cart.some(i => i.id === prod.id);
const cat = findCategoryById(prod.category);
const catIcon = cat ? (cat.icon || '📦') : '📦';
const best = getBestPrice(prod);
const card = document.createElement('div');
card.className = 'select-product-card';
const iconDiv = document.createElement('div');
iconDiv.className = 'select-product-icon';
if (prod.image) iconDiv.innerHTML = '<img src="' + escapeHtml(prod.image) + '" alt="" onerror="this.style.display=\'none\'">';
else iconDiv.innerHTML = catIcon;
const infoDiv = document.createElement('div');
infoDiv.className = 'select-product-info';
infoDiv.innerHTML = '<div class="select-product-name">' + escapeHtml(prod.name) + '</div><div class="select-product-cat">' + (cat ? escapeHtml(cat.name) : '') + '</div>' + (best ? '<div class="select-product-price">от ' + best.price + ' Р</div>' : '<div class="select-product-price" style="color: #999;">нет цены</div>');
card.appendChild(iconDiv); card.appendChild(infoDiv);
const actionDiv = document.createElement('div');
actionDiv.className = 'select-product-action';
if (inCart) actionDiv.innerHTML = '<span class="select-in-cart">✓ В корзине</span>';
else {
const btn = document.createElement('button');
btn.className = 'select-add-btn'; btn.textContent = '+';
btn.onclick = () => {
if (db.cart.some(i => i.id === prod.id)) { showToast('Уже в корзине'); return; }
db.cart.push({ id: prod.id, qty: 1, checked: false });
saveDB(); updateCartBadge(); flyToCartAnimation(btn); haptic(40);
const si = document.getElementById('select-products-search-input') || document.getElementById('select-products-search');
const q = si ? si.value.toLowerCase() : '';
setTimeout(() => { renderSelectProductsList(q); renderCart(); renderStoresComparison(); }, 400);
};
actionDiv.appendChild(btn);
}
card.appendChild(actionDiv);
listEl.appendChild(card);
});
setTimeout(attachRipple, 50);
}
function closeSelectProductsModal() { haptic(20); closeModalEl('select-products-modal'); }
function closeSelectModalOnOutside(e) { if (e.target.id === 'select-products-modal') closeSelectProductsModal(); }
function openAddStoreModal() {
document.getElementById('new-store-name').value = '';
document.getElementById('new-store-address').value = '';
tempStoreImage = '';
const prev = document.getElementById('new-store-preview');
const ph = document.getElementById('new-store-placeholder');
prev.src = ''; prev.style.display = 'none'; ph.style.display = 'block';
selectedNewStoreColor = presetColors[0];
document.getElementById('add-store-modal-title').textContent = 'Новый ' + getTypeText();
openModalEl('add-store-modal');
}
function closeAddStoreModal() { haptic(20); closeModalEl('add-store-modal'); }
function renderColorPicker(containerId, currentColor, onSelectCallback) {
const container = document.getElementById(containerId);
container.innerHTML = '';
presetColors.forEach(color => {
const circle = document.createElement('div');
circle.className = 'color-circle' + (color.toLowerCase() === String(currentColor).toLowerCase() ? ' selected' : '');
circle.style.backgroundColor = color;
circle.onclick = () => { container.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected')); circle.classList.add('selected'); onSelectCallback(color); };
container.appendChild(circle);
});
}
/* ===== ЗАДАЧА 3б: кружок цвета в карточке обновляется сразу при выборе ===== */
function selectCustomStoreColor(color, mode) {
if (mode === 'add') selectedNewStoreColor = color; else selectedEditStoreColor = color;
updateStoreColorIndicator(mode, color);
renderColorPicker('store-color-picker-grid', color, function (c) { if (mode === 'add') selectedNewStoreColor = c; else selectedEditStoreColor = c; updateStoreColorIndicator(mode, c); closeStoreColorModal(); });
}
function openStoreColorModal(mode) {
storeColorPickerMode = mode;
renderColorPicker('store-color-picker-grid', mode === 'add' ? selectedNewStoreColor : selectedEditStoreColor, function (color) { if (mode === 'add') selectedNewStoreColor = color; else selectedEditStoreColor = color; updateStoreColorIndicator(mode, color); closeStoreColorModal(); });
openModalEl('store-color-picker-modal');
}
function closeStoreColorModal() { haptic(20); closeModalEl('store-color-picker-modal'); }
function closeStoreColorModalOnOutside(e) { if (e.target.id === 'store-color-picker-modal') closeStoreColorModal(); }
function openStoreColorPopover(mode) { openStoreColorModal(mode); }
function updateStoreColorIndicator(mode, color) { const el = document.getElementById(mode + '-store-color-indicator'); if (el) el.style.backgroundColor = color; }
function openEditStoreModal(index) {
editingStoreIndex = index;
const storeObj = getCurrentStoresList()[index];
document.getElementById('edit-store-name').value = storeObj.name;
document.getElementById('edit-store-address').value = storeObj.address || '';
tempStoreImage = storeObj.image || '';
const prev = document.getElementById('edit-store-preview');
const ph = document.getElementById('edit-store-placeholder');
if (tempStoreImage) { prev.src = tempStoreImage; prev.style.display = 'block'; ph.style.display = 'none'; }
else { prev.src = ''; prev.style.display = 'none'; ph.style.display = 'block'; }
selectedEditStoreColor = storeObj.color || presetColors[0];
document.getElementById('edit-store-modal-title').textContent = 'Редактировать ' + getTypeText();
openModalEl('edit-store-modal');
}
function closeEditStoreModal() { haptic(20); closeModalEl('edit-store-modal'); }
function openModalEl(id) { const o = document.getElementById(id); if (!o) return; o.classList.add('showing'); void o.offsetWidth; o.classList.add('active'); setTimeout(attachRipple, 50); }
function closeModalEl(id) { const o = document.getElementById(id); if (!o) return; o.classList.remove('active'); setTimeout(() => o.classList.remove('showing'), 280); }