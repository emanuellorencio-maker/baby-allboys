# Carga del Prode Mundial Baby All Boys

## Como anotar a un padre

Usa `planilla_prode_modelo.csv` en Excel o Google Sheets. Cada fila es un pronostico de un padre para un partido.

Para un padre nuevo completa siempre:

- `id`: un codigo unico, por ejemplo `P013`.
- `nombre`
- `apellido`
- `nombre_hijo`
- `categoria`: 2013 a 2022.
- `tira`: All Boys A, All Boys B, Los Albos o All Boys.
- `telefono_opcional`: solo para tu control. La web no lo muestra.

## Como cargar pronosticos

Repeti el mismo `id` del padre en varias filas, una por partido.

Campos del pronostico:

- `partido_id`: debe existir en `partidos.json`.
- `equipo_local` y `equipo_visitante`: son solo ayuda visual para no confundirse.
- `goles_local_pronostico`
- `goles_visitante_pronostico`

## Como convertir la planilla a participantes.json

1. Exporta la planilla como CSV.
2. Guardala como `data/prode/planilla_prode_modelo.csv` o usa otra ruta.
3. Corre:

```bash
node scripts/convertir_planilla_prode.js
```

Tambien podes pasar rutas:

```bash
node scripts/convertir_planilla_prode.js mi-planilla.csv data/prode/participantes.json
```

## Que campos no tocar

En `partidos.json`, no cambies:

- `id`
- `instancia`
- `grupo`
- `equipo_local`
- `equipo_visitante`

Salvo que FIFA actualice oficialmente un dato o se complete una eliminatoria.

## Como cargar resultados reales

Cuando un partido termina, en `data/prode/partidos.json` completa:

```json
"resultado_real": {
  "goles_local": 2,
  "goles_visitante": 1
},
"estado": "finalizado"
```

Si el partido ya cerro pronosticos pero todavia no termino:

```json
"estado": "cerrado"
```

Si todavia se puede pronosticar:

```json
"estado": "abierto"
```

## Que pasa si un partido todavia no termino

No suma puntos. En el detalle aparece como pendiente.

## Automatizaciones en Vercel

Los cron jobs estan configurados en `vercel.json`.

Para que puedan guardar cambios reales en los JSON desde Vercel, configura estas variables:

- `GITHUB_TOKEN`: token con permiso para escribir contents en el repo.
- `GITHUB_REPO`: por ejemplo `emanuellorencio-maker/baby-allboys-test`.
- `GITHUB_BRANCH`: normalmente `main`.
- `API_FOOTBALL_KEY`: opcional para actualizar resultados del Mundial desde API-Football.
- `NEWS_API_KEY`: opcional para noticias del Mundial si se usa NewsAPI.

Si no hay claves, la web sigue funcionando con los JSON manuales.
