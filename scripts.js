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


