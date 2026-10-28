/* =============================================================
SmartPrice — utils.js
Общие утилиты для всего приложения:
сжатие изображений, защита текста, OCR-предобработка,
виброотклик, индикатор офлайн.
============================================================= */

/* ---------- Универсальное сжатие изображений ---------- */
function compressImage(dataUrl, maxSide, quality) {
    maxSide = maxSide || 1000;
    quality = quality || 0.75;
    return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () {
            try {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                if (!width || !height) { resolve(dataUrl); return; }
                const scale = Math.min(1, maxSide / Math.max(width, height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(width * scale));
                canvas.height = Math.max(1, Math.round(height * scale));
                const context = canvas.getContext('2d');
                if (!context) { resolve(dataUrl); return; }
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } catch (e) { resolve(dataUrl); }
        };
        img.onerror = function () { resolve(dataUrl); };
        img.src = dataUrl;
    });
}

/* ---------- Защита текста от HTML-инъекций (XSS) ---------- */
/* ИСПРАВЛЕНО: функция полностью переписана для корректного экранирования */
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\\/g, '&#92;');
}

/* ---------- Предобработка фото для распознавания текста (чеки) ---------- */
function preprocessImageForOcr(dataUrl) {
    return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () {
            try {
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                if (!w || !h) { resolve(dataUrl); return; }
                const scale = Math.min(1, 1800 / Math.max(w, h));
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(w * scale));
                c.height = Math.max(1, Math.round(h * scale));
                const ctx = c.getContext('2d');
                if (!ctx) { resolve(dataUrl); return; }
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, c.width, c.height);
                if (typeof ctx.filter !== 'undefined') {
                    ctx.filter = 'grayscale(1) contrast(1.35) brightness(1.03)';
                }
                ctx.drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.85));
            } catch (e) { resolve(dataUrl); }
        };
        img.onerror = function () { resolve(dataUrl); };
        img.src = dataUrl;
    });
}

/* ---------- Виброотклик (Haptic Feedback) ---------- */
function haptic(pattern) {
    if (typeof db !== 'undefined' && db && db.settings && db.settings.hapticFeedback === false) {
        return;
    }
    if (navigator.vibrate) {
        try { navigator.vibrate(pattern || 40); } catch (e) {}
    }
}

/* ---------- Индикатор офлайн-режима ---------- */
/* ИСПРАВЛЕНО: убраны лишние пробелы внутри SVG-тегов, которые ломали отображение */
const ICON_WIFI_ONLINE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>';

const ICON_WIFI_OFFLINE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line><line x1="2" y1="2" x2="22" y2="22"></line></svg>';

function updateOfflineIndicator() {
    const icon = document.getElementById('offline-indicator');
    if (!icon) return;
    const isOnline = navigator.onLine;
    if (isOnline) {
        icon.classList.remove('offline');
        icon.classList.add('online');
        icon.innerHTML = ICON_WIFI_ONLINE;
        icon.title = 'Подключено к интернету';
    } else {
        icon.classList.remove('online');
        icon.classList.add('offline');
        icon.innerHTML = ICON_WIFI_OFFLINE;
        icon.title = 'Нет подключения к интернету';
    }
}

function initOfflineIndicator() {
    if (window.__offlineIndicatorInitialized) return;
    window.__offlineIndicatorInitialized = true;
    updateOfflineIndicator();
    window.addEventListener('online', updateOfflineIndicator);
    window.addEventListener('offline', updateOfflineIndicator);
    setInterval(updateOfflineIndicator, 60000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOfflineIndicator, { once: true });
} else {
    initOfflineIndicator();
}