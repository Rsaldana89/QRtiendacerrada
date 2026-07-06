// Script para inicializar la base de datos y crear las tablas necesarias.
// Se ejecuta con `node scripts/init_db.js` y requiere que existan las variables de entorno configuradas.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    // Crear la base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    const sqlPath = path.join(__dirname, 'db_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await connection.query(sql);
    console.log('Base de datos y tablas creadas correctamente');
    await connection.end();
  } catch (err) {
    console.error('Error al crear la base de datos:', err);
    process.exit(1);
  }
}

initDatabase();