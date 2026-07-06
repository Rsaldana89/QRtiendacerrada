require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

// Configuración del motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboardcat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false // se debe configurar a true si se usa HTTPS
    }
  })
);

// Rutas
app.use(publicRoutes);
app.use(authRoutes);
app.use('/admin', adminRoutes);

// Manejo de 404
app.use((req, res) => {
  res.status(404).render('404');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});