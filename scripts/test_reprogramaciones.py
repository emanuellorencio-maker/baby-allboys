import unittest
from copy import deepcopy
from reprogramaciones import aplicar_reprogramaciones as apply

class RescheduleTest(unittest.TestCase):
    def setUp(self):
        self.p = dict(fecha_id='F14', fecha_iso='2026-11-07', fecha='Fecha 14 - 07 de Noviembre', local='CLUB LOMAS DEL MIRADOR', visitante='ALL BOYS "A"', condicion='Visitante', torneo='clausura-2026', horario=None, estado='sin_resultado_publicado')
    def go(self, data=None, key='c', tournament='clausura-2026'):
        return apply(key, [self.p] if data is None else data, tournament)
    def test_only_date_and_provenance(self):
        a=self.go()[0]; self.assertEqual(a['fecha_iso'],'2026-11-09'); self.assertIsNone(a['horario']); self.assertEqual(self.p['fecha_iso'],'2026-11-07')
        for k in ('fecha_id','local','visitante','condicion','torneo','estado'): self.assertEqual(a[k],self.p[k])
    def test_idempotence(self):
        a=self.go();self.assertEqual(self.go(a),a)
    def test_other_zones_and_year(self):
        for k in ['i','mat1','mat4']: self.assertEqual(self.go(key=k),[self.p])
        self.assertEqual(self.go(tournament='clausura-2027'),[self.p])
    def test_new_official_date(self):
        self.p['fecha_iso']='2026-11-09';self.assertEqual(self.go(),[self.p])
    def test_conflict(self):
        self.p['fecha_iso']='2026-11-10'
        with self.assertRaises(ValueError):self.go()
    def test_identity(self):
        for key in ('local','visitante','torneo','condicion'):
            a=deepcopy(self.p);a[key]='otro'
            with self.assertRaises(ValueError):self.go([a])
    def test_missing_duplicate(self):
        for a in ([],[self.p,self.p]):
            with self.assertRaises(ValueError):self.go(a)
    def test_old_hour_removed(self):
        self.p.update(horario='14:30',horario_fecha='2026-11-07');a=self.go()[0];self.assertIsNone(a['horario']);self.assertNotIn('horario_fecha',a)
if __name__=='__main__':unittest.main()
