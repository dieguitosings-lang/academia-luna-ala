/**
 * Academia Luna Ala - MDT-2025-006
 * Backend en Google Apps Script. Guarda todas las evidencias en esta hoja de cálculo.
 * Instalación: ver README.md (pasos 1 a 5).
 */
var START_DATE = '2026-11-23';      // primer día de la capacitación
var TZ = 'America/Guayaquil';

var HEAD = {
  Usuarios: ['cedula', 'nombre', 'cargo', 'contacto', 'rol', 'salt', 'hash', 'creado', 'ultimo_ingreso', 'aprobado', 'aprobado_por', 'aprobado_fecha', 'codigo'],
  Sesiones: ['id', 'cedula', 'nombre', 'modulo', 'leccion', 'intento', 'fecha', 'inicio', 'fin', 'segundos', 'minutos', 'ip', 'dispositivo', 'recibido'],
  Lecciones: ['clave', 'cedula', 'modulo', 'leccion', 'done', 'intento', 'fecha_completada', 'apuntes', 'recibido'],
  Evaluaciones: ['clave', 'cedula', 'modulo', 'intento_n', 'nota', 'aprobado', 'fecha', 'recibido'],
  Actividades: ['clave', 'cedula', 'modulo', 'texto', 'fecha', 'recibido'],
  Foro: ['id', 'cedula', 'nombre', 'cargo', 'modulo', 'texto', 'fecha', 'recibido'],
  Asistencia: ['clave', 'cedula', 'fecha', 'validada', 'validado_por', 'recibido'],
  Config: ['clave', 'valor'],
  Resumen: ['cedula', 'nombre', 'cargo', 'rol', 'horas_acumuladas', 'lecciones_completas', 'evaluaciones_aprobadas', 'nota_promedio', 'primer_ingreso', 'ultimo_ingreso', 'estado', 'certificado_aprobado', 'codigo', 'actualizado']
};

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

/** Ejecutar UNA vez a mano desde el editor: crea las hojas. */
function setup() {
  Object.keys(HEAD).forEach(function (n) {
    var s = ss_().getSheetByName(n) || ss_().insertSheet(n);
    s.getRange(1, 1, 1, HEAD[n].length).setValues([HEAD[n]]).setFontWeight('bold');
    s.getRange(2, 1, Math.max(1, s.getMaxRows() - 1), HEAD[n].length).setNumberFormat('@');   // todo como texto: conserva ceros de la cédula y fechas
    s.setFrozenRows(1);
  });
  ['Hoja 1', 'Sheet1', 'Hoja1'].forEach(function (n) {
    var d = ss_().getSheetByName(n);
    if (d && ss_().getSheets().length > 1) ss_().deleteSheet(d);
  });
}

function sh_(n) { var s = ss_().getSheetByName(n); if (!s) { setup(); s = ss_().getSheetByName(n); } return s; }

function rows_(n) {
  var v = sh_(n).getDataRange().getValues(), h = v[0], out = [];
  for (var i = 1; i < v.length; i++) {
    var o = {};
    for (var j = 0; j < h.length; j++) o[h[j]] = (v[i][j] === undefined || v[i][j] === null) ? '' : String(v[i][j]);
    out.push(o);
  }
  return out;
}

function upsert_(n, keyCol, key, obj) {
  var s = sh_(n), h = HEAD[n], k = h.indexOf(keyCol) + 1, last = s.getLastRow(), found = 0;
  if (last > 1) {
    var col = s.getRange(2, k, last - 1, 1).getValues();
    for (var i = 0; i < col.length; i++) if (String(col[i][0]) === key) { found = i + 2; break; }
  }
  var cur = found ? s.getRange(found, 1, 1, h.length).getValues()[0] : [];
  var row = h.map(function (c, j) { return obj[c] !== undefined ? obj[c] : (found ? cur[j] : ''); });
  if (found) { s.getRange(found, 1, 1, h.length).setValues([row]); return found; }
  if (last + 1 > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), 500);
  s.getRange(last + 1, 1, 1, h.length).setValues([row]);
  return last + 1;
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return json_({ ok: true, msg: 'Academia Luna Ala - MDT-2025-006: servicio activo' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    var q = JSON.parse(e.postData.contents);
    return json_(handle_(q));
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { }
  }
}

function pub_(u) {
  return { cedula: u.cedula, nombre: u.nombre, cargo: u.cargo, contacto: u.contacto, rol: u.rol, creado: u.creado, ultimo: u.ultimo_ingreso, aprobado: u.aprobado === 'SI', aprobado_por: u.aprobado_por, aprobado_fecha: u.aprobado_fecha, codigo: u.codigo };
}

function auth_(q) {
  var u = rows_('Usuarios').filter(function (r) { return r.cedula === String(q.ced); })[0];
  if (!u || !q.hash || u.hash !== String(q.hash)) throw new Error('Cédula o contraseña incorrecta');
  return u;
}

function mine_(name, ced) { return rows_(name).filter(function (r) { return r.cedula === ced; }); }
function dataFor_(ced) {
  return { sesiones: mine_('Sesiones', ced), lecciones: mine_('Lecciones', ced), evaluaciones: mine_('Evaluaciones', ced), actividades: mine_('Actividades', ced) };
}
function config_() {
  var out = { videos: {} };
  rows_('Config').forEach(function (r) { if (r.clave.indexOf('video-') === 0) { try { out.videos[r.clave.slice(6)] = JSON.parse(r.valor); } catch (x) { } } });
  return out;
}

function handle_(q) {
  switch (q.action) {
    case 'ping': return { ok: true };
    case 'hasAdmin': return { ok: true, hasAdmin: rows_('Usuarios').some(function (r) { return r.rol === 'administrador'; }) };
    case 'salt': {
      var f = rows_('Usuarios').filter(function (r) { return r.cedula === String(q.ced); })[0];
      return { ok: true, salt: f ? f.salt : null };
    }
    case 'register': {
      var n = q.user || {}, ced = String(n.cedula || '');
      if (!/^\d{10}$/.test(ced)) throw new Error('Cédula inválida');
      if (String(n.nombre || '').trim().length < 5) throw new Error('Nombre inválido');
      if (!n.hash || !n.salt) throw new Error('Datos incompletos');
      var ex = rows_('Usuarios');
      if (ex.some(function (r) { return r.cedula === ced; })) throw new Error('Esa cédula ya está registrada. Inicia sesión.');
      var rol = 'estudiante';
      if (n.admin) {
        if (ex.some(function (r) { return r.rol === 'administrador'; })) throw new Error('Ya existe un Administrador.');
        rol = 'administrador';
      }
      upsert_('Usuarios', 'cedula', ced, { cedula: ced, nombre: String(n.nombre).slice(0, 120), cargo: String(n.cargo || '').slice(0, 40), contacto: String(n.contacto || '').slice(0, 80), rol: rol, salt: String(n.salt), hash: String(n.hash), creado: new Date().toISOString(), ultimo_ingreso: '', aprobado: 'NO' });
      rebuildResumen_();
      return { ok: true };
    }
    case 'login':
    case 'me': {
      var u = auth_(q);
      if (q.action === 'login') upsert_('Usuarios', 'cedula', u.cedula, { ultimo_ingreso: new Date().toISOString() });
      u = auth_(q);
      return { ok: true, user: pub_(u), data: dataFor_(u.cedula), foro: rows_('Foro'), config: config_() };
    }
    case 'events': {
      var us = auth_(q), now = new Date().toISOString(), errs = [];
      (q.events || []).forEach(function (ev) { try { apply_(us, ev, now); } catch (x) { errs.push(String(x.message || x)); } });
      rebuildResumen_();
      return { ok: true, errors: errs };
    }
    case 'all': {
      var ua = auth_(q);
      if (['administrador', 'presidente', 'contadora'].indexOf(ua.rol) < 0) throw new Error('Sin permiso');
      return { ok: true, usuarios: rows_('Usuarios').map(pub_), sesiones: rows_('Sesiones'), lecciones: rows_('Lecciones'), evaluaciones: rows_('Evaluaciones'), actividades: rows_('Actividades'), asistencia: rows_('Asistencia'), foro: rows_('Foro'), config: config_() };
    }
    case 'foro': { auth_(q); return { ok: true, foro: rows_('Foro') }; }
  }
  throw new Error('Acción desconocida');
}

function text_(s, max) { return String(s == null ? '' : s).slice(0, max); }

function apply_(u, ev, now) {
  var ced = u.cedula, admin = u.rol === 'administrador';
  var m = +ev.m, l = +ev.l;
  switch (ev.t) {
    case 'sesion': {
      if (String(ev.id).indexOf(ced + '|') !== 0) throw new Error('sesion ajena');
      var seg = Math.max(0, Math.round(+ev.seg || 0));
      var el = (Date.parse(ev.fin) - Date.parse(ev.ini)) / 1000;
      if (isFinite(el)) seg = Math.min(seg, Math.max(0, Math.round(el)) + 5);      // no se aceptan más segundos que el tiempo transcurrido
      upsert_('Sesiones', 'id', String(ev.id), { id: String(ev.id), cedula: ced, nombre: u.nombre, modulo: m, leccion: l, intento: +ev.intento || 1, fecha: text_(ev.fecha, 10), inicio: text_(ev.ini, 30), fin: text_(ev.fin, 30), segundos: seg, minutos: Math.round(seg / 6) / 10, ip: text_(ev.ip, 60), dispositivo: text_(ev.dev, 200), recibido: now });
      return;
    }
    case 'leccion':
      upsert_('Lecciones', 'clave', ced + '|' + m + '-' + l, { clave: ced + '|' + m + '-' + l, cedula: ced, modulo: m, leccion: l, done: ev.done ? 'SI' : 'NO', intento: +ev.intento || 1, fecha_completada: ev.done ? text_(ev.fecha, 30) : '', recibido: now });
      return;
    case 'apuntes':
      upsert_('Lecciones', 'clave', ced + '|' + m + '-' + l, { clave: ced + '|' + m + '-' + l, cedula: ced, modulo: m, leccion: l, apuntes: text_(ev.texto, 5000), recibido: now });
      return;
    case 'reset':
      for (var i = 0; i < 5; i++) upsert_('Lecciones', 'clave', ced + '|' + m + '-' + i, { clave: ced + '|' + m + '-' + i, cedula: ced, modulo: m, leccion: i, done: 'NO', intento: +ev.intento || 1, fecha_completada: '', recibido: now });
      return;
    case 'quiz':
      upsert_('Evaluaciones', 'clave', ced + '|' + m + '|' + ev.n, { clave: ced + '|' + m + '|' + ev.n, cedula: ced, modulo: m, intento_n: +ev.n, nota: +ev.nota, aprobado: +ev.nota >= 7 ? 'SI' : 'NO', fecha: text_(ev.fecha, 30), recibido: now });
      return;
    case 'actividad':
      upsert_('Actividades', 'clave', ced + '|' + m, { clave: ced + '|' + m, cedula: ced, modulo: m, texto: text_(ev.texto, 8000), fecha: text_(ev.fecha, 30), recibido: now });
      return;
    case 'foro':
      if (String(ev.id).indexOf(ced + '|') !== 0) throw new Error('foro ajeno');
      upsert_('Foro', 'id', String(ev.id), { id: String(ev.id), cedula: ced, nombre: u.nombre, cargo: u.cargo, modulo: m, texto: text_(ev.texto, 2000), fecha: text_(ev.fecha, 30), recibido: now });
      return;
    case 'asistencia':
      if (!admin) throw new Error('Solo el Administrador valida asistencia');
      upsert_('Asistencia', 'clave', ev.ced + '|' + ev.fecha, { clave: ev.ced + '|' + ev.fecha, cedula: String(ev.ced), fecha: text_(ev.fecha, 10), validada: ev.val ? 'SI' : 'NO', validado_por: u.nombre, recibido: now });
      return;
    case 'rol': {
      if (!admin) throw new Error('Solo el Administrador asigna roles');
      if (['estudiante', 'administrador', 'contadora', 'presidente'].indexOf(ev.rol) < 0) throw new Error('Rol inválido');
      var us = rows_('Usuarios'), target = us.filter(function (r) { return r.cedula === String(ev.ced); })[0];
      if (!target) throw new Error('Usuario no existe');
      if (target.rol === 'administrador' && ev.rol !== 'administrador' && us.filter(function (r) { return r.rol === 'administrador'; }).length < 2) throw new Error('Debe quedar al menos un Administrador');
      upsert_('Usuarios', 'cedula', target.cedula, { rol: ev.rol });
      return;
    }
    case 'aprobar': {
      if (u.rol !== 'presidente') throw new Error('Solo el Presidente aprueba certificados');
      var tc = String(ev.ced), ses = mine_('Sesiones', tc), tot = 0;
      ses.forEach(function (r) { tot += +r.segundos || 0; });
      var pas = {};
      mine_('Evaluaciones', tc).forEach(function (r) { if (r.aprobado === 'SI') pas[r.modulo] = 1; });
      var dn = mine_('Lecciones', tc).filter(function (r) { return r.done === 'SI'; }).length;
      if (tot < 144000 || Object.keys(pas).length < 4 || dn < 20) throw new Error('La persona aún no cumple 40 horas, 20 lecciones y 4 evaluaciones');
      upsert_('Usuarios', 'cedula', tc, { aprobado: 'SI', aprobado_por: u.nombre, aprobado_fecha: now, codigo: text_(ev.codigo, 30) });
      return;
    }
    case 'video':
      if (!admin) throw new Error('Solo el Administrador configura videos');
      upsert_('Config', 'clave', 'video-' + m, { clave: 'video-' + m, valor: JSON.stringify({ id: text_(ev.cfg.id, 20), titulo: text_(ev.cfg.titulo, 200), canal: text_(ev.cfg.canal, 100), duracion: text_(ev.cfg.duracion, 30), activo: !!ev.cfg.activo }) });
      return;
  }
  throw new Error('Evento desconocido: ' + ev.t);
}

function sessionDates_() {
  var out = [], d = new Date(START_DATE + 'T12:00:00Z');
  while (out.length < 20) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}

function rebuildResumen_() {
  var us = rows_('Usuarios'), ses = rows_('Sesiones'), lec = rows_('Lecciones'), ev = rows_('Evaluaciones');
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'), dates = sessionDates_();
  var esperadas = dates.filter(function (d) { return d < today; }).length;
  var out = us.map(function (u) {
    var seg = 0, primer = '';
    ses.forEach(function (r) { if (r.cedula === u.cedula) { seg += +r.segundos || 0; if (!primer || r.inicio < primer) primer = r.inicio; } });
    var hechas = lec.filter(function (r) { return r.cedula === u.cedula && r.done === 'SI'; }).length;
    var best = {};
    ev.forEach(function (r) { if (r.cedula === u.cedula) best[r.modulo] = Math.max(best[r.modulo] || 0, +r.nota || 0); });
    var passed = {};
    ev.forEach(function (r) { if (r.cedula === u.cedula && r.aprobado === 'SI') passed[r.modulo] = 1; });
    var nb = Object.keys(best), prom = nb.length ? nb.reduce(function (a, k) { return a + best[k]; }, 0) / nb.length : '';
    var horas = Math.round(seg / 36) / 100;
    var estado = (hechas >= 20 && Object.keys(passed).length >= 4 && seg >= 144000) ? 'COMPLETADO' : (today < START_DATE ? 'NO INICIADO' : (hechas < esperadas ? 'ATRASADO' : 'EN CURSO'));
    return [u.cedula, u.nombre, u.cargo, u.rol, horas, hechas, Object.keys(passed).length, prom === '' ? '' : Math.round(prom * 10) / 10, primer, u.ultimo_ingreso, estado, u.aprobado === 'SI' ? 'SI' : 'NO', u.codigo, new Date().toISOString()];
  });
  var s = sh_('Resumen'), n = HEAD.Resumen.length;
  var last = s.getLastRow();
  if (last > 1) s.getRange(2, 1, last - 1, n).clearContent();
  if (out.length) {
    if (out.length + 1 > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), out.length + 50);
    s.getRange(2, 1, out.length, n).setValues(out);
  }
}
