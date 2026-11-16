// Заеднички функции за сите страници
const SM = (() => {
  const svg = (d, extra = '') => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const I = {
    cart: svg('<path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>'),
    ig: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'),
    fb: svg('<path d="M14 21v-7.5h2.6l.4-3H14V8.7c0-.9.3-1.5 1.6-1.5H17V4.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H8.3v3H11V21"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    hand: svg('<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>'),
    leaf: svg('<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19 13 11"/>'),
    brush: svg('<path d="M14.5 4.5l5 5L11 18l-5-5z"/><path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s3 0 4.5-1S8 16 8 15"/>'),
    truck: svg('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>'),
    cake: svg('<path d="M4 20h16M5 20v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"/><path d="M5 15c1.5 1 2.5 1 3.5 0s2.5-1 3.5 0 2.5 1 3.5 0 2.5-1 3.5 0"/><path d="M12 11V7"/><path d="M12 4.5c.8.6.8 1.6 0 2-.8-.4-.8-1.4 0-2z"/>'),
    rings: svg('<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 5l2-2 2 2-2 2z"/>'),
    gift: svg('<rect x="3.5" y="9" width="17" height="11" rx="1"/><path d="M2.5 9h19M12 9v11"/><path d="M12 9C10 5 6.5 5 6.5 7S9 9 12 9zM12 9c2-4 5.5-4 5.5-2S15 9 12 9z"/>'),
    tree: svg('<path d="M12 3 6 11h3l-4 6h14l-4-6h3z"/><path d="M12 17v4"/>'),
    phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    pin: svg('<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    box: svg('<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
    upload: svg('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>'),
    check: svg('<path d="m5 12 4.5 4.5L19 7"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    cookie: svg('<path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z"/><circle cx="8.5" cy="10" r=".8" fill="currentColor"/><circle cx="14" cy="15" r=".8" fill="currentColor"/><circle cx="9" cy="15.5" r=".8" fill="currentColor"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c.6 6.5 5.5 11.4 12 12-6.5.6-11.4 5.5-12 12-.6-6.5-5.5-11.4-12-12C6.5 11.4 11.4 6.5 12 0z"/></svg>',
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>')
  };
  const NAV = [
    ['/', 'Почетна'], ['/shop.html', 'Колачиња и пакети'], ['/custom.html', 'Сопствен дизајн'],
    ['/gallery.html', 'Галерија'], ['/reviews.html', 'Рецензии'], ['/contact.html', 'Контакт']
  ];

  let dataPromise;
  const load = () => (dataPromise ||= fetch('/api/public').then(r => r.json()));

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');
  let currency = 'ден';
  const money = n => `${Number(n || 0).toLocaleString('mk-MK')} ${currency}`;

  // ---------- Безбедно локално складирање ----------
  const store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // ---------- Кошничка ----------
  const getCart = () => store.get('sm_cart', []);
  function setCart(c) { store.set('sm_cart', c); updateCount(); }
  function addProduct(id, qty = 1) {
    const c = getCart();
    const ex = c.find(i => i.type === 'product' && i.id === id);
    if (ex) ex.qty += qty; else c.push({ key: 'p' + Date.now() + Math.random(), type: 'product', id, qty });
    setCart(c);
  }
  function addPackage(id, cookies) {
    const c = getCart();
    c.push({ key: 'k' + Date.now() + Math.random(), type: 'package', id, qty: 1, cookies });
    setCart(c);
  }
  function updateCount() {
    const el = document.querySelector('.cart-count');
    if (!el) return;
    const n = getCart().reduce((s, i) => s + i.qty, 0);
    el.textContent = n; el.classList.toggle('hidden', !n);
  }

  // ---------- Известување ----------
  let toastEl, toastT;
  function toast(msg, error = false) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = (error ? I.info : I.check) + `<span>${esc(msg)}</span>`;
    toastEl.classList.toggle('error', error);
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  function socialButtons(s) {
    const ig = safeUrl(s.instagram), fb = safeUrl(s.facebook);
    return [ig && `<a href="${esc(ig)}" target="_blank" rel="noopener" class="btn btn-outline">${I.ig} Instagram</a>`,
            fb && `<a href="${esc(fb)}" target="_blank" rel="noopener" class="btn btn-outline">${I.fb} Facebook</a>`].filter(Boolean).join('');
  }
  function socialIcons(s, cls = 'icon-btn') {
    const ig = safeUrl(s.instagram), fb = safeUrl(s.facebook);
    return [ig && `<a href="${esc(ig)}" target="_blank" rel="noopener" class="${cls}" aria-label="Instagram">${I.ig}</a>`,
            fb && `<a href="${esc(fb)}" target="_blank" rel="noopener" class="${cls}" aria-label="Facebook">${I.fb}</a>`].filter(Boolean).join('');
  }

  function renderChrome(d) {
    const s = d.settings;
    currency = s.currency || 'ден';
    const here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
    const header = document.getElementById('site-header');
    if (header) {
      header.outerHTML = `
      ${s.announcement ? `<div class="announce">${I.tree}<span>${esc(s.announcement)}</span></div>` : ''}
      <header class="site-header" id="siteHeader"><div class="container nav">
        <a href="/" class="logo" aria-label="${esc(s.brand)} – почетна"><img src="${esc(s.logo)}" alt="${esc(s.brand)}" width="128" height="58"></a>
        <ul class="nav-links" id="navLinks">
          ${NAV.map(([href, label]) => `<li><a href="${href}" class="${href.replace(/\.html$/, '') === here ? 'active' : ''}">${label}</a></li>`).join('')}
        </ul>
        <div class="nav-right">
          <span class="nav-social">${socialIcons(s)}</span>
          <a href="/cart.html" class="icon-btn" aria-label="Кошничка">${I.cart}<span class="cart-count hidden">0</span></a>
          <button class="icon-btn menu-toggle" aria-label="Мени" id="menuBtn">${I.menu}</button>
        </div>
      </div></header>`;
      document.getElementById('menuBtn').onclick = () => document.getElementById('navLinks').classList.toggle('open');
      const hd = document.getElementById('siteHeader');
      addEventListener('scroll', () => hd.classList.toggle('scrolled', scrollY > 10), { passive: true });
    }
    const footer = document.getElementById('site-footer');
    if (footer) {
      footer.outerHTML = `
      <footer class="site-footer"><div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="/images/logo-white.svg" alt="${esc(s.brand)}" width="162" height="74">
            <p>${esc(s.sloganMk)}<br><em style="opacity:.75">${esc(s.sloganEn)}</em></p>
            <div class="footer-social">${socialIcons(s, '')}</div>
          </div>
          <div><h4>Нарачки</h4><ul>
            <li><a href="/shop.html">Колачиња</a></li><li><a href="/shop.html#packages">Пакети</a></li>
            <li><a href="/custom.html">Сопствен дизајн</a></li><li><a href="/cart.html">Кошничка</a></li></ul></div>
          <div><h4>Sweet Moments</h4><ul>
            <li><a href="/gallery.html">Галерија</a></li><li><a href="/reviews.html">Рецензии</a></li>
            <li><a href="/contact.html">Контакт</a></li><li><a href="/terms.html">Услови за нарачка</a></li></ul></div>
          <div><h4>Контакт</h4><ul>
            ${s.phone ? `<li><a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a></li>` : ''}
            ${s.email ? `<li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : ''}
            ${s.address ? `<li>${esc(s.address)}</li>` : ''}
            <li><a href="/contact.html">Испратете порака →</a></li>
          </ul></div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${esc(s.brand)}. Сите права се задржани.</span>
          <span class="legal-links"><a href="/privacy.html">Политика за приватност</a><a href="/privacy.html#cookies">Колачиња (cookies)</a><a href="/terms.html">Услови</a></span>
          <span class="credit">Изработено од <a href="https://miora.mk" target="_blank" rel="noopener">miora.mk</a></span>
        </div>
      </div></footer>`;
    }
    updateCount();
    cookieBanner();
    reveal();
  }

  // ---------- Известување за колачиња (cookies) ----------
  function cookieBanner() {
    if (store.get('sm_cookie_ok', false) || location.pathname.startsWith('/admin')) return;
    const b = document.createElement('div');
    b.className = 'cookie-banner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Известување за колачиња');
    b.innerHTML = `<h4>${I.cookie} Колачиња (cookies)</h4>
      <p>Користиме само неопходни колачиња и локално складирање за да работи кошничката. Не користиме колачиња за следење или реклами. <a href="/privacy.html#cookies">Повеќе информации</a></p>
      <div class="row"><button class="btn btn-sm">Во ред, прифаќам</button></div>`;
    b.querySelector('button').onclick = () => { store.set('sm_cookie_ok', true); b.remove(); };
    document.body.appendChild(b);
  }

  // Анимација при скролање
  function reveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px 0px' });
    els.forEach(e => io.observe(e));
  }

  // Количина +/- контрола
  function qtyControl(value = 1, min = 0, max = 999) {
    const wrap = document.createElement('div');
    wrap.className = 'qty';
    wrap.innerHTML = `<button type="button" aria-label="Помалку">−</button><input type="number" inputmode="numeric" value="${value}" min="${min}" max="${max}" aria-label="Количина"><button type="button" aria-label="Повеќе">+</button>`;
    const [minus, input, plus] = wrap.children;
    const set = v => { input.value = Math.max(min, Math.min(max, v | 0)); input.dispatchEvent(new Event('change')); };
    minus.onclick = () => set(+input.value - 1);
    plus.onclick = () => set(+input.value + 1);
    input.onblur = () => set(+input.value);
    wrap.get = () => +input.value;
    wrap.input = input;
    return wrap;
  }

  async function request(url, opt) {
    const r = await fetch(url, opt);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Грешка. Обидете се повторно.');
    return j;
  }
  const postJSON = (url, body) => request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const postForm = (url, fd) => request(url, { method: 'POST', body: fd });

  function lightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<button aria-label="Затвори">${I.close}</button><img src="${esc(src)}" alt="">`;
    const close = () => { lb.remove(); document.removeEventListener('keydown', k); };
    const k = e => { if (e.key === 'Escape') close(); };
    lb.onclick = close;
    document.addEventListener('keydown', k);
    document.body.appendChild(lb);
  }

  // ---------- Состојки и алергени ----------
  const ingredientList = s => String(s.ingredients || '').split(',').map(x => x.trim()).filter(Boolean);
  function allergens(s) {
    const t = ingredientList(s).join(' ').toLowerCase();
    return [/брашно|пченица|глутен/.test(t) && 'глутен (пченично брашно)', /јајц/.test(t) && 'јајца',
            /путер|млеко|павлака|сирење|млечн/.test(t) && 'млечни производи (путер)', /ореви|лешни|бадем|кикирики|јатк/.test(t) && 'јаткасти плодови'].filter(Boolean);
  }
  function ingredientsHtml(s) {
    const list = ingredientList(s);
    if (!list.length) return '';
    const al = allergens(s);
    return `<div class="ingredients">
      <div class="ing-chips">${list.map(x => `<span class="ing">${esc(x[0].toUpperCase() + x.slice(1))}</span>`).join('')}</div>
      ${al.length ? `<p class="ing-allergens">${I.info}<span><b>Алергени:</b> ${al.map(esc).join(', ')}. Ако имате алергија, напишете го тоа во забелешката при нарачката.</span></p>` : ''}
    </div>`;
  }

  const stars = n =>'★'.repeat(n) + '☆'.repeat(5 - n);

  // Порака по успешна нарачка – „ќе ве контактираме“
  function successHtml(title, lines, s) {
    return `<div class="card success-box"><div class="big-ico">${I.check}</div><h2>${title}</h2>${lines}
      <div class="notice" style="max-width:520px;margin:22px auto 26px;text-align:left">${I.phone}<span>Ќе ве контактираме на телефонскиот број што го внесовте за да ја потврдиме нарачката.${s.phone ? ` За прашања можете да не повикате на <b><a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a></b>.` : ''}</span></div>
      <a href="/" class="btn">Назад на почетна</a></div>`;
  }

  const ready = load().then(d => { renderChrome(d); return d; });

  return { load, ready, esc, money, getCart, setCart, addProduct, addPackage, toast, qtyControl, postJSON, postForm, lightbox, stars, socialButtons, socialIcons, safeUrl, successHtml, I, store, ingredientsHtml, allergens };
})();
