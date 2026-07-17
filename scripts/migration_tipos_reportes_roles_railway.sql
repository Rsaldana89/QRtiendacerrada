-- Migración para agregar tipos de reporte y habilitar los roles manager/usuario.
-- Ejecutar UNA VEZ en la base existente. Es compatible con MySQL 8 y Railway.

USE railway;

SET SQL_SAFE_UPDATES = 0;

-- Agrega tipo_reporte únicamente si todavía no existe.
SET @columna_tipo_existe = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reportes'
    AND COLUMN_NAME = 'tipo_reporte'
);

SET @sql_agregar_tipo = IF(
  @columna_tipo_existe = 0,
  'ALTER TABLE reportes ADD COLUMN tipo_reporte VARCHAR(40) NOT NULL DEFAULT ''tienda_cerrada'' AFTER sucursal_id',
  'SELECT 1 AS columna_tipo_ya_existia'
);
PREPARE stmt FROM @sql_agregar_tipo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Todos los reportes anteriores corresponden al flujo original de tienda cerrada.
UPDATE reportes
SET tipo_reporte = 'tienda_cerrada'
WHERE tipo_reporte IS NULL OR tipo_reporte = '';

-- Índice opcional para acelerar filtros por tipo y fecha.
SET @indice_tipo_existe = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reportes'
    AND INDEX_NAME = 'idx_reportes_tipo_fecha'
);

SET @sql_agregar_indice = IF(
  @indice_tipo_existe = 0,
  'CREATE INDEX idx_reportes_tipo_fecha ON reportes (tipo_reporte, fecha_hora)',
  'SELECT 1 AS indice_tipo_ya_existia'
);
PREPARE stmt FROM @sql_agregar_indice;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Normaliza roles antiguos o vacíos como manager. El nuevo rol disponible es usuario.
UPDATE usuarios
SET rol = 'manager'
WHERE rol IS NULL OR rol = '' OR rol NOT IN ('manager', 'usuario');

SET SQL_SAFE_UPDATES = 1;

-- Verificación.
SELECT tipo_reporte, COUNT(*) AS total
FROM reportes
GROUP BY tipo_reporte;

SELECT id, nombre, username, rol, activo
FROM usuarios
ORDER BY nombre;
