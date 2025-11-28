// scripts/product.js
(function () {
  const CART_KEY = 'manga_cart_v1';

  function getProductIdFromUrl() {
    return new URLSearchParams(location.search).get('id');
  }

  function formatPrice(p) {
    if (p === undefined || p === null) return '0.00 ₽';
    return Number(p).toFixed(2) + ' ₽';
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    if (typeof window.updateCartBadge === 'function') window.updateCartBadge();
  }

  function fallbackAddToCart(prod, qty = 1) {
    const cart = loadCart();
    const existing = cart.find(x => x.id === prod.id);
    if (existing) existing.qty = (existing.qty || 0) + Number(qty);
    else cart.push({
      id: prod.id,
      title: prod.title || ('Товар ' + prod.id),
      price: prod.price ?? 0,
      img: prod.img || 'images/missing.png',
      author: prod.author || '',
      qty: Number(qty)
    });
    saveCart(cart);
  }

  function renderNotFound(root, msg = 'Товар не найден') {
    root.innerHTML = `
      <div class="catalog-empty" style="padding:18px;text-align:center;">
        <h3>${msg}</h3>
        <p>Проверьте ссылку или вернитесь в <a href="catalog.html">каталог</a>.</p>
      </div>
    `;
  }

  function renderProduct(root, item) {
    root.innerHTML = `
      <article class="product-detail" style="display:grid;grid-template-columns:360px 1fr;gap:24px;align-items:start;border:1px solid #eee;padding:18px;border-radius:12px;background:#fff;">
        <div>
          <img src="${item.img || 'images/missing.png'}" alt="${item.title || ''}" style="width:100%;height:auto;object-fit:cover;border-radius:8px;max-height:640px;">
        </div>
        <div>
          <h1 style="margin-top:0;color:#2a1365">${item.title || 'Без названия'}</h1>
          <p style="margin:4px 0 10px;color:#666">Автор: ${item.author || '—'}</p>
          <p style="margin:6px 0 12px;color:#444"><strong>Жанры:</strong> ${Array.isArray(item.genre) ? item.genre.join(', ') : (item.genre || '—')}</p>
          <p style="margin:8px 0 20px;color:#333">${item.desc || 'Описание отсутствует.'}</p>

          <div style="display:flex;gap:12px;align-items:center;">
            <div style="font-size:1.4rem;font-weight:800;color:#0a7a0a">${formatPrice(item.price)}</div>
            <div>
              <button id="addToCartBtn" class="btn" aria-label="Добавить в корзину">Добавить в корзину</button>
            </div>
          </div>

          <div style="margin-top:14px;color:#666;font-size:0.95rem;">
            <p>Детали: состояние — новое. Доставка: 3-7 дней.</p>
          </div>
        </div>
      </article>
    `;
  }

  // Выполнение после загрузки DOM
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('product-root');
    if (!root) return console.warn('product.js: элемент #product-root не найден на странице.');

    const id = getProductIdFromUrl();
    if (!id) {
      renderNotFound(root, 'Товар не указан');
      return;
    }

    // Получаем список товаров: prefer window.PRODUCTS (products-data.js)
    const list = (window.PRODUCTS && Array.isArray(window.PRODUCTS)) ? window.PRODUCTS : [];
    const item = list.find(p => p.id === id);

    if (!item) {
      renderNotFound(root, 'Товар не найден');
      return;
    }

    renderProduct(root, item);

    const btn = document.getElementById('addToCartBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        // Если есть глобальная функция addToCart (например из catalog.js), вызываем её
        if (typeof window.addToCart === 'function') {
          try {
            window.addToCart(item.id, 1);
          } catch (e) {
            // если сломалось — fallback
            fallbackAddToCart(item, 1);
          }
        } else {
          // fallback: положим в localStorage
          fallbackAddToCart(item, 1);
        }

        // показываем уведомление: showToast если есть, иначе alert
        const msg = (item.title ? item.title + ' добавлен в корзину' : 'Товар добавлен в корзину');
        if (typeof window.showToast === 'function') {
          try { window.showToast(msg, 'success', 2000); } catch (e) { alert(msg); }
        } else {
          alert(msg);
        }
      });
    }
  });
})();
