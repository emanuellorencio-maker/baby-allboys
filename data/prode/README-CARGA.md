# Carga del Prode Mundial Baby All Boys

## Estado de esta fase

Todavia no se toco el frontend.

Eso significa:

- el frontend actual sigue enviando create-only
- no manda `action`
- no sabe buscar por codigo todavia
- no sabe actualizar por etapa todavia

El Apps Script v2 queda preparado para esa evolucion sin romper el create actual.

## Script recomendado en esta fase

Usar:

- [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\apps-script-prode-v2.gs)

Guia de referencia:

- [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\APPS-SCRIPT-PRODE.md](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\APPS-SCRIPT-PRODE.md)

## Hojas obligatorias

### Participantes

```text
participant_code | participant_code_normalized | submission_id_inicial | created_at | updated_at | estado_participante | nombre | apellido | nombre_hijo | apellido_hijo | numero_socio | categoria | tira | whatsapp | user_agent_inicial
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
    "nombre": "Martin",
    "apellido": "Aguirre",
    "nombre_hijo": "Tomi",
    "apellido_hijo": "Aguirre",
    "numero_socio": "12345",
    "categoria": "2016",
    "tira": "All Boys A",
    "whatsapp": "11 2345 6789"
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
    "user_agent": "..."
  }
}
```

## Reglas que mantiene el backend

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
