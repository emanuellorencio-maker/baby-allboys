import copy
import unittest
import io
from contextlib import redirect_stdout
from unittest.mock import patch, MagicMock
from bs4 import BeautifulSoup
import actualizar_clausura as updater
from actualizar_clausura import rows, section, fixture, resultados, read, ROOT, FuenteInvalida
from test_fefi_selector import SelectorTests


class ClausuraTests(unittest.TestCase):
    def test_redirect_2025_rechazado_antes_de_leer_sin_reintentos(self):
        url = 'https://fefi.com.ar/2026-torneo-anual-baby-futbol/d/'
        response = MagicMock()
        response.__enter__.return_value = response
        response.geturl.return_value = url.replace('2026', '2025')
        with patch.object(updater.urllib.request, 'urlopen', return_value=response) as request:
            with self.assertRaisesRegex(FuenteInvalida, '2026.*2025'):
                updater.fetch(url)
        request.assert_called_once()
        response.read.assert_not_called()

    def test_canonical_no_encubre_otro_anio_o_zona(self):
        url = 'https://fefi.com.ar/2026-torneo-anual-baby-futbol/d/'
        for other in [url.replace('2026','2025'), url.replace('/d/','/i/'), url.replace('fefi.com.ar','otro.example')]:
            with self.subTest(other=other):
                soup = BeautifulSoup(f'<link rel="canonical" href="{other}">', 'html.parser')
                with self.assertRaises(FuenteInvalida):
                    updater.validar_canonical(soup,url)
        for markup in ['', f'<link rel="canonical" href="{url}">' * 2]:
            with self.assertRaisesRegex(FuenteInvalida,'ausente o ambigua'):
                updater.validar_canonical(BeautifulSoup(markup,'html.parser'),url)

    def test_fuentes_validas_y_fixture_guardado_cuatro_tiras(self):
        torneo = read(ROOT/'data/torneo.json')
        for key,cfg in torneo['tiras'].items():
            with self.subTest(tira=key):
                url = f"https://fefi.com.ar/2026-torneo-anual-baby-futbol/{cfg['slug']}/"
                saved = read(ROOT/f'data/{key}/fixture.json')
                from html import escape
                markup = ''.join(f'<tr><td>{escape(p["fecha"])}</td></tr><tr><td>{escape(p["local"])}</td><td>vs</td><td>{escape(p["visitante"])}</td></tr>' for p in saved)
                soup = BeautifulSoup(f'<link rel="canonical" href="{url}"><div id="pt1">FIXTURE CLAUSURA</div><div id="cont1"><table>{markup}</table></div>','html.parser')
                updater.validar_url_fuente(url,url)
                updater.validar_canonical(soup,url)
                parsed = fixture(section(soup,'FIXTURE CLAUSURA'),cfg,torneo)
                self.assertEqual([(p['fecha_id'],p['fecha_iso'],p['local'],p['visitante']) for p in parsed],
                                 [(p['fecha_id'],p['fecha_iso'],p['local'],p['visitante']) for p in saved])

    def test_parse_zone_rechaza_canonical_antes_de_tablas(self):
        torneo = read(ROOT/'data/torneo.json')
        html = '<link rel="canonical" href="https://fefi.com.ar/2025-torneo-anual-baby-futbol/d/">'
        with patch.object(updater,'fetch',return_value=html), patch.object(updater,'section') as parse:
            with self.assertRaises(FuenteInvalida):
                updater.parse_zone('c',torneo['tiras']['c'],torneo)
        parse.assert_not_called()

    def test_config_inconsistente_no_consulta_red(self):
        with patch.object(updater,'fetch') as request:
            with self.assertRaises(FuenteInvalida):
                updater.parse_zone('c',{'slug':'d'},{'id':'clausura-2026','anio':2025})
        request.assert_not_called()

    def test_fallo_de_una_tira_no_escribe_ni_finge_verificacion(self):
        for args in [[],['--check']]:
            with self.subTest(args=args):
                def source(key,cfg,torneo):
                    if key == 'mat1':
                        raise FuenteInvalida('redirección 2026 -> 2025')
                    return (key, [], {}, {}, [], {})
                output=io.StringIO()
                with patch.object(updater.sys,'argv',['actualizar_clausura.py',*args]), patch.object(updater,'parse_zone',side_effect=source), patch.object(updater.Path,'write_text') as write, redirect_stdout(output):
                    with self.assertRaisesRegex(FuenteInvalida,'conservan datos.*\nmat1: redirección 2026 -> 2025'):
                        updater.main()
                write.assert_not_called()
                self.assertNotIn('CHECK OK',output.getvalue())
                self.assertNotIn('guardados',output.getvalue())

    def test_rowspan_preserva_vacios_y_estado(self):
        table = BeautifulSoup('<table><tr><td rowspan="2">F1</td><td>A</td><td></td><td rowspan="2">Previo</td></tr><tr><td>B</td><td>0</td></tr></table>', 'html.parser').table
        self.assertEqual(rows(table), [['F1','A','','Previo'],['F1','B','0','Previo']])

    def test_seccion_no_acepta_apertura(self):
        soup = BeautifulSoup('<div id="pt6">RESULTADOS APERTURA</div><div id="cont6"><table></table></div>', 'html.parser')
        with self.assertRaises(ValueError):
            section(soup,'RESULTADOS CLAUSURA')

    def test_fixture_vacio_no_se_publica(self):
        torneo = read(ROOT/'data/torneo.json')
        with self.assertRaises(ValueError):
            fixture(BeautifulSoup('<div><table></table></div>','html.parser'),torneo['tiras']['c'],torneo)

    def test_cero_puntos_sin_marcadores_no_es_jugado(self):
        torneo = {'id':'clausura-2026'}
        cfg = {'equipo':'ALL BOYS','categorias':['2019']}
        fx = [{'fecha_id':'F1','fecha':'Fecha 1 - 08 de Agosto','fecha_iso':'2026-08-08','local':'ALL BOYS','visitante':'RIVAL','condicion':'Local','estado':'programado'}]
        html = '<div><table><tr><th>F.T.</th><th>EQUIPOS</th><th>19</th><th>P.J.</th><th>Pts.</th><th>Estado</th></tr><tr><td rowspan="2">F1</td><td>ALL BOYS</td><td></td><td>0</td><td>0</td><td rowspan="2"></td></tr><tr><td>RIVAL</td><td></td><td>0</td><td>0</td></tr></table></div>'
        block=BeautifulSoup(html,'html.parser')
        result,_=resultados(block,cfg,copy.deepcopy(fx),torneo)
        self.assertEqual(result['general'],{})
        # Un 0-0 real SI es un resultado.
        scored=BeautifulSoup(html.replace('<td></td>','<td>0</td>'),'html.parser')
        result,_=resultados(scored,cfg,copy.deepcopy(fx),torneo)
        self.assertEqual(result['general']['F1'][0]['resultados']['2019'],{'local':'0','visitante':'0'})
        fx[0]['local'],fx[0]['visitante']='RIVAL','ALL BOYS'
        with self.assertRaises(ValueError):
            resultados(block,cfg,fx,torneo)


if __name__=='__main__':
    unittest.main()
