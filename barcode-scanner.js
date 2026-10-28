/* =============================================================
SmartPrice — barcode-scanner.js
Сканирование штрих-кодов через камеру.
Использует библиотеку html5-qrcode и базу Open Food Facts.
ДОБАВЛЕНО: автоматическое заполнение полей при сканировании.
============================================================= */

/* ---------- Загрузка библиотеки html5-qrcode ---------- */
function loadHtml5Qrcode() {
    if (window.Html5Qrcode) return Promise.resolve();
    if (window.__html5QrcodePromise) return window.__html5QrcodePromise;
    window.__html5QrcodePromise = new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.onload = function () {
            if (window.Html5Qrcode) resolve();
            else { window.__html5QrcodePromise = null; reject(new Error('Библиотека не загрузилась')); }
        };
        script.onerror = function () {
            window.__html5QrcodePromise = null;
            reject(new Error('Не удалось загрузить модуль сканирования'));
        };
        document.head.appendChild(script);
    });
    return window.__html5QrcodePromise;
}

/* ---------- Запрос в Open Food Facts ---------- */
function fetchProductFromOFF(barcode) {
    const url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(barcode) + '.json';
    return fetch(url)
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            if (!data || data.status !== 1 || !data.product) return null;
            const p = data.product;
            return {
                barcode: barcode,
                name: p.product_name || p.generic_name || '',
                brand: p.brands || '',
                imageUrl: p.image_url || p.image_front_url || '',
                categories: p.categories_tags || [],
                quantity: p.quantity || ''
            };
        })
        .catch(function () {
            return null;
        });
}

/* ---------- Преобразование категорий Open Food Facts в наши ---------- */
function mapOFFCategory(offCategories) {
    if (!Array.isArray(offCategories) || !offCategories.length) return 'other';
    const joined = offCategories.join(' ').toLowerCase();
    if (/milk|dairy|cheese|yogurt|butter|cream/.test(joined)) return 'milk';
    if (/meat|beef|pork|chicken|fish|seafood|salmon/.test(joined)) return 'meat';
    if (/sausage|salami|ham|bacon/.test(joined)) return 'sausage';
    if (/fruit|vegetable|apple|banana|tomato|potato|carrot|salad/.test(joined)) return 'veg';
    if (/bread|bakery|croissant|baguette/.test(joined)) return 'bread';
    if (/cereal|pasta|rice|flour|sugar|salt|spice|tea|coffee|oat/.test(joined)) return 'grocery';
    if (/beverage|drink|juice|water|soda|beer|wine/.test(joined)) return 'drinks';
    if (/frozen|ice-cream|pizza/.test(joined)) return 'frozen';
    if (/snack|chip|chocolate|candy|nut|biscuit|cookie/.test(joined)) return 'snacks';
    if (/canned|preserve|tin/.test(joined)) return 'canned';
    if (/household|cleaning|paper|tissue/.test(joined)) return 'household';
    if (/beauty|cosmetic|shampoo|soap|detergent/.test(joined)) return 'chem';
    return 'other';
}

/* ---------- Скачивание картинки товара ---------- */
function downloadImageAsDataUrl(url) {
    return new Promise(function (resolve) {
        if (!url) { resolve(''); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(''); return; }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            } catch (e) {
                resolve('');
            }
        };
        img.onerror = function () { resolve(''); };
        img.src = url;
    });
}

/* ---------- Главная функция: открыть сканер ---------- */
function openBarcodeScanner() {
    /* Если режим "Лекарства" — показываем "В разработке" */
    if (typeof currentProductsType !== 'undefined' && currentProductsType === 'meds') {
        if (typeof appAlert === 'function') {
            appAlert(
                '🚧 Функция в разработке\n\nВ будущих версиях можно будет сканировать штрих-коды лекарств.',
                { title: '💊 Сканирование лекарств' }
            );
        } else {
            alert('Функция сканирования лекарств в разработке');
        }
        return;
    }

    /* Проверка интернета */
    if (!navigator.onLine) {
        if (typeof appAlert === 'function') {
            appAlert(
                'Для сканирования штрих-кодов нужно подключение к интернету.\n\nПодключитесь к сети и попробуйте снова.',
                { title: 'Нет интернета' }
            );
        }
        return;
    }

    /* Открываем модальное окно сканера */
    openBarcodeScannerModal();
}

/* ---------- Модальное окно сканера ---------- */
let barcodeScannerInstance = null;
let barcodeScannerOverlay = null;

function openBarcodeScannerModal() {
    /* Создаём оверлей */
    const overlay = document.createElement('div');
    overlay.className = 'barcode-scanner-overlay';
    overlay.innerHTML = `
        <div class="barcode-scanner-box">
            <div class="barcode-scanner-header">
                <div class="barcode-scanner-title">📷 Сканирование штрих-кода</div>
                <button type="button" class="barcode-scanner-close">✕</button>
            </div>
            <div class="barcode-scanner-note">Наведите камеру на штрих-код товара. Нужен интернет для поиска в базе.</div>
            <div id="barcode-reader" class="barcode-reader-area"></div>
            <div class="barcode-scanner-status" id="barcode-scanner-status">Наведите на штрих-код...</div>
            <div class="barcode-scanner-buttons">
                <label class="btn-3d-dark barcode-file-label">
                    🖼️ Из файла
                    <input type="file" accept="image/*" id="barcode-file-input" style="display:none;">
                </label>
                <button type="button" class="btn-3d-dark" id="barcode-cancel-btn">Отмена</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    barcodeScannerOverlay = overlay;

    /* Обработчики закрытия */
    const closeBtn = overlay.querySelector('.barcode-scanner-close');
    const cancelBtn = overlay.querySelector('#barcode-cancel-btn');
    const closeOverlay = function () {
        stopBarcodeScanner();
        overlay.remove();
        barcodeScannerOverlay = null;
    };
    closeBtn.onclick = closeOverlay;
    cancelBtn.onclick = closeOverlay;
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeOverlay();
    });

    /* Загружаем библиотеку и запускаем сканер */
    const statusEl = overlay.querySelector('#barcode-scanner-status');
    statusEl.textContent = 'Загружаем модуль сканирования...';

    loadHtml5Qrcode()
        .then(function () {
            statusEl.textContent = 'Наведите на штрих-код...';
            startBarcodeScanner();
        })
        .catch(function (err) {
            statusEl.textContent = 'Ошибка: ' + (err.message || 'не удалось загрузить модуль');
            if (typeof appAlert === 'function') {
                appAlert('Не удалось загрузить модуль сканирования.\n\nПроверьте интернет и попробуйте снова.', { title: 'Ошибка' });
            }
        });

    /* Обработка файла (фото штрих-кода) */
    const fileInput = overlay.querySelector('#barcode-file-input');
    fileInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        handleBarcodeFile(file);
    });
}

/* ---------- Запуск сканера ---------- */
function startBarcodeScanner() {
    if (!window.Html5Qrcode) return;
    const readerDiv = document.getElementById('barcode-reader');
    if (!readerDiv) return;

    barcodeScannerInstance = new Html5Qrcode('barcode-reader');

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
    };

    barcodeScannerInstance.start(
        { facingMode: 'environment' },
        config,
        function (decodedText) {
            /* Успешное сканирование */
            haptic(40);
            stopBarcodeScanner();
            handleBarcodeResult(decodedText);
        },
        function (errorMessage) {
            /* Ошибка распознавания (игнорируем — это нормально при поиске) */
        }
    )
    .catch(function (err) {
        const statusEl = document.getElementById('barcode-scanner-status');
        if (statusEl) {
            if (err && err.toString && err.toString().indexOf('NotAllowed') >= 0) {
                statusEl.textContent = 'Нет доступа к камере';
                if (typeof appAlert === 'function') {
                    appAlert(
                        'Разрешите доступ к камере в настройках браузера, чтобы сканировать штрих-коды.',
                        { title: 'Нет доступа к камере' }
                    );
                }
            } else {
                statusEl.textContent = 'Ошибка запуска камеры';
                if (typeof appAlert === 'function') {
                    appAlert('Не удалось запустить камеру.\n\n' + (err.message || ''), { title: 'Ошибка' });
                }
            }
        }
    });
}

/* ---------- Остановка сканера ---------- */
function stopBarcodeScanner() {
    if (barcodeScannerInstance) {
        try {
            barcodeScannerInstance.stop().then(function () {
                barcodeScannerInstance.clear();
                barcodeScannerInstance = null;
            }).catch(function () {
                barcodeScannerInstance = null;
            });
        } catch (e) {
            barcodeScannerInstance = null;
        }
    }
}

/* ---------- Обработка файла (фото штрих-кода) ---------- */
function handleBarcodeFile(file) {
    if (!window.Html5Qrcode) return;
    const statusEl = document.getElementById('barcode-scanner-status');
    if (statusEl) statusEl.textContent = 'Распознаём штрих-код на фото...';

    const tempScanner = new Html5Qrcode('barcode-reader');
    tempScanner.scanFile(file, true)
        .then(function (decodedText) {
            haptic(40);
            handleBarcodeResult(decodedText);
        })
        .catch(function () {
            if (statusEl) statusEl.textContent = 'Не удалось распознать штрих-код на фото';
            if (typeof showToast === 'function') showToast('Штрих-код не распознан');
        });
}

/* ---------- Обработка результата сканирования ---------- */
function handleBarcodeResult(barcode) {
    const statusEl = document.getElementById('barcode-scanner-status');
    if (statusEl) statusEl.textContent = '🔍 Ищем товар в базе... (' + barcode + ')';

    fetchProductFromOFF(barcode)
        .then(function (product) {
            if (product && product.name) {
                /* Товар найден */
                if (statusEl) statusEl.textContent = '✅ Найден: ' + product.name;
                fillProductFromBarcode(product);
            } else {
                /* Товар не найден */
                if (statusEl) statusEl.textContent = '❌ Товар не найден в базе';
                showBarcodeNotFoundDialog(barcode);
            }
        })
        .catch(function () {
            if (statusEl) statusEl.textContent = 'Ошибка поиска в базе';
            if (typeof appAlert === 'function') {
                appAlert('Не удалось получить данные о товаре.\n\nПроверьте интернет и попробуйте снова.', { title: 'Ошибка' });
            }
        });
}

/* ---------- Заполнение полей товара данными из штрих-кода ---------- */
async function fillProductFromBarcode(product) {
    /* Закрываем окно сканера */
    if (barcodeScannerOverlay) {
        barcodeScannerOverlay.remove();
        barcodeScannerOverlay = null;
    }

    /* Скачиваем картинку товара */
    let imageData = '';
    if (product.imageUrl) {
        imageData = await downloadImageAsDataUrl(product.imageUrl);
        if (imageData && imageData.length > 300000) {
            imageData = await compressImage(imageData, 600, 0.7);
        }
    }

    /* Определяем категорию */
    const categoryId = mapOFFCategory(product.categories);

    /* Открываем окно добавления товара */
    if (typeof openAddProductModal === 'function') {
        openAddProductModal();
    }

    /* Ждём, пока окно откроется, и заполняем поля */
    setTimeout(function () {
        /* Название */
        const nameInput = document.getElementById('new-name');
        if (nameInput) {
            let fullName = product.name;
            if (product.brand && fullName.indexOf(product.brand) < 0) {
                fullName = product.brand + ' ' + fullName;
            }
            if (product.quantity) {
                fullName = fullName + ' ' + product.quantity;
            }
            nameInput.value = fullName.trim();
        }

        /* Картинка */
        if (imageData) {
            tempImage = imageData;
            const preview = document.getElementById('new-prod-preview');
            const placeholder = document.getElementById('new-prod-placeholder');
            if (preview) {
                preview.src = tempImage;
                preview.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
        }

        /* Категория */
        const catSelect = document.getElementById('new-category');
        if (catSelect && categoryId) {
            catSelect.value = categoryId;
        }

        /* Единица — по умолчанию "шт" */
        const unitSelect = document.getElementById('new-unit');
        if (unitSelect) unitSelect.value = 'шт';

        if (typeof showToast === 'function') {
            showToast('✅ Товар найден. Введите цену.');
        }
    }, 300);
}

/* ---------- Диалог "Товар не найден" ---------- */
function showBarcodeNotFoundDialog(barcode) {
    const overlay = document.createElement('div');
    overlay.className = 'cart-confirm-overlay';
    overlay.innerHTML = `
        <div class="cart-confirm-box" style="text-align:center;">
            <div class="cart-confirm-title">❌ Товар не найден</div>
            <p style="font-size:0.9rem;color:#777;margin-bottom:1rem;line-height:1.4;">
                Штрих-код <b>${escapeHtml(barcode)}</b> не найден в базе Open Food Facts.<br><br>
                Это нормально для местных товаров и новых продуктов.
            </p>
            <button type="button" id="barcode-manual-btn" style="background:var(--primary-color);color:#fff;width:100%;padding:0.75rem;font-size:1rem;font-weight:700;border:none;border-radius:0.5rem;margin-bottom:0.5rem;cursor:pointer;">
                ✏️ Ввести вручную
            </button>
            <button type="button" id="barcode-cancel-btn" style="background:var(--border-color);color:var(--text-color);width:100%;padding:0.75rem;font-size:1rem;font-weight:700;border:none;border-radius:0.5rem;cursor:pointer;">
                Отмена
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = function () {
        overlay.remove();
        /* Закрываем и окно сканера */
        if (barcodeScannerOverlay) {
            barcodeScannerOverlay.remove();
            barcodeScannerOverlay = null;
        }
    };

    overlay.querySelector('#barcode-cancel-btn').onclick = close;
    overlay.querySelector('#barcode-manual-btn').onclick = function () {
        close();
        /* Открываем обычное окно добавления товара */
        if (typeof openAddProductModal === 'function') {
            openAddProductModal();
        }
    };
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
    });
}

/* ---------- Добавление кнопки сканера на страницу товаров ---------- */
function injectBarcodeScanButton() {
    const header = document.querySelector('#page-products .products-sticky-header');
    if (!header) return;
    if (header.querySelector('.barcode-scan-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'barcode-scan-btn';
    btn.innerHTML = '📷 Сканировать штрих-код';
    btn.onclick = function () { openBarcodeScanner(); };

    /* Вставляем после кнопки "Импорт чека" */
    const receiptBtn = header.querySelector('.receipt-scan-btn');
    if (receiptBtn && receiptBtn.parentNode === header) {
        receiptBtn.insertAdjacentElement('afterend', btn);
    } else {
        header.appendChild(btn);
    }
}

/* ---------- Инициализация ---------- */
function initBarcodeScanner() {
    injectBarcodeScanButton();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBarcodeScanner, { once: true });
} else {
    initBarcodeScanner();
}