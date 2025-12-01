// scripts.js
(function(){
  const burger = document.getElementById('burgerBtn');
  const header = document.querySelector('.site-header');
  const mainNav = document.querySelector('.main-nav');

  if (!burger || !header || !mainNav) return;

  function openMenu(flag) {
    const shouldOpen = typeof flag === 'boolean' ? flag : !header.classList.contains('menu-open');
    if (shouldOpen) {
      header.classList.add('menu-open');
      burger.setAttribute('aria-expanded','true');
    } else {
      header.classList.remove('menu-open');
      burger.setAttribute('aria-expanded','false');
    }
  }

  burger.addEventListener('click', ()=> openMenu());
  mainNav.addEventListener('click', (e)=>{
    if (e.target.tagName === 'A' && header.classList.contains('menu-open')) openMenu(false);
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') openMenu(false);
  });
  window.addEventListener('resize', ()=> {
    if (window.innerWidth > 720 && header.classList.contains('menu-open')) openMenu(false);
  });
})();


function loadCart() {
  try {
    const raw = localStorage.getItem('cart');
    const cart = raw ? JSON.parse(raw) : [];
    return Array.isArray(cart) ? cart : [];
  } catch (e) {
    console.warn('loadCart: ошибка при чтении корзины', e);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (e) {
    console.error('saveCart: ошибка при сохранении корзины', e);
  }
}


/* Global helpers: priceFormatter, loadScript, toast, cart helpers, addToCart */
const priceFormatter = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });

function loadScript(src){
  return new Promise((resolve, reject) => {
    if([...document.scripts].some(s=>s.src && s.src.includes(src))) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load '+src));
    document.head.appendChild(s);
  });
}

/* tiny toast */
function showToast(msg, type = 'info', ms = 2000){
  const id = 'toast-root';
  let root = document.getElementById(id);
  if(!root){
    root = document.createElement('div');
    root.id = id;
    Object.assign(root.style, { position:'fixed', right:'16px', bottom:'16px', zIndex:99999 });
    document.body.appendChild(root);
  }
  const item = document.createElement('div');
  item.textContent = msg;
  item.className = 'mini-toast ' + type;
  Object.assign(item.style, {
    marginTop: '8px',
    padding: '8px 12px',
    background: type === 'success' ? '#1b9e6a' : '#333',
    color:'#fff',
    borderRadius:'8px',
    boxShadow:'0 6px 18px rgba(0,0,0,0.12)',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity .22s, transform .22s'
  });
  root.appendChild(item);
  requestAnimationFrame(()=>{ item.style.opacity = '1'; item.style.transform = 'translateY(0)'; });
  setTimeout(()=> {
    item.style.opacity = '0';
    item.style.transform = 'translateY(8px)';
    setTimeout(()=> item.remove(), 220);
  }, ms);
}

/* CART helpers */
const CART_KEY = 'manga_cart_v1';

function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge(){
  const el = document.getElementById('cart-badge');
  if(!el) return;
  const count = loadCart().reduce((s,i)=>s+(i.qty||0), 0);
  el.textContent = count || 0;
  el.classList.toggle('hidden', count === 0);
}

/* addToCart by id (looks up window.PRODUCTS if available) */
async function addToCart(productId, qty = 1){
  let prod = null;
  if(window.PRODUCTS && Array.isArray(window.PRODUCTS)){
    prod = window.PRODUCTS.find(p => p.id === productId);
  }
  // if not found, try to load products-data.js from common location
  if(!prod){
    try {
      await loadScript('products-data.js'); // adjust path if you store it in /scripts/
      if(window.PRODUCTS) prod = window.PRODUCTS.find(p => p.id === productId);
    } catch(e){
      // ignore - we'll add a minimal item
    }
  }

  const cart = loadCart();
  const existing = cart.find(i => i.id === productId);
  if(existing) existing.qty = (existing.qty || 0) + Number(qty || 1);
  else {
    const item = {
      id: productId,
      title: prod ? prod.title : ('Товар ' + productId),
      price: prod && prod.price !== undefined ? prod.price : 0,
      img: prod && prod.img ? prod.img : 'images/missing.png',
      author: prod && prod.author ? prod.author : '',
      qty: Number(qty || 1)
    };
    cart.push(item);
  }
  saveCart(cart);
  showToast((prod && prod.title ? prod.title : 'Товар') + ' добавлен в корзину', 'success', 1200);
}

/* optional: addToCart with full product object */
function addToCartFromData(productObj, qty = 1){
  if(!productObj || !productObj.id) return;
  const cart = loadCart();
  const existing = cart.find(i => i.id === productObj.id);
  if(existing) existing.qty = (existing.qty || 0) + Number(qty || 1);
  else {
    cart.push({
      id: productObj.id,
      title: productObj.title || 'Товар',
      price: productObj.price || 0,
      img: productObj.img || 'images/missing.png',
      author: productObj.author || '',
      qty: Number(qty || 1)
    });
  }
  saveCart(cart);
  showToast((productObj.title || 'Товар') + ' добавлен в корзину', 'success', 1200);
}

/* export to window for pages */
window.appHelpers = { priceFormatter, loadScript, showToast, addToCart, addToCartFromData, loadCart, saveCart, updateCartBadge };


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
