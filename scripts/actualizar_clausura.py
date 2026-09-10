"""FEFI -> JSON compatibles. Sin navegador, credenciales ni escrituras parciales por fallos de fuente."""
import argparse
import concurrent.futures
import hashlib
import json
import re
import sys
import time
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scraper import canon, normalizar, parsear_tablas

MESES = dict(zip(['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'], range(1,13)))


def read(path, default=None):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else default


def fetch(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'BabyAllBoys/2.0 (+https://baby-allboys.vercel.app)'})
            with urllib.request.urlopen(req, timeout=45) as response:
                return response.read().decode('utf-8')
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def section(soup, label):
    # FEFI vincula botones ptN con contN. Verificar etiqueta evita mezclar torneos.
    buttons = [e for e in soup.select('[id^="pt"]') if normalizar(e.get_text(' ')) == label]
    if len(buttons) != 1 or not re.fullmatch(r'pt\d+', buttons[0]['id']):
        raise ValueError(f'No se identifica inequívocamente {label}')
    block = soup.find(id=buttons[0]['id'].replace('pt', 'cont', 1))
    if block is None or len(block.find_all('table')) != 1:
        raise ValueError(f'Tabla ausente o ambigua: {label}')
    return block


def rows(table):
    """Expandir rowspan/colspan antes de interpretar columnas, incluidos vacíos."""
    pending = {}
    output = []
    for tr in table.select('tr'):
        row = {}
        for col, (text, remaining) in list(pending.items()):
            row[col] = text
            if remaining == 1:
                del pending[col]
            else:
                pending[col] = (text, remaining - 1)
        col = 0
        for cell in tr.find_all(['th','td'], recursive=False):
            while col in row:
                col += 1
            text = normalizar(cell.get_text(' '))
            for _ in range(int(cell.get('colspan', 1))):
                row[col] = text
                if int(cell.get('rowspan', 1)) > 1:
                    pending[col] = (text, int(cell['rowspan']) - 1)
                col += 1
        output.append([row.get(i, '') for i in range(max(row, default=-1) + 1)])
    return output


def fixture(block, cfg, torneo):
    result = []
    fecha = None
    for row in rows(block.find('table')):
        match = re.fullmatch(r'Fecha\s+(\d+)\s*-\s*(\d+)\s+de\s+(\w+)', row[0], re.I) if row else None
        if match:
            n, day, month = match.groups()
            month = month.lower().replace('setiembre','septiembre')
            iso = date(torneo['anio'], MESES[month], int(day)).isoformat()
            if MESES[month] < 8:
                raise ValueError('Fecha de Apertura en fixture Clausura')
            fecha = (row[0], f'F{int(n)}', iso)
        elif len(row) == 3 and row[1].lower() == 'vs' and canon(cfg['equipo']) in (canon(row[0]),canon(row[2])):
            if not fecha:
                raise ValueError('Partido sin fecha')
            libre = 'LIBRE' in (canon(row[0]), canon(row[2]))
            result.append(dict(fecha=fecha[0], fecha_id=fecha[1], fecha_iso=fecha[2], local=row[0], visitante=row[2],
                               condicion='Libre' if libre else ('Local' if canon(row[0]) == canon(cfg['equipo']) else 'Visitante'),
                               horario=None, estado='libre' if libre else 'programado', torneo=torneo['id']))
    if len(result) != 15 or {p['fecha_id'] for p in result} != {f'F{i}' for i in range(1,16)}:
        raise ValueError(f'Fixture incompleto o duplicado: {len(result)} fechas')
    return result


def resultados(block, cfg, fx, torneo):
    data = rows(block.find('table'))
    header = [canon(x) for x in data[0]]
    cats = cfg['categorias']
    indexes = []
    for cat in cats:
        aliases = {canon(cat), canon('/'.join(x[-2:] for x in cat.split('/')))}
        found = [i for i,h in enumerate(header) if h in aliases]
        if len(found) != 1:
            raise ValueError(f'Categoría ausente/ambigua {cat}')
        indexes.append(found[0])
    ft, team, pj, pts, state = (header.index(k) for k in ['FT','EQUIPOS','PJ','PTS','ESTADO'])
    if (len(data)-1) % 2:
        raise ValueError('Resultados con filas impares')
    general = {}
    pending = []
    seen = set()
    for offset in range(1,len(data),2):
        home, away = data[offset:offset+2]
        if len(home) != len(header) or len(away) != len(header):
            raise ValueError('Resultado con columnas inesperadas')
        if canon(cfg['equipo']) not in (canon(home[team]),canon(away[team])):
            continue
        fid = home[ft]
        match = next((p for p in fx if p['fecha_id'] == fid), None)
        if not match or fid in seen or home[ft] != away[ft]:
            raise ValueError(f'Fecha inválida o duplicada {fid}')
        seen.add(fid)
        if (canon(match['local']),canon(match['visitante'])) != (canon(home[team]),canon(away[team])):
            raise ValueError(f'Resultado y fixture no coinciden: {fid}')
        scores = {cat:{'local':home[i] or None,'visitante':away[i] or None} for cat,i in zip(cats,indexes)}
        has_scores = any(v is not None and v != '-' for score in scores.values() for v in score.values())
        official_state = home[state]
        match['estado_fuente'] = official_state or None
        if has_scores:
            match['estado'] = 'libre' if match['condicion']=='Libre' else ('verificado' if canon(official_state)=='VERIFICADO' else 'provisional')
            def number(v):
                return int(v) if v.isdigit() else None
            general[fid] = [dict(fecha_id=fid,fecha=match['fecha'],local=home[team],visitante=away[team],
                pj_local=number(home[pj]),pj_visitante=number(away[pj]),pts_local=number(home[pts]),pts_visitante=number(away[pts]),
                resultados=scores,estado=official_state,torneo=torneo['id'])]
        elif match['condicion'] != 'Libre' and match['fecha_iso'] < date.today().isoformat():
            match['estado'] = 'sin_resultado_publicado'
            pending.append({'fecha_id':fid,'estado_fuente':official_state or None})
    if len(seen) != len(fx):
        raise ValueError('No se recibieron todas las fechas de resultados')
    return {'general':general,'categorias':{},'torneo':torneo['id']}, pending


def parse_zone(key, cfg, torneo):
    url = f"https://fefi.com.ar/2026-torneo-anual-baby-futbol/{cfg['slug']}/"
    html = fetch(url)
    soup = BeautifulSoup(html,'html.parser')
    fx = fixture(section(soup,'FIXTURE CLAUSURA'),cfg,torneo)
    res,pending = resultados(section(soup,'RESULTADOS CLAUSURA'),cfg,fx,torneo)
    tabla = parsear_tablas(section(soup,'TABLAS CLAUSURA'),cfg['categorias'])
    for name, group in [('general',tabla['general']), *tabla['categorias'].items()]:
        names = [canon(r['equipo']) for r in group]
        if not 14 <= len(group) <= 16 or len(names) != len(set(names)) or canon(cfg['equipo']) not in names:
            raise ValueError(f'{key}: tabla incompleta/duplicada {name}')
    tabla['torneo'] = torneo['id']
    clubs = []
    for row in rows(section(soup,'DIRECCIONES').find('table'))[1:]:
        if len(row) < 3:
            raise ValueError('Dirección sin columnas requeridas')
        clubs.append({'nombre':row[0], 'direccion':row[1], 'localidad':row[2], 'fuente':url})
    if not 14 <= len(clubs) <= 16:
        raise ValueError('Directorio incompleto')
    own = next(r for r in tabla['general'] if canon(r['equipo']) == canon(cfg['equipo']))
    report = {'zona':cfg['zona'],'fuente':url,'fechas':len(fx),'resultados':len(res['general']),
              'posicion':tabla['general'].index(own)+1,'puntos':own['pts'],'sin_resultado_publicado':pending}
    return key,fx,res,tabla,clubs,report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='Validar fuente sin escribir')
    args = parser.parse_args()
    torneo = read(ROOT/'data/torneo.json')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(parse_zone,k,c,torneo) for k,c in torneo['tiras'].items()]
        bundles = [f.result() for f in futures]  # Si una falla no se publica ninguna.
    outputs = {}
    directory = {}
    report = {'torneo':torneo['id'],'fuentes':{},'horarios':'No publicados en estas fuentes; confirmar con el club.'}
    for key,fx,res,tabla,clubs,summary in bundles:
        saved = read(ROOT/f'data/{key}/resultados.json', {})
        for fid, matches in saved.get('general', {}).items():
            current = next((p for p in fx if p['fecha_id'] == fid), None)
            if current and current['estado'] != 'verificado':
                manual = [p for p in matches if p.get('_manual') and p.get('torneo') == torneo['id']
                          and (p.get('local'),p.get('visitante')) == (current['local'],current['visitante'])]
                if manual:
                    res['general'][fid] = manual
                    current['estado'] = 'provisional'
        print(json.dumps(summary,ensure_ascii=True))
        report['fuentes'][key] = summary
        directions = {}
        for club in clubs:
            ident = canon(club['nombre'])
            # Un mismo club puede tener sedes distintas por tira: mantenerlas explícitas.
            entry = directory.setdefault(ident, {'nombre':club['nombre'],'sedes':{}})
            entry['sedes'][key] = {k:v for k,v in club.items() if k!='nombre'}
            directions[club['nombre']] = ' '.join([club['direccion'],club['localidad']])
        for name,payload in [('fixture',fx),('resultados',res),('tabla',tabla),('direcciones',directions)]:
            outputs[f'data/{key}/{name}.json'] = payload
            outputs[f'{name}_{key}.json'] = payload
        # Alias público nuevo para D; c sigue siendo el identificador estable de la tira.
        if key == 'c':
            for name,payload in [('fixture',fx),('resultados',res),('tabla',tabla),('direcciones',directions)]:
                outputs[f'data/d/{name}.json'] = payload
    outputs['data/clubes-direcciones.json'] = directory
    digest = hashlib.sha256(json.dumps(outputs,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    previous = read(ROOT/'data/estado-fefi.json',{})
    report['hash_datos'] = digest
    report['actualizado'] = previous.get('actualizado') if previous.get('hash_datos')==digest else datetime.now(timezone.utc).isoformat()
    report['verificado'] = datetime.now(timezone.utc).isoformat()
    outputs['data/estado-fefi.json'] = report
    if args.check:
        print('CHECK OK: cuatro tiras, sin escrituras')
        return
    # Guardar snapshot histórico una sola vez. Nunca se elimina el Apertura.
    for key in torneo['tiras']:
        for name in ['fixture','tabla','resultados','direcciones']:
            path = ROOT/f'data/{key}/{name}.json'
            archive = ROOT/f'data/historico/apertura-2026/{key}/{name}.json'
            current = read(path)
            if not archive.exists() and current is not None and previous.get('torneo') != torneo['id']:
                outputs[str(archive.relative_to(ROOT))] = current
    for relative,payload in outputs.items():
        path = ROOT/relative
        value = json.dumps(payload,ensure_ascii=False,indent=2)+'\n'
        if path.exists() and path.read_text(encoding='utf-8') == value:
            continue
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(value,encoding='utf-8')
    print('OK: datos oficiales guardados; publicar todos juntos en un commit.')


if __name__ == '__main__':
    main()
