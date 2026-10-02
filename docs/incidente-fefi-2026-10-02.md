# Fallo de actualización FEFI del 2 de octubre de 2026

## Evidencia y alcance

- Run: https://github.com/emanuellorencio-maker/baby-allboys/actions/runs/37043090237
- Job `actualizar`, ID `110957784351`, commit `3c02f3418d71dfffea3ac2cd1d37e2ed1a562823`.
- A las 17:47:41 UTC pasaron los cuatro tests. A las 17:48:05 UTC falló `section(..., 'FIXTURE CLAUSURA')`. El paso de publicación se omitió.
- Se reprodujo el mismo error localmente, sin escrituras, con ese código y `--check`.
- Las cuatro rutas públicas `/2026-torneo-anual-baby-futbol/{d,i,mat-1,mat-4}/` devolvieron HTTP 301 hacia las rutas equivalentes de **2025**, que devolvieron HTTP 200. La URL canónica de D también apunta a 2025.
- El run no guardó el HTML ni la URL final. La redirección explica el fallo reproducido ahora; su presencia exacta durante el run original es una inferencia, no un dato registrado por ese run.
- El lector original seguía las redirecciones sin comprobar el año ni la zona final. La validación de secciones impidió la importación en este caso, pero no era una protección explícita contra otro año.
- El sitio público respondió HTTP 200 durante esta revisión. Fallo del actualizador no equivale a caída del sitio.

## Corrección local

1. Derivar el año de la configuración y exigir coherencia con el identificador `clausura-AÑO`.
2. Validar HTTPS, host FEFI y ruta exacta del año/zona de la respuesta antes de leer su contenido. No reintentar una identidad inválida.
3. Exigir una URL canónica única que coincida con esa identidad antes de interpretar tablas. Una página sin identidad verificable se rechaza.
4. Reunir el diagnóstico de las cuatro tiras y abortar con código 1 si cualquiera falla, antes de preparar o escribir archivos y antes de actualizar `verificado`.

No se cambiaron datos, reglas de resultados, workflow, web pública, permisos ni credenciales. No hay fallback a 2025 ni éxito ficticio. No se usaron planillas privadas.

## Validación

- `python scripts/test_clausura.py`: 10 tests aprobados, incluidos los cuatro originales, redirección 2025 antes de leer, canonical de otro año/zona/host, canonical ausente/duplicada, cuatro fixtures guardados y ninguna escritura ni mensaje de éxito si falla una tira.
- Python 3.12 con `beautifulsoup4==4.14.3`, misma versión que CI; dependencia preparada en carpeta aislada fuera del repositorio, sin instalación global.
- `python scripts/actualizar_clausura.py --check`: rechazo esperado de las cuatro fuentes reales por redirección a 2025; no se generaron datos ni se modificó la última verificación.
- `node --check js/app-enhancements.js` y `git diff --check`: aprobados. No existen scripts npm build/lint/test.
- No se pudo validar una importación completa contra una fuente 2026 válida: las URLs actuales no la entregan. Las pruebas con fixtures son pruebas aisladas, no acreditan una actualización real.

## Publicación y dependencia externa

Protección preparada en `codex/fefi-source-validation`, basada en `3c02f34`; publicación autorizada por el usuario el 2/10/2026. Para recuperar actualizaciones reales hace falta que FEFI restablezca las páginas 2026 o verificar nuevas URLs oficiales equivalentes; no se propone sustituirlas por páginas 2025 ni cambiar el cron para esconder fallos.

Último estado bueno conservado en el repositorio: `verificado=2026-10-01T18:22:11.104770+00:00`; `actualizado=2026-09-27T16:52:11.302862+00:00`.
