# Escudos de clubes

El catálogo `data/clubes-escudos.json` contiene 40 entradas revisadas: 12 de Zona D (clave interna c), 10 de I, 9 de MAT1 y 9 de MAT4. Hay 36 imágenes únicas y 18 entradas rivales pendientes que conservan iniciales neutras. No basta con encontrar un escudo que coincida por nombre. Cada archivo conserva su URL de origen, fuentes de identidad, observaciones y SHA-256; la prueba verifica también la integridad de las imágenes.

Agronomía Central usa el PNG limpio de su sitio oficial con un nombre de archivo nuevo para evitar caché vieja. La procedencia de la imagen anterior permanece en el catálogo. Lomas Blanco y Club Lomas del Mirador comparten el escudo institucional con entradas independientes; tampoco se atribuyen variantes especiales a Villa Real Rojo o Racing Club 2. El asset autorizado de Argentinos Juniors tiene fondo cuadriculado incrustado: se conserva sin reconstrucción hasta verificar una alternativa transparente oficial.

Siguen pendientes los candidatos de Soldati 32, Marchigiana, Luján de los Patriotas, Lugano Tennis Club y K. A. C. No se incorporan sus imágenes. Para Kimberley, las variantes de diagonal contradictorias requieren aclaración antes de elegir un emblema.

Cada entrada requiere `estado: "verificado"`, `nombre`, `zona` (clave interna: `c`, `i`, `mat1` o `mat4`), `direccion`, `localidad`, `fuenteFefi`, `fuenteIdentidad`, `fuenteEscudo` y `archivo`. Nombre, dirección, localidad y fuente FEFI deben corresponder a la sede en `data/clubes-direcciones.json`. Las dos fuentes adicionales deben documentar la identidad y el origen del escudo, con URL HTTPS. El archivo debe existir en `assets/escudos/`, con nombre en minúsculas y guiones y extensión png, webp, jpg o svg.

Se mantienen separadas las entradas por tira aunque representen la misma institución. CIENCIA Y LABOR (D: César Díaz 2453) y CLUB CIENCIA Y LABOR (I: Cuenca 1750) comparten el escudo cotejado visualmente con una foto de cancha de la entrevista al presidente; esa entrevista confirma el alquiler de la cancha de UAS en Cuenca 1750. Las direcciones originales no se modifican. Los Cuervos y Los Carasucias comparten el escudo institucional de San Lorenzo con entradas independientes y nombres de tira preservados. San Telmo conserva fallback mientras su sede figure A CONFIRMAR.

Usar imágenes verificadas y revisar visualmente cualquier SVG antes de incorporarlo. Documentar la comprobación y la fecha en campos adicionales de la entrada. Si se reutiliza una imagen para varias tiras, registrar una entrada independiente por sede. El resolver rechaza entradas duplicadas y rutas externas. Si el catálogo o una imagen falla, la web conserva el fallback.

Los escudos se muestran en las ubicaciones existentes: próximo partido, tarjetas de fixture y jornada en vivo. No se modifican resultados, fixtures ni tablas.

Validación: `node scripts/test-escudos.js`, `node scripts/test-tablas-torneos.js`, `node --check js/app-enhancements.js`, `git diff --check`. Este proyecto no tiene scripts npm build, lint ni test. La vista local estática no valida endpoints Vercel.

La integración vive en index.html y el catálogo usa la política network-first ya existente para data/*.json. No cambia el service worker. Para futuros cambios de una imagen publicada, usar un nombre nuevo: los assets de imagen usan cache-first.
