/* =============================================================
SmartPrice — swipe.js
Плавные переходы между страницами. Свайп пальцем и стрелки клавиатуры.
ИСПРАВЛЕНО:
1) стрелки клавиатуры не переключают страницы, если поверх открыт
   любой оверлей (подтверждение, режим покупок, карта, фото и т.д.);
2) при переходе отрисовывается только нужная страница (быстрее);
3) удалены мёртвые функции-совместимости.
============================================================= */

let pageTransitionLock = false;

function getPagesList() {
  return (typeof pages !== 'undefined' && Array.isArray(pages)) ? pages : [];
}

function getSwipeable() {
  return (typeof swipeablePages !== 'undefined' && Array.isArray(swipeablePages)) ? swipeablePages : [];
}

function prefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

function currentActivePageId() {
  const el = document.querySelector('.page.active');
  return el ? el.id.replace('page-', '') : null;
}

/* Есть ли поверх страницы любой открытый оверлей/окно */
function isAnyOverlayOpen() {
  const fv = document.getElementById('fullscreen-viewer');
  const fvOpen = fv && getComputedStyle(fv).display !== 'none';
  return !!(
    document.querySelector('.modal-overlay.active') ||
    document.querySelector('.cart-confirm-overlay') ||
    document.querySelector('.sel-actions-overlay') ||
    document.querySelector('.voice-modal-overlay') ||
    document.querySelector('.receipt-overlay') ||
    document.querySelector('.store-confirm-overlay') ||
    document.querySelector('.store-map-overlay') ||
    document.querySelector('.sp-modal-root') ||
    document.getElementById('unsaved-prompt-overlay') ||
    document.getElementById('shopping-mode-overlay') ||
    fvOpen
  );
}

function updateNavForPage(pageId) {
  const swipe = getSwipeable();
  const idx = swipe.indexOf(pageId);
  const items = document.querySelectorAll('.nav-item');
  items.forEach(function (i) { i.classList.remove('active'); });
  if (idx >= 0 && items[idx]) items[idx].classList.add('active');
}

/* Отрисовка только нужной страницы вместо всех сразу */
function renderPageContent(pageId) {
  if (pageId === 'products') { if (typeof renderProducts === 'function') renderProducts(); }
  else if (pageId === 'cart') { if (typeof renderCart === 'function') renderCart(); }
  else if (pageId === 'prices') { if (typeof renderStoresComparison === 'function') renderStoresComparison(); }
  else if (pageId === 'stores') { if (typeof renderStores === 'function') renderStores(); }
}

function switchPageSmooth(targetId, direction) {
  if (pageTransitionLock) return;
  const cur = currentActivePageId();
  if (cur === targetId) return;
  const targetEl = document.getElementById('page-' + targetId);
  if (!targetEl) return;
  const curEl = cur ? document.getElementById('page-' + cur) : null;

  pageTransitionLock = true;
  if (curEl) curEl.classList.remove('active');
  targetEl.classList.add('active');

  const mc = document.getElementById('main-container');
  if (mc) mc.scrollTop = 0;

  updateNavForPage(targetId);
  renderPageContent(targetId);

  if (typeof updateComparisonToggleIcon === 'function') updateComparisonToggleIcon();

  if (!prefersReducedMotion()) {
    targetEl.classList.remove('page-anim-next', 'page-anim-prev');
    void targetEl.offsetWidth;
    targetEl.classList.add(direction === 'next' ? 'page-anim-next' : 'page-anim-prev');
    setTimeout(function () {
      targetEl.classList.remove('page-anim-next', 'page-anim-prev');
      pageTransitionLock = false;
    }, 260);
  } else {
    pageTransitionLock = false;
  }

  if (typeof attachRipple === 'function') setTimeout(attachRipple, 60);
}

function initSwipe() {
  const mc = document.getElementById('main-container');
  if (!mc) return;

  let sx = 0, sy = 0, tracking = false;

  mc.addEventListener('touchstart', function (e) {
    if (isAnyOverlayOpen()) return;
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; tracking = true;
  }, { passive: true });

  mc.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    if (isAnyOverlayOpen()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const swipe = getSwipeable();
    const cur = currentActivePageId();
    const idx = swipe.indexOf(cur);
    if (idx < 0) return;
    const target = dx < 0 ? swipe[idx + 1] : swipe[idx - 1];
    if (!target) return;
    switchPageSmooth(target, dx < 0 ? 'next' : 'prev');
  }, { passive: true });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (isAnyOverlayOpen()) return;
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;
    const swipe = getSwipeable();
    const cur = currentActivePageId();
    const idx = swipe.indexOf(cur);
    if (idx < 0) return;
    const target = e.key === 'ArrowRight' ? swipe[idx + 1] : swipe[idx - 1];
    if (!target) return;
    switchPageSmooth(target, e.key === 'ArrowRight' ? 'next' : 'prev');
  });
}