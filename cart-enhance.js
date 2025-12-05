// cart-enhance.js — улучшения для корзины, без изменения старого cart.js
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('cart-root');
  if (!root) return;

  // 1) Сделать кликабельной карточку товара (переход на product.html?id=...)
  root.addEventListener('click', (e) => {
    // если клик по интерактивному элементу — не перехватываем (input, button, select, a, .remove-item)
    if (e.target.closest('input, button, select, a, .remove-item, .qty-input')) return;

    const li = e.target.closest('.cart-item');
    if (!li) return;
    const id = li.dataset.id;
    if (!id) return;
    // переход
    location.href = `product.html?id=${encodeURIComponent(id)}`;
  });

  document.querySelectorAll('.qty-controls button, .qty-controls .btn').forEach(b => {
    b.style.display = 'none';
  });

  // 4) Немного уменьшить отступ до футера (если слишком большой)
  const footer = document.querySelector('footer.site-footer');
  if (footer) {
    // это мягкое переопределение — если надо сильнее, используйте cart-enhance.css
    footer.style.marginTop = footer.style.marginTop || '60px';
  }

  // 5) Дать курсор-поинтер для всей карточки (визуально видно, что можно кликать)
  root.querySelectorAll('.cart-item').forEach(ci => ci.style.cursor = 'pointer');

  // 6) Обновлять иконки/поведение при динамическом перерендере (cart.js перерисовывает DOM)
  //    — слушаем storage и повторяем инициализацию небольшим таймаутом
  function reInit() {
    // повторно инициализируем иконки и скрытие кнопок
    document.querySelectorAll('.qty-controls button, .qty-controls .btn').forEach(b => b.style.display = 'none');
    root.querySelectorAll('.cart-item').forEach(ci => ci.style.cursor = 'pointer');
  }

  // Если cart.js синхронизирует по storage, то при изменениях перерендер будет — запускаем reInit через небольшую задержку
  window.addEventListener('storage', () => setTimeout(reInit, 80));
  // также наблюдаем за мутированием DOM (если cart.js использует innerHTML часто)
  const obs = new MutationObserver(() => setTimeout(reInit, 20));
  obs.observe(root, { childList: true, subtree: true });

  // применим сразу
  reInit();
});