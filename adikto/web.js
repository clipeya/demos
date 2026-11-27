/* web.js · Adikto demo · comportamiento de index.html (entrada, walk-in, artistas, agenda, formulario, antes/después)
   Entra: window.Adikto (app.js). Sale: la página viva. Se prueba con prueba_demo.py. */
(function () {
  const A = window.Adikto;
  const $ = s => document.querySelector(s);
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 1. Entrada: la gota cae, se abre en mancha y aparece el logo ---------- */
  const intro = $('#intro'), fijo = $('.intro-fijo'), gota = $('#gota'), mancha = $('#mancha circle'), aguja = $('#aguja');
  function pintarIntro() {
    const r = intro.getBoundingClientRect();
    const total = intro.offsetHeight - innerHeight;
    const p = reducido ? 1 : Math.min(1, Math.max(0, -r.top / (total || 1)));
    const caida = Math.min(1, p / 0.35);                 // 0-35 %: cae la gota
    const abre = Math.min(1, Math.max(0, (p - 0.3) / 0.35)); // 30-65 %: se abre la mancha
    const logo = Math.min(1, Math.max(0, (p - 0.5) / 0.25));
    const resto = Math.min(1, Math.max(0, (p - 0.7) / 0.2));
    gota.setAttribute('transform', 'translate(0,' + (190 + caida * 310) + ') scale(' + (1 - abre) + ')');
    gota.style.transformOrigin = '200px 50px';
    aguja.setAttribute('transform', 'translate(0,' + (-caida * 40) + ')');
    mancha.setAttribute('r', String(1 + Math.pow(abre, 1.6) * 720));
    fijo.style.setProperty('--p', logo.toFixed(3));
    fijo.style.setProperty('--p1', Math.min(1, p * 4).toFixed(3));
    fijo.style.setProperty('--p2', resto.toFixed(3));
  }
  let pend = false;
  addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; pintarIntro(); }); } }, { passive: true });
  addEventListener('resize', pintarIntro);
  pintarIntro();

  /* ---------- 2. Walk-in hoy ---------- */
  function pintarWalkin() {
    const w = A.walkin(); const L = $('#walkinLista');
    if (!w.abierto) { L.innerHTML = '<div class="wk-cerrado">Ahora el estudio está cerrado. Abrimos de martes a sábado, de 10:00 a 20:30. Mira los huecos de la semana en la agenda.</div>'; return; }
    if (!w.libres.length) { L.innerHTML = '<div class="wk-cerrado">Ahora mismo están todos con clientes (' + w.franja.ini + '-' + w.franja.fin + '). Mira el siguiente hueco libre en la agenda.</div>'; return; }
    L.innerHTML = w.libres.map(t => '<div class="wk"><div><span class="punto"></span><b>' + esc(t.nombre) + '</b><small>Libre ' + w.franja.ini + '-' + w.franja.fin + ' · ven sin cita</small></div><a class="btn btn-borde" href="#agenda" data-ver="' + t.id + '">Agenda</a></div>').join('');
  }

  /* ---------- 3. Artistas: una parada del scroll por tatuador ---------- */
  function arte(seed, tipo) {
    // Pieza de muestra dibujada (no es foto real): lámina de flash en línea clara sobre fondo carbón.
    const sombra = '<radialGradient id="s' + seed + '" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#2a2a2a"/><stop offset="1" stop-color="#0d0d0d"/></radialGradient>';
    const rel = '<linearGradient id="r' + seed + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2efe9" stop-opacity=".55"/><stop offset="1" stop-color="#f2efe9" stop-opacity="0"/></linearGradient>';
    const F = 'url(#r' + seed + ')';
    const formas = {
      ojo: '<path d="M40 200 C 95 128 205 128 260 200 C 205 272 95 272 40 200 Z"/><circle cx="150" cy="200" r="42" fill="' + F + '"/><circle cx="150" cy="200" r="17" fill="#f2efe9" stroke="none"/><circle cx="141" cy="191" r="5" fill="#0d0d0d" stroke="none"/><path d="M70 160 L58 140 M100 140 L94 118 M150 132 L150 108 M200 140 L206 118 M230 160 L242 140"/><path d="M150 268 C 142 290 140 300 150 312 C 160 300 158 290 150 268 Z" fill="' + F + '"/>',
      luna: '<path d="M178 95 A 112 112 0 1 0 178 305 A 88 88 0 1 1 178 95 Z" fill="' + F + '"/><path d="M228 140 L234 158 L252 158 L238 170 L244 188 L228 177 L212 188 L218 170 L204 158 L222 158 Z"/><circle cx="236" cy="236" r="3" fill="#f2efe9"/><circle cx="214" cy="268" r="2" fill="#f2efe9"/><circle cx="252" cy="210" r="2" fill="#f2efe9"/>',
      daga: '<path d="M150 62 L168 236 L150 262 L132 236 Z" fill="' + F + '"/><path d="M150 70 L150 248"/><rect x="104" y="236" width="92" height="14" rx="7"/><rect x="140" y="250" width="20" height="66" rx="5"/><path d="M140 266 L160 274 M140 282 L160 290 M140 298 L160 306"/><circle cx="150" cy="330" r="13"/><path d="M70 150 C 110 130 130 170 170 150 C 210 130 230 170 240 160" />',
      flor: '<g transform="translate(150 175)"><ellipse rx="22" ry="56" transform="rotate(0) translate(0 -48)" fill="' + F + '"/><ellipse rx="22" ry="56" transform="rotate(60) translate(0 -48)"/><ellipse rx="22" ry="56" transform="rotate(120) translate(0 -48)" fill="' + F + '"/><ellipse rx="22" ry="56" transform="rotate(180) translate(0 -48)"/><ellipse rx="22" ry="56" transform="rotate(240) translate(0 -48)" fill="' + F + '"/><ellipse rx="22" ry="56" transform="rotate(300) translate(0 -48)"/><circle r="16" fill="#f2efe9" stroke="none"/></g><path d="M150 280 C 146 310 156 334 150 370"/><path d="M151 318 C 176 300 196 304 206 312 C 186 330 168 328 151 318 Z"/>',
      serpiente: '<path d="M90 345 C 40 300 70 250 150 250 C 230 250 260 200 210 160 C 170 128 110 150 120 112 C 128 84 168 80 186 92" stroke-width="16" stroke-linecap="round" opacity=".9"/><path d="M90 345 C 40 300 70 250 150 250 C 230 250 260 200 210 160 C 170 128 110 150 120 112 C 128 84 168 80 186 92" stroke="#0d0d0d" stroke-width="8" stroke-dasharray="2 9" stroke-linecap="round"/><path d="M186 92 C 200 82 216 88 214 100 C 212 112 196 112 186 104 Z" fill="' + F + '"/><path d="M214 98 L232 92 M232 92 L240 86 M232 92 L240 98"/>',
      ala: '<path d="M60 320 C 70 200 150 110 262 80 C 236 140 230 196 250 252 C 190 258 120 286 60 320 Z" fill="' + F + '"/><path d="M84 300 C 120 250 170 214 238 196 M100 280 C 140 222 190 176 246 150 M118 256 C 160 196 206 146 254 116 M140 226 C 176 170 214 124 258 94"/>'
    };
    return '<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + sombra + rel + '</defs><rect width="300" height="400" fill="url(#s' + seed + ')"/><g fill="none" stroke="#f2efe9" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">' + (formas[tipo] || formas.ojo) + '</g></svg>';
  }
  const PIEZAS = { dsanty: ['ojo', 'luna', 'daga'], mimi: ['flor', 'serpiente', 'luna'], roland: ['ala', 'daga', 'ojo'] };
  function pintarParadas() {
    $('#paradas').innerHTML = A.TATUADORES.map((t, i) => '<article class="parada" id="art-' + t.id + '"><div class="caja"><div><p class="par-num">0' + (i + 1) + ' / 0' + A.TATUADORES.length + '</p><h3 class="par-nombre">' + esc(t.nombre) + '</h3><div class="par-estilos">' + t.estilos.map(e => '<span class="chip">' + esc(e) + ' [ejemplo]</span>').join('') + '</div>' + (t.ig ? '<p class="par-ig"><a href="https://www.instagram.com/' + t.ig + '/" target="_blank" rel="noopener">@' + t.ig + '</a></p>' : '') + '<a class="btn btn-tinta" href="#agenda" data-ver="' + t.id + '">Ver su agenda</a></div><div class="piezas">' + PIEZAS[t.id].map((tp, j) => '<figure class="pieza" style="margin:0">' + arte(11 + i * 7 + j * 3, tp) + '<span>[ejemplo]</span></figure>').join('') + '</div></div></article>').join('');
  }

  /* ---------- 4. Agenda ---------- */
  const sem = A.semana();
  let diaSel = sem[0].iso, estiloSel = null, soloT = null;
  // primer día con algún hueco libre (si hoy ya ha cerrado, el siguiente)
  (function () {
    const s = A.leer();
    const d = sem.find(d => A.TATUADORES.some(t => A.FRANJAS.some(f => A.estado(A.clave(t.id, d.iso, f.ini), s) === 'libre')));
    if (d) diaSel = d.iso;
  })();

  function pintarFiltros() {
    const opc = [{ k: null, n: 'Todos' }].concat(A.ESTILOS.map(e => ({ k: e, n: e })));
    $('#filtros').innerHTML = opc.map(o => '<button type="button" data-estilo="' + (o.k || '') + '" aria-pressed="' + (estiloSel === o.k && !soloT) + '">' + esc(o.n) + '</button>').join('') +
      A.TATUADORES.map(t => '<button type="button" data-solo="' + t.id + '" aria-pressed="' + (soloT === t.id) + '">' + esc(t.nombre) + '</button>').join('');
  }
  function pintarDias() {
    $('#dias').innerHTML = sem.map(d => '<button type="button" role="tab" data-dia="' + d.iso + '" aria-selected="' + (d.iso === diaSel) + '"><small>' + d.txt + '</small><b>' + d.num + '</b></button>').join('');
  }
  function pintarRejilla() {
    const s = A.leer();
    const lista = A.TATUADORES.filter(t => (!soloT || t.id === soloT) && (!estiloSel || t.estilos.includes(estiloSel)));
    if (!lista.length) { $('#rejilla').innerHTML = '<div class="vacio">Nadie con ese estilo esta semana [ejemplo].</div>'; return; }
    $('#rejilla').innerHTML = lista.map(t => {
      const hs = A.FRANJAS.map(f => {
        const k = A.clave(t.id, diaSel, f.ini); const e = A.estado(k, s);
        const txt = { libre: 'Libre', solicitado: 'Solicitado', ocupado: 'Ocupado', pasado: 'Pasado' }[e];
        return '<button type="button" class="hueco ' + e + '" data-clave="' + k + '" aria-label="' + esc(t.nombre) + ' ' + f.ini + ' ' + txt + '">' + f.ini + '<small>' + txt + '</small></button>';
      }).join('');
      const libres = A.FRANJAS.filter(f => A.estado(A.clave(t.id, diaSel, f.ini), s) === 'libre').length;
      return '<div class="fila" data-tatuador="' + t.id + '"><div class="fila-cab"><b>' + esc(t.nombre) + '</b><small>' + libres + ' libre' + (libres === 1 ? '' : 's') + ' · ' + esc(t.estilos.join(', ')) + ' [ejemplo]</small></div><div class="huecos">' + hs + '</div></div>';
    }).join('');
  }
  function pintarMis() {
    const s = A.leer(); const L = s.solicitudes.slice().reverse();
    $('#mis').hidden = !L.length;
    const txt = { pendiente: 'Pendiente', aceptada: 'Aceptada', propuesta: 'Te proponen otra hora', rechazada: 'No disponible' };
    $('#misLista').innerHTML = L.map(r => '<li data-id="' + r.id + '"><span>' + esc(A.txtHueco(r.clave)) + (r.estado === 'propuesta' ? '<br><small>Propuesta: ' + esc(A.txtHueco(r.propuesta)) + '</small>' : '') + '</span><span class="est ' + r.estado + '">' + txt[r.estado] + '</span></li>').join('');
  }
  function pintarTodo() { pintarFiltros(); pintarDias(); pintarRejilla(); pintarMis(); pintarWalkin(); }

  let tAviso;
  function aviso(t, mal) { const a = $('#aviso'); a.textContent = t; a.classList.toggle('mal', !!mal); a.classList.add('ver'); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('ver'), 3200); }

  document.addEventListener('click', ev => {
    const ver = ev.target.closest('[data-ver]');
    if (ver) { soloT = ver.dataset.ver; estiloSel = null; pintarFiltros(); pintarRejilla(); }
    const be = ev.target.closest('[data-estilo]');
    if (be) { estiloSel = be.dataset.estilo || null; soloT = null; pintarFiltros(); pintarRejilla(); }
    const bs = ev.target.closest('[data-solo]');
    if (bs) { soloT = soloT === bs.dataset.solo ? null : bs.dataset.solo; estiloSel = null; pintarFiltros(); pintarRejilla(); }
    const bd = ev.target.closest('[data-dia]');
    if (bd) { diaSel = bd.dataset.dia; pintarDias(); pintarRejilla(); }
    const h = ev.target.closest('.hueco');
    if (h) {
      const e = A.estado(h.dataset.clave);
      if (e === 'libre') abrir(h.dataset.clave);
      else aviso(e === 'ocupado' ? 'Ese hueco está ocupado. Elige uno verde.' : e === 'pasado' ? 'Esa hora ya ha pasado.' : 'Ese hueco ya tiene una solicitud. Elige uno verde.', true);
    }
  });

  /* ---------- Formulario ---------- */
  const modal = $('#modal'), form = $('#form'); let claveSel = null, fotoData = '', fotoNombre = '';
  function abrir(k) {
    claveSel = k; form.reset(); fotoData = ''; fotoNombre = ''; $('#fotoPrev').hidden = true; $('#mError').textContent = '';
    $('#mHueco').textContent = A.txtHueco(k);
    modal.showModal(); setTimeout(() => form.nombre.focus(), 30);
  }
  $('#cerrar').onclick = () => modal.close();
  form.foto.addEventListener('change', () => {
    const f = form.foto.files[0]; if (!f) return; fotoNombre = f.name;
    const img = new Image(); const url = URL.createObjectURL(f);
    img.onload = () => { // miniatura pequeña para que quepa en localStorage
      const c = document.createElement('canvas'); const m = 240; const r = Math.min(1, m / Math.max(img.width, img.height));
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      fotoData = c.toDataURL('image/jpeg', .7); $('#fotoPrev').src = fotoData; $('#fotoPrev').hidden = false; URL.revokeObjectURL(url);
    };
    img.onerror = () => { fotoData = ''; URL.revokeObjectURL(url); };
    img.src = url;
  });
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const r = A.reservar(claveSel, { nombre: form.nombre.value, contacto: form.contacto.value, idea: form.idea.value, zona: form.zona.value, tamano: form.tamano.value, foto: fotoData, fotoNombre });
    if (!r.ok) { $('#mError').textContent = r.motivo; return; }
    modal.close();
    aviso('Solicitud enviada a ' + A.tatuador(r.solicitud.tatuador).nombre + '. Te contestará por WhatsApp.');
  });

  /* ---------- 5. Antes / después ---------- */
  const ad = $('#ad'), rango = $('#adRango');
  function adPinta() { ad.style.setProperty('--x', rango.value + '%'); }
  rango.addEventListener('input', adPinta); adPinta();

  /* ---------- Apariciones al hacer scroll ---------- */
  function observar() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .25 });
    document.querySelectorAll('.parada, .cuidados').forEach(el => reducido ? el.classList.add('visto') : io.observe(el));
  }

  addEventListener('adikto:cambio', () => { pintarRejilla(); pintarMis(); pintarWalkin(); });
  pintarParadas(); pintarTodo(); observar();
  setInterval(pintarWalkin, 60000);
})();
