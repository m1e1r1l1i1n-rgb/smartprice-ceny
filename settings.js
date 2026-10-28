/* =============================================================
SmartPrice — settings.js
Настройки приложения (тема, шрифт, цвет фона, виброотклик и т.д.)
ФУНДАМЕНТ: карточка «О программе» с версией приложения и схемы данных.
============================================================= */

function settingsGetElement(id) { return document.getElementById(id); }
function settingsSafeSave() { if (typeof saveDB === 'function') saveDB(); }
function settingsSafeToast(message) { if (typeof showToast === 'function') showToast(message); }

/* getDefaultSettings — ЕДИНСТВЕННАЯ версия находится в storage.js */

/* ---------- Карточка «О программе» на странице настроек ---------- */
function ensureAboutCard() {
  const page = document.getElementById('page-settings');
  if (!page || document.getElementById('about-card')) return;
  const ver = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '1.0';
  const sch = (typeof SCHEMA_VERSION !== 'undefined') ? SCHEMA_VERSION : 1;
  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'about-card';
  card.style.marginTop = '0.93rem';
  card.innerHTML =
    '<h3 style="font-size:1rem;margin-bottom:.375rem;">ℹ️ О программе</h3>' +
    '<p style="font-size:.85rem;color:#777;margin:0;line-height:1.5;">SmartPrice — сравнение цен в магазинах и аптеках.<br>' +
    'Версия приложения: <b>' + ver + '</b> (личная стабильная).<br>' +
    'Схема данных: <b>' + sch + '</b>.<br>' +
    'Данные хранятся локально на этом устройстве.</p>';
  page.appendChild(card);
}

/* =============================================================
Применение всех настроек к интерфейсу
============================================================= */
function applySettings() {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  const settings = db.settings;
  const root = document.documentElement;

  /* ---------- Тема ---------- */
  if (settings.darkMode) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  /* ---------- Размер шрифта ---------- */
  if (settings.fontSize) {
    root.style.fontSize = settings.fontSize;
  } else {
    root.style.removeProperty('font-size');
  }

  /* ---------- Цвет фона рабочего пространства ---------- */
  if (settings.bgColor) {
    root.style.setProperty('--bg-color', settings.bgColor);
  } else {
    root.style.removeProperty('--bg-color');
  }

  /* ---------- Объёмный стиль ---------- */
  if (settings.volumetric) {
    root.classList.remove('volumetric-style');
    root.classList.add('volumetric');
  } else {
    root.classList.remove('volumetric');
    root.classList.remove('volumetric-style');
  }

  /* ---------- Цвет кнопки «+ Добавить товар» ---------- */
  const defaultAddProductBtnColor = '#27AA5A';
  const storedAddProductBtnColor = settings.addProductBtnColor || defaultAddProductBtnColor;

  root.style.setProperty('--add-product-btn-bg', storedAddProductBtnColor);

  const appWrapper = document.querySelector('.app-wrapper');
  if (appWrapper) {
    if (String(storedAddProductBtnColor).toLowerCase() === defaultAddProductBtnColor.toLowerCase()) {
      appWrapper.style.removeProperty('--add-product-btn-bg');
    } else {
      appWrapper.style.setProperty('--add-product-btn-bg', storedAddProductBtnColor, 'important');
    }
  }

  const cartAddBtn = settingsGetElement('cart-add-btn');
  if (cartAddBtn) {
    cartAddBtn.style.setProperty('background', 'var(--add-product-btn-bg)', 'important');
    cartAddBtn.style.setProperty('background-color', 'var(--add-product-btn-bg)', 'important');
  }

  /* ---------- Обновление кнопок и иконок ---------- */
  if (typeof updateThemeButtons === 'function') {
    updateThemeButtons(settings.darkMode, settings.autoTheme);
  }
  if (typeof updateViewModeButtonIcon === 'function') {
    updateViewModeButtonIcon();
  }
  if (typeof updateComparisonToggleIcon === 'function') {
    updateComparisonToggleIcon();
  }

  /* ---------- Возврат значений в элементы настроек ---------- */
  const fontSizeSelect = settingsGetElement('font-size-select');
  if (fontSizeSelect) fontSizeSelect.value = settings.fontSize || '14px';

  const bgColorBtn = settingsGetElement('bg-color-btn');
  if (bgColorBtn) bgColorBtn.style.backgroundColor = settings.bgColor || '#f4f6f8';

  const volumetricCheck = settingsGetElement('volumetric-checkbox');
  if (volumetricCheck) volumetricCheck.checked = !!settings.volumetric;

  const cartGroupCheck = settingsGetElement('cart-group-check');
  if (cartGroupCheck) cartGroupCheck.checked = settings.cartGroupByCategory !== false;

  const hapticCheck = settingsGetElement('haptic-feedback-check');
  if (hapticCheck) hapticCheck.checked = settings.hapticFeedback !== false;

  const multiStoreBtn = settingsGetElement('multi-store-color-btn');
  if (multiStoreBtn) multiStoreBtn.style.backgroundColor = settings.multiStoreColor || '#d93838';

  const addProductBtn = settingsGetElement('add-product-btn-color-btn');
  if (addProductBtn) addProductBtn.style.backgroundColor = storedAddProductBtnColor;

  /* ---------- Карточка «О программе» ---------- */
  ensureAboutCard();
}

/* =============================================================
Тема: светлая / тёмная / авто
============================================================= */
function setTheme(theme) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  if (theme === 'auto') {
    db.settings.autoTheme = true;
    db.settings.darkMode = shouldUseDarkNow();

    const autoCheckbox = settingsGetElement('auto-theme-check');
    if (autoCheckbox) autoCheckbox.checked = true;

    startAutoTheme();
    settingsSafeToast('🔄 Авто-тема включена');
  } else {
    db.settings.autoTheme = false;
    db.settings.darkMode = (theme === 'dark');

    const autoCheckbox = settingsGetElement('auto-theme-check');
    if (autoCheckbox) autoCheckbox.checked = false;

    stopAutoTheme();
  }

  settingsSafeSave();
  applySettings();
  updateAutoThemeInfo();
}

function toggleAutoTheme(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.autoTheme = !!checked;
  settingsSafeSave();

  if (checked) {
    startAutoTheme();
    settingsSafeToast('🔄 Авто-тема включена');
  } else {
    stopAutoTheme();
    settingsSafeToast('Авто-тема выключена');
  }

  applySettings();
  updateAutoThemeInfo();
}

function updateThemeButtons(darkMode, autoTheme) {
  const btnLight = settingsGetElement('btn-light');
  const btnDark = settingsGetElement('btn-dark');
  const btnAuto = settingsGetElement('btn-auto');

  if (btnLight) btnLight.classList.toggle('active', !darkMode && !autoTheme);
  if (btnDark) btnDark.classList.toggle('active', darkMode && !autoTheme);
  if (btnAuto) btnAuto.classList.toggle('active', autoTheme);
}

function shouldUseDarkNow() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= getSunsetHour() || hour < getSunriseHour();
}

function getSunsetHour() { return 20; }
function getSunriseHour() { return 7; }

function updateAutoThemeInfo() {
  const info = settingsGetElement('auto-theme-info');
  if (!info) return;
  if (typeof db === 'undefined' || !db || !db.settings) return;

  if (db.settings.autoTheme) {
    const nowDark = shouldUseDarkNow();
    info.style.display = 'block';
    info.innerHTML =
      '🕐 Сейчас: <b>' + (nowDark ? 'тёмная' : 'светлая') + ' тема</b> · Закат: ' +
      getSunsetHour() + ':00 · Рассвет: ' + getSunriseHour() + ':00';
  } else {
    info.style.display = 'none';
  }
}

let autoThemeInterval = null;

function startAutoTheme() {
  stopAutoTheme();

  autoThemeInterval = setInterval(function () {
    if (typeof db === 'undefined' || !db || !db.settings) return;
    if (!db.settings.autoTheme) return;

    const nowDark = shouldUseDarkNow();
    if (db.settings.darkMode !== nowDark) {
      db.settings.darkMode = nowDark;
      settingsSafeSave();
      applySettings();
      updateAutoThemeInfo();
    }
  }, 60000);
}

function stopAutoTheme() {
  if (autoThemeInterval) {
    clearInterval(autoThemeInterval);
    autoThemeInterval = null;
  }
}

/* =============================================================
Размер шрифта
============================================================= */
function changeFontSize(size) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.fontSize = size;
  settingsSafeSave();
  applySettings();
}

/* =============================================================
Цвет фона рабочего пространства
============================================================= */
function changeBgColor(color) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.bgColor = color;
  settingsSafeSave();
  applySettings();

  if (typeof renderAll === 'function') renderAll();
}

function resetBgColor() {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.bgColor = '';
  settingsSafeSave();
  applySettings();

  if (typeof renderAll === 'function') renderAll();
}

/* =============================================================
Объёмный стиль
============================================================= */
function toggleVolumetricStyle(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.volumetric = !!checked;
  settingsSafeSave();
  applySettings();
}

/* =============================================================
Группировка корзины по категориям
============================================================= */
function toggleCartGrouping(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.cartGroupByCategory = !!checked;
  settingsSafeSave();

  if (typeof renderCart === 'function') renderCart();
}

/* =============================================================
Виброотклик
============================================================= */
function toggleHapticFeedback(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.hapticFeedback = !!checked;
  settingsSafeSave();

  if (checked && typeof haptic === 'function') haptic(40);
  settingsSafeToast(checked ? '📳 Виброотклик включён' : 'Виброотклик выключен');
}

/* =============================================================
Цвет предупреждения о нескольких магазинах
============================================================= */
function changeMultiStoreColor(color) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.multiStoreColor = color;
  settingsSafeSave();
  applySettings();

  if (typeof renderStoresComparison === 'function') renderStoresComparison();
}

function resetMultiStoreColor() {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.multiStoreColor = '#d93838';
  settingsSafeSave();
  applySettings();

  if (typeof renderStoresComparison === 'function') renderStoresComparison();
}

/* =============================================================
Цвет кнопки «+ Добавить товар» в корзине
============================================================= */
function changeAddProductBtnColor(color) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.addProductBtnColor = color;
  settingsSafeSave();
  applySettings();
}

function resetAddProductBtnColor() {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};

  db.settings.addProductBtnColor = '#27AA5A';
  settingsSafeSave();
  applySettings();
}

/* =============================================================
Открытие страницы настроек
============================================================= */
function openSettingsPage() {
  if (typeof switchPage === 'function') {
    switchPage('settings', document.querySelector('.nav-item[onclick*="settings"]'));
  }
  setTimeout(applySettings, 50);
}