# Prode Mundial Baby All Boys

## Estado actual

La web publica del Prode sigue leyendo:

- `data/prode/participantes.json`
- `data/prode/partidos.json`

La recepcion publica por Google Sheets / Apps Script sigue documentada aparte en:

- `data/prode/README-CARGA.md`
- `data/prode/APPS-SCRIPT-PRODE.md`

## Motor de puntuacion

En Fase 5A se agrego un motor aislado, sin DOM, para calcular puntajes por signo:

- `js/prode-ranking-engine.js`

Funciones disponibles:

- `normalizeSign()`
- `calculateSubmissionScore()`
- `calculateRanking()`
- `groupRankingByCategory()`

Regla de puntos:

- `LOCAL` vs `LOCAL` = `1`
- `LOCAL` vs `EMPATE` = `0`
- `EMPATE` vs `EMPATE` = `1`
- `VISITANTE` vs `VISITANTE` = `1`

## Resultados oficiales

Archivo nuevo:

- `data/prode/resultados-oficiales.json`

Formato:

```json
{
  "M001": "LOCAL",
  "M002": "EMPATE",
  "M003": "VISITANTE"
}
```

Empieza vacio:

```json
{}
```

## Hojas Google Sheets preparadas para la fase siguiente

### Hoja `Resultados`

```text
partido_id | sign
```

### Hoja `Ranking`

```text
submission_id | nombre_hijo | apellido_hijo | categoria | tira | puntos
```

## Dataset de prueba del motor

El motor incluye un escenario de prueba interno con:

- `3` participantes
- `5` partidos
- algunos aciertos y errores

Sirve para validar:

- suma de puntos
- orden del ranking
- empates de puesto cuando corresponda

## Fase 5B

Proximo paso previsto:

- leer `Participantes`
- leer `Pronosticos`
- leer `Resultados`
- recalcular `Ranking`

## Fase 5C

Despues:

- publicar el ranking web con datos reales
