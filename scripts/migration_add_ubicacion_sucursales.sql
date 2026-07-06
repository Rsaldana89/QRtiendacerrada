-- Migración para agregar datos opcionales de ubicación a sucursales existentes.
-- Ejecutar una sola vez después de npm run db:init si la tabla sucursales ya existía.

USE qr_tienda_cerrada;

ALTER TABLE sucursales
  ADD COLUMN branch_number INT DEFAULT NULL AFTER id,
  ADD COLUMN nombre_referencia_ubicacion VARCHAR(255) DEFAULT NULL AFTER usuario_soporte360,
  ADD COLUMN municipio VARCHAR(255) DEFAULT NULL AFTER nombre_referencia_ubicacion,
  ADD COLUMN maps_url TEXT DEFAULT NULL AFTER municipio,
  ADD COLUMN latitud DECIMAL(10,8) DEFAULT NULL AFTER maps_url,
  ADD COLUMN longitud DECIMAL(11,8) DEFAULT NULL AFTER latitud,
  ADD COLUMN ubicacion_activa TINYINT(1) DEFAULT 0 AFTER longitud;

-- Índice sugerido para búsquedas por número de sucursal/referencia.
CREATE INDEX idx_sucursales_branch_number ON sucursales (branch_number);
CREATE INDEX idx_sucursales_ubicacion_activa ON sucursales (ubicacion_activa);
