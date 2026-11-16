// Sweet Moments – сервер за нарачки на колачиња
// Стартување: npm start  → http://localhost:3000   (админ: http://localhost:3000/admin.html)
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
// .env датотека (MONGODB_URI, SMTP...) – опционално, само локално
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}
const PORT = process.env.PORT || 3000;
const { createStore } = require('./store');
let store; // MongoDB или локални датотеки – види store.js

// ---------- Почетни податоци ----------
const DEFAULT_INGREDIENTS = 'Јајца, брашно, шеќер, путер, ванила, шеќер во прав, сол';
const uid = () => crypto.randomBytes(6).toString('hex');

function seed() {
  const cat = (name, slug) => ({ id: slug, name });
  const p = (name, price, size, image, category, description = '') =>
    ({ id: uid(), name, price, size, image, category, description, active: true });
  return {
    settings: {
      brand: 'Sweet Moments',
      sloganMk: 'Секој момент заслужува нешто слатко',
      sloganEn: 'Every moment deserves something sweet',
      heroText: 'Рачно декорирани колачиња за Нова година, Божиќ, роденденски забави, свадби и секоја посебна прослава.',
      about: 'Секое колаче е изработено и украсено рачно, со многу љубов и внимание кон деталите. Изберете од нашите дизајни или нарачајте сопствен дизајн за вашата прослава.',
      phone: '',
      orderEmail: '',
      email: '',
      address: '',
      instagram: '',
      facebook: '',
      deliveryInfo: 'Нарачките се примаат најмалку 3 дена однапред. Можно е подигање или достава по договор.',
      announcement: 'Нарачките за Нова година и Божиќ се примаат до 20 декември',
      ingredients: DEFAULT_INGREDIENTS,
      individualWrapPrice: 10,
      currency: 'ден',
      logo: ''
    },
    categories: [
      cat('Нова година и Божиќ', 'praznici'),
      cat('Роденден', 'rodenden'),
      cat('Свадба', 'svadba'),
      cat('Прослави', 'proslavi')
    ],
    products: [
      p('Снешко', 120, 'Ø 8 cm', '/images/snowman.jpg', 'praznici'),
      p('Ирвас Рудолф', 120, '7 × 7 cm', '/images/reindeer-square.jpg', 'praznici'),
      p('Медено човече', 130, '9 × 10 cm', '/images/own-6.jpg', 'praznici'),
      p('Снегулка', 110, '7 × 7 cm', '/images/snowflake-square.jpg', 'praznici'),
      p('Божиќен венец', 120, 'Ø 8 cm', '/images/own-5.jpg', 'praznici'),
      p('Ракавичка', 120, '8 × 9 cm', '/images/mittens.jpg', 'praznici'),
      p('Пингвин', 120, 'Ø 8 cm', '/images/penguin-blue.jpg', 'praznici'),
      p('Појас на Дедо Мраз', 110, 'Ø 8 cm', '/images/round-mix.jpg', 'praznici'),
      p('Бонбона', 100, 'Ø 7 cm', '/images/peppermint.jpg', 'praznici')
    ],
    packages: [
      { id: uid(), name: 'Мини пакет', count: 3, price: 330, description: '3 колачиња по избор – идеален мал подарок.', active: true },
      { id: uid(), name: 'Сладок пакет', count: 6, price: 630, description: '6 колачиња по избор во украсна кутија.', active: true },
      { id: uid(), name: 'Празничен пакет', count: 12, price: 1200, description: '12 колачиња по избор – за семејство и пријатели.', active: true },
      { id: uid(), name: 'Party пакет', count: 24, price: 2300, description: '24 колачиња по избор – за забави и прослави.', active: true }
    ],
    gallery: [
      'own-1', 'own-2', 'own-3', 'own-4', 'own-5', 'own-6', 'own-7', 'own-8',
      'round-set', 'melted-snowman', 'pastel-snowflake', 'penguin', 'reindeer-snowman', 'xmas-mix'
    ].map(n => ({ id: uid(), image: `/images/${n}.jpg`, caption: '', category: 'praznici', createdAt: Date.now() })),
    reviews: [],
    orders: [],
    messages: [],
    admin: { email: '', hash: '', salt: '' }
  };
}

let db;
async function loadDb() {
  let loaded = await store.load();
  // Прв старт со MongoDB: пренеси ги постоечките локални податоци (data/db.json + uploads/)
  const localFile = path.join(ROOT, 'data', 'db.json');
  if (!loaded && store.kind === 'mongo' && fs.existsSync(localFile)) {
    loaded = JSON.parse(fs.readFileSync(localFile, 'utf8'));
    await store.importLocal(loaded);
    console.log('Локалните податоци се пренесени во MongoDB.');
  }
  db = loaded || seed();
  for (const k of ['categories', 'products', 'packages', 'gallery', 'reviews', 'orders', 'messages']) db[k] ||= [];
  db.admin ||= { email: '', hash: '', salt: '' };
  // нови поставки за постоечка база
  if (db.settings.ingredients === undefined) db.settings.ingredients = DEFAULT_INGREDIENTS;
  if ((db.catalogVersion || 1) < 2) applyCatalogV2();
  if (db.catalogVersion < 3) { // појаснет попуст + плаќање при преземање
    Object.assign(db.settings, {
      priceNote: 'Почетни цени. Попуст кога сами ќе изберете точно 6 колачиња (−10%) или точно 12 колачиња (−15%), спакувани заедно во кутија. Плаќањето е при преземање.',
      deliveryInfo: 'Нарачки до 20 декември или до пополнување на местата. Плаќањето е при преземање. Испораката се наплаќа посебно – цената ја договараме по телефон.'
    });
    db.catalogVersion = 3;
  }
  if (db.catalogVersion < 4) applyImagesV4();
  if (db.catalogVersion < 5) { // нови фотографии по прилики – најгоре во галеријата
    const t = Date.now() + 1000;
    const add = [['snesko-vo-raka', 'praznici', ''], ['novogodisna-kutija', 'praznici', 'Спакувани како подарок'],
      ['novogodisen-set-sirok', 'praznici', ''], ['novogodisen-set', 'praznici', ''],
      ['rodenden', 'rodenden', 'Роденденски колачиња'], ['svadba', 'svadba', 'Свадбени колачиња'],
      ['proslavi-bebe', 'proslavi', 'Крштевка и бебешка забава'], ['sopstven-dizajn-mecinja', 'proslavi', 'Од цртеж до колаче']]
      .map(([n, cat, cap], i) => ({ id: uid(), image: '/images/s/' + n + '.jpg', caption: cap, category: cat, createdAt: t - i }));
    db.gallery = [...add, ...db.gallery];
    db.catalogVersion = 5;
  }
  if (db.catalogVersion < 6) applyDesignsV6();
  if (db.catalogVersion < 7) { // Ѕвезда со мрвици + Ракавица (2 дизајни)
    const img = n => '/images/c/' + n + '.jpg';
    const own = p => String(p?.image || '').startsWith('/uploads/');
    const star = db.products.find(p => p.name === 'Ѕвезда со мрвици');
    if (star && !own(star)) star.image = img('dzvezda-so-mrvici');
    const mit = db.products.find(p => p.name === 'Ракавица');
    if (mit) {
      if (!own(mit)) mit.image = img('rakavica-sarena');
      if (!(mit.designs || []).length) mit.designs = [
        { id: uid(), name: 'Шарена', image: img('rakavica-sarena') },
        { id: uid(), name: 'Црвена', image: img('rakavica-crvena') }
      ];
      if (!mit.description) mit.description = 'Изберете дизајн.';
    }
    const occ = db.gallery.filter(g => g.image.startsWith('/images/s/')).map(g => g.createdAt);
    const t = (occ.length ? Math.min(...occ) : Date.now()) - 0.5;
    db.gallery.push(...['dzvezda-so-mrvici', 'rakavica-sarena', 'rakavica-crvena']
      .map((n, i) => ({ id: uid(), image: img(n), caption: '', category: 'praznici', createdAt: t - i * 0.1 })));
    db.catalogVersion = 7;
  }
  if (db.catalogVersion < 8) { // вистински фотографии во облик: Човече, Ирвас, Снешко, Елка
    const img = n => '/images/c/' + n + '.jpg';
    const map = { 'Човече': 'covece-oblik', 'Ирвас': 'irvas-oblik', 'Снешко': 'snesko-oblik', 'Елка': 'elka-oblik' };
    for (const p of db.products) if (map[p.name] && !String(p.image || '').startsWith('/uploads/')) p.image = img(map[p.name]);
    const occ = db.gallery.filter(g => g.image.startsWith('/images/s/')).map(g => g.createdAt);
    const t = (occ.length ? Math.min(...occ) : Date.now()) - 0.01;
    db.gallery.push(...Object.values(map).map((n, i) => ({ id: uid(), image: img(n), caption: '', category: 'praznici', createdAt: t - i * 0.001 })));
    db.catalogVersion = 8;
  }
  if (db.catalogVersion < 9) { // Правоаголник: 4 дизајни
    const img = n => '/images/c/' + n + '.jpg';
    const pr = db.products.find(p => p.name === 'Правоаголник');
    const designs = [['Елка', 'pravoagolnik-elka'], ['Дедо Мраз', 'pravoagolnik-dedo-mraz'], ['Merry', 'pravoagolnik-merry'], ['Ho Ho', 'pravoagolnik-ho-ho']];
    if (pr) {
      if (!(pr.designs || []).length) pr.designs = designs.map(([name, n]) => ({ id: uid(), name, image: img(n) }));
      if (!String(pr.image || '').startsWith('/uploads/')) pr.image = img('pravoagolnik-elka');
      pr.description = 'Изберете дизајн.';
    }
    const occ = db.gallery.filter(g => g.image.startsWith('/images/s/')).map(g => g.createdAt);
    const t = (occ.length ? Math.min(...occ) : Date.now()) - 0.0001;
    db.gallery.push(...designs.map(([, n], i) => ({ id: uid(), image: img(n), caption: '', category: 'praznici', createdAt: t - i * 0.00001 })));
    db.catalogVersion = 9;
  }
  save();
  await store.flush();
}
// Ценовник „Новогодишна колекција“ (ноември 2026) – еднократно ги заменува привремените колачиња и пакети
function applyCatalogV2() {
  const C = '/images/c/';
  const d = (name, img) => ({ id: uid(), name, image: C + img + '.jpg' });
  const p = (name, size, price, image, description = '', designs = []) =>
    ({ id: uid(), name, size, price, image, category: 'praznici', description, active: true, designs });
  db.products = [
    p('Човече', '11 см', 50, '/images/own-6.jpg', 'Медено човече со рачно украсување.'),
    p('Круг со маршмелоу', '7 см', 50, C + 'marshmelou-stopen-snesko.jpg', '„Стопен снешко“ со вистински маршмелоу.'),
    p('Правоаголник', '7×8 см', 50, '/images/own-7.jpg', 'Сите дизајни – напишете го посакуваниот дизајн во забелешката.'),
    p('Ѕвезда со мрвици', '8 см', 40, '/images/own-8.jpg'),
    p('Ирвас', '9 см', 40, '/images/own-1.jpg'),
    p('Круг', '7 см', 40, C + 'krug-snegulka.jpg', 'Изберете дизајн.', [
      d('Снегулка', 'krug-snegulka'), d('Новогодишни светилки', 'krug-svetilki'), d('Дедо Мраз', 'krug-dedo-mraz'),
      d('Снешко', 'krug-snesko'), d('Медено лице', 'krug-medeno-lice'), d('Бонбона', 'krug-bonbona'),
      d('Пингвин', 'krug-pingvin'), d('Зелено лице', 'krug-zeleno-lice'),
      d('Снешко со сини слушалки', 'snesko-sini-slusalki'), d('Снешко со розе трепки', 'snesko-roze-trepki'),
      d('Снешко со црвени слушалки', 'snesko-crveni-slusalki'), d('Снешко – зелени слушалки', 'snesko-zeleni-zatvoreni-oci'),
      d('Снешко со портокалови слушалки', 'snesko-portokalovi-slusalki'), d('Снешко – розе насмевка', 'snesko-roze-nasmevka'),
      d('Снешко – зелени точки', 'snesko-zeleni-tocki')
    ]),
    p('Квадрат', '7 см', 40, C + 'kvadrat-irvas.jpg', 'Сите дизајни – напишете го посакуваниот дизајн во забелешката.'),
    p('Снешко', '8 см', 30, '/images/own-1.jpg'),
    p('Елка', '8 см', 30, C + 'elka-zelena.jpg'),
    p('Ракавица', '6 / 4,5 см', 30, '/images/own-4.jpg')
  ];
  const mix = (count, price) => ({ id: uid(), name: `Мешан пакет · ${count} колачиња`, count, price, active: true, choose: false,
    description: 'Дизајните ги бираме ние – разновиден новогодишен микс.' });
  db.packages = [mix(6, 220), mix(9, 320), mix(12, 420)];
  Object.assign(db.settings, {
    announcement: 'Нарачки до 20 декември или до пополнување на местата',
    deliveryInfo: 'Нарачки до 20 декември или до пополнување на местата. Испораката се наплаќа посебно – цената ја договараме по телефон.',
    priceNote: 'Почетни цени.',
    discounts: [{ min: 6, pct: 10 }, { min: 12, pct: 15 }]
  });
  const now = Date.now();
  const newGallery = ['krug-snegulka', 'krug-svetilki', 'krug-dedo-mraz', 'krug-snesko', 'krug-medeno-lice', 'krug-bonbona',
    'marshmelou-stopen-snesko', 'kvadrat-irvas', 'krug-pingvin', 'snesko-roze-trepki', 'snesko-crveni-slusalki', 'snesko-portokalovi-slusalki']
    .map((n, i) => ({ id: uid(), image: C + n + '.jpg', caption: '', category: 'praznici', createdAt: now + i }));
  db.gallery = [...newGallery, ...db.gallery];
  db.catalogVersion = 2;
  console.log('Каталогот е ажуриран според ценовникот (верзија 2).');
}
// Само избраните „убави“ слики (папка Sweet_Moments_set_02) – без домашни и туѓи фотографии.
// Сликите прикачени преку админ (/uploads/) се задржуваат.
const SET2 = ['krug-snegulka', 'krug-svetilki', 'krug-dedo-mraz', 'krug-snesko', 'krug-medeno-lice', 'krug-bonbona',
  'marshmelou-stopen-snesko', 'kvadrat-irvas', 'krug-pingvin', 'elka-zelena', 'krug-zeleno-lice',
  'snesko-sini-slusalki', 'snesko-roze-trepki', 'snesko-crveni-slusalki', 'snesko-zeleni-zatvoreni-oci',
  'snesko-portokalovi-slusalki', 'snesko-roze-nasmevka', 'snesko-zeleni-tocki'];
function applyImagesV4() {
  const C = '/images/c/';
  const byName = {
    'Човече': 'krug-medeno-lice', 'Круг со маршмелоу': 'marshmelou-stopen-snesko', 'Ирвас': 'kvadrat-irvas',
    'Круг': 'krug-snegulka', 'Квадрат': 'kvadrat-irvas', 'Снешко': 'krug-snesko', 'Елка': 'elka-zelena',
    'Правоаголник': '', 'Ѕвезда со мрвици': '', 'Ракавица': '' // уште немаат убава слика
  };
  for (const p of db.products) {
    if (String(p.image || '').startsWith('/uploads/')) continue;
    if (p.name in byName) p.image = byName[p.name] ? C + byName[p.name] + '.jpg' : '';
    else if (!String(p.image || '').startsWith(C)) p.image = '';
  }
  const t = Date.now();
  db.gallery = [
    ...SET2.map((n, i) => ({ id: uid(), image: C + n + '.jpg', caption: '', category: 'praznici', createdAt: t - i })),
    ...db.gallery.filter(g => String(g.image).startsWith('/uploads/'))
  ];
  db.catalogVersion = 4;
  console.log('Сликите се заменети (верзија 4).');
}
// Нови поединечни фотографии: дизајни за Квадрат и Круг, слики за Ирвас и Правоаголник
function applyDesignsV6() {
  const C = '/images/c/';
  const img = n => C + n + '.jpg';
  const find = name => db.products.find(p => p.name === name);
  const notUploaded = p => !String(p.image || '').startsWith('/uploads/');

  const kvadrat = find('Квадрат');
  if (kvadrat) {
    kvadrat.designs = [
      { id: uid(), name: 'Дедо Мраз', image: img('kvadrat-dedo-mraz') },
      { id: uid(), name: 'Ирвас', image: img('kvadrat-irvas-crni-rogovi') },
      { id: uid(), name: 'Сина снегулка', image: img('kvadrat-sina-snegulka') },
      { id: uid(), name: 'Бела снегулка', image: img('kvadrat-bela-snegulka') },
      { id: uid(), name: 'Ирвас со светли рогови', image: img('kvadrat-irvas') }
    ];
    if (notUploaded(kvadrat)) kvadrat.image = img('kvadrat-dedo-mraz');
    kvadrat.description = 'Изберете дизајн.';
  }

  const krug = find('Круг');
  if (krug) {
    const old = new Map((krug.designs || []).map(d => [d.name, d]));
    const fresh = [['Бела снегулка на црвено', 'krug-bela-snegulka-na-crveno'], ['Црвена снегулка на бело', 'krug-crvena-snegulka-na-belo'],
      ['Ирвас', 'krug-irvas'], ['Снешко класик', 'krug-snesko-klasik'], ['Ментол бонбона', 'krug-mentol-bonbona'], ['Спирала', 'krug-spirala']];
    for (const [name, n] of fresh) if (!old.has(name)) old.set(name, { id: uid(), name, image: img(n) });
    const order = ['Снегулка', 'Бела снегулка на црвено', 'Црвена снегулка на бело', 'Ирвас', 'Снешко класик', 'Снешко', 'Дедо Мраз',
      'Новогодишни светилки', 'Медено лице', 'Ментол бонбона', 'Спирала', 'Бонбона', 'Пингвин', 'Зелено лице'];
    const sorted = [...order.filter(n => old.has(n)).map(n => old.get(n)), ...[...old.values()].filter(d => !order.includes(d.name))];
    krug.designs = sorted;
  }

  const irvas = find('Ирвас');
  if (irvas && notUploaded(irvas)) irvas.image = img('krug-irvas');
  const prav = find('Правоаголник');
  if (prav && !prav.image) prav.image = img('kvadrat-sina-snegulka');

  // галеријата се подредува по датум – новите колачиња одат веднаш по фотографиите од приликите
  const occ = db.gallery.filter(g => g.image.startsWith('/images/s/')).map(g => g.createdAt);
  const t = (occ.length ? Math.min(...occ) : Date.now()) - 1;
  const add = ['kvadrat-dedo-mraz', 'krug-bela-snegulka-na-crveno', 'krug-irvas', 'kvadrat-sina-snegulka', 'krug-mentol-bonbona',
    'kvadrat-irvas-crni-rogovi', 'krug-crvena-snegulka-na-belo', 'krug-snesko-klasik', 'kvadrat-bela-snegulka', 'krug-spirala']
    .map((n, i) => ({ id: uid(), image: img(n), caption: '', category: 'praznici', createdAt: t - i }));
  // по најновите фотографии од приликите (v5), пред поединечните колачиња
  const firstOld = db.gallery.findIndex(g => g.image.startsWith(C));
  if (firstOld < 0) db.gallery.push(...add); else db.gallery.splice(firstOld, 0, ...add);
  db.catalogVersion = 6;
  console.log('Нови дизајни и слики (верзија 6).');
}
function nextNumber() { db.orderSeq = (db.orderSeq || 1000) + 1; return db.orderSeq; }
function save() { return store.save(db); }

// ---------- Помошни ----------
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v, def = 0) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : def; };
const bool = v => v === true || v === 'true' || v === '1' || v === 'on';

// Сликите прво во меморија, па се зачувуваат во store (MongoDB GridFS или папка uploads/)
const multerMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|heic|heif)$/.test(file.mimetype))
});
async function persistFiles(req) {
  const files = req.file ? [req.file] : (req.files || []);
  for (const f of files) {
    const ext = (path.extname(f.originalname) || '.jpg').toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 6) || '.jpg';
    f.filename = Date.now() + '-' + uid() + (ext.startsWith('.') ? ext : '.' + ext);
    await store.putFile(f.filename, f.buffer, f.mimetype);
    f.buffer = null;
  }
}
const withUploads = mw => [mw, (req, res, next) => persistFiles(req).then(() => next(), next)];
const upload = {
  single: name => withUploads(multerMem.single(name)),
  array: (name, n) => withUploads(multerMem.array(name, n))
};
const fileUrl = f => (f && f.filename ? '/uploads/' + f.filename : '');
function removeUpload(url) {
  if (typeof url === 'string' && url.startsWith('/uploads/')) {
    store.removeFile(path.basename(url)).catch(e => console.error('Сликата не е избришана:', e.message));
  }
}

// едноставно ограничување на барања за јавни форми
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Премногу барања. Обидете се повторно подоцна.' });
    arr.push(now); hits.set(key, arr); next();
  };
}

// ---------- Админ автентикација ----------
// Потпишан токен (преживува рестарт на серверот). Се поништува при промена на лозинката.
const SESSION_MS = 1000 * 60 * 60 * 24 * 7;
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const sessionKey = () => (process.env.SESSION_SECRET || '') + '|' + db.admin.hash + '|' + db.admin.salt;
const sign = exp => crypto.createHmac('sha256', sessionKey()).update(String(exp)).digest('hex');
function getCookie(req, name) {
  const m = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}
function isAdmin(req) {
  if (!db.admin.hash) return false;
  const [exp, sig] = getCookie(req, 'sm_admin').split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Потребна е најава.' });
  next();
}
function startSession(res) {
  const exp = Date.now() + SESSION_MS;
  res.setHeader('Set-Cookie', `sm_admin=${exp}.${sign(exp)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${res.req.secure ? '; Secure' : ''}`);
}

// ---------- Апликација ----------
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.get('/healthz', (req, res) => res.send('ok'));
app.get('/uploads/:name', (req, res, next) => {
  Promise.resolve(store.serveFile(req.params.name, res, next)).catch(next);
});
app.use(express.static(path.join(ROOT, 'public'), { extensions: ['html'] }));

// Јавни податоци
app.get('/api/public', (req, res) => {
  res.json({
    settings: (({ orderEmail, ...s }) => ({ ...s, logo: s.logo || '/images/logo.svg' }))(db.settings),
    categories: db.categories,
    products: db.products.filter(p => p.active),
    packages: db.packages.filter(p => p.active),
    gallery: [...db.gallery].sort((a, b) => b.createdAt - a.createdAt),
    reviews: db.reviews.filter(r => r.approved).sort((a, b) => b.createdAt - a.createdAt)
      .map(({ id, name, rating, text, photo, createdAt }) => ({ id, name, rating, text, photo, createdAt }))
  });
});

function customerFields(b) {
  const c = {
    name: str(b.name, 100), phone: str(b.phone, 40), email: str(b.email, 120),
    address: str(b.address, 300), delivery: b.delivery === 'delivery' ? 'delivery' : 'pickup',
    date: str(b.date, 20), note: str(b.note, 2000)
  };
  if (!c.name || !c.phone) throw new Error('Внесете име и телефон.');
  if (!bool(b.consent)) throw new Error('Потребна е согласност со Политиката за приватност.');
  return c;
}

// ---------- Известување по е-пошта за нова нарачка ----------
// Начин 1 (препорачан за бесплатен Render): Brevo преку HTTPS → BREVO_API_KEY (+ MAIL_FROM = потврдена адреса во Brevo)
// Начин 2: SMTP → SMTP_HOST, SMTP_USER, SMTP_PASS (не работи на бесплатниот Render – SMTP портите се блокирани)
let mailer = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailer = require('nodemailer').createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const mailEnabled = () => !!(BREVO_KEY || mailer);
const notifyTo = () => db.settings.orderEmail || db.admin.email;
async function sendMail(to, subject, text) {
  if (BREVO_KEY) {
    const from = process.env.MAIL_FROM || to;
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: 'Sweet Moments', email: from }, to: [{ email: to }], subject, textContent: text })
    });
    if (!r.ok) throw new Error(`Brevo ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return;
  }
  if (mailer) await mailer.sendMail({ from: `"Sweet Moments" <${process.env.SMTP_USER}>`, to, subject, text });
}
function notify(subject, lines) {
  if (!mailEnabled() || !notifyTo()) return;
  const text = lines.filter(Boolean).join('\n') + '\n\n—\nДетали и статус: админ панел → Нарачки';
  sendMail(notifyTo(), subject, text).catch(e => console.error('Е-пошта не е испратена:', e.message));
}
function customerText(c) {
  return [`Име: ${c.name}`, `Телефон: ${c.phone}`, c.email && `Е-пошта: ${c.email}`,
    `Преземање: ${c.delivery === 'delivery' ? 'Достава' : 'Лично подигање'}`, c.address && `Адреса: ${c.address}`,
    c.date && `Потребно до: ${c.date}`, c.note && `Забелешка: ${c.note}`];
}

// Попуст кога купувачот сам избира ТОЧНО одреден број колачиња (на пр. 6 → −10%, 12 → −15%)
// и тие се пакуваат ЗАЕДНО во кутија. Поединечно пакување = без попуст.
function discountFor(count, packing) {
  if (packing !== 'together') return 0;
  return ((db.settings.discounts || []).find(t => t.min > 0 && t.pct > 0 && t.min === count) || { pct: 0 }).pct;
}

// Нарачка од кошничка
app.post('/api/orders', rateLimit(10, 60 * 60 * 1000), (req, res) => {
  try {
    const b = req.body || {};
    const customer = customerFields(b);
    const packing = b.packing === 'individual' ? 'individual' : 'together';
    const items = Array.isArray(b.items) ? b.items.slice(0, 100) : [];
    if (!items.length) throw new Error('Кошничката е празна.');
    const lines = [];
    let total = 0, cookieCount = 0;
    let pickedSubtotal = 0, pickedCount = 0; // колачиња што купувачот сам ги избрал (за попуст)
    for (const it of items) {
      if (it.type === 'product') {
        const p = db.products.find(x => x.id === it.id && x.active);
        const qty = Math.min(500, Math.floor(num(it.qty)));
        if (!p || qty < 1) throw new Error('Невалиден производ во кошничката.');
        let design = '';
        if (p.designs?.length) {
          design = (p.designs.find(d => d.name === it.design) || {}).name || '';
          if (!design) throw new Error(`Изберете дизајн за „${p.name}“.`);
        }
        lines.push({ type: 'product', name: p.name, design, size: p.size, qty, unit: p.price, sum: p.price * qty });
        total += p.price * qty; cookieCount += qty;
        pickedSubtotal += p.price * qty; pickedCount += qty;
      } else if (it.type === 'package') {
        const pk = db.packages.find(x => x.id === it.id && x.active);
        if (!pk) throw new Error('Невалиден пакет.');
        const qty = Math.min(100, Math.max(1, Math.floor(num(it.qty, 1))));
        let names;
        if (pk.choose !== false) { // купувачот сам ги бира колачињата во пакетот
          const cookies = Array.isArray(it.cookies) ? it.cookies : [];
          if (cookies.length !== pk.count) throw new Error('Пакетот не е целосно пополнет.');
          names = cookies.map(id => {
            const p = db.products.find(x => x.id === id);
            if (!p) throw new Error('Невалидно колаче во пакетот.');
            return p.name;
          });
        }
        lines.push({ type: 'package', name: pk.name, qty, unit: pk.price, sum: pk.price * qty, cookies: names, mixed: pk.choose === false });
        total += pk.price * qty; cookieCount += pk.count * qty;
      } else throw new Error('Невалидна ставка.');
    }
    const discountPct = discountFor(pickedCount, packing);
    const discount = Math.round(pickedSubtotal * discountPct / 100);
    const wrapFee = packing === 'individual' ? cookieCount * num(db.settings.individualWrapPrice) : 0;
    const order = {
      id: uid(), number: nextNumber(), kind: 'cart', status: 'нова',
      createdAt: Date.now(), customer, packing, lines, cookieCount, discountPct, discount, wrapFee, total: total - discount + wrapFee
    };
    db.orders.push(order); save();
    notify(`Нова нарачка #${order.number} – ${order.total} ${db.settings.currency}`, [
      `НОВА НАРАЧКА #${order.number}`, '', ...customerText(customer), '',
      ...lines.map(l => `• ${l.name}${l.design ? ' – ' + l.design : ''} × ${l.qty} = ${l.sum}${l.cookies ? `\n   (${l.cookies.join(', ')})` : ''}${l.mixed ? ' (мешан – дизајните ги бираме ние)' : ''}`),
      `Пакување: ${packing === 'individual' ? 'Секое посебно' : 'Заедно во кутија'}`,
      discount && `Попуст ${discountPct}%: −${discount}`,
      wrapFee && `Доплата за пакување: ${wrapFee}`, `ВКУПНО: ${order.total} ${db.settings.currency}`
    ]);
    res.json({ ok: true, number: order.number, total: order.total });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Нарачка со сопствен дизајн (слики + текст + количина)
app.post('/api/custom-orders', rateLimit(10, 60 * 60 * 1000), upload.array('images', 5), (req, res) => {
  try {
    const b = req.body || {};
    const customer = customerFields(b);
    const quantity = Math.floor(num(b.quantity));
    if (quantity < 1) throw new Error('Внесете количина.');
    const order = {
      id: uid(), number: nextNumber(), kind: 'custom', status: 'нова', createdAt: Date.now(),
      customer, quantity, occasion: str(b.occasion, 60), design: str(b.design, 3000),
      cookieText: str(b.cookieText, 300), packing: b.packing === 'individual' ? 'individual' : 'together',
      images: (req.files || []).map(fileUrl), total: null
    };
    db.orders.push(order); save();
    notify(`Барање за сопствен дизајн #${order.number} – ${quantity} колачиња`, [
      `СОПСТВЕН ДИЗАЈН #${order.number}`, '', ...customerText(customer), '',
      `Прилика: ${order.occasion}`, `Количина: ${quantity}`, `Опис: ${order.design}`,
      order.cookieText && `Текст на колачињата: ${order.cookieText}`,
      `Пакување: ${order.packing === 'individual' ? 'Секое посебно' : 'Заедно во кутија'}`,
      order.images.length && `Прикачени слики: ${order.images.length} (види во админ панелот)`
    ]);
    res.json({ ok: true, number: order.number });
  } catch (e) {
    (req.files || []).forEach(f => removeUpload(fileUrl(f)));
    res.status(400).json({ error: e.message });
  }
});

// Рецензии (се објавуваат по одобрување од админ)
app.post('/api/reviews', rateLimit(5, 60 * 60 * 1000), upload.single('photo'), (req, res) => {
  const b = req.body || {};
  const name = str(b.name, 60), text = str(b.text, 1500);
  const rating = Math.min(5, Math.max(1, Math.round(num(b.rating, 5))));
  if (!name || !text) { removeUpload(fileUrl(req.file)); return res.status(400).json({ error: 'Внесете име и текст.' }); }
  db.reviews.push({ id: uid(), name, text, rating, photo: fileUrl(req.file), approved: false, createdAt: Date.now() });
  save(); res.json({ ok: true });
});

// Контакт порака
app.post('/api/messages', rateLimit(10, 60 * 60 * 1000), (req, res) => {
  const b = req.body || {};
  const m = { id: uid(), name: str(b.name, 100), contact: str(b.contact, 120), text: str(b.text, 3000), read: false, createdAt: Date.now() };
  if (!m.name || !m.contact || !m.text) return res.status(400).json({ error: 'Пополнете ги сите полиња.' });
  db.messages.push(m); save();
  notify(`Нова порака од ${m.name}`, [`Име: ${m.name}`, `Контакт: ${m.contact}`, '', m.text]);
  res.json({ ok: true });
});

// ---------- Админ ----------
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const normEmail = e => str(e, 200).toLowerCase();
function checkPassword(pw) {
  if (!db.admin.hash) return false;
  return crypto.timingSafeEqual(Buffer.from(hashPw(pw, db.admin.salt), 'hex'), Buffer.from(db.admin.hash, 'hex'));
}
function setCredentials(email, pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  db.admin = { email, salt, hash: hashPw(pw, salt) }; // новиот hash ги поништува старите најави
}

app.get('/api/admin/status', (req, res) => res.json({ setup: !!(db.admin.hash && db.admin.email), loggedIn: isAdmin(req) }));

// Прво поставување: само додека нема админ профил
app.post('/api/admin/setup', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  if (db.admin.hash && db.admin.email) return res.status(400).json({ error: 'Профилот е веќе поставен.' });
  // На Render (јавен сервер) профилот не смее да се креира преку страната – се пренесува од локалниот компјутер,
  // за никој друг да не може да го „присвои“ админ панелот.
  if (process.env.RENDER && process.env.ALLOW_ADMIN_SETUP !== 'true') return res.status(403).json({ error: 'Креирањето админ профил е исклучено на серверот.' });
  const email = normEmail(req.body?.email), pw = str(req.body?.password, 200);
  if (!validEmail(email)) return res.status(400).json({ error: 'Внесете валидна е-пошта.' });
  if (pw.length < 8) return res.status(400).json({ error: 'Лозинката мора да има најмалку 8 знаци.' });
  setCredentials(email, pw); save();
  startSession(res); res.json({ ok: true });
});

app.post('/api/admin/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const email = normEmail(req.body?.email), pw = str(req.body?.password, 200);
  if (!db.admin.hash) return res.status(400).json({ error: 'Профилот не е поставен.' });
  // проверка на лозинката секогаш, за да не се открие дали е-поштата е точна
  const pwOk = checkPassword(pw);
  if (!pwOk || email !== db.admin.email) return res.status(401).json({ error: 'Погрешна е-пошта или лозинка.' });
  startSession(res); res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'sm_admin=; Path=/; Max-Age=0'); res.json({ ok: true });
});

app.use('/api/admin', requireAdmin);

// Промена на е-пошта и/или лозинка (бара тековна лозинка)
app.post('/api/admin/account', (req, res) => {
  const current = str(req.body?.current, 200);
  if (!checkPassword(current)) return res.status(401).json({ error: 'Тековната лозинка не е точна.' });
  const email = req.body?.email ? normEmail(req.body.email) : db.admin.email;
  const pw = str(req.body?.password, 200) || current;
  if (!validEmail(email)) return res.status(400).json({ error: 'Внесете валидна е-пошта.' });
  if (pw.length < 8) return res.status(400).json({ error: 'Лозинката мора да има најмалку 8 знаци.' });
  setCredentials(email, pw); save();
  startSession(res); res.json({ ok: true });
});

app.post('/api/admin/test-email', async (req, res) => {
  if (!mailEnabled()) return res.status(400).json({ error: 'Испраќањето е-пошта не е активирано (недостасува BREVO_API_KEY во Render).' });
  try {
    await sendMail(notifyTo(), 'Тест – Sweet Moments', 'Ова е тест порака. Известувањата за нови нарачки работат. 🍪');
    res.json({ ok: true, to: notifyTo() });
  } catch (e) { res.status(502).json({ error: 'Мејлот не е испратен: ' + e.message }); }
});

app.get('/api/admin/all', (req, res) => {
  const { admin, ...rest } = db;
  res.json({ ...rest, account: { email: admin.email, mailEnabled: mailEnabled() } });
});

app.put('/api/admin/settings', upload.single('logo'), (req, res) => {
  const b = req.body || {};
  const s = db.settings;
  for (const k of ['brand', 'sloganMk', 'sloganEn', 'heroText', 'about', 'phone', 'email', 'address',
    'instagram', 'facebook', 'deliveryInfo', 'announcement', 'currency', 'orderEmail', 'ingredients', 'priceNote']) {
    if (k in b) s[k] = str(b[k], 3000);
  }
  if ('individualWrapPrice' in b) s.individualWrapPrice = num(b.individualWrapPrice);
  if ('disc1Min' in b) {
    s.discounts = [[b.disc1Min, b.disc1Pct], [b.disc2Min, b.disc2Pct]]
      .map(([m, p]) => ({ min: Math.floor(num(m)), pct: Math.min(90, num(p)) })).filter(t => t.min > 0 && t.pct > 0);
  }
  if (req.file) { removeUpload(s.logo); s.logo = fileUrl(req.file); }
  if (bool(b.removeLogo)) { removeUpload(s.logo); s.logo = ''; }
  save(); res.json(s);
});

// Производи (колачиња)
app.post('/api/admin/products', upload.single('image'), (req, res) => {
  const b = req.body;
  const p = { id: uid(), name: str(b.name, 100), price: num(b.price), size: str(b.size, 60), category: str(b.category, 60),
    description: str(b.description, 1000), image: fileUrl(req.file), active: b.active === undefined ? true : bool(b.active) };
  if (!p.name) return res.status(400).json({ error: 'Внесете име.' });
  db.products.push(p); save(); res.json(p);
});
app.put('/api/admin/products/:id', upload.single('image'), (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Не постои.' });
  const b = req.body;
  if ('name' in b) p.name = str(b.name, 100);
  if ('price' in b) p.price = num(b.price);
  if ('size' in b) p.size = str(b.size, 60);
  if ('category' in b) p.category = str(b.category, 60);
  if ('description' in b) p.description = str(b.description, 1000);
  if ('active' in b) p.active = bool(b.active);
  if (req.file) { removeUpload(p.image); p.image = fileUrl(req.file); }
  save(); res.json(p);
});
app.delete('/api/admin/products/:id', (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  if (p) { removeUpload(p.image); (p.designs || []).forEach(d => removeUpload(d.image)); }
  db.products = db.products.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

// Дизајни на колаче (на пр. „Круг – сите дизајни“: снегулка, снешко…)
app.post('/api/admin/products/:id/designs', upload.single('image'), (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Не постои.' });
  const name = str(req.body.name, 80);
  if (!name) { removeUpload(fileUrl(req.file)); return res.status(400).json({ error: 'Внесете име на дизајнот.' }); }
  if ((p.designs || []).some(d => d.name === name)) { removeUpload(fileUrl(req.file)); return res.status(400).json({ error: 'Дизајн со тоа име веќе постои.' }); }
  const d = { id: uid(), name, image: fileUrl(req.file) };
  (p.designs ||= []).push(d); save(); res.json(d);
});
app.put('/api/admin/products/:id/designs/:did', upload.single('image'), (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  const d = p?.designs?.find(x => x.id === req.params.did);
  if (!d) return res.status(404).json({ error: 'Не постои.' });
  const name = str(req.body.name, 80);
  if (name) d.name = name;
  if (req.file) { removeUpload(d.image); d.image = fileUrl(req.file); }
  save(); res.json(d);
});
app.delete('/api/admin/products/:id/designs/:did', (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  const d = p?.designs?.find(x => x.id === req.params.did);
  if (d) { removeUpload(d.image); p.designs = p.designs.filter(x => x !== d); save(); }
  res.json({ ok: true });
});

// Пакети
app.post('/api/admin/packages', (req, res) => {
  const b = req.body;
  const p = { id: uid(), name: str(b.name, 100), count: Math.max(1, Math.floor(num(b.count, 1))), price: num(b.price),
    description: str(b.description, 1000), active: b.active === undefined ? true : bool(b.active),
    choose: b.choose === undefined ? false : bool(b.choose) };
  if (!p.name) return res.status(400).json({ error: 'Внесете име.' });
  db.packages.push(p); save(); res.json(p);
});
app.put('/api/admin/packages/:id', (req, res) => {
  const p = db.packages.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Не постои.' });
  const b = req.body;
  if ('name' in b) p.name = str(b.name, 100);
  if ('count' in b) p.count = Math.max(1, Math.floor(num(b.count, 1)));
  if ('price' in b) p.price = num(b.price);
  if ('description' in b) p.description = str(b.description, 1000);
  if ('active' in b) p.active = bool(b.active);
  if ('choose' in b) p.choose = bool(b.choose);
  save(); res.json(p);
});
app.delete('/api/admin/packages/:id', (req, res) => {
  db.packages = db.packages.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

// Категории / прилики
app.post('/api/admin/categories', (req, res) => {
  const name = str(req.body?.name, 60);
  if (!name) return res.status(400).json({ error: 'Внесете име.' });
  const c = { id: uid(), name }; db.categories.push(c); save(); res.json(c);
});
app.put('/api/admin/categories/:id', (req, res) => {
  const c = db.categories.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Не постои.' });
  c.name = str(req.body?.name, 60) || c.name; save(); res.json(c);
});
app.delete('/api/admin/categories/:id', (req, res) => {
  db.categories = db.categories.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

// Галерија
app.post('/api/admin/gallery', upload.array('images', 5), (req, res) => {
  const added = (req.files || []).map(f => ({ id: uid(), image: fileUrl(f), caption: str(req.body.caption, 200),
    category: str(req.body.category, 60), createdAt: Date.now() }));
  db.gallery.push(...added); save(); res.json(added);
});
app.put('/api/admin/gallery/:id', (req, res) => {
  const g = db.gallery.find(x => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'Не постои.' });
  if ('caption' in req.body) g.caption = str(req.body.caption, 200);
  if ('category' in req.body) g.category = str(req.body.category, 60);
  save(); res.json(g);
});
app.delete('/api/admin/gallery/:id', (req, res) => {
  const g = db.gallery.find(x => x.id === req.params.id);
  if (g) removeUpload(g.image);
  db.gallery = db.gallery.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

// Рецензии
app.put('/api/admin/reviews/:id', (req, res) => {
  const r = db.reviews.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Не постои.' });
  r.approved = bool(req.body?.approved); save(); res.json(r);
});
app.delete('/api/admin/reviews/:id', (req, res) => {
  const r = db.reviews.find(x => x.id === req.params.id);
  if (r) removeUpload(r.photo);
  db.reviews = db.reviews.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

// Нарачки
app.put('/api/admin/orders/:id', (req, res) => {
  const o = db.orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Не постои.' });
  if ('status' in req.body) o.status = str(req.body.status, 30);
  if ('total' in req.body) o.total = req.body.total === '' ? null : num(req.body.total);
  if ('adminNote' in req.body) o.adminNote = str(req.body.adminNote, 2000);
  save(); res.json(o);
});
app.delete('/api/admin/orders/:id', (req, res) => {
  const o = db.orders.find(x => x.id === req.params.id);
  if (o && o.images) o.images.forEach(removeUpload);
  db.orders = db.orders.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

// Пораки
app.put('/api/admin/messages/:id', (req, res) => {
  const m = db.messages.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Не постои.' });
  m.read = bool(req.body?.read); save(); res.json(m);
});
app.delete('/api/admin/messages/:id', (req, res) => {
  db.messages = db.messages.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Сликата е преголема (макс. 8 MB) или има премногу слики.' });
  console.error(err); res.status(500).json({ error: 'Грешка на серверот.' });
});

(async () => {
  store = await createStore(ROOT);
  await loadDb();
  app.listen(PORT, () => console.log(`Sweet Moments работи на http://localhost:${PORT}  (складирање: ${store.kind === 'mongo' ? 'MongoDB' : 'локални датотеки'})`));
})().catch(e => { console.error('Серверот не може да стартува:', e.message); process.exit(1); });
