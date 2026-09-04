-- Migración: detalle obligatorio en nuevos reportes de "Me negaron un servicio"
-- Base de datos de producción Railway.
-- La columna acepta NULL para conservar sin cambios los reportes históricos.

USE railway;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reportes'
    AND COLUMN_NAME = 'detalle_servicio_negado'
);

SET @migration_sql = IF(
  @col_exists = 0,
  'ALTER TABLE reportes ADD COLUMN detalle_servicio_negado VARCHAR(200) NULL AFTER tipo_reporte',
  'SELECT ''La columna detalle_servicio_negado ya existe; no se realizaron cambios.'' AS mensaje'
);

PREPARE stmt FROM @migration_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificación final: debe mostrar VARCHAR(200) y YES en IS_NULLABLE.
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'reportes'
  AND COLUMN_NAME = 'detalle_servicio_negado';
