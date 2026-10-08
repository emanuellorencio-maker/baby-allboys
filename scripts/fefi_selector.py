"""Adaptador del selector público FEFI 2026; no usa APIs privadas ni navegador."""
import json
import re
from copy import copy
from html import escape
from bs4 import BeautifulSoup
from scraper import canon, normalizar

ZONAS = {'c': ('d', 'D'), 'i': ('i', 'I'), 'mat1': ('1', '1'), 'mat4': ('4', '4')}


def unico(root, selector):
    found = root.select(selector)
    if len(found) != 1:
        raise ValueError(f'Elemento ausente/ambiguo: {selector}')
    return found[0]


def texto(node):
    node = copy(node)
    for decorative in node.select('[aria-hidden="true"]'):
        decorative.decompose()
    return normalizar(node.get_text(' ', strip=True))


def panel_validado(soup, key, vista):
    root = unico(soup, '.fefit')
    selected = unico(root, '.fefit-zonas__select option[selected]')
    slug, nombre = ZONAS[key]
    if (selected.get('data-slug') != slug or selected.get('data-nombre') != nombre
            or selected.get('value') != root.get('data-zona')
            or texto(unico(root, '.fefit-titulo__zona')) != nombre
            or root.get('data-vista') != vista
            or json.loads(root.get('data-config', '{}')).get('torneo') != 1):
        raise ValueError(f'Selector de otro torneo/zona/vista: {key}/{vista}')
    return unico(root, '.fefit-panel')


def bloque_filas(filas):
    markup = ''.join('<tr>'+''.join('<td>'+escape(str(v))+'</td>' for v in row)+'</tr>' for row in filas)
    return BeautifulSoup('<div><table>'+markup+'</table></div>', 'html.parser')


def fecha_titulo(text):
    match = re.fullmatch(r'Fecha\s+(\d+)\s*[·–-]\s*(?:sábado\s+)?(\d+)\s+de\s+(\w+)', text, re.I)
    if not match:
        raise ValueError(f'Fecha no reconocida: {text}')
    n, day, month = match.groups()
    return f'F{int(n)}', f'Fecha {int(n)} - {int(day):02d} de {month.capitalize()}'


def fixture_block(panel):
    filas = []
    tables = panel.select('table.fefit-fix')
    if len(tables) != 15:
        raise ValueError('Fixture del selector incompleto')
    for table in tables:
        _, fecha = fecha_titulo(texto(unico(table, 'thead th')))
        filas.append([fecha])
        for row in table.select('tbody tr'):
            cells = row.find_all(['td','th'], recursive=False)
            if len(cells) != 3 or texto(cells[1]).lower() != 'vs':
                raise ValueError('Fila de fixture inválida')
            filas.append([texto(c) for c in cells])
    return bloque_filas(filas)


def resultados_block(panel, cfg, fx):
    cats = cfg['categorias']
    filas = [['F.T.','EQUIPOS',*cats,'P.J.','Pts.','Estado']]
    sections = panel.select('.fefit-fecha')
    if len(sections) != 15 or {s.get('data-panel') for s in sections} != {str(n) for n in range(1,16)}:
        raise ValueError('Resultados del selector incompletos/duplicados')
    for section in sections:
        fid, fecha = fecha_titulo(texto(unico(section, '.fefit-fecha__titulo')))
        match = next((p for p in fx if p['fecha_id'] == fid), None)
        if not match or fid != 'F'+section['data-panel'] or canon(fecha) != canon(match['fecha']):
            raise ValueError('Fecha de resultados no coincide con fixture')
        own_matches = 0
        for table in section.select('table.fefit-res'):
            body = table.select('tbody tr')
            if len(body) != 2:
                raise ValueError('Resultado sin dos equipos')
            teams = [texto(unico(row, 'th.fefit-res__eq')) for row in body]
            if canon(cfg['equipo']) not in map(canon, teams):
                continue
            own_matches += 1
            headings = table.select('thead th[title^="Categoría "]')
            if [h['title'].removeprefix('Categoría ') for h in headings] != cats:
                raise ValueError('Categorías de otra tira o columnas inesperadas')
            state = texto(unico(table, '.fefit-estado'))
            for team, row in zip(teams,body):
                cells = row.find_all('td', recursive=False)
                if len(cells) != len(cats)+2:
                    raise ValueError('Resultado con columnas inesperadas')
                filas.append([fid,team,*[texto(c) for c in cells],state])
        if match['condicion'] == 'Libre':
            libres = [texto(n) for n in section.select('.fefit-libre__eq strong')]
            if own_matches or sum(canon(n)==canon(cfg['equipo']) for n in libres) != 1:
                raise ValueError('Fecha libre no confirmada en resultados')
            for team in [match['local'],match['visitante']]:
                filas.append([fid,team,*['']*(len(cats)+2),'Libre'])
        elif own_matches != 1:
            raise ValueError('Partido propio ausente/duplicado en resultados')
    return bloque_filas(filas)


def tablas_selector(panel, cats):
    blocks = panel.select('.fefit-tabla')
    if len(blocks) != len(cats)+1:
        raise ValueError('Tablas incompletas')
    output = {'general': [], 'categorias': {}}
    seen = set()
    for block in blocks:
        key = block.get('data-panel')
        expected = {'general':'Tabla general', **{f'c{i}':'Categoría '+c for i,c in enumerate(cats)}}
        if key not in expected or key in seen or texto(unico(block,'.fefit-fecha__titulo')) != expected[key]:
            raise ValueError('Tabla de categoría inesperada/duplicada')
        seen.add(key)
        table = unico(block,'table.fefit-pos')
        if [texto(h) for h in table.select('thead th')] != ['#','Equipo','PJ','G','E','P','Pts']:
            raise ValueError('Columnas de posiciones inesperadas')
        parsed = []
        for row in table.select('tbody tr'):
            cells = [texto(c) for c in row.find_all(['td','th'], recursive=False)]
            if len(cells)!=7 or not all(v.isdigit() for v in cells[2:]):
                raise ValueError('Fila de posiciones incompleta')
            rank_cell = unico(row, '.fefit-pos__n')
            tied = re.fullmatch(r'Empatado en el puesto (\d+)', rank_cell.get('title', ''))
            rank = int(cells[0]) if cells[0].isdigit() else int(tied[1]) if tied else None
            if rank is None or rank < 1:
                raise ValueError('Puesto oficial ausente o inválido')
            parsed.append({'posicion': rank, 'equipo':cells[1], **dict(zip(['pj','g','e','p','pts'],map(int,cells[2:])))})
        if key == 'general':
            output['general'] = parsed
        else:
            output['categorias'][cats[int(key[1:])]] = parsed
    return output


def libres_selector(panel, cfg):
    puntos = {}
    for section in panel.select('.fefit-fecha'):
        for article in section.select('.fefit-partido--libre'):
            if canon(texto(unico(article,'.fefit-libre__eq strong'))) != canon(cfg['equipo']):
                continue
            if not article.select('.fefit-libre__pts'):
                continue  # Libre futuro: todavía no tiene puntos publicados.
            value = texto(unico(article,'.fefit-libre__pts'))
            match = re.fullmatch(r'Suma (\d+) pts',value)
            if not match:
                raise ValueError('Puntos de fecha libre no identificados')
            puntos['F'+section['data-panel']] = int(match[1])
    return puntos


def direcciones_selector(panel, url):
    table = unico(panel, 'table.fefit-dir__tabla')
    clubs = []
    for row in table.select('tbody tr'):
        name = texto(unico(row, 'th.fefit-pos__eq'))
        address = unico(row, 'td.fefit-dir__dir')
        for mobile in address.select('.fefit-dir__loc-movil'):
            mobile.decompose()  # La localidad móvil duplica otra columna.
        clubs.append({'nombre':name,'direccion':texto(address),
                      'localidad':texto(unico(row,'td.fefit-dir__loc')),'fuente':url})
    return clubs
