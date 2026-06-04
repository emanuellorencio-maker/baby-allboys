# Google Apps Script para Prode 26 All Boys

Esta guia deja alineado el Web App de Google Apps Script con el frontend actual del Prode.

Incluye:
- recepcion del payload real;
- validaciones minimas;
- control de cierre;
- control fuerte de duplicados;
- log de mismo WhatsApp para control manual;
- validacion de pronosticos por `sign`;
- escritura en `Participantes`, `Pronosticos` y `Log`.

## 1. Payload real del frontend

El frontend actual en [C:\Users\emanu\OneDrive\Desktop\fefi-app\js\prode-mundial.js](C:\Users\emanu\OneDrive\Desktop\fefi-app\js\prode-mundial.js) envia este formato:

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
      "equipo_local": "Argentina",
      "equipo_visitante": "Brasil",
      "sign": "LOCAL"
    }
  ],
  "metadata": {
    "origen": "baby-allboys",
    "version": "fase-2-google-sheets",
    "timestamp_cliente": "2026-06-02T12:34:56.000Z",
    "submission_id": "prode-abc123-xyz789",
    "user_agent": "Mozilla/5.0 ..."
  }
}
```

Importante:
- el frontend envia con `Content-Type: text/plain;charset=utf-8`
- del lado Apps Script hay que leer `JSON.parse(e.postData.contents || "{}")`
- el dato principal del pronostico ahora es `sign`
- el flujo nuevo ya no usa goles

## 2. Actualizacion obligatoria de la Google Sheet existente

 La planilla real ya existe. Antes de pegar este Apps Script nuevo, hay que actualizar las hojas `Participantes` y `Pronosticos`.

### Columna nueva obligatoria

Insertar una columna despues de `apellido_hijo`:

```text
numero_socio
```

### Orden final obligatorio en `Participantes`

```text
submission_id | timestamp | nombre | apellido | nombre_hijo | apellido_hijo | numero_socio | categoria | tira | whatsapp | user_agent
```

Si la hoja no tiene este encabezado exacto, el Apps Script debe devolver error claro y no escribir filas.

### Columna nueva obligatoria en `Pronosticos`

Insertar una columna despues de `equipo_visitante`:

```text
sign
```

## 3. Hojas y columnas exactas

Crear o revisar estas hojas:

- `Participantes`
- `Pronosticos`
- `Log`

### Hoja `Participantes`

```text
submission_id, timestamp, nombre, apellido, nombre_hijo, apellido_hijo, numero_socio, categoria, tira, whatsapp, user_agent
```

### Hoja `Pronosticos`

```text
submission_id, timestamp, partido_id, equipo_local, equipo_visitante, sign
```

Importante:
- no hace falta borrar historial viejo si tiene columnas de goles
- desde el modelo nuevo, el Apps Script usa solo A:F en `Pronosticos`

### Hoja `Log`

```text
timestamp, tipo, mensaje, raw
```

## 4. Reglas de producto implementadas

### Duplicado fuerte

Si hay `numero_socio`, el duplicado fuerte se calcula por:

- `numero_socio`
- `categoria`
- `tira`

Si NO hay `numero_socio`, el duplicado fuerte se calcula por:

- `nombre_hijo`
- `apellido_hijo`
- `categoria`
- `tira`

Si ya existe un registro con esa combinacion:

```json
{
  "ok": false,
  "error": "Ya existe un Prode cargado para este jugador/a. Si necesitás corregirlo, hablá con la organización."
}
```

### Mismo WhatsApp

El WhatsApp queda solo como dato de contacto.

Si un mismo WhatsApp aparece para otro jugador/a distinto:

- el envio se permite;
- se escribe en `Log` un registro:
  - `tipo: MISMO_WHATSAPP`
  - `mensaje: Mismo WhatsApp usado para más de un jugador/a`

No se bloquean hermanos ni cargas legitimas de una misma familia.

### Cierre del Prode

El Apps Script usa:

```javascript
const PRODE_CIERRE_ISO = '';
```

- si queda vacia, el Prode sigue abierto;
- si tiene una fecha ISO futura, permite enviar hasta ese momento;
- si ya vencio, rechaza el envio.

Respuesta de cierre:

```json
{
  "ok": false,
  "error": "El Prode cerró. Ya no se reciben pronósticos."
}
```

## 5. Codigo completo de Google Apps Script

Pegar este codigo completo en `Extensiones -> Apps Script`:

```javascript
const SHEET_NAMES = {
  PARTICIPANTES: 'Participantes',
  PRONOSTICOS: 'Pronosticos',
  LOG: 'Log'
};

const HEADERS = {
  Participantes: [
    'submission_id',
    'timestamp',
    'nombre',
    'apellido',
    'nombre_hijo',
    'apellido_hijo',
    'numero_socio',
    'categoria',
    'tira',
    'whatsapp',
    'user_agent'
  ],
  Pronosticos: [
    'submission_id',
    'timestamp',
    'partido_id',
    'equipo_local',
    'equipo_visitante',
    'sign'
  ],
  Log: [
    'timestamp',
    'tipo',
    'mensaje',
    'raw'
  ]
};

const PRODE_CIERRE_ISO = '';
const DUPLICADO_ERROR = 'Ya existe un Prode cargado para este jugador/a. Si necesitás corregirlo, hablá con la organización.';
const CERRADO_ERROR = 'El Prode cerró. Ya no se reciben pronósticos.';
const HEADERS_ERROR = 'La planilla no tiene los encabezados esperados. Verificá numero_socio en Participantes y sign en Pronosticos antes de volver a publicar el Web App.';
const MISMO_WHATSAPP_MSG = 'Mismo WhatsApp usado para más de un jugador/a';

function doPost(e) {
  const now = new Date();
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    ensureSheetHeaders_(ss);

    if (estaCerrado_()) {
      appendLog_(ss, [
        now.toISOString(),
        'CERRADO',
        CERRADO_ERROR,
        truncateCell_(raw, 50000)
      ]);
      return jsonResponse_({ ok: false, error: CERRADO_ERROR });
    }

    const payload = JSON.parse(raw || '{}');
    const participante = payload && payload.participante ? payload.participante : {};
    const metadata = payload && payload.metadata ? payload.metadata : {};
    const submissionId = safeString_(metadata.submission_id) || generateSubmissionId_();
    const timestamp = safeString_(metadata.timestamp_cliente) || now.toISOString();
    const userAgent = safeString_(metadata.user_agent);

    const participanteRow = normalizeParticipante_(participante);
    const pronosticos = normalizePronosticos_(payload && payload.pronosticos);

    validateParticipante_(participanteRow);
    validatePronosticos_(pronosticos);

    if (existsStrongDuplicate_(ss, participanteRow)) {
      appendLog_(ss, [
        now.toISOString(),
        'DUPLICADO',
        DUPLICADO_ERROR,
        safeJson_({
          participante: participanteRow,
          submission_id: submissionId
        })
      ]);
      return jsonResponse_({ ok: false, error: DUPLICADO_ERROR });
    }

    if (existsSameWhatsappDifferentPlayer_(ss, participanteRow)) {
      appendLog_(ss, [
        now.toISOString(),
        'MISMO_WHATSAPP',
        MISMO_WHATSAPP_MSG,
        safeJson_({
          whatsapp: participanteRow.whatsapp,
          nombre_hijo: participanteRow.nombre_hijo,
          apellido_hijo: participanteRow.apellido_hijo,
          numero_socio: participanteRow.numero_socio,
          categoria: participanteRow.categoria,
          tira: participanteRow.tira,
          submission_id: submissionId
        })
      ]);
    }

    appendParticipante_(ss, [
      submissionId,
      timestamp,
      participanteRow.nombre,
      participanteRow.apellido,
      participanteRow.nombre_hijo,
      participanteRow.apellido_hijo,
      participanteRow.numero_socio,
      participanteRow.categoria,
      participanteRow.tira,
      participanteRow.whatsapp,
      userAgent
    ]);

    appendPronosticos_(ss, pronosticos.map(function(pronostico) {
      return [
        submissionId,
        timestamp,
        pronostico.partido_id,
        pronostico.equipo_local,
        pronostico.equipo_visitante,
        pronostico.sign
      ];
    }));

    appendLog_(ss, [
      now.toISOString(),
      'INFO',
      'Submission OK',
      safeJson_({
        submission_id: submissionId,
        cantidad_pronosticos: pronosticos.length,
        origen: safeString_(metadata.origen),
        version: safeString_(metadata.version)
      })
    ]);

    return jsonResponse_({
      ok: true,
      submission_id: submissionId
    });
  } catch (error) {
    const message = error && error.message ? String(error.message) : 'Error desconocido';
    appendLog_(ss, [
      now.toISOString(),
      'ERROR',
      truncateCell_(message, 1000),
      truncateCell_(raw, 50000)
    ]);
    return jsonResponse_({
      ok: false,
      error: publicError_(message)
    });
  }
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheetHeaders_(ss) {
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES), HEADERS.Participantes);
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.PRONOSTICOS), HEADERS.Pronosticos);
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.LOG), HEADERS.Log);
}

function ensureExactHeaderRow_(sheet, expectedHeaders) {
  const currentLastColumn = sheet.getLastColumn();
  const currentLastRow = sheet.getLastRow();

  if (!currentLastRow || !currentLastColumn) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(currentLastColumn, expectedHeaders.length)).getValues()[0]
    .slice(0, expectedHeaders.length)
    .map(function(cell) { return String(cell || '').trim(); });

  const expected = expectedHeaders.join('|');
  const current = currentHeaders.join('|');

  if (current !== expected) {
    throw new Error(HEADERS_ERROR);
  }
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function normalizeParticipante_(participante) {
  return {
    nombre: safeString_(participante && participante.nombre),
    apellido: safeString_(participante && participante.apellido),
    nombre_hijo: safeString_(participante && participante.nombre_hijo),
    apellido_hijo: safeString_(participante && participante.apellido_hijo),
    numero_socio: normalizeMemberNumber_(participante && participante.numero_socio),
    categoria: safeString_(participante && participante.categoria),
    tira: safeString_(participante && participante.tira),
    whatsapp: safeString_(participante && participante.whatsapp)
  };
}

function normalizePronosticos_(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map(function(item) {
      return {
        partido_id: safeString_(item && item.partido_id),
        equipo_local: safeString_(item && item.equipo_local),
        equipo_visitante: safeString_(item && item.equipo_visitante),
        sign: normalizeSign_(item && item.sign)
      };
    })
    .filter(function(item) {
      return item.partido_id && item.equipo_local && item.equipo_visitante &&
        item.sign;
    });
}

function validateParticipante_(participante) {
  if (!participante.nombre) throw new Error('Falta participante.nombre');
  if (!participante.apellido) throw new Error('Falta participante.apellido');
  if (!participante.nombre_hijo) throw new Error('Falta participante.nombre_hijo');
  if (!participante.apellido_hijo) throw new Error('Falta participante.apellido_hijo');
  if (!participante.categoria) throw new Error('Falta participante.categoria');
  if (!participante.tira) throw new Error('Falta participante.tira');
}

function validatePronosticos_(pronosticos) {
  if (!Array.isArray(pronosticos) || !pronosticos.length) {
    throw new Error('Falta al menos un pronostico completo');
  }
  pronosticos.forEach(function(pronostico) {
    if (!pronostico.sign) {
      throw new Error('Falta pronostico.sign valido');
    }
  });
}

function normalizeSign_(value) {
  const raw = safeString_(value).toUpperCase();
  if (raw === 'LOCAL' || raw === 'EMPATE' || raw === 'VISITANTE') return raw;
  return '';
}

function getParticipantesRecords_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.Participantes.length).getValues().map(function(row) {
    return {
      submission_id: safeString_(row[0]),
      timestamp: safeString_(row[1]),
      nombre: safeString_(row[2]),
      apellido: safeString_(row[3]),
      nombre_hijo: safeString_(row[4]),
      apellido_hijo: safeString_(row[5]),
      numero_socio: normalizeMemberNumber_(row[6]),
      categoria: safeString_(row[7]),
      tira: safeString_(row[8]),
      whatsapp: safeString_(row[9]),
      user_agent: safeString_(row[10])
    };
  });
}

function buildStrongKey_(participante) {
  if (participante.numero_socio) {
    return [
      'SOCIO',
      compareKey_(participante.numero_socio),
      compareKey_(participante.categoria),
      compareKey_(participante.tira)
    ].join('|');
  }

  return [
    'JUGADOR',
    compareKey_(participante.nombre_hijo),
    compareKey_(participante.apellido_hijo),
    compareKey_(participante.categoria),
    compareKey_(participante.tira)
  ].join('|');
}

function existsStrongDuplicate_(ss, participante) {
  const target = buildStrongKey_(participante);
  return getParticipantesRecords_(ss).some(function(row) {
    return buildStrongKey_(row) === target;
  });
}

function existsSameWhatsappDifferentPlayer_(ss, participante) {
  if (!participante.whatsapp) return false;
  const whatsapp = compareKey_(participante.whatsapp);
  const strongKey = buildStrongKey_(participante);

  return getParticipantesRecords_(ss).some(function(row) {
    return compareKey_(row.whatsapp) === whatsapp && buildStrongKey_(row) !== strongKey;
  });
}

function appendParticipante_(ss, row) {
  getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES).appendRow(row);
}

function appendPronosticos_(ss, rows) {
  if (!rows.length) return;
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.PRONOSTICOS);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function appendLog_(ss, row) {
  getOrCreateSheet_(ss, SHEET_NAMES.LOG).appendRow(row);
}

function estaCerrado_() {
  if (!PRODE_CIERRE_ISO) return false;
  const cierre = new Date(PRODE_CIERRE_ISO);
  if (isNaN(cierre.getTime())) return false;
  return Date.now() > cierre.getTime();
}

function normalizeMemberNumber_(value) {
  const raw = safeString_(value);
  if (!raw) return '';
  return raw.replace(/\s+/g, '').replace(/[^0-9A-Za-z\-\/]/g, '');
}

function publicError_(message) {
  if (message === DUPLICADO_ERROR) return message;
  if (message === CERRADO_ERROR) return message;
  if (message === HEADERS_ERROR) return HEADERS_ERROR;
  return 'No pudimos procesar el Prode. Revisá la planilla y probá de nuevo.';
}

function safeString_(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  const protectedValue = /^[=+\-@]/.test(raw) ? "'" + raw : raw;
  return truncateCell_(protectedValue, 500);
}

function compareKey_(value) {
  return safeString_(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function safeJson_(value) {
  return truncateCell_(JSON.stringify(value || {}), 50000);
}

function truncateCell_(value, maxLen) {
  const text = String(value || '');
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function generateSubmissionId_() {
  return 'prode-' + Utilities.getUuid().slice(0, 12);
}
```

## 6. Como publicar el Web App

1. Abrir la Google Sheet del Prode.
2. Verificar que existan las hojas `Participantes`, `Pronosticos` y `Log`.
3. En `Participantes`, insertar la columna `numero_socio` despues de `apellido_hijo`.
4. En `Pronosticos`, insertar la columna `sign` despues de `equipo_visitante`.
5. Ir a `Extensiones -> Apps Script`.
6. Reemplazar todo el codigo por el script de arriba.
7. Guardar.
8. Ir a `Deploy -> New deployment` o `Manage deployments -> Edit`.
9. Elegir tipo `Web App`.
10. `Execute as`: `Me`.
11. `Who has access`: `Anyone with the link`.
12. Copiar la URL del Web App.
13. Pegar esa URL en:

```js
const PRODE_SHEETS_ENDPOINT = "TU_URL_PUBLICADA";
```

## 7. Como probar duplicados

### Duplicado con numero de socio

1. Cargar un Prode con:
   - `numero_socio = 12345`
   - categoria y tira definidas
2. Repetir otro envio con:
   - el mismo `numero_socio`
   - la misma `categoria`
   - la misma `tira`
3. Debe rechazarlo con:

```json
{
  "ok": false,
  "error": "Ya existe un Prode cargado para este jugador/a. Si necesitás corregirlo, hablá con la organización."
}
```

### Duplicado sin numero de socio

1. Dejar vacio `numero_socio`.
2. Repetir exactamente:
   - `nombre_hijo`
   - `apellido_hijo`
   - `categoria`
   - `tira`
3. Debe rechazarlo con el mismo error.

### Mismo WhatsApp

1. Usar el mismo WhatsApp.
2. Cambiar jugador/a o numero de socio.
3. El envio debe entrar.
4. Verificar fila `MISMO_WHATSAPP` en `Log`.
