-- Migracion para controlar opciones generales del sistema
-- Ejecutar una vez en MySQL Workbench o por consola.

USE qr_tienda_cerrada;

CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave VARCHAR(100) PRIMARY KEY,
  valor VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES ('usar_ubicaciones', '0', 'Muestra u oculta el boton para sugerir sucursal con GPS en el formulario publico')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

SELECT clave, valor, descripcion FROM configuracion_sistema;
