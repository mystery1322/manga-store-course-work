// scripts/cart.js
// Управление корзиной: рендер, изменение количества через input, удаление, очистка.
// Ожидает наличие <section id="cart-root"></section> на странице.
(function(){
  const KEY = 'manga_cart_v1';

  function loadCart(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ return []; }
  }
  function saveCart(cart){
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function updateCartBadge(){
    const el = document.getElementById('cart-badge');
    if(!el) return;
    const cart = loadCart();
    const count = cart.reduce((s,p)=>s+(p.qty||0),0);
    el.textContent = count;
    el.classList.toggle('hidden', count===0);
  }

  function formatPrice(p){ return Number(p).toFixed(2) + ' ₽'; }

  // Рендер корзины
  function renderCart(){
    const root = document.getElementById('cart-root');
    if(!root) return console.warn('cart.js: root not found');

    const cart = loadCart();
    if(!cart.length){
      root.innerHTML = `
        <div class="cart-empty">
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из <a href="catalog.html">каталога</a>.</p>
        </div>`;
      return;
    }

    // Общая сумма
    const total = cart.reduce((s,p)=> s + (Number(p.price || 0) * Number(p.qty || 0)), 0);

    // Строим HTML
    let html = `<div class="cart-controls" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <h3>Ваша корзина (${cart.reduce((s,p)=>s+(p.qty||0),0)} шт.)</h3>
                  <div style="display:flex;gap:8px;align-items:center;">
                    <button id="clear-cart" class="btn btn-danger" aria-label="Очистить корзину">Очистить корзину</button>
                  </div>
                </div>`;

    html += `<ul class="cart-list" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">`;

    cart.forEach(item => {
      const lineTotal = Number(item.price || 0) * Number(item.qty || 0);
      html += `
        <li class="cart-item" data-id="${item.id}" style="display:flex;gap:12px;align-items:flex-start;border:1px solid #e6e6e6;padding:12px;border-radius:8px;background:#fff;">
          <img src="${item.img || 'images/missing.png'}" alt="${item.title || ''}" style="width:84px;height:112px;object-fit:cover;border-radius:6px;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div>
                <strong style="display:block">${item.title}</strong>
                <div style="color:#666;font-size:0.9rem;margin-top:6px;">Автор: ${item.author || '—'}</div>
              </div>
              <button class="remove-item icon-btn" title="Удалить товар" aria-label="Удалить ${item.title}" style="background:transparent;border:none;font-size:18px;line-height:1;cursor:pointer;">✕</button>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:12px;">
              <div>
                <label style="display:block;font-size:0.9rem;color:#444;margin-bottom:6px;">Количество</label>
                <input type="number" class="qty-input" min="1" value="${item.qty || 1}" aria-label="Количество ${item.title}" style="width:84px;padding:6px;border-radius:6px;border:1px solid #ccc;">
              </div>

              <div style="text-align:right;">
                <div style="font-weight:800;color:#0a7a0a;font-size:1.05rem;">${formatPrice(lineTotal)}</div>
                <!-- Убрано: единичная цена (например "6730.00 ₽ / шт.") -->
              </div>
            </div>
          </div>
        </li>
      `;
    });

    html += `</ul>`;

    html += `<div class="cart-summary" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;">
               <div style="font-weight:700">Итого: <span class="cart-total">${formatPrice(total)}</span></div>
               <div><button id="checkout" class="btn">Оформить заказ</button></div>
             </div>`;

    root.innerHTML = html;
  }

  // Обновить количество товара (валидация: >=1, целое)
  function setQuantity(itemId, qty){
    qty = Number(qty);
    if(!Number.isFinite(qty) || qty < 1) return;
    const cart = loadCart();
    const it = cart.find(x=>x.id === itemId);
    if(!it) return;
    it.qty = Math.floor(qty);
    saveCart(cart);
    renderCart();
  }

  function removeItem(itemId){
    let cart = loadCart();
    cart = cart.filter(x=> x.id !== itemId);
    saveCart(cart);
    renderCart();
  }

  function clearCart(){
    localStorage.removeItem(KEY);
    updateCartBadge();
    renderCart();
  }

  // Делегирование событий (input change, remove, clear, checkout)
  document.addEventListener('input', (e) => {
    const el = e.target;
    if(el.classList.contains('qty-input')){
      clearTimeout(el._qtyTimeout);
      el._qtyTimeout = setTimeout(()=> {
        let val = Number(el.value);
        if(!Number.isFinite(val) || val < 1) { el.value = 1; val = 1; }
        setQuantity(el.closest('.cart-item').dataset.id, Math.floor(val));
      }, 300);
    }
  });

  // Обработка blur/change (если понадобится дополнительная валидация)
  document.addEventListener('change', (e) => {
    const el = e.target;
    if(el.classList.contains('qty-input')){
      const li = el.closest('.cart-item');
      if(!li) return;
      const id = li.dataset.id;
      let val = Number(el.value);
      if(!Number.isFinite(val) || val < 1) { el.value = 1; val = 1; }
      setQuantity(id, Math.floor(val));
    }
  });

  // Клики (удалить, очистить, чекоут)
  document.addEventListener('click', (e) => {
    const rem = e.target.closest('.remove-item');
    if(rem){
      const li = rem.closest('.cart-item');
      if(!li) return;
      const id = li.dataset.id;
      removeItem(id);
      return;
    }

    if(e.target.id === 'clear-cart'){
      if(confirm('Очистить корзину?')) clearCart();
      return;
    }

    if(e.target.id === 'checkout'){
      // здесь можно направлять на страницу оформления или показывать модальное окно
      alert('Функция оформления пока не реализована — перенаправление на страницу оплаты.');
      return;
    }
  });

  // Инициализация
  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateCartBadge();
  });

  // Синхронизировать между вкладками
  window.addEventListener('storage', (ev) => {
    if(ev.key === KEY) renderCart();
  });
})();
