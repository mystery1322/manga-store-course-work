// product.js
// Безопасный поиск товара по URL + дружелюбный fallback + безопасный рендер
// Замените существующий product.js на этот файл или вставьте соответствующие части.

(function () {
  'use strict';

  // Ключи параметров в URL, которые мы проверяем
  const PARAM_KEYS = ['id', 'productId', 'pid', 'product'];

  // Безопасно получаем параметры
  const params = new URLSearchParams(window.location.search || '');
  let rawId = null;
  for (const k of PARAM_KEYS) {
    const v = params.get(k);
    if (v) {
      rawId = v;
      break;
    }
  }

  // Простая санитизация: оставляем буквы, цифры, дефис, подчеркивание и точку
  const sanitizeId = (s) => (s || '').toString().replace(/[^\w\-\.\:]/g, '');

  const id = sanitizeId(rawId);

  // helper: безопасно очищаем контейнер и показываем сообщение
  function showNotFound(message) {
    const container = document.querySelector('#product-container') || document.querySelector('main') || document.body;

    // Очищаем контейнер
    while (container.firstChild) container.removeChild(container.firstChild);

    const h2 = document.createElement('h2');
    h2.textContent = 'Товар не найден';

    const p = document.createElement('p');
    p.textContent = message || 'Проверьте правильность ссылки или вернитесь в каталог.';

    const a = document.createElement('a');
    a.setAttribute('href', 'catalog.html');
    a.textContent = 'Вернуться в каталог';

    container.appendChild(h2);
    container.appendChild(p);
    container.appendChild(a);

    console.warn('Product not found. rawId=', rawId, 'sanitized id=', id);
  }

  if (!id) {
    showNotFound('В URL отсутствует идентификатор товара.');
    return;
  }

  // Получаем источник данных о товарах.
  // В репо может быть window.products, window.PRODUCTS или другой неймспейс.
  const productsSource = window.products || window.PRODUCTS || window.__PRODUCTS__ || null;

  if (!productsSource) {
    showNotFound('Данные о товарах не загружены.');
    return;
  }

  // Ищем продукт — поддерживаем массив и объект-словарь
  let product = null;
  try {
    if (Array.isArray(productsSource)) {
      product = productsSource.find(
        (p) =>
          p &&
          (String(p.id) === String(id) ||
            String(p.id) === String(Number(id)) ||
            String(p.slug || '') === String(id))
      );
    } else if (typeof productsSource === 'object') {
      // Попытка взять по ключу
      product = productsSource[id] || productsSource[String(Number(id))] || null;

      // Если не нашли — пробуем просмотреть значения
      if (!product) {
        for (const key in productsSource) {
          if (!Object.prototype.hasOwnProperty.call(productsSource, key)) continue;
          const p = productsSource[key];
          if (
            p &&
            (String(p.id) === String(id) ||
              String(p.id) === String(Number(id)) ||
              String(p.slug || '') === String(id))
          ) {
            product = p;
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error('Ошибка при поиске товара:', err);
    showNotFound('Произошла внутренняя ошибка при поиске товара.');
    return;
  }

  if (!product) {
    showNotFound('Товар с таким идентификатором не найден.');
    return;
  }

  // Безопасный рендер товара
  (function renderProduct(prod) {
    const container = document.querySelector('#product-container') || document.body;

    // Очищаем контейнер
    while (container.firstChild) container.removeChild(container.firstChild);

    // Название
    const title = document.createElement('h1');
    title.textContent = prod.title || prod.name || 'Без названия';
    container.appendChild(title);

    // Блок с мета-информацией (опционально)
    const meta = document.createElement('div');
    meta.className = 'product-meta';
    container.appendChild(meta);

    // Картинка
    if (prod.image) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'product-image';
      const img = document.createElement('img');

      // Можно дополнительно валидировать путь к изображению, если нужно
      img.setAttribute('src', String(prod.image));
      img.setAttribute('alt', prod.title || prod.name || '');
      img.setAttribute('loading', 'lazy');
      imgWrap.appendChild(img);
      container.appendChild(imgWrap);
    }

    // Цена
    if (prod.price !== undefined && prod.price !== null) {
      const price = document.createElement('p');
      price.className = 'product-price';
      const currency = prod.currency ? ' ' + String(prod.currency) : '';
      price.textContent = 'Цена: ' + String(prod.price) + currency;
      meta.appendChild(price);
    }

    // Описание
    if (prod.description) {
      const desc = document.createElement('p');
      desc.className = 'product-description';
      desc.textContent = prod.description;
      container.appendChild(desc);
    }

    // Дополнительные поля (категория, автор и т.п.)
    if (prod.extra && typeof prod.extra === 'object') {
      const ul = document.createElement('ul');
      ul.className = 'product-extra';
      for (const key in prod.extra) {
        if (!Object.prototype.hasOwnProperty.call(prod.extra, key)) continue;
        const li = document.createElement('li');
        li.textContent = `${key}: ${String(prod.extra[key])}`;
        ul.appendChild(li);
      }
      container.appendChild(ul);
    }

    // Кнопка "Добавить в корзину"
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add-to-cart';
    btn.textContent = 'Добавить в корзину';
    btn.dataset.productId = String(prod.id || id);

    btn.addEventListener('click', () => {
      try {
        const raw = localStorage.getItem('cart');
        let cart = [];
        if (raw) {
          try {
            cart = JSON.parse(raw);
            if (!Array.isArray(cart)) cart = [];
          } catch (e) {
            cart = [];
          }
        }
        const existing = cart.find((item) => String(item.id) === String(prod.id));
        if (existing) {
          existing.qty = (existing.qty || 1) + 1;
        } else {
          cart.push({
            id: prod.id,
            title: prod.title || prod.name,
            qty: 1,
            price: prod.price,
          });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        // Небольшая пользовательская обратная связь
        try {
          // Если в проекте есть кастомный компонент/функция уведомлений, лучше использовать её
          alert('Товар добавлен в корзину');
        } catch (e) {
          console.log('Added to cart');
        }
      } catch (err) {
        console.error('Ошибка при добавлении в корзину', err);
        alert('Не удалось добавить товар в корзину.');
      }
    });

    container.appendChild(btn);
  })(product);
})();
