// Script para importar sucursales desde un archivo Excel (.xlsx).
// Ejecutar con: npm run import:sucursales -- ruta/al/archivo.xlsx
// Estructura esperada: primera fila como encabezado. Columnas sugeridas:
// 1) ID o número de tienda, 2) nombre de sucursal, 3) usuario Soporte360.

require('dotenv').config();
const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');

function normalizeCell(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    if (value.text) return String(value.text).trim();
    if (value.result) return String(value.result).trim();
    if (value.richText) return value.richText.map((r) => r.text).join('').trim();
    if (value.hyperlink && value.text) return String(value.text).trim();
  }
  return String(value).trim();
}

async function importSucursales(filePath) {
  if (!filePath) {
    console.error('Debe proporcionar la ruta del archivo Excel como argumento.');
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    console.error('El archivo Excel no contiene hojas.');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  let inserted = 0;
  try {
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rawId = normalizeCell(row.getCell(1).value);
      const nombre = normalizeCell(row.getCell(2).value);
      const usuarioSoporte = normalizeCell(row.getCell(3).value);

      if (!nombre) continue;

      const numericId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;

      if (numericId) {
        await connection.query(
          `INSERT INTO sucursales (id, nombre, usuario_soporte360, activa)
           VALUES (?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE
             nombre = VALUES(nombre),
             usuario_soporte360 = VALUES(usuario_soporte360),
             activa = 1`,
          [numericId, nombre, usuarioSoporte || null]
        );
      } else {
        await connection.query(
          `INSERT INTO sucursales (nombre, usuario_soporte360, activa)
           VALUES (?, ?, 1)`,
          [nombre, usuarioSoporte || null]
        );
      }
      inserted++;
    }

    console.log(`${inserted} sucursales importadas/actualizadas correctamente.`);
  } finally {
    await connection.end();
  }
}

const filePath = process.argv[2];
importSucursales(filePath).catch((err) => {
  console.error('Error importando sucursales:', err);
  process.exit(1);
});
