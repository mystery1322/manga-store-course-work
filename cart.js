// scripts/cart.js
// Управление корзиной: рендер, изменение количества через input, удаление, очистка.
// Ожидает наличие <section id="cart-root"></section> или <div id="cart-container"></div> на странице.

(function () {
  'use strict';

  const KEY = 'manga_cart_v1';

  // ----------------------
  // Helpers для работы с cart
  // ----------------------
  function loadCart() {
    try {
      const raw = localStorage.getItem(KEY);
      const cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      console.warn('loadCart: не удалось прочитать корзину', e);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('saveCart: не удалось сохранить корзину', e);
    }
    updateCartBadge();
  }

  function updateCartBadge() {
    const el = document.getElementById('cart-badge');
    if (!el) return;
    const cart = loadCart();
    const count = cart.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    el.textContent = String(count);
    el.classList.toggle('hidden', count === 0);
  }

  function formatPrice(p) {
    const n = Number(p || 0);
    if (!Number.isFinite(n)) return '0.00 ₽';
    return n.toFixed(2) + ' ₽';
  }

  // Простая экранировка для вставки в атрибуты/innerHTML (на всякий случай).
  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ----------------------
  // Render: создём DOM-узлы (без innerHTML для содержимого из данных)
  // ----------------------
  function renderCart(cart = loadCart()) {
    const root = document.querySelector('#cart-root') || document.querySelector('#cart-container') || document.body;
    // очищаем
    root.innerHTML = '';

    // Заголовок и контролы
    const header = document.createElement('div');
    header.className = 'cart-controls';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';

    const h3 = document.createElement('h3');
    const totalCount = cart.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    h3.textContent = `Ваша корзина (${totalCount} шт.)`;
    header.appendChild(h3);

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';

    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-cart';
    clearBtn.className = 'btn btn-danger';
    clearBtn.setAttribute('aria-label', 'Очистить корзину');
    clearBtn.textContent = 'Очистить корзину';
    controls.appendChild(clearBtn);

    header.appendChild(controls);
    root.appendChild(header);

    if (!cart.length) {
      const empty = document.createElement('div');
      empty.textContent = 'Корзина пуста';
      root.appendChild(empty);
      // тоже обновим итоговую сумму
      const summaryEmpty = document.createElement('div');
      summaryEmpty.className = 'cart-summary';
      summaryEmpty.style.marginTop = '14px';
      summaryEmpty.textContent = 'Итого: 0.00 ₽';
      root.appendChild(summaryEmpty);
      return;
    }

    // Список
    const ul = document.createElement('ul');
    ul.className = 'cart-list';
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';
    ul.style.display = 'flex';
    ul.style.flexDirection = 'column';
    ul.style.gap = '12px';

    cart.forEach(item => {
      const lineTotal = Number(item.price || 0) * Number(item.qty || 0);

      const li = document.createElement('li');
      li.className = 'cart-item';
      li.dataset.id = String(item.id);
      li.style.display = 'flex';
      li.style.gap = '12px';
      li.style.alignItems = 'flex-start';
      li.style.border = '1px solid #e6e6e6';
      li.style.padding = '12px';
      li.style.borderRadius = '8px';
      li.style.background = '#fff';

      const img = document.createElement('img');
      img.className = 'cart-img';
      img.src = item.img ? String(item.img) : 'images/missing.png';
      img.alt = item.title ? String(item.title) : '';
      li.appendChild(img);

      const content = document.createElement('div');
      content.style.flex = '1';
      content.style.minWidth = '0';

      const topRow = document.createElement('div');
      topRow.style.display = 'flex';
      topRow.style.justifyContent = 'space-between';
      topRow.style.alignItems = 'flex-start';
      topRow.style.gap = '8px';

      const info = document.createElement('div');
      const titleStrong = document.createElement('strong');
      titleStrong.style.display = 'block';
      titleStrong.textContent = item.title || 'Без названия';
      info.appendChild(titleStrong);

      const authorDiv = document.createElement('div');
      authorDiv.style.color = '#666';
      authorDiv.style.fontSize = '0.9rem';
      authorDiv.style.marginTop = '6px';
      authorDiv.textContent = 'Автор: ' + (item.author || '—');
      info.appendChild(authorDiv);

      topRow.appendChild(info);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-item icon-btn';
      removeBtn.title = 'Удалить товар';
      removeBtn.setAttribute('aria-label', `Удалить ${item.title || ''}`);
      removeBtn.style.background = 'transparent';
      removeBtn.style.border = 'none';
      removeBtn.style.fontSize = '18px';
      removeBtn.style.lineHeight = '1';
      removeBtn.style.cursor = 'pointer';
      removeBtn.textContent = '✕';
      topRow.appendChild(removeBtn);

      content.appendChild(topRow);

      const bottomRow = document.createElement('div');
      bottomRow.style.display = 'flex';
      bottomRow.style.justifyContent = 'space-between';
      bottomRow.style.alignItems = 'center';
      bottomRow.style.marginTop = '12px';
      bottomRow.style.gap = '12px';

      // Количество
      const qtyWrap = document.createElement('div');
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.fontSize = '0.9rem';
      label.style.color = '#444';
      label.style.marginBottom = '6px';
      label.textContent = 'Количество';
      qtyWrap.appendChild(label);

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'qty-input';
      input.min = '1';
      input.value = String(item.qty || 1);
      input.setAttribute('aria-label', `Количество ${item.title || ''}`);
      qtyWrap.appendChild(input);

      bottomRow.appendChild(qtyWrap);

      // Цена линии
      const priceWrap = document.createElement('div');
      priceWrap.style.textAlign = 'right';
      const priceDiv = document.createElement('div');
      priceDiv.style.fontWeight = '800';
      priceDiv.style.color = '#0a7a0a';
      priceDiv.style.fontSize = '1.05rem';
      priceDiv.textContent = formatPrice(lineTotal);
      priceWrap.appendChild(priceDiv);
      bottomRow.appendChild(priceWrap);

      content.appendChild(bottomRow);
      li.appendChild(content);
      ul.appendChild(li);
    });

    root.appendChild(ul);

    // Итог
    const total = cart.reduce((s, p) => s + (Number(p.price || 0) * Number(p.qty || 0)), 0);
    const summary = document.createElement('div');
    summary.className = 'cart-summary';
    summary.style.marginTop = '14px';
    summary.style.display = 'flex';
    summary.style.justifyContent = 'space-between';
    summary.style.alignItems = 'center';

    const totalDiv = document.createElement('div');
    totalDiv.style.fontWeight = '700';
    totalDiv.innerHTML = `Итого: <span class="cart-total">${formatPrice(total)}</span>`;
    summary.appendChild(totalDiv);

    const checkoutWrap = document.createElement('div');
    const checkoutBtn = document.createElement('button');
    checkoutBtn.id = 'checkout';
    checkoutBtn.className = 'btn';
    checkoutBtn.textContent = 'Оформить заказ';
    checkoutWrap.appendChild(checkoutBtn);
    summary.appendChild(checkoutWrap);

    root.appendChild(summary);
  }

  // ----------------------
  // Изменение количества, удаление, очистка
  // ----------------------
  function setQuantity(itemId, qty) {
    qty = Number(qty);
    if (!Number.isFinite(qty) || qty < 1) return;
    const cart = loadCart();
    const it = cart.find(x => String(x.id) === String(itemId));
    if (!it) return;
    it.qty = Math.floor(qty);
    saveCart(cart);
    renderCart(cart);
  }

  function removeItem(itemId) {
    let cart = loadCart();
    cart = cart.filter(x => String(x.id) !== String(itemId));
    saveCart(cart);
    renderCart(cart);
  }

  function clearCart() {
    localStorage.removeItem(KEY);
    updateCartBadge();
    renderCart();
  }

  // ----------------------
  // Делегирование событий
  // ----------------------
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.classList && el.classList.contains('qty-input')) {
      // небольшая задержка, чтобы не дергать слишком часто
      clearTimeout(el._qtyTimeout);
      el._qtyTimeout = setTimeout(() => {
        let val = Number(el.value);
        if (!Number.isFinite(val) || val < 1) { el.value = 1; val = 1; }
        const li = el.closest('.cart-item');
        if (!li) return;
        setQuantity(li.dataset.id, Math.floor(val));
      }, 300);
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.classList && el.classList.contains('qty-input')) {
      const li = el.closest('.cart-item');
      if (!li) return;
      const id = li.dataset.id;
      let val = Number(el.value);
      if (!Number.isFinite(val) || val < 1) { el.value = 1; val = 1; }
      setQuantity(id, Math.floor(val));
    }
  });

  document.addEventListener('click', (e) => {
    const rem = e.target.closest && e.target.closest('.remove-item');
    if (rem) {
      const li = rem.closest('.cart-item');
      if (!li) return;
      const id = li.dataset.id;
      removeItem(id);
      return;
    }

    if (e.target && e.target.id === 'clear-cart') {
      if (confirm('Очистить корзину?')) clearCart();
      return;
    }

    if (e.target && e.target.id === 'checkout') {
      alert('Функция оформления пока не реализована');
      return;
    }
  });

  // ----------------------
  // Инициализация и синхронизация
  // ----------------------
  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateCartBadge();
  });

  // Синхронизировать между вкладками
  window.addEventListener('storage', (ev) => {
    if (ev.key === KEY) {
      renderCart();
      updateCartBadge();
    }
  });
})();
