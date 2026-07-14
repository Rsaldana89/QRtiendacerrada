// Pool de conexión MySQL.
// Railway ejecuta MySQL en UTC; la aplicación opera con horario de Querétaro (UTC-06:00).
require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_TIMEZONE = process.env.DB_TIMEZONE || '-06:00';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: DB_TIMEZONE,
  dateStrings: true
});

// NOW(), CURDATE(), DATE_FORMAT() y los filtros usarán la misma zona horaria
// en cada conexión nueva, tanto localmente como en Railway.
pool.on('connection', (connection) => {
  connection.query(`SET time_zone = '${DB_TIMEZONE}'`, (error) => {
    if (error) {
      console.error('No fue posible configurar la zona horaria de MySQL:', error.message);
    }
  });
});

module.exports = pool;
