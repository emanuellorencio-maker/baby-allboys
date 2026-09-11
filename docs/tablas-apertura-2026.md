# Tablas Apertura / Clausura 2026

## Fuente y zonas verificadas

Se extrajo exclusivamente **TABLAS APERTURA** de FEFI, con tabla general y todas
sus categorías. No se utilizaron resultados calculados ni TABLAS ANUALES.

| Tira (clave estable) | Zona Apertura | Fuente FEFI | Tablas | Filas |
| --- | --- | --- | --- | --- |
| All Boys A (c) | C | https://fefi.com.ar/2026-torneo-anual-baby-futbol/c/ | 8 | 128 |
| All Boys B (i) | I | https://fefi.com.ar/2026-torneo-anual-baby-futbol/i/ | 8 | 128 |
| Los Albos (mat1) | MAT1 | https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-1/ | 6 | 96 |
| All Boys MAT4 (mat4) | MAT4 | https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-4/ | 7 | 112 |

Cada tabla contiene 16 clubes. `posicion` representa el orden de las filas
publicadas por FEFI, sin ordenar ni recalcular puntajes. Se conservan PJ, G, E,
P y puntos, incluso si alguna cifra oficial no coincide con cálculos derivados.
Cada JSON incluye fuente, sección, zona, torneo y fecha de verificación.

## Diferencias con el histórico existente

Los cuatro históricos en `data/historico/apertura-2026/` tienen 32 filas por
tabla: las primeras 16 coinciden con Apertura y luego aparece otro bloque.
Los nuevos JSON contienen únicamente las 16 filas oficiales de Apertura.
Los históricos se conservaron íntegros y no se utilizan para este selector.

## Funcionamiento y alcance

Los datos nuevos están en `data/apertura-2026/{c,i,mat1,mat4}/tabla.json`.
Clausura sigue leyendo `data/{c,i,mat1,mat4}/tabla.json` sin modificaciones.
El selector inicia en Clausura, mantiene el torneo al cambiar de tira y cambia
sin recargar la página. Se reutilizan estilos y renderizado actuales.
Dentro de Tablas, la zona de los botones refleja el torneo seleccionado.
Al salir, las zonas vuelven al contexto actual de Clausura.

El estado y la caché de Apertura están aislados de `tablasData`, utilizado por
fixture, búsqueda y resúmenes. Respuestas tardías no reemplazan otra selección.
No se modifican fixtures, resultados, noticias, CSS, APIs, PWA ni mantenimiento.

## Verificación reproducible

- `python scripts/verificar_apertura.py`: contrasta cada celda con FEFI sin escribir.
- `node scripts/test-tablas-torneos.js`: prueba aislamiento y cambios rápidos.
- `node --check js/app-enhancements.js` y `git diff --check`.
- Sintaxis de ambos scripts inline del HTML comprobada con Node.
- Navegador: cuatro tiras, ambos torneos, categorías, desktop y móvil 390px.
- Mantenimiento probado temporalmente en local con true y restaurado a false.
- No existen scripts build, lint ni test en package.json.

Para probar localmente: `python -m http.server 4189` y abrir
http://127.0.0.1:4189/ . Los endpoints de Vercel no funcionan en este servidor estático.
