/* ===== JS COMPARTIDO CMA ===== */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Menú móvil */
const menu = $('#menu');
$('#burger').onclick = () => menu.classList.toggle('open');

/* Cabecera + barra de progreso */
const header = $('header'), bar = $('#progress');
addEventListener('scroll', () => {
  header.classList.toggle('scrolled', scrollY > 20);
  bar.style.width = (scrollY / Math.max(1, document.body.scrollHeight - innerHeight) * 100) + '%';
}, { passive: true });

/* Aparición al hacer scroll */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .15 });
$$('.reveal').forEach(el => io.observe(el));

/* Aviso emergente */
let tt;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2800);
}

/* Inclinación 3D en tarjetas */
$$('.card').forEach(c => {
  c.addEventListener('pointermove', e => {
    if (reduce) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(700px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
  });
  c.addEventListener('pointerleave', () => c.style.transform = '');
});

$('#year').textContent = new Date().getFullYear();

/* ===== CIELO ANIMADO (solo en inicio) ===== */
const cv = $('#sky');
if (cv) {
  const ctx = cv.getContext('2d'), hero = $('.hero');
  let W, H, parts = [], clouds = [], mode = 'sol', flash = 0;
  const title = $('#title');
  title.innerHTML = title.textContent.split(' ').map((w, i) => `<span class="w" style="animation-delay:${i * .12}s">${w}</span>`).join(' ');

  function resize() {
    const d = devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    clouds = Array.from({ length: 6 }, (_, i) => ({ x: Math.random() * W, y: 40 + i * 38 + Math.random() * 30, s: .6 + Math.random() * 1.1, v: .1 + Math.random() * .25 }));
    seed();
  }
  function seed() {
    const n = mode === 'lluvia' ? 160 : mode === 'tormenta' ? 320 : mode === 'nieve' ? 130 : 0;
    parts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 10 + Math.random() * 14, v: 8 + Math.random() * 8, r: 1 + Math.random() * 2.5, dx: Math.random() * 2 }));
  }
  function cloud(c, alpha) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    [[0, 0, 46], [46, -14, 38], [88, 0, 44], [44, 10, 40]].forEach(([dx, dy, r]) => {
      ctx.beginPath(); ctx.arc(c.x + dx * c.s, c.y + dy * c.s, r * c.s, 0, 6.283); ctx.fill();
    });
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    if (mode === 'sol') {
      const g = ctx.createRadialGradient(W * .8, H * .2, 10, W * .8, H * .2, 260);
      g.addColorStop(0, 'rgba(255,224,130,1)'); g.addColorStop(.25, 'rgba(255,200,80,.5)'); g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const dark = mode === 'tormenta';
    clouds.forEach(c => { c.x += c.v; if (c.x > W + 120) c.x = -220; cloud(c, dark ? .16 : mode === 'sol' ? .45 : .3); });
    ctx.strokeStyle = 'rgba(200,225,255,.7)'; ctx.fillStyle = '#fff';
    parts.forEach(p => {
      if (mode === 'nieve') { p.y += p.v * .18; p.x += Math.sin(p.y / 30) * .6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      else { p.y += p.v; p.x -= p.dx; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.dx * 1.4, p.y - p.l); ctx.stroke(); }
      if (p.y > H) { p.y = -20; p.x = Math.random() * W; }
      if (p.x < 0) p.x = W;
    });
    if (dark && !reduce && Math.random() < .006) flash = 1;
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * .7})`; ctx.fillRect(0, 0, W, H); flash -= .06; }
    if (!reduce) requestAnimationFrame(frame);
  }
  $$('.modes button').forEach(b => b.onclick = () => {
    mode = b.dataset.mode; hero.dataset.mode = mode;
    $$('.modes button').forEach(x => x.setAttribute('aria-pressed', x === b));
    seed(); if (reduce) frame();
  });
  addEventListener('resize', resize); resize(); frame();
}

/* ===== HERRAMIENTAS ===== */
const num = id => parseFloat($(id).value.replace(',', '.'));
const fmt = (n, d = 1) => isFinite(n) ? n.toLocaleString('es-AR', { maximumFractionDigits: d }) : null;
const BEAUFORT = [[1, 0, 'Calma'], [6, 1, 'Ventolina'], [12, 2, 'Brisa muy débil'], [20, 3, 'Brisa débil'], [29, 4, 'Brisa moderada'], [39, 5, 'Brisa fresca'],
  [50, 6, 'Brisa fuerte'], [62, 7, 'Viento fuerte'], [75, 8, 'Temporal'], [89, 9, 'Temporal fuerte'], [103, 10, 'Temporal duro'], [118, 11, 'Temporal muy duro'], [Infinity, 12, 'Huracán']];

if ($('#tTemp')) {
  const show = (id, txt) => $(id).textContent = txt || 'Ingresa un número válido.';
  $('#tTemp').oninput = () => { const c = num('#tTemp'), r = fmt(c * 9 / 5 + 32), k = fmt(c + 273.15, 2);
    show('#oTemp', r && `${fmt(c)} °C = ${r} °F = ${k} K`); };
  $('#tWind').oninput = () => {
    const k = num('#tWind'); const r = fmt(k / 1.852), m = fmt(k / 3.6);
    show('#oWind', r && `${fmt(k)} km/h = ${r} nudos = ${m} m/s`);
    const idx = BEAUFORT.findIndex(b => k < b[0]);
    $$('#beaufort tr[data-b]').forEach(tr => tr.classList.toggle('hit', isFinite(k) && +tr.dataset.b === BEAUFORT[idx]?.[1]));
  };
  const dew = () => { const T = num('#dT'), RH = num('#dH');
    if (!isFinite(T) || !(RH > 0 && RH <= 100)) return show('#oDew', 'Ingresa temperatura y humedad (1 a 100 %).');
    const a = 17.62, b = 243.12, g = Math.log(RH / 100) + a * T / (b + T);
    show('#oDew', `Punto de rocío: ${fmt(b * g / (a - g))} °C`); };
  $('#dT').oninput = dew; $('#dH').oninput = dew;
  const chill = () => { const T = num('#wT'), v = num('#wV');
    if (!isFinite(T) || !isFinite(v)) return show('#oChill');
    if (T > 10 || v < 4.8) return show('#oChill', 'La fórmula aplica con 10 °C o menos y viento de 4,8 km/h o más.');
    const p = Math.pow(v, .16);
    show('#oChill', `Sensación térmica: ${fmt(13.12 + .6215 * T - 11.37 * p + .3965 * T * p)} °C`); };
  $('#wT').oninput = chill; $('#wV').oninput = chill;
}

/* ===== FORMULARIO ===== */
const form = $('#form');
if (form) form.addEventListener('submit', e => {
  e.preventDefault(); let ok = true;
  const rules = {
    n: v => v.trim().length >= 2 || 'Escribe tu nombre (mínimo 2 letras).',
    e: v => /^\S+@\S+\.\S+$/.test(v) || 'Escribe un correo válido, por ejemplo nombre@correo.com.',
    m: v => v.trim().length >= 10 || 'El mensaje necesita al menos 10 caracteres.'
  };
  for (const k in rules) {
    const i = form.elements[k], r = rules[k](i.value), err = i.parentElement.querySelector('.err');
    err.textContent = r === true ? '' : r;
    if (r !== true) { ok = false; i.classList.remove('shake'); void i.offsetWidth; i.classList.add('shake'); }
  }
  if (ok) { toast('Mensaje listo ✔ (conecta el formulario a tu servicio para enviarlo)'); form.reset(); }
});

/* ===== ALERTAS ===== */
const LV = {
  y: { c: 'lvl-y', n: 'Amarillo', t: 'Fenómenos meteorológicos peligrosos de intensidad baja o media, con capacidad de causar daños puntuales.',
    a: ['Consultá el pronóstico y los avisos del SMN.', 'Asegurá objetos sueltos en balcones y patios.', 'Planificá tus actividades al aire libre con margen.'] },
  o: { c: 'lvl-o', n: 'Naranja', t: 'Fenómenos peligrosos de intensidad importante, con riesgo para las personas y daños posibles.',
    a: ['Evitá salir si no es necesario.', 'Alejate de árboles, carteles y cables.', 'Tené linterna, celular cargado y agua a mano.'] },
  r: { c: 'lvl-r', n: 'Rojo', t: 'Fenómenos extremos con riesgo grave para las personas y daños importantes.',
    a: ['Quedate en un lugar seguro y cerrado.', 'Seguí solo las indicaciones de Defensa Civil y del SMN.', 'No cruces zonas anegadas ni manejes si no es imprescindible.'] }
};
const lvlBox = $('#lvl');
if (lvlBox) {
  const showLv = k => { const l = LV[k];
    lvlBox.className = 'lvl ' + l.c;
    lvlBox.innerHTML = `<h3>Alerta ${l.n}</h3><p>${l.t}</p><ul>${l.a.map(x => `<li>${x}</li>`).join('')}</ul>`; };
  $$('#lvlChips .chip').forEach(b => b.onclick = () => {
    $$('#lvlChips .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); showLv(b.dataset.lv); });
  showLv('y');

  /* Lista de emergencia con progreso guardado */
  const boxes = $$('#checks input');
  let store = []; try { store = JSON.parse(localStorage.getItem('cma-check') || '[]'); } catch (e) {}
  const upd = () => {
    const n = boxes.filter(b => b.checked).length;
    $('#meter').style.width = (n / boxes.length * 100) + '%';
    $('#meterTxt').textContent = `${n} de ${boxes.length} listos`;
    try { localStorage.setItem('cma-check', JSON.stringify(boxes.map(b => b.checked))); } catch (e) {}
  };
  boxes.forEach((b, i) => { b.checked = !!store[i]; b.onchange = upd; }); upd();

  /* Generador de avisos */
  let last = '';
  $('#alertForm').addEventListener('submit', e => {
    e.preventDefault();
    const zone = $('#aZone').value.trim(), time = $('#aTime').value.trim();
    if (zone.length < 3) { toast('Escribí la zona del aviso.'); $('#aZone').focus(); return; }
    last = `⚠️ Aviso de la comunidad CMA\nFenómeno: ${$('#aType').value}\nZona: ${zone}\nHorario: ${time || 'sin definir'}\nNivel oficial: ${$('#aLevel').value}\nEste aviso es comunitario y no reemplaza al oficial. Consultá: https://www.smn.gob.ar\n#CMA #ClimaArgentina`;
    $('#alertMsg').textContent = last;
  });
  $('#copyAlert').onclick = () => copyText(last, 'Generá el mensaje primero.');
}
function copyText(txt, empty) {
  if (!txt) return toast(empty);
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
    .then(() => toast('Copiado ✔')).catch(() => toast('No se pudo copiar. Seleccioná el texto a mano.'));
}

/* ===== RADARES: dBZ ===== */
const dbz = $('#dbz');
if (dbz) {
  const rules = [[20, 'Lluvia muy débil o llovizna.'], [30, 'Lluvia débil.'], [40, 'Lluvia moderada.'], [50, 'Lluvia fuerte.'],
    [55, 'Lluvia muy intensa; puede haber granizo pequeño.'], [Infinity, 'Valores típicos de tormentas severas; el granizo es probable.']];
  const upd = () => { const v = +dbz.value;
    $('#dbzVal').textContent = v; $('#dbzMark').style.left = ((v - 5) / 65 * 100) + '%';
    $('#dbzTxt').textContent = rules.find(r => v < r[0])[1]; };
  dbz.oninput = upd; upd();
}

/* ===== REDES: hashtags ===== */
if ($('#copyTags')) $('#copyTags').onclick = () => copyText($('#tags').textContent);

/* ===== MULTIMEDIA ===== */
/* Los datos salen de multimedia/catalogo.js, que se genera leyendo la carpeta "multimedia"
   (con actualizar-multimedia.html o actualizar_multimedia.py). No hace falta editar nada acá. */
const MEDIA = typeof MEDIA_CATALOGO !== 'undefined' ? MEDIA_CATALOGO : [];
const gal = $('#gal');
if (gal) {
  const tagOf = { foto: '📷 Foto', video: '🎬 Video', timelapse: '⏱️ Timelapse' };
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const info = m => [m.lugar, m.fecha, m.autor].filter(Boolean).map(esc).join(' · ');
  const media = (m, full) => {
    if (m.k === 'foto') return m.src ? `<img src="${esc(m.src)}" alt="${esc(m.t)}" onerror="this.remove()">` : '';
    if (full) return m.src ? `<video src="${esc(m.src)}" controls autoplay onerror="this.remove()"></video>` : '';
    if (m.poster) return `<img src="${esc(m.poster)}" alt="${esc(m.t)}" onerror="this.remove()">`;
    return m.src ? `<video src="${esc(m.src)}#t=0.1" muted preload="metadata" onerror="this.remove()"></video>` : '';
  };
  if (!MEDIA.length) gal.innerHTML = '<p class="lead">Todavía no hay material en la galería.</p>';
  else gal.innerHTML = MEDIA.map((m, i) => `<button class="thumb" data-i="${i}" data-k="${esc(m.k)}" style="--g:${m.g}">${media(m)}<span class="tag">${tagOf[m.k] || ''}</span><span style="position:relative">${esc(m.t)}<small style="display:block;font:400 .8rem var(--f-body);opacity:.9">${info(m)}</small></span></button>`).join('');
  $$('#mFilters .chip').forEach(b => b.onclick = () => {
    $$('#mFilters .chip').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.thumb').forEach(t => t.classList.toggle('hide', b.dataset.f !== 'todo' && t.dataset.k !== b.dataset.f));
  });
  const lb = $('#lb'); let cur = 0;
  const vis = () => $$('.thumb').filter(t => !t.classList.contains('hide')).map(t => +t.dataset.i);
  const open = i => { cur = i; const m = MEDIA[i];
    $('#lbStage').style.setProperty('--g', m.g);
    $('#lbStage').innerHTML = media(m, true) || `<span>${esc(m.t)}</span>`;
    $('#lbCap').innerHTML = `${tagOf[m.k] || ''} · <strong>${esc(m.t)}</strong>` + (info(m) ? `<br>${info(m)}` : '') + (m.desc ? `<br><span style="opacity:.85">${esc(m.desc)}</span>` : '');
    lb.classList.add('open'); };
  const close = () => { lb.classList.remove('open'); $('#lbStage').innerHTML = ''; };
  const step = d => { const v = vis(); if (v.length) open(v[(v.indexOf(cur) + d + v.length) % v.length]); };
  gal.onclick = e => { const t = e.target.closest('.thumb'); if (t) open(+t.dataset.i); };
  $('#lbX').onclick = close; $('#lbP').onclick = () => step(-1); $('#lbN').onclick = () => step(1);
  lb.onclick = e => { if (e.target === lb) close(); };
  addEventListener('keydown', e => { if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
}

/* ===== CONFIGURACIÓN DE ENLACES (editá acá) ===== */
const CMA = {
  whatsapp: '',   // Pegá acá el enlace del canal, por ejemplo: 'https://whatsapp.com/channel/XXXXXXXX'
  tiktok: 'https://www.tiktok.com/@meteolauoficial'
};
$$('[data-link]').forEach(a => {
  const url = CMA[a.dataset.link];
  if (url) a.href = url;
  else { a.href = '#'; a.onclick = e => { e.preventDefault(); toast('Falta configurar este enlace en script.js (objeto CMA).'); }; }
});

/* ===== CONTACTO: generador de mensaje ===== */
const sf = $('#sendForm');
if (sf) {
  let lastMsg = '';
  sf.addEventListener('submit', e => {
    e.preventDefault();
    const place = $('#sPlace').value.trim(), when = $('#sWhen').value.trim(), name = $('#sName').value.trim();
    if (place.length < 3 || when.length < 2) { toast('Completá lugar y fecha/hora.'); return; }
    lastMsg = `Hola CMA 👋 Les envío material.\nQué muestra: ${$('#sType').value}\nLugar: ${place}\nFecha y hora: ${when}\nCrédito: ${name || 'anónimo'}`;
    $('#sendMsg').textContent = lastMsg;
  });
  $('#copySend').onclick = () => copyText(lastMsg, 'Generá el mensaje primero.');
}

/* ===== RADARES: clasificador y tipos de tormenta ===== */
const clsForm = $('#clsForm');
if (clsForm) {
  clsForm.addEventListener('submit', e => {
    e.preventDefault();
    const shape = $('#cShape').value, d = num('#cDbz'), hook = $('#cHook').value === 'si', bow = $('#cBow').value === 'si', rot = $('#cRot').value === 'si';
    if (!isFinite(d) || d < 0 || d > 80) { toast('Ingresá los dBZ máximos (0 a 80).'); return; }
    let c = '#F5C400', t, p;
    if (shape === 'area' && d < 40) { c = '#3DA65A'; t = 'Lluvia estratiforme'; p = 'Lluvia continua y pareja, sin convección fuerte. Riesgo bajo, salvo acumulados altos por duración.'; }
    else if (shape === 'line') {
      if (bow) { c = '#D62E2E'; t = 'Línea de turbonada con eco en arco'; p = 'Riesgo de vientos lineales fuertes y dañinos donde el arco es más pronunciado. Además, lluvia intensa.'; }
      else if (d >= 45) { c = '#F07F1A'; t = 'Línea de tormentas (frente de turbonada)'; p = 'Ráfagas fuertes al pasar la línea, lluvia intensa y posible granizo.'; }
      else { t = 'Línea de chubascos'; p = 'Chaparrones y algo de viento, en general de corta duración.'; }
    } else if (hook || (rot && d >= 50)) { c = '#D62E2E'; t = 'Posible supercelda'; p = 'Hay signos de rotación. Riesgo de granizo grande, vientos severos y, en casos, tornado. Buscá la alerta oficial y quedate en un lugar seguro.'; }
    else if (d >= 55) { c = '#D62E2E'; t = 'Tormenta severa con granizo probable'; p = 'Núcleo muy intenso. Posible granizo y ráfagas fuertes. Seguí los avisos del SMN.'; }
    else if (d >= 40) { c = '#F07F1A'; t = shape === 'group' ? 'Multicelda' : 'Tormenta fuerte'; p = 'Lluvia fuerte y actividad eléctrica. Puede haber ráfagas y granizo pequeño.'; }
    else { t = 'Chubasco o tormenta ordinaria'; p = 'Convección débil o moderada. Lluvia de corta duración y algo de actividad eléctrica.'; }
    const o = $('#clsOut'); o.style.setProperty('--c', c);
    o.innerHTML = `<h3>${t}</h3><p>${p}</p>`;
    o.style.animation = 'none'; void o.offsetWidth; o.style.animation = '';
  });
  const ST = {
    'Celda ordinaria': ['#3DA65A', 'Tormenta de una sola celda que dura de 30 a 60 minutos. En el radar es un núcleo aislado y compacto. Suele dar lluvia y rayos, rara vez es severa.'],
    'Multicelda': ['#F07F1A', 'Grupo de celdas en distintas etapas. Cuando una muere, otra nace a su lado. Puede dar lluvia intensa, granizo y ráfagas por varias horas.'],
    'Línea de turbonada': ['#F07F1A', 'Línea larga de tormentas, a menudo delante de un frente frío. En el radar es una franja continua. Trae ráfagas fuertes y lluvia intensa.'],
    'Supercelda': ['#D62E2E', 'Tormenta con corriente ascendente en rotación (mesociclón). En el radar puede verse un gancho y rotación en velocidad. Es la que más produce granizo grande y tornados.'],
    'Complejo convectivo': ['#D62E2E', 'Gran agrupación de tormentas que actúa como un sistema, muchas veces de noche. Puede cubrir zonas enormes y dar lluvias extremas y vientos fuertes.']
  };
  const chips = $('#stChips'), box = $('#stBox');
  const showSt = k => { box.style.setProperty('--c', ST[k][0]); box.innerHTML = `<h3>${k}</h3><p>${ST[k][1]}</p>`;
    $$('.chip', chips).forEach(x => x.setAttribute('aria-pressed', x.textContent === k)); };
  Object.keys(ST).forEach(k => { const b = document.createElement('button'); b.className = 'chip'; b.textContent = k; b.onclick = () => showSt(k); chips.append(b); });
  showSt('Celda ordinaria');
}

/* ===== RADAR WINDY ===== */
const wf = $('#wFrame');
if (wf) {
  let reg = [-38, -64, 4], layer = 'radar';
  const load = () => {
    const [lat, lon, z] = reg;
    const prod = layer === 'radar' ? '&product=radar' : '';
    wf.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=${z}&level=surface&overlay=${layer}${prod}&menu=&message=true&marker=&calendar=now&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
    $('#wOpen').href = `https://www.windy.com/${lat}/${lon}?${layer},${lat},${lon},${z}`;
  };
  $$('#wRegion .chip').forEach(b => b.onclick = () => { reg = b.dataset.r.split(',').map(Number);
    $$('#wRegion .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); load(); });
  $$('#wLayer .chip').forEach(b => b.onclick = () => { layer = b.dataset.l;
    $$('#wLayer .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); load(); });
  load();
}
