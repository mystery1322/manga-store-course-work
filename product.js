(function () {
  'use strict';

  const CART_KEY = 'manga_cart_v1';
  const TOAST_DEFAULT_TIMEOUT = 2000;

  /* ----------------------- Утилиты ----------------------- */
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function formatPrice(p) {
    const n = Number(p);
    if (Number.isNaN(n)) return '—';
    return n.toFixed(2) + ' ₽';
  }

  function getProductIdFromUrl() {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  }

  function safeGetProducts() {
    return (window.PRODUCTS && Array.isArray(window.PRODUCTS)) ? window.PRODUCTS : null;
  }
  
  // Обновляем бейдж при загрузке
  updateCartBadge();
 
  /* ----------------------- Cart helpers ----------------------- */
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch (e) { return []; }
  }
  
  function saveCart(cart) {
    try { 
      localStorage.setItem(CART_KEY, JSON.stringify(cart)); 
    } catch (e) { 
      console.warn('saveCart failed', e); 
    }
    updateCartBadge();
    
    // синхронизировать между вкладками
    try { 
      window.dispatchEvent(new StorageEvent('storage', { 
        key: CART_KEY, 
        newValue: JSON.stringify(cart) 
      })); 
    } catch (e) {}
  }

  function addToCartFallback(item, qty = 1) {
    const cart = loadCart();
    const existing = cart.find(x => x.id === item.id);
    if (existing) {
      existing.qty = (Number(existing.qty) || 0) + Number(qty || 1);
    } else {
      cart.push({
        id: item.id,
        title: item.title || ('Товар ' + item.id),
        price: item.price || 0,
        img: (item.images && item.images[0]) || item.img || 'images/missing.png',
        author: item.author || '',
        qty: Number(qty || 1)
      });
    }
    saveCart(cart);
  }

  /* ----------------------- Рендер ----------------------- */
  function renderProductPage(item, container) {
    // container — элемент root where to render (например #product-root)
    container.innerHTML = '';

    // Подготовка изображений
    const images = (Array.isArray(item.images) && item.images.length) ? item.images.slice() : (item.img ? [item.img] : ['images/missing.png']);

    // Разметка
    const wrapper = document.createElement('div');
    wrapper.className = 'product-detail';
    wrapper.style.maxWidth = '1100px';
    wrapper.style.margin = '0 auto';

    wrapper.innerHTML = `
      <div class="product-grid-detail" style="gap:24px;display:grid;grid-template-columns:420px 1fr;align-items:start;">
        <div class="product-gallery" aria-label="Галерея товара">
          <button class="gallery-arrow prev" aria-label="Предыдущее" type="button"></button>          
          <div class="gallery-main" style="border:1px solid #eee;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:8px;background:#fff;">
            <img src="${images[0]}" alt="${escapeHtml(item.title)}" class="gallery-current" style="width:100%;height:auto;object-fit:cover;max-height:720px;display:block;">
          </div>
          <button class="gallery-arrow next" aria-label="Следующее" type="button"></button>
          <div class="gallery-thumbs" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"></div>
        </div>

        <div class="product-info">
          <h1 class="product-title" style="margin-top:5px;color:var(--brand-blue, #1f1f8b)">${escapeHtml(item.title)}</h1>
          <p class="meta" style="margin:8px 0;"><strong>Автор: </strong>${escapeHtml(item.author || '—')}</p>
          <p class="meta" style="margin:6px 0 12px;color:#222"><strong>Жанры:</strong> ${Array.isArray(item.genre) ? item.genre.map(g=>escapeHtml(g)).join(', ') : escapeHtml(item.genre || '—')}</p>
          <p class="desc" style="margin:8px 0 20px;color:#444;line-height:1.45">${escapeHtml(item.desc || 'Описание отсутствует.')}</p>

          <div style="display:flex;gap:12px;align-items:center;margin-top:18px;">
            <div class="price" style="font-size:1.4rem;font-weight:800;color:var(--brand-blue, #248e24)">${formatPrice(item.price)}</div>
            <div>
              <button id="addToCartBtn" class="btn" type="button">Добавить в корзину</button>
            </div>
          </div>

          <div style="margin-top:14px;color:#666;font-size:0.95rem;">
            <p>Детали: состояние — новое. Доступность: 3-7 дней.</p>
          </div>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const thumbsWrap = wrapper.querySelector('.gallery-thumbs');
    const mainImg = wrapper.querySelector('.gallery-current');
    const prevBtn = wrapper.querySelector('.gallery-arrow.prev');
    const nextBtn = wrapper.querySelector('.gallery-arrow.next');

    images.forEach((src, i) => {
      const tb = document.createElement('button');
      tb.type = 'button';
      tb.className = 'thumb-btn';
      tb.dataset.index = String(i);
      tb.style.border = 'none';
      tb.style.padding = '0';
      tb.style.background = 'transparent';
      tb.style.cursor = 'pointer';
      tb.style.borderRadius = '6px';
      tb.innerHTML = `<img src="${src}" alt="Миниатюра ${i+1}" loading="lazy" style="width:64px;height:88px;object-fit:cover;border-radius:6px;border:2px solid transparent;">`;
      thumbsWrap.appendChild(tb);
    });

    const thumbButtons = Array.from(thumbsWrap.querySelectorAll('.thumb-btn'));
    let curIndex = 0;

    function showIndex(i) {
      const idx = ((Number(i) % images.length) + images.length) % images.length;
      curIndex = idx;
      mainImg.src = images[idx];
      // подсветка миниатюр
      thumbButtons.forEach(b => {
        const img = b.querySelector('img');
        if (Number(b.dataset.index) === idx) {
          img.style.borderColor = 'var(--brand-blue, #1f1f8b)';
          img.style.transform = 'scale(1.02)';
        } else {
          img.style.borderColor = 'transparent';
          img.style.transform = 'none';
        }
      });
    }

    prevBtn.addEventListener('click', () => showIndex(curIndex - 1));
    nextBtn.addEventListener('click', () => showIndex(curIndex + 1));
    thumbButtons.forEach(b => b.addEventListener('click', () => showIndex(Number(b.dataset.index))));

    wrapper.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); showIndex(curIndex - 1); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); showIndex(curIndex + 1); }
    });

    // Init
    showIndex(0);
    const addBtn = document.getElementById('addToCartBtn');
    addBtn.addEventListener('click', () => {
      // Всегда используем addToCartFallback на странице товара
      addToCartFallback(item, 1);
      
      // Показываем уведомление
      if (typeof window.showToast === 'function') {
        try { 
          window.showToast(item.title + ' добавлен в корзину', 'success', 1800); 
        } catch(e) { 
          // Fallback уведомление
          alert(item.title + ' добавлен в корзину');
        }
      } else {
        alert(item.title + ' добавлен в корзину');
      }
    });
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ----------------------- Init flow ----------------------- */
  function init() {
    const root = document.getElementById('product-root');
    if (!root) {
      console.warn('product.js: root element #product-root not found.');
      return;
    }

    const id = getProductIdFromUrl();
    if (!id) {
      root.innerHTML = '<div class="catalog-empty"><h3>Товар не указан</h3><p>Проверьте ссылку.</p></div>';
      return;
    }

    const products = safeGetProducts();
    if (!products) {
      console.warn('product.js: window.PRODUCTS is not defined.');
      root.innerHTML = '<div class="catalog-empty"><h3>Данные товара не загружены</h3><p>Попробуйте обновить страницу.</p></div>';
      return;
    }

    const item = products.find(p => p.id === id);
    if (!item) {
      root.innerHTML = '<div class="catalog-empty"><h3>Товар не найден</h3><p>Возможно, он был удалён или id в ссылке неверный.</p></div>';
      return;
    }

    // Всё готово — рендерим
    renderProductPage(item, root);
  }

  // DOM готов — инициализируем
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();