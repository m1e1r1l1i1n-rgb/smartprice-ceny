/* =============================================================
SmartPrice — storage.js (безопасная версия, одна резервная копия)
Что добавлено:
- контроль переполнения памяти браузера;
- одна резервная копия при каждом сохранении;
- восстановление данных при повреждении;
- понятные сообщения пользователю;
- аккуратные модальные окна вместо alert/confirm;
- безопасный импорт с резервной копией;
- предупреждения о памяти показываются ОДИН РАЗ за уровень.
============================================================= */

/* ---------- Настройки по умолчанию ---------- */
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
    multiStoreColor: '#d93838',
    addProductBtnColor: '#27AA5A'
  };
}

/* ---------- Приведение данных к безопасному виду ---------- */
function normalizeDB(src) {
  const out = (src && typeof src === 'object') ? src : {};
  const defaults = getDefaultSettings();
  out.settings = Object.assign({}, defaults, out.settings || {});
  if (out.settings.addProductBtnColor === '#00875a') {
    out.settings.addProductBtnColor = '#27AA5A';
  }
  if (!out.collapsedCategories) out.collapsedCategories = {};
  if (!out.products) out.products = [];
  if (!out.cart) out.cart = [];
  if (!out.pharmacies) out.pharmacies = [];
  if (out.stores && out.stores.length > 0 && typeof out.stores[0] === 'string') {
    const defaultCols = ['#00875a', '#3b82f6', '#d93838', '#f59e0b', '#8b5cf6', '#ec4899'];
    out.stores = out.stores.map(function (sName, idx) {
      return {
        name: sName,
        color: defaultCols[idx % defaultCols.length],
        image: '',
        address: '',
        type: 'store'
      };
    });
  }
  if (!out.stores) out.stores = [];
  out.stores.forEach(function (s) {
    if (s.image === undefined) s.image = '';
    if (s.address === undefined) s.address = '';
    if (s.type === undefined) s.type = 'store';
  });
  out.pharmacies.forEach(function (s) {
    if (s.image === undefined) s.image = '';
    if (s.address === undefined) s.address = '';
    if (s.type === undefined) s.type = 'pharmacy';
  });
  out.products.forEach(function (p) {
    if (!p.prices) p.prices = {};
    if (!p.dates) p.dates = {};
    if (!p.priceHistory) p.priceHistory = {};
  });
  return out;
}

/* =============================================================
Аккуратные модальные окна для системных сообщений
============================================================= */
let spModalStylesAdded = false;
function spEnsureModalStyles() {
  if (spModalStylesAdded) return;
  spModalStylesAdded = true;
  const style = document.createElement('style');
  style.textContent = `.sp-modal-root { position: fixed; inset: 0; z-index: 12000; display: flex; align-items: center; justify-content: center; padding: 1rem; } .sp-modal-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); opacity: 0; transition: opacity 0.22s ease; } .sp-modal-window { position: relative; width: 100%; max-width: 340px; background: var(--card-bg, #ffffff); color: var(--text-color, #222222); border-radius: 16px; padding: 1.1rem 1rem 1rem; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35); transform: translateY(14px) scale(0.96); opacity: 0; transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease; } .sp-modal-root.active .sp-modal-overlay { opacity: 1; } .sp-modal-root.active .sp-modal-window { transform: none; opacity: 1; } .sp-modal-title { font-weight: 800; font-size: 1.02rem; margin-bottom: 0.4rem; } .sp-modal-text { font-size: 0.92rem; line-height: 1.45; white-space: pre-line; opacity: 0.92; margin-bottom: 0.9rem; } .sp-modal-actions { display: flex; gap: 0.6rem; justify-content: flex-end; flex-wrap: wrap; } .sp-modal-btn { border: none; border-radius: 0.6rem; padding: 0.6rem 0.9rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: transform 0.1s ease, opacity 0.2s ease; } .sp-modal-btn:active { transform: translateY(1px); } .sp-modal-btn-confirm { background: var(--primary-color, #27AA5A); color: #ffffff; } .sp-modal-btn-danger { background: var(--danger-color, #d93838); color: #ffffff; } .sp-modal-btn-cancel { background: transparent; border: 1px solid var(--border-color, #cccccc); color: var(--text-color, #333333); }`;
  document.head.appendChild(style);
}

function appShowModal(opts) {
  opts = opts || {};
  return new Promise(function (resolve) {
    if (!document.body) {
      resolve(false);
      return;
    }
    spEnsureModalStyles();
    const root = document.createElement('div');
    root.className = 'sp-modal-root';
    root.innerHTML =
      '<div class="sp-modal-overlay"></div>' +
      '<div class="sp-modal-window" role="dialog" aria-modal="true">' +
        '<div class="sp-modal-title"></div>' +
        '<div class="sp-modal-text"></div>' +
        '<div class="sp-modal-actions"></div>' +
      '</div>';
    const overlay = root.querySelector('.sp-modal-overlay');
    const titleEl = root.querySelector('.sp-modal-title');
    const textEl = root.querySelector('.sp-modal-text');
    const actionsEl = root.querySelector('.sp-modal-actions');
    if (opts.title) {
      titleEl.textContent = opts.title;
    } else {
      titleEl.style.display = 'none';
    }
    textEl.textContent = opts.message || '';
    let closed = false;
    function close(result) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', keyHandler);
      root.classList.remove('active');
      setTimeout(function () {
        root.remove();
      }, 220);
      resolve(result);
    }
    function keyHandler(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(opts.hideCancel ? undefined : false);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        close(opts.hideCancel ? undefined : true);
      }
    }
    document.addEventListener('keydown', keyHandler);
    overlay.addEventListener('click', function () {
      close(opts.hideCancel ? undefined : false);
    });
    if (!opts.hideCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'sp-modal-btn sp-modal-btn-cancel';
      cancelBtn.textContent = opts.cancelText || 'Отмена';
      cancelBtn.onclick = function () {
        close(false);
      };
      actionsEl.appendChild(cancelBtn);
    }
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'sp-modal-btn ' + (opts.danger ? 'sp-modal-btn-danger' : 'sp-modal-btn-confirm');
    confirmBtn.textContent = opts.confirmText || 'OK';
    confirmBtn.onclick = function () {
      close(opts.hideCancel ? undefined : true);
    };
    actionsEl.appendChild(confirmBtn);
    document.body.appendChild(root);
    requestAnimationFrame(function () {
      root.classList.add('active');
    });
    confirmBtn.focus();
  });
}

function appAlert(message, options) {
  return appShowModal(Object.assign({
    title: 'Информация',
    message: message,
    confirmText: 'OK',
    hideCancel: true
  }, options || {}));
}

function appConfirm(message, options) {
  return appShowModal(Object.assign({
    title: 'Подтверждение',
    message: message,
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    hideCancel: false
  }, options || {}));
}

/* =============================================================
Монитор памяти браузера (ТИХИЙ: предупреждает один раз за уровень)
============================================================= */
let spLastWarningLevel = 0;
let spQuotaAlertShown = false;

function spGetPressureAck() {
  try {
    const raw = localStorage.getItem('sp_pressure_ack');
    if (!raw) return 0;
    const v = parseInt(raw, 10);
    return isNaN(v) ? 0 : v;
  } catch (e) {
    return 0;
  }
}

function spSetPressureAck(level) {
  try {
    localStorage.setItem('sp_pressure_ack', String(level));
  } catch (e) {}
}

function getStorageUsageBytes() {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key) || '';
      total += (key.length + value.length) * 2;
    }
  } catch (e) {
    return 0;
  }
  return total;
}

function checkStoragePressure() {
  try {
    const usage = getStorageUsageBytes();
    const limit = 5 * 1024 * 1024;
    const percent = Math.min(100, Math.round((usage / limit) * 100));
    let level = 0;
    if (percent >= 95) level = 3;
    else if (percent >= 85) level = 2;
    else if (percent >= 70) level = 1;
    if (level === 0) {
      spLastWarningLevel = 0;
      return;
    }
    if (level <= spLastWarningLevel) return;
    spLastWarningLevel = level;
    const ack = spGetPressureAck();
    if (level <= ack) return;
    if (level === 1) {
      spSetPressureAck(level);
      return;
    }
    if (level === 2) {
      spSetPressureAck(level);
      if (typeof showToast === 'function') {
        showToast('💾 Память заполнена на ' + percent + '%. Копию данных можно сделать в Опциях → Экспорт.', 4000);
      }
      return;
    }
    spSetPressureAck(level);
    appConfirm(
      'Память браузера заполнена примерно на ' + percent + '%.\n\nРекомендуется скачать резервную копию данных, чтобы не потерять товары, магазины и цены.\n\nСкачать копию сейчас?',
      {
        title: 'Мало места',
        confirmText: 'Скачать копию',
        cancelText: 'Позже'
      }
    ).then(function (ok) {
      if (ok) exportData();
    });
  } catch (e) {
    // Монитор памяти не должен ломать основную работу
  }
}

/* =============================================================
Сохранение и восстановление (упрощённое: одна резервная копия)
============================================================= */
function saveDB() {
  try {
    const serialized = JSON.stringify(db);
    
    // Сначала сохраняем основное
    localStorage.setItem(STORAGE_KEY, serialized);
    
    // Потом создаём одну резервную копию
    try {
      localStorage.setItem(STORAGE_KEY + '_backup', serialized);
    } catch (e) {
      // Если резервная копия не влезла — не страшно, основное сохранено
    }
    
    checkStoragePressure();
  } catch (e) {
    console.error('Ошибка автосохранения:', e);
    if (!spQuotaAlertShown) {
      spQuotaAlertShown = true;
      appAlert(
        'Не удалось сохранить данные.\nСкорее всего, память браузера переполнена.\n\nСкачайте резервную копию и попробуйте удалить большие фотографии товаров или магазинов.',
        {
          title: 'Ошибка сохранения',
          confirmText: 'Понятно',
          danger: true
        }
      );
    }
  }
}

function restoreData() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    saved = null;
  }
  if (!saved) {
    db = normalizeDB(typeof db !== 'undefined' ? db : {});
    return;
  }
  let parsed = null;
  try {
    parsed = JSON.parse(saved);
  } catch (e) {
    parsed = null;
  }
  const looksValid =
    parsed &&
    typeof parsed === 'object' &&
    (Array.isArray(parsed.products) || Array.isArray(parsed.cart) || parsed.settings);
  if (!looksValid) {
    handleCorruptedData();
    return;
  }
  db = normalizeDB(parsed);
}

function handleCorruptedData() {
  let backupParsed = null;
  try {
    const backup = localStorage.getItem(STORAGE_KEY + '_backup');
    if (backup) {
      const p = JSON.parse(backup);
      if (p && typeof p === 'object') {
        backupParsed = p;
      }
    }
  } catch (e) {
    backupParsed = null;
  }
  if (backupParsed) {
    db = normalizeDB(backupParsed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      // Если не удалось сохранить восстановленное, хотя бы показываем его в памяти
    }
    appAlert(
      'Основные данные были повреждены.\nПрограмма автоматически восстановила последнюю резервную копию.',
      {
        title: 'Восстановление данных'
      }
    );
  } else {
    db = normalizeDB(typeof db !== 'undefined' ? db : {});
    appAlert(
      'Данные были повреждены, и резервная копия тоже оказалась недоступна.\nПрограмма создала чистую структуру, чтобы продолжить работу.',
      {
        title: 'Ошибка данных',
        danger: true
      }
    );
  }
}

/* =============================================================
Экспорт / импорт / копирование
============================================================= */
async function openOrSaveToFolder(osType) {
  const jsonData = JSON.stringify(db, null, 2);
  const fileName = 'Save_SmartPrice.json';
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'JSON файл',
          accept: { 'application/json': ['.json'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(jsonData);
      await writable.close();
      if (typeof showToast === 'function') {
        showToast('✅ Файл сохранён в выбранную папку');
      }
      return;
    } catch (e) {
      if (e.name === 'AbortError') {
        if (typeof showToast === 'function') {
          showToast('Отменено пользователем');
        }
        return;
      }
    }
  }
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') {
    showToast('Файл скачан в Загрузки');
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(function () {
        if (typeof showToast === 'function') showToast('📋 Путь скопирован');
      })
      .catch(function () {
        fallbackCopy(text);
      });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    if (typeof showToast === 'function') {
      showToast('📋 Путь скопирован');
    }
  } catch (e) {
    if (typeof showToast === 'function') {
      showToast('Не удалось скопировать');
    }
  }
  document.body.removeChild(ta);
}

function openSavePathsModal() {
  openModalEl('save-paths-modal');
}

function closeSavePathsModal() {
  closeModalEl('save-paths-modal');
}

function closeSavePathsModalOnOutside(e) {
  if (e.target.id === 'save-paths-modal') {
    closeSavePathsModal();
  }
}

function exportData() {
  try {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = STORAGE_KEY;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    if (typeof showToast === 'function') {
      showToast(' Файл сохранён');
    }
  } catch (e) {
    appAlert('Не удалось сохранить файл.', {
      title: 'Ошибка экспорта',
      danger: true
    });
  }
}

function importData(event) {
  const input = event.target;
  const file = input && input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function (evt) {
    let parsed = null;
    try {
      parsed = JSON.parse(evt.target.result);
    } catch (e) {
      appAlert(
        'Ошибка чтения файла.\nФайл повреждён или имеет неверный формат.',
        {
          title: 'Импорт данных',
          danger: true
        }
      );
      input.value = '';
      return;
    }
    if (!parsed || typeof parsed !== 'object') {
      appAlert('Неверный формат файла.', {
        title: 'Импорт данных',
        danger: true
      });
      input.value = '';
      return;
    }
    const ok = await appConfirm(
      'Текущие данные будут заменены данными из файла.\n\nПеред импортом будет создана резервная копия.\n\nПродолжить?',
      {
        title: 'Импорт данных',
        confirmText: 'Импортировать',
        cancelText: 'Отмена',
        danger: true
      }
    );
    if (!ok) {
      input.value = '';
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY + '_before_import', JSON.stringify(db));
    } catch (e) {
      // Если не влезло, всё равно продолжаем импорт
    }
    db = normalizeDB(parsed);
    saveDB();
    if (typeof applySettings === 'function') {
      applySettings();
    }
    if (typeof renderAll === 'function') {
      renderAll();
    }
    appAlert('Данные успешно импортированы!', {
      title: 'Импорт данных'
    });
    input.value = '';
  };
  reader.readAsText(file, 'UTF-8');
}