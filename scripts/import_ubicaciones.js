// Script para importar datos opcionales de ubicación desde CSV.
// Ejecutar con: npm run import:ubicaciones -- ruta/al/archivo.csv
// Columnas reconocidas: id, branch_number, name, municipality, maps_url, status, is_active,
// latitud/latitude/lat y longitud/longitude/lng.

require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

function parseCsvLine(line) {
  const result = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  result.push(value);
  return result;
}

function parseCsv(content) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index].trim() : null;
    });
    return row;
  });
}

function clean(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function numberOrNull(value) {
  const text = clean(value);
  if (!text) return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function getFirst(row, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const value = clean(row[key]);
      if (value !== null) return value;
    }
  }
  return null;
}

async function main(filePath) {
  if (!filePath) {
    console.error('Debe proporcionar la ruta del archivo CSV como argumento.');
    process.exit(1);
  }

  const csv = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(csv);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  let updated = 0;
  let withCoordinates = 0;

  try {
    for (const row of rows) {
      const branchNumber = numberOrNull(getFirst(row, ['branch_number', 'branchNumber', 'numero', 'numero_tienda', 'id']));
      const referenceName = getFirst(row, ['name', 'nombre', 'store_name', 'sucursal']);
      const municipality = getFirst(row, ['municipality', 'municipio']);
      const mapsUrl = getFirst(row, ['maps_url', 'mapsUrl', 'google_maps', 'url_maps']);
      const isActiveRaw = getFirst(row, ['is_active', 'activa', 'activo']);
      const lat = numberOrNull(getFirst(row, ['latitud', 'latitude', 'lat']));
      const lng = numberOrNull(getFirst(row, ['longitud', 'longitude', 'lng', 'lon']));

      if (!branchNumber) continue;

      const hasCoordinates = lat !== null && lng !== null;
      if (hasCoordinates) withCoordinates++;

      const activeValue = isActiveRaw === null ? 1 : (String(isActiveRaw) === '0' ? 0 : 1);

      await connection.query(
        `UPDATE sucursales
         SET branch_number = ?,
             nombre_referencia_ubicacion = ?,
             municipio = ?,
             maps_url = ?,
             latitud = ?,
             longitud = ?,
             ubicacion_activa = ?,
             activa = ?
         WHERE id = ?`,
        [
          branchNumber,
          referenceName,
          municipality,
          mapsUrl,
          lat,
          lng,
          hasCoordinates ? 1 : 0,
          activeValue,
          branchNumber
        ]
      );
      updated++;
    }

    console.log(`${updated} referencias de ubicación actualizadas.`);
    console.log(`${withCoordinates} sucursales quedaron con coordenadas activas para cálculo automático.`);
  } finally {
    await connection.end();
  }
}

main(process.argv[2]).catch((err) => {
  console.error('Error importando ubicaciones:', err);
  process.exit(1);
});
