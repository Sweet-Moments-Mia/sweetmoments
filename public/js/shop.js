// Приказ на колачиња, пакети и избор на колачиња за пакет
const Shop = (() => {
  const { esc, money, I } = SM;

  function renderProducts(container, products) {
    container.innerHTML = '';
    if (!products.length) { container.innerHTML = '<p class="center muted" style="grid-column:1/-1">Нема колачиња во оваа категорија.</p>'; return; }
    for (const p of products) {
      const designs = (p.designs || []).filter(d => d.name);
      let design = designs[0] || null;
      const card = document.createElement('article');
      card.className = 'card product';
      card.innerHTML = `
        <div class="product-media">${(design?.image || p.image) ? `<img src="${esc(design?.image || p.image)}" alt="${esc(p.name)}" loading="lazy">` : ''}${designs.length > 1 ? `<span class="design-count">${designs.length} дизајни</span>` : ''}</div>
        <div class="product-body">
          <h3>${esc(p.name)}</h3>
          ${designs.length ? `<div class="design-name">Дизајн: <b>${esc(design.name)}</b></div><div class="designs" role="listbox" aria-label="Изберете дизајн">${designs.map((d, i) =>
            `<button type="button" class="design${i === 0 ? ' on' : ''}" data-i="${i}" title="${esc(d.name)}" aria-label="${esc(d.name)}">${d.image ? `<img src="${esc(d.image)}" alt="" loading="lazy">` : esc(d.name[0])}</button>`).join('')}</div>`
            : (p.description ? `<p class="product-desc">${esc(p.description)}</p>` : '')}
          <div class="product-meta"><span class="price">${money(p.price)}</span>${p.size ? `<span class="size">${esc(p.size)}</span>` : ''}</div>
          <div class="product-actions"></div>
        </div>`;
      const media = card.querySelector('.product-media');
      card.querySelectorAll('.design').forEach(b => b.onclick = () => {
        design = designs[+b.dataset.i];
        card.querySelectorAll('.design').forEach(x => x.classList.toggle('on', x === b));
        card.querySelector('.design-name b').textContent = design.name;
        const img = media.querySelector('img'); if (img && design.image) img.src = design.image;
      });
      const q = SM.qtyControl(1, 1, 500);
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm'; btn.innerHTML = `${I.cart} Додади`;
      btn.onclick = () => {
        SM.addProduct(p.id, q.get(), design?.name || '');
        SM.toast(`${p.name}${design ? ' – ' + design.name : ''} × ${q.get()} е додадено во кошничката`);
      };
      card.querySelector('.product-actions').append(q, btn);
      media.onclick = () => { const src = media.querySelector('img')?.src; if (src) SM.lightbox(src); };
      container.appendChild(card);
    }
  }

  function renderPackages(container, d) {
    container.innerHTML = '';
    const featuredIdx = d.packages.length > 2 ? 1 : -1;
    d.packages.forEach((pk, i) => {
      const card = document.createElement('article');
      card.className = 'card package' + (i === featuredIdx ? ' featured' : '');
      card.innerHTML = `
        ${i === featuredIdx ? '<span class="tag">Најбаран</span>' : ''}
        <h3>${esc(pk.name)}</h3>
        <div class="count">${pk.count}</div>
        <div class="count-label">${pk.choose === false ? 'колачиња · мешан избор' : 'колачиња по избор'}</div>
        ${pk.description ? `<p class="desc">${esc(pk.description)}</p>` : ''}
        <div class="price">${money(pk.price)}</div>
        <div class="per">≈ ${money(Math.round(pk.price / pk.count))} по колаче</div>
        <button class="btn ${i === featuredIdx ? '' : 'btn-outline'}">${pk.choose === false ? `${I.cart} Додади во кошничка` : 'Избери колачиња'}</button>`;
      card.querySelector('button').onclick = () => {
        if (pk.choose === false) { SM.addPackage(pk.id); SM.toast(`${pk.name} е додаден во кошничката`); }
        else openPicker(pk, d);
      };
      container.appendChild(card);
    });
  }

  // Модал: корисникот бира кои колачиња ќе бидат во пакетот
  function openPicker(pk, d) {
    const counts = {};
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(pk.name)}">
        <div class="modal-head"><div><h3>${esc(pk.name)}</h3><span class="muted small">Изберете ${pk.count} колачиња – може и повеќе од ист вид</span></div>
          <button class="icon-btn close" aria-label="Затвори">${I.close}</button></div>
        <div class="modal-body"><div class="pick-grid"></div></div>
        <div class="modal-foot">
          <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:200px"><b class="sel-count">0 / ${pk.count}</b><div class="progress"><span style="width:0"></span></div></div>
          <button class="link-btn auto">Случаен микс</button>
          <button class="btn add" disabled>Додади пакет · ${money(pk.price)}</button>
        </div>
      </div>`;
    const grid = bg.querySelector('.pick-grid');
    const controls = {};
    const total = () => Object.values(counts).reduce((a, b) => a + b, 0);
    const refresh = () => {
      const t = total();
      bg.querySelector('.sel-count').textContent = `${t} / ${pk.count}`;
      bg.querySelector('.progress span').style.width = Math.min(100, (t / pk.count) * 100) + '%';
      bg.querySelector('.add').disabled = t !== pk.count;
      for (const id in controls) controls[id].closest('.pick').classList.toggle('sel', counts[id] > 0);
    };
    for (const p of d.products) {
      counts[p.id] = 0;
      const el = document.createElement('div');
      el.className = 'pick';
      el.innerHTML = `${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}<div class="pn">${esc(p.name)}</div>`;
      const q = SM.qtyControl(0, 0, pk.count);
      q.input.addEventListener('change', () => {
        const others = total() - counts[p.id];
        let v = q.get();
        if (others + v > pk.count) { v = pk.count - others; q.input.value = v; }
        counts[p.id] = v; refresh();
      });
      controls[p.id] = q;
      el.appendChild(q); grid.appendChild(el);
    }
    const close = () => { bg.remove(); document.removeEventListener('keydown', esck); };
    const esck = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esck);
    bg.querySelector('.close').onclick = close;
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
    bg.querySelector('.auto').onclick = () => {
      const ids = d.products.map(p => p.id).sort(() => Math.random() - .5);
      for (const id of ids) counts[id] = 0;
      for (let i = 0; i < pk.count; i++) counts[ids[i % ids.length]]++;
      for (const id of ids) controls[id].input.value = counts[id];
      refresh();
    };
    bg.querySelector('.add').onclick = () => {
      const cookies = [];
      for (const id in counts) for (let i = 0; i < counts[id]; i++) cookies.push(id);
      SM.addPackage(pk.id, cookies);
      close();
      SM.toast(`${pk.name} е додаден во кошничката`);
    };
    document.body.appendChild(bg);
  }

  function reviewCard(r) {
    return `<article class="card review">
      <span class="quote">“</span>
      <div class="stars" aria-label="${r.rating} од 5">${SM.stars(r.rating)}</div>
      <p>${esc(r.text)}</p>
      ${r.photo ? `<img src="${esc(r.photo)}" alt="" loading="lazy" onclick="SM.lightbox(this.src)">` : ''}
      <div class="who"><span class="avatar">${esc((r.name || '?').trim()[0].toUpperCase())}</span><div><b>${esc(r.name)}</b><span>${new Date(r.createdAt).toLocaleDateString('mk-MK')}</span></div></div>
    </article>`;
  }

  return { renderProducts, renderPackages, openPicker, reviewCard };
})();
