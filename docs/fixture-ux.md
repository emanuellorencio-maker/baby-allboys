# Lote local: fixture, direcciones y ayuda FEFI

Preparado el 30/09/2026 en `codex/fixture-direcciones`, sobre `6778318`. Publicación autorizada por el usuario el 30/09/2026 después de revisar el alcance del lote.

- Filtros Todas / En casa / De visitante con contador y selección accesible. La próxima jornada permanece visible.
- Copia de dirección confirmada con aviso de éxito o alternativa de selección manual si el navegador no permite copiar. Las sedes a confirmar no generan mapas.
- Botón Ver resultado, espera real de carga y foco en la fecha elegida. El buscador no sobrescribe datos de otra tira cuando llegan respuestas tardías.
- Ayuda desplegable por tira: categorías existentes, marcadores pendientes y enlace al reglamento oficial. Se distingue la consulta de esta web de una actualización de FEFI.
- Resumen visual: se reprodujo con una prueba el falso empate con totales cero y marcadores vacíos. Ahora se omite ese resumen y se conservan los 0–0 numéricos reales. No se modifican resultados ni reglas de puntuación.

## Fuentes y alcance

Se reutiliza la importación y el directorio existentes. Las categorías proceden de `data/torneo.json`; no hay scraper nuevo, horarios nuevos, alertas de suspensión ni importación de anuncios históricos.

- Zona D: https://fefi.com.ar/2026-torneo-anual-baby-futbol/d/
- Zona I: https://fefi.com.ar/2026-torneo-anual-baby-futbol/i/
- MAT1: https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-1/
- MAT4: https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-4/
- Reglamento enlazado sin copiar horarios: https://fefi.com.ar/reglamento-baby-futbol/

MAT1 ya tenía los cinco grupos correctos. El parser ya preserva vacíos, estado oficial y códigos: no se cambió. Ningún archivo de datos fue modificado. Se mantienen 42 escudos verificados y 16 fallbacks.

## Validación

Pasaron `test-fixture-ux.js`, `test-resumen-pendiente.js`, `test-tablas-torneos.js`, `test-escudos.js`, `test-live-camera.js` y `test-guardar-clausura.js`; también sintaxis JS y `git diff --check`.

Chrome local de la notebook: cuatro tiras, 320/390/1440 px, filtros, tablas, resultados, navegación y foco, 42 imágenes, códigos GP/NP y dirección pendiente. Sin desborde horizontal. Copia probada con portapapeles simulado, sin modificar el portapapeles real. Tema claro y oscuro inspeccionados visualmente.

Limitación: `test_clausura.py` no pudo ejecutarse porque el Python disponible no tiene `bs4`; no se instalaron dependencias. El parser no cambió. La vista local es estática y no valida endpoints de producción.

Se versiona la URL del JS modificado para evitar reutilizar su versión anterior desde la caché de la PWA; no se cambia el service worker.
