/* scripts/catalog.js
   Вынесённый скрипт каталога.
   Требование: products-data.js (где объявлен window.PRODUCTS) должен быть подключён ДО catalog.js
*/

document.addEventListener('DOMContentLoaded', () => {
  const PROD = (window.PRODUCTS && Array.isArray(window.PRODUCTS)) ? window.PRODUCTS : [
    // fallback: можно оставить пару тестовых товаров
    {id: 'm1', title:'Манга Влюбленный паразит Том 1 и 2', author:'Koisuru kiseichuu', price:1199, img:'images/parasite1.png', genre:'seinen'}
  ];

  const CART_KEY = 'manga_cart_v1';

  function loadCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e){ return []; } }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }

  function updateCartBadge(){
    const el = document.getElementById('cart-badge');
    if(!el) return;
    const cart = loadCart();
    const count = cart.reduce((s,p)=>s+(p.qty||0),0);
    el.textContent = count;
    el.classList.toggle('hidden', count===0);
  }

  const grid = document.getElementById('catalogGrid');

  function renderProducts(list){
    if(!grid) return;
    grid.innerHTML = '';
    if(!list || !list.length){ grid.innerHTML = '<p class="catalog-empty">Товары не найдены.</p>'; return; }
    list.forEach(p=>{
      const art = document.createElement('article');
      art.className = 'product-card';
        art.innerHTML = `
        <a href="product.html?id=${p.id}" class="product-link" aria-label="${p.title}">
            <div class="product-media" data-images="${(Array.isArray(p.images) ? p.images.join('|') : (p.img || ''))}">
                <img class="product-main" src="${(Array.isArray(p.images) ? p.images[0] : (p.img||'images/missing.png'))}" alt="${p.title}">
            </div>
        </a>

        <div class="product-body">
            <h3 class="product-title">${p.title}</h3>
            <p class="meta">Автор: ${p.author || '—'}</p>
            <p class="product-desc">${(p.desc ? (p.desc.length > 120 ? p.desc.slice(0,120)+'…' : p.desc) : '')}</p>

            <div class="product-footer">
                <p class="price">${Number(p.price).toFixed(2)} ₽</p>
                <button class="btn add-btn" data-id="${p.id}" aria-label="Добавить ${p.title} в корзину">Добавить</button>
            </div>
        </div>
        `;
        grid.appendChild(art);
    });
  }

  function addToCart(productId, qty = 1) {
    const cart = loadCart();
    const prod = PROD.find(p => p.id === productId);
    const existing = cart.find(x => x.id === productId);
    if (existing) existing.qty = (existing.qty || 0) + Number(qty || 1);
    else {
      cart.push({
        id: productId,
        title: prod?.title || ('Товар ' + productId),
        price: prod?.price ?? 0,
        img: prod?.img || 'images/missing.png',
        author: prod?.author || '',
        qty: Number(qty || 1)
      });
    }
    saveCart(cart);
    if (window.showToast) showToast((prod?.title || 'Товар') + ' добавлен в корзину', 'success', 1800);
    else alert((prod?.title || 'Товар') + ' добавлен в корзину');
  }

  // делегирование кликов по странице для кнопок "Добавить"
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.add-btn');
    if(!btn) return;
    addToCart(btn.dataset.id, 1);
  });

  // фильтры
  function filterAndRender(){
    const q = (document.getElementById('search')?.value || '').trim().toLowerCase();
    const genre = document.getElementById('genreFilter')?.value || 'all';
    const sort = document.getElementById('sortBy')?.value || 'default';
    let result = PROD.filter(p=>{
      const matchQ = q === '' || (p.title && p.title.toLowerCase().includes(q)) || (p.author && p.author.toLowerCase().includes(q));
      const matchGenre = genre === 'all' || p.genre === genre || (Array.isArray(p.genre) && p.genre.includes(genre));
      return matchQ && matchGenre;
    });
    if(sort==='price-asc') result.sort((a,b)=>a.price-b.price);
    else if(sort==='price-desc') result.sort((a,b)=>b.price-a.price);
    else if(sort==='title-asc') result.sort((a,b)=>a.title.localeCompare(b.title,'ru'));
    renderProducts(result);
  }

  // привязки (используем optional chaining, чтобы код не ломался, если элементы временно отсутствуют)
  document.getElementById('search')?.addEventListener('input', filterAndRender);
  document.getElementById('genreFilter')?.addEventListener('change', filterAndRender);
  document.getElementById('sortBy')?.addEventListener('change', filterAndRender);
  document.getElementById('clearFilters')?.addEventListener('click', ()=>{
    document.getElementById('search').value = '';
    document.getElementById('genreFilter').value = 'all';
    document.getElementById('sortBy').value = 'default';
    filterAndRender();
  });

  // init
  renderProducts(PROD);
  updateCartBadge();

  // sync badge при изменениях в других вкладках
  window.addEventListener('storage', ev => { if(ev.key === CART_KEY) updateCartBadge(); });

  // экспорт для использования на других страницах (product.html и т.д.)
  window.addToCart = addToCart;
  window.renderProducts = renderProducts;
});

// Hover-картинки: при наведении карточки будет циклировать изображения
(function(){
  let cycleInterval = 600; // ms
  function startCycle(cardEl){
    const media = cardEl.querySelector('.product-media');
    if(!media) return;
    const imgs = (media.dataset.images || '').split('|').filter(Boolean);
    if(imgs.length < 2) return;
    let idx = 1; // начнём со второго (0 уже показан)
    // если уже есть интервал, уберём
    stopCycle(cardEl);

    cardEl._cycle = setInterval(()=>{
      const main = media.querySelector('.product-main');
      if(!main) return;
      main.src = imgs[idx];
      idx = (idx + 1) % imgs.length;
    }, cycleInterval);
  }
  function stopCycle(cardEl){
    if(cardEl._cycle){ clearInterval(cardEl._cycle); cardEl._cycle = null; }
    // вернуть первый src
    const media = cardEl.querySelector('.product-media');
    if(!media) return;
    const imgs = (media.dataset.images || '').split('|').filter(Boolean);
    const main = media.querySelector('.product-main');
    if(main && imgs.length) main.src = imgs[0];
  }

  // делегирование: mouseenter / mouseleave на .product-card
  document.addEventListener('mouseover', e=>{
    const card = e.target.closest('.product-card');
    if(!card) return;
    startCycle(card);
  });
  document.addEventListener('mouseout', e=>{
    const card = e.target.closest('.product-card');
    if(!card) return;
    // убедимся, что курсор действительно вышел из карточки:
    if(card.contains(e.relatedTarget)) return;
    stopCycle(card);
  });

  // для touch: при тапе на .product-media переключать картинку (по клику)
  document.addEventListener('click', e=>{
    const media = e.target.closest('.product-media');
    if(!media) return;
    const imgs = (media.dataset.images || '').split('|').filter(Boolean);
    if(imgs.length < 2) return;
    // переключаем на следующий
    const main = media.querySelector('.product-main');
    let curr = imgs.indexOf(main.src);
    if(curr === -1) curr = 0;
    let next = (curr + 1) % imgs.length;
    main.src = imgs[next];
    e.preventDefault(); // если картинка внутри ссылки, предотвратить (опционально)
  });
})();
