/* =============================================================
SmartPrice — settings.js
Настройки приложения (тема, шрифт, цвет фона, виброотклик и т.д.)
============================================================= */

function settingsGetElement(id) { return document.getElementById(id); }

function settingsSafeSave() { if (typeof saveDB === 'function') saveDB(); }

function getDefaultSettings() {
  return {
    darkMode: false,
    autoTheme: false,
    fontSize: '14px',
    bgColor: '',
    volumetric: false,
    categoryViewMode: 'list',
    categoryModalViewMode: 'list',
    categorySortMode: 'default',
    cartGroupByCategory: true,
    hapticFeedback: true,
    multiStoreColor: '#d93838',
    addProductBtnColor: '#27AA5A'
  };
}

function applySettings() {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  const settings = db.settings;
  const root = document.documentElement;
  if (settings.darkMode) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  if (settings.fontSize) {
    root.style.fontSize = settings.fontSize;
  }
  if (settings.bgColor) {
    root.style.setProperty('--bg-color', settings.bgColor);
  } else {
    root.style.removeProperty('--bg-color');
  }
  if (settings.volumetric) {
    root.classList.add('volumetric-style');
  } else {
    root.classList.remove('volumetric-style');
  }
  if (typeof updateThemeButtons === 'function') {
    updateThemeButtons(settings.darkMode, settings.autoTheme);
  }
  if (typeof updateViewModeButtonIcon === 'function') {
    updateViewModeButtonIcon();
  }
  if (typeof updateSortModeButtonIcon === 'function') {
    updateSortModeButtonIcon();
  }
  if (typeof updateComparisonToggleIcon === 'function') {
    updateComparisonToggleIcon();
  }
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
  if (addProductBtn) addProductBtn.style.backgroundColor = settings.addProductBtnColor || '#27AA5A';
}

function setTheme(theme) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  if (theme === 'auto') {
    db.settings.autoTheme = true;
    db.settings.darkMode = shouldUseDarkNow();
    const autoCheckbox = settingsGetElement('auto-theme-check');
    if (autoCheckbox) {
      autoCheckbox.checked = true;
    }
    startAutoTheme();
    showToast('🔄 Авто-тема включена');
  } else {
    db.settings.autoTheme = false;
    db.settings.darkMode = theme === 'dark';
    const autoCheckbox = settingsGetElement('auto-theme-check');
    if (autoCheckbox) {
      autoCheckbox.checked = false;
    }
    stopAutoTheme();
  }
  settingsSafeSave();
  applySettings();
  updateAutoThemeInfo();
}

function changeFontSize(size) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  db.settings.fontSize = size;
  settingsSafeSave();
  applySettings();
}

function changeBgColor(color) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  db.settings.bgColor = color;
  settingsSafeSave();
  applySettings();
  if (typeof renderAll === 'function') {
    renderAll();
  }
}

function resetBgColor() {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  db.settings.bgColor = '';
  settingsSafeSave();
  applySettings();
  if (typeof renderAll === 'function') {
    renderAll();
  }
}

function toggleVolumetricStyle(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  db.settings.volumetric = !!checked;
  settingsSafeSave();
  applySettings();
}

function toggleCartGrouping(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  db.settings.cartGroupByCategory = !!checked;
  settingsSafeSave();
  if (typeof renderCart === 'function') renderCart();
}

function toggleHapticFeedback(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  db.settings.hapticFeedback = !!checked;
  settingsSafeSave();
  if (checked && typeof haptic === 'function') haptic(40);
  showToast(checked ? '📳 Виброотклик включён' : 'Виброотклик выключен');
}

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

function updateThemeButtons(darkMode, autoTheme) {
  const btnLight = settingsGetElement('btn-light');
  const btnDark = settingsGetElement('btn-dark');
  const btnAuto = settingsGetElement('btn-auto');
  if (btnLight) btnLight.classList.toggle('active', !darkMode && !autoTheme);
  if (btnDark) btnDark.classList.toggle('active', darkMode && !autoTheme);
  if (btnAuto) btnAuto.classList.toggle('active', autoTheme);
}

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

function toggleAutoTheme(checked) {
  if (typeof db === 'undefined' || !db) return;
  if (!db.settings) db.settings = {};
  db.settings.autoTheme = !!checked;
  settingsSafeSave();
  if (checked) {
    startAutoTheme();
    showToast('🔄 Авто-тема включена');
  } else {
    stopAutoTheme();
    showToast('Авто-тема выключена');
  }
  applySettings();
  updateAutoThemeInfo();
}

function settingsToggleThemeButtons(darkMode, autoTheme) {
  const btnLight = settingsGetElement('btn-light');
  const btnDark = settingsGetElement('btn-dark');
  const btnAuto = settingsGetElement('btn-auto');
  if (btnLight) btnLight.classList.toggle('active', !darkMode && !autoTheme);
  if (btnDark) btnDark.classList.toggle('active', darkMode && !autoTheme);
  if (btnAuto) btnAuto.classList.toggle('active', autoTheme);
}

function openSettingsPage() {
  if (typeof switchPage === 'function') {
    switchPage('settings', document.querySelector('.nav-item[onclick*="settings"]'));
  }
  setTimeout(applySettings, 50);
}

function shouldUseDarkNow() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= getSunsetHour() || hour < getSunriseHour();
}

function getSunsetHour() { return 20; }
function getSunriseHour() { return 7; }

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