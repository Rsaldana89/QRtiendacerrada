// Script para sembrar datos iniciales como usuarios y sucursales.
// Ejecutar con `node scripts/seed_data.js`. Usa variables de entorno para conectarse a la base de datos.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seed() {
  const users = [
    {
      nombre: 'Sergio',
      username: 'sergio',
      password: 'Cambiar123',
      rol: 'manager'
    },
    {
      nombre: 'Oscar',
      username: 'oscar',
      password: 'Cambiar123',
      rol: 'manager'
    },
    {
      nombre: 'Sistemas',
      username: 'sistemas',
      password: 'Cambiar123',
      rol: 'manager'
    }
  ];
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    for (const user of users) {
      // Hashear la contraseña
      const hashed = await bcrypt.hash(user.password, 10);
      // Revisar si existe el usuario
      const [rows] = await connection.query('SELECT id FROM usuarios WHERE username = ?', [user.username]);
      if (rows.length === 0) {
        await connection.query(
          'INSERT INTO usuarios (nombre, username, password, rol) VALUES (?, ?, ?, ?)',
          [user.nombre, user.username, hashed, user.rol]
        );
        console.log(`Usuario ${user.username} creado.`);
      } else {
        console.log(`Usuario ${user.username} ya existe, se omite.`);
      }
    }

    console.log('Seeding completado.');
    await connection.end();
  } catch (err) {
    console.error('Error al sembrar datos:', err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

seed();