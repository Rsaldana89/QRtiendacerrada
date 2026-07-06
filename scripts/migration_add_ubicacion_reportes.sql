-- Migracion para guardar ubicacion opcional del cliente al enviar un reporte.
-- Ejecutar una sola vez en MySQL Workbench.

USE qr_tienda_cerrada;

ALTER TABLE reportes
  ADD COLUMN cliente_latitud DOUBLE NULL AFTER fecha_hora,
  ADD COLUMN cliente_longitud DOUBLE NULL AFTER cliente_latitud,
  ADD COLUMN cliente_precision_m DOUBLE NULL AFTER cliente_longitud,
  ADD COLUMN cliente_ubicacion_consentimiento TINYINT(1) NOT NULL DEFAULT 0 AFTER cliente_precision_m,
  ADD COLUMN cliente_ubicacion_capturada_at DATETIME NULL AFTER cliente_ubicacion_consentimiento;

SELECT 'Migracion de ubicacion de reportes aplicada correctamente' AS resultado;
