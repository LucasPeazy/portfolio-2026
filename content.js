// Site content: contacts, translations and projects. Edit texts here.
window.SITE = (() => {
  // `text` picks the visible link label from DICT.<lang>.link, so raw URLs are never shown.
  const LINKS = [
    { key: 'mail', href: 'mailto:lucas.peazy@gmail.com', text: 'write', ext: false },
    { key: 'Telegram', href: 'https://t.me/whitenovacanee', text: 'message', ext: true },
    { key: 'Kwork', href: 'https://kwork.ru/user/webiseverything', text: 'profile', ext: true },
    { key: 'Fiverr', href: 'https://www.fiverr.com/s/2ppKW0X', text: 'profile', ext: true },
    { key: 'LinkedIn', href: 'https://www.linkedin.com/in/dmitrii-chernobrovkin-850801439/', text: 'profile', ext: true },
  ];

  const DICT = {
    ru: {
      title: 'web is everything - Website creator',
      description: 'Веб-разработчик, который делает сайты целиком: от дизайна до запуска.',
      navWork: 'Работы', navAbout: 'Обо мне', navContact: 'Контакты', cta: 'Написать мне',
      h1a: 'Веб-разработчик, который делает сайты целиком: от ', h1b: 'дизайна', h1c: ' до ', h1d: 'запуска', h1e: '.',
      intro: 'Меня зовут Дмитрий. Пять лет делаю сайты для клиентов из разных стран. Беру задачу с нуля или по готовому макету и довожу до работающего сайта на домене.',
      mail: 'Почта', link: { write: 'Написать', message: 'Написать', profile: 'Профиль' },
      work: 'Работы', of: 'из', allWorks: 'Все работы', collapse: 'Свернуть', preview: 'превью',
      services: 'Услуги',
      svcNote: 'Цена зависит от объёма. Точную назову после короткого созвона.',
      svc: [
        ['Лендинг', 'Одна страница под рекламу или запуск продукта. Дизайн, адаптивная вёрстка, форма заявки, аналитика.', 'от 30 000 ₽'],
        ['Сайт компании', 'До 10 страниц: услуги, кейсы, команда, контакты. Админка, чтобы править тексты самому, базовое SEO.', 'от 60 000 ₽'],
        ['Интернет-магазин', 'Каталог, фильтры, корзина, оплата и доставка. На Shopify или своём движке на Laravel.', 'от 90 000 ₽'],
      ],
      about: 'Обо мне', photo: 'фото, 4:5', photoAlt: 'Дмитрий Чернобровкин',
      aboutLead: 'Работаю один, поэтому заказчик всегда говорит с тем, кто пишет код.',
      aboutText: 'Собираю задачу, рисую в Figma, верстаю, подключаю домен, оплату и аналитику. После запуска остаюсь на связи и показываю, как править сайт без меня.',
      langsLabel: 'Языки', langs: 'Русский, английский, итальянский', stackLabel: 'Стек',
      contact: 'Контакты', big: 'Давайте сделаем\nсайт.', contactNote: 'Быстрее всего отвечаю в Telegram.',
      fName: 'Имя', fContact: 'Почта или Telegram', fTask: 'Коротко о задаче', send: 'Отправить',
      sending: 'Отправляю…', sendError: 'Не получилось отправить. Напишите мне в Telegram:',
      sent: 'Спасибо. Отвечу на почту или в Telegram.',
      footer: '© 2026 web is everything. Дмитрий Чернобровкин, веб-разработчик.', top: 'Наверх', loading: 'Загрузка', footNav: 'Разделы', footLinks: 'Связь',
      m: { desktop: 'Десктоп', mobile: 'Мобильная версия', mobileShort: 'Мобильная', services: 'Услуги', desc: 'Описание', stack: 'Стек',
        site: 'Открыть сайт', demo: 'Открыть демо', design: 'Смотреть макет',
        prev: 'Предыдущий проект', next: 'Следующий проект', prevS: 'Назад', nextS: 'Далее',
        more: 'Подробнее', less: 'Свернуть', close: 'Закрыть', scroll: 'Прокручено', shot: 'скриншот' },
      shotLabels: ['первый экран', 'о продукте', 'как это работает', 'кейсы', 'тарифы', 'отзывы', 'заявка', 'подвал'],
    },
    en: {
      title: 'web is everything - Website creator',
      description: 'A web developer who builds whole websites: from design to launch.',
      navWork: 'Work', navAbout: 'About', navContact: 'Contact', cta: 'Get in touch',
      h1a: 'A web developer who builds whole websites: from ', h1b: 'design', h1c: ' to ', h1d: 'launch', h1e: '.',
      intro: "I'm Dmitrii. For five years I've been building websites for clients in different countries. I start from scratch or from your design files and take it all the way to a live site on your domain.",
      mail: 'Email', link: { write: 'Email me', message: 'Message', profile: 'Profile' },
      work: 'Work', of: 'of', allWorks: 'All work', collapse: 'Show less', preview: 'preview',
      services: 'Services',
      svcNote: "The final price depends on scope. I'll give an exact quote after a short call.",
      svc: [
        ['Landing page', 'One page for ads or a product launch. Design, responsive build, lead form, analytics.', 'from $350'],
        ['Company website', 'Up to 10 pages: services, case studies, team, contacts. An admin to edit copy yourself, basic SEO.', 'from $700'],
        ['Online store', 'Catalog, filters, cart, payments and shipping. On Shopify or a custom Laravel build.', 'from $1,000'],
      ],
      about: 'About', photo: 'photo, 4:5', photoAlt: 'Dmitrii Chernobrovkin',
      aboutLead: 'I work solo, so you always talk to the person writing the code.',
      aboutText: 'I gather the brief, design in Figma, build the site, connect the domain, payments and analytics. After launch I stay in touch and show you how to edit the site without me.',
      langsLabel: 'Languages', langs: 'Russian, English, Italian', stackLabel: 'Stack',
      contact: 'Contact', big: "Let's build a site.", contactNote: 'Telegram is the fastest way to reach me.',
      fName: 'Name', fContact: 'Email or Telegram', fTask: 'What do you need?', send: 'Send',
      sending: 'Sending…', sendError: "Couldn't send that. Message me on Telegram:",
      sent: "Thanks. I'll reply by email or Telegram.",
      footer: '© 2026 web is everything. Dmitrii Chernobrovkin, web developer.', top: 'Back to top', loading: 'Loading', footNav: 'Sections', footLinks: 'Elsewhere',
      m: { desktop: 'Desktop', mobile: 'Mobile version', mobileShort: 'Mobile', services: 'Services', desc: 'Description', stack: 'Stack',
        site: 'Visit site', demo: 'Open demo', design: 'View design',
        prev: 'Previous project', next: 'Next project', prevS: 'Previous', nextS: 'Next',
        more: 'Details', less: 'Hide', close: 'Close', scroll: 'Scrolled', shot: 'screenshot' },
      shotLabels: ['hero', 'about the product', 'how it works', 'case studies', 'pricing', 'reviews', 'contact form', 'footer'],
    },
  };

  // `shot: [width, height]` means assets/works/<slug>.webp (full page) and <slug>-thumb.webp (16:10 preview) exist.
  // Projects without it are hidden on the site until screenshots are added.
  const PROJECTS = [
    { slug: 'hanc-ai', shot: [1440, 14107], name: 'hanc.ai', url: 'https://hanc.ai', link: 'site', stack: 'React, Tailwind, GSAP, Firebase, Figma',
      ru: { title: 'Платформа голосового агента (hanc.ai)', type: 'Веб-приложение', services: 'Дизайн интерфейса, лендинг, фронтенд',
        desc: 'Платформа, где компании настраивают голосового агента для звонков клиентам. Нужно было объяснить сложный продукт за один экран и собрать кабинет для сценариев звонков. Сделал лендинг и кабинет на общей дизайн-системе.' },
      en: { title: 'Voice agent platform (hanc.ai)', type: 'Web app', services: 'UI design, landing page, front-end',
        desc: 'A platform where companies set up a voice agent that calls their customers. The job was to explain a complex product in one screen and build a dashboard for call scenarios. I made the landing page and the dashboard on a shared design system.' } },
    { slug: 'perfume', name: 'perfume-concept', url: '#', link: 'demo', stack: 'Astro, SCSS, GSAP, Figma',
      ru: { title: 'Интернет-магазин парфюмерии (концепт)', type: 'Интернет-магазин, концепт', services: 'Дизайн, вёрстка',
        desc: 'Концепт магазина нишевой парфюмерии. Искал способ продавать запах через экран: подборки по нотам, крупная типографика, минимум кнопок. Каталог, карточка товара и корзина работают на демо-данных.' },
      en: { title: 'Perfume online store (concept)', type: 'Online store, concept', services: 'Design, front-end',
        desc: 'A concept store for niche perfume. I looked for a way to sell scent through a screen: picks by notes, large type, few buttons. Catalog, product page and cart run on demo data.' } },
    { slug: 'mentoring', name: 'mentoring', url: '#', link: 'site', stack: 'Astro, Tailwind, GSAP, Figma',
      ru: { title: 'Лендинг бизнес-менторства', type: 'Лендинг', services: 'Дизайн, вёрстка, форма записи',
        desc: 'Лендинг для ментора, который работает с предпринимателями. Задача: уместить длинную историю опыта в короткую страницу с одним шагом — записаться на созвон. Заявки с формы приходят сразу в Telegram.' },
      en: { title: 'Business mentoring landing page', type: 'Landing page', services: 'Design, front-end, booking form',
        desc: 'A landing page for a mentor who works with founders. The task was to turn a long career story into a short page with one step: book a call. Form leads go straight to Telegram.' } },
    { slug: 'petpal', name: 'petpal', url: '#', link: 'site', stack: 'Shopify, Liquid, React, MongoDB, Figma',
      ru: { title: 'PetPal, магазин для животных на Shopify с RAG-поиском', type: 'Shopify, AI-поиск', services: 'Тема Shopify, поиск, интеграции',
        desc: 'Магазин товаров для животных. Обычный поиск не понимал запросов вроде «корм для пожилой кошки с больными почками», поэтому подключил RAG-поиск по каталогу. Покупатель пишет как в чате и получает подходящие товары.' },
      en: { title: 'PetPal, a Shopify pet store with RAG search', type: 'Shopify, AI search', services: 'Shopify theme, search, integrations',
        desc: 'A pet supplies store. Standard search couldn’t handle queries like “food for an older cat with kidney issues”, so I added RAG search over the catalog. Shoppers type like in a chat and get matching products.' } },
    { slug: 'uroven', shot: [1394, 4919], name: 'uroven', url: '#', link: 'design', stack: 'Figma',
      ru: { title: 'УРОВЕНЬ, сайт ремонтной компании', type: 'Дизайн сайта', services: 'Структура, дизайн',
        desc: 'Сайт компании по ремонту квартир. Клиенту было важно, чтобы посетитель прикинул смету до звонка. Нарисовал структуру с калькулятором, галереей объектов и этапами работ.' },
      en: { title: 'Uroven, renovation company website', type: 'Website design', services: 'Structure, design',
        desc: 'A website for an apartment renovation company. The client wanted visitors to estimate the cost before calling. I designed the structure with a calculator, a project gallery and work stages.' } },
    { slug: 'ladle', shot: [1394, 2741], name: 'ladle', url: '#', link: 'site', stack: 'React, Laravel, MySQL, Tailwind',
      ru: { title: 'Ladle, доставка еды', type: 'Сайт доставки', services: 'Дизайн, фронтенд, админка',
        desc: 'Сайт доставки домашней еды. Меню меняется каждый день, поэтому сделал админку, где повар сам обновляет блюда и цены. Заказ с телефона оформляется в три шага.' },
      en: { title: 'Ladle, food delivery', type: 'Food delivery', services: 'Design, front-end, admin panel',
        desc: 'A home-cooked food delivery site. The menu changes daily, so I built an admin where the cook updates dishes and prices. Ordering from a phone takes three steps.' } },
    { slug: 'norr', shot: [1394, 3694], name: 'norr', url: '#', link: 'site', stack: 'Laravel, MySQL, SCSS, GSAP',
      ru: { title: 'Norr, магазин мебели', type: 'Интернет-магазин', services: 'Дизайн, вёрстка, бэкенд',
        desc: 'Магазин скандинавской мебели. Крупные фото, спокойная сетка, фильтры по материалу и размеру. В карточке товара предмет показан в интерьере.' },
      en: { title: 'Norr, furniture store', type: 'Online store', services: 'Design, front-end, back-end',
        desc: 'A Scandinavian furniture store. Large photos, a calm grid, filters by material and size. Each product page shows the piece in a room.' } },
    { slug: 'forge', shot: [1394, 4000], name: 'forge', url: '#', link: 'site', stack: 'Astro, Tailwind, GSAP',
      ru: { title: 'Forge, лендинг фитнес-клуба', type: 'Лендинг', services: 'Дизайн, вёрстка, анимации',
        desc: 'Лендинг фитнес-клуба. Залы, расписание и цены абонементов собраны на одной странице, запись на пробную тренировку занимает два клика.' },
      en: { title: 'Forge, fitness club landing page', type: 'Landing page', services: 'Design, front-end, motion',
        desc: 'A landing page for a fitness club. Gyms, schedule and membership prices sit on one page, and booking a trial session takes two clicks.' } },
    { slug: 'halden-vey', shot: [1115, 4000], name: 'halden-vey', url: '#', link: 'site', stack: 'React, Laravel, MySQL, GSAP',
      ru: { title: 'Halden & Vey, элитная недвижимость', type: 'Сайт компании', services: 'Дизайн, фронтенд, каталог объектов',
        desc: 'Сайт агентства элитной недвижимости. Объекты поданы как журнал: крупные фото, короткие тексты, карта района. Заявка на просмотр уходит менеджеру конкретного объекта.' },
      en: { title: 'Halden & Vey, luxury real estate', type: 'Company website', services: 'Design, front-end, listings',
        desc: 'A website for a luxury real estate agency. Listings read like a magazine: large photos, short copy, a map of the area. Viewing requests go to the agent for that listing.' } },
    { slug: 'novu', shot: [1440, 2853], name: 'novu', url: '#', link: 'site', stack: 'React, Firebase, Tailwind',
      ru: { title: 'Novu, интернет-магазин электроники', type: 'Интернет-магазин', services: 'Дизайн, фронтенд',
        desc: 'Магазин электроники с большим каталогом. Главное здесь сравнение: можно выбрать до четырёх товаров и увидеть разницу в характеристиках таблицей.' },
      en: { title: 'Novu, electronics store', type: 'Online store', services: 'Design, front-end',
        desc: 'An electronics store with a large catalog. Comparison is the core: pick up to four products and see the spec differences side by side.' } },
  ];

  const PHOTO = { src: 'assets/me.webp', w: 1100, h: 1467 };

  // Words in the accent marquee between Work and Services.
  const MARQUEE = ['React', 'Astro', 'Laravel', 'Shopify', 'Tailwind', 'CSS', 'SCSS', 'GSAP', 'JavaScript', 'MySQL', 'MongoDB', 'Firebase', 'Figma'];

  // Placeholder screenshot section heights, px (until real screenshots exist).
  const SHOT_H = { desktop: [720, 560, 640, 600, 560, 480, 520, 240], mobile: [740, 620, 880, 760, 820, 600, 640, 300] };

  return { LINKS, DICT, PROJECTS, SHOT_H, PHOTO, MARQUEE };
})();
