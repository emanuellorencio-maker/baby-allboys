# Baby All Boys: Clausura 2026

## Auditoría y alcance (10/09/2026)

Web estática HTML/CSS/JavaScript, sin framework ni build. `index.html` concentra navegación, fixture, tablas, resultados, búsqueda y próxima fecha. `js/app-enhancements.js` agrega instalación PWA, reportes, métricas y avisos. `resultados.html` ofrece una entrada directa a resultados. Las páginas `admin-*` administran resultados, jornada, flyers, métricas y push. Prode e intercambio son módulos separados y conservan sus rutas.

Los datos deportivos se leen desde `data/{c,i,mat1,mat4}/`. Los JSON de la raíz son copias de compatibilidad usadas por herramientas anteriores. Antes de la migración el scraper buscaba Apertura, tenía fixtures fijos de abril a agosto y leía tablas de toda la página: podía combinar secciones de torneos distintos. Había direcciones incrustadas en el HTML, resultados manuales sin identificación de torneo, noticias de abril y una promoción vencida del Mundial. El workflow de tablas seguía funcionando, pero no garantizaba el torneo correcto.

## Tiras verificadas en FEFI

| Identificador estable | Tira | Zona oficial Clausura | Fuente |
|---|---|---|---|
| c | All Boys A | D | https://fefi.com.ar/2026-torneo-anual-baby-futbol/d/ |
| i | All Boys B | I | https://fefi.com.ar/2026-torneo-anual-baby-futbol/i/ |
| mat1 | Los Albos | MAT1 | https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-1/ |
| mat4 | All Boys | MAT4 | https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-4/ |

`c` se conserva como identificador de la tira para no romper enlaces, paneles, suscripciones ni consumidores existentes; ya no significa la zona deportiva actual. `data/torneo.json` contiene esa relación, el año y las categorías. La interfaz muestra D. `?zona=d` se acepta como alias y `data/d/` se genera para nuevos consumidores. No se reemplazan referencias históricas a Zona C en archivos de respaldo/Apertura.

## Fuente y actualización

FEFI → lector Python → validación de las cuatro tiras → JSON versionados → GitHub → despliegue Vercel.

Se inspeccionaron el HTML oficial y el índice público WordPress `/wp-json/`: no se encontró una API deportiva publicada ni URL pública de CSV/Google Sheets en las tablas. La web usa tablas Google renderizadas por Elementor; todas las filas están en la respuesta HTTP, incluso cuando se paginan visualmente. Por eso no hace falta navegador, Playwright ni hacer clic para extraer datos.

El lector `scripts/actualizar_clausura.py` identifica el botón con texto exacto del torneo y su sección `ptN/contN`; expande rowspan/colspan, preserva vacíos y coteja resultados contra local/visitante del fixture. No usa la posición global de una tabla ni suma Apertura, Clausura y Anual. Este vínculo sigue dependiendo del formato publicado por FEFI: si cambia, el proceso falla y conserva los JSON anteriores.

Controles: 15 fechas únicas por tira, meses de Clausura, categorías esperadas, equipos propios presentes, tablas no vacías/sin duplicados, resultados alineados con fixture. Descarga las cuatro fuentes y valida todo antes de escribir; un error de fuente impide publicar el lote. Git publica todos los archivos juntos. Conserva marcadores especiales GP/NP/PP; no los convierte en goles ni inventa resultados para celdas vacías. Los totales/posiciones se toman de FEFI, sin corregir sus criterios administrativos.

`.github/workflows/actualizar-fefi.yml`: diariamente a las 12:00 UTC (09:00 Argentina), con ejecución manual desde Actions → Actualizar datos FEFI → Run workflow. Usa `GITHUB_TOKEN` automático con `contents: write`, sin nuevos secretos. GitHub puede demorar los horarios de cron. El workflow antiguo de tablas queda como diagnóstico manual de solo lectura para evitar dos escritores independientes.

`data/estado-fefi.json` registra origen, último control, última modificación, posición y cobertura por tira. La home enlaza FEFI y advierte si pasaron más de tres días sin control. Si el flujo falla, revisar Actions; no hay un servicio adicional de alertas contratado. Vercel se actualiza con el push de main. Los cron ya existentes en `vercel.json` corresponden a Mundial/noticias; no se reutilizan para escribir archivos efímeros de funciones serverless.

## Comandos

```powershell
python scripts/test_clausura.py
python scripts/actualizar_clausura.py --check  # fuente real, sin escribir
python scripts/actualizar_clausura.py          # generar JSON
python -m http.server 4186 --bind 127.0.0.1
```

Abrir http://127.0.0.1:4186. No existen scripts build, lint ni test en package.json. Verificar JS con `node --check`, incluidos los scripts inline de HTML, y `git diff --check`. `python scraper.py` redirige al lector vigente; las funciones viejas quedan como referencia, no como actualización automática.

## Direcciones, histórico y datos pendientes

`data/clubes-direcciones.json` es la fuente de direcciones del frontend, generada desde los directorios oficiales. Cada club conserva sedes por tira cuando FEFI las distingue. Los JSON de direcciones por zona/raíz son derivados de compatibilidad, no fuentes manuales independientes. `data/clubes.json` sigue siendo el catálogo existente de escudos/alias.

La copia previa a la migración se conserva en `data/historico/apertura-2026/`: es un snapshot del repo anterior, NO un Apertura revalidado. No se borraron fixtures históricos ni respaldos.

Al 10/09 faltan resultados publicados de All Boys B F2 y Los Albos F1. Se muestran como **sin resultado publicado**, sin asumir suspensión. Los horarios por jornada/categoría no están publicados en las cuatro fuentes consultadas: se muestra **A confirmar con el club**. Los campos de fecha libre no se presentan como próxima jornada a disputar. La última fecha pasada no vuelve a mostrarse como próxima cuando termina el torneo.

## Paneles y mantenimiento

Los paneles conservan autenticación y rutas. `guardar-resultados` valida que el cruce coincida con el fixture vigente y etiqueta cada carga con torneo y origen manual. El lector conserva esa carga hasta que FEFI publique resultados verificados. Los overrides viejos sin torneo se conservan en disco pero no se mezclan con Clausura.

La planilla Google Sheets anterior identifica zona/fecha/categoría, sin torneo: sincronizar Clausura allí podría sobrescribir Apertura. Para Clausura, la carga queda guardada en los JSON de la web y el panel devuelve una advertencia de que la planilla requiere separación de torneos. No se cambiaron la planilla, credenciales ni variables de entorno. Para rehabilitar esa sincronización hace falta un destino inequívoco para Clausura y una adaptación explícita.

`MODO_MANTENIMIENTO` en index.html conserva el interruptor de mantenimiento; false reabre la web. El módulo de mejoras consulta el mismo interruptor. Se incrementó la versión del cache PWA a v33-clausura para renovar estilos/scripts; admin y API siguen excluidos del cache.

Las variables existentes se auditaron por nombre en código, sin leer valores: ADMIN_TOKEN/GITHUB_*, GOOGLE_*, SUPABASE_*, VAPID_*, RESEND_API_KEY/SUGERENCIAS_EMAIL, NEWS_API_KEY/API_FOOTBALL_KEY. El flujo FEFI no utiliza ninguna de esas credenciales privadas. La configuración remota y las operaciones autenticadas no pueden darse por probadas con un servidor estático.
