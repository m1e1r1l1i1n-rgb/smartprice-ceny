/* =============================================================
SmartPrice — stores.js
Магазины и аптеки. Использует escapeHtml и compressImage из utils.js.
Добавлен haptic() при действиях. Режим работы (расписание) удалён.
ИСПРАВЛЕНО:
добавлена отсутствовавшая updateStoreNameCounter (счётчик 0/50);
дубликаты имён проверяются без учёта регистра;
координаты из адреса разбираются корректно (точка экранирована,
диапазоны широты/долготы проверяются);
кнопки и фото в списке подключаются через код, без inline-строк;
красивые пустые состояния для списка магазинов/аптек.
============================================================= */
function injectStoresUpgradeStyles() {
    if (window.__storesUpgradeStylesAdded) return;
    window.__storesUpgradeStylesAdded = true;
    // Стили перенесены в ui-fixes.css
}
function showStoreAlert(message, title) {
    injectStoresUpgradeStyles();
    const overlay = document.createElement('div');
    overlay.className = 'store-confirm-overlay';
    overlay.innerHTML = `<div class="store-confirm-box"><div class="store-confirm-header"><div class="store-confirm-title">${escapeHtml(title || 'Информация')}</div><button type="button" class="store-confirm-close">✕</button></div><div class="store-confirm-text">${escapeHtml(message)}</div><div class="store-confirm-buttons"><button type="button" class="store-confirm-ok green">Понятно</button></div></div>`;
    document.body.appendChild(overlay);
    function closeOverlay() { overlay.remove(); }
    overlay.querySelector('.store-confirm-close').onclick = closeOverlay;
    overlay.querySelector('.store-confirm-ok').onclick = closeOverlay;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
}
function showStoreConfirm(message, onConfirm, confirmText) {
    injectStoresUpgradeStyles();
    const overlay = document.createElement('div');
    overlay.className = 'store-confirm-overlay';
    overlay.innerHTML = `<div class="store-confirm-box"><div class="store-confirm-header"><div class="store-confirm-title">Подтверждение</div><button type="button" class="store-confirm-close">✕</button></div><div class="store-confirm-text">${escapeHtml(message)}</div><div class="store-confirm-buttons"><button type="button" class="store-confirm-cancel">Отмена</button><button type="button" class="store-confirm-ok">${escapeHtml(confirmText || 'Подтвердить')}</button></div></div>`;
    document.body.appendChild(overlay);
    function closeOverlay() { overlay.remove(); }
    overlay.querySelector('.store-confirm-close').onclick = closeOverlay;
    overlay.querySelector('.store-confirm-cancel').onclick = closeOverlay;
    overlay.querySelector('.store-confirm-ok').onclick = function () { closeOverlay(); if (typeof onConfirm === 'function') onConfirm(); };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
}
/* ---------- Счётчик символов названия (раньше функции не было) ---------- */
function updateStoreNameCounter(mode) {
    const input = document.getElementById(mode === 'add' ? 'new-store-name' : 'edit-store-name');
    const counter = document.getElementById(mode === 'add' ? 'add-store-name-counter' : 'edit-store-name-counter');
    if (!input || !counter) return;
    counter.textContent = (input.value || '').length + '/50';
}
/* ---------- Проверка дубликата имени без учёта регистра ---------- */
function isDuplicateStoreName(list, name, excludeObj) {
    const clean = String(name || '').toLowerCase();
    return list.some(function (s) {
        if (excludeObj && s === excludeObj) return false;
        return String(s.name || '').toLowerCase() === clean;
    });
}
let storesSearchQuery = '';
function injectStoresSearch() {
    const header = document.querySelector('#page-stores .stores-sticky-header') || document.querySelector('.stores-sticky-header');
    if (!header) return;
    const placeholderText = (typeof currentStoresType !== 'undefined' && currentStoresType === 'pharmacies') ? 'Поиск аптек...' : 'Поиск магазинов...';
    const existingInput = document.getElementById('stores-search-input');
    if (existingInput) { existingInput.placeholder = placeholderText; return; }
    const wrap = document.createElement('div');
    wrap.className = 'search-input-wrap stores-search-wrap';
    wrap.innerHTML = `<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" id="stores-search-input" placeholder="${placeholderText}" style="margin: 0; width: 100%; padding-left: 2.25rem; padding-right: 2.5rem; box-sizing: border-box;"><button class="voice-search-btn" data-target="stores-search-input" title="Голосовой поиск"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></button>`;
    header.appendChild(wrap);
    const input = document.getElementById('stores-search-input');
    if (input) {
        input.addEventListener('input', function () {
            storesSearchQuery = this.value;
            renderStores();
        });
    }
}
function injectStoresMapButton() {
    const header = document.querySelector('#page-stores .stores-sticky-header') || document.querySelector('.stores-sticky-header');
    if (!header) return;
    const mapBtnText = (typeof currentStoresType !== 'undefined' && currentStoresType === 'pharmacies') ? '🗺️ Карта аптек' : '🗺️ Карта магазинов';
    let btn = document.getElementById('stores-map-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'stores-map-btn';
        btn.type = 'button';
        btn.onclick = function () { openStoresMapModal(); };
        header.appendChild(btn);
    }
    btn.innerHTML = mapBtnText;
    arrangeStoresActionsRow();
}
function arrangeStoresActionsRow() {
    const header = document.querySelector('#page-stores .stores-sticky-header') || document.querySelector('.stores-sticky-header');
    if (!header) return;
    const mapBtn = document.getElementById('stores-map-btn');
    if (!mapBtn) return;
    let addBtn = header.querySelector('button[onclick^="openAddStoreModal"]');
    if (!addBtn) addBtn = header.querySelector('.add-product-cart-btn');
    if (!addBtn) {
        const cands = Array.prototype.slice.call(header.querySelectorAll('button')).filter(function (b) {
            return b.id !== 'stores-map-btn' && !b.classList.contains('ptype-slot') && /Добавить/.test(b.textContent || '');
        });
        if (cands.length) addBtn = cands[0];
    }
    if (!addBtn) return;
    let row = document.getElementById('stores-actions-row');
    if (!row) {
        row = document.createElement('div');
        row.id = 'stores-actions-row';
        mapBtn.parentNode.insertBefore(row, mapBtn);
    }
    if (addBtn.parentNode !== row) row.appendChild(addBtn);
    if (mapBtn.parentNode !== row) row.appendChild(mapBtn);
    let ref = document.querySelector('#page-products button[onclick^="openAddProductModal"]');
    if (!ref) ref = document.querySelector('#page-products .add-product-cart-btn');
    if (!ref) {
        const c = Array.prototype.slice.call(document.querySelectorAll('#page-products button')).filter(function (b) {
            return /Добавить/.test(b.textContent || '');
        });
        if (c.length) ref = c[0];
    }
    if (ref) {
        const h = ref.offsetHeight;
        if (h > 0) {
            addBtn.style.height = h + 'px';
            mapBtn.style.height = h + 'px';
        }
    }
}
function cleanupStoreSchedules() {
    if (window.__storeSchedulesCleaned) return;
    window.__storeSchedulesCleaned = true;
    let changed = false;
    (db.stores || []).concat(db.pharmacies || []).forEach(function (s) {
        if (s && typeof s === 'object') {
            if (s.schedule !== undefined) { delete s.schedule; changed = true; }
            if (s.hours !== undefined) { delete s.hours; changed = true; }
        }
    });
    if (changed && typeof saveDB === 'function') saveDB();
}
/* ---------- Карта ---------- */
function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (window.__leafletPromise) return window.__leafletPromise;
    window.__leafletPromise = new Promise(function (resolve, reject) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.onload = function () {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = function () { resolve(); };
            script.onerror = function () { window.__leafletPromise = null; reject(new Error('Не удалось загрузить карту')); };
            document.head.appendChild(script);
        };
        css.onerror = function () { window.__leafletPromise = null; reject(new Error('Не удалось загрузить стили карты')); };
        document.head.appendChild(css);
    });
    return window.__leafletPromise;
}
function getStoreCoordinates(store) {
    if (!store) return null;
    if (store.lat && store.lon) {
        const lat = parseFloat(store.lat);
        const lon = parseFloat(store.lon);
        if (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
            return { lat: lat, lon: lon };
        }
    }
    const address = String(store.address || '').trim();
    /* ИСПРАВЛЕНО: точка экранирована как \. вместо просто . */
    const coordsMatch = address.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (coordsMatch) {
        const lat = parseFloat(coordsMatch[1]);
        const lon = parseFloat(coordsMatch[2]);
        if (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
            return { lat: lat, lon: lon };
        }
    }
    return null;
}
function openStoresMapModal() {
    injectStoresUpgradeStyles();
    const isPharm = (typeof currentStoresType !== 'undefined' && currentStoresType === 'pharmacies');
    const overlay = document.createElement('div');
    overlay.className = 'store-map-overlay';
    const box = document.createElement('div');
    box.className = 'store-map-box';
    box.innerHTML = `<div class="store-map-header"><div class="store-map-title">🗺️ ${isPharm ? 'Карта аптек' : 'Карта магазинов'}</div><button type="button" class="store-map-close">✕</button></div><div class="store-map-note" id="store-map-note">${isPharm ? 'Синие точки — аптеки. Точки появляются, если у аптеки есть координаты.' : 'Зелёные точки — магазины. Точки появляются, если у магазина есть координаты.'}</div><div id="store-map-frame" class="store-map-frame"></div>`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    function closeOverlay() { overlay.remove(); }
    box.querySelector('.store-map-close').onclick = closeOverlay;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
    const note = box.querySelector('#store-map-note');
    const mapDiv = box.querySelector('#store-map-frame');
    if (!navigator.onLine) {
        note.textContent = 'Нет интернета. Карта не может быть загружена.';
        mapDiv.style.display = 'none';
        return;
    }
    note.textContent = 'Загрузка карты...';
    loadLeaflet().then(function () {
        note.textContent = isPharm ? 'Синие точки — аптеки.' : 'Зелёные точки — магазины.';
        const markersData = [];
        const srcList = isPharm ? (db.pharmacies || []) : (db.stores || []);
        srcList.forEach(function (store) {
            const coord = getStoreCoordinates(store);
            if (coord) markersData.push({ name: store.name, address: store.address || '', coord: coord, type: isPharm ? 'pharmacy' : 'store' });
        });
        const defaultCenter = [53.9006, 27.5590];
        const map = L.map(mapDiv).setView(markersData.length ? [markersData[0].coord.lat, markersData[0].coord.lon] : defaultCenter, markersData.length ? 13 : 12);
        if (map.attributionControl && typeof map.attributionControl.setPrefix === 'function') map.attributionControl.setPrefix(false);
        /* ИСПРАВЛЕНО: убраны пробелы в URL Яндекс.Карт */
        L.tileLayer('https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU', { maxZoom: 19, attribution: '© Яндекс.Карты' }).addTo(map);
        const bounds = [];
        markersData.forEach(function (item) {
            const color = item.type === 'pharmacy' ? '#3b82f6' : '#27AA5A';
            const marker = L.circleMarker([item.coord.lat, item.coord.lon], { radius: 8, fillColor: color, color: '#ffffff', weight: 2, fillOpacity: 0.9 });
            let popupHtml = '<b>' + escapeHtml(item.name) + '</b>';
            if (item.address) popupHtml += '<br>' + escapeHtml(item.address);
            marker.bindPopup(popupHtml);
            marker.addTo(map);
            bounds.push([item.coord.lat, item.coord.lon]);
        });
        if (bounds.length) map.fitBounds(bounds, { padding: [20, 20] });
        if (!markersData.length) {
            /* ИСПРАВЛЕНО: убраны опечатки "коо рдинатами" и "загр узить" */
            note.textContent = isPharm ? 'Пока нет аптек с координатами. Добавьте координаты через GPS в карточке аптеки.' : 'Пока нет магазинов с координатами. Добавьте координаты через GPS в карточке магазина.';
        }
        setTimeout(function () { map.invalidateSize(); }, 120);
    }).catch(function () {
        note.textContent = 'Не удалось загрузить карту. Проверьте интернет.';
        mapDiv.style.display = 'none';
    });
}
/* ---------- Фото магазина ---------- */
async function handleStoreImage(e, mode) {
    const file = e.target && e.target.files ? e.target.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (evt) {
        let imageData = evt.target.result;
        if (imageData.length > 300000) {
            imageData = await compressImage(imageData, 800, 0.72);
        }
        tempStoreImage = imageData;
        const prev = document.getElementById(mode === 'add' ? 'new-store-preview' : 'edit-store-preview');
        const placeholder = document.getElementById(mode === 'add' ? 'new-store-placeholder' : 'edit-store-placeholder');
        if (prev) { prev.src = tempStoreImage; prev.style.display = 'block'; }
        if (placeholder) { placeholder.style.display = 'none'; }
    };
    reader.readAsDataURL(file);
}
/* ---------- GPS ---------- */
function getGPSPosition(targetInputId) {
    if (gpsToastTimer) { clearTimeout(gpsToastTimer); gpsToastTimer = null; }
    if (!navigator.geolocation) { openGpsErrorModal(0); return; }
    showToast('📍 Определяем местоположение...', 4000);
    navigator.geolocation.getCurrentPosition(function (pos) {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        const input = document.getElementById(targetInputId);
        if (input) {
            input.value = lat + ', ' + lon;
            updateStoreNameCounter(targetInputId.indexOf('new-') === 0 ? 'add' : 'edit');
        }
        showToast('✅ Координаты получены', 2000);
    }, function (err) {
        openGpsErrorModal(err.code || 0);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
}
/* ---------- Типы и тексты ---------- */
function switchStoresType(type) {
    currentStoresType = type;
    const btnStores = document.getElementById('btn-stores-type');
    const btnPharmacies = document.getElementById('btn-pharmacies-type');
    const title = document.getElementById('stores-page-title');
    if (btnStores) btnStores.classList.toggle('active', type === 'stores');
    if (btnPharmacies) btnPharmacies.classList.toggle('active', type === 'pharmacies');
    if (title) title.textContent = type === 'stores' ? 'Магазины' : 'Аптеки';
    renderStores();
    injectStoresMapButton();
    injectStoresSearch();
}
function getCurrentStoresList() {
    if (currentStoresType === 'stores') return db.stores || [];
    return db.pharmacies || [];
}
function getCurrentTypeIcon() { return currentStoresType === 'stores' ? '🏪' : '💊'; }
function getTypeText() { return currentStoresType === 'stores' ? 'магазин' : 'аптека'; }
function getTypeNewTitle() { return currentStoresType === 'stores' ? 'Новый магазин' : 'Новая аптека'; }
function getTypeEditTitle() { return currentStoresType === 'stores' ? 'Редактировать магазин' : 'Редактировать аптеку'; }
function getTypeNameLabel() { return currentStoresType === 'stores' ? 'Название магазина:' : 'Название аптеки:'; }
function getTypeAddressLabel() { return currentStoresType === 'stores' ? 'Адрес магазина:' : 'Адрес аптеки:'; }
function applyStoreModalTexts(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (modalId === 'add-store-modal') { const t = document.getElementById('add-store-modal-title'); if (t) t.textContent = getTypeNewTitle(); }
    if (modalId === 'edit-store-modal') { const t = document.getElementById('edit-store-modal-title'); if (t) t.textContent = getTypeEditTitle(); }
    modal.querySelectorAll('label').forEach(function (lbl) {
        const txt = (lbl.textContent || '').trim();
        if (txt.indexOf('Название') === 0) lbl.textContent = getTypeNameLabel();
        else if (txt.indexOf('Адрес') === 0) lbl.textContent = getTypeAddressLabel();
    });
}
/* ---------- Список магазинов ---------- */
function renderStores() {
    cleanupStoreSchedules();
    injectStoresUpgradeStyles();
    injectStoresSearch();
    injectStoresMapButton();
    const container = document.getElementById('stores-list');
    if (!container) return;
    container.innerHTML = '';
    const currentList = getCurrentStoresList();
    const typeIcon = getCurrentTypeIcon();
    const isPharm = currentStoresType === 'pharmacies';
    const query = (storesSearchQuery || '').trim().toLowerCase();
    let visibleList = currentList.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || '', 'ru'); });
    if (query) {
        visibleList = visibleList.filter(function (storeObj) {
            const name = (storeObj.name || '').toLowerCase();
            const address = (storeObj.address || '').toLowerCase();
            return name.includes(query) || address.includes(query);
        });
    }
    if (visibleList.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'text-align: center; padding: 1.5rem 1rem; color: #777;';
        if (query) {
            empty.innerHTML = `<div style="font-size:1.5rem;margin-bottom:.5rem;">🔍</div><div style="font-size:.9rem;">Ничего не найдено</div>`;
        } else {
            empty.innerHTML = `<div style="font-size:2rem;margin-bottom:.5rem;">${isPharm ? '💊' : '🏪'}</div><div style="font-weight:bold;font-size:1rem;margin-bottom:.25rem;">${isPharm ? 'Аптек пока нет' : 'Магазинов пока нет'}</div><div style="font-size:.8rem;color:#777;">Нажмите «+ Добавить», чтобы создать первую запись.</div>`;
        }
        container.appendChild(empty);
        return;
    }
    visibleList.forEach(function (storeObj) {
        const index = currentList.indexOf(storeObj);
        if (index < 0) return;
        const div = document.createElement('div');
        div.className = 'card store-list-card';
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0.875rem; margin-bottom: 0.625rem; cursor: pointer;';
        div.onclick = function () { openEditStoreModal(index); };
        let photoEl;
        if (storeObj.image) {
            photoEl = document.createElement('img');
            photoEl.src = storeObj.image;
            photoEl.className = 'store-card-photo';
            photoEl.title = 'Нажмите для увеличения';
            photoEl.addEventListener('click', function (e) {
                e.stopPropagation();
                openFullscreenPhoto(storeObj.image);
            });
        } else {
            photoEl = document.createElement('div');
            photoEl.className = 'store-card-photo-fallback';
            photoEl.style.backgroundColor = storeObj.color || '#00875a';
            photoEl.textContent = typeIcon;
        }
        const infoWrap = document.createElement('div');
        infoWrap.style.cssText = 'min-width: 0; flex: 1;';
        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = 'font-weight: 500; font-size: 1rem;';
        nameDiv.textContent = storeObj.name || '';
        infoWrap.appendChild(nameDiv);
        if (storeObj.address) {
            const addrDiv = document.createElement('div');
            addrDiv.className = 'store-address-line';
            addrDiv.style.cssText = 'color: #777; display: flex; align-items: center; gap: 4px; margin-top: 2px;';
            addrDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 0.875rem; height: 0.875rem; flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
            const addrSpan = document.createElement('span');
            addrSpan.style.fontSize = '0.78rem';
            addrSpan.textContent = storeObj.address;
            addrDiv.appendChild(addrSpan);
            infoWrap.appendChild(addrDiv);
        }
        const left = document.createElement('div');
        left.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;';
        left.appendChild(photoEl);
        left.appendChild(infoWrap);
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; align-items: center; gap: 0.75rem;';
        actions.addEventListener('click', function (e) { e.stopPropagation(); });
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = '✏️';
        editBtn.title = 'Редактировать';
        editBtn.style.cssText = 'background: none; border: none; cursor: pointer; color: #777; font-size: 1.1rem;';
        editBtn.onclick = function () { openEditStoreModal(index); };
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '🗑️';
        delBtn.title = 'Удалить';
        delBtn.style.cssText = 'background: none; border: none; cursor: pointer; color: #777; font-size: 1.1rem;';
        delBtn.onclick = function () { deleteStore(index); };
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        div.appendChild(left);
        div.appendChild(actions);
        container.appendChild(div);
    });
    if (typeof attachRipple === 'function') setTimeout(attachRipple, 50);
}
/* ---------- Добавление / редактирование / удаление ---------- */
function addStore() {
    const nameInput = document.getElementById('new-store-name');
    const addressInput = document.getElementById('new-store-address');
    const name = nameInput ? nameInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const currentList = getCurrentStoresList();
    const isPharm = currentStoresType === 'pharmacies';
    if (!name) { showStoreAlert('Введите название ' + (isPharm ? 'аптеки' : 'магазина') + '.', 'Добавление'); return; }
    if (isDuplicateStoreName(currentList, name, null)) { showStoreAlert((isPharm ? 'Такая аптека' : 'Такой магазин') + ' уже существует.', 'Добавление'); return; }
    const newEntry = { name: name, color: selectedNewStoreColor, image: tempStoreImage || '', address: address, type: isPharm ? 'pharmacy' : 'store' };
    currentList.push(newEntry);
    if (nameInput) nameInput.value = '';
    if (addressInput) addressInput.value = '';
    tempStoreImage = '';
    updateStoreNameCounter('add');
    haptic(40);
    saveDB();
    forceCloseModal('add-store-modal');
    renderStores();
    if (typeof showToast === 'function') showToast('✅ Добавлено');
}
function saveEditedStore() {
    if (editingStoreIndex === null || editingStoreIndex === undefined) return;
    const nameInput = document.getElementById('edit-store-name');
    const addressInput = document.getElementById('edit-store-address');
    const newName = nameInput ? nameInput.value.trim() : '';
    const newAddress = addressInput ? addressInput.value.trim() : '';
    const currentList = getCurrentStoresList();
    const storeObj = currentList[editingStoreIndex];
    if (!storeObj) return;
    const oldName = storeObj.name;
    const isPharm = currentStoresType === 'pharmacies';
    if (!newName) { showStoreAlert('Введите название ' + (isPharm ? 'аптеки' : 'магазина') + '.', 'Редактирование'); return; }
    if (isDuplicateStoreName(currentList, newName, storeObj)) { showStoreAlert((isPharm ? 'Такая аптека' : 'Такой магазин') + ' уже существует.', 'Редактирование'); return; }
    storeObj.name = newName;
    storeObj.color = selectedEditStoreColor;
    storeObj.address = newAddress;
    if (storeObj.schedule !== undefined) delete storeObj.schedule;
    if (storeObj.hours !== undefined) delete storeObj.hours;
    if (tempStoreImage !== null && tempStoreImage !== undefined) storeObj.image = tempStoreImage;
    if (newName !== oldName) {
        db.products.forEach(function (p) {
            if (p.prices && p.prices[oldName] !== undefined) { p.prices[newName] = p.prices[oldName]; delete p.prices[oldName]; }
            if (p.dates && p.dates[oldName] !== undefined) { p.dates[newName] = p.dates[oldName]; delete p.dates[oldName]; }
            if (p.priceHistory && p.priceHistory[oldName] !== undefined) { p.priceHistory[newName] = p.priceHistory[oldName]; delete p.priceHistory[oldName]; }
        });
        if (typeof invalidatePriceCache === 'function') invalidatePriceCache();
    }
    haptic(20);
    saveDB();
    forceCloseModal('edit-store-modal');
    renderStores();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderStoresComparison === 'function') renderStoresComparison();
}
function deleteStore(index) {
    const currentList = getCurrentStoresList();
    const storeObj = currentList[index];
    if (!storeObj) return;
    const isPharm = currentStoresType === 'pharmacies';
    if (currentList.length <= 1) { showStoreAlert(isPharm ? 'Должна остаться хотя бы одна аптека.' : 'Должен остаться хотя бы один магазин.', 'Удаление'); return; }
    showStoreConfirm('Удалить ' + (isPharm ? 'аптеку' : 'магазин') + ' «' + storeObj.name + '»?', function () {
        const removedName = storeObj.name;
        currentList.splice(index, 1);
        db.products.forEach(function (p) {
            if (p.prices) delete p.prices[removedName];
            if (p.dates) delete p.dates[removedName];
            if (p.priceHistory) delete p.priceHistory[removedName];
        });
        if (typeof invalidatePriceCache === 'function') invalidatePriceCache();
        haptic(60);
        saveDB();
        renderStores();
        if (typeof renderCart === 'function') renderCart();
        if (typeof renderStoresComparison === 'function') renderStoresComparison();
        if (typeof showToast === 'function') showToast('🗑️ Удалено');
    }, 'Удалить');
}
/* ---------- Обёртки открытия окон (тексты под тип: магазин/аптека) ---------- */
const baseOpenAddStoreModal = window.openAddStoreModal;
const baseOpenEditStoreModal = window.openEditStoreModal;
window.openAddStoreModal = function () {
    if (typeof baseOpenAddStoreModal === 'function') baseOpenAddStoreModal();
    else if (typeof openModalEl === 'function') openModalEl('add-store-modal');
    applyStoreModalTexts('add-store-modal');
    updateStoreColorIndicator('add', selectedNewStoreColor);
    updateStoreNameCounter('add');
};
window.openEditStoreModal = function (index) {
    if (typeof baseOpenEditStoreModal === 'function') baseOpenEditStoreModal(index);
    else if (typeof openModalEl === 'function') openModalEl('edit-store-modal');
    applyStoreModalTexts('edit-store-modal');
    updateStoreColorIndicator('edit', selectedEditStoreColor);
    updateStoreNameCounter('edit');
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        cleanupStoreSchedules();
        injectStoresUpgradeStyles();
        injectStoresSearch();
        injectStoresMapButton();
    }, { once: true });
} else {
    cleanupStoreSchedules();
    injectStoresUpgradeStyles();
    injectStoresSearch();
    injectStoresMapButton();
}