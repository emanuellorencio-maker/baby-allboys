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

## Fase 5B

Archivos nuevos previstos para la generacion automatica:

- `js/prode-sheets-adapter.js`
- `scripts/generar-ranking-prode.js`
- `data/prode/ranking.json`

Pipeline previsto:

1. leer `Participantes`
2. leer `Pronosticos`
3. leer `Resultados`
4. calcular `ranking_general`
5. agrupar `ranking_por_categoria`
6. agrupar `ranking_por_tira`
7. exportar `data/prode/ranking.json`

Estructura de salida:

```json
{
  "generated_at": "2026-06-04T18:00:00.000Z",
  "total_participantes": 3,
  "total_pronosticos": 15,
  "ranking_general": [],
  "ranking_por_categoria": {},
  "ranking_por_tira": {}
}
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

## Fase 5C

Objetivo previsto:

- consumir `data/prode/ranking.json` desde `prode-ranking.html`
- mostrar top general
- mostrar top por categoria
- mostrar top por tira
- mostrar posicion individual cuando se defina la UI final
