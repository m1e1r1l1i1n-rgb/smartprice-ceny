/* =============================================================
SmartPrice — modals.js (централизованное управление модалками)
ШАПКА КАРТОЧКИ ТОВАРА: название+крестик / категория /
слева фото, справа от фото — единица и «Редактировать» / лучшая цена.
============================================================= */

var storeColorPickerMode = 'add';
let activeModalId = null;

// === ФЛАГ ИЗМЕНЕНИЙ ===
window.__modalHasChanges = false;

function initModalChangeTracking(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.dataset.changeTracked) return;
    el.dataset.changeTracked = '1';
    el.addEventListener('input', () => { window.__modalHasChanges = true; });
    el.addEventListener('change', () => { window.__modalHasChanges = true; });
  });
}

// Глобальный слушатель выбора фото
document.addEventListener('change', function (e) {
  if (e.target && e.target.type === 'file' && e.target.files && e.target.files.length > 0) {
    window.__modalHasChanges = true;
  }
});

// === ЦЕНТРАЛЬНЫЙ РЕЕСТР МОДАЛОК ===
const modalRegistry = {
  'add-product-modal': {
    save: () => saveNewProduct(),
    close: () => closeModalEl('add-product-modal'),
    reset: () => resetAddProductForm(),
    hasChanges: () => window.__modalHasChanges || false
  },
  'edit-product-modal': {
    save: () => saveEditedProduct(),
    close: () => finishCloseEditProduct(),
    reset: () => resetEditProductForm(),
    hasChanges: () => window.__modalHasChanges || false
  },
  'add-store-modal': {
    save: () => addStore(),
    close: () => closeModalEl('add-store-modal'),
    reset: () => resetAddStoreForm(),
    hasChanges: () => window.__modalHasChanges || false
  },
  'edit-store-modal': {
    save: () => saveEditedStore(),
    close: () => closeModalEl('edit-store-modal'),
    reset: () => resetEditStoreForm(),
    hasChanges: () => window.__modalHasChanges || false
  }
};

// === УНИВЕРСАЛЬНЫЕ ФУНКЦИИ УПРАВЛЕНИЯ ===
function requestCloseModal(modalId) {
  const modal = modalRegistry[modalId];
  if (!modal) {
    closeModalEl(modalId);
    return;
  }
  if (modal.hasChanges()) {
    showUnsavedChangesPrompt(
      () => {
        window.__modalHasChanges = false;
        if (modal.save) modal.save();
      },
      () => {
        window.__modalHasChanges = false;
        if (modal.close) modal.close(); else closeModalEl(modalId);
      }
    );
  } else {
    if (modal.close) modal.close(); else closeModalEl(modalId);
  }
}

function saveAndCloseModal(modalId) {
  const modal = modalRegistry[modalId];
  if (!modal) return;
  window.__modalHasChanges = false;
  if (modal.save) modal.save();
}

function forceCloseModal(modalId) {
  closeModalEl(modalId);
}

function showUnsavedChangesPrompt(saveCallback, discardCallback) {
  if (document.getElementById('unsaved-prompt-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'unsaved-prompt-overlay';
  overlay.className = 'cart-confirm-overlay';
  overlay.innerHTML = `<div class="cart-confirm-box" style="text-align:center;">
    <div class="cart-confirm-title">Есть несохранённые изменения</div>
    <p style="font-size:0.9rem; color:#777; margin-bottom:1rem;">Что вы хотите сделать?</p>
    <button type="button" id="unsaved-save" style="background:var(--primary-color);color:#fff; font-size:1.05rem; padding:0.8rem; margin-bottom:0.5rem;">💾 Сохранить</button>
    <button type="button" id="unsaved-discard" style="background:var(--danger-color);color:#fff; font-size:1.05rem; padding:0.8rem; margin-bottom:0.5rem;">🗑 Закрыть без сохранения</button>
    <button type="button" id="unsaved-cancel" style="background:var(--border-color);color:var(--text-color); padding:0.8rem;">Отмена</button>
  </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#unsaved-cancel').onclick = close;
  overlay.querySelector('#unsaved-save').onclick = function () { close(); if (saveCallback) saveCallback(); };
  overlay.querySelector('#unsaved-discard').onclick = function () { close(); if (discardCallback) discardCallback(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// === ПЕРЕСТРОЙКА ШАПКИ КАРТОЧКИ ТОВАРА (версия 2) ===
// Название+крестик / категория / фото слева + колонка справа (единица, редактировать) / лучшая цена снизу.
function restructureProductModalTop() {
  const top = document.querySelector('#product-modal .product-modal-top');
  if (!top || top.dataset.pmLayout === '2') return;
  const closeBtn = top.querySelector('.close-modal-btn');
  const img = document.getElementById('modal-prod-img');
  const name = document.getElementById('modal-prod-name');
  const cat = document.getElementById('modal-prod-info-cat');
  const unit = document.getElementById('modal-prod-info-unit');
  const pencil = top.querySelector('.product-modal-pencil-row') || top.querySelector('.pm-pencil-row');
  const best = document.getElementById('modal-prod-info-best');
  if (!name || !cat || !unit || !pencil || !best || !img || !closeBtn) return;

  top.dataset.pmLayout = '2';

  const nameRow = document.createElement('div');
  nameRow.className = 'pm-row pm-name-row';
  const catRow = document.createElement('div');
  catRow.className = 'pm-row pm-cat-row';
  const sideCol = document.createElement('div');
  sideCol.className = 'pm-side-col';
  const unitCell = document.createElement('div');
  unitCell.className = 'pm-unit-cell';

  nameRow.appendChild(name);
  nameRow.appendChild(closeBtn);
  catRow.appendChild(cat);
  unitCell.appendChild(unit);
  pencil.classList.add('pm-pencil-row');
  sideCol.appendChild(unitCell);
  sideCol.appendChild(pencil);
  best.classList.add('pm-row', 'pm-best-row');

  top.innerHTML = '';
  top.appendChild(nameRow);
  top.appendChild(catRow);
  top.appendChild(img);
  top.appendChild(sideCol);
  top.appendChild(best);
}

// === ФУНКЦИИ СБРОСА ФОРМ ===
function resetAddProductForm() {
  tempImage = '';
  const prev = document.getElementById('new-prod-preview');
  const ph = document.getElementById('new-prod-placeholder');
  if (prev) { prev.src = ''; prev.style.display = 'none'; }
  if (ph) ph.style.display = 'block';
  const nameInput = document.getElementById('new-name');
  if (nameInput) nameInput.value = '';
  const catSelect = document.getElementById('new-category');
  if (catSelect) {
    catSelect.innerHTML = getActiveCategories().map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
  }
  const u = document.getElementById('new-unit');
  if (u) u.innerHTML = getActiveUnits().map(x => '<option value="' + x + '">' + x + '</option>').join('');
  const t = document.getElementById('add-prod-title');
  if (t) t.textContent = currentProductsType === 'meds' ? 'Новое лекарство' : 'Новый товар';
  const pl = document.getElementById('new-prices-label');
  if (pl) pl.textContent = currentProductsType === 'meds' ? '💰 Цены в аптеках (необязательно)' : '💰 Цены в магазинах (необязательно)';
  renderNewProductPricesBlock();
}

function resetEditProductForm() {
  tempEditProductImage = '';
  const prev = document.getElementById('edit-prod-preview');
  const ph = document.getElementById('edit-prod-placeholder');
  if (prev) { prev.src = ''; prev.style.display = 'none'; }
  if (ph) ph.style.display = 'block';
  const nameInput = document.getElementById('edit-name');
  if (nameInput) nameInput.value = '';
  const catSelect = document.getElementById('edit-category');
  if (catSelect) catSelect.innerHTML = '';
  const u = document.getElementById('edit-unit');
  if (u) u.innerHTML = '';
}

function resetAddStoreForm() {
  const n = document.getElementById('new-store-name');
  if (n) n.value = '';
  const a = document.getElementById('new-store-address');
  if (a) a.value = '';
  tempStoreImage = '';
  const prev = document.getElementById('new-store-preview');
  const ph = document.getElementById('new-store-placeholder');
  if (prev) { prev.src = ''; prev.style.display = 'none'; }
  if (ph) ph.style.display = 'block';
  selectedNewStoreColor = presetColors[0];
}

function resetEditStoreForm() {
  tempStoreImage = '';
  const prev = document.getElementById('edit-store-preview');
  const ph = document.getElementById('edit-store-placeholder');
  if (prev) { prev.src = ''; prev.style.display = 'none'; }
  if (ph) ph.style.display = 'block';
  const n = document.getElementById('edit-store-name');
  if (n) n.value = '';
  const a = document.getElementById('edit-store-address');
  if (a) a.value = '';
}

// === ДАТЫ И ВОЗРАСТ ЦЕНЫ ===
function parseDisplayDate(ds) {
  const m = String(ds || '').match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (!m) return null;
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  const month = parseInt(m[2], 10) - 1;
  const day = parseInt(m[1], 10);
  const tm = String(ds).match(/(\d{1,2}):(\d{2})/);
  const d = new Date(year, month, day, tm ? parseInt(tm[1], 10) : 0, tm ? parseInt(tm[2], 10) : 0);
  return isNaN(d.getTime()) ? null : d;
}

function getPriceAgeDays(prod, storeName) {
  const hist = (prod.priceHistory && prod.priceHistory[storeName]) || [];
  const last = hist.length ? hist[hist.length - 1] : null;
  let dateObj = null;
  if (last && last.iso) dateObj = new Date(last.iso);
  if (!dateObj || isNaN(dateObj.getTime())) {
    const ds = (last && last.date) || (prod.dates && prod.dates[storeName]) || '';
    dateObj = parseDisplayDate(ds);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  return Math.floor((Date.now() - dateObj.getTime()) / 86400000);
}

function formatShortDate(ds) {
  const m = String(ds || '').match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (!m) return '';
  let yy = m[3];
  if (yy.length === 4) yy = yy.slice(2);
  return m[1] + '.' + m[2] + '.' + yy;
}

function pluralDays(n) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'дней';
  if (b > 1 && b < 5) return 'дня';
  if (b === 1) return 'день';
  return 'дней';
}

function getDateChipBorder(ageDays) {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (ageDays === null || ageDays === undefined || isNaN(ageDays)) return dark ? '#808080' : '#64748B';
  if (ageDays > 30) return dark ? '#D97706' : '#D96C00';
  if (ageDays > 7) return dark ? '#C9A227' : '#D4A017';
  return dark ? '#808080' : '#64748B';
}

// === ПОДСКАЗКА ПЛАШКИ ДАТЫ (растёт вверх при удержании) ===
let dateHintEl = null;

function showDateHint(anchorEl, text) {
  hideDateHint();
  const r = anchorEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = 'position:fixed;z-index:14000;background:rgba(0,0,0,0.9);color:#fff;font-size:0.72rem;font-weight:700;padding:0.35rem 0.6rem;border-radius:0.45rem;pointer-events:none;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis;opacity:0;transform:translate(-50%,4px) scale(0.6);transform-origin:bottom center;transition:transform 0.18s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease;';
  document.body.appendChild(el);
  const left = Math.min(Math.max(r.left + r.width / 2, 70), window.innerWidth - 70);
  el.style.left = left + 'px';
  el.style.top = (r.top - 6) + 'px';
  requestAnimationFrame(function () {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,-100%) scale(1)';
  });
  dateHintEl = el;
}

function hideDateHint() {
  if (!dateHintEl) return;
  const el = dateHintEl;
  dateHintEl = null;
  el.style.opacity = '0';
  el.style.transform = 'translate(-50%,-100%) scale(0.6)';
  setTimeout(function () { el.remove(); }, 200);
}

function attachDateChipBehavior(chipEl, prodId, storeName, hintText) {
  let timer = null;
  let hintShown = false;
  let sx = 0, sy = 0;

  chipEl.addEventListener('pointerdown', function (e) {
    sx = e.clientX; sy = e.clientY;
    hintShown = false;
    timer = setTimeout(function () {
      timer = null;
      hintShown = true;
      showDateHint(chipEl, hintText);
      if (typeof haptic === 'function') haptic(15);
    }, 280);
  });

  chipEl.addEventListener('pointermove', function (e) {
    if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) {
      clearTimeout(timer);
      timer = null;
    }
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    chipEl.addEventListener(ev, function () {
      if (timer) { clearTimeout(timer); timer = null; }
      if (hintShown) {
        hideDateHint();
        hintShown = false;
        chipEl.dataset.suppressClick = '1';
        setTimeout(function () { delete chipEl.dataset.suppressClick; }, 350);
      }
    });
  });

  chipEl.addEventListener('click', function (e) {
    e.stopPropagation();
    if (chipEl.dataset.suppressClick) return;
    showPriceHistory(prodId, storeName);
  });
}

// === GPS-ОШИБКИ ===
function openGpsErrorModal(errorCode) {
  const titleEl = document.getElementById('gps-error-title');
  const messageEl = document.getElementById('gps-error-message');
  const instructionEl = document.getElementById('gps-error-instruction');
  let title = 'Нет доступа к геолокации';
  let message = 'Разрешите доступ к местоположению в настройках телефона, чтобы использовать эту функцию.';
  let instruction = '<strong>Как разрешить доступ:</strong><ol><li>Откройте <b>Настройки</b> телефона</li><li>Перейдите в <b>Приложения</b> → ваш браузер</li><li>Нажмите <b>Разрешения</b> → <b>Местоположение</b></li><li>Выберите <b>«Разрешить»</b></li></ol>';
  if (errorCode === 1) {
    title = 'Доступ к геолокации запрещён';
    message = 'Вы запретили доступ к местоположению. Разрешите его в настройках телефона, чтобы использовать GPS.';
  } else if (errorCode === 2) {
    title = 'GPS недоступен';
    message = 'Не удалось определить местоположение. Проверьте, включён ли GPS и есть ли сигнал.';
    instruction = '<strong>Что проверить:</strong><ol><li>Включите <b>Геолокацию / GPS</b></li><li>Выйдите на открытое пространство</li><li>Проверьте интернет</li><li>Перезагрузите браузер</li></ol>';
  } else if (errorCode === 3) {
    title = 'Превышено время ожидания';
    message = 'GPS не смог определить местоположение за отведённое время. Попробуйте ещё раз.';
    instruction = '<strong>Советы:</strong><ol><li>Выйдите на открытое пространство</li><li>Включите Wi-Fi для точности</li><li>Перезагрузите GPS</li><li>Нажмите кнопку GPS ещё раз</li></ol>';
  }
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (instructionEl) instructionEl.innerHTML = instruction;
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
    for (const scheme of schemes) {
      try {
        const link = document.createElement('a');
        link.href = scheme;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 1000);
        opened = true;
        break;
      } catch (e) { continue; }
    }
  } else if (isIOS) {
    try { window.location.href = 'App-Prefs:root=General'; opened = true; } catch (e) {}
  }
  if (!opened && typeof showToast === 'function') showToast('📱 Откройте Настройки → Приложения → ваш браузер → Разрешения');
  closeGpsErrorModal();
}

// === МОДАЛКА КАТЕГОРИИ ===
function updateCategoryModalViewIcon() {
  const el = document.getElementById('category-modal-view-icon');
  if (el) el.innerHTML = db.settings.categoryModalViewMode === 'grid' ? ICON_LIST : ICON_GRID;
}

function toggleCategoryModalViewMode() {
  db.settings.categoryModalViewMode = (db.settings.categoryModalViewMode === 'grid') ? 'list' : 'grid';
  saveDB();
  updateCategoryModalViewIcon();
  if (currentCategoryModalCatId) renderCategoryModalContent(currentCategoryModalCatId);
}

function renderCategoryModalContent(catId) {
  const listEl = document.getElementById('category-modal-products');
  if (!listEl) return;
  listEl.innerHTML = '';
  const prods = db.products.filter(p => p.category === catId);

  if (prods.length === 0) {
    listEl.innerHTML = '<div style="text-align: center; padding: 1.25rem; color: #777;">В этой группе пока нет товаров</div>';
    return;
  }

  if (db.settings.categoryModalViewMode === 'grid') {
    listEl.style.display = 'grid';
    listEl.className = 'cat-modal-grid';
    listEl.style.gap = '0.5rem';
    prods.forEach(prod => {
      const best = getBestPrice(prod);
      const tile = document.createElement('div');
      tile.className = 'cat-modal-tile';
      tile.onclick = () => { closeCategoryModal(); openProductModal(prod.id); };
      tile.innerHTML = '<img src="' + escapeHtml(prod.image || '') + '" alt="" onerror="this.style.background=\'var(--bg-color)\'">' +
        '<div class="tile-prod-name">' + escapeHtml(prod.name) + '</div>' +
        '<div class="tile-prod-price">' + (best ? 'Лучшая: ' + best.price + ' Р' : 'нет цены') + '</div>' +
        (best ? '<div class="tile-prod-store">📍 ' + escapeHtml(best.store) + '</div>' : '');
      listEl.appendChild(tile);
    });
  } else {
    listEl.style.display = 'flex';
    listEl.style.flexDirection = 'column';
    listEl.style.gap = '0.5rem';
    prods.forEach(prod => {
      const best = getBestPrice(prod);
      const cat = findCategoryById(prod.category);
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 0.5rem; cursor: pointer;';
      item.onclick = () => { closeCategoryModal(); openProductModal(prod.id); };

      const img = document.createElement('img');
      img.src = prod.image || '';
      img.className = 'prod-list-img';
      img.onerror = function () { this.style.background = 'var(--border-color)'; };
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        if (prod.image) openFullscreenPhoto(prod.image);
      });

      const info = document.createElement('div');
      info.style.cssText = 'min-width: 0;';
      info.innerHTML = '<div class="prod-list-name">' + escapeHtml(prod.name) + '</div>' +
        '<div class="prod-list-cat">Категория: ' + (cat ? escapeHtml(cat.name) : '—') + ' · Ед: ' + escapeHtml(prod.unit) + '</div>' +
        '<div style="margin-top: 0.125rem;">' + (best ? '<span class="prod-list-price-label">Лучшая цена: </span><span class="prod-list-store">' + best.price + ' Р · ' + escapeHtml(best.store) + '</span>' : '<span style="color: #999; font-size: 0.85rem;">Цены не указаны</span>') + '</div>';

      const left = document.createElement('div');
      left.style.cssText = 'display: flex; align-items: center; gap: 0.625rem; flex: 1; min-width: 0;';
      left.appendChild(img);
      left.appendChild(info);

      const arrow = document.createElement('span');
      arrow.style.cssText = 'color: var(--primary-color); flex-shrink: 0;';
      arrow.textContent = '→';

      item.appendChild(left);
      item.appendChild(arrow);
      listEl.appendChild(item);
    });
  }
}

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

// === ПАЛИТРЫ ЦВЕТОВ ===
function renderColorPicker(containerId, currentColor, onSelectCallback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  presetColors.forEach(color => {
    const circle = document.createElement('div');
    circle.className = 'color-circle' + (color.toLowerCase() === String(currentColor).toLowerCase() ? ' selected' : '');
    circle.style.backgroundColor = color;
    circle.onclick = () => {
      container.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
      circle.classList.add('selected');
      onSelectCallback(color);
    };
    container.appendChild(circle);
  });
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

// === КАРТОЧКА ТОВАРА ===
function openProductModal(id) {
  restructureProductModalTop();
  hideDateHint();
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
  document.getElementById('modal-prod-info-best').innerHTML = best
    ? 'Лучшая цена: ' + best.price + ' Р <span style="color: var(--success-color); font-weight: 800;">· ' + escapeHtml(best.store) + '</span>'
    : 'Лучшая цена: —';

  const pricesHeader = document.querySelector('#product-modal h4');
  if (pricesHeader) pricesHeader.textContent = isMedProduct(prod) ? 'Цены в аптеках' : 'Цены в магазинах';

  const pricesList = document.getElementById('modal-prices-list');
  pricesList.innerHTML = '';

  getStoresForProduct(prod).forEach(storeObj => {
    const storeName = storeObj.name;
    const storeColor = storeObj.color || '#00875a';
    const rawPrice = (prod.prices && prod.prices[storeName] !== undefined) ? prod.prices[storeName] : '';
    const pVal = (rawPrice === '' || rawPrice === null || rawPrice === 0) ? '' : rawPrice;
    const pDate = (prod.dates && prod.dates[storeName]) ? prod.dates[storeName] : '';
    const isBest = best && best.store === storeName && parseFloat(pVal) === best.price;
    const isWorst = worst && worst.store === storeName && parseFloat(pVal) === worst.price && best.price !== worst.price;
    const worstStyle = isWorst ? 'color: var(--danger-color); font-weight: 700;' : '';

    const ageDays = getPriceAgeDays(prod, storeName);
    const chipBorder = getDateChipBorder(ageDays);
    const shortDate = formatShortDate(pDate);
    let hintText;
    if (!pDate && ageDays === null) hintText = 'Дата не указана';
    else if (ageDays === null) hintText = 'Цена от ' + pDate;
    else if (ageDays <= 0) hintText = 'Цена установлена сегодня';
    else hintText = 'Цена от ' + (pDate || '—') + ' · ' + ageDays + ' ' + pluralDays(ageDays) + ' назад';

    const row = document.createElement('div');
    row.className = 'card';
    row.style.cssText = 'margin-bottom: 0.5rem; padding: 0.625rem;';

    row.innerHTML = '<div class="store-row-header" style="display:flex;align-items:center;gap:.5rem;">' +
      '<div class="store-row-left" style="display:flex;align-items:center;gap:.5rem;flex:1;min-width:0;">' +
      '<div class="store-icon-box" style="background-color:' + escapeHtml(storeColor) + ';width:1.5rem;height:1.5rem;border-radius:.375rem;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>' +
      '</div>' +
      '<div class="store-name" title="Открыть историю цен" style="cursor:pointer;' + (isBest ? 'color: var(--success-color);' : (isWorst ? 'color: var(--danger-color);' : '')) + '">' + escapeHtml(storeName) + '</div>' +
      '</div>' +
      '<button type="button" class="store-date-chip" style="display:inline-flex;align-items:center;gap:.3rem;padding:.3rem .55rem;background:var(--btn-secondary-bg);border:2px solid ' + chipBorder + ';border-radius:.45rem;font-size:.72rem;font-weight:600;color:var(--text-color);flex-shrink:0;cursor:pointer;font-family:inherit;line-height:1.2;">🕘 ' + (shortDate || '—') + '</button>' +
      '<div class="price-input-wrap">' +
      '<input type="number" value="' + escapeHtml(pVal) + '" placeholder="0" data-full-value="' + escapeHtml(pVal) + '" style="width: 5rem; margin: 0; padding: 0.375rem 0.25rem 0.375rem 0.5rem; text-align: right; font-weight: bold; font-size: 1.06rem; ' + (isBest ? 'color: var(--success-color);' : '') + ' ' + worstStyle + '">' +
      '<span class="price-currency" style="' + (isBest ? 'color: var(--success-color);' : '') + ' ' + worstStyle + '">Р</span>' +
      '</div>' +
      '</div>';

    const wrap = row.querySelector('.price-input-wrap');
    const input = wrap.querySelector('input');
    const nameEl = row.querySelector('.store-name');
    const chipEl = row.querySelector('.store-date-chip');

    nameEl.addEventListener('click', function (e) {
      e.stopPropagation();
      showPriceHistory(prod.id, storeName);
    });

    attachDateChipBehavior(chipEl, prod.id, storeName, hintText);

    input.addEventListener('input', function () { debouncedUpdatePrice(prod.id, storeName, input.value); });
    input.addEventListener('click', function (e) { e.stopPropagation(); showFullPriceTooltip(wrap); });

    pricesList.appendChild(row);
  });

  openModalEl('product-modal');
  setTimeout(attachRipple, 50);
}

function closeModal() {
  hideDateHint();
  haptic(20);
  closeModalEl('product-modal');
  renderProducts();
  renderCart();
  renderStoresComparison();
}
function closeModalOnOutside(e) { if (e.target.id === 'product-modal') closeModal(); }

function showPriceHistory(prodId, storeName) {
  hideDateHint();
  const prod = db.products.find(p => p.id === prodId);
  if (!prod) return;
  document.getElementById('history-modal-title').innerText = 'История цен: ' + storeName + ' (' + prod.name + ')';
  const hc = document.getElementById('history-modal-content');
  hc.innerHTML = '';
  const history = (prod.priceHistory && prod.priceHistory[storeName]) ? prod.priceHistory[storeName] : [];
  if (!history.length) {
    hc.innerHTML = '<div style="text-align: center; color: #777; padding: 0.93rem;">История изменений пока пуста</div>';
  } else {
    history.slice().reverse().forEach(entry => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 0.5rem;';
      row.innerHTML = '<span style="font-size: 0.8rem; color: #777;">' + escapeHtml(entry.date) + '</span><span style="font-weight: bold; font-size: 0.93rem; color: var(--primary-color);">' + entry.price + ' Р</span>';
      hc.appendChild(row);
    });
  }
  openModalEl('price-history-modal');
}

function closeHistoryModal() { haptic(20); closeModalEl('price-history-modal'); }
function closeHistoryModalOnOutside(e) { if (e.target.id === 'price-history-modal') closeHistoryModal(); }

// === РЕДАКТИРОВАНИЕ ТОВАРА ===
function openEditProductModal(prodId) {
  const prod = db.products.find(p => p.id === prodId);
  if (!prod) return;
  window.__modalHasChanges = false;
  editingProductId = prodId;
  tempEditProductImage = prod.image || '';

  document.getElementById('edit-name').value = prod.name;
  const catSelect = document.getElementById('edit-category');
  catSelect.innerHTML = getCategoriesForProduct(prod).map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
  catSelect.value = prod.category;

  const unitSelect = document.getElementById('edit-unit');
  if (unitSelect) {
    unitSelect.innerHTML = getUnitsForProduct(prod).map(u => '<option value="' + u + '">' + u + '</option>').join('');
    unitSelect.value = prod.unit;
  }

  const t = document.getElementById('edit-product-modal-title');
  if (t) t.textContent = isMedProduct(prod) ? 'Редактировать лекарство' : 'Редактировать товар';

  const prev = document.getElementById('edit-prod-preview');
  const ph = document.getElementById('edit-prod-placeholder');
  if (tempEditProductImage) { prev.src = tempEditProductImage; prev.style.display = 'block'; ph.style.display = 'none'; }
  else { prev.src = ''; prev.style.display = 'none'; ph.style.display = 'block'; }

  closeModalEl('product-modal');
  openModalEl('edit-product-modal');
  initModalChangeTracking('edit-product-modal');
}

function finishCloseEditProduct() {
  closeModalEl('edit-product-modal');
  editingProductId = null;
  tempEditProductImage = '';
  if (currentModalProductId) openProductModal(currentModalProductId);
}

function closeEditProductModal() {
  requestCloseModal('edit-product-modal');
}

// === ОТКРЫТИЕ/ЗАКРЫТИЕ ЧЕРЕЗ РЕЕСТР ===
function openAddProductModal() {
  window.__modalHasChanges = false;
  resetAddProductForm();
  openModalEl('add-product-modal');
  initModalChangeTracking('add-product-modal');
}
function closeAddProductModal() {
  requestCloseModal('add-product-modal');
}

function openAddStoreModal() {
  window.__modalHasChanges = false;
  resetAddStoreForm();
  const t = document.getElementById('add-store-modal-title');
  if (t) t.textContent = 'Новый ' + getTypeText();
  openModalEl('add-store-modal');
  initModalChangeTracking('add-store-modal');
}
function closeAddStoreModal() {
  requestCloseModal('add-store-modal');
}

function openEditStoreModal(index) {
  window.__modalHasChanges = false;
  editingStoreIndex = index;
  const storeObj = getCurrentStoresList()[index];
  if (!storeObj) return;
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
  initModalChangeTracking('edit-store-modal');
}
function closeEditStoreModal() {
  requestCloseModal('edit-store-modal');
}

// === ВЫБОР ТОВАРОВ ===
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
  if (titleEl) {
    titleEl.textContent = selectCurrentType === 'meds' ? 'ЛЕКАРСТВА' : 'ТОВАРЫ';
    titleEl.style.textAlign = 'center';
    titleEl.style.fontSize = '1.25rem';
    titleEl.style.letterSpacing = '1px';
  }

  const htmlSearch = document.getElementById('select-products-search-input');
  if (htmlSearch) htmlSearch.value = '';

  if (selectTypeProductsCache.length === 0) {
    const emptyText = selectCurrentType === 'meds'
      ? 'У вас пока нет добавленных лекарств. <br>Перейдите во вкладку «Лекарства», чтобы добавить их.'
      : 'У вас пока нет добавленных товаров. <br>Перейдите во вкладку «Товары», чтобы добавить их.';
    listEl.innerHTML = '<div style="text-align: center; padding: 1.25rem; color: #777;">' + emptyText + '</div>';
    openModalEl('select-products-modal');
    setTimeout(attachRipple, 50);
    return;
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
  arrowLeft.innerHTML = '‹';
  arrowLeft.title = 'Назад';
  arrowLeft.onclick = () => catBar.scrollBy({ left: -200, behavior: 'smooth' });

  const arrowRight = document.createElement('button');
  arrowRight.style.cssText = arrowLeft.style.cssText;
  arrowRight.innerHTML = '›';
  arrowRight.title = 'Вперёд';
  arrowRight.onclick = () => catBar.scrollBy({ left: 200, behavior: 'smooth' });

  const allBtn = document.createElement('button');
  allBtn.className = 'select-cat-btn active';
  allBtn.textContent = 'Все';
  allBtn.dataset.catId = 'all';
  allBtn.onclick = () => selectCategoryFilter('all');
  catBar.appendChild(allBtn);

  sortedCats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'select-cat-btn';
    btn.textContent = cat.name;
    btn.dataset.catId = cat.id;
    btn.onclick = () => selectCategoryFilter(cat.id);
    catBar.appendChild(btn);
  });

  catBarWrap.appendChild(arrowLeft);
  catBarWrap.appendChild(catBar);
  catBarWrap.appendChild(arrowRight);
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
    listEl.appendChild(d);
    return;
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
    infoDiv.innerHTML = '<div class="select-product-name">' + escapeHtml(prod.name) + '</div>' +
      '<div class="select-product-cat">' + (cat ? escapeHtml(cat.name) : '') + '</div>' +
      (best ? '<div class="select-product-price">от ' + best.price + ' Р</div>' : '<div class="select-product-price" style="color: #999;">нет цены</div>');

    card.appendChild(iconDiv);
    card.appendChild(infoDiv);

    const actionDiv = document.createElement('div');
    actionDiv.className = 'select-product-action';
    if (inCart) {
      actionDiv.innerHTML = '<span class="select-in-cart">✓ В корзине</span>';
    } else {
      const btn = document.createElement('button');
      btn.className = 'select-add-btn';
      btn.textContent = '+';
      btn.onclick = () => {
        if (db.cart.some(i => i.id === prod.id)) { if (typeof showToast === 'function') showToast('Уже в корзине'); return; }
        db.cart.push({ id: prod.id, qty: 1, checked: false });
        saveDB();
        updateCartBadge();
        flyToCartAnimation(btn);
        haptic(40);
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

// === ЦВЕТА МАГАЗИНОВ ===
function selectCustomStoreColor(color, mode) {
  if (mode === 'add') selectedNewStoreColor = color; else selectedEditStoreColor = color;
  updateStoreColorIndicator(mode, color);
  renderColorPicker('store-color-picker-grid', color, function (c) {
    if (mode === 'add') selectedNewStoreColor = c; else selectedEditStoreColor = c;
    updateStoreColorIndicator(mode, c);
    closeStoreColorModal();
  });
}

function openStoreColorModal(mode) {
  storeColorPickerMode = mode;
  renderColorPicker('store-color-picker-grid', mode === 'add' ? selectedNewStoreColor : selectedEditStoreColor, function (color) {
    if (mode === 'add') selectedNewStoreColor = color; else selectedEditStoreColor = color;
    updateStoreColorIndicator(mode, color);
    closeStoreColorModal();
  });
  openModalEl('store-color-picker-modal');
}

function closeStoreColorModal() { haptic(20); closeModalEl('store-color-picker-modal'); }
function closeStoreColorModalOnOutside(e) { if (e.target.id === 'store-color-picker-modal') closeStoreColorModal(); }
function openStoreColorPopover(mode) { openStoreColorModal(mode); }
function updateStoreColorIndicator(mode, color) {
  const el = document.getElementById(mode + '-store-color-indicator');
  if (el) el.style.backgroundColor = color;
}

// === ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛОК И СВАЙПЫ ===
function openModalEl(id) {
  const o = document.getElementById(id);
  if (!o) return;
  activeModalId = id;
  try { history.pushState({ modal: id }, '', window.location.href); } catch (e) {}
  o.classList.add('showing');
  void o.offsetWidth;
  o.classList.add('active');
  setTimeout(attachRipple, 50);
}

function closeModalEl(id) {
  const o = document.getElementById(id);
  if (!o) return;
  o.classList.remove('active');
  setTimeout(() => {
    o.classList.remove('showing');
    if (activeModalId === id) {
      activeModalId = null;
      try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
    }
  }, 280);
}

window.addEventListener('popstate', function (event) {
  const promptEl = document.getElementById('unsaved-prompt-overlay');
  if (promptEl) {
    promptEl.remove();
    try { history.pushState(null, '', window.location.href); } catch (e) {}
    return;
  }
  if (activeModalId) {
    requestCloseModal(activeModalId);
    try { history.pushState(null, '', window.location.href); } catch (e) {}
  }
});

window.addEventListener('load', function () {
  try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
});

let modalSwipeStartX = 0;
let modalSwipeStartY = 0;

document.addEventListener('touchstart', function (e) {
  if (!activeModalId) return;
  if (e.touches[0].clientX < 30 || e.touches[0].clientX > window.innerWidth - 30) return;
  modalSwipeStartX = e.touches[0].clientX;
  modalSwipeStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', function (e) {
  if (!activeModalId || modalSwipeStartX === 0) return;
  const diffX = e.changedTouches[0].clientX - modalSwipeStartX;
  const diffY = e.changedTouches[0].clientY - modalSwipeStartY;
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
    requestCloseModal(activeModalId);
  }
  modalSwipeStartX = 0;
  modalSwipeStartY = 0;
}, { passive: true });