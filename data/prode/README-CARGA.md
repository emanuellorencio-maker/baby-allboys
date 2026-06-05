# Carga del Prode Mundial Baby All Boys

## Estado de esta fase

Frontend y backend quedan alineados para:

- `participant_code`
- create
- lookup por codigo
- update por etapa
- tipos de participante
- codigo general de acceso
- numero de socio obligatorio para todos los tipos

## Script recomendado en esta fase

Usar:

- [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs)

Guia de referencia:

- [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\APPS-SCRIPT-PRODE.md](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\APPS-SCRIPT-PRODE.md)

## Hojas obligatorias

### Participantes

```text
participant_code | participant_code_normalized | submission_id_inicial | created_at | updated_at | estado_participante | nombre | apellido | nombre_hijo | apellido_hijo | numero_socio | categoria | tira | whatsapp | user_agent_inicial | tipo_participante | vinculo_baby | jugador_vinculado_nombre | jugador_vinculado_apellido | categoria_vinculada | tira_vinculada | access_code_validated
```

### Pronosticos

```text
participant_code | submission_id | stage_id | partido_id | equipo_local | equipo_visitante | sign | created_at | updated_at
```

### Etapas

```text
stage_id | stage_label | status | editable_from | editable_until | visible | notas
```

### Log

```text
timestamp | tipo | mensaje | raw
```

## Compatibilidad con el frontend actual

Mientras no se cambie el frontend:

- un POST sin `action` entra como:
  - `create_participant_submission`
- el backend nuevo igual genera `participant_code`
- el frontend actual no lo usa todavia, pero ya queda guardado en la planilla

## Payload create actual compatible

```json
{
  "participante": {
    "tipo_participante": "JUGADOR",
    "nombre": "Martin",
    "apellido": "Aguirre",
    "nombre_hijo": "Tomi",
    "apellido_hijo": "Aguirre",
    "numero_socio": "12345",
    "categoria": "2016",
    "tira": "All Boys A",
    "whatsapp": "11 2345 6789",
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
    "origen": "baby-allboys",
    "version": "solo-sign",
    "timestamp_cliente": "2026-06-04T00:00:00.000Z",
    "submission_id": "prode-abc123",
    "user_agent": "...",
    "access_code": "ALBO2026"
  }
}
```

## Reglas que mantiene el backend

### Tipos de participante

Valores soportados:

- `JUGADOR`
- `FAMILIAR`
- `PROFESOR`
- `DELEGADO`

`numero_socio` es obligatorio para:

- `JUGADOR`
- `FAMILIAR`
- `PROFESOR`
- `DELEGADO`

Duplicados fuertes:

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

- el backend exige `metadata.access_code`
- codigo actual: `ALBO2026`
- si no coincide, devuelve:

```json
{
  "ok": false,
  "error_code": "INVALID_ACCESS_CODE",
  "error": "El codigo de acceso no es valido. Pediselo a la organizacion del Baby All Boys."
}
```

### Duplicado fuerte

Si hay `numero_socio`:

- `numero_socio + categoria + tira`

Si no hay `numero_socio`:

- `nombre_hijo + apellido_hijo + categoria + tira`

Respuesta esperada:

```json
{
  "ok": false,
  "error_code": "DUPLICATE_WITHOUT_CODE",
  "error": "Ya existe un Prode para este jugador/a. Ingresa tu codigo para verlo o editarlo."
}
```

Si falta `numero_socio`, el backend devuelve:

```json
{
  "ok": false,
  "error_code": "UNEXPECTED_ERROR",
  "error": "Falta participante.numero_socio"
}
```

### Mismo WhatsApp

- no bloquea
- se registra `MISMO_WHATSAPP` en `Log`

### Etapas

- el create y el update solo funcionan si hay etapa abierta
- la hoja `Etapas` define apertura y cierre real

## Como probar manualmente

### 1. Probar create compatible con frontend actual

Enviar POST sin `action`.

Esperado:

- crea participante
- crea pronosticos
- devuelve `participant_code`

### 2. Probar lookup por codigo

Enviar:

```json
{
  "action": "get_participant_by_code",
  "participant_code": "BABY-7K4P9"
}
```

### 3. Probar update por etapa

Enviar:

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

### 4. Probar etapa abierta

Enviar:

```json
{
  "action": "get_open_stage"
}
```

## Legacy

- no migrar automaticamente filas viejas
- no generar codigos retroactivos todavia
- las nuevas altas nacen con codigo
- los registros viejos quedan como `legacy` hasta una migracion controlada
