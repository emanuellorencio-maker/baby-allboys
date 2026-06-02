# Google Apps Script para Prode 26 All Boys

Esta guia prepara la integracion real entre `prode-mundial.html` y Google Sheets usando un Web App de Google Apps Script.

No cambia la home publica, no activa el Prode en `index.html` y no toca los JSON del fixture.

## 1. Payload real del frontend

El frontend actual en `js/prode-mundial.js` envia este formato:

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

## 3. Codigo completo de Google Apps Script

Pegar este codigo completo en `Extensions -> Apps Script`:

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

function doPost(e) {
  const now = new Date();
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    ensureSheetHeaders_(ss);

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
      'info',
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
        'error',
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

## 4. Que valida este Apps Script

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
- escribe:
  - una fila en `Participantes`
  - una fila por cada pronostico en `Pronosticos`
- si algo falla:
  - devuelve `{ ok: false, error: "..." }`
  - escribe el error en `Log`

## 5. Seguridad minima incluida

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
- guarda errores operativos en `Log`.

## 6. Publicar el Web App

1. Abrir Google Sheets.
2. Crear la planilla del Prode.
3. Crear las hojas `Participantes`, `Pronosticos` y `Log`.
4. Copiar los encabezados exactos de esta guia en la fila 1.
5. Ir a `Extensiones -> Apps Script`.
6. Pegar el codigo completo.
7. Guardar el proyecto.
8. Ir a `Deploy -> New deployment`.
9. Elegir tipo `Web App`.
10. `Execute as`: `Me`.
11. `Who has access`: `Anyone with the link`.
12. Confirmar permisos de Google si los pide.
13. Copiar la URL final del Web App.
14. Pegar esa URL en:

```js
// C:\Users\emanu\OneDrive\Desktop\fefi-app\js\prode-mundial.js
const PRODE_SHEETS_ENDPOINT = "PEGAR_AQUI_LA_URL_DEL_WEB_APP";
```

## 7. Prueba manual

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
  - una fila nueva por envio
- en `Pronosticos`:
  - una fila nueva por cada partido cargado
- en `Log`:
  - una fila `info` en envios correctos
  - una fila `error` si algo falla

## 8. Troubleshooting

### Si aparece error CORS

- verificar que estas usando la URL de `Web App` desplegada, no la URL del editor;
- volver a hacer `Deploy -> Manage deployments -> Edit -> New version`;
- confirmar `Who has access: Anyone with the link`;
- hacer hard refresh del navegador para evitar cache vieja del frontend;
- si aun falla, el pendiente no esta en la planilla sino en la validacion real navegador -> Apps Script y hay que probar la URL publicada exacta.

### Si no escribe filas

- revisar la hoja `Log`;
- revisar que los encabezados de fila 1 coincidan exactamente;
- revisar que el formulario haya enviado al menos un pronostico completo;
- revisar permisos del Apps Script;
- revisar que `PRODE_SHEETS_ENDPOINT` no este vacio.

### Si Google pide permisos

- aceptar permisos con la cuenta duena de la planilla;
- volver a desplegar el `Web App`;
- probar otra vez usando la URL nueva del deploy.

## 9. Pendiente antes de activar el Prode publicamente

Antes de mostrar el Prode en la home conviene completar esto:

- pegar la URL real del Web App en `js/prode-mundial.js`;
- hacer una prueba real end-to-end desde navegador;
- verificar que `Participantes`, `Pronosticos` y `Log` escriban bien;
- definir si se permitira reenvio multiple o un bloqueo por telefono / familia / submission;
- definir fecha de cierre general y politica de edicion;
- decidir si el ranking futuro seguira leyendo JSON o pasara a leer Sheets/API.
