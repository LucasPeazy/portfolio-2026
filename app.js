(() => {
  'use strict';

  const { LINKS, DICT, PROJECTS, SHOT_H, PHOTO } = window.SITE;
  // Only projects with screenshots are shown; the rest stay in content.js for later.
  const P = PROJECTS.filter(p => p.shot);
  const ANGLES = [135, 45, 90, 0, 120, 60, 150, 30, 105, 75];
  const SHOWN = 6;
  const pad2 = n => String(n).padStart(2, '0');
  const shotSrc = p => `assets/works/${p.slug}.webp`;
  const thumbSrc = p => `assets/works/${p.slug}-thumb.webp`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const mobileQ = window.matchMedia('(max-width: 759.98px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = new URLSearchParams(location.search);

  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');

  const pathLang = (location.pathname.match(/\/(ru|en)(\/|$)/) || [])[1];
  const state = {
    lang: q.get('lang') === 'en' || q.get('lang') === 'ru' ? q.get('lang') : (pathLang || 'ru'),
    all: false,
    sent: false,
    modal: null,
    shot: null, // null = match the current viewport
    details: false,
    lastHover: 0,
    contact: false, // contact form panel open
  };
  const frameId = q.get('frame');
  const qModal = parseInt(q.get('modal'), 10);
  // Static captures (boards.html frames, ?reveal=0) skip the loader and all entrance motion.
  const still = reducedMotion || !!frameId || q.get('reveal') === '0' || !isNaN(qModal);

  let revealStarted = false;
  let io = null;
  let lenis = null;
  let returnFocus = null;

  const t = () => DICT[state.lang];
  const isMobile = () => mobileQ.matches;

  /* ---------- Page ---------- */

  // Link label that rolls up to a copy of itself on hover.
  const roll = text => `<span class="roll" data-t="${esc(text)}"><span>${text}</span></span>`;

  function langSwitch() {
    return `<div class="langs">
      <a href="?lang=ru" data-lang="ru" aria-current="${state.lang === 'ru'}">RU</a>
      <span aria-hidden="true">/</span>
      <a href="?lang=en" data-lang="en" aria-current="${state.lang === 'en'}">EN</a>
    </div>`;
  }

  function nav(d) {
    return `<a class="lnk" href="#work">${roll(d.navWork)}</a>, <a class="lnk" href="#about">${roll(d.navAbout)}</a>, <a class="lnk" href="#contact">${roll(d.navContact)}</a>`;
  }

  function links(d) {
    return LINKS.map(l => ({
      label: l.key === 'mail' ? d.mail : l.key,
      href: l.href,
      ext: l.ext ? ' target="_blank" rel="noopener"' : '',
      text: d.link[l.text] + (l.ext ? ' ↗' : ''),
    }));
  }

  // Hero title as words (accent spans kept inside their word); split into lines after layout.
  function heroWords(d) {
    const words = [];
    let cur = '';
    [[d.h1a], [d.h1b, 1], [d.h1c], [d.h1d, 1], [d.h1e]].forEach(([txt, accent]) => {
      txt.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { if (cur) words.push(cur); cur = ''; return; }
        cur += accent ? `<span class="accent">${tok}</span>` : tok;
      });
    });
    if (cur) words.push(cur);
    return words;
  }

  function splitHero() {
    const h1 = app.querySelector('.hero-title');
    if (!h1) return;
    h1.innerHTML = heroWords(t()).map(w => `<span class="w">${w}</span>`).join(' ');
    const lines = [];
    let top = null;
    h1.querySelectorAll('.w').forEach(w => {
      if (top === null || Math.abs(w.offsetTop - top) > 4) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.outerHTML);
    });
    h1.innerHTML = lines.map((l, i) => `<span class="line"><span class="line-inner" style="--i:${i}">${l.join(' ')}</span></span>`).join('');
  }

  function pageHTML() {
    const d = t();
    const list = state.all ? P : P.slice(0, SHOWN);
    const lk = links(d);

    return `
<header class="hdr hdr--d">
  <div class="hdr-d grid">
    <a href="#top" class="logo">web is everything</a>
    <nav>${nav(d)}</nav>
    <div class="hdr-right">${langSwitch()}<a class="lnk" href="#contact" data-action="contact-open">${roll(`→ ${d.cta}`)}</a></div>
  </div>
</header>
<header class="hdr hdr--m">
  <div class="hdr-m">
    <div class="hdr-m-top"><a href="#top" class="logo">web is everything</a>${langSwitch()}</div>
    <nav class="hdr-m-nav">${nav(d)}</nav>
  </div>
</header>

<main>
  <section id="top" class="hero">
    <div class="grid">
      <h1 class="hero-title">${heroWords(d).join(' ')}</h1>
      <ul class="hero-links">
        ${lk.map((l, i) => `<li class="hero-fade" style="--d:${0.45 + i * 0.06}s"><span>${l.label}</span><a class="lnk" href="${l.href}"${l.ext}>${roll(l.text)}</a></li>`).join('')}
      </ul>
      <p class="intro hero-fade" style="--d:0.7s">${d.intro}</p>
    </div>
  </section>

  <section id="work" class="section">
    <div class="sec-head grid" data-reveal>
      <h2>${d.work}</h2>
      <span class="count">${list.length} ${d.of} ${P.length}</span>
    </div>
    <div class="rows work-list">
      ${list.map((p, i) => `
      <article class="work-row" data-i="${i}" data-reveal>
        <a class="work-link grid" href="#work/${p.slug}" data-open="${i}">
          <div class="work-thumb ph${p.shot ? ' has-img' : ''}">${p.shot
            ? `<img src="${thumbSrc(p)}" width="900" height="563" alt="" loading="lazy" decoding="async">`
            : `<span class="tag">(${pad2(i + 1)}) ${p.name}, ${d.preview}</span>`}</div>
          <span class="num">(${pad2(i + 1)})</span>
          <h3 class="big-title">${p[state.lang].title}</h3>
          <span class="work-type">${p[state.lang].type}</span>
        </a>
      </article>`).join('')}
    </div>
    <div class="work-more grid">
      <a class="lnk" href="#work" data-action="toggle-all" aria-expanded="${state.all}">${roll(state.all ? `← ${d.collapse}` : `→ ${d.allWorks} (${P.length})`)}</a>
    </div>
  </section>

  <section id="services" class="section">
    <div class="sec-head grid" data-reveal><h2>${d.services}</h2></div>
    <div class="rows">
      ${d.svc.map((s, i) => `
      <div class="svc-row grid" data-reveal>
        <span class="num">(${pad2(i + 1)})</span>
        <h3 class="big-title">${s[0]}</h3>
        <p class="svc-incl">${s[1]}</p>
        <span class="svc-price">${s[2]}</span>
      </div>`).join('')}
    </div>
    <div class="svc-note grid"><p>${d.svcNote}</p></div>
  </section>

  <section id="about" class="section">
    <div class="sec-head grid" data-reveal><h2>${d.about}</h2></div>
    <div class="about-body grid">
      <div class="photo" data-reveal="wipe"><div class="ph has-img"><img src="${PHOTO.src}" width="${PHOTO.w}" height="${PHOTO.h}" alt="${d.photoAlt}" loading="lazy" decoding="async"></div></div>
      <div class="about-text">
        <p class="about-lead" data-reveal="rise"><span class="rise">${d.aboutLead}</span></p>
        <p class="about-p" data-reveal>${d.aboutText}</p>
        <div class="facts" data-reveal>
          <div><h3>${d.langsLabel}</h3><p>${d.langs}</p></div>
          <div><h3>${d.stackLabel}</h3><p>React, Astro, Laravel, Tailwind, SCSS, GSAP, MySQL, MongoDB, Firebase, Figma</p></div>
        </div>
      </div>
    </div>
  </section>

</main>

<footer class="footer" id="contact">
  <div class="footer-inner">
    <div class="footer-top">
      <button type="button" class="footer-cta lnk plain-btn" data-action="contact-open" aria-haspopup="dialog">${roll(`→ ${d.cta}`)}</button>
      <div class="footer-col">
        <h2>${d.footNav}</h2>
        <a class="lnk" href="#work">${roll(d.navWork)}</a>
        <a class="lnk" href="#services">${roll(d.services)}</a>
        <a class="lnk" href="#about">${roll(d.navAbout)}</a>
        <a class="lnk" href="#contact">${roll(d.navContact)}</a>
      </div>
      <div class="footer-col">
        <h2>${d.footLinks}</h2>
        ${lk.map(l => `<a class="lnk" href="${l.href}"${l.ext}>${roll(l.label + (l.ext ? ' ↗' : ''))}</a>`).join('')}
      </div>
    </div>
    <p class="footer-mark" aria-hidden="true">web is everything<span class="accent">.</span></p>
    <div class="footer-bottom">
      <span>${d.footer}</span>
      <a class="lnk" href="#top">${roll(`↑ ${d.top}`)}</a>
    </div>
  </div>
</footer>


<div class="contact-panel${state.contact ? ' is-open' : ''}" role="dialog" aria-modal="true" aria-labelledby="cp-title"${state.contact ? '' : ' inert'}>
  <div class="cpanel-inner" data-lenis-prevent>
    <div class="cpanel-bar">
      <span class="muted">(${d.contact})</span>
      <button type="button" class="plain-btn close-btn" data-action="contact-close" aria-label="${d.m.close}">×</button>
    </div>
    <h2 class="big-mail cp-anim" id="cp-title" style="--d:.35s">${d.big.replace('\n', '<br>')}</h2>
    <div class="contact-body grid">
      <div class="contact-links cp-anim" style="--d:.5s">
        <p>${d.contactNote}</p>
        ${lk.map(l => `<div class="contact-link"><span>${l.label}</span><a class="lnk" href="${l.href}"${l.ext}>${roll(l.text)}</a></div>`).join('')}
      </div>
      <form class="form cp-anim" style="--d:.6s" novalidate>
        ${state.sent ? `<p class="sent" role="status">${d.sent}</p>` : `
        <label><span>${d.fName}</span><input name="name" required autocomplete="name"></label>
        <label><span>${d.fContact}</span><input name="contact" required></label>
        <label><span>${d.fTask}</span><textarea name="task" rows="3"></textarea></label>
        <button type="submit">→ ${d.send}</button>`}
      </form>
    </div>
  </div>
</div>

<a class="tg-bar" href="https://t.me/whitenovacanee" target="_blank" rel="noopener"><span>→ ${d.cta}</span><small>Telegram</small></a>`;
  }

  // animate: true lets freshly rendered blocks reveal on scroll again (e.g. "all work");
  // false shows them at once (language switch, where the page is already in view).
  function renderPage({ animate = false } = {}) {
    const d = t();
    document.documentElement.lang = state.lang;
    document.title = d.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = d.description;

    // Keep typed form values across re-renders (language switch, "all work" toggle).
    const form = app.querySelector('form');
    const values = form ? Object.fromEntries(new FormData(form)) : null;

    app.innerHTML = pageHTML();

    if (values) {
      const f = app.querySelector('form');
      Object.entries(values).forEach(([k, v]) => { if (f.elements[k]) f.elements[k].value = v; });
    }
    splitHero();
    buildFollower();
    syncFooter();
    if (revealStarted) {
      if (animate && io) observeReveals();
      else app.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
    }
  }

  /* ---------- Scroll reveals ---------- */

  function observeReveals() {
    app.querySelectorAll('[data-reveal]:not(.is-in)').forEach(el => io.observe(el));
  }

  function startReveals() {
    revealStarted = true;
    if (still || !('IntersectionObserver' in window)) {
      app.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
      return;
    }
    io = new IntersectionObserver(entries => {
      // Blocks entering together come in one after another.
      let k = 0;
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = `${k++ * 0.08}s`;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    observeReveals();
  }

  /* ---------- Smooth scroll and header ---------- */

  function initLenis() {
    if (still || !window.Lenis) return;
    lenis = new window.Lenis({ autoRaf: true, lerp: 0.09, smoothWheel: true });
  }

  const headerOffset = () => (isMobile() ? -70 : -76);

  function scrollToEl(el) {
    if (el.classList && el.classList.contains('footer')) {
      const end = document.documentElement.scrollHeight;
      if (lenis) lenis.scrollTo(end, { duration: 1.6 });
      else window.scrollTo({ top: end, behavior: reducedMotion ? 'auto' : 'smooth' });
      return;
    }
    if (lenis) lenis.scrollTo(el === document.body ? 0 : el, { offset: el === document.body ? 0 : headerOffset(), duration: 1.4 });
    else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  // Past the top of the page the header turns into a floating rounded bar.
  function syncHeader() {
    document.documentElement.classList.toggle('hdr-float', window.scrollY > 40);
  }
  window.addEventListener('scroll', syncHeader, { passive: true });

  // The footer sits behind the page (position: sticky) and is uncovered as the page scrolls away;
  // its content rises from below in step with how much of it is visible.
  function syncFooter() {
    const footer = app.querySelector('.footer');
    const main = app.querySelector('main');
    if (!footer || !main) return;
    const barH = isMobile() ? 56 : 0;
    // A footer taller than the screen can't be uncovered in full, so it scrolls normally.
    footer.classList.toggle('is-static', footer.offsetHeight > window.innerHeight - barH + 1);
    const shown = window.innerHeight - barH - main.getBoundingClientRect().bottom;
    const p = Math.max(0, Math.min(1, shown / footer.offsetHeight));
    footer.style.setProperty('--reveal', still ? 1 : p.toFixed(3));
  }
  window.addEventListener('scroll', syncFooter, { passive: true });
  window.addEventListener('resize', syncFooter);

  window.addEventListener('resize', (() => {
    let w = window.innerWidth, timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (window.innerWidth !== w) { w = window.innerWidth; splitHero(); } }, 150);
    };
  })());

  /* ---------- Hover preview (desktop): follows the cursor over the work list ---------- */

  // One layer per project, stacked, so switching rows cross-fades with no image loading flash.
  const follower = document.createElement('div');
  follower.className = 'cursor-preview';
  follower.setAttribute('aria-hidden', 'true');
  document.body.appendChild(follower);

  function buildFollower() {
    follower.innerHTML = P.map((p, i) => p.shot
      ? `<div class="cp-layer" style="background-image:url('${thumbSrc(p)}')"></div>`
      : `<div class="cp-layer cp-ph" style="background-image:repeating-linear-gradient(${ANGLES[i % ANGLES.length]}deg, rgba(18,18,17,0.08) 0px, rgba(18,18,17,0.08) 1px, transparent 1px, transparent 9px)"><span class="tag">(${pad2(i + 1)}) ${p.name}, ${t().preview}</span></div>`
    ).join('');
  }

  const cursor = { x: 0, y: 0, cx: 0, cy: 0, active: false, raf: 0 };

  function followLoop() {
    const k = still ? 1 : 0.14;
    cursor.cx += (cursor.x - cursor.cx) * k;
    cursor.cy += (cursor.y - cursor.cy) * k;
    // Lean into the direction of movement.
    const tilt = Math.max(-12, Math.min(12, (cursor.x - cursor.cx) * 0.06));
    follower.style.transform = `translate3d(${cursor.cx}px, ${cursor.cy}px, 0) translate(-50%, -50%) rotate(${tilt}deg)`;
    const settled = Math.abs(cursor.x - cursor.cx) < 0.3 && Math.abs(cursor.y - cursor.cy) < 0.3;
    cursor.raf = cursor.active || !settled ? requestAnimationFrame(followLoop) : 0;
  }

  function hoverRow(row) {
    const list = row.closest('.work-list');
    const i = +row.dataset.i;
    state.lastHover = i;
    list.querySelectorAll('.work-row.is-hover').forEach(r => r.classList.remove('is-hover'));
    row.classList.add('is-hover');
    list.classList.add('has-hover');
    follower.querySelectorAll('.cp-layer').forEach((l, j) => l.classList.toggle('is-on', j === i));
    if (!cursor.active) {
      cursor.active = true;
      follower.classList.add('is-visible');
      if (!cursor.raf) cursor.raf = requestAnimationFrame(followLoop);
    }
  }

  function clearHover(list) {
    cursor.active = false;
    follower.classList.remove('is-visible');
    if (!list) return;
    list.classList.remove('has-hover');
    list.querySelectorAll('.work-row.is-hover').forEach(r => r.classList.remove('is-hover'));
  }

  app.addEventListener('mousemove', e => {
    if (!e.target.closest('.work-list')) return;
    if (!cursor.active) { cursor.cx = e.clientX; cursor.cy = e.clientY; } // appear right at the pointer
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  });
  app.addEventListener('mouseover', e => {
    if (isMobile()) return;
    const row = e.target.closest('.work-row');
    if (row && !row.classList.contains('is-hover')) hoverRow(row);
  });
  app.addEventListener('mouseout', e => {
    const list = e.target.closest('.work-list');
    if (list && !list.contains(e.relatedTarget)) clearHover(list);
  });

  /* ---------- Contact form panel ---------- */

  let contactReturn = null;

  function openContact(opener) {
    const panel = app.querySelector('.contact-panel');
    if (!panel || state.contact) return;
    contactReturn = opener || document.activeElement;
    clearHover(app.querySelector('.work-list'));
    state.contact = true;
    panel.inert = false;
    panel.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    const first = panel.querySelector('input');
    setTimeout(() => (first || panel.querySelector('.close-btn')).focus({ preventScroll: true }), still ? 0 : 700);
  }

  function closeContact() {
    const panel = app.querySelector('.contact-panel');
    if (!panel || !state.contact) return;
    state.contact = false;
    panel.classList.remove('is-open');
    panel.inert = true;
    document.documentElement.style.overflow = '';
    if (lenis) lenis.start();
    if (contactReturn && document.contains(contactReturn)) contactReturn.focus({ preventScroll: true });
    contactReturn = null;
  }

  /* ---------- Page events ---------- */

  function setLang(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
    const swap = () => {
      renderPage();
      if (state.modal != null) renderModal({ keepScroll: true });
    };
    // Cross-fade with a soft blur; View Transitions where supported, a plain fade otherwise.
    if (still) swap();
    else if (document.startViewTransition) document.startViewTransition(swap);
    else {
      app.classList.add('is-switching');
      setTimeout(() => { swap(); requestAnimationFrame(() => app.classList.remove('is-switching')); }, 280);
    }
  }

  app.addEventListener('click', e => {
    const langLink = e.target.closest('[data-lang]');
    if (langLink) { e.preventDefault(); setLang(langLink.dataset.lang); return; }

    const opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); openModal(+opener.dataset.open, opener); return; }

    const contactBtn = e.target.closest('[data-action="contact-open"], [data-action="contact-close"]');
    if (contactBtn) {
      e.preventDefault();
      if (contactBtn.dataset.action === 'contact-open') openContact(contactBtn);
      else closeContact();
      return;
    }

    if (e.target.closest('[data-action="toggle-all"]')) {
      e.preventDefault();
      state.all = !state.all;
      renderPage({ animate: true });
      if (!state.all) scrollToEl(document.getElementById('work'));
      return;
    }

    const anchor = e.target.closest('a[href^="#"]');
    if (anchor) {
      const id = anchor.getAttribute('href').slice(1);
      const target = id === 'top' ? document.body : document.getElementById(id);
      if (target) { e.preventDefault(); scrollToEl(target); }
    }
  });

  app.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      const bad = form.querySelector(':invalid');
      if (bad) bad.focus();
      return;
    }
    // TODO: send the form somewhere (e.g. a Telegram bot or form service). The design only shows the thank-you state.
    state.sent = true;
    renderPage();
  });

  /* ---------- Project modal ---------- */

  function currentShot() { return state.shot || (isMobile() ? 'mobile' : 'desktop'); }

  function shotBlocksHTML(p) {
    const d = t();
    if (p.shot) {
      return `<img class="shot-img" src="${shotSrc(p)}" width="${p.shot[0]}" height="${p.shot[1]}" alt="${esc(p[state.lang].title)}" decoding="async">`;
    }
    const shot = currentShot();
    const scale = isMobile() && shot === 'desktop' ? 0.3 : 1;
    return d.shotLabels.map((lab, i) => `
      <div class="shot-block" style="height:${Math.round(SHOT_H[shot][i] * scale)}px">
        <span class="tag">(${i + 1}/${d.shotLabels.length}) ${lab}</span>
        <span class="tag center">${p.name} · ${d.m.shot} ${shot === 'desktop' ? '1440' : '375'} px</span>
      </div>`).join('');
  }

  // Real screenshots exist only for desktop, so the switch is shown for placeholder projects only.
  function shotToggle(mobileLabel) {
    if (P[state.modal].shot) return '<span></span>';
    const tm = t().m;
    const shot = currentShot();
    return `<div class="shot-toggle">
      <button type="button" class="plain-btn" data-shot="desktop" aria-pressed="${shot === 'desktop'}">${tm.desktop}</button>
      <span aria-hidden="true">/</span>
      <button type="button" class="plain-btn" data-shot="mobile" aria-pressed="${shot === 'mobile'}">${mobileLabel}</button>
    </div>`;
  }

  function metaHTML(pl, p) {
    const tm = t().m;
    return `<dl class="meta">
      <div><dt>${tm.services}</dt><dd>${pl.services}</dd></div>
      <div><dt>${tm.desc}</dt><dd>${pl.desc}</dd></div>
      <div><dt>${tm.stack}</dt><dd>${p.stack}</dd></div>
    </dl>`;
  }

  function modalHTML() {
    const tm = t().m;
    const i = state.modal;
    const p = P[i], pl = p[state.lang];
    const prevP = P[(i - 1 + P.length) % P.length], nextP = P[(i + 1) % P.length];
    const num = pad2(i + 1);
    const counter = `${num} / ${pad2(P.length)}`;
    const openLink = `<a class="open-link" href="${esc(p.url)}" target="_blank" rel="noopener">→ ${tm[p.link]}</a>`;

    if (!isMobile()) {
      const mobileShot = !p.shot && currentShot() === 'mobile';
      return `
<div class="md-backdrop" data-action="close">
  <div class="md" role="dialog" aria-modal="true" aria-labelledby="pm-title">
    <div class="md-main">
      <div class="md-bar">
        ${shotToggle(tm.mobile)}
        <span class="muted tabular" data-progress-label>${tm.scroll} 0%</span>
        <div class="md-progress" data-progress></div>
      </div>
      <div class="md-scroll${mobileShot ? ' is-mobile-shot' : ''}" data-scroll data-lenis-prevent tabindex="0">
        <div class="md-shot">${shotBlocksHTML(p)}</div>
      </div>
    </div>
    <aside class="md-aside" data-lenis-prevent>
      <div class="md-aside-bar">
        <span class="muted tabular">(${num})</span>
        <button type="button" class="plain-btn close-btn" data-action="close" aria-label="${tm.close}">×</button>
      </div>
      <div class="md-aside-body">
        <h2 id="pm-title">${pl.title}</h2>
        ${metaHTML(pl, p)}
        ${openLink}
      </div>
    </aside>
    <nav class="md-nav">
      <div><a href="#work/${prevP.slug}" data-go="-1" style="white-space:nowrap">← ${tm.prev}</a><span class="ellipsis">${prevP[state.lang].title}</span></div>
      <span class="muted tabular">${counter}</span>
      <div><span class="ellipsis">${nextP[state.lang].title}</span><a href="#work/${nextP.slug}" data-go="1" style="white-space:nowrap">${tm.next} →</a></div>
    </nav>
  </div>
</div>`;
    }

    return `
<div class="mm" role="dialog" aria-modal="true" aria-labelledby="pm-title-m">
  <div class="mm-bar">
    <span class="num">(${num})</span>
    <h2 id="pm-title-m">${pl.title}</h2>
    <button type="button" class="plain-btn mm-more" data-action="details" aria-expanded="${state.details}">${state.details ? tm.less : tm.more}</button>
    <button type="button" class="plain-btn close-btn" data-action="close" aria-label="${tm.close}">×</button>
  </div>
  ${state.details ? `
  <div class="mm-details" data-lenis-prevent>
    <p>${pl.title}</p>
    ${metaHTML(pl, p)}
    <div class="mm-details-foot">${shotToggle(tm.mobileShort)}${openLink}</div>
  </div>` : ''}
  <div class="mm-progress"><div data-progress></div></div>
  <div class="mm-scroll" data-scroll data-lenis-prevent>
    <div class="md-shot">${shotBlocksHTML(p)}</div>
  </div>
  <nav class="mm-nav">
    <a href="#work/${prevP.slug}" data-go="-1">← ${tm.prevS}</a>
    <span class="num">${counter}</span>
    <a href="#work/${nextP.slug}" data-go="1">${tm.nextS} →</a>
  </nav>
</div>`;
  }

  function onModalScroll() {
    const el = modalRoot.querySelector('[data-scroll]');
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.round((el.scrollTop / max) * 100) : 0;
    const bar = modalRoot.querySelector('[data-progress]');
    const label = modalRoot.querySelector('[data-progress-label]');
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = `${t().m.scroll} ${pct}%`;
  }

  function setScroll(fraction) {
    const el = modalRoot.querySelector('[data-scroll]');
    if (!el) return;
    el.scrollTop = fraction * (el.scrollHeight - el.clientHeight);
    onModalScroll();
  }

  function renderModal({ keepScroll = false, scroll = 0 } = {}) {
    if (state.modal == null) { modalRoot.innerHTML = ''; return; }
    const old = modalRoot.querySelector('[data-scroll]');
    const prevTop = keepScroll && old ? old.scrollTop : null;
    const hadFocus = modalRoot.contains(document.activeElement) && document.activeElement.dataset.action;

    modalRoot.innerHTML = modalHTML();
    const el = modalRoot.querySelector('[data-scroll]');
    el.addEventListener('scroll', onModalScroll, { passive: true });

    if (prevTop != null) { el.scrollTop = prevTop; onModalScroll(); }
    else requestAnimationFrame(() => setScroll(scroll));

    if (hadFocus) {
      const again = modalRoot.querySelector(`[data-action="${hadFocus}"]`);
      if (again) again.focus();
    }
  }

  function syncHash() {
    const url = new URL(location.href);
    url.hash = state.modal == null ? '' : `work/${P[state.modal].slug}`;
    history.replaceState(null, '', url.href.replace(/#$/, ''));
  }

  function openModal(i, opener, opts = {}) {
    returnFocus = opener || document.activeElement;
    clearHover(app.querySelector('.work-list'));
    state.modal = i;
    state.details = !!opts.details;
    document.body.classList.add('modal-open');
    document.documentElement.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    renderModal({ scroll: opts.scroll || 0 });
    syncHash();
    const close = modalRoot.querySelector('.close-btn');
    if (close && !opts.noFocus) close.focus({ preventScroll: true });
  }

  function closeModal() {
    state.modal = null;
    document.body.classList.remove('modal-open');
    document.documentElement.style.overflow = '';
    if (lenis) lenis.start();
    renderModal();
    syncHash();
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  function go(dir) {
    state.modal = (state.modal + dir + P.length) % P.length;
    renderModal();
    syncHash();
  }

  modalRoot.addEventListener('click', e => {
    const goEl = e.target.closest('[data-go]');
    if (goEl) { e.preventDefault(); go(+goEl.dataset.go); return; }

    const shotEl = e.target.closest('[data-shot]');
    if (shotEl) {
      if (shotEl.dataset.shot !== currentShot()) { state.shot = shotEl.dataset.shot; renderModal(); }
      return;
    }

    const action = e.target.closest('[data-action]');
    if (!action) return;
    // The desktop backdrop closes only on clicks outside the dialog.
    if (action.classList.contains('md-backdrop') && e.target !== action) return;
    if (action.dataset.action === 'close') closeModal();
    else if (action.dataset.action === 'details') { state.details = !state.details; renderModal({ keepScroll: true }); }
  });

  document.addEventListener('keydown', e => {
    if (state.contact && e.key === 'Escape') { closeContact(); return; }
    if (state.modal == null) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      const items = [...modalRoot.querySelectorAll('a[href], button, [tabindex="0"]')];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!modalRoot.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  mobileQ.addEventListener('change', () => {
    clearHover(app.querySelector('.work-list'));
    if (state.modal != null) renderModal({ keepScroll: true });
  });

  function modalFromHash() {
    const m = location.hash.match(/^#work\/([\w-]+)$/);
    const i = m ? P.findIndex(p => p.slug === m[1]) : -1;
    return i;
  }

  window.addEventListener('hashchange', () => {
    const i = modalFromHash();
    if (i >= 0 && i !== state.modal) openModal(i);
    else if (i < 0 && state.modal != null) closeModal();
  });

  /* ---------- Loader ---------- */

  // Counts to 100 while fonts and the page load (at least ~1.4 s), then lifts away like a curtain.
  function runLoader(done) {
    const loader = document.querySelector('.loader');
    const accent = document.querySelector('.loader-accent');
    const root = document.documentElement;
    const cleanup = () => { loader && loader.remove(); accent && accent.remove(); };

    if (!loader || still || location.hash.startsWith('#work/')) {
      cleanup();
      root.classList.remove('is-loading');
      done();
      return;
    }

    const count = loader.querySelector('[data-loader-count]');
    const bar = loader.querySelector('[data-loader-bar]');
    loader.querySelector('[data-loader-note]').textContent = t().loading;
    if (lenis) lenis.stop();

    const MIN = 1400;
    const start = performance.now();
    let ready = false;
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(r => window.addEventListener('load', r, { once: true }));
    Promise.all([loaded, document.fonts ? document.fonts.ready : null]).then(() => { ready = true; });
    setTimeout(() => { ready = true; }, 5000);

    let shown = 0;
    const tick = now => {
      const elapsed = now - start;
      const goal = Math.min(ready ? 100 : 90, (elapsed / MIN) * 100);
      shown += (goal - shown) * 0.14;
      if (goal === 100 && 100 - shown < 0.6) shown = 100;
      count.textContent = Math.round(shown);
      bar.style.transform = `scaleX(${shown / 100})`;
      if (shown < 100) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);

    function finish() {
      splitHero(); // fonts are in, so line breaks are final
      loader.classList.add('is-leaving');
      setTimeout(() => {
        loader.classList.add('is-done');
        accent.classList.add('is-done');
        root.classList.remove('is-loading');
        if (lenis) { lenis.scrollTo(0, { immediate: true }); lenis.start(); }
      }, 420);
      setTimeout(done, 650);
      setTimeout(cleanup, 2000);
    }
  }

  /* ---------- Boot ---------- */

  app.classList.add(still ? 'hero-in' : 'reveal-init');
  renderPage();
  initLenis();
  syncHeader();
  if (document.fonts) document.fonts.ready.then(splitHero);

  // Deep links: #work/<slug>, or ?modal=<n>&shot=desktop|mobile&scroll=0..1&details=1 (used by boards.html).
  if (q.get('shot') === 'mobile' || q.get('shot') === 'desktop') state.shot = q.get('shot');
  const startModal = !isNaN(qModal) ? Math.min(P.length - 1, Math.max(0, qModal - 1)) : modalFromHash();
  if (startModal >= 0) {
    openModal(startModal, null, { details: !!q.get('details'), scroll: parseFloat(q.get('scroll') || '0'), noFocus: !isNaN(qModal) });
  }

  runLoader(() => {
    app.classList.add('hero-in');
    startReveals();
  });

  // When embedded in boards.html, report the page height so the frame can grow to fit.
  if (frameId && window.parent !== window) {
    const post = () => window.parent.postMessage({ wie: 'h', id: frameId, h: Math.ceil(app.getBoundingClientRect().height) }, '*');
    new ResizeObserver(post).observe(app);
    post();
  }
})();
