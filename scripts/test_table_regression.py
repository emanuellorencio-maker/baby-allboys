import copy
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import actualizar_clausura as u

class RegressionTests(unittest.TestCase):
    def setUp(self):
        self.old={'torneo':'clausura-2026','general':[{'equipo':'ALL BOYS "A"','pj':82,'pts':154}], 'categorias':{'2019':[{'equipo':'ALL BOYS "A"','pj':12,'pts':19}]}}
    def check(self,new):u.validar_no_retroceso(self.old,new,'c','clausura-2026')
    def test_unchanged(self):self.check(copy.deepcopy(self.old))
    def test_progress(self):
        new=copy.deepcopy(self.old);new['general'][0].update(pj=89,pts=170);self.check(new)
    def test_points_rewind(self):
        new=copy.deepcopy(self.old);new['general'][0]['pts']=133
        with self.assertRaises(u.FuenteInvalida):self.check(new)
    def test_games_rewind(self):
        new=copy.deepcopy(self.old);new['general'][0]['pj']=75
        with self.assertRaises(u.FuenteInvalida):self.check(new)
    def test_category_rewind(self):
        new=copy.deepcopy(self.old);new['categorias']['2019'][0]['pts']=16
        with self.assertRaises(u.FuenteInvalida):self.check(new)
    def test_missing_team(self):
        new=copy.deepcopy(self.old);new['general']=[]
        with self.assertRaises(u.FuenteInvalida):self.check(new)
    def test_new_tournament_not_compared(self):u.validar_no_retroceso(self.old,{},'c','clausura-2027')
    def test_position_drop_is_valid(self):
        new=copy.deepcopy(self.old);new['general'][0]['posicion']=13;self.check(new)
    def test_first_import(self):u.validar_no_retroceso(None,{},'c','clausura-2026')
    def test_official_downward_correction_requires_review(self):
        new=copy.deepcopy(self.old);new['general'][0]['pts']=153
        with self.assertRaisesRegex(u.FuenteInvalida,'corrección oficial'):self.check(new)
    def test_entire_batch_unchanged_on_regression(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'data/c').mkdir(parents=True)
            config={'id':'clausura-2026','anio':2026,'tiras':{k:{} for k in ['c','i','mat1','mat4']}}
            (root/'data/torneo.json').write_text(json.dumps(config))
            (root/'data/c/tabla.json').write_text(json.dumps(self.old))
            (root/'data/estado-fefi.json').write_text('{"verificado":"NO_CAMBIAR"}')
            before={str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()}
            def bundle(key,cfg,torneo):
                table=copy.deepcopy(self.old)
                if key=='c':table['general'][0].update(pj=75,pts=133)
                return key,[],{},table,[],{}
            with patch.object(u,'ROOT',root),patch.object(u,'parse_zone',side_effect=bundle),patch.object(u.sys,'argv',['actualizar_clausura.py']):
                with self.assertRaises(u.FuenteInvalida):u.main()
            after={str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()}
            self.assertEqual(before,after)

if __name__=='__main__':unittest.main()
