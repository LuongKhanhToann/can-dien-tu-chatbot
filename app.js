// ── Cân Điện Tử Đại Tín — tư vấn & báo giá (frontend, giao diện Messenger) ──
(() => {
  const $ = (s) => document.querySelector(s);
  const chat = $('#chat');
  const form = $('#form');
  const input = $('#input');
  const sendBtn = $('#send');
  const chipsEl = $('#chips');
  const fileEl = $('#file');
  const attachBtn = $('#attach');
  const previewEl = $('#attachPreview');
  const previewImg = $('#attachImg');
  const previewClear = $('#attachClear');

  const LS_KEY = 'dt_chat_endpoint';
  const CATS = window.CATEGORIES_DATA || {};

  function endpoint() {
    const saved = localStorage.getItem(LS_KEY);
    const configured = (window.CHAT_ENDPOINT || '').trim();
    return (saved || configured || '').replace(/\/+$/, '');
  }

  const history = [];

  const SUGGESTIONS = [
    'Bên em có những loại cân nào?',
    'Cân tính tiền bán thịt giá bao nhiêu?',
    'Mình cần cân hàng kho tới 100kg',
    'Cân heo 500kg còn hàng không?',
  ];

  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  function todayISO() {
    const d = new Date();
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  }

  // ── Render helpers ──
  function scrollDown() {
    requestAnimationFrame(() => {
      chat.scrollTop = chat.scrollHeight;
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function formatText(t) {
    return (t || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  function pageAvatar() {
    return el('div', 'avatar',
      '<svg viewBox="0 0 48 48" width="16" height="16"><path d="M24 12 L32 29 H16 Z" fill="none" stroke="#fff" stroke-width="2.8" stroke-linejoin="round"/><rect x="11" y="29" width="26" height="4.5" rx="1.4" fill="#fff"/></svg>');
  }

  function addMsg(role, contentNode) {
    const wrap = el('div', `msg ${role === 'user' ? 'user' : 'bot'}`);
    if (role !== 'user') wrap.appendChild(pageAvatar());
    const body = el('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '8px';
    body.style.minWidth = '0';
    if (typeof contentNode === 'string') body.appendChild(el('div', 'bubble', formatText(contentNode)));
    else if (contentNode) body.appendChild(contentNode);
    wrap.appendChild(body);
    chat.appendChild(wrap);
    scrollDown();
    return body;
  }

  // ── Thẻ sản phẩm trong chat ──
  function priceHtml(p, cls) {
    if (p.price == null) return `<div class="price contact ${cls || ''}">Liên hệ báo giá</div>`;
    return `<div class="price ${cls || ''}">${money(p.price)}</div>`;
  }

  function productCard(p) {
    const card = el('div', 'pcard');
    const out = p.inStock === false;
    const badge = out
      ? '<span class="badge out">Liên hệ</span>'
      : p.promo
      ? `<span class="badge promo">${p.promo}</span>`
      : '<span class="badge">Giá xuất xưởng</span>';
    const spec = [p.capacity ? `Tải ${p.capacity}` : '', p.division ? `Độ chia ${p.division}` : '']
      .filter(Boolean).map((s) => `<span>${s}</span>`).join('');

    card.innerHTML = `
      <div class="photo">
        ${badge}
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.opacity=0" />
      </div>
      <div class="body">
        <h4>${p.name}</h4>
        <div class="model">${p.model || ''}</div>
        <div class="spec">${spec}</div>
        ${priceHtml(p)}
        <button class="buy-btn">${p.price == null ? 'Yêu cầu khảo sát' : 'Mua / Báo giá'}</button>
      </div>`;
    card.querySelector('.buy-btn').addEventListener('click', () => {
      input.value = p.price == null
        ? `Mình cần khảo sát lắp đặt ${p.name}`
        : `Mình muốn mua ${p.name} (${p.model}), báo giá giúp mình`;
      send();
    });
    return card;
  }

  function cardsBlock(cards) {
    const grid = el('div', 'cards');
    cards.forEach((p) => grid.appendChild(productCard(p)));
    return grid;
  }

  // ── Xác nhận đơn / báo giá ──
  function orderBlock(o) {
    const box = el('div', 'confirm');
    if (o.kind === 'survey') {
      box.innerHTML = `
        <div class="ok">✔ Đã nhận yêu cầu khảo sát</div>
        <div class="code">${o.code}</div>
        <dl>
          <dt>Sản phẩm</dt><dd>${o.product}</dd>
          <dt>Model</dt><dd>${o.model || '-'}</dd>
          <dt>Khách</dt><dd>${o.customer_name}</dd>
          <dt>Điện thoại</dt><dd>${o.phone}</dd>
        </dl>
        <p class="foot">${o.note || ''}</p>`;
      return box;
    }
    box.innerHTML = `
      <div class="ok">✔ Đã ghi nhận đơn / báo giá</div>
      <div class="code">${o.code}</div>
      <dl>
        <dt>Sản phẩm</dt><dd>${o.product} (${o.model || ''})</dd>
        <dt>Số lượng</dt><dd>${o.quantity}</dd>
        <dt>Đơn giá</dt><dd>${money(o.unitPrice)}${o.discountLabel ? ` · ${o.discountLabel}` : ''}</dd>
        <dt>Khách</dt><dd>${o.customer_name}</dd>
        <dt>Điện thoại</dt><dd>${o.phone}</dd>
        <dt>Tổng tiền</dt><dd class="total">${money(o.total)}</dd>
      </dl>
      <p class="foot">${o.footer || ''}</p>`;
    return box;
  }

  function handoffBlock(h) {
    const box = el('div', 'handoff');
    box.innerHTML = `
      <b>Đã chuyển nhân viên hỗ trợ</b>
      <span>Câu này bên em muốn xác nhận cho chắc — nhân viên đã nhận thông báo và sẽ phản hồi ngay.</span>
      ${h.reason ? `<i>${formatText(h.reason)}</i>` : ''}`;
    return box;
  }

  function typingIndicator() {
    const body = addMsg('bot', el('div', 'bubble', '<span class="typing"><i></i><i></i><i></i></span>'));
    return body.parentElement;
  }

  // ── Ảnh khách gửi ── (thu nhỏ tối đa 1024px để tiết kiệm token)
  const MAX_SIDE = 1024;
  let pendingImage = null;

  function shrink(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('File không phải ảnh hợp lệ.'));
        img.onload = () => {
          const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function clearAttachment() {
    pendingImage = null; fileEl.value = '';
    previewEl.hidden = true; previewImg.removeAttribute('src');
  }
  attachBtn.addEventListener('click', () => fileEl.click());
  previewClear.addEventListener('click', clearAttachment);
  fileEl.addEventListener('change', async () => {
    const file = fileEl.files && fileEl.files[0];
    if (!file) return;
    try {
      pendingImage = await shrink(file);
      previewImg.src = pendingImage;
      previewEl.hidden = false;
      input.focus();
    } catch (err) {
      clearAttachment();
      addMsg('bot', `Xin lỗi, mình không mở được ảnh này: ${err.message}`);
    }
  });

  // ── Networking ──
  async function callChat(userText, image) {
    history.push({ role: 'user', content: userText });
    const res = await fetch(endpoint() + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, today: todayISO(), image: image || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Lỗi máy chủ (${res.status})`);
    return data;
  }

  function userImageNode(dataUrl, text) {
    const box = el('div');
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '6px';
    box.style.alignItems = 'flex-end';
    const im = el('img', 'sent-img');
    im.src = dataUrl;
    im.alt = 'Ảnh khách gửi';
    box.appendChild(im);
    if (text) box.appendChild(el('div', 'bubble', formatText(text)));
    return box;
  }

  let busy = false;
  async function send() {
    const text = input.value.trim();
    const image = pendingImage;
    if ((!text && !image) || busy) return;

    busy = true; sendBtn.disabled = true; input.value = '';

    if (image) { addMsg('user', userImageNode(image, text)); clearAttachment(); }
    else addMsg('user', text);

    const forModel = image
      ? text ? `[Khách gửi ảnh một chiếc cân] ${text}` : '[Khách gửi ảnh một chiếc cân] Cái cân này bên mình có bán không, giá bao nhiêu?'
      : text;

    const typing = typingIndicator();
    try {
      const data = await callChat(forModel, image);
      typing.remove();
      const body = addMsg('bot', data.reply ? el('div', 'bubble', formatText(data.reply)) : null);
      if (data.cards && data.cards.length) body.appendChild(cardsBlock(data.cards));
      if (data.order) body.appendChild(orderBlock(data.order));
      if (data.handoff) body.appendChild(handoffBlock(data.handoff));
      history.push({ role: 'assistant', content: data.reply || '' });
    } catch (err) {
      typing.remove();
      addMsg('bot', `Xin lỗi, có lỗi: ${err.message || 'vui lòng thử lại.'}`);
    } finally {
      busy = false; sendBtn.disabled = false; input.focus(); scrollDown();
    }
  }

  // ── Chips ──
  function renderChips() {
    chipsEl.innerHTML = '';
    SUGGESTIONS.forEach((s) => {
      const c = el('button', 'chip', s);
      c.type = 'button';
      c.addEventListener('click', () => { input.value = s; send(); });
      chipsEl.appendChild(c);
    });
  }

  // ── Tabs ──
  const tabChat = $('#tabChat');
  const tabProducts = $('#tabProducts');
  const viewChat = $('#viewChat');
  const viewProducts = $('#viewProducts');

  function showTab(which) {
    const chatActive = which === 'chat';
    tabChat.classList.toggle('is-active', chatActive);
    tabProducts.classList.toggle('is-active', !chatActive);
    viewChat.hidden = !chatActive;
    viewProducts.hidden = chatActive;
    if (!chatActive) loadProducts();
  }
  tabChat.addEventListener('click', () => showTab('chat'));
  tabProducts.addEventListener('click', () => showTab('products'));
  $('#headMsg').addEventListener('click', () => { showTab('chat'); input.focus(); });
  $('#headLike').addEventListener('click', (e) => {
    e.currentTarget.textContent = '✔ Đã thích';
    e.currentTarget.classList.add('btn-blue');
  });

  function askAbout(p) {
    showTab('chat');
    input.value = p.price == null
      ? `Mình cần khảo sát lắp đặt ${p.name}`
      : `Mình muốn mua ${p.name} (${p.model}), báo giá giúp mình`;
    send();
  }

  // ── Tab Sản phẩm (gian hàng) ──
  const productsGrid = $('#productsGrid');
  const catFilter = $('#catFilter');
  const shopLive = $('#shopLive');
  let activeCat = 'all';
  let allProducts = window.PRODUCTS_DATA || [];

  function galleryCard(p) {
    const spec = (p.features || []).slice(0, 4).map((f) => `<b>${f}</b>`).join('');
    const card = el('div', 'gcard');
    card.innerHTML = `
      <div class="photo">
        ${p.promo ? `<span class="badge promo">${p.promo}</span>` : '<span class="badge">Giá xuất xưởng</span>'}
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.opacity=0" />
      </div>
      <div class="body">
        <div class="cat">${CATS[p.category] || ''}</div>
        <h3>${p.name}</h3>
        <div class="model">${p.model || ''} · Tải ${p.capacity} · Độ chia ${p.division}</div>
        <p class="desc">${p.desc || ''}</p>
        <div class="spec">${spec}</div>
        <div class="foot">
          ${p.price == null ? '<span class="price contact">Liên hệ báo giá</span>' : `<span class="price">${money(p.price)}</span>`}
          <button class="buy-btn">${p.price == null ? 'Khảo sát' : 'Báo giá'}</button>
        </div>
      </div>`;
    card.querySelector('.buy-btn').addEventListener('click', () => askAbout(p));
    return card;
  }

  function paintProducts() {
    const list = activeCat === 'all' ? allProducts : allProducts.filter((p) => p.category === activeCat);
    productsGrid.innerHTML = '';
    list.forEach((p) => productsGrid.appendChild(galleryCard(p)));
  }

  function renderCatFilter() {
    catFilter.innerHTML = '';
    const cats = ['all', ...Object.keys(CATS)];
    cats.forEach((c) => {
      const label = c === 'all' ? 'Tất cả' : CATS[c];
      const b = el('button', 'cat-btn' + (c === activeCat ? ' is-active' : ''), label);
      b.type = 'button';
      b.addEventListener('click', () => {
        activeCat = c;
        renderCatFilter();
        paintProducts();
      });
      catFilter.appendChild(b);
    });
  }

  let productsLoaded = false;
  async function loadProducts() {
    if (!productsLoaded) { renderCatFilter(); paintProducts(); productsLoaded = true; }
    shopLive.textContent = 'Đang tải…';
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(endpoint() + '/api/products', { signal: ctrl.signal });
      clearTimeout(t);
      const data = await res.json();
      if (data.products && data.products.length) {
        // Ghép mô tả/feature tĩnh vào dữ liệu realtime từ API (giữ mô tả đẹp).
        const byId = {};
        (window.PRODUCTS_DATA || []).forEach((x) => (byId[x.id] = x));
        allProducts = data.products.map((p) => ({ ...(byId[p.id] || {}), ...p }));
        paintProducts();
        shopLive.textContent = 'Realtime';
      } else {
        shopLive.textContent = 'Danh mục mẫu';
      }
    } catch {
      shopLive.textContent = 'Danh mục mẫu';
    }
  }

  // ── Init ──
  form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
  renderChips();
  addMsg(
    'bot',
    'Dạ em chào anh/chị, đây là **Cân Điện Tử Đại Tín** — bên em nhập khẩu & phân phối các loại cân điện tử **giá xuất xưởng**.\n' +
      'Anh/chị cần cân loại nào ạ (cân tính tiền, cân bàn, cân sàn, cân treo, cân tiểu ly, cân heo, cân ô tô...)? ' +
      'Anh/chị mô tả nhu cầu hoặc **gửi ảnh chiếc cân** để em tư vấn và báo giá ngay.'
  );
})();
