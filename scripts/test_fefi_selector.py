import copy
import io
import json
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlsplit, parse_qs
from bs4 import BeautifulSoup
import actualizar_clausura as u
from fefi_selector import panel_validado, tablas_selector

FIXTURES = Path(__file__).parent/'fixtures/fefi-selector-2026'


def offline(url):
    q=parse_qs(urlsplit(url).query)
    key={'d':'c','i':'i','1':'mat1','4':'mat4'}[q['zona'][0]]
    return (FIXTURES/f"{key}-{q['vista'][0]}.html").read_text(encoding='utf-8')


class SelectorTests(unittest.TestCase):
    def test_puestos_oficiales_compartidos(self):
        url='https://fefi.com.ar/2026-torneo-anual-baby-futbol/?zona=1&vista=tablas-clausura'
        soup=BeautifulSoup(offline(url),'html.parser')
        panel=panel_validado(soup,'mat1','tablas-clausura')
        cells=panel.select('.fefit-tabla[data-panel="general"] .fefit-pos__n')
        cells[4].string='5'
        cells[5].string=''
        cells[5]['title']='Empatado en el puesto 5'
        cats=u.read(u.ROOT/'data/torneo.json')['tiras']['mat1']['categorias']
        table=tablas_selector(panel,cats)
        self.assertEqual([r['posicion'] for r in table['general'][4:6]],[5,5])
        del cells[5]['title']
        with self.assertRaises(ValueError):tablas_selector(panel,cats)

    def test_cuatro_tiras_reales_y_fecha9_pendiente(self):
        torneo=u.read(u.ROOT/'data/torneo.json')
        expected={'c':('AGRONOMIA CENTRAL','ALL BOYS "A"',67,6),
                  'i':('ALL BOYS "B"','LOS ANDES',74,7),
                  'mat1':('LOS ALBOS','PLATENSE BLANCO',79,7),
                  'mat4':('COMPLEJO COSTAS CELESTE','ALL BOYS',78,7)}
        with patch.object(u,'fetch',side_effect=offline):
            for key,cfg in torneo['tiras'].items():
                with self.subTest(key=key):
                    _,fx,res,tabla,clubs,report=u.parse_zone(key,cfg,torneo)
                    home,away,points,count=expected[key]
                    self.assertEqual(len(fx),15)
                    self.assertEqual((fx[8]['local'],fx[8]['visitante']),(home,away))
                    self.assertEqual(fx[8]['fecha_iso'],'2026-10-03')
                    self.assertEqual(fx[8]['estado_fuente'],'Pendiente')
                    self.assertNotIn('F9',res['general'])
                    self.assertEqual(len(res['general']),count)
                    self.assertEqual(report['puntos'],points)
                    self.assertEqual(list(tabla['categorias']),cfg['categorias'])
                    self.assertTrue(all(p['horario'] is None for p in fx))
                    self.assertTrue(all(c['direccion'] for c in clubs))
                    if key=='mat1':
                        self.assertEqual(fx[1]['visitante'],'NUEVA CHICAGO')
                        self.assertIn('NUEVA CHICAGO',[c['nombre'] for c in clubs])

    def test_identidad_de_selector_y_query_estrictas(self):
        url='https://fefi.com.ar/2026-torneo-anual-baby-futbol/?zona=d&vista=fechas-clausura'
        for wrong in [url.replace('zona=d','zona=i'),url.replace('fechas-clausura','fechas-apertura'),url+'&zona=i']:
            with self.assertRaises(u.FuenteInvalida):u.validar_url_fuente(url,wrong)
        html=offline(url)
        for attr,value in [('data-zona','17'),('data-vista','fechas-apertura'),('data-config','{"torneo":2}')]:
            s=BeautifulSoup(html,'html.parser');s.select_one('.fefit')[attr]=value
            with self.assertRaises(ValueError):panel_validado(s,'c','fechas-clausura')
        with self.assertRaises(ValueError):panel_validado(BeautifulSoup(html,'html.parser'),'mat1','fechas-clausura')

    def test_no_acepta_resultados_parciales_o_categorias_erroneas(self):
        torneo=u.read(u.ROOT/'data/torneo.json')
        for selector in ['.fefit-fecha[data-panel="9"]','thead th[title="Categoría 2019"]']:
            def damaged(url):
                html=offline(url)
                if 'vista=fechas-clausura' in url:
                    s=BeautifulSoup(html,'html.parser');s.select_one(selector).decompose();return str(s)
                return html
            with patch.object(u,'fetch',side_effect=damaged):
                with self.assertRaises(ValueError):u.parse_zone('c',torneo['tiras']['c'],torneo)

    def test_importacion_completa_preserva_libre_historico(self):
        original=u.ROOT
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            for relative in ['data/torneo.json','data/estado-fefi.json',*[f'data/{k}/resultados.json' for k in ['c','i','mat1','mat4']]]:
                dest=root/relative;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(original/relative,dest)
            previous=u.read(root/'data/mat1/resultados.json')['general']['F3']
            with patch.object(u,'ROOT',root),patch.object(u,'fetch',side_effect=offline),patch.object(u.sys,'argv',['actualizar_clausura.py']),redirect_stdout(io.StringIO()):
                u.main()
            self.assertEqual(u.read(root/'data/mat1/resultados.json')['general']['F3'],previous)
            for key in ['c','i','mat1','mat4']:
                self.assertNotIn('F9',u.read(root/f'data/{key}/resultados.json')['general'])
                self.assertEqual(len(u.read(root/f'data/{key}/fixture.json')),15)
            self.assertEqual(u.read(root/'data/c/fixture.json'),u.read(root/'data/d/fixture.json'))


if __name__=='__main__':unittest.main()
