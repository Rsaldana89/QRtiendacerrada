-- Migración para administración de sucursales y usuarios
-- Ejecutar sobre la base qr_tienda_cerrada.

USE qr_tienda_cerrada;

-- Asegura columnas necesarias para administrar sucursales y ubicaciones.
-- Si alguna columna ya existe, MySQL puede marcar Duplicate column name en versiones antiguas.
-- En ese caso, comenta esa línea y vuelve a ejecutar.
ALTER TABLE sucursales
  ADD COLUMN branch_number INT NULL AFTER id,
  ADD COLUMN nombre_referencia_ubicacion VARCHAR(255) NULL AFTER usuario_soporte360,
  ADD COLUMN municipio VARCHAR(255) NULL AFTER nombre_referencia_ubicacion,
  ADD COLUMN maps_url TEXT NULL AFTER municipio,
  ADD COLUMN latitud DOUBLE NULL AFTER maps_url,
  ADD COLUMN longitud DOUBLE NULL AFTER latitud,
  ADD COLUMN ubicacion_activa TINYINT(1) DEFAULT 0 AFTER longitud;

-- Si ya tenías latitud/longitud como DECIMAL, cambia a DOUBLE para evitar truncados.
ALTER TABLE sucursales
  MODIFY COLUMN latitud DOUBLE NULL,
  MODIFY COLUMN longitud DOUBLE NULL;

-- Tabla de configuración del sistema.
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave VARCHAR(100) PRIMARY KEY,
  valor VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES ('usar_ubicaciones', '0', 'Muestra u oculta el boton para sugerir sucursal con GPS en el formulario publico')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
