-- Zona horaria del sistema: Querétaro / centro de México (UTC-06:00)
-- Este SET solo afecta la sesión actual de Workbench.
SET time_zone = '-06:00';

-- Verificación: ambas horas deben mostrar una diferencia de 6 horas.
SELECT UTC_TIMESTAMP() AS hora_utc,
       NOW() AS hora_local_sesion;

-- IMPORTANTE:
-- El código Node.js configura automáticamente -06:00 en cada conexión nueva.
-- Para corregir un reporte que ya se guardó 6 horas adelantado, usa su ID concreto:
-- UPDATE reportes
-- SET fecha_hora = DATE_SUB(fecha_hora, INTERVAL 6 HOUR)
-- WHERE id = 7;
--
-- No ejecutes un UPDATE para toda la tabla si también importaste reportes locales
-- que ya tenían el horario correcto.
