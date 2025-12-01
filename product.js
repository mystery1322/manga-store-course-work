(async function(){
  if (document.readyState === 'loading') await new Promise(r=>document.addEventListener('DOMContentLoaded', r));
  const root = document.getElementById('product-root');
  if(!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if(!id) { root.innerHTML = '<div class="cart-empty"><h3>Товар не указан</h3></div>'; return; }

  // гарантируем, что helper scripts загружены
  if(!window.appHelpers) {
    // если scripts.js не загружен (редко) — пробуем loadScript
    try { await (window.appHelpers && window.appHelpers.loadScript ? window.appHelpers.loadScript('scripts/scripts.js') : Promise.resolve()); }
    catch(e){ /* ignore */ }
  }

  // убедимся что PRODUCTS есть
  if(!window.PRODUCTS || !Array.isArray(window.PRODUCTS)){
    try { await window.appHelpers.loadScript('products-data.js'); } catch(e){ /* ignore */ }
  }

  const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const item = products.find(p => p.id === id);
  if(!item){
    root.innerHTML = '<div class="cart-empty"><h3>Товар не найден</h3><p>Возможно, products-data.js не загружен или id неверный.</p></div>';
    return;
  }

  // render
  root.innerHTML = `
    <article class="product-detail" style="display:grid;grid-template-columns:360px 1fr;gap:20px;align-items:start;border:1px solid #eee;padding:16px;border-radius:10px;background:#fff;">
      <div><img src="${item.img}" alt="${(item.title||'').replace(/"/g,'&quot;')}" /></div>
      <div>
        <h1>${item.title}</h1>
        <div class="product-meta">Автор: ${item.author || '—'}</div>
        <div class="product-meta"><strong>Жанры:</strong> ${Array.isArray(item.genre) ? item.genre.join(', ') : (item.genre || '—')}</div>
        <p style="margin:12px 0 18px;">${item.desc || ''}</p>

        <div style="display:flex;gap:12px;align-items:center;">
          <div style="font-size:1.25rem;font-weight:700;color:#0a7a0a">${window.appHelpers.priceFormatter.format(item.price)}</div>
          <button id="addToCartBtn" class="btn">Добавить в корзину</button>
        </div>
      </div>
    </article>
  `;
  // подготовка массива изображений (fallback на item.img если нет item.images)
    const images = (Array.isArray(item.images) && item.images.length) ? item.images : [ item.img || 'images/missing.png' ];

    // рендерим галерею внутрь плейсхолдера
    const galleryEl = document.getElementById('gallery');
    renderProductGallery(galleryEl, images);


  document.getElementById('addToCartBtn').addEventListener('click', function(){
    if(window.appHelpers && typeof window.appHelpers.addToCart === 'function'){
      window.appHelpers.addToCart(item.id, 1);
      // обновляем бейдж (на случай)
      if(window.appHelpers.updateCartBadge) window.appHelpers.updateCartBadge();
    } else {
      alert('Ошибка: добавление в корзину недоступно');
    }
  });

  // обновим бейдж при открытии
  if(window.appHelpers && window.appHelpers.updateCartBadge) window.appHelpers.updateCartBadge();

})();

// галерея на product page — вставить туда, где у вас уже рендерится item
function renderProductGallery(container, images){
  container.innerHTML = `
    <div class="product-gallery">
      <div class="gallery-main">
        <img id="galleryMainImg" src="${images[0]}" alt="">
        <div class="gallery-thumbs" id="galleryThumbs"></div>
      </div>
      <div class="gallery-controls">
        <button id="prevBtn" aria-label="Предыдущее">◀</button>
        <button id="nextBtn" aria-label="Следующее">▶</button>
      </div>
    </div>
  `;
  const mainImg = container.querySelector('#galleryMainImg');
  const thumbs = container.querySelector('#galleryThumbs');

  images.forEach((src, i)=>{
    const t = document.createElement('button');
    t.className = 'thumb' + (i===0 ? ' active' : '');
    t.innerHTML = `<img src="${src}" alt="миниатюра ${i+1}">`;
    t.addEventListener('click', ()=>{
      mainImg.src = src;
      container.querySelectorAll('.thumb').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
    });
    thumbs.appendChild(t);
  });

  // prev/next
  let idx = 0;
  function show(i){
    idx = (i+images.length) % images.length;
    mainImg.src = images[idx];
    container.querySelectorAll('.thumb').forEach((b,j)=> b.classList.toggle('active', j===idx));
  }
  container.querySelector('#prevBtn').addEventListener('click', ()=> show(idx-1));
  container.querySelector('#nextBtn').addEventListener('click', ()=> show(idx+1));

  // простейший swipe (pointer events)
  let startX = null;
  mainImg.addEventListener('pointerdown', (ev)=>{
    startX = ev.clientX;
    mainImg.setPointerCapture(ev.pointerId);
  });
  mainImg.addEventListener('pointerup', (ev)=>{
    if(startX === null) return;
    const dx = ev.clientX - startX;
    if(Math.abs(dx) > 40){
      if(dx < 0) show(idx+1); else show(idx-1);
    }
    startX = null;
  });
}
