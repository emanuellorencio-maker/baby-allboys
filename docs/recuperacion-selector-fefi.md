# Recuperación del selector FEFI 2026

El 2/10 se encontró el reemplazo oficial de las rutas por zona: `https://fefi.com.ar/2026-torneo-anual-baby-futbol/?zona=d&vista=fechas-clausura`. Las zonas I, MAT1 y MAT4 usan `i`, `1` y `4`. No se importa ninguna página 2025.

El adaptador lee las cuatro vistas HTML públicas (fixture, resultados, tablas y direcciones). Valida año/canonical, parámetros, zona seleccionada, título, torneo del selector, vista, categorías, 15 fechas y correspondencia de equipos. Se incluyen todos los paneles, aunque estén ocultos o la fecha por defecto sea F8.

Los marcadores vacíos siguen pendientes; GP/NP se conservan literalmente. No se generan horarios. Las iniciales decorativas de escudos no forman parte del nombre del club.

La comparación con el último estado bueno no eliminó ni alteró marcadores existentes. Se agregaron I/F2, MAT1/F1 y F8, MAT4/F8. F3 de MAT1 es libre: se conserva su detalle histórico ya verificado, porque el nuevo selector solo resume los 15 puntos y coincide con los equipos y puntos guardados. No se inventa detalle por categoría a partir del resumen.

F9 del 3/10 sigue pendiente: Agronomía Central–All Boys A, All Boys B–Los Andes, Los Albos–Platense Blanco y Complejo Costas Celeste–All Boys.

Las tablas incorporan las novedades oficiales. Los nombres y direcciones del directorio se mantienen; cambia su enlace de procedencia. Los 42 escudos conservan identidad, sede y archivo, con la nueva URL de directorio y la anterior guardada como `fuenteFefiAnterior`.

Validación: 14 tests Python, fragmentos oficiales de cuatro tiras, importación aislada, rechazo de otro año/zona/vista y fuente incompleta, más las pruebas JS de escudos, navegación, tablas y resumen. El workflow manual de validación también ejecuta estos tests antes de `--check`; no escribe datos.

La protección inicial fue publicada en `aa7ddca`. Su CI rechazó correctamente las URLs antiguas. Esta recuperación utiliza una fuente 2026 distinta y verificada, manteniendo esa protección.
