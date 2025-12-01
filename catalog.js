// scripts/catalog.js
document.addEventListener('DOMContentLoaded', () => {
  const PROD = (window.PRODUCTS && Array.isArray(window.PRODUCTS)) ? window.PRODUCTS : [];
  const CART_KEY = 'manga_cart_v1';
  const ROTATE_MS = 2500; // <- скорость автолистания: 2500ms = 2.5s

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

  let __cardIntervals = []; // все интервалы карточек для очистки

  const grid = document.getElementById('catalogGrid');
  if(!grid) {
    console.warn('catalog.js: element #catalogGrid not found');
    return;
  }

  function clearCardIntervals(){
    __cardIntervals.forEach(i => clearInterval(i));
    __cardIntervals = [];
  }

  function renderProducts(list){
    clearCardIntervals();
    grid.innerHTML = '';
    if(!list || !list.length){
      grid.innerHTML = '<p class="catalog-empty">Товары не найдены.</p>';
      return;
    }

    list.forEach(p=>{
      const art = document.createElement('article');
      art.className = 'product-card';

      art.innerHTML = `
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-link" aria-label="${p.title}">
          <div class="card-img-wrap">
            <img src="${(Array.isArray(p.images) && p.images[0]) ? p.images[0] : (p.img || 'images/missing.png')}" 
                 alt="${p.title}" class="product-img" loading="lazy">
          </div>
          <h3 class="product-title">${p.title}</h3>
          <p class="meta">Автор: ${p.author || '—'}</p>
        </a>
        <div class="product-footer">
          <p class="price">${Number(p.price).toFixed(2)} ₽</p>
          <button class="btn add-btn" data-id="${p.id}" aria-label="Добавить ${p.title} в корзину">Добавить</button>
        </div>
      `;
      grid.appendChild(art);

      // автоперекрутка картинок (и поведение hover -> вернуть к главному при уходе)
      const imgs = Array.isArray(p.images) && p.images.length ? p.images.slice() : (p.img ? [p.img] : []);
      if(imgs.length > 1) {
        const imgEl = art.querySelector('.product-img');
        let idx = 0;
        let iv = setInterval(()=> {
          idx = (idx + 1) % imgs.length;
          imgEl.src = imgs[idx];
        }, ROTATE_MS);
        __cardIntervals.push(iv);

        // при наведении — остановим автоперекрутку (чтобы не дергало)
        art.addEventListener('mouseenter', () => {
          clearInterval(iv);
        });

        // при уходе мыши — вернём основное изображение и запустим автоперекрутку заново
        art.addEventListener('mouseleave', () => {
          // показываем основное фото
          idx = 0;
          imgEl.src = imgs[0];
          // перезапускаем интервал
          iv = setInterval(()=> {
            idx = (idx + 1) % imgs.length;
            imgEl.src = imgs[idx];
          }, ROTATE_MS);
          __cardIntervals.push(iv);
        });
      }
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
    if (window.showToast) showToast((prod?.title || 'Товар') + ' добавлен в корзину', 'success', 1400);
    else alert((prod?.title || 'Товар') + ' добавлен в корзину');
  }

  // делегирование кликов: только кнопки добавления
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.add-btn');
    if(!btn) return;
    e.preventDefault(); // чтобы случайный клик по соседней ссылке не сработал
    addToCart(btn.dataset.id, 1);
  });

  // фильтры — если есть элементы
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

  document.getElementById('search')?.addEventListener('input', filterAndRender);
  document.getElementById('genreFilter')?.addEventListener('change', filterAndRender);
  document.getElementById('sortBy')?.addEventListener('change', filterAndRender);
  document.getElementById('clearFilters')?.addEventListener('click', ()=> {
    document.getElementById('search').value = '';
    document.getElementById('genreFilter').value = 'all';
    document.getElementById('sortBy').value = 'default';
    filterAndRender();
  });

  // init
  renderProducts(PROD);
  updateCartBadge();

  // чистка интервалов при переходе/закрытии
  window.addEventListener('beforeunload', clearCardIntervals);

  // экспорт функций
  window.addToCart = addToCart;
  window.renderProducts = renderProducts;
});
