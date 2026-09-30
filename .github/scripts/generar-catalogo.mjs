// Lee la carpeta multimedia/ y genera multimedia/catalogo.js
// Lo ejecuta GitHub Actions automáticamente (no hace falta correrlo a mano).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'multimedia');
const IMG = /\.(png|jpe?g|webp|gif)$/i, VID = /\.(mp4|webm)$/i;
const GRAD = ['linear-gradient(135deg,#1D2438,#4B5470)', 'linear-gradient(135deg,#F5A524,#B0208A)', 'linear-gradient(135deg,#7E93AD,#DCE6F2)',
  'linear-gradient(135deg,#0F2440,#1F6FEB)', 'linear-gradient(135deg,#2F80ED,#1D2438)', 'linear-gradient(135deg,#F07F1A,#7A4A1D)'];
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const nice = n => n.replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' ').trim();
const q = p => p.split('/').map(encodeURIComponent).join('/');
const sort = a => a.sort((x, y) => x.localeCompare(y));

function leer(file) {
  const d = {};
  if (!fs.existsSync(file)) return d;
  for (const l of fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const i = l.indexOf(':');
    if (i > 0) d[norm(l.slice(0, i))] = l.slice(i + 1).trim();
  }
  return d;
}

const items = [], avisos = []; let n = 0;
for (const [carpeta, def] of [['imagenes', 'foto'], ['videos', 'video']]) {
  const dir = path.join(ROOT, carpeta);
  if (!fs.existsSync(dir)) { avisos.push(`No encontré la carpeta "${carpeta}".`); continue; }
  for (const nombre of sort(fs.readdirSync(dir))) {
    const p = path.join(dir, nombre);
    if (!fs.statSync(p).isDirectory()) continue;
    const archivos = sort(fs.readdirSync(p));
    const principal = archivos.find(f => (def === 'foto' ? IMG : VID).test(f));
    if (!principal) { avisos.push(`${nombre}: falta ${def === 'foto' ? 'la imagen' : 'el video'}`); continue; }
    const portada = def === 'video' ? archivos.find(f => IMG.test(f)) : null;
    const datos = leer(path.join(p, 'datos.txt'));
    const base = `multimedia/${carpeta}/${nombre}/`, tipo = norm(datos.tipo || '');
    items.push({
      t: datos.titulo || nice(nombre), k: ['foto', 'video', 'timelapse'].includes(tipo) ? tipo : def,
      src: q(base + principal), poster: portada ? q(base + portada) : '',
      lugar: datos.lugar || '', fecha: datos.fecha || '', autor: datos.autor || '', desc: datos.descripcion || '',
      g: GRAD[n++ % GRAD.length]
    });
  }
}
fs.mkdirSync(ROOT, { recursive: true });
fs.writeFileSync(path.join(ROOT, 'catalogo.js'),
  '/* Archivo generado automáticamente. No lo edites a mano. */\nconst MEDIA_CATALOGO = ' + JSON.stringify(items, null, 2) + ';\n');
console.log(`Catálogo actualizado: ${items.length} elemento(s).`);
avisos.forEach(a => console.log('Aviso:', a));
