import copy
import unittest
from bs4 import BeautifulSoup
from actualizar_clausura import rows, section, fixture, resultados, read, ROOT


class ClausuraTests(unittest.TestCase):
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
