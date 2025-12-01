// products-data.js — единый источник правды для каталога / product / cart
window.PRODUCTS = [
  {
    id: 'm1',
    title: 'Манга: Влюблённый паразит — Том 1 и 2',
    author: 'Koisuru kiseichuu',
    price: 1199,
    // главное изображение (backward compat)
    img: 'images/parasite1.png',
    // массив дополнительных изображений (3-4 штуки)
    images: [
        'images/parasite1.png',
        'images/parasite2.png',
        'images/parasite3.png',
        'images/parasite4.png'
    ],
    genre: ['seinen'],
    desc: 'История о человеке, чьи навязчивые тенденции не позволяют ему работать, и молодой девушке, которая пропускает школу и любит насекомых. Они встречаются, приходят, чтобы поддержать друг друга в реинтеграции в общество, и влюбляются друг в друга. Однако есть проблема: именно паразиты в их головах.'
  },
  {
        id: 'm2',
        title: 'Манга Гуррен Лаганн Том 1 по 6-й',
        author: 'Накашима Казуки',
        price: 2890,
        img: 'images/gurren.png',
        genre: ['shonen']
  },
  {
        id: 'm3',
        title: 'Манга Спокойной ночи, Пунпун Том 1 по 13-й',
        author: 'Асано Инио',
        price: 6730,
        img: 'images/punpun.png',
        genre: ['seinen']
    },
    {
        id: 'm4',
        title: 'Манга Джоджолендс Том 1 по 6-й',
        author: 'Хирохико Араки',
        price: 2870,
        img: 'images/jojolands.png',
        genre: ['shonen']
    }
];
