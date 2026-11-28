/* web.js · Adikto demo · comportamiento de index.html v2.1 (28-nov: entrada sola sin botón, altavoz opcional, pasillo sin desborde; pasillo 3D de artistas, walk-in, agenda, formulario, antes/después)
   Entra: window.Adikto (app.js). Sale: la página viva. Se prueba con prueba_demo.py. */
(function () {
  const A = window.Adikto;
  const $ = s => document.querySelector(s);
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 1. Sonido: máquina de tatuar con Web Audio (sin audios de terceros) ----------
     Zumbido de bobina ~124 Hz: diente de sierra filtrado (cuerpo) + ruido en banda modulado a la misma
     frecuencia (el golpe de la aguja) + leve vaivén del motor. Solo suena si el usuario activa el altavoz. */
  const Sonido = (function () {
    let ctx = null, activo = false, master = null, ruido = null;
    function crear() {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
      ctx = new C(); master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
      const n = ctx.sampleRate * 2; ruido = ctx.createBuffer(1, n, ctx.sampleRate); const d = ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }
    function zumbido(dur, fuerza) {
      if (!activo || !ctx) return;
      const t = ctx.currentTime, f0 = 124;
      const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(fuerza, t + 0.09);
      env.gain.setValueAtTime(fuerza, t + Math.max(0.1, dur - 0.28));
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      env.connect(master);
      const saw = ctx.createOscillator(); saw.type = 'sawtooth'; saw.frequency.setValueAtTime(82, t); saw.frequency.exponentialRampToValueAtTime(f0, t + 0.22);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 2.5;
      const gS = ctx.createGain(); gS.gain.value = 0.55; saw.connect(lp).connect(gS).connect(env);
      const vai = ctx.createOscillator(); vai.frequency.value = 6.5; const gV = ctx.createGain(); gV.gain.value = 2.2; vai.connect(gV).connect(saw.frequency);
      const nz = ctx.createBufferSource(); nz.buffer = ruido; nz.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.1;
      const am = ctx.createGain(); am.gain.value = 0;
      const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.setValueAtTime(82, t); lfo.frequency.exponentialRampToValueAtTime(f0, t + 0.22);
      const gL = ctx.createGain(); gL.gain.value = 0.32; lfo.connect(gL).connect(am.gain);
      nz.connect(bp).connect(am).connect(env);
      [saw, vai, nz, lfo].forEach(o => { o.start(t); o.stop(t + dur + 0.05); });
    }
    function encender() {
      if (!ctx && !crear()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      activo = true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.22, ctx.currentTime, 0.02);
      return true;
    }
    function apagar() { activo = false; if (ctx) master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03); }
    function despertar() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
    return { encender, apagar, zumbido, despertar, get activo() { return activo; } };
  })();
  /* ---------- 1b. Altavoz y entrada sola ----------
     La entrada (gota → logo) arranca sola al cargar, siempre en silencio: el navegador no deja sonar audio sin un gesto.
     El altavoz de la cabecera (fijo, pequeño) es lo único que enciende el sonido. Si ya se activó otra vez (localStorage),
     el primer toque o tecla lo reanuda; el scroll por sí solo no cuenta como gesto, así que el zumbido llega con ese toque. */
  const bSon = $('#sonido'), PREF = 'adikto:sonido';
  const quiere = () => { try { return localStorage.getItem(PREF) === '1'; } catch (e) { return false; } };
  const guardar = v => { try { localStorage.setItem(PREF, v ? '1' : '0'); } catch (e) {} };
  function pintarSonido() {
    bSon.setAttribute('aria-pressed', String(Sonido.activo));
    bSon.setAttribute('aria-label', Sonido.activo ? 'Sonido activado. Silenciar' : 'Sonido apagado. Activar sonido');
  }
  bSon.addEventListener('click', () => {
    if (Sonido.activo) { Sonido.apagar(); guardar(false); }
    else if (Sonido.encender()) { guardar(true); Sonido.zumbido(0.9, 0.7); }
    pintarSonido();
  });
  function primerGesto(ev) {
    if (ev.target && ev.target.closest && ev.target.closest('#sonido')) return; // el propio altavoz ya lo gestiona
    if (!quiere()) return;                                                       // altavoz apagado: silencio siempre
    if (!Sonido.activo) { if (Sonido.encender()) { Sonido.zumbido(0.6, 0.5); pintarSonido(); } }
    else Sonido.despertar();                                                     // por si el navegador lo dejó en pausa
  }
  ['pointerup', 'touchend', 'keydown'].forEach(n => addEventListener(n, primerGesto, { capture: true, passive: true }));
  pintarSonido();

  const entrada = $('#intro'); let dentro = false;
  function entrar() {
    if (dentro) return; dentro = true;
    entrada.classList.add('dentro'); document.documentElement.classList.add('ya-dentro');
  }
  // Dos fotogramas: el navegador pinta primero el estado tapado y luego arranca la animación (si no, se la salta).
  requestAnimationFrame(() => requestAnimationFrame(entrar)); setTimeout(entrar, 600); // respaldo si no hay fotogramas (pestaña de fondo)
  window.AdiktoEntrada = { dentro: () => dentro };

  /* ---------- 2. Walk-in hoy ---------- */
  function pintarWalkin() {
    const w = A.walkin(); const L = $('#walkinLista');
    if (!w.abierto) { L.innerHTML = '<div class="wk-cerrado">Ahora el estudio está cerrado. Abrimos de martes a sábado, de 10:00 a 20:30. Mira los huecos de la semana en la agenda.</div>'; return; }
    if (!w.libres.length) { L.innerHTML = '<div class="wk-cerrado">Ahora mismo están todos con clientes (' + w.franja.ini + '-' + w.franja.fin + '). Mira el siguiente hueco libre en la agenda.</div>'; return; }
    L.innerHTML = w.libres.map(t => '<div class="wk"><div><span class="punto"></span><b>' + esc(t.nombre) + '</b><small>Libre ' + w.franja.ini + '-' + w.franja.fin + ' · ven sin cita</small></div><a class="btn btn-borde" href="#agenda" data-ver="' + t.id + '">Agenda</a></div>').join('');
  }

  /* ---------- 3. Pasillo recto: cada scroll avanza; D'Santy (izq.), Mimi (der.), Roland (izq.) y al final «Agenda de todos» ---------- */
  // Siluetas neón de cuerpo entero (no hay fotos reales; nada de caras): gorra, moño y barba las distinguen.
  const CUERPO = '<circle cx="60" cy="40" r="21"/><path d="M34 74q0-8 8-8h36q8 0 8 8l5 96q0 7-7 7h-7l-3 113H62l-2-96-2 96H46l-3-113h-7q-7 0-7-7z"/>';
  const EXTRA = { dsanty: '<path d="M39 34q2-20 21-20t21 18l14 5q-10 4-56-1z"/>', mimi: '<circle cx="60" cy="13" r="9"/>', roland: '<path d="M45 48q15 22 30 0"/>' };
  function silueta(id) {
    return '<svg class="sil" viewBox="0 0 120 300" aria-hidden="true"><g fill="rgba(217,28,156,.07)" stroke="#ff4fc3" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' + CUERPO + (EXTRA[id] || '') + '</g></svg>';
  }
  const T = A.TATUADORES, N = T.length;
  function huecosDe(t) {
    const s = A.leer(), out = [];
    A.semana().forEach(d => A.FRANJAS.forEach(f => { if (out.length < 4 && A.estado(A.clave(t.id, d.iso, f.ini), s) === 'libre') out.push(d.txt + ' ' + f.ini); }));
    return out.map(h => '<li>' + esc(h) + '</li>').join('') || '<li class="nada">Sin huecos esta semana</li>';
  }
  function tablaTodos() {
    const s = A.leer(), dias = A.semana();
    const cab = '<tr><th scope="col"><span class="sr">Tatuador</span></th>' + dias.map(d => '<th scope="col">' + esc(d.txt) + ' <small>' + d.num + '</small></th>').join('') + '</tr>';
    const filas = T.map(t => '<tr><th scope="row">' + esc(t.nombre) + '</th>' + dias.map(d => {
      const f = A.FRANJAS.find(f => A.estado(A.clave(t.id, d.iso, f.ini), s) === 'libre');
      return '<td>' + (f ? '<b>' + f.ini + '</b>' : '<span>·</span>') + '</td>';
    }).join('') + '</tr>').join('');
    return '<table class="tabla-todos"><caption class="sr">Primer hueco libre de cada tatuador por día</caption><thead>' + cab + '</thead><tbody>' + filas + '</tbody></table>';
  }
  $('#artistas').innerHTML = T.map((t, i) => '<article class="artista ' + (i % 2 ? 'der' : 'izq') + '" id="art-' + t.id + '" data-i="' + i + '" aria-labelledby="n-' + t.id + '">' + silueta(t.id) + '<div class="tarjeta"><p class="par-num">0' + (i + 1) + ' / 0' + N + '</p><h2 class="par-nombre" id="n-' + t.id + '">' + esc(t.nombre) + '</h2><p class="par-estilo">' + esc(t.estilos.join(' · ')) + ' <span class="ej">[ejemplo] · huecos de la demo</span></p>' + (t.ig ? '<p class="par-ig"><a href="https://www.instagram.com/' + t.ig + '/" target="_blank" rel="noopener">@' + t.ig + '</a></p>' : '') + '<ul class="mini-huecos" data-huecos="' + t.id + '">' + huecosDe(t) + '</ul><a class="btn btn-tinta" href="#agenda" data-ver="' + t.id + '">Ver su agenda</a></div></article>').join('') +
    '<article class="artista centro juntos" id="art-juntos" data-i="' + N + '" aria-labelledby="n-juntos"><div class="tarjeta"><div class="trio" aria-hidden="true">' + T.map(t => silueta(t.id)).join('') + '</div><p class="par-num">' + T.map(t => esc(t.nombre)).join(' · ') + '</p><h2 class="par-nombre" id="n-juntos">Agenda de todos</h2><p class="par-estilo">Primer hueco libre de cada uno, de martes a sábado.</p><div class="tabla-caja" id="tablaTodos">' + tablaTodos() + '</div><a class="btn btn-tinta" href="#agenda">Pedir cita</a></div></article>';
  addEventListener('adikto:cambio', () => { document.querySelectorAll('[data-huecos]').forEach(u => { u.innerHTML = huecosDe(A.tatuador(u.dataset.huecos)); }); });
  addEventListener('adikto:cambio', () => { $('#tablaTodos').innerHTML = tablaTodos(); });

  const pasillo = $('#pasillo'), arts = [...document.querySelectorAll('.artista')], barra = $('#progreso'), guiaN = $('#guiaN');
  const vivo = !reducido && 'IntersectionObserver' in window;
  const PASO = 1400;
  const PARADAS = arts.map((_, i) => (i + 1) * PASO);
  const FIN = PARADAS[PARADAS.length - 1];
  // 28-nov 09:37 Andy: «no tienen que salir las líneas del pasillo» → sin marcos (antes cada 350 px de fondo).
  const MARCOS = [];
  const marcosEl = MARCOS.map(() => { const m = document.createElement('i'); m.className = 'marco'; $('#marcos').appendChild(m); return m; });
  // Tramos: viaje (1) + parada quieta (0,75) por tarjeta; la cámara se para con la tarjeta delante.
  const VIAJE = 1, QUIETO = 1.4, TOTAL = PARADAS.length * (VIAJE + QUIETO);
  // 28-nov Andy: «movimiento menos evidente, menos cuadriculado» → curva seno (arranca y frena sin tirón) en vez de cúbica.
  const suave = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
  const DELANTE = 130; // a cuánta distancia se para la cámara de la tarjeta
  function camara(p) {
    let u = p * TOTAL;
    for (let i = 0; i < PARADAS.length; i++) {
      const desde = i ? PARADAS[i - 1] - DELANTE : 0, hasta = PARADAS[i] - DELANTE;
      if (u <= VIAJE) return { z: desde + (hasta - desde) * suave(u), parada: u > VIAJE * 0.92 ? i : -1 };
      u -= VIAJE;
      if (u <= QUIETO) return { z: hasta, parada: i };
      u -= QUIETO;
    }
    return { z: FIN - DELANTE, parada: PARADAS.length - 1 };
  }
  let ultimaParada = -1, ancho = innerWidth;
  function lado(el) { return el.classList.contains('izq') ? -1 : el.classList.contains('der') ? 1 : 0; }
  function pintarPasillo() {
    const r = pasillo.getBoundingClientRect(), total = pasillo.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
    const cam = camara(p);
    barra.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    const nAct = Math.min(arts.length, Math.floor(p * TOTAL / (VIAJE + QUIETO)) + 1);
    if (guiaN.textContent !== nAct + ' / ' + arts.length) guiaN.textContent = nAct + ' / ' + arts.length;
    const movil = ancho < 760, dx = movil ? 0 : Math.min(ancho * 0.07, 110), giro = movil ? 0 : 4;
    arts.forEach((el, i) => {
      const rel = cam.z - PARADAS[i];               // <0: aún delante · >0: ya la has pasado
      const lejos = Math.max(0, -rel);
      let o = rel > 0 ? 1 - rel / 200 : (i === 0 ? 1 : 1 - Math.max(0, lejos - 380) / 650); // solo se ve la tarjeta a la que vas (la 1.ª, desde el principio)
      o = Math.max(0, Math.min(1, o));
      const s = lado(el);
      // al pasar de largo, la tarjeta se aparta hacia su pared
      const fuera = rel > -DELANTE ? (rel + DELANTE) * 0.6 * (s || 0) : 0;
      // CAUSA DEL DESBORDE (28-nov): lo ya pasado seguía en el DOM con visibility:hidden y translateZ por encima de la
      // perspectiva (detrás de la cámara). visibility:hidden SÍ cuenta para el ancho desplazable y WebKit (Safari iOS)
      // proyecta esas cajas enormes hacia los lados. Ahora: lo invisible sale del flujo (display:none) y z nunca pasa de 260 px.
      const ver = o >= 0.01 && rel < 260;
      el.style.display = ver ? '' : 'none';
      if (!ver) { el.classList.remove('activo'); return; }
      el.style.transform = 'translate3d(calc(-50% + ' + (s * dx + fuera).toFixed(1) + 'px),-50%,' + rel.toFixed(1) + 'px) rotateY(' + (-s * giro) + 'deg)';
      el.style.opacity = o.toFixed(3);
      el.style.zIndex = String(Math.max(1, Math.round(20000 + rel)));
      el.style.visibility = 'visible';
      el.classList.toggle('activo', Math.abs(rel + DELANTE) < 140);
    });
    marcosEl.forEach((m, i) => {
      const rel = cam.z - MARCOS[i];
      let o = rel > -120 ? 1 - (rel + 120) / 220 : 1 - Math.max(0, -rel - 2200) / 1400;
      o = Math.max(0, Math.min(1, o));
      const ver = o >= 0.01 && rel < 260;
      m.style.display = ver ? '' : 'none';
      if (!ver) return;
      m.style.transform = 'translate3d(-50%,-50%,' + rel.toFixed(1) + 'px)';
      m.style.opacity = o.toFixed(3);
      m.style.visibility = 'visible';
    });
    if (cam.parada !== ultimaParada) { if (cam.parada >= 0 && Sonido.activo) Sonido.zumbido(0.42, 0.5); ultimaParada = cam.parada; }
  }
  // Scroll en el que la cámara está parada delante de la tarjeta i (lo usan la prueba y las capturas).
  function posicion(i) {
    const total = pasillo.offsetHeight - innerHeight;
    const u = i * (VIAJE + QUIETO) + VIAJE + QUIETO * 0.5;
    return Math.round(pasillo.offsetTop + Math.min(1, u / TOTAL) * total);
  }
  window.AdiktoPasillo = { posicion, vivo: () => vivo, n: arts.length };
  // 28-nov Andy: «que pare justamente en la ficha de cada tatuador». El imán CSS (scroll-snap) atrapaba la rueda (revisor-web, vuelta 1).
  // Ahora: tramo quieto largo por ficha + al soltar el scroll en el último 35 % de un viaje, termina de llegar SOLO hacia delante.
  let dir = 1, ultY = scrollY, t0 = 0;
  function asentar() {
    const total = pasillo.offsetHeight - innerHeight, y = scrollY - pasillo.offsetTop;
    if (y <= 0 || y >= total) return;
    const u = y / total * TOTAL, seg = VIAJE + QUIETO, k = Math.floor(u / seg), dentro = u - k * seg;
    if (dentro >= VIAJE || k >= arts.length) return;          // ya está quieta delante de una ficha
    const frac = dentro / VIAJE;
    let destino = null;
    if (dir > 0 && frac > 0.65) destino = posicion(k);         // casi llegando a la ficha k
    else if (dir < 0 && frac < 0.35 && k > 0) destino = posicion(k - 1); // subiendo, casi de vuelta en la anterior
    if (destino !== null && Math.abs(destino - scrollY) > 4) scrollTo({ top: destino, behavior: 'smooth' });
  }
  if (vivo) {
    pasillo.classList.add('vivo');
    let enVista = false, pend2 = false;
    new IntersectionObserver(es => { enVista = es[0].isIntersecting; if (enVista) pintarPasillo(); }).observe(pasillo);
    addEventListener('scroll', () => { if (enVista && !pend2) { pend2 = true; requestAnimationFrame(() => { pend2 = false; pintarPasillo(); }); } }, { passive: true });
    addEventListener('resize', () => { ancho = innerWidth; pintarPasillo(); });
    addEventListener('scroll', () => { const y = scrollY; if (y !== ultY) dir = y > ultY ? 1 : -1; ultY = y; clearTimeout(t0); if (enVista) t0 = setTimeout(asentar, 220); }, { passive: true });
    pintarPasillo();
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
    const s = A.leer(); const L = s.solicitudes.filter(r => !r.ejemplo).reverse();
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
      else aviso(e === 'ocupado' ? 'Ese hueco está ocupado. Elige uno libre.' : e === 'pasado' ? 'Esa hora ya ha pasado.' : 'Ese hueco ya tiene una solicitud. Elige uno libre.', true);
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
    document.querySelectorAll('.cuidados').forEach(el => reducido ? el.classList.add('visto') : io.observe(el));
  }

  addEventListener('adikto:cambio', () => { pintarRejilla(); pintarMis(); pintarWalkin(); });
  pintarTodo(); observar();
  setInterval(pintarWalkin, 60000);
})();
