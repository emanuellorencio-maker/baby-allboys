# Google Apps Script para Prode 26 All Boys - v2 con codigo unico

Esta version prepara la Fase 1 del backend del Prode con:

- `participant_code` unico por participante
- compatibilidad con el flujo actual create-only
- lookup por codigo
- update por etapa abierta
- hoja `Etapas`
- soporte legacy sin migracion automatica

## 1. Archivo fuente recomendado

El codigo copiable quedo separado en:

- [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs)

Separa mejor responsabilidades que dejar un bloque enorme dentro del Markdown y reduce riesgo de copiar mal el script.

## 2. Compatibilidad mantenida

El v2 sigue aceptando un POST sin `action`, pero ahora tambien soporta:

- `tipo_participante`
- `metadata.access_code`
- create, lookup y update por etapa

Regla:

- si el POST no trae `action`, el Apps Script asume:
  - `create_participant_submission`

El frontend publico ya puede usar:

- [C:\Users\emanu\OneDrive\Desktop\fefi-app\prode-cargar.html](C:\Users\emanu\OneDrive\Desktop\fefi-app\prode-cargar.html)
- [C:\Users\emanu\OneDrive\Desktop\fefi-app\prode-mundial.html](C:\Users\emanu\OneDrive\Desktop\fefi-app\prode-mundial.html)
- [C:\Users\emanu\OneDrive\Desktop\fefi-app\js\prode-mundial.js](C:\Users\emanu\OneDrive\Desktop\fefi-app\js\prode-mundial.js)

## 3. Hojas necesarias y columnas exactas

Crear o ajustar estas hojas:

- `Participantes`
- `Pronosticos`
- `Etapas`
- `Log`

### Hoja `Participantes`

```text
participant_code | participant_code_normalized | submission_id_inicial | created_at | updated_at | estado_participante | nombre | apellido | nombre_hijo | apellido_hijo | numero_socio | categoria | tira | whatsapp | user_agent_inicial | tipo_participante | vinculo_baby | jugador_vinculado_nombre | jugador_vinculado_apellido | categoria_vinculada | tira_vinculada | access_code_validated
```

### Hoja `Pronosticos`

```text
participant_code | submission_id | stage_id | partido_id | equipo_local | equipo_visitante | sign | created_at | updated_at
```

### Hoja `Etapas`

```text
stage_id | stage_label | status | editable_from | editable_until | visible | notas
```

### Hoja `Log`

```text
timestamp | tipo | mensaje | raw
```

## 4. Que hacer con registros legacy

- no migrar automaticamente
- no generar codigos retroactivos todavia
- las nuevas altas nacen con `participant_code`
- los registros viejos pueden quedar con columnas nuevas vacias

Recomendacion:

- primero publicar la estructura nueva
- despues, si hace falta, asignar codigos legacy caso por caso de forma manual

## 5. Acciones soportadas por el v2

### `create_participant_submission`

Acepta:

```json
{
  "action": "create_participant_submission",
  "participante": {
    "tipo_participante": "JUGADOR",
    "nombre": "Martin",
    "apellido": "Aguirre",
    "nombre_hijo": "Tomi",
    "apellido_hijo": "Aguirre",
    "numero_socio": "12345",
    "categoria": "2016",
    "tira": "All Boys A",
    "whatsapp": "1123456789",
    "vinculo_baby": "",
    "jugador_vinculado_nombre": "Tomi",
    "jugador_vinculado_apellido": "Aguirre",
    "categoria_vinculada": "2016",
    "tira_vinculada": "All Boys A",
    "access_code_validated": "SI"
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
    "submission_id": "manual-create-001",
    "user_agent": "manual-test",
    "access_code": "ALBO2026"
  }
}
```

Si el request no trae `action`, se procesa igual como create.

Respuesta OK:

```json
{
  "ok": true,
  "mode": "created",
  "participant_code": "BABY-7K4P9",
  "submission_id": "manual-create-001",
  "stage_id": "grupos",
  "warning": "Guarda este codigo y no lo compartas. Lo vas a necesitar para editar tu Prode o cargar proximas etapas."
}
```

Error de duplicado sin codigo:

```json
{
  "ok": false,
  "error_code": "DUPLICATE_WITHOUT_CODE",
  "error": "Ya existe un Prode para este jugador/a. Ingresa tu codigo para verlo o editarlo."
}
```

### `get_participant_by_code`

Request:

```json
{
  "action": "get_participant_by_code",
  "participant_code": "baby-7k4p9"
}
```

Normalizacion:

- trim
- uppercase
- se comparan letras y numeros sin guiones ni espacios

Respuesta OK:

```json
{
  "ok": true,
  "participant": {
    "participant_code": "BABY-7K4P9",
    "nombre": "Martin",
    "apellido": "Aguirre",
    "nombre_hijo": "Tomi",
    "apellido_hijo": "Aguirre",
    "numero_socio": "12345",
    "categoria": "2016",
    "tira": "All Boys A",
    "whatsapp": "1123456789",
    "estado_participante": "ACTIVO",
    "created_at": "2026-06-04T12:00:00.000Z",
    "updated_at": "2026-06-04T12:00:00.000Z"
  },
  "stage": {
    "stage_id": "grupos",
    "stage_label": "Fase de grupos",
    "status": "ABIERTA",
    "editable_from": "2026-06-01T00:00:00.000Z",
    "editable_until": "2026-06-11T20:59:59.000Z",
    "visible": "SI",
    "notas": "",
    "editable_now": true
  },
  "predictions": [],
  "readonly_message": ""
}
```

Codigo inexistente:

```json
{
  "ok": false,
  "error_code": "CODE_NOT_FOUND",
  "error": "No encontramos un Prode asociado a ese codigo."
}
```

### `update_stage_predictions`

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
    "submission_id": "manual-update-001"
  }
}
```

Respuesta OK:

```json
{
  "ok": true,
  "mode": "updated",
  "participant_code": "BABY-7K4P9",
  "submission_id": "manual-update-001",
  "stage_id": "grupos"
}
```

Etapa cerrada:

```json
{
  "ok": false,
  "error_code": "STAGE_CLOSED",
  "error": "Esta etapa ya esta cerrada. Si necesitas corregir algo, habla con la organizacion."
}
```

### `get_open_stage`

Request:

```json
{
  "action": "get_open_stage"
}
```

Respuesta OK:

```json
{
  "ok": true,
  "stage": {
    "stage_id": "grupos",
    "stage_label": "Fase de grupos",
    "status": "ABIERTA",
    "editable_from": "2026-06-01T00:00:00.000Z",
    "editable_until": "2026-06-11T20:59:59.000Z",
    "visible": "SI",
    "notas": "",
    "editable_now": true
  }
}
```

## 6. Reglas de negocio incluidas

### Tipos de participante

Valores soportados:

- `JUGADOR`
- `FAMILIAR`
- `PROFESOR`
- `DELEGADO`

Reglas de duplicado fuerte:

- `JUGADOR`
  - si hay `numero_socio`: `numero_socio + categoria + tira`
  - si no hay `numero_socio`: `nombre_hijo + apellido_hijo + categoria + tira`
- `FAMILIAR`
  - `nombre + apellido + tipo_participante + whatsapp`
  - si falta `whatsapp`: `nombre + apellido + tipo_participante + jugador_vinculado + tira_vinculada`
- `PROFESOR`
  - `nombre + apellido + tipo_participante + whatsapp`
- `DELEGADO`
  - `nombre + apellido + tipo_participante + whatsapp`

### Codigo de acceso

- el create y el update validan `metadata.access_code`
- codigo actual: `ALBO2026`
- si falla, devuelve:

```json
{
  "ok": false,
  "error_code": "INVALID_ACCESS_CODE",
  "error": "El codigo de acceso no es valido. Pediselo a la organizacion del Baby All Boys."
}
```

### Codigo unico

- formato: `BABY-XXXXX`
- alfabeto:
  - `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- evita:
  - `0`, `O`, `1`, `I`, `L`
- intenta hasta `10` veces antes de fallar

### Duplicado fuerte

Si hay `numero_socio`:

- `numero_socio + categoria + tira`

Si no hay `numero_socio`:

- `nombre_hijo + apellido_hijo + categoria + tira`

### Mismo WhatsApp

- no bloquea
- registra `MISMO_WHATSAPP` en `Log`

### Etapas

- solo se puede crear o editar si la etapa esta:
  - `status = ABIERTA`
  - dentro de `editable_from` / `editable_until`
  - `visible != NO`

## 7. Como ajustar Google Sheets

1. Abrir la planilla del Prode.
2. Crear o ajustar hojas:
   - `Participantes`
   - `Pronosticos`
   - `Etapas`
   - `Log`
3. Reemplazar la fila 1 con los encabezados exactos de esta guia.
4. En `Etapas`, cargar al menos una fila visible y abierta.

Ejemplo minimo de `Etapas`:

```text
grupos | Fase de grupos | ABIERTA | 2026-06-01T00:00:00-03:00 | 2026-06-11T20:59:59-03:00 | SI | Carga inicial
```

## 8. Como publicar el Web App

1. Ir a `Extensiones -> Apps Script`.
2. Crear un proyecto o abrir el actual.
3. Reemplazar el codigo por el contenido completo de:
   - `data/prode/apps-script-prode-v2.gs`
4. Guardar.
5. Ir a `Deploy -> Manage deployments`.
6. Editar o crear `Web App`.
7. Configurar:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone with the link`
8. Publicar.
9. Copiar la URL del Web App.
10. Mantener la misma URL en el frontend cuando llegue la fase de integracion, o actualizarla si Google genera una nueva.

## 9. Como probar manualmente cada action

### Probar `create_participant_submission`

1. Usar Apps Script Web App con POST.
2. Enviar el JSON de create.
3. Verificar:
   - nueva fila en `Participantes`
   - nuevo `participant_code`
   - nuevas filas en `Pronosticos`
   - fila `CREATE_OK` en `Log`

### Probar `get_participant_by_code`

1. Tomar un `participant_code` creado.
2. Enviar POST con esa accion.
3. Verificar:
   - devuelve datos del participante
   - devuelve la etapa abierta
   - devuelve los pronosticos de esa etapa

### Probar `update_stage_predictions`

1. Usar un `participant_code` valido.
2. Enviar update con el mismo `stage_id`.
3. Verificar:
   - desaparecen las filas anteriores de esa etapa
   - aparecen las nuevas filas
   - `updated_at` cambia en `Participantes`
   - fila `UPDATE_OK` en `Log`

### Probar `get_open_stage`

1. Cargar una sola fila ABIERTA en `Etapas`.
2. Enviar POST con `get_open_stage`.
3. Verificar que devuelve esa etapa.

## 10. Limitaciones conocidas de esta fase

- no migra legacy automaticamente
- no toca frontend
- no agrega login ni validacion secundaria
- el update de etapa reemplaza filas activas de esa etapa; no guarda historial adicional
