# Cámara y presentación para familias

En `admin-jornada.html`, elegir tira y fecha, comprobar que YouTube transmite,
marcar **Habilitar cámara del club** y guardar la jornada activa.
El enlace es editable porque una futura transmisión puede tener otra URL.
El botón público aparece solo para condición Local y vence 12 horas después
del último guardado. Desmarcar la cámara al finalizar; el marcador puede seguir
funcionando sin video. No se detecta automáticamente si YouTube está transmitiendo.

`js/live-camera.js` centraliza las condiciones y acepta exclusivamente enlaces
HTTPS de videos YouTube. No requiere claves nuevas ni cambios de base de datos.

El Prode se conserva como histórico en Git, sin accesos en inicio/admin,
sin precarga PWA y excluido de la publicación mediante `.vercelignore`.
Se retiraron sus dos tareas programadas de Vercel. Las noticias del club continúan.

`css/familias.css` contiene la nueva presentación. Los rivales usan iniciales
neutras; no se inventaron escudos ni colores. Fixtures, resultados y tablas
mantienen sus fuentes y lógica.

Validación: `node scripts/test-live-camera.js`, sintaxis de JS e inline HTML,
`git diff --check` y revisión visual en escritorio/celular.
