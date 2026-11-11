// Lee las carpetas y genera content.json. Uso local: node build.js
// (en GitHub se ejecuta solo con cada push, ver .github/workflows/publicar.yml)
const fs = require('fs'), path = require('path');

const CARPETAS = { 'portadas-album': 'album', 'videoclips': 'videoclip', 'visualizers': 'visualizer', 'personajes': 'personaje', 'reels': 'reel', 'blog': 'blog' };
const IMG = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
const nat = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const nom = s => s.replace(/^\d+[-_. ]+/, '');           // quita el prefijo de orden: "01-Nombre" -> "Nombre"
const base = f => f.replace(/(\.(jpe?g|png|webp|gif|svg|avif))+$/i, '').replace(/\.[^.]+$/, (m) => /^\.(jpe?g|png|webp|gif|svg|avif|txt|md)$/i.test(m) ? '' : m);   // también quita ".jpg.jpg" (Windows oculta extensiones)
const key = s => slug(nom(s));                           // "Mi Video.jpg" y "mi-video" se consideran el mismo nombre
const ls = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).filter(e => !e.name.startsWith('.')).sort((a, b) => nat(a.name, b.name)) : [];
const hue = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const used = new Set();
const uid = (cat, t) => { const b = cat + '-' + (slug(t) || 'item'); let id = b, n = 2; while (used.has(id)) id = b + '-' + n++; used.add(id); return id; };
const yt = u => (u.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/) || [])[1];

const items = [], posts = {};

for (const [dir, cat] of Object.entries(CARPETAS)) {
  const D = path.join(__dirname, dir), ents = ls(D);

  if (cat === 'blog') {
    for (const e of ents) {
      const isDir = e.isDirectory(), folder = isDir ? path.join(D, e.name) : D;
      let mdName, imgsF = [];
      if (isDir) {
        const f = ls(folder).filter(x => x.isFile());
        mdName = (f.find(x => /\.md$/i.test(x.name)) || {}).name;
        imgsF = f.filter(x => IMG.test(x.name)).map(x => x.name);
      } else if (/\.md$/i.test(e.name)) mdName = e.name;
      if (!mdName) continue;
      const rel = isDir ? `${dir}/${e.name}` : dir, raw = nom(isDir ? e.name : base(e.name));
      let md = fs.readFileSync(path.join(folder, mdName), 'utf8').replace(/^\uFEFF/, ''), title = raw;
      const m = md.match(/^\s*#\s+(.+)\r?\n/);            // la primera línea "# Título" es el título del post
      if (m) { title = m[1].trim(); md = md.slice(m[0].length); }
      const id = uid('blog', raw), map = {};
      imgsF.forEach(f => map[base(f).toLowerCase()] = `${rel}/${f}`);   // {{imagen1}} -> imagen1.jpg
      posts[id] = { title, md, imgs: map };
      const list = imgsF.map(f => `${rel}/${f}`);
      items.push({ id, cat, title, list, hue: hue(title), ratio: 1.15 });
    }
    continue;
  }

  const files = ents.filter(e => e.isFile()), dirs = ents.filter(e => e.isDirectory());
  const imgs = files.filter(e => IMG.test(e.name)), claimed = new Set();
  files.filter(e => !IMG.test(e.name) && !/\.txt$/i.test(e.name)).forEach(e => console.warn(`  AVISO: se ignora ${dir}/${e.name} (formato no soportado; usa jpg, png, webp, gif, svg o avif)`));
  const imgBy = new Map(imgs.map(e => [key(base(e.name)), e.name]));
  const dirBy = new Map(dirs.map(e => [key(e.name), e.name]));
  const links = files.filter(e => /\.txt$/i.test(e.name))
    .flatMap(e => fs.readFileSync(path.join(D, e.name), 'utf8').split(/\r?\n/))
    .map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  for (const l of links) {                                // "Título | URL | subtexto opcional"
    const p = l.split('|').map(s => s.trim());
    const [title, url, sub] = p.length > 1 ? p : [p[0], p[0]];
    const k = key(title), f = imgBy.get(k);
    const it = { id: uid(cat, title), cat, title: nom(title), url, hue: hue(title), ratio: 0.5625 };
    if (sub) it.sub = sub;
    if (f) claimed.add('f:' + f);
    if (dirBy.has(k)) {                                   // carpeta con el nombre del video = fotos que pasan como gif
      const d2 = dirBy.get(k); claimed.add('d:' + d2);
      const fl = ls(path.join(D, d2)).filter(x => x.isFile() && IMG.test(x.name)).map(x => `${dir}/${d2}/${x.name}`);
      if (fl.length) { it.list = fl; it.img = fl[0]; it.local = true; }
      else console.warn(`  AVISO: la carpeta ${dir}/${d2} existe pero no tiene imágenes válidas (usa jpg, png, webp, gif, svg o avif; HEIC no funciona en la web)`);
    }
    if (!it.img && f) { it.img = `${dir}/${f}`; it.local = true; }   // imagen con el nombre del video = miniatura
    if (!it.img && yt(url)) it.img = `https://i.ytimg.com/vi/${yt(url)}/hqdefault.jpg`;  // si no, la de YouTube
    items.push(it);
    console.log(`  ${dir}: "${it.title}" -> ${it.list ? it.list.length + ' foto(s) de carpeta' : it.local ? 'imagen propia' : it.img ? 'miniatura de YouTube (no encontró imagen ni carpeta con ese nombre)' : 'SIN miniatura'}`);
  }
  for (const e of imgs) if (!claimed.has('f:' + e.name) && links.length && cat !== 'album' && cat !== 'personaje') console.warn(`  AVISO: la imagen ${dir}/${e.name} no coincide con ningún título de enlaces.txt, se muestra como foto aparte`);
  for (const e of imgs) if (!claimed.has('f:' + e.name))   // imágenes sueltas = fotos con zoom
    items.push({ id: uid(cat, base(e.name)), cat, title: nom(base(e.name)), img: `${dir}/${e.name}`, local: true, hue: hue(e.name), ratio: 1 });
  for (const e of dirs) if (!claimed.has('d:' + e.name)) { // carpetas sueltas = foto animada
    const fl = ls(path.join(D, e.name)).filter(x => x.isFile() && IMG.test(x.name)).map(x => `${dir}/${e.name}/${x.name}`);
    if (fl.length) items.push({ id: uid(cat, e.name), cat, title: nom(e.name), list: fl, img: fl[0], local: true, hue: hue(e.name), ratio: 1 });
  }
}

// Redes sociales: redes/redes.txt con "Nombre | URL" + icono opcional con el mismo nombre (TikTok.svg)
const redes = [];
{
  const D = path.join(__dirname, 'redes'), ents = ls(D);
  const icons = new Map(ents.filter(e => e.isFile() && IMG.test(e.name)).map(e => [key(base(e.name)), e.name]));
  for (const e of ents.filter(e => e.isFile() && /\.txt$/i.test(e.name)))
    for (const l of fs.readFileSync(path.join(D, e.name), 'utf8').split(/\r?\n/).map(x => x.trim()).filter(x => x && !x.startsWith('#'))) {
      const [name, url] = l.split('|').map(s => s.trim()); if (!url) continue;
      const f = icons.get(key(name)); redes.push({ name, url, ...(f ? { icon: 'redes/' + f } : {}) });
    }
}
const out = path.join(__dirname, 'content.json'), json = JSON.stringify({ items, posts, redes });
if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== json) fs.writeFileSync(out, json);   // no reescribe si no cambió
const n = {}; items.forEach(i => n[i.cat] = (n[i.cat] || 0) + 1);
console.log('content.json listo:', items.length, 'elementos', n);
