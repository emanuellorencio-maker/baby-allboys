"""Excepciones de calendario confirmadas, independientes del lector FEFI."""
from copy import deepcopy


def aplicar_reprogramaciones(key, fixture, torneo):
    output = deepcopy(fixture)
    if key != 'c' or torneo != 'clausura-2026':
        return output
    matches = [p for p in output if p.get('fecha_id') == 'F14']
    if len(matches) != 1:
        raise ValueError('Reprogramación A/F14: fecha ausente o duplicada')
    p = matches[0]
    expected = ('CLUB LOMAS DEL MIRADOR', 'ALL BOYS "A"', 'Visitante', torneo)
    if tuple(p.get(k) for k in ('local', 'visitante', 'condicion', 'torneo')) != expected:
        raise ValueError('Reprogramación A/F14: identidad distinta; revisar antes de actualizar')
    if p.get('fecha_iso') == '2026-11-09':
        return output  # Fuente ya corregida, o aplicación repetida: no sobrescribir.
    if p.get('fecha_iso') != '2026-11-07':
        raise ValueError('Reprogramación A/F14: nueva fecha contradictoria; revisar antes de actualizar')
    p['reprogramacion'] = {
        'fecha_original': '2026-11-07',
        'fecha_confirmada': '2026-11-09',
        'confirmada_el': '2026-11-09',
        'tipo_fuente': 'confirmacion_directa',
        'nota': 'Fecha reprogramada informada; no verificada en el fixture FEFI.'
    }
    p['fecha_iso'] = '2026-11-09'
    p['fecha'] = 'Fecha 14 - 09 de Noviembre'
    p['horario'] = None
    p.pop('horario_fecha', None)
    return output
