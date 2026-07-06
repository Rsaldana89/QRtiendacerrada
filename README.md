# Sistema de reporte de tiendas cerradas

Este proyecto es una aplicación web mínima desarrollada con **Node.js**, **Express.js**, **MySQL** y **EJS** para permitir que los clientes reporten que una tienda está cerrada mediante un código QR y que los administradores puedan consultar dichos reportes a través de un panel privado.

## Características principales

### Formulario público

* Acceso a través de una URL pública (`/reporte`), idealmente enlazada desde un código QR.
* Lista desplegable de sucursales para que el cliente seleccione cuál está cerrada.
* No se piden datos personales ni ubicación del cliente.
* Tras el envío se registra automáticamente la sucursal, la fecha y la hora en la base de datos.
* Pantalla de confirmación de envío.

### Panel de administración

* Autenticación con usuario y contraseña (rol *manager*).
* Dashboard con tarjetas que muestran la cantidad de reportes del día, de la semana y del mes.
* Listado detallado de reportes con filtros por fecha, semana, mes y sucursal.
* Exportación de reportes filtrados a CSV.
* Opción de cerrar sesión.

## Estructura del proyecto

```
qr-report-app/
├── app.js                # Punto de entrada de la aplicación Express
├── db.js                 # Configuración del pool de conexiones a MySQL
├── routes/               # Rutas públicas, de autenticación y del panel
│   ├── admin.js
│   ├── auth.js
│   └── public.js
├── views/                # Plantillas EJS para las páginas
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   └── reports.ejs
│   ├── layouts/
│   │   ├── admin.ejs
│   │   └── public.ejs
│   ├── login.ejs
│   ├── report_form.ejs
│   ├── thanks.ejs
│   └── 404.ejs
├── public/
│   └── css/
│       └── style.css     # Estilos CSS básicos y responsivos
├── scripts/
│   ├── db_init.sql       # SQL para crear las tablas necesarias
│   ├── init_db.js        # Script Node para ejecutar db_init.sql y crear la BD
│   ├── seed_data.js      # Script Node para crear usuarios iniciales
│   └── import_sucursales.js # Script Node para importar sucursales desde Excel
├── package.json
├── .env.example
└── README.md
```

## Requisitos previos

* **Node.js** v14 o superior y **npm**.
* **MySQL** 5.7 o superior (o MariaDB compatible).

## Instalación

1. Clona o descarga este repositorio y navega al directorio del proyecto.

```bash
cd qr-report-app
```

2. Instala las dependencias.

```bash
npm install
```

3. Copia el archivo `.env.example` a `.env` y completa los valores de tu base de datos y la clave de sesión.

```bash
cp .env.example .env
nano .env  # o tu editor favorito
```

Los valores más importantes son:

* `DB_HOST` – Host donde corre MySQL (ej. `localhost`).
* `DB_PORT` – Puerto de MySQL (usualmente `3306`).
* `DB_USER` – Usuario con permisos para crear BD/tablas.
* `DB_PASSWORD` – Contraseña del usuario de la BD.
* `DB_NAME` – Nombre de la base de datos que utilizará la aplicación.
* `SESSION_SECRET` – Cadena secreta para firmar las sesiones de Express.
* `PORT` – Puerto en el que se levantará el servidor Express.

## Creación de la base de datos

Puedes crear la base de datos y sus tablas de dos maneras:

### Opción A: Ejecutar el SQL manualmente

1. Conéctate a tu servidor MySQL y crea la base de datos indicada en `DB_NAME`.

```sql
CREATE DATABASE IF NOT EXISTS qr_reports;
USE qr_reports;
```

2. Ejecuta el contenido del archivo `scripts/db_init.sql` para crear las tablas `sucursales`, `usuarios` y `reportes`.

### Opción B: Usar el script Node

El proyecto incluye un script que se conecta a MySQL, crea la base de datos (si no existe) y ejecuta el SQL de creación de tablas.

```bash
npm run db:init
```

Este comando utilizará las credenciales definidas en tu archivo `.env` para conectarse.

## Carga de sucursales

Se puede cargar la lista de sucursales desde un archivo Excel (extensión `.xlsx`).

1. Asegúrate de que tu archivo tenga la información en las primeras columnas, por ejemplo: **ID**, **Nombre**, **Usuario de soporte360**, etc. La primera fila debe ser el encabezado.
2. Ejecuta el script de importación pasando la ruta del archivo Excel como argumento:

```bash
npm run import:sucursales -- ruta/al/archivo.xlsx
```

Ejemplo:

```bash
npm run import:sucursales -- ./data/sucursales.xlsx
```

El script leerá cada fila (omitiendo la de encabezado) e insertará o actualizará la sucursal en la tabla `sucursales`. Si ya existe una sucursal con el mismo `id`, se actualizará su nombre y usuario de soporte.

## Carga opcional de ubicaciones

La tabla `sucursales` incluye campos opcionales para ubicación:

* `branch_number`
* `nombre_referencia_ubicacion`
* `municipio`
* `maps_url`
* `latitud`
* `longitud`
* `ubicacion_activa`

El formulario público incluye el botón **“Usar mi ubicación para sugerir sucursal”**. Este botón usa la ubicación del navegador y calcula la sucursal más cercana, pero solamente funciona con sucursales que tengan `latitud`, `longitud` y `ubicacion_activa = 1`.

Si ya tenías creada la tabla `sucursales` antes de esta versión, primero ejecuta la migración:

```sql
source scripts/migration_add_ubicacion_sucursales.sql;
```

O abre el archivo en MySQL Workbench y ejecútalo manualmente.

Luego puedes importar referencias desde CSV:

```bash
npm run import:ubicaciones -- ./data/ubicaciones.csv
```

Columnas reconocidas:

* `id`
* `branch_number`
* `name`
* `municipality`
* `maps_url`
* `is_active`
* `latitud`, `latitude` o `lat`
* `longitud`, `longitude`, `lng` o `lon`

Nota: un enlace corto de Google Maps como `https://maps.app.goo.gl/...` sirve como referencia visual, pero no permite calcular distancias por sí solo. Para que el botón de ubicación sugiera la tienda automáticamente, hay que llenar coordenadas reales en `latitud` y `longitud`.

## Sembrar usuarios iniciales

Para crear los usuarios iniciales (Sergio, Oscar y Sistemas) ejecuta:

```bash
npm run db:seed
```

Los usuarios se crean con la contraseña **`Cambiar123`** (encriptada usando bcrypt). Se recomienda cambiarla antes de pasar a producción.

Usuarios creados:

| Nombre    | Usuario  | Contraseña |
|-----------|----------|------------|
| Sergio    | sergio   | Cambiar123 |
| Oscar     | oscar    | Cambiar123 |
| Sistemas  | sistemas | Cambiar123 |

## Ejecución en modo desarrollo

Para arrancar el servidor con recarga automática utilizando `nodemon`:

```bash
npm run dev
```

Para iniciar la aplicación en modo producción (sin recarga automática):

```bash
npm start
```

La aplicación quedará disponible en `http://localhost:PORT` donde `PORT` es el valor configurado en tu archivo `.env` (por defecto `3000`).

### Rutas principales

* **`/reporte`** – Formulario público donde el cliente selecciona la sucursal y envía el reporte.
* **`/gracias`** – Página de agradecimiento tras enviar el reporte.
* **`/privacidad`** – Aviso de privacidad simplificado sobre el uso opcional de ubicación.
* **`/login`** – Página de inicio de sesión para administradores.
* **`/admin`** – Dashboard privado con resumen de reportes (requiere autenticación).
* **`/admin/reportes`** – Listado de reportes con filtros.
* **`/admin/reportes/exportar`** – Exportación de los reportes filtrados en formato CSV.

## Despliegue en Railway

1. Crea una cuenta en [Railway](https://railway.app/) y un nuevo proyecto.
2. Sube este repositorio como un proyecto Node.js.
3. Configura una base de datos MySQL dentro de Railway o conecta una base de datos externa. Copia las credenciales en las variables de entorno del proyecto:
   * `DB_HOST`
   * `DB_PORT`
   * `DB_USER`
   * `DB_PASSWORD`
   * `DB_NAME`
   * `SESSION_SECRET`
   * `PORT` (Railway usará automáticamente el puerto asignado por la variable `$PORT`)
4. Ejecuta `npm run db:init` y `npm run db:seed` en Railway mediante los scripts de despliegue o manualmente en el terminal provisto por Railway para crear las tablas y los usuarios iniciales.
5. Despliega la aplicación. Railway detectará que se trata de una aplicación Node.js y ejecutará `npm start` por defecto.

## Consideraciones de seguridad

* **Contraseñas**: Las contraseñas se almacenan de manera segura utilizando el algoritmo de hash `bcrypt`. Para este proyecto se incluyen contraseñas simples para pruebas, pero deben cambiarse antes de entrar a producción.
* **Sesiones**: Las sesiones se gestionan con `express-session` y se firman con un `SESSION_SECRET`. Usa una clave secreta suficientemente aleatoria en producción.
* **Variables de entorno**: Nunca subas tus credenciales de base de datos al repositorio. Usa el archivo `.env` localmente y las variables de entorno configuradas en tu proveedor de despliegue.

---

¡El proyecto está listo para usarse! No dudes en personalizar estilos, agregar nuevas funcionalidades o mejorar la experiencia según tus necesidades.
## Módulos administrativos agregados

### Sucursales

Ruta principal:

```text
/admin/sucursales
```

Permite:

* Ver todas las sucursales.
* Buscar por nombre, municipio, usuario Soporte360 o referencia de ubicación.
* Filtrar activas/inactivas.
* Crear sucursales nuevas.
* Editar datos de sucursal.
* Activar o desactivar sucursales.
* Capturar datos opcionales de ubicación: municipio, URL de Maps, latitud, longitud y ubicación activa.
* Ver y descargar el QR general del sistema.

Rutas:

```text
GET  /admin/sucursales
GET  /admin/sucursales/nueva
POST /admin/sucursales
GET  /admin/sucursales/:id/editar
POST /admin/sucursales/:id
POST /admin/sucursales/:id/toggle
GET  /admin/sucursales/qr.png
GET  /admin/sucursales/qr.png?download=1
```

El QR descargable apunta a:

```text
https://tiendacerradaqr.up.railway.app/
```

### Usuarios

Ruta principal:

```text
/admin/usuarios
```

Permite:

* Ver usuarios del panel.
* Buscar por nombre, usuario o rol.
* Filtrar activos/inactivos.
* Crear usuarios nuevos.
* Editar nombre y username.
* Cambiar contraseña.
* Activar o desactivar usuarios.

Rutas:

```text
GET  /admin/usuarios
GET  /admin/usuarios/nuevo
POST /admin/usuarios
GET  /admin/usuarios/:id/editar
POST /admin/usuarios/:id
POST /admin/usuarios/:id/toggle
```

> Nota: por ahora todos los usuarios se crean con rol `manager`.

### Dependencia nueva para QR

Se agregó la dependencia `qrcode`. Si estás actualizando una instalación existente, ejecuta:

```bash
npm install
```

o específicamente:

```bash
npm install qrcode
```


## Ubicación opcional del cliente en reportes

Esta versión permite que el cliente autorice opcionalmente la captura de su ubicación al momento de enviar un reporte.

Para actualizar una base existente, ejecutar:

```bash
# desde MySQL Workbench o consola MySQL
scripts/migration_add_ubicacion_reportes.sql
```

Cuando el cliente marca la casilla **Recolectar mi ubicación para fines informativos del reporte**, el sistema guarda latitud, longitud, precisión aproximada y fecha/hora de captura. En el panel `/admin/reportes` aparece un enlace **Ver mapa** para abrir el punto en Google Maps.

En el formulario de alta/edición de sucursal, al capturar latitud y longitud se muestra una vista previa en mapa y un botón para abrir las coordenadas en Google Maps.
