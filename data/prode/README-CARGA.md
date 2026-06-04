# Carga del Prode Mundial Baby All Boys

## MVP Google Sheets - recepcion publica

La pagina `prode-mundial.html` recibe inscripciones y pronosticos desde el frontend y los envia a un Google Apps Script.

## 1. Que configurar en la web

En `js/prode-mundial.js` existe esta constante:

```js
const PRODE_SHEETS_ENDPOINT = "";
```

Ahi va la URL publicada del Web App de Google Apps Script.

El frontend envia el payload como `text/plain` con JSON serializado. Del lado de Apps Script se sigue leyendo con:

```js
const payload = JSON.parse(e.postData.contents || "{}");
```

## 2. Como debe quedar la hoja Participantes

La planilla real ya existe. Antes de usar el Apps Script nuevo, en la hoja `Participantes` hay que insertar una columna despues de `apellido_hijo`:

```text
numero_socio
```

Orden final obligatorio:

```text
submission_id | timestamp | nombre | apellido | nombre_hijo | apellido_hijo | numero_socio | categoria | tira | whatsapp | user_agent
```

## 3. Otras hojas

### Hoja `Pronosticos`

```text
submission_id | timestamp | partido_id | equipo_local | equipo_visitante | sign | goles_local | goles_visitante
```

### Hoja `Log`

```text
timestamp | tipo | mensaje | raw
```

## 4. Payload actual

La pagina envia este formato:

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
      "sign": "LOCAL",
      "goles_local": 1,
      "goles_visitante": 0
    }
  ],
  "metadata": {
    "origen": "baby-allboys",
    "version": "fase-2-google-sheets",
    "timestamp_cliente": "2026-06-02T00:00:00.000Z",
    "submission_id": "prode-abc123",
    "user_agent": "..."
  }
}
```

## 5. Reglas actuales

### Pronosticos por signo

- `sign` es el dato principal del pronostico
- valores validos:
  - `LOCAL`
  - `EMPATE`
  - `VISITANTE`
- `goles_local` y `goles_visitante` se mantienen solo por compatibilidad

### Duplicado fuerte con numero de socio

Si el participante carga `numero_socio`, se bloquea por esta combinacion:

- `numero_socio`
- `categoria`
- `tira`

Respuesta esperada:

```json
{
  "ok": false,
  "error": "Ya existe un Prode cargado para este jugador/a. Si necesitás corregirlo, hablá con la organización."
}
```

### Duplicado fuerte sin numero de socio

Si `numero_socio` viene vacio, se bloquea por esta combinacion:

- `nombre_hijo`
- `apellido_hijo`
- `categoria`
- `tira`

### Mismo WhatsApp

Si el mismo WhatsApp carga otro jugador/a distinto:

- se permite el envio;
- se registra `MISMO_WHATSAPP` en `Log`.

No bloquea hermanos.

## 6. Apps Script

Usar la version completa documentada en:

- [C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\APPS-SCRIPT-PRODE.md](C:\Users\emanu\OneDrive\Desktop\fefi-app\data\prode\APPS-SCRIPT-PRODE.md)

## 7. Como probar un envio real

1. publicar de nuevo el Web App despues de guardar cambios
2. verificar que `Participantes` tenga la columna `numero_socio`
3. verificar que `Pronosticos` tenga la columna `sign` despues de `equipo_visitante`
4. pegar la URL publicada en `PRODE_SHEETS_ENDPOINT`
5. levantar la web local
6. entrar directo a `prode-mundial.html`
7. completar:
   - adulto
   - chico/a
   - apellido del chico/a
   - numero de socio si se conoce
   - categoria
   - tira
   - algunos partidos
8. presionar `Confirmar mi Prode`
9. revisar las hojas `Participantes`, `Pronosticos` y `Log`

## 8. Que revisar si falla

### Error por encabezados

Si responde que falta el encabezado esperado:

- revisar el orden de columnas;
- insertar `numero_socio` despues de `apellido_hijo`;
- insertar `sign` despues de `equipo_visitante` en `Pronosticos`;
- volver a publicar el Web App.

### Duplicado con numero de socio

- cargar un envio con `numero_socio = 12345`
- intentar otro envio con:
  - el mismo `numero_socio`
  - la misma `categoria`
  - la misma `tira`
- deberia responder:

```json
{
  "ok": false,
  "error": "Ya existe un Prode cargado para este jugador/a. Si necesitás corregirlo, hablá con la organización."
}
```

### Duplicado sin numero de socio

- dejar vacio `numero_socio`
- cargar un envio con:
  - `nombre_hijo`
  - `apellido_hijo`
  - `categoria`
  - `tira`
- repetir exactamente esos cuatro datos
- deberia responder el mismo error de duplicado

### Mismo WhatsApp

- si el envio entra pero aparece `MISMO_WHATSAPP` en `Log`, es correcto;
- eso solo sirve para control manual de organizacion.
