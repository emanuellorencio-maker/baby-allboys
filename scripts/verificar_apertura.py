"""Extrae/verifica solo TABLAS APERTURA; nunca modifica datos del proyecto."""
import argparse
import concurrent.futures
import json
from datetime import datetime, timezone

from bs4 import BeautifulSoup
from actualizar_clausura import ROOT, fetch, read, rows, section, parsear_tablas, canon

# Zonas verificadas por la presencia del equipo en TABLAS APERTURA de FEFI.
ZONAS = {'c': ('C', 'c'), 'i': ('I', 'i'), 'mat1': ('MAT1', 'mat-1'), 'mat4': ('MAT4', 'mat-4')}


def extraer(key):
    cfg = read(ROOT / 'data/torneo.json')['tiras'][key]
    zona, slug = ZONAS[key]
    url = f'https://fefi.com.ar/2026-torneo-anual-baby-futbol/{slug}/'
    block = section(BeautifulSoup(fetch(url), 'html.parser'), 'TABLAS APERTURA')
    raw = rows(block.find('table'))
    # Detectar categorías en la fuente, no heredarlas del Clausura.
    headings = [r[0] for r in raw if r and len(set(r)) == 1]
    assert headings[0] == 'GENERAL' and len(headings) == len(set(headings)), 'Secciones ambiguas'
    tabla = parsear_tablas(block, headings[1:])
    groups = {'GENERAL': tabla['general'], **tabla['categorias']}
    current = None
    counts = {name: 0 for name in groups}
    # Comparación independiente, celda a celda y en orden, contra todas las filas HTML.
    for row in raw:
        if len(set(row)) == 1 and row[0] in groups:
            current = row[0]
        elif current and row and row[0] not in ('EQUIPOS', 'EQUIPO'):
            assert len(row) == 6, f'Columnas inesperadas: {row}'
            parsed = groups[current][counts[current]]
            assert [parsed['equipo'], *[str(parsed[k]) for k in ('pj', 'g', 'e', 'p', 'pts')]] == row
            counts[current] += 1
    for name, group in groups.items():
        assert counts[name] == len(group) == 16, f'{key}: tabla incompleta {name}'
        names = [canon(r['equipo']) for r in group]
        assert len(set(names)) == len(names) and canon(cfg['equipo']) in names
        for i, row in enumerate(group, 1):
            row['posicion'] = i  # Orden publicado; no ordenar ni calcular puntajes.
    return {**tabla, 'torneo': 'apertura-2026', 'zona': zona, 'equipo': cfg['equipo'],
            'fuente': url, 'seccion_fuente': 'TABLAS APERTURA',
            'verificado': datetime.now(timezone.utc).isoformat()}


def sin_metadata(tabla):
    return {'general': [{k:v for k,v in r.items() if k != 'posicion'} for r in tabla['general']],
            'categorias': {cat: [{k:v for k,v in r.items() if k != 'posicion'} for r in group]
                           for cat,group in tabla['categorias'].items()}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--export', action='store_true', help='Emite JSON a stdout, sin escribir archivos')
    args = parser.parse_args()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        data = dict(zip(ZONAS, pool.map(extraer, ZONAS)))
    if args.export:
        print(json.dumps(data, ensure_ascii=True))
        return
    for key, official in data.items():
        saved = read(ROOT / f'data/apertura-2026/{key}/tabla.json')
        assert {k:v for k,v in saved.items() if k != 'verificado'} == {k:v for k,v in official.items() if k != 'verificado'}
        old = read(ROOT / f'data/historico/apertura-2026/{key}/tabla.json')
        groups = {'general': official['general'], **official['categorias']}
        own = next(r for r in official['general'] if r['equipo'] == official['equipo'])
        print(json.dumps({'tira':key, 'zona':official['zona'], 'tablas':len(groups),
                          'filas':sum(map(len,groups.values())), 'propio':own,
                          'historico_coincide': sin_metadata(old) == sin_metadata(official)}, ensure_ascii=True))
    print('OK: todas las celdas y posiciones coinciden con TABLAS APERTURA de FEFI.')


if __name__ == '__main__':
    main()
