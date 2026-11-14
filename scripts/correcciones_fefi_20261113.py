"""Correcciones FEFI del 13/11/2026 revisadas contra la base exacta.
No permite regresiones nuevas ni un bypass general. Publicación autorizada el 14/11/2026.
Fuente: https://fefi.com.ar/2026-torneo-anual-baby-futbol/?zona=1&vista=tablas-clausura
"""
import hashlib
import json

BASE_SHA256 = '0781619a610ff904f4d03dfccc07cf66eaf26fe84219e8ded5ba19b9d7651423'
TRANSICIONES = [{'cat': '2014/15', 'antes': {'posicion': 4, 'equipo': 'C. A. VIRGEN DEL CARMEN', 'pj': 14, 'g': 8, 'e': 2, 'p': 4, 'pts': 32}, 'despues': {'posicion': 4, 'equipo': 'C. A. VIRGEN DEL CARMEN', 'pj': 14, 'g': 7, 'e': 2, 'p': 5, 'pts': 30}}, {'cat': '2016/17', 'antes': {'posicion': 10, 'equipo': 'CLUB AT. LUGANO', 'pj': 12, 'g': 6, 'e': 0, 'p': 6, 'pts': 24}, 'despues': {'posicion': 11, 'equipo': 'CLUB AT. LUGANO', 'pj': 12, 'g': 5, 'e': 0, 'p': 7, 'pts': 22}}, {'cat': '2018/19', 'antes': {'posicion': 7, 'equipo': 'C. A. VIRGEN DEL CARMEN', 'pj': 14, 'g': 5, 'e': 2, 'p': 7, 'pts': 26}, 'despues': {'posicion': 7, 'equipo': 'C. A. VIRGEN DEL CARMEN', 'pj': 14, 'g': 5, 'e': 1, 'p': 8, 'pts': 25}}, {'cat': '2020/21/22', 'antes': {'posicion': 9, 'equipo': 'CLUB AT. LUGANO', 'pj': 12, 'g': 7, 'e': 0, 'p': 4, 'pts': 25}, 'despues': {'posicion': 9, 'equipo': 'CLUB AT. LUGANO', 'pj': 12, 'g': 6, 'e': 1, 'p': 4, 'pts': 24}}]

def correccion_revisada(previous, key, torneo, categoria, old, new):
    if key != 'mat1' or torneo != 'clausura-2026':
        return False
    digest = hashlib.sha256(json.dumps(previous, sort_keys=True, ensure_ascii=False,
                                      separators=(',', ':')).encode()).hexdigest()
    if digest != BASE_SHA256:
        return False
    return any(c['cat'] == categoria and c['antes'] == old and c['despues'] == new
               for c in TRANSICIONES)
