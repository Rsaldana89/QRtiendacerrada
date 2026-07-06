const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware para proteger rutas privadas
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
});

async function getUsarUbicaciones() {
  const [rows] = await pool.query(
    `SELECT valor FROM configuracion_sistema WHERE clave = 'usar_ubicaciones' LIMIT 1`
  );
  return rows.length ? rows[0].valor === '1' : false;
}

// Dashboard principal
router.get('/', async (req, res) => {
  try {
    const [todayRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM reportes WHERE DATE(fecha_hora) = CURDATE()'
    );
    const [weekRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM reportes WHERE YEARWEEK(fecha_hora, 1) = YEARWEEK(CURDATE(), 1)'
    );
    const [monthRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM reportes WHERE YEAR(fecha_hora) = YEAR(CURDATE()) AND MONTH(fecha_hora) = MONTH(CURDATE())'
    );
    const counts = {
      today: todayRows[0].count,
      week: weekRows[0].count,
      month: monthRows[0].count
    };
    const usarUbicaciones = await getUsarUbicaciones();
    res.render('admin/dashboard', { user: req.session.user, counts, usarUbicaciones });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar el dashboard');
  }
});

// Pantalla de configuracion
router.get('/configuracion', async (req, res) => {
  try {
    const usarUbicaciones = await getUsarUbicaciones();
    res.render('admin/settings', {
      user: req.session.user,
      usarUbicaciones,
      saved: req.query.saved === '1'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar la configuracion');
  }
});

// Guardar configuracion
router.post('/configuracion', async (req, res) => {
  try {
    const usarUbicaciones = req.body.usar_ubicaciones === '1' ? '1' : '0';
    await pool.query(
      `INSERT INTO configuracion_sistema (clave, valor, descripcion)
       VALUES ('usar_ubicaciones', ?, 'Muestra u oculta el boton para sugerir sucursal con GPS en el formulario publico')
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), descripcion = VALUES(descripcion)`,
      [usarUbicaciones]
    );
    res.redirect('/admin/configuracion?saved=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar la configuracion');
  }
});

// Listado y filtros de reportes
router.get('/reportes', async (req, res) => {
  try {
    const { fecha, mes, sucursal_id, fecha_inicio, fecha_fin } = req.query;
    const conditions = [];
    const params = [];
    if (fecha) {
      conditions.push('DATE(r.fecha_hora) = ?');
      params.push(fecha);
    }
    if (mes) {
      conditions.push("DATE_FORMAT(r.fecha_hora, '%Y-%m') = ?");
      params.push(mes);
    }
    if (fecha_inicio && fecha_fin) {
      conditions.push('DATE(r.fecha_hora) BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }
    if (sucursal_id) {
      conditions.push('r.sucursal_id = ?');
      params.push(sucursal_id);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const query = `SELECT r.id, r.sucursal_id, s.nombre AS sucursal, DATE_FORMAT(r.fecha_hora, '%d/%m/%Y') AS fecha, TIME_FORMAT(r.fecha_hora, '%H:%i:%s') AS hora, DATE_FORMAT(r.fecha_hora, '%d/%m/%Y %H:%i:%s') AS fecha_hora,
                          r.cliente_latitud, r.cliente_longitud, r.cliente_precision_m, r.cliente_ubicacion_consentimiento,
                          CASE
                            WHEN r.cliente_latitud IS NOT NULL AND r.cliente_longitud IS NOT NULL
                            THEN CONCAT('https://www.google.com/maps?q=', r.cliente_latitud, ',', r.cliente_longitud)
                            ELSE NULL
                          END AS cliente_maps_url
                   FROM reportes r
                   JOIN sucursales s ON r.sucursal_id = s.id
                   ${where}
                   ORDER BY r.fecha_hora DESC`;
    const [reports] = await pool.query(query, params);
    const [sucursales] = await pool.query(
      'SELECT id, nombre FROM sucursales WHERE activa = 1 ORDER BY nombre ASC'
    );
    res.render('admin/reports', {
      user: req.session.user,
      reports,
      sucursales,
      filters: { fecha, mes, sucursal_id, fecha_inicio, fecha_fin }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los reportes');
  }
});

// Exportar reportes a CSV
router.get('/reportes/exportar', async (req, res) => {
  try {
    const { fecha, mes, sucursal_id, fecha_inicio, fecha_fin } = req.query;
    const conditions = [];
    const params = [];
    if (fecha) {
      conditions.push('DATE(r.fecha_hora) = ?');
      params.push(fecha);
    }
    if (mes) {
      conditions.push("DATE_FORMAT(r.fecha_hora, '%Y-%m') = ?");
      params.push(mes);
    }
    if (fecha_inicio && fecha_fin) {
      conditions.push('DATE(r.fecha_hora) BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }
    if (sucursal_id) {
      conditions.push('r.sucursal_id = ?');
      params.push(sucursal_id);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const query = `SELECT r.id, s.nombre AS sucursal, DATE_FORMAT(r.fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora,
                          r.cliente_ubicacion_consentimiento, r.cliente_latitud, r.cliente_longitud, r.cliente_precision_m,
                          CASE
                            WHEN r.cliente_latitud IS NOT NULL AND r.cliente_longitud IS NOT NULL
                            THEN CONCAT('https://www.google.com/maps?q=', r.cliente_latitud, ',', r.cliente_longitud)
                            ELSE ''
                          END AS cliente_maps_url
                   FROM reportes r
                   JOIN sucursales s ON r.sucursal_id = s.id
                   ${where}
                   ORDER BY r.fecha_hora DESC`;
    const [rows] = await pool.query(query, params);
    const escapeCsv = (value) => {
      const str = String(value ?? '');
      return '"' + str.replace(/"/g, '""') + '"';
    };
    let csv = 'ID,Sucursal,FechaHora,ConsentimientoUbicacion,Latitud,Longitud,PrecisionMetros,GoogleMaps\n';
    rows.forEach((row) => {
      csv += [
        row.id,
        row.sucursal,
        row.fecha_hora,
        row.cliente_ubicacion_consentimiento ? 'Si' : 'No',
        row.cliente_latitud || '',
        row.cliente_longitud || '',
        row.cliente_precision_m || '',
        row.cliente_maps_url || ''
      ].map(escapeCsv).join(',') + '\n';
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reportes.csv"');
    return res.send('\uFEFF' + csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al exportar reportes');
  }
});


// QR general para cartel de reporte
router.get('/sucursales/qr.png', async (req, res) => {
  try {
    const QRCode = require('qrcode');
    const targetUrl = 'https://tiendacerradaqr.up.railway.app/';
    const buffer = await QRCode.toBuffer(targetUrl, {
      type: 'png',
      width: 900,
      margin: 2,
      color: {
        dark: '#65171e',
        light: '#ffffff'
      }
    });
    const download = req.query.download === '1';
    res.setHeader('Content-Type', 'image/png');
    if (download) {
      res.setHeader('Content-Disposition', 'attachment; filename="qr-tienda-cerrada-coronel.png"');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al generar el QR');
  }
});

// Panel de sucursales
router.get('/sucursales', async (req, res) => {
  try {
    const { q, activa } = req.query;
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push('(nombre LIKE ? OR usuario_soporte360 LIKE ? OR municipio LIKE ? OR nombre_referencia_ubicacion LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    if (activa === '1' || activa === '0') {
      conditions.push('activa = ?');
      params.push(activa);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [sucursales] = await pool.query(
      `SELECT id, branch_number, nombre, usuario_soporte360, nombre_referencia_ubicacion, municipio, maps_url, latitud, longitud, ubicacion_activa, activa
       FROM sucursales
       ${where}
       ORDER BY id ASC`,
      params
    );

    const [statsRows] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN activa = 1 THEN 1 ELSE 0 END) AS activas,
         SUM(CASE WHEN ubicacion_activa = 1 THEN 1 ELSE 0 END) AS con_ubicacion
       FROM sucursales`
    );

    res.render('admin/branches', {
      user: req.session.user,
      sucursales,
      stats: statsRows[0],
      filters: { q, activa },
      qrUrl: 'https://tiendacerradaqr.up.railway.app/'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar sucursales');
  }
});

router.get('/sucursales/nueva', (req, res) => {
  res.render('admin/branch_form', {
    user: req.session.user,
    mode: 'create',
    sucursal: {},
    error: null
  });
});

router.post('/sucursales', async (req, res) => {
  try {
    const data = normalizeSucursalBody(req.body);
    if (!data.nombre) {
      return res.render('admin/branch_form', {
        user: req.session.user,
        mode: 'create',
        sucursal: req.body,
        error: 'El nombre de la sucursal es obligatorio.'
      });
    }

    await pool.query(
      `INSERT INTO sucursales
       (branch_number, nombre, usuario_soporte360, nombre_referencia_ubicacion, municipio, maps_url, latitud, longitud, ubicacion_activa, activa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.branch_number,
        data.nombre,
        data.usuario_soporte360,
        data.nombre_referencia_ubicacion,
        data.municipio,
        data.maps_url,
        data.latitud,
        data.longitud,
        data.ubicacion_activa,
        data.activa
      ]
    );
    res.redirect('/admin/sucursales?saved=1');
  } catch (err) {
    console.error(err);
    res.render('admin/branch_form', {
      user: req.session.user,
      mode: 'create',
      sucursal: req.body,
      error: 'No se pudo guardar la sucursal. Revisa los datos capturados.'
    });
  }
});

router.get('/sucursales/:id/editar', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sucursales WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).send('Sucursal no encontrada');
    res.render('admin/branch_form', {
      user: req.session.user,
      mode: 'edit',
      sucursal: rows[0],
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar sucursal');
  }
});

router.post('/sucursales/:id', async (req, res) => {
  try {
    const data = normalizeSucursalBody(req.body);
    if (!data.nombre) {
      data.id = req.params.id;
      return res.render('admin/branch_form', {
        user: req.session.user,
        mode: 'edit',
        sucursal: data,
        error: 'El nombre de la sucursal es obligatorio.'
      });
    }

    await pool.query(
      `UPDATE sucursales
       SET branch_number = ?, nombre = ?, usuario_soporte360 = ?, nombre_referencia_ubicacion = ?, municipio = ?, maps_url = ?, latitud = ?, longitud = ?, ubicacion_activa = ?, activa = ?
       WHERE id = ?`,
      [
        data.branch_number,
        data.nombre,
        data.usuario_soporte360,
        data.nombre_referencia_ubicacion,
        data.municipio,
        data.maps_url,
        data.latitud,
        data.longitud,
        data.ubicacion_activa,
        data.activa,
        req.params.id
      ]
    );
    res.redirect('/admin/sucursales?saved=1');
  } catch (err) {
    console.error(err);
    req.body.id = req.params.id;
    res.render('admin/branch_form', {
      user: req.session.user,
      mode: 'edit',
      sucursal: req.body,
      error: 'No se pudo actualizar la sucursal.'
    });
  }
});

router.post('/sucursales/:id/toggle', async (req, res) => {
  try {
    await pool.query('UPDATE sucursales SET activa = IF(activa = 1, 0, 1) WHERE id = ?', [req.params.id]);
    res.redirect('/admin/sucursales');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cambiar estatus de sucursal');
  }
});

// Panel de usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const { q, activo } = req.query;
    const conditions = [];
    const params = [];
    if (q) {
      conditions.push('(nombre LIKE ? OR username LIKE ? OR rol LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (activo === '1' || activo === '0') {
      conditions.push('activo = ?');
      params.push(activo);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [usuarios] = await pool.query(
      `SELECT id, nombre, username, rol, activo, created_at, updated_at
       FROM usuarios
       ${where}
       ORDER BY nombre ASC`,
      params
    );
    res.render('admin/users', {
      user: req.session.user,
      usuarios,
      filters: { q, activo, error: req.query.error }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar usuarios');
  }
});

router.get('/usuarios/nuevo', (req, res) => {
  res.render('admin/user_form', {
    user: req.session.user,
    mode: 'create',
    usuario: { rol: 'manager', activo: 1 },
    error: null
  });
});

router.post('/usuarios', async (req, res) => {
  try {
    const { nombre, username, password } = req.body;
    const rol = 'manager';
    const activo = req.body.activo === '1' ? 1 : 0;
    if (!nombre || !username || !password) {
      return res.render('admin/user_form', {
        user: req.session.user,
        mode: 'create',
        usuario: req.body,
        error: 'Nombre, usuario y contraseña son obligatorios.'
      });
    }

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO usuarios (nombre, username, password, rol, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), username.trim(), hashed, rol, activo]
    );
    res.redirect('/admin/usuarios?saved=1');
  } catch (err) {
    console.error(err);
    res.render('admin/user_form', {
      user: req.session.user,
      mode: 'create',
      usuario: req.body,
      error: 'No se pudo guardar el usuario. Revisa que el username no esté duplicado.'
    });
  }
});

router.get('/usuarios/:id/editar', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, username, rol, activo FROM usuarios WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).send('Usuario no encontrado');
    res.render('admin/user_form', {
      user: req.session.user,
      mode: 'edit',
      usuario: rows[0],
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar usuario');
  }
});

router.post('/usuarios/:id', async (req, res) => {
  try {
    const { nombre, username, password } = req.body;
    const rol = 'manager';
    const activo = req.body.activo === '1' ? 1 : 0;
    if (!nombre || !username) {
      req.body.id = req.params.id;
      return res.render('admin/user_form', {
        user: req.session.user,
        mode: 'edit',
        usuario: req.body,
        error: 'Nombre y usuario son obligatorios.'
      });
    }

    if (password && password.trim()) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE usuarios SET nombre = ?, username = ?, password = ?, rol = ?, activo = ? WHERE id = ?',
        [nombre.trim(), username.trim(), hashed, rol, activo, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nombre = ?, username = ?, rol = ?, activo = ? WHERE id = ?',
        [nombre.trim(), username.trim(), rol, activo, req.params.id]
      );
    }

    if (Number(req.params.id) === Number(req.session.user.id)) {
      req.session.user.nombre = nombre.trim();
      req.session.user.username = username.trim();
      req.session.user.rol = rol;
    }

    res.redirect('/admin/usuarios?saved=1');
  } catch (err) {
    console.error(err);
    req.body.id = req.params.id;
    res.render('admin/user_form', {
      user: req.session.user,
      mode: 'edit',
      usuario: req.body,
      error: 'No se pudo actualizar el usuario. Revisa que el username no esté duplicado.'
    });
  }
});

router.post('/usuarios/:id/toggle', async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.session.user.id)) {
      return res.redirect('/admin/usuarios?error=self');
    }
    await pool.query('UPDATE usuarios SET activo = IF(activo = 1, 0, 1) WHERE id = ?', [req.params.id]);
    res.redirect('/admin/usuarios');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cambiar estatus de usuario');
  }
});

function normalizeSucursalBody(body) {
  const numberOrNull = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const textOrNull = (value) => {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text ? text : null;
  };
  return {
    branch_number: numberOrNull(body.branch_number),
    nombre: textOrNull(body.nombre),
    usuario_soporte360: textOrNull(body.usuario_soporte360),
    nombre_referencia_ubicacion: textOrNull(body.nombre_referencia_ubicacion),
    municipio: textOrNull(body.municipio),
    maps_url: textOrNull(body.maps_url),
    latitud: numberOrNull(body.latitud),
    longitud: numberOrNull(body.longitud),
    ubicacion_activa: body.ubicacion_activa === '1' ? 1 : 0,
    activa: body.activa === '0' ? 0 : 1
  };
}

module.exports = router;
