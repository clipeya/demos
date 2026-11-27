/* app.js · Adikto demo · datos y estado compartidos entre index.html (agenda) y panel.html
   Qué hace: guarda huecos, marcas del tatuador y solicitudes en localStorage (clave adikto_v1).
   Entra: clics de la agenda y del panel. Sale: window.Adikto (API) y evento 'adikto:cambio'.
   Cómo se prueba: prueba_demo.py (caso bueno: reservar → aceptar → ocupado; caso malo: reservar ocupado → negado). */
(function () {
  const CLAVE = 'adikto_v1';

  // REAL (IG @adikto.tattoo): nombres D'Santy, Mimi, Roland (@inkroland). Estilos y piezas: [ejemplo].
  const TATUADORES = [
    { id: 'dsanty', nombre: "D'Santy", ig: null, estilos: ['Realismo', 'Retrato'], nota: 'Realismo en negro y gris [ejemplo]' },
    { id: 'mimi', nombre: 'Mimi', ig: null, estilos: ['Fine line', 'Color'], nota: 'Línea fina y color [ejemplo]' },
    { id: 'roland', nombre: 'Roland', ig: 'inkroland', estilos: ['Realismo', 'Black & grey'], nota: 'Realismo y black & grey [ejemplo]' }
  ];
  const ESTILOS = ['Realismo', 'Retrato', 'Black & grey', 'Fine line', 'Color'];

  // REAL: martes a sábado 10:00-20:30. Bloques de sesión: [ejemplo] de 2 h.
  const FRANJAS = [
    { ini: '10:00', fin: '12:00' }, { ini: '12:00', fin: '14:00' }, { ini: '14:30', fin: '16:30' },
    { ini: '16:30', fin: '18:30' }, { ini: '18:30', fin: '20:30' }
  ];
  const DIAS_TXT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const pad = n => String(n).padStart(2, '0');
  const fechaISO = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  // Semana visible: martes a sábado. Domingo y lunes (cerrado) → semana siguiente.
  function semana(base) {
    const hoy = base ? new Date(base) : new Date();
    hoy.setHours(0, 0, 0, 0);
    const dw = hoy.getDay();
    const martes = new Date(hoy);
    if (dw === 0) martes.setDate(hoy.getDate() + 2);
    else if (dw === 1) martes.setDate(hoy.getDate() + 1);
    else if (dw === 6 && !base && (new Date().getHours() * 60 + new Date().getMinutes()) >= 20 * 60 + 30) martes.setDate(hoy.getDate() + 3); // sábado ya cerrado → semana siguiente
    else martes.setDate(hoy.getDate() - (dw - 2));
    const dias = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(martes); d.setDate(martes.getDate() + i);
      dias.push({ iso: fechaISO(d), txt: DIAS_TXT[d.getDay()], num: d.getDate(), fecha: d });
    }
    return dias;
  }

  const clave = (t, dia, ini) => t + '|' + dia + '|' + ini;
  function partes(k) { const [t, dia, ini] = k.split('|'); return { t, dia, ini }; }

  // Ocupación de ejemplo, fija por hueco (no aleatoria entre recargas).
  function semilla(k) {
    let h = 2166136261;
    for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 10) < 4;
  }

  function leer() {
    try { const s = JSON.parse(localStorage.getItem(CLAVE)); if (s && s.marcas && s.solicitudes) return s; } catch (e) {}
    return { marcas: {}, solicitudes: [] };
  }
  function guardar(s) {
    try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('adikto:cambio'));
  }

  function pasado(k) {
    const { dia, ini } = partes(k);
    const [h, m] = ini.split(':').map(Number);
    const d = new Date(dia + 'T00:00:00'); d.setHours(h, m, 0, 0);
    return d.getTime() < Date.now();
  }

  // libre | ocupado | solicitado | pasado
  function estado(k, s) {
    s = s || leer();
    if (s.solicitudes.some(r => r.clave === k && r.estado === 'aceptada')) return 'ocupado';
    if (s.marcas[k] === 'ocupado') return 'ocupado';
    if (pasado(k)) return 'pasado';
    if (s.solicitudes.some(r => r.clave === k && r.estado === 'pendiente')) return 'solicitado';
    if (s.solicitudes.some(r => r.propuesta === k && r.estado === 'propuesta')) return 'solicitado';
    if (s.marcas[k] === 'libre') return 'libre';
    return semilla(k) ? 'ocupado' : 'libre';
  }

  function tatuador(id) { return TATUADORES.find(t => t.id === id); }

  function reservar(k, datos) {
    const s = leer();
    const e = estado(k, s);
    if (e !== 'libre') return { ok: false, motivo: e === 'ocupado' ? 'Ese hueco está ocupado.' : e === 'pasado' ? 'Esa hora ya ha pasado.' : 'Ese hueco ya tiene una solicitud.' };
    if (!datos || !String(datos.idea || '').trim() || !String(datos.nombre || '').trim()) return { ok: false, motivo: 'Faltan tu nombre y la idea.' };
    const r = {
      id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      clave: k, tatuador: partes(k).t, estado: 'pendiente', creada: new Date().toISOString(),
      nombre: String(datos.nombre).trim().slice(0, 60), contacto: String(datos.contacto || '').trim().slice(0, 40),
      idea: String(datos.idea).trim().slice(0, 600), zona: datos.zona || '', tamano: datos.tamano || '',
      foto: datos.foto || '', fotoNombre: datos.fotoNombre || ''
    };
    s.solicitudes.push(r); guardar(s);
    return { ok: true, solicitud: r };
  }

  function aceptar(id) {
    const s = leer(); const r = s.solicitudes.find(x => x.id === id);
    if (!r) return { ok: false, motivo: 'No existe la solicitud.' };
    if (r.estado === 'propuesta' && r.propuesta) { r.clave = r.propuesta; delete r.propuesta; }
    r.estado = 'aceptada'; guardar(s); return { ok: true };
  }
  function proponer(id, nueva) {
    const s = leer(); const r = s.solicitudes.find(x => x.id === id);
    if (!r) return { ok: false, motivo: 'No existe la solicitud.' };
    if (estado(nueva, s) !== 'libre') return { ok: false, motivo: 'Esa otra hora no está libre.' };
    r.estado = 'propuesta'; r.propuesta = nueva; guardar(s); return { ok: true };
  }
  function rechazar(id) {
    const s = leer(); const r = s.solicitudes.find(x => x.id === id);
    if (!r) return { ok: false }; r.estado = 'rechazada'; guardar(s); return { ok: true };
  }
  function marcar(k, valor) {
    const s = leer();
    if (s.solicitudes.some(r => r.clave === k && r.estado === 'aceptada')) return { ok: false, motivo: 'Hay una cita aceptada en ese hueco.' };
    s.marcas[k] = valor; guardar(s); return { ok: true };
  }
  function reiniciar() { try { localStorage.removeItem(CLAVE); } catch (e) {} window.dispatchEvent(new CustomEvent('adikto:cambio')); }

  // Walk-in: quién tiene libre la franja que está en curso ahora mismo (o la siguiente de hoy).
  function walkin(ahora) {
    ahora = ahora || new Date();
    const dw = ahora.getDay();
    const abierto = dw >= 2 && dw <= 6;
    const mins = ahora.getHours() * 60 + ahora.getMinutes();
    const aMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    if (!abierto || mins >= aMin('20:30')) return { abierto: false };
    const s = leer(); const dia = fechaISO(ahora);
    const franja = FRANJAS.find(f => aMin(f.fin) > mins) || null;
    if (!franja) return { abierto: false };
    const libres = TATUADORES.filter(t => {
      const k = clave(t.id, dia, franja.ini);
      const e = estado(k, s);
      return e === 'libre' || (e === 'pasado' && !s.marcas[k] && !semilla(k));
    });
    return { abierto: true, franja, libres, antes: mins < aMin('10:00') };
  }

  function txtHueco(k) {
    const { t, dia, ini } = partes(k);
    const d = new Date(dia + 'T00:00:00');
    const f = FRANJAS.find(x => x.ini === ini);
    return (tatuador(t) || {}).nombre + ' · ' + DIAS_TXT[d.getDay()] + ' ' + d.getDate() + ' · ' + ini + (f ? '-' + f.fin : '');
  }

  window.addEventListener('storage', e => { if (e.key === CLAVE) window.dispatchEvent(new CustomEvent('adikto:cambio')); });

  window.Adikto = { TATUADORES, ESTILOS, FRANJAS, semana, clave, partes, estado, leer, reservar, aceptar, proponer, rechazar, marcar, reiniciar, walkin, tatuador, txtHueco };
})();
