// Админ панел – Sweet Moments
(() => {
  const { esc, money, toast } = SM;
  const $ = s => document.querySelector(s);
  const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    ...SM.I,
    dash: ic('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    orders: ic('<path d="M6 3h12l1 4H5z"/><path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M9 11h6"/>'),
    cookieI: ic('<path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z"/><circle cx="8.5" cy="10" r=".8" fill="currentColor"/><circle cx="14" cy="15" r=".8" fill="currentColor"/>'),
    pkg: ic('<rect x="3.5" y="9" width="17" height="11" rx="1"/><path d="M2.5 9h19M12 9v11"/><path d="M12 9C10 5 6.5 5 6.5 7S9 9 12 9zM12 9c2-4 5.5-4 5.5-2S15 9 12 9z"/>'),
    image: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-4 4 3 3-2 6 4"/>'),
    star: ic('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
    mailI: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    out: ic('<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>'),
    ext: ic('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    money: ic('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>')
  };
  let D = null;
  let tab = 'dashboard';
  const STATUSES = ['нова', 'потврдена', 'во изработка', 'готова', 'испорачана', 'откажана'];

  async function api(method, url, body) {
    const opt = { method };
    if (body instanceof FormData) opt.body = body;
    else if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body); }
    const r = await fetch(url, opt);
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && !url.includes('/login') && !url.includes('/account')) { showLogin(true); throw new Error('Сесијата истече. Најавете се повторно.'); }
    if (!r.ok) throw new Error(j.error || 'Грешка');
    return j;
  }
  const act = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };
  const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const date = t => { const d = new Date(t); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}. ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const catOptions = sel => `<option value="">— без категорија —</option>` + D.categories.map(c => `<option value="${esc(c.id)}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');

  // ---------- Најава ----------
  async function init() {
    $('#viewSite').innerHTML = `${I.ext} Види ја страната`;
    $('#logout').innerHTML = `${I.out} Одјава`;
    $('#menuBtn').innerHTML = I.menu;
    $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
    const s = await fetch('/api/admin/status').then(r => r.json());
    if (s.loggedIn) return openPanel();
    showLogin(s.setup);
  }
  function showLogin(isSetup) {
    $('#panel').classList.add('hidden');
    $('#login').classList.remove('hidden');
    $('#loginTitle').textContent = isSetup ? 'Добредојдовте' : 'Креирајте админ профил';
    $('#loginHint').textContent = isSetup ? 'Најавете се во административниот панел' : 'Прво стартување – внесете ја вашата е-пошта и изберете лозинка (најмалку 8 знаци). Само вие ќе имате пристап.';
    $('#confirmWrap').classList.toggle('hidden', isSetup);
    $('#loginForm button').textContent = isSetup ? 'Најави се' : 'Креирај профил';
    $('#loginForm').onsubmit = act(async e => {
      e.preventDefault();
      const f = e.target;
      if (!isSetup && f.password.value !== f.confirm.value) throw new Error('Лозинките не се совпаѓаат.');
      await api('POST', isSetup ? '/api/admin/login' : '/api/admin/setup', { email: f.email.value, password: f.password.value });
      f.reset(); openPanel();
    });
  }
  $('#logout').onclick = act(async () => { await api('POST', '/api/admin/logout'); location.reload(); });

  async function openPanel() {
    $('#login').classList.add('hidden'); $('#panel').classList.remove('hidden');
    await reload();
  }
  async function reload() { D = await api('GET', '/api/admin/all'); render(); }

  // ---------- Навигација ----------
  const TABS = [
    ['dashboard', 'Преглед', I.dash, 'Брз преглед на продавницата'],
    ['orders', 'Нарачки', I.orders, 'Сите нарачки и барања за сопствен дизајн', () => D.orders.filter(o => o.status === 'нова').length],
    ['calendar', 'Календар', I.calendar, 'Нарачки по ден – според датумот „потребно до“'],
    ['products', 'Колачиња', I.cookieI, 'Додавајте и уредувајте колачиња, цени и димензии'],
    ['packages', 'Пакети', I.pkg, 'Пакети со број на колачиња и цена'],
    ['gallery', 'Галерија', I.image, 'Слики на страната Галерија'],
    ['reviews', 'Рецензии', I.star, 'Одобрете рецензии пред да се објават', () => D.reviews.filter(r => !r.approved).length],
    ['messages', 'Пораки', I.mailI, 'Пораки од формата за контакт', () => D.messages.filter(m => !m.read).length],
    ['settings', 'Содржина и поставки', I.gear, 'Текстови, контакт, социјални мрежи, лого'],
    ['account', 'Мој профил', I.user, 'Е-пошта за најава и известувања, лозинка'],
  ];
  function render() {
    const nav = $('#tabs'); nav.innerHTML = '';
    for (const [id, label, icon, , badge] of TABS) {
      const n = badge ? badge() : 0;
      const b = h(`<button class="nav-item ${tab === id ? 'active' : ''}">${icon}<span>${esc(label)}</span>${n ? `<span class="badge">${n}</span>` : ''}</button>`);
      b.onclick = () => { tab = id; $('#side').classList.remove('open'); render(); scrollTo(0, 0); };
      nav.appendChild(b);
    }
    const t = TABS.find(x => x[0] === tab);
    $('#viewTitle').textContent = t[1]; $('#viewSub').textContent = t[3];
    $('#viewActions').innerHTML = '';
    const v = $('#view'); v.innerHTML = '';
    ({ dashboard, orders, calendar, products, packages, gallery, reviews, messages, settings, account })[tab](v);
  }
  const go = id => { tab = id; render(); };

  // ---------- Преглед ----------
  function dashboard(v) {
    const newO = D.orders.filter(o => o.status === 'нова');
    const active = D.orders.filter(o => !['испорачана', 'откажана'].includes(o.status));
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    const revenue = D.orders.filter(o => o.createdAt >= month && o.status !== 'откажана').reduce((s, o) => s + (o.total || 0), 0);
    v.appendChild(h(`<div class="stats">
      <div class="card stat"><span class="ico-wrap">${I.orders}</span><div><b>${newO.length}</b><span>Нови нарачки</span></div></div>
      <div class="card stat"><span class="ico-wrap">${I.box}</span><div><b>${active.length}</b><span>Активни нарачки</span></div></div>
      <div class="card stat"><span class="ico-wrap">${I.money}</span><div><b>${money(revenue)}</b><span>Овој месец</span></div></div>
      <div class="card stat"><span class="ico-wrap">${I.star}</span><div><b>${D.reviews.filter(r => !r.approved).length}</b><span>Рецензии за одобрување</span></div></div>
    </div>`));
    if (!D.account.mailEnabled) v.appendChild(h(`<div class="notice" style="margin-bottom:22px">${I.info}<span>Известувањата по е-пошта за нови нарачки сè уште не се активирани. Видете <b>Мој профил</b> за упатство.</span></div>`));
    // Денес и утре – според датумот „потребно до“
    const t0 = new Date(), t1 = new Date(); t1.setDate(t1.getDate() + 1);
    const dueBox = h(`<div class="card card-pad" style="margin-bottom:22px"><div class="order-head" style="margin-bottom:12px"><h3 style="margin:0">Потребни денес и утре</h3><button class="btn btn-sm btn-outline">Отвори календар</button></div><div class="due"></div></div>`);
    dueBox.querySelector('button').onclick = () => { cal.month = null; cal.day = null; go('calendar'); };
    const due = dueBox.querySelector('.due');
    for (const [label, d] of [['Денес', t0], ['Утре', t1]]) {
      const key = isoDay(d);
      const list = D.orders.filter(o => o.customer?.date === key && o.status !== 'откажана');
      const col = h(`<div class="due-col"><p class="panel-title" style="margin:0 0 8px">${label} · ${esc(fmtDay(key))}</p></div>`);
      if (!list.length) col.appendChild(h('<p class="muted small" style="margin:0">Нема нарачки.</p>'));
      for (const o of list) {
        const r = h(`<div class="due-row"><span><b>#${o.number}</b> ${esc(o.customer.name)} · <a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a></span><span class="actions"><span class="muted small">${o.cookieCount || o.quantity || 0} кол.</span><span class="pill ${esc(o.status)}">${esc(o.status)}</span></span></div>`);
        r.onclick = e => { if (e.target.tagName !== 'A') { cal.month = new Date(d.getFullYear(), d.getMonth(), 1); cal.day = key; go('calendar'); } };
        col.appendChild(r);
      }
      due.appendChild(col);
    }
    v.appendChild(dueBox);

    const box = h(`<div class="card card-pad"><div class="order-head" style="margin-bottom:12px"><h3 style="margin:0">Последни нарачки</h3><button class="btn btn-sm btn-outline">Сите нарачки</button></div><div class="rows"></div></div>`);
    box.querySelector('button').onclick = () => go('orders');
    const rows = box.querySelector('.rows');
    const last = [...D.orders].reverse().slice(0, 6);
    if (!last.length) rows.innerHTML = '<div class="empty-state">Сè уште нема нарачки.</div>';
    for (const o of last) {
      const r = h(`<div class="order-head" style="padding:12px 0;border-bottom:1px solid var(--line);cursor:pointer">
        <div><b>#${o.number}</b> · ${esc(o.customer.name)} · <a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a></div>
        <div class="actions"><span class="pill kind">${o.kind === 'custom' ? 'Сопствен дизајн' : 'Кошничка'}</span><span class="pill ${esc(o.status)}">${esc(o.status)}</span><b>${o.total != null ? money(o.total) : '—'}</b></div></div>`);
      r.onclick = e => { if (e.target.tagName !== 'A') go('orders'); };
      rows.appendChild(r);
    }
    v.appendChild(box);
  }

  // ---------- Нарачки ----------
  const tally = arr => Object.entries(arr.reduce((m, n) => (m[n] = (m[n] || 0) + 1, m), {})).map(([n, c]) => `${n} × ${c}`).join(', ');
  // Датум „потребно до“ (YYYY-MM-DD) → „18 дек. 2026“
  // (не сите прелистувачи имаат македонски имиња на месеци – затоа рачно)
  const MONTHS = ['јануари', 'февруари', 'март', 'април', 'мај', 'јуни', 'јули', 'август', 'септември', 'октомври', 'ноември', 'декември'];
  const DAYS = ['недела', 'понеделник', 'вторник', 'среда', 'четврток', 'петок', 'сабота'];
  const fmtDay = (s, withDay) => {
    const [y, m, d] = String(s || '').split('-').map(Number);
    if (!y) return '—';
    const wd = DAYS[new Date(y, m - 1, d).getDay()];
    return `${withDay ? wd + ', ' : ''}${d} ${MONTHS[m - 1]} ${y}`;
  };
  const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function orders(v) {
    let filter = '';
    const sel = h(`<select><option value="">Сите статуси</option>${STATUSES.map(s => `<option>${s}</option>`).join('')}</select>`);
    sel.onchange = () => { filter = sel.value; draw(); };
    $('#viewActions').appendChild(sel);
    const rows = h('<div class="rows"></div>');
    v.appendChild(rows);
    function draw() {
      rows.innerHTML = '';
      const list = [...D.orders].reverse().filter(o => !filter || o.status === filter);
      if (!list.length) rows.innerHTML = '<div class="card empty-state">Нема нарачки.</div>';
      for (const o of list) rows.appendChild(orderCard(o));
    }
    draw();
  }

  // ---------- Календар ----------
  const cal = { month: null, day: null, hideCancelled: true };
  function calendar(v) {
    const today = isoDay(new Date());
    if (!cal.month) { const n = new Date(); cal.month = new Date(n.getFullYear(), n.getMonth(), 1); }
    if (!cal.day) cal.day = today;
    const shown = o => !(cal.hideCancelled && o.status === 'откажана');
    const byDay = {};
    for (const o of D.orders) if (o.customer?.date && shown(o)) (byDay[o.customer.date] ||= []).push(o);
    const noDate = D.orders.filter(o => !o.customer?.date && shown(o) && !['испорачана', 'откажана'].includes(o.status));

    const head = h(`<div class="cal-head card">
      <button class="icon-btn prev" aria-label="Претходен месец">‹</button>
      <b class="cal-title"></b>
      <button class="icon-btn next" aria-label="Следен месец">›</button>
      <button class="btn btn-sm btn-outline today">Денес</button>
      <label class="toggle small" style="margin-left:auto"><input type="checkbox" class="hc" ${cal.hideCancelled ? 'checked' : ''}> Скриј откажани</label>
    </div>`);
    const m = cal.month;
    head.querySelector('.cal-title').textContent = `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
    head.querySelector('.prev').onclick = () => { cal.month = new Date(m.getFullYear(), m.getMonth() - 1, 1); render(); };
    head.querySelector('.next').onclick = () => { cal.month = new Date(m.getFullYear(), m.getMonth() + 1, 1); render(); };
    head.querySelector('.today').onclick = () => { const n = new Date(); cal.month = new Date(n.getFullYear(), n.getMonth(), 1); cal.day = today; render(); };
    head.querySelector('.hc').onchange = e => { cal.hideCancelled = e.target.checked; render(); };
    v.appendChild(head);

    const grid = h(`<div class="cal-grid card">${['Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб', 'Нед'].map(d => `<div class="cal-dow">${d}</div>`).join('')}</div>`);
    const startPad = (m.getDay() + 6) % 7; // понеделник прв
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    for (let i = 0; i < startPad; i++) grid.appendChild(h('<div class="cal-cell empty"></div>'));
    for (let d = 1; d <= days; d++) {
      const key = isoDay(new Date(m.getFullYear(), m.getMonth(), d));
      const list = (byDay[key] || []).sort((a, b) => a.number - b.number);
      const cookies = list.reduce((s, o) => s + (o.cookieCount || o.quantity || 0), 0);
      const cell = h(`<button class="cal-cell${key === today ? ' is-today' : ''}${key === cal.day ? ' is-sel' : ''}${list.length ? ' has' : ''}">
        <span class="cal-num">${d}</span>
        ${list.length ? `<span class="cal-count">${list.length} ${list.length === 1 ? 'нарачка' : 'нарачки'}<small>${cookies} кол.</small></span>` : ''}
        <span class="cal-chips">${list.slice(0, 3).map(o => `<span class="chip-o pill ${esc(o.status)}">#${o.number} ${esc(o.customer.name.split(' ')[0])}</span>`).join('')}${list.length > 3 ? `<span class="more">+${list.length - 3}</span>` : ''}</span>
      </button>`);
      cell.onclick = () => { cal.day = key; render(); document.getElementById('calDay')?.scrollIntoView({ behavior: 'smooth' }); };
      grid.appendChild(cell);
    }
    v.appendChild(grid);

    const sel = (byDay[cal.day] || []).sort((a, b) => a.number - b.number);
    const dayBox = h(`<div id="calDay" style="margin-top:22px"><h2 style="font-size:1.7rem;margin:0 0 4px;text-transform:capitalize">${esc(fmtDay(cal.day, true))}${cal.day === today ? ' · денес' : ''}</h2>
      <p class="muted small" style="margin:0 0 14px">${sel.length ? `${sel.length} ${sel.length === 1 ? 'нарачка' : 'нарачки'} · ${sel.reduce((s, o) => s + (o.cookieCount || o.quantity || 0), 0)} колачиња` : 'Нема нарачки за овој ден.'}</p><div class="rows"></div></div>`);
    sel.forEach(o => dayBox.querySelector('.rows').appendChild(orderCard(o)));
    v.appendChild(dayBox);

    if (noDate.length) {
      const nd = h(`<details class="card card-pad" style="margin-top:22px"><summary><b>Нарачки без датум (${noDate.length})</b> <span class="muted small">– купувачот не внел датум, договорете по телефон</span></summary><div class="rows" style="margin-top:14px"></div></details>`);
      noDate.forEach(o => nd.querySelector('.rows').appendChild(orderCard(o)));
      v.appendChild(nd);
    }
  }

  // Картичка за една нарачка (се користи во Нарачки и Календар)
  function orderCard(o) {
        const c = o.customer;
        const body = o.kind === 'custom'
          ? `<div><p style="margin:0 0 6px"><b>${esc(o.occasion)}</b> · <b>${o.quantity} колачиња</b></p>
             <p style="margin:0;white-space:pre-wrap">${esc(o.design)}</p>
             ${o.cookieText ? `<p style="margin:8px 0 0">Текст на колачињата: <b>${esc(o.cookieText)}</b></p>` : ''}</div>
             ${o.images?.length ? `<div class="order-imgs">${o.images.map(i => `<img src="${esc(i)}" alt="">`).join('')}</div>` : ''}`
          : `<table class="lines">${o.lines.map(l => `<tr><td>${esc(l.name)}${l.design ? ` – <b>${esc(l.design)}</b>` : ''}${l.size ? ` <span class="muted">(${esc(l.size)})</span>` : ''}${l.cookies ? `<br><span class="muted small">${esc(tally(l.cookies))}</span>` : ''}${l.mixed ? '<br><span class="muted small">Мешан – дизајните ги бираш ти</span>' : ''}</td><td style="white-space:nowrap">× ${l.qty}</td><td style="text-align:right;white-space:nowrap">${money(l.sum)}</td></tr>`).join('')}
             ${o.discount ? `<tr><td>Попуст ${o.discountPct}% (сами избрани)</td><td></td><td style="text-align:right">−${money(o.discount)}</td></tr>` : ''}
             ${o.wrapFee ? `<tr><td>Поединечно пакување</td><td></td><td style="text-align:right">${money(o.wrapFee)}</td></tr>` : ''}
             <tr><td><b>Вкупно</b> <span class="muted small">(${o.cookieCount} колачиња)</span></td><td></td><td style="text-align:right"><b>${money(o.total)}</b></td></tr></table>`;
        const card = h(`<div class="card row-card">
          <div class="order-head">
            <div class="actions"><span class="order-no">#${o.number}</span><span class="pill kind">${o.kind === 'custom' ? 'Сопствен дизајн' : 'Кошничка'}</span><span class="pill ${esc(o.status)}">${esc(o.status)}</span><span class="muted small">${date(o.createdAt)}</span></div>
            <div class="actions"><select class="st">${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn btn-sm btn-ghost del danger">Избриши</button></div>
          </div>
          <div class="info-cols">
            <div><small>Клиент</small><b>${esc(c.name)}</b><br><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>${c.email ? `<br><a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}</div>
            <div><small>Преземање</small>${c.delivery === 'delivery' ? 'Достава' : 'Лично подигање'}${c.address ? `<br>${esc(c.address)}` : ''}</div>
            <div><small>Потребно до</small>${c.date ? `<b>${esc(fmtDay(c.date))}</b>` : '—'}</div>
            <div><small>Пакување</small>${o.packing === 'individual' ? 'Секое посебно' : 'Заедно во кутија'}</div>
          </div>
          ${body}
          ${c.note ? `<div class="notice">${I.info}<span style="white-space:pre-wrap">${esc(c.note)}</span></div>` : ''}
          ${o.kind === 'custom' ? `<div class="actions"><label class="toggle">Договорена цена <input class="price" type="number" min="0" style="width:140px" value="${o.total ?? ''}"></label><button class="btn btn-sm save">Зачувај цена</button></div>` : ''}
        </div>`);
        card.querySelector('.st').onchange = act(async e => { Object.assign(o, await api('PUT', `/api/admin/orders/${o.id}`, { status: e.target.value })); render(); });
        card.querySelector('.del').onclick = act(async () => {
          if (!confirm(`Да се избрише нарачка #${o.number}? Ова не може да се врати.`)) return;
          await api('DELETE', `/api/admin/orders/${o.id}`); D.orders = D.orders.filter(x => x !== o); render();
        });
        card.querySelector('.save')?.addEventListener('click', act(async () => { Object.assign(o, await api('PUT', `/api/admin/orders/${o.id}`, { total: card.querySelector('.price').value })); toast('Цената е зачувана'); }));
        card.querySelectorAll('.order-imgs img').forEach(i => i.onclick = () => SM.lightbox(i.src));
        return card;
  }

  // ---------- Колачиња ----------
  function productForm(p) {
    const isNew = !p;
    p = p || { name: '', price: '', size: '', category: '', description: '', image: '', active: true };
    const el = h(`<form class="card row-card">
      ${isNew ? '<p class="panel-title">Ново колаче</p>' : ''}
      <div class="edit-grid">
        <label class="thumb-pick">${p.image ? `<img class="thumb" src="${esc(p.image)}" alt="">` : `<div class="thumb">${I.upload}</div>`}
          <input type="file" name="image" accept="image/*" class="hidden">${p.image ? 'Промени слика' : 'Додади слика'}</label>
        <div class="fields">
          <label>Име<input name="name" value="${esc(p.name)}" required></label>
          <label>Цена (${esc(D.settings.currency)})<input name="price" type="number" min="0" value="${esc(p.price)}" required></label>
          <label>Димензии<input name="size" value="${esc(p.size)}" placeholder="на пр. Ø 8 cm"></label>
          <label>Категорија<select name="category">${catOptions(p.category)}</select></label>
          <label class="wide">Опис <small>(опционално)</small><input name="description" value="${esc(p.description)}"></label>
        </div>
      </div>
      <div class="order-head"><label class="toggle"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> Видливо на страната</label>
        <div class="actions">${isNew ? '' : '<button type="button" class="btn btn-sm btn-ghost del danger">Избриши</button>'}<button class="btn btn-sm">${isNew ? 'Додади колаче' : 'Зачувај'}</button></div></div>
      ${isNew ? '' : `<details class="designs-admin" ${(p.designs || []).length ? 'open' : ''}>
        <summary><b>Дизајни</b> <span class="muted small">(${(p.designs || []).length}) – ако додадете дизајни, купувачот бира еден при нарачка</span></summary>
        <div class="d-list"></div>
        <div class="d-add"><input class="d-name" placeholder="Име на нов дизајн (на пр. Снегулка)"><input class="d-file" type="file" accept="image/*"><button type="button" class="btn btn-sm btn-outline d-btn">Додади дизајн</button></div>
      </details>`}
    </form>`);
    if (!isNew) {
      const list = el.querySelector('.d-list');
      for (const d of p.designs || []) {
        const row = h(`<div class="d-row">${d.image ? `<img src="${esc(d.image)}" alt="">` : '<span class="d-ph"></span>'}<input value="${esc(d.name)}"><label class="btn btn-sm btn-ghost" style="cursor:pointer">Слика<input type="file" accept="image/*" class="hidden"></label><button type="button" class="btn btn-sm btn-ghost save">Зачувај</button><button type="button" class="btn btn-sm btn-ghost danger del">Избриши</button></div>`);
        const f = row.querySelector('input[type=file]');
        row.querySelector('.save').onclick = act(async () => {
          const fd = new FormData(); fd.set('name', row.querySelector('input:not([type])').value);
          if (f.files[0]) fd.set('image', f.files[0]);
          await api('PUT', `/api/admin/products/${p.id}/designs/${d.id}`, fd); toast('Дизајнот е зачуван'); await reload();
        });
        f.onchange = () => row.querySelector('.save').click();
        row.querySelector('.del').onclick = act(async () => {
          if (!confirm(`Да се избрише дизајнот „${d.name}“?`)) return;
          await api('DELETE', `/api/admin/products/${p.id}/designs/${d.id}`); await reload();
        });
        list.appendChild(row);
      }
      el.querySelector('.d-btn').onclick = act(async () => {
        const fd = new FormData(); fd.set('name', el.querySelector('.d-name').value);
        const df = el.querySelector('.d-file').files[0]; if (df) fd.set('image', df);
        await api('POST', `/api/admin/products/${p.id}/designs`, fd); toast('Дизајнот е додаден'); await reload();
      });
    }
    const file = el.querySelector('[name=image]');
    file.onchange = () => { const f = file.files[0]; if (f) el.querySelector('.thumb').outerHTML = `<img class="thumb" src="${URL.createObjectURL(f)}">`; };
    el.onsubmit = act(async e => {
      e.preventDefault();
      const fd = new FormData(el);
      fd.set('active', el.active.checked);
      if (!file.files.length) fd.delete('image');
      if (isNew) await api('POST', '/api/admin/products', fd); else await api('PUT', `/api/admin/products/${p.id}`, fd);
      toast('Зачувано'); await reload();
    });
    el.querySelector('.del')?.addEventListener('click', act(async () => {
      if (!confirm(`Да се избрише „${p.name}“?`)) return;
      await api('DELETE', `/api/admin/products/${p.id}`); await reload();
    }));
    return el;
  }
  function products(v) {
    const rows = h('<div class="rows"></div>');
    rows.appendChild(productForm(null));
    D.products.forEach(p => rows.appendChild(productForm(p)));
    v.appendChild(rows);
  }

  // ---------- Пакети ----------
  function packageForm(p) {
    const isNew = !p;
    p = p || { name: '', count: 6, price: '', description: '', active: true, choose: false };
    const el = h(`<form class="card row-card">
      ${isNew ? '<p class="panel-title">Нов пакет</p>' : ''}
      <div class="fields">
        <label>Име на пакет<input name="name" value="${esc(p.name)}" required></label>
        <label>Број на колачиња<input name="count" type="number" min="1" value="${esc(p.count)}" required></label>
        <label>Цена (${esc(D.settings.currency)})<input name="price" type="number" min="0" value="${esc(p.price)}" required></label>
        <label class="wide">Опис<input name="description" value="${esc(p.description)}"></label>
      </div>
      <div class="order-head"><div class="actions"><label class="toggle"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> Видливо на страната</label>
        <label class="toggle"><input type="checkbox" name="choose" ${p.choose !== false ? 'checked' : ''}> Купувачот сам ги бира колачињата</label></div>
        <div class="actions">${isNew ? '' : '<button type="button" class="btn btn-sm btn-ghost del danger">Избриши</button>'}<button class="btn btn-sm">${isNew ? 'Додади пакет' : 'Зачувај'}</button></div></div>
    </form>`);
    el.onsubmit = act(async e => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(el)); body.active = el.active.checked; body.choose = el.choose.checked;
      if (isNew) await api('POST', '/api/admin/packages', body); else await api('PUT', `/api/admin/packages/${p.id}`, body);
      toast('Зачувано'); await reload();
    });
    el.querySelector('.del')?.addEventListener('click', act(async () => {
      if (!confirm(`Да се избрише „${p.name}“?`)) return;
      await api('DELETE', `/api/admin/packages/${p.id}`); await reload();
    }));
    return el;
  }
  function packages(v) {
    const rows = h('<div class="rows"></div>');
    rows.appendChild(packageForm(null));
    D.packages.forEach(p => rows.appendChild(packageForm(p)));
    v.appendChild(rows);
  }

  // ---------- Галерија ----------
  function gallery(v) {
    const up = h(`<form class="card row-card"><p class="panel-title">Додади слики</p>
      <div class="fields"><label>Слики <small>(до 5 одеднаш)</small><input type="file" name="images" accept="image/*" multiple required></label>
      <label>Опис <small>(опционално)</small><input name="caption"></label><label>Категорија<select name="category">${catOptions('')}</select></label></div>
      <div class="actions"><button class="btn btn-sm">${I.upload} Прикачи</button></div></form>`);
    up.onsubmit = act(async e => { e.preventDefault(); await api('POST', '/api/admin/gallery', new FormData(up)); toast('Сликите се прикачени'); await reload(); });
    v.appendChild(up);
    const grid = h('<div class="gal-admin" style="margin-top:20px"></div>');
    for (const g of [...D.gallery].sort((a, b) => b.createdAt - a.createdAt)) {
      const c = h(`<div class="card"><img src="${esc(g.image)}" alt=""><div class="p">
        <input class="cap" placeholder="Опис" value="${esc(g.caption)}"><select class="cat">${catOptions(g.category)}</select>
        <div class="actions"><button class="btn btn-sm save">Зачувај</button><button class="btn btn-sm btn-ghost del danger">Избриши</button></div></div></div>`);
      c.querySelector('.save').onclick = act(async () => { await api('PUT', `/api/admin/gallery/${g.id}`, { caption: c.querySelector('.cap').value, category: c.querySelector('.cat').value }); toast('Зачувано'); });
      c.querySelector('.del').onclick = act(async () => { if (!confirm('Да се избрише сликата?')) return; await api('DELETE', `/api/admin/gallery/${g.id}`); await reload(); });
      grid.appendChild(c);
    }
    v.appendChild(grid);
  }

  // ---------- Рецензии ----------
  function reviews(v) {
    const rows = h('<div class="rows"></div>');
    const list = [...D.reviews].sort((a, b) => (a.approved - b.approved) || (b.createdAt - a.createdAt));
    if (!list.length) rows.innerHTML = '<div class="card empty-state">Нема рецензии.</div>';
    for (const r of list) {
      const c = h(`<div class="card row-card">
        <div class="order-head"><div class="actions"><b>${esc(r.name)}</b><span class="stars">${SM.stars(r.rating)}</span><span class="pill ${r.approved ? 'ok' : 'pending'}">${r.approved ? 'објавена' : 'чека одобрување'}</span></div><span class="muted small">${date(r.createdAt)}</span></div>
        <p style="margin:0;white-space:pre-wrap">${esc(r.text)}</p>
        ${r.photo ? `<div class="order-imgs"><img src="${esc(r.photo)}" alt=""></div>` : ''}
        <div class="actions"><button class="btn btn-sm ${r.approved ? 'btn-outline' : ''} tog">${r.approved ? 'Скриј од страната' : 'Одобри и објави'}</button><button class="btn btn-sm btn-ghost del danger">Избриши</button></div></div>`);
      c.querySelector('.tog').onclick = act(async () => { await api('PUT', `/api/admin/reviews/${r.id}`, { approved: !r.approved }); await reload(); });
      c.querySelector('.del').onclick = act(async () => { if (!confirm('Да се избрише рецензијата?')) return; await api('DELETE', `/api/admin/reviews/${r.id}`); await reload(); });
      c.querySelector('.order-imgs img')?.addEventListener('click', e => SM.lightbox(e.target.src));
      rows.appendChild(c);
    }
    v.appendChild(rows);
  }

  // ---------- Пораки ----------
  function messages(v) {
    const rows = h('<div class="rows"></div>');
    if (!D.messages.length) rows.innerHTML = '<div class="card empty-state">Нема пораки.</div>';
    for (const m of [...D.messages].reverse()) {
      const c = h(`<div class="card row-card" style="${m.read ? 'opacity:.72' : ''}">
        <div class="order-head"><div class="actions"><b>${esc(m.name)}</b><span class="muted">${esc(m.contact)}</span>${m.read ? '' : '<span class="pill pending">нова</span>'}</div><span class="muted small">${date(m.createdAt)}</span></div>
        <p style="margin:0;white-space:pre-wrap">${esc(m.text)}</p>
        <div class="actions"><button class="btn btn-sm btn-outline tog">${m.read ? 'Означи како непрочитана' : 'Означи како прочитана'}</button><button class="btn btn-sm btn-ghost del danger">Избриши</button></div></div>`);
      c.querySelector('.tog').onclick = act(async () => { await api('PUT', `/api/admin/messages/${m.id}`, { read: !m.read }); await reload(); });
      c.querySelector('.del').onclick = act(async () => { if (!confirm('Да се избрише пораката?')) return; await api('DELETE', `/api/admin/messages/${m.id}`); await reload(); });
      rows.appendChild(c);
    }
    v.appendChild(rows);
  }

  // ---------- Содржина и поставки ----------
  function settings(v) {
    const s = D.settings;
    const f = h(`<form class="rows">
      <div class="card card-pad form"><p class="panel-title" style="margin:0">Текстови на страната</p>
        <div class="form-row"><label>Слоган (МК)<input name="sloganMk" value="${esc(s.sloganMk)}"></label><label>Слоган (EN)<input name="sloganEn" value="${esc(s.sloganEn)}"></label></div>
        <label>Текст на почетната страна<textarea name="heroText">${esc(s.heroText)}</textarea></label>
        <label>За нас <small>(страна Контакт)</small><textarea name="about">${esc(s.about)}</textarea></label>
        <label>Лента со најава на врвот <small>(празно = скриена)</small><input name="announcement" value="${esc(s.announcement)}"></label>
        <label>Рок за нарачка / достава<textarea name="deliveryInfo" style="min-height:80px">${esc(s.deliveryInfo)}</textarea></label>
        <label>Состојки <small>(одделени со запирка – се прикажуваат на почетна, во продавницата и во условите)</small><textarea name="ingredients" style="min-height:70px">${esc(s.ingredients || '')}</textarea></label>
      </div>
      <div class="card card-pad form"><p class="panel-title" style="margin:0">Контакт што го гледаат купувачите</p>
        <div class="form-row"><label>Телефон <small>(на кој ве повикуваат)</small><input name="phone" value="${esc(s.phone)}" placeholder="07X XXX XXX"></label><label>Е-пошта <small>(јавна, опционално)</small><input name="email" type="email" value="${esc(s.email)}"></label></div>
        <label>Град / адреса <small>(опционално)</small><input name="address" value="${esc(s.address)}"></label>
        <div class="form-row"><label>Instagram линк <small>(празно = скриено)</small><input name="instagram" value="${esc(s.instagram)}" placeholder="https://instagram.com/..."></label><label>Facebook линк <small>(празно = скриено)</small><input name="facebook" value="${esc(s.facebook)}" placeholder="https://facebook.com/..."></label></div>
      </div>
      <div class="card card-pad form"><p class="panel-title" style="margin:0">Нарачки</p>
        <div class="form-row"><label>Доплата за поединечно пакување <small>(по колаче)</small><input name="individualWrapPrice" type="number" min="0" value="${esc(s.individualWrapPrice)}"></label><label>Валута<input name="currency" value="${esc(s.currency)}"></label></div>
        <label>Белешка за цените <small>(се прикажува над колачињата)</small><input name="priceNote" value="${esc(s.priceNote || '')}"></label>
        <p class="muted small" style="margin:0">Попуст кога купувачот сам избира ТОЧНО толку колачиња и се спакувани заедно во кутија (не важи за поединечно пакување и за мешаните пакети):</p>
        <div class="form-row">
          <label>Точно колку колачиња <small>(1. попуст)</small><input name="disc1Min" type="number" min="0" value="${esc(s.discounts?.[0]?.min ?? '')}"></label>
          <label>Попуст % <small>(1. попуст)</small><input name="disc1Pct" type="number" min="0" max="90" value="${esc(s.discounts?.[0]?.pct ?? '')}"></label>
        </div>
        <div class="form-row">
          <label>Точно колку колачиња <small>(2. попуст)</small><input name="disc2Min" type="number" min="0" value="${esc(s.discounts?.[1]?.min ?? '')}"></label>
          <label>Попуст % <small>(2. попуст)</small><input name="disc2Pct" type="number" min="0" max="90" value="${esc(s.discounts?.[1]?.pct ?? '')}"></label>
        </div>
      </div>
      <div class="card card-pad form"><p class="panel-title" style="margin:0">Лого</p>
        <div class="actions"><img src="${esc(s.logo || '/images/logo.svg')}" style="height:70px;background:#fff;border-radius:10px;padding:8px;border:1px solid var(--line)" alt="">
        ${s.logo ? '<label class="toggle"><input type="checkbox" name="removeLogo"> Врати го оригиналното лого</label>' : '<span class="muted small">Оригинално Sweet Moments лого</span>'}</div>
        <label>Ново лого <small>(опционално)</small><input type="file" name="logo" accept="image/*"></label>
      </div>
      <div><button class="btn">Зачувај ги промените</button></div>
    </form>`);
    f.onsubmit = act(async e => {
      e.preventDefault();
      const fd = new FormData(f);
      if (!f.logo.files.length) fd.delete('logo');
      fd.set('removeLogo', !!f.removeLogo?.checked);
      const r = await fetch('/api/admin/settings', { method: 'PUT', body: fd });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Грешка');
      toast('Промените се зачувани'); await reload();
    });
    v.appendChild(f);

    const cats = h(`<div class="card card-pad form" style="margin-top:14px"><p class="panel-title" style="margin:0">Категории / прилики</p><div class="rows" style="gap:10px"></div>
      <form class="actions"><input name="name" placeholder="Нова категорија (на пр. Велигден)" required style="max-width:320px"><button class="btn btn-sm">Додади</button></form></div>`);
    const cr = cats.querySelector('.rows');
    for (const c of D.categories) {
      const row = h(`<div class="actions"><input value="${esc(c.name)}" style="max-width:320px"><button class="btn btn-sm btn-outline save">Зачувај</button><button class="btn btn-sm btn-ghost del danger">Избриши</button></div>`);
      row.querySelector('.save').onclick = act(async () => { await api('PUT', `/api/admin/categories/${c.id}`, { name: row.querySelector('input').value }); toast('Зачувано'); await reload(); });
      row.querySelector('.del').onclick = act(async () => { if (!confirm(`Да се избрише „${c.name}“?`)) return; await api('DELETE', `/api/admin/categories/${c.id}`); await reload(); });
      cr.appendChild(row);
    }
    cats.querySelector('form').onsubmit = act(async e => { e.preventDefault(); await api('POST', '/api/admin/categories', { name: e.target.name.value }); await reload(); });
    v.appendChild(cats);
  }

  // ---------- Мој профил ----------
  function account(v) {
    const a = D.account;
    const f = h(`<form class="card card-pad form" style="max-width:640px">
      <p class="panel-title" style="margin:0">Податоци за најава</p>
      <label>Е-пошта за најава<input name="email" type="email" value="${esc(a.email)}" required autocomplete="username"></label>
      <div class="form-row"><label>Нова лозинка <small>(празно = без промена)</small><input name="password" type="password" minlength="8" autocomplete="new-password"></label><label>Повтори нова лозинка<input name="confirm" type="password" autocomplete="new-password"></label></div>
      <label>Тековна лозинка * <small>(за потврда)</small><input name="current" type="password" required autocomplete="current-password"></label>
      <div><button class="btn btn-sm">Зачувај профил</button></div>
    </form>`);
    f.onsubmit = act(async e => {
      e.preventDefault();
      if (f.password.value && f.password.value !== f.confirm.value) throw new Error('Новите лозинки не се совпаѓаат.');
      await api('POST', '/api/admin/account', { email: f.email.value, password: f.password.value, current: f.current.value });
      toast('Профилот е ажуриран'); await reload();
    });
    v.appendChild(f);

    const n = h(`<form class="card card-pad form" style="max-width:640px;margin-top:14px">
      <p class="panel-title" style="margin:0">Известувања за нови нарачки</p>
      <div class="notice">${a.mailEnabled ? I.check : I.info}<span>${a.mailEnabled
        ? 'Испраќањето е-пошта е <b>активно</b>. За секоја нова нарачка, барање или порака ќе добиете е-пошта.'
        : 'Испраќањето е-пошта <b>сè уште не е активирано</b>. Потребен е клуч од Brevo (<code>BREVO_API_KEY</code>) во Render → Environment.'}</span></div>
      <label>Е-пошта за нарачки <small>(празно = иста како е-поштата за најава: ${esc(a.email)})</small><input name="orderEmail" type="email" value="${esc(D.settings.orderEmail || '')}"></label>
      <div class="actions"><button class="btn btn-sm">Зачувај</button>${a.mailEnabled ? '<button type="button" class="btn btn-sm btn-outline test">Испрати тест мејл</button>' : ''}</div>
    </form>`);
    n.querySelector('.test')?.addEventListener('click', act(async () => {
      const r = await api('POST', '/api/admin/test-email');
      toast('Тест мејлот е испратен на ' + r.to + ' (провери и Spam)');
    }));
    n.onsubmit = act(async e => {
      e.preventDefault();
      const fd = new FormData(); fd.set('orderEmail', n.orderEmail.value);
      const r = await fetch('/api/admin/settings', { method: 'PUT', body: fd });
      if (!r.ok) throw new Error('Грешка');
      toast('Зачувано'); await reload();
    });
    v.appendChild(n);
  }

  SM.ready.then(init);
})();
