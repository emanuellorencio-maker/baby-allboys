# Baby All Boys

## Intercambio Mundial 2026

La seccion `intercambio.html` funciona en modo demo con `localStorage` para poder probar perfiles, album, carga rapida, matches, ranking y admin sin romper el sitio actual. En este modo los datos quedan en el navegador y no se comparten todavia entre usuarios reales.

Para datos compartidos reales en Vercel, preparar Supabase con estas variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` para funciones API serverless

Tablas sugeridas:

- `profiles`: `id`, `nickname`, `category`, `team`, `pin_hash`, `created_at`, `updated_at`, `is_active`
- `stickers`: `id`, `profile_id`, `sticker_number`, `quantity`, `status`, `updated_at`

`status`: `missing`, `owned`, `duplicate`.

Reglas de seguridad:

- No pedir apellido completo, direccion, telefono ni email del chico.
- Guardar el PIN hasheado, nunca en texto plano.
- Usar funciones API de Vercel para crear perfiles, validar PIN, leer rankings y calcular matches.
- Mantener el cliente con permisos anonimos de solo lectura o con RPCs controladas.

Admin demo:

- Entrar a `intercambio.html?admin=1`.
- Clave local demo: `allboys2026`.
