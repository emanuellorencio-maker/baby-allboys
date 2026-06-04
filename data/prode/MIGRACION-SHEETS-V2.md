# Migracion segura a Prode v2 en una copia de Google Sheet

## Objetivo

Probar el backend v2 del Prode en una **copia** de la planilla actual antes de tocar la planilla real.

Esta guia evita:

- romper el flujo actual
- mezclar columnas legacy con columnas v2
- perder datos historicos
- publicar un Web App sobre una hoja incompatible

## Regla principal

**No trabajar sobre la planilla real en esta fase.**

Primero:

1. duplicar la planilla actual
2. probar todo en la copia
3. validar create, lookup, update y etapa abierta
4. recien despues decidir una migracion real

## Checklist antes de empezar

- Tener identificada la planilla actual del Prode
- Tener acceso de edicion a Google Sheets
- Tener acceso a `Extensiones -> Apps Script`
- Tener a mano este archivo:
  - [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs)
- No borrar pestañas legacy
- No renombrar pestañas legacy desde Apps Script
- No intentar migrar filas viejas automaticamente

## Paso 1 - Duplicar la planilla actual

En Google Sheets:

1. Abrir la planilla actual del Prode
2. Ir a `Archivo -> Hacer una copia`
3. Nombre sugerido:
   - `Prode Baby All Boys - copia test v2`
4. Guardar la copia en una carpeta facil de ubicar

## Paso 2 - Archivar pestañas viejas dentro de la copia

En la copia:

1. Ubicar las pestañas viejas usadas por el flujo actual
2. No borrarlas
3. Renombrarlas manualmente con prefijo de archivo, por ejemplo:
   - `LEGACY_Participantes`
   - `LEGACY_Pronosticos`
   - `LEGACY_Log`
4. Si hay otras pestañas relacionadas con el Prode viejo, aplicar el mismo criterio

Objetivo:

- dejar resguardados los datos viejos
- evitar que el Apps Script v2 lea columnas corridas

## Paso 3 - Crear pestañas limpias v2

Crear estas pestañas nuevas y vacias:

- `Participantes`
- `Pronosticos`
- `Etapas`
- `Log`

Si ya existen en la copia, vaciarlas solo si son de prueba y no contienen legacy que quieras conservar.

## Paso 4 - Pegar encabezados exactos

### Hoja `Participantes`

Pegar esta fila 1 exacta:

```text
participant_code | participant_code_normalized | submission_id_inicial | created_at | updated_at | estado_participante | nombre | apellido | nombre_hijo | apellido_hijo | numero_socio | categoria | tira | whatsapp | user_agent_inicial
```

### Hoja `Pronosticos`

Pegar esta fila 1 exacta:

```text
participant_code | submission_id | stage_id | partido_id | equipo_local | equipo_visitante | sign | created_at | updated_at
```

### Hoja `Etapas`

Pegar esta fila 1 exacta:

```text
stage_id | stage_label | status | editable_from | editable_until | visible | notas
```

### Hoja `Log`

Pegar esta fila 1 exacta:

```text
timestamp | tipo | mensaje | raw
```

## Paso 5 - Cargar una etapa abierta minima

En `Etapas`, agregar una fila de prueba:

```text
grupos | Fase de grupos | ABIERTA | 2026-06-01T00:00:00-03:00 | 2026-06-11T20:59:59-03:00 | SI | Carga inicial de prueba
```

Reglas:

- debe existir **una sola** etapa visible y abierta
- no cargar dos filas `ABIERTA` al mismo tiempo

## Paso 6 - Copiar el Apps Script v2 en la copia

1. Abrir la copia de la planilla
2. Ir a `Extensiones -> Apps Script`
3. Crear proyecto o abrir el que corresponda en esa copia
4. Borrar el codigo de prueba anterior si existe
5. Pegar el contenido completo de:
   - [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs)
6. Guardar

## Paso 7 - Publicar el Web App de prueba

1. Ir a `Deploy -> Manage deployments`
2. Crear o editar deployment tipo `Web App`
3. Configurar:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone with the link`
4. Publicar
5. Copiar la URL del Web App de prueba

**No reemplazar todavia la URL del frontend real.**

## Paso 8 - Probar create sin frontend

Usar Postman, curl o Apps Script test manual.

Request sugerido:

```json
{
  "participante": {
    "nombre": "Test",
    "apellido": "Lorencio",
    "nombre_hijo": "Leon",
    "apellido_hijo": "Lorencio",
    "numero_socio": "999991",
    "categoria": "2016",
    "tira": "All Boys A",
    "whatsapp": "1100000000"
  },
  "pronosticos": [
    {
      "partido_id": "M001",
      "equipo_local": "Mexico",
      "equipo_visitante": "South Africa",
      "sign": "LOCAL"
    }
  ],
  "metadata": {
    "origen": "baby-allboys",
    "version": "test-v2",
    "timestamp_cliente": "2026-06-04T00:00:00.000Z",
    "submission_id": "manual-create-test-001",
    "user_agent": "manual-test"
  }
}
```

Esperado:

- `ok: true`
- `mode: created`
- `participant_code`
- nueva fila en `Participantes`
- nueva fila en `Pronosticos`
- log `CREATE_OK`

## Paso 9 - Probar lookup por codigo

Tomar el `participant_code` creado en el paso anterior.

Request:

```json
{
  "action": "get_participant_by_code",
  "participant_code": "BABY-7K4P9"
}
```

Probar tambien:

- `baby7k4p9`
- `baby 7k4p9`

Esperado:

- mismo participante en los tres casos
- misma etapa abierta
- mismos pronosticos

## Paso 10 - Probar update por etapa

Request:

```json
{
  "action": "update_stage_predictions",
  "participant_code": "BABY-7K4P9",
  "stage_id": "grupos",
  "pronosticos": [
    {
      "partido_id": "M001",
      "equipo_local": "Mexico",
      "equipo_visitante": "South Africa",
      "sign": "EMPATE"
    }
  ],
  "metadata": {
    "submission_id": "manual-update-test-001"
  }
}
```

Esperado:

- `ok: true`
- `mode: updated`
- en `Pronosticos`, quedan solo los registros nuevos de `BABY-7K4P9 + grupos`
- en `Participantes`, cambia `updated_at`
- log `UPDATE_OK`

## Paso 11 - Interpretar errores

### `INVALID_HEADERS`

Significa:

- encabezados distintos a los esperados
- o tabs mezcladas con estructura vieja

Que hacer:

- revisar fila 1 exacta de cada hoja
- no usar tabs legacy como tabs v2

### `NO_OPEN_STAGE`

Significa:

- no hay etapa abierta visible

Que hacer:

- revisar `Etapas`
- dejar una sola fila `ABIERTA`

### `STAGE_CLOSED`

Significa:

- la etapa existe pero no es editable

Que hacer:

- revisar `status`
- revisar `editable_from`
- revisar `editable_until`

### `DUPLICATE_WITHOUT_CODE`

Significa:

- ya existe ese participante con la regla fuerte actual

Que hacer:

- usar lookup por codigo para continuar

### `CODE_NOT_FOUND`

Significa:

- no existe ese codigo en `Participantes`

Que hacer:

- revisar typo
- revisar normalizacion

## Paso 12 - Criterios para considerar la prueba exitosa

La prueba en copia es exitosa si se cumplen todos:

- create genera `participant_code`
- lookup encuentra el mismo participante por codigo normalizado
- update reemplaza solo la etapa indicada
- no se crean duplicados al repetir create con mismo participante
- los logs aparecen en `Log`
- no hay errores de encabezados
- no hay dos etapas abiertas

## Paso 13 - Rollback en la copia

Si algo falla:

- no corregir la planilla real
- cerrar el deployment de prueba o dejar de usarlo
- borrar solo las tabs v2 de la copia si queres recomenzar
- conservar tabs `LEGACY_*`

## Que NO hacer todavia en la planilla real

- no reemplazar encabezados viejos por encabezados v2 sobre datos legacy
- no borrar tabs legacy
- no mover filas legacy automaticamente
- no publicar el Web App v2 sobre la planilla real
- no cambiar la URL del frontend real
- no probar updates sobre datos reales todavia

## Recomendacion final

Primero validar todo en una copia limpia.

Solo cuando esa copia pase create + lookup + update + etapa abierta sin errores, recien definir:

1. si se migra la planilla real
2. si se crean tabs nuevas en la real
3. si se publica el Web App v2 sobre la planilla real
