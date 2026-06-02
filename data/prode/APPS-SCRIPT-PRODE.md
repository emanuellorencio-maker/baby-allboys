# Google Apps Script para Prode 26 All Boys

Esta guia deja alineado el Web App de Google Apps Script con el frontend actual del Prode 26.

Incluye:
- recepcion del payload real;
- validaciones minimas;
- control de duplicados;
- control de cierre;
- escritura en `Participantes`, `Pronosticos` y `Log`.

No cambia la home publica y no toca `data/prode/*.json`.

## 1. Payload real del frontend

El frontend actual en [C:\Users\emanu\OneDrive\Desktop\fefi-app\js\prode-mundial.js](C:\Users\emanu\OneDrive\Desktop\fefi-app\js\prode-mundial.js) envia este formato:

```json
{
  "participante": {
    "nombre": "Martin",
    "apellido": "Aguirre",
    "nombre_hijo": "Tomi",
    "categoria": "2016",
    "tira": "All Boys A",
    "whatsapp": "11 2345 6789"
  },
  "pronosticos": [
    {
      "partido_id": "M001",
      "equipo_local": "Argentina",
      "equipo_visitante": "Brasil",
      "goles_local": 2,
      "goles_visitante": 1
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
- no hay que cambiar ni el payload ni las columnas existentes

## 2. Crear la Google Sheet

Crear una planilla nueva en Google Sheets y agregar exactamente estas hojas:

- `Participantes`
- `Pronosticos`
- `Log`

### Columnas exactas

#### Hoja `Participantes`

```text
submission_id, timestamp, nombre, apellido, nombre_hijo, categoria, tira, whatsapp, user_agent
```

#### Hoja `Pronosticos`

```text
submission_id, timestamp, partido_id, equipo_local, equipo_visitante, goles_local, goles_visitante
```

#### Hoja `Log`

```text
timestamp, tipo, mensaje, raw
```

## 3. Reglas de producto implementadas

### Duplicados

Un participante se considera duplicado por esta combinacion:

- `nombre_hijo`
- `categoria`
- `tira`
- `whatsapp` si existe

Si no hay `whatsapp`, se usa:

- `nombre`
- `apellido`
- `nombre_hijo`
- `categoria`
- `tira`

Respuesta de duplicado:

```json
{
  "ok": false,
  "error": "Ya existe un Prode cargado para este participante. Si necesitás corregirlo, hablá con la organización."
}
```

### Cierre del Prode

El Apps Script usa:

```javascript
const PRODE_CIERRE_ISO = "";
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

## 4. Codigo completo de Google Apps Script

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
    'goles_local',
    'goles_visitante'
  ],
  Log: [
    'timestamp',
    'tipo',
    'mensaje',
    'raw'
  ]
};

const PRODE_CIERRE_ISO = '';
const DUPLICADO_ERROR = 'Ya existe un Prode cargado para este participante. Si necesitás corregirlo, hablá con la organización.';
const CERRADO_ERROR = 'El Prode cerró. Ya no se reciben pronósticos.';

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
      return jsonResponse_({
        ok: false,
        error: CERRADO_ERROR
      });
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

    if (existsDuplicate_(ss, participanteRow)) {
      appendLog_(ss, [
        now.toISOString(),
        'DUPLICADO',
        DUPLICADO_ERROR,
        safeJson_({
          participante: participanteRow,
          submission_id: submissionId
        })
      ]);
      return jsonResponse_({
        ok: false,
        error: DUPLICADO_ERROR
      });
    }

    appendParticipante_(ss, [
      submissionId,
      timestamp,
      participanteRow.nombre,
      participanteRow.apellido,
      participanteRow.nombre_hijo,
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
        pronostico.goles_local,
        pronostico.goles_visitante
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
    try {
      ensureSheetHeaders_(ss);
      appendLog_(ss, [
        now.toISOString(),
        'ERROR',
        safeString_(error && error.message ? error.message : 'Error desconocido'),
        truncateCell_(raw, 50000)
      ]);
    } catch (logError) {
      Logger.log('No se pudo escribir en Log: ' + logError);
    }

    return jsonResponse_({
      ok: false,
      error: safeString_(error && error.message ? error.message : 'Error desconocido')
    });
  }
}

function ensureSheetHeaders_(ss) {
  ensureHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES), HEADERS.Participantes);
  ensureHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.PRONOSTICOS), HEADERS.Pronosticos);
  ensureHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.LOG), HEADERS.Log);
}

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureHeaderRow_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var currentJoined = current.join('|');
  var expectedJoined = headers.join('|');
  if (currentJoined !== expectedJoined) {
    throw new Error('Encabezados invalidos en la hoja "' + sheet.getName() + '".');
  }
}

function normalizeParticipante_(participante) {
  return {
    nombre: safeString_(participante && participante.nombre),
    apellido: safeString_(participante && participante.apellido),
    nombre_hijo: safeString_(participante && participante.nombre_hijo),
    categoria: safeString_(participante && participante.categoria),
    tira: safeString_(participante && participante.tira),
    whatsapp: safeString_(participante && participante.whatsapp)
  };
}

function normalizePronosticos_(pronosticos) {
  if (!Array.isArray(pronosticos)) return [];

  return pronosticos
    .map(function(item) {
      return {
        partido_id: safeString_(item && item.partido_id),
        equipo_local: safeString_(item && item.equipo_local),
        equipo_visitante: safeString_(item && item.equipo_visitante),
        goles_local: normalizeGoals_(item && item.goles_local),
        goles_visitante: normalizeGoals_(item && item.goles_visitante)
      };
    })
    .filter(function(item) {
      return (
        item.partido_id &&
        item.equipo_local &&
        item.equipo_visitante &&
        item.goles_local !== null &&
        item.goles_visitante !== null
      );
    });
}

function validateParticipante_(participante) {
  if (!participante.nombre) throw new Error('Falta participante.nombre');
  if (!participante.apellido) throw new Error('Falta participante.apellido');
  if (!participante.nombre_hijo) throw new Error('Falta participante.nombre_hijo');
  if (!participante.categoria) throw new Error('Falta participante.categoria');
  if (!participante.tira) throw new Error('Falta participante.tira');
}

function validatePronosticos_(pronosticos) {
  if (!Array.isArray(pronosticos) || pronosticos.length < 1) {
    throw new Error('Debe llegar al menos un pronostico completo.');
  }
}

function appendParticipante_(ss, row) {
  ss.getSheetByName(SHEET_NAMES.PARTICIPANTES).appendRow(row);
}

function appendPronosticos_(ss, rows) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PRONOSTICOS);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function appendLog_(ss, row) {
  ss.getSheetByName(SHEET_NAMES.LOG).appendRow(row);
}

function getParticipantesRows_(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PARTICIPANTES);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, HEADERS.Participantes.length).getValues();
}

function existsDuplicate_(ss, participante) {
  var rows = getParticipantesRows_(ss);
  var candidato = buildDuplicateKey_(participante);
  if (!candidato) return false;

  return rows.some(function(row) {
    var existente = {
      nombre: safeString_(row[2]),
      apellido: safeString_(row[3]),
      nombre_hijo: safeString_(row[4]),
      categoria: safeString_(row[5]),
      tira: safeString_(row[6]),
      whatsapp: safeString_(row[7])
    };
    return buildDuplicateKey_(existente) === candidato;
  });
}

function buildDuplicateKey_(participante) {
  var nombreHijo = compareKey_(participante.nombre_hijo);
  var categoria = compareKey_(participante.categoria);
  var tira = compareKey_(participante.tira);
  var whatsapp = compareKey_(participante.whatsapp);

  if (!nombreHijo || !categoria || !tira) return '';

  if (whatsapp) {
    return ['w', nombreHijo, categoria, tira, whatsapp].join('|');
  }

  var nombre = compareKey_(participante.nombre);
  var apellido = compareKey_(participante.apellido);
  if (!nombre || !apellido) return '';
  return ['n', nombre, apellido, nombreHijo, categoria, tira].join('|');
}

function compareKey_(value) {
  return safeString_(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function estaCerrado_() {
  if (!PRODE_CIERRE_ISO) return false;
  var cierre = new Date(PRODE_CIERRE_ISO);
  if (isNaN(cierre.getTime())) return false;
  return new Date().getTime() > cierre.getTime();
}

function normalizeGoals_(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  var number = Number(value);
  if (!isFinite(number)) return null;
  if (number < 0) return null;
  if (Math.floor(number) !== number) return null;
  return number;
}

function safeString_(value) {
  if (value === null || typeof value === 'undefined') return '';

  var text = String(value)
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!text) return '';
  if (/^[=+\-@]/.test(text)) text = "'" + text;

  return truncateCell_(text, 500);
}

function truncateCell_(value, maxLength) {
  if (typeof value !== 'string') return value;
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function safeJson_(value) {
  try {
    return truncateCell_(JSON.stringify(value), 50000);
  } catch (error) {
    return '{"error":"no-se-pudo-serializar"}';
  }
}

function generateSubmissionId_() {
  return 'prode-' + new Date().getTime() + '-' + Utilities.getUuid().slice(0, 8);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 5. Que valida este Apps Script

- lee `e.postData.contents`
- hace `JSON.parse`
- valida:
  - `participante.nombre`
  - `participante.apellido`
  - `participante.nombre_hijo`
  - `participante.categoria`
  - `participante.tira`
  - `pronosticos` con al menos un elemento completo
- si `metadata.submission_id` no llega, genera uno
- si `PRODE_CIERRE_ISO` ya vencio:
  - escribe `CERRADO` en `Log`
  - devuelve error
- si detecta duplicado:
  - escribe `DUPLICADO` en `Log`
  - devuelve error
- si todo esta bien:
  - escribe una fila en `Participantes`
  - escribe una fila por cada pronostico en `Pronosticos`
  - deja una fila `INFO` en `Log`

## 6. Seguridad minima incluida

El codigo aplica estas defensas minimas:

- sanitizacion basica de strings;
- `trim` y limite de longitud por celda;
- bloqueo de campos obligatorios vacios;
- normalizacion de goles:
  - solo enteros,
  - no negativos,
  - `null` si el valor no sirve;
- evita formula injection:
  - si una cadena empieza con `=`, `+`, `-` o `@`, antepone `'`;
- evita escrituras vacias:
  - si no hay pronosticos completos, rechaza el envio;
- no crea filas silenciosas si el participante ya existe;
- guarda errores operativos, duplicados y cierres en `Log`.

## 7. Publicar o actualizar el Web App

1. Abrir Google Sheets.
2. Abrir la planilla del Prode.
3. Verificar que existan las hojas `Participantes`, `Pronosticos` y `Log`.
4. Verificar que los encabezados de fila 1 coincidan exactamente.
5. Ir a `Extensiones -> Apps Script`.
6. Reemplazar el codigo actual por el bloque completo de esta guia.
7. Ajustar si queres la constante:

```javascript
const PRODE_CIERRE_ISO = '';
```

Ejemplo:

```javascript
const PRODE_CIERRE_ISO = '2026-06-10T20:00:00-03:00';
```

8. Guardar el proyecto.
9. Ir a `Deploy -> Manage deployments`.
10. Editar el `Web App`.
11. Crear `New version`.
12. Confirmar:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone with the link`
13. Deploy.
14. Mantener la misma URL si Google la conserva, o copiar la nueva si cambia.

## 8. Prueba manual

### Desde local

1. Pararse en `C:\Users\emanu\OneDrive\Desktop\fefi-app`.
2. Levantar:

```powershell
python -m http.server 4173
```

3. Abrir:

```text
http://127.0.0.1:4173/prode-mundial.html
```

4. Completar:
   - nombre adulto
   - apellido adulto
   - nombre chico/a
   - categoria
   - tira
   - al menos un partido con goles completos
5. Tocar `Confirmar mi Prode`.

### Que revisar en Google Sheets

- en `Participantes`:
  - una fila nueva por envio valido
- en `Pronosticos`:
  - una fila nueva por cada partido cargado
- en `Log`:
  - `INFO` en envios correctos
  - `DUPLICADO` si repetis el mismo participante
  - `CERRADO` si el cierre ya vencio
  - `ERROR` si algo mas falla

## 9. Troubleshooting

### Si aparece error CORS

- verificar que estas usando la URL del `Web App` desplegado, no la URL del editor;
- volver a hacer `Deploy -> Manage deployments -> Edit -> New version`;
- confirmar `Who has access: Anyone with the link`;
- hacer hard refresh del navegador para evitar cache vieja del frontend.

### Si no escribe filas

- revisar la hoja `Log`;
- revisar que los encabezados de fila 1 coincidan exactamente;
- revisar que `PRODE_SHEETS_ENDPOINT` no este vacio en el frontend;
- revisar permisos del Apps Script;
- revisar si el Prode esta cerrado por `PRODE_CIERRE_ISO`;
- revisar si el participante ya existe y esta siendo rechazado por duplicado.

### Si Google pide permisos

- aceptar permisos con la cuenta duena de la planilla;
- volver a desplegar el `Web App`;
- probar otra vez con la URL publicada.

## 10. Pendiente antes de activar el Prode publicamente

Antes de mostrar el Prode en la home conviene completar esto:

- actualizar el Apps Script real en Google con esta version;
- hacer una prueba real de envio valido;
- repetir la misma prueba para confirmar rechazo de duplicado;
- probar cierre con una fecha pasada en Google;
- decidir politica final de correccion manual para casos rechazados;
- decidir fecha de cierre real.
