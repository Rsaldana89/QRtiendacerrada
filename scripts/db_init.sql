-- Script de creación de tablas para el sistema de reportes de tiendas cerradas

CREATE TABLE IF NOT EXISTS `sucursales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `branch_number` INT DEFAULT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `usuario_soporte360` VARCHAR(255) DEFAULT NULL,
  `nombre_referencia_ubicacion` VARCHAR(255) DEFAULT NULL,
  `municipio` VARCHAR(255) DEFAULT NULL,
  `maps_url` TEXT DEFAULT NULL,
  `latitud` DOUBLE DEFAULT NULL,
  `longitud` DOUBLE DEFAULT NULL,
  `ubicacion_activa` TINYINT(1) DEFAULT 0,
  `activa` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(50) NOT NULL,
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reportes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sucursal_id` INT NOT NULL,
  `tipo_reporte` VARCHAR(40) NOT NULL DEFAULT 'tienda_cerrada',
  `fecha_hora` DATETIME NOT NULL,
  `cliente_latitud` DOUBLE NULL,
  `cliente_longitud` DOUBLE NULL,
  `cliente_precision_m` DOUBLE NULL,
  `cliente_ubicacion_consentimiento` TINYINT(1) NOT NULL DEFAULT 0,
  `cliente_ubicacion_capturada_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reportes_tipo_fecha` (`tipo_reporte`, `fecha_hora`),
  CONSTRAINT `fk_reportes_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `configuracion_sistema` (
  `clave` VARCHAR(100) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `configuracion_sistema` (`clave`, `valor`, `descripcion`)
VALUES ('usar_ubicaciones', '0', 'Muestra u oculta el boton para sugerir sucursal con GPS en el formulario publico')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);
