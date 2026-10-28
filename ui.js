function injectUiFixStyles() {
  /* ВАЖНО: все стили живут ТОЛЬКО в ui-fixes.css (единый источник).
  Инъекция стилей из JavaScript отключена полностью, чтобы не было двойных записей и конфликтов. */
  return;
}

/* ===== убираем значок "Powered by Netlify" ===== */
function killNetlifyBadge() {
  try {
    document.querySelectorAll('iframe').forEach(function (f) {
      if ((f.src || '').indexOf('netlify') >= 0) f.remove();
    });
    document.querySelectorAll('div, a, section, aside, span').forEach(function (el) {
      const t = el.textContent || '';
      if (t && t.length < 60 && /powered\s+by\s+netlify/i.test(t)) {
        let n = el;
        while (n && n !== document.body) {
          if (getComputedStyle(n).position === 'fixed') break;
          n = n.parentElement;
        }
        (n && n !== document.body ? n : el).remove();
      }
    });
  } catch (e) {}
}
killNetlifyBadge();
// ИСПРАВЛЕНО: раньше проверка шла каждые 1.2 секунды НАВСЕГДА (лишняя нагрузка).
// Теперь несколько отложенных проверок после загрузки — значок появляется один раз.
setTimeout(killNetlifyBadge, 1500);
setTimeout(killNetlifyBadge, 5000);
setTimeout(killNetlifyBadge, 12000);

/* ===== PWA ===== */
function setupPwa() {
  try {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link');
      l.rel = 'manifest';
      l.href = 'manifest.webmanifest';
      document.head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.content = '#4EAE64';
      document.head.appendChild(m);
    }
    const secure = (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    if (secure && 'serviceWorker' in navigator) {
      // ИСПРАВЛЕНО: регистрация один раз (раньше было дважды — сразу и по load).
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  } catch (e) {}
}

function applyBannerCurl() {
  if (typeof db === 'undefined' || !db || !db.cart || !db.cart.length) return;
  document.querySelectorAll('#stores-comparison .comparison-banner').forEach(function (b) {
    if (b.querySelector('.banner-curl')) return;
    const span = document.createElement('span');
    span.className = 'banner-curl ' + (b.classList.contains('banner-orange') ? 'curl-under-green' : 'curl-under-orange');
    b.appendChild(span);
  });
}

/* ===== липкость: весь блок (карточка+язычок) стоит ровно под шапкой, карточки уходят ПОД него ===== */
function applyBannerSticky() {
  const header = document.querySelector('.prices-sticky-header');
  const top = (header ? header.offsetHeight : 0) - 1;
  document.querySelectorAll('#stores-comparison .stores-sticky-wrap').forEach(function (w) {
    w.style.position = 'sticky';
    w.style.top = top + 'px';
    w.style.zIndex = '30';
  });
  document.querySelectorAll('#stores-comparison .comparison-banner').forEach(function (b) {
    b.style.position = 'relative';
    b.style.top = '0px';
    b.style.zIndex = '31';
  });
}

function attachRipple() {
  const selectors = '.btn, .btn-3d-green, .btn-3d-dark, .icon-btn, .nav-item, .comparison-toggle-btn, .edit-pencil-btn, .header-btn, .add-product-cart-btn, .stores-type-btn, .cart-type-btn, .ptype-slot';
  document.querySelectorAll(selectors).forEach(function (btn) {
    if (btn.dataset.rippleAttached) return;
    btn.dataset.rippleAttached = '1';
    // ИСПРАВЛЕНО: волна рисуется внутри кнопки. Если у кнопки нет своей
    // системы координат (position: static), волна улетала не туда.
    try {
      const cs = window.getComputedStyle(btn);
      if (cs.position === 'static') btn.style.position = 'relative';
      if (cs.overflow !== 'hidden') btn.style.overflow = 'hidden';
    } catch (e) {}
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
  });
}

/* openSettingsPage убрана отсюда: рабочая версия живёт в settings.js */

function injectAppLogo() {
  const header = document.getElementById('app-header');
  if (!header || header.querySelector('.app-logo')) return;
  const titleSpan = header.querySelector('span');
  if (!titleSpan) return;
  const left = document.createElement('div');
  left.style.cssText = 'display:flex;align-items:center;gap:.5rem;min-width:0;';
  header.insertBefore(left, titleSpan);
  const names = ['logo.png', 'logo.png.jpg', 'logo.jpg', 'logo.jpeg', 'icon-512.png'];
  const img = document.createElement('img');
  img.alt = ''; img.className = 'app-logo';
  let i = 0;
  img.onerror = function () { i++; if (i < names.length) img.src = names[i]; else img.remove(); };
  img.src = names[0];
  left.appendChild(img);
  left.appendChild(titleSpan);
}

function fixBackupIcons() {
  try {
    var expBtn = document.querySelector('#page-settings button[onclick="exportData()"]');
    var impInput = document.getElementById('import-file');
    var impLab = impInput ? impInput.closest('label') : null;
    if (!expBtn || !impLab) return;
    var expSvg = expBtn.querySelector('svg');
    var impSvg = impLab.querySelector('svg');
    if (!expSvg || !impSvg || expSvg.dataset.fixed) return;
    var tmp = expSvg.innerHTML;
    expSvg.innerHTML = impSvg.innerHTML;
    impSvg.innerHTML = tmp;
    expSvg.dataset.fixed = '1';
    impSvg.dataset.fixed = '1';
  } catch (e) {}
}

function buildTypeSlots() {
  const title = document.getElementById('products-page-title');
  const toggleBtn = document.getElementById('btn-products-type-toggle');
  if (!title || document.getElementById('ptype-slot-products')) { updateTypeSlots(); return; }
  const parent = title.parentElement;
  parent.classList.add('ptype-tabs-row');
  const slotP = document.createElement('button');
  slotP.type = 'button'; slotP.id = 'ptype-slot-products'; slotP.className = 'ptype-slot';
  slotP.innerHTML = '<span class="btn-icon">\u{1F6D2}</span><span>Товары</span>';
  slotP.onclick = function () { if (currentProductsType !== 'products') switchProductsType('products'); };
  const slotM = document.createElement('button');
  slotM.type = 'button'; slotM.id = 'ptype-slot-meds'; slotM.className = 'ptype-slot';
  slotM.innerHTML = '<span class="btn-icon">\u{1F48A}</span><span>Лекарства</span>';
  slotM.onclick = function () { if (currentProductsType !== 'meds') switchProductsType('meds'); };
  parent.insertBefore(slotP, title);
  parent.insertBefore(slotM, title);
  title.remove();
  if (toggleBtn) toggleBtn.remove();
  updateTypeSlots();
}

function updateTypeSlots() {
  const sp = document.getElementById('ptype-slot-products');
  const sm = document.getElementById('ptype-slot-meds');
  if (!sp || !sm) return;
  const meds = (typeof currentProductsType !== 'undefined' && currentProductsType === 'meds');
  sp.classList.toggle('ptype-heading', !meds);
  sp.classList.toggle('ptype-btn', meds);
  sm.classList.toggle('ptype-heading', meds);
  sm.classList.toggle('ptype-btn', !meds);
}

function buildStoresSlots() {
  const header = document.querySelector('.stores-sticky-header');
  if (!header) return;
  const toggleRow = header.querySelector('.stores-type-toggle');
  if (toggleRow) toggleRow.style.display = 'none';
  const title = document.getElementById('stores-page-title');
  if (!title || document.getElementById('stype-slot-stores')) { updateStoresSlots(); return; }
  const row = title.parentElement;
  row.classList.add('ptype-tabs-row');
  const slotS = document.createElement('button');
  slotS.type = 'button'; slotS.id = 'stype-slot-stores'; slotS.className = 'ptype-slot';
  slotS.innerHTML = '<span class="btn-icon">\u{1F3EA}</span><span>Магазины</span>';
  slotS.onclick = function () { if (currentStoresType !== 'stores') switchStoresType('stores'); };
  const slotP = document.createElement('button');
  slotP.type = 'button'; slotP.id = 'stype-slot-pharmacies'; slotP.className = 'ptype-slot';
  /* ===== красный крест (символ аптек), толстые перекладины ===== */
  slotP.innerHTML = '<span class="btn-icon"><svg viewBox="0 0 24 24"><path d="M8 2h8v6h6v8h-6v6H8v-6H2V8h6z" fill="#D32F2F" stroke="#ffffff" stroke-width="1"></path></svg></span><span>Аптеки</span>';
  slotP.onclick = function () { if (currentStoresType !== 'pharmacies') switchStoresType('pharmacies'); };
  row.insertBefore(slotS, title);
  row.insertBefore(slotP, title);
  title.remove();
  const oldToggle = document.getElementById('btn-stores-type-toggle');
  if (oldToggle) oldToggle.remove();
  updateStoresSlots();
}

function updateStoresSlots() {
  const ss = document.getElementById('stype-slot-stores');
  const sp = document.getElementById('stype-slot-pharmacies');
  if (!ss || !sp) return;
  const ph = (typeof currentStoresType !== 'undefined' && currentStoresType === 'pharmacies');
  ss.classList.toggle('ptype-heading', !ph);
  ss.classList.toggle('ptype-btn', ph);
  sp.classList.toggle('ptype-heading', ph);
  sp.classList.toggle('ptype-btn', !ph);
}

function applyMedTheme() {
  const wrap = document.querySelector('.app-wrapper');
  if (!wrap) return;
  const active = document.querySelector('.page.active');
  const id = active ? active.id : 'page-products';
  let meds = false;
  if (id === 'page-products') meds = (typeof currentProductsType !== 'undefined' && currentProductsType === 'meds');
  else if (id === 'page-cart') meds = (typeof cartViewType !== 'undefined' && cartViewType === 'meds');
  else if (id === 'page-prices') meds = (typeof pricesViewType !== 'undefined' && pricesViewType === 'meds');
  else if (id === 'page-stores') meds = (typeof currentStoresType !== 'undefined' && currentStoresType === 'pharmacies');
  wrap.classList.toggle('meds-mode', meds);
}

function initApp() {
  injectUiFixStyles();
  setupPwa();
  injectAppLogo();
  buildTypeSlots();
  buildStoresSlots();
  restoreData();
  applySettings();
  renderAll();
  attachRipple();
  initSwipe();
  updateComparisonToggleIcon();
  updateTypeSlots();
  updateStoresSlots();
  applyMedTheme();
  applyBannerCurl();
  applyBannerSticky();
  fixBackupIcons();
  killNetlifyBadge();
  ['renderProducts', 'renderCart', 'renderCartItems', 'renderStoresComparison', 'renderStores'].forEach(function (name) {
    const orig = window[name];
    if (typeof orig === 'function') {
      window[name] = function () {
        const r = orig.apply(this, arguments);
        applyMedTheme();
        applyBannerCurl();
        applyBannerSticky();
        return r;
      };
    }
  });
  ['switchProductsType', 'switchStoresType', 'switchCartViewType'].forEach(function (name) {
    const orig = window[name];
    if (typeof orig === 'function') {
      window[name] = function () { const r = orig.apply(this, arguments); updateTypeSlots(); updateStoresSlots(); applyMedTheme(); return r; };
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { saveDB(); }
    else if (document.visibilityState === 'visible') { restoreData(); renderAll(); attachRipple(); fixBackupIcons(); }
  });
  window.addEventListener('pagehide', function () { saveDB(); });
  if (db && db.settings && db.settings.autoTheme) startAutoTheme();
}

function updateViewModeButtonIcon() { const el = document.getElementById('view-mode-icon'); if (el) el.innerHTML = db.settings.categoryViewMode === 'grid' ? ICON_LIST : ICON_GRID; }
function toggleCategoryViewMode() { db.settings.categoryViewMode = db.settings.categoryViewMode === 'grid' ? 'list' : 'grid'; saveDB(); updateViewModeButtonIcon(); renderProducts(); }

/* Функции сортировки категорий (toggleSortMode, updateSortModeButtonIcon) УДАЛЕНЫ:
   сортировка всегда по алфавиту, кнопка убрана из интерфейса. */

function updateComparisonToggleIcon() {
  const arrow = document.getElementById('comparison-toggle-arrow'); const btn = document.getElementById('comparison-toggle-btn');
  if (!arrow || !btn) return;
  arrow.style.transform = '';
  if (comparisonMode === 'store') { arrow.innerHTML = '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>'; btn.title = 'Переключить на "По разным магазинам"'; }
  else { arrow.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>'; btn.title = 'Переключить на "В магазине"'; }
}

function showToast(text, duration) {
  duration = duration || 1800;
  let toast = document.getElementById('app-toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'app-toast'; (document.querySelector('.app-wrapper') || document.body).appendChild(toast); }
  if (toast._t) { clearTimeout(toast._t); toast._t = null; }
  toast.textContent = text; toast.style.opacity = '1';
  toast._t = setTimeout(function () { toast.style.opacity = '0'; toast._t = null; }, duration);
}

function toggleAllCategories() {
  const cats = getActiveCategories();
  if (!cats.length) return;
  if (!db.collapsedCategories) db.collapsedCategories = {};
  const any = cats.some(c => !!db.collapsedCategories[c.id]);
  cats.forEach(c => { db.collapsedCategories[c.id] = !any; });
  saveDB(); renderProducts();
}

function updateToggleAllButton() {
  const btn = document.getElementById('toggle-all-btn');
  if (!btn) return;
  const grid = db.settings.categoryViewMode === 'grid';
  const si = document.getElementById('search-input');
  const search = si ? si.value.toLowerCase() : '';
  if (grid || search) { btn.style.display = 'none'; return; }
  btn.style.display = 'inline-flex';
  const cats = getActiveCategories();
  if (!cats.length) { btn.style.display = 'none'; return; }
  if (!db.collapsedCategories) db.collapsedCategories = {};
  const any = cats.some(c => !!db.collapsedCategories[c.id]);
  btn.classList.toggle('expanded', !any);
  btn.title = !any ? 'Свернуть все вкладки' : 'Развернуть все вкладки';
}

function switchPage(pageId, el) {
  const list = (typeof pages !== 'undefined') ? pages : [];
  const curEl = document.querySelector('.page.active');
  const curId = curEl ? curEl.id.replace('page-', '') : null;
  if (curId === pageId) return;
  const dir = list.indexOf(pageId) > list.indexOf(curId) ? 'next' : 'prev';
  if (typeof switchPageSmooth === 'function') switchPageSmooth(pageId, dir);
  else { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); const t = document.getElementById('page-' + pageId); if (t) t.classList.add('active'); renderAll(); }
}

function renderAll() { renderProducts(); renderCart(); renderStoresComparison(); renderStores(); }
function toggleProductsType() { switchProductsType((currentProductsType || 'products') === 'products' ? 'meds' : 'products'); }
function updateProductsTypeButton() { updateTypeSlots(); }

window.onload = initApp;