(function(){
  'use strict';
  function updateCartBadge() {
    try {
      const cart = JSON.parse(localStorage.getItem('manga_cart_v1') || '[]');
      const badge = document.getElementById('cart-badge');
      if (badge) {
        const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
      }
    } catch (e) {
      console.warn('updateCartBadge error:', e);
    }
  }

  // Синхронизация между вкладками
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'manga_cart_v1') {
      updateCartBadge();
    }
  });

  // Делаем функцию глобально доступной
  window.updateCartBadge = updateCartBadge;
  
  // Обновляем бейдж при загрузке страницы
  document.addEventListener('DOMContentLoaded', () => {
    try { updateCartBadge(); } catch(e) { /* safe */ }
  });

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
window.appHelpers = { priceFormatter, loadScript, showToast };