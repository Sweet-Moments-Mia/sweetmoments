// Складирање на податоци и слики.
//  - Со MONGODB_URI → MongoDB Atlas (податоци во колекции, слики во GridFS)
//  - Без MONGODB_URI → локално (data/db.json и папка uploads/)
const fs = require('fs');
const path = require('path');

const COLLECTIONS = ['categories', 'products', 'packages', 'gallery', 'reviews', 'orders', 'messages'];
const META = ['settings', 'admin', 'orderSeq', 'catalogVersion'];

// ---------------- Локален режим ----------------
function fileStore(root) {
  const dataDir = path.join(root, 'data');
  const dbFile = path.join(dataDir, 'db.json');
  const uploadDir = path.join(root, 'uploads');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });
  return {
    kind: 'file',
    async load() { return fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : null; },
    save(db) {
      const tmp = dbFile + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
      fs.renameSync(tmp, dbFile);
    },
    async flush() {},
    async putFile(name, buffer) { await fs.promises.writeFile(path.join(uploadDir, name), buffer); },
    async removeFile(name) { await fs.promises.rm(path.join(uploadDir, path.basename(name)), { force: true }); },
    serveFile(name, res, next) {
      const p = path.join(uploadDir, path.basename(name));
      if (!fs.existsSync(p)) return next();
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.sendFile(p);
    }
  };
}

// ---------------- MongoDB режим ----------------
async function mongoStore(uri, root) {
  const { MongoClient, GridFSBucket } = require('mongodb');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const mdb = client.db(process.env.MONGODB_DB || 'sweetmoments');
  const bucket = new GridFSBucket(mdb, { bucketName: 'uploads' });
  const meta = mdb.collection('meta');

  // снимка од последно зачуваната состојба – се праќаат само промените
  const snap = { meta: {}, docs: {} };
  const remember = db => {
    for (const k of META) snap.meta[k] = JSON.stringify(db[k] ?? null);
    for (const c of COLLECTIONS) snap.docs[c] = new Map((db[c] || []).map(d => [d.id, JSON.stringify(d)]));
  };

  async function persist(db) {
    for (const k of META) {
      const j = JSON.stringify(db[k] ?? null);
      if (snap.meta[k] !== j) {
        await meta.replaceOne({ _id: k }, { _id: k, value: db[k] ?? null }, { upsert: true });
        snap.meta[k] = j;
      }
    }
    for (const c of COLLECTIONS) {
      const prev = snap.docs[c] || new Map();
      const next = new Map();
      const ops = [];
      (db[c] || []).forEach((d, i) => {
        const j = JSON.stringify(d);
        next.set(d.id, j);
        if (prev.get(d.id) !== j) ops.push({ replaceOne: { filter: { _id: d.id }, replacement: { _id: d.id, pos: i, doc: d }, upsert: true } });
      });
      const removed = [...prev.keys()].filter(id => !next.has(id));
      if (removed.length) ops.push({ deleteMany: { filter: { _id: { $in: removed } } } });
      if (ops.length) await mdb.collection(c).bulkWrite(ops, { ordered: false });
      snap.docs[c] = next;
    }
  }

  // записите се редат еден по друг
  let chain = Promise.resolve();
  const store = {
    kind: 'mongo',
    async load() {
      const metas = await meta.find().toArray();
      if (!metas.length) return null;
      const db = {};
      for (const k of META) db[k] = metas.find(m => m._id === k)?.value ?? undefined;
      for (const c of COLLECTIONS) {
        const rows = await mdb.collection(c).find().sort({ pos: 1 }).toArray();
        db[c] = rows.map(r => r.doc);
      }
      remember(db);
      return db;
    },
    save(db) {
      chain = chain.then(() => persist(db)).catch(e => console.error('Грешка при зачувување во MongoDB:', e.message));
      return chain;
    },
    flush() { return chain; },
    putFile(name, buffer, contentType) {
      return new Promise((resolve, reject) => {
        const up = bucket.openUploadStream(name, { metadata: { contentType } });
        up.on('error', reject).on('finish', resolve);
        up.end(buffer);
      });
    },
    async removeFile(name) {
      const files = await bucket.find({ filename: path.basename(name) }).toArray();
      for (const f of files) await bucket.delete(f._id);
    },
    async serveFile(name, res, next) {
      const f = (await bucket.find({ filename: path.basename(name) }).limit(1).toArray())[0];
      if (!f) return next();
      res.setHeader('Content-Type', f.metadata?.contentType || 'image/jpeg');
      res.setHeader('Content-Length', f.length);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      bucket.openDownloadStream(f._id).on('error', () => res.end()).pipe(res);
    },
    // Еднократен пренос на локалните податоци и слики во празна MongoDB база
    async importLocal(localDb) {
      const uploadDir = path.join(root, 'uploads');
      if (fs.existsSync(uploadDir)) {
        for (const name of fs.readdirSync(uploadDir)) {
          const ext = path.extname(name).toLowerCase();
          const type = { '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }[ext] || 'image/jpeg';
          await store.putFile(name, fs.readFileSync(path.join(uploadDir, name)), type);
        }
      }
      remember({});
      await persist(localDb);
    }
  };
  return store;
}

async function createStore(root) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return fileStore(root);
  return mongoStore(uri, root);
}

module.exports = { createStore };
