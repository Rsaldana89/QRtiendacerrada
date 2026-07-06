const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// Mostrar formulario de login
router.get('/login', (req, res) => {
  // Si ya está logueado, redirigir al dashboard
  if (req.session.user) {
    return res.redirect('/admin');
  }
  res.render('login', { error: null });
});

// Procesar inicio de sesión
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { error: 'Ingrese usuario y contraseña' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username]
    );
    if (!rows.length) {
      return res.render('login', { error: 'Usuario o contraseña incorrectos' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { error: 'Usuario o contraseña incorrectos' });
    }
    // Establecer sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol
    };
    return res.redirect('/admin');
  } catch (err) {
    console.error(err);
    return res.render('login', { error: 'Error al iniciar sesión' });
  }
});

// Cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;