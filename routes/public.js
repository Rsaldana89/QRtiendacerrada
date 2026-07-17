const express = require('express');
const router = express.Router();
const pool = require('../db');

const REPORT_TYPES = {
  tienda_cerrada: 'Encontré cerrada la tienda',
  servicio_negado: 'Me negaron un servicio'
};

// Redirigir raíz al formulario de reporte
router.get('/', (req, res) => {
  return res.redirect('/reporte');
});

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function validLatLng(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Mostrar formulario de reporte con listado de sucursales activas
router.get('/reporte', async (req, res) => {
  try {
    const [sucursales] = await pool.query(
      `SELECT id, nombre, latitud, longitud, ubicacion_activa
       FROM sucursales
       WHERE activa = 1
       ORDER BY nombre ASC`
    );
    const [settingsRows] = await pool.query(
      `SELECT valor FROM configuracion_sistema WHERE clave = 'usar_ubicaciones' LIMIT 1`
    );
    const usarUbicaciones = settingsRows.length ? settingsRows[0].valor === '1' : false;
    res.render('report_form', { sucursales, usarUbicaciones, reportTypes: REPORT_TYPES });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar las sucursales');
  }
});

// Procesar envío de reporte
router.post('/reporte', async (req, res) => {
  const { sucursal_id, tipo_reporte } = req.body;
  if (!REPORT_TYPES[tipo_reporte]) {
    return res.status(400).send('Debe seleccionar un tipo de reporte válido');
  }
  if (!sucursal_id) {
    return res.status(400).send('Debe seleccionar una sucursal');
  }

  const consentimientoUbicacion = req.body.consentimiento_ubicacion === '1' ? 1 : 0;
  const clienteLatitud = consentimientoUbicacion ? numberOrNull(req.body.cliente_latitud) : null;
  const clienteLongitud = consentimientoUbicacion ? numberOrNull(req.body.cliente_longitud) : null;
  const clientePrecision = consentimientoUbicacion ? numberOrNull(req.body.cliente_precision_m) : null;
  const guardarUbicacion = consentimientoUbicacion && validLatLng(clienteLatitud, clienteLongitud);

  try {
    const [rows] = await pool.query(
      'SELECT id FROM sucursales WHERE id = ? AND activa = 1',
      [sucursal_id]
    );
    if (!rows.length) {
      return res.status(400).send('Sucursal no válida');
    }

    await pool.query(
      `INSERT INTO reportes
       (sucursal_id, tipo_reporte, fecha_hora, cliente_latitud, cliente_longitud, cliente_precision_m, cliente_ubicacion_consentimiento, cliente_ubicacion_capturada_at)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [
        sucursal_id,
        tipo_reporte,
        guardarUbicacion ? clienteLatitud : null,
        guardarUbicacion ? clienteLongitud : null,
        guardarUbicacion ? clientePrecision : null,
        consentimientoUbicacion,
        guardarUbicacion ? new Date() : null
      ]
    );
    return res.redirect(`/gracias?tipo=${encodeURIComponent(tipo_reporte)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar el reporte');
  }
});

router.get('/gracias', (req, res) => {
  const tipo = REPORT_TYPES[req.query.tipo] ? req.query.tipo : null;
  res.render('thanks', {
    tipoReporte: tipo,
    tipoReporteLabel: tipo ? REPORT_TYPES[tipo] : null
  });
});

router.get('/privacidad', (req, res) => {
  res.render('privacidad');
});

module.exports = router;
