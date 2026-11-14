import copy,json,unittest
from pathlib import Path
import actualizar_clausura as u
from correcciones_fefi_20261113 import TRANSICIONES,correccion_revisada
P=Path(__file__).parent/'fixtures/correccion-20261113'
class ReviewedCorrections(unittest.TestCase):
 def setUp(self):
  self.old=json.loads((P/'before.json').read_text());self.new=json.loads((P/'after.json').read_text())
 def check(self,old=None,new=None,key='mat1',torneo='clausura-2026'):
  u.validar_no_retroceso(self.old if old is None else old,self.new if new is None else new,key,torneo)
 def test_exact_reviewed_batch(self):self.check()
 def test_unchanged_after_import(self):self.check(old=self.new)
 def test_no_other_zone(self):
  for key in ['c','i','mat4']:
   with self.subTest(key=key), self.assertRaises(u.FuenteInvalida):self.check(key=key)
 def test_no_other_tournament(self):
  for c in TRANSICIONES:self.assertFalse(correccion_revisada(self.old,'mat1','clausura-2027',c['cat'],c['antes'],c['despues']))
 def test_no_other_baseline(self):
  old=copy.deepcopy(self.old);old['general'][0]['pts']+=1
  with self.assertRaises(u.FuenteInvalida):self.check(old=old)
 def test_no_extra_regression(self):
  new=copy.deepcopy(self.new);new['categorias']['2013'][0]['pts']-=1
  with self.assertRaises(u.FuenteInvalida):self.check(new=new)
 def test_missing_team_rejected(self):
  new=copy.deepcopy(self.new);new['categorias']['2013'].pop()
  with self.assertRaises(u.FuenteInvalida):self.check(new=new)
 def test_changed_reviewed_row_rejected(self):
  for c in TRANSICIONES:
   for field in ['pj','pts','g','e','p','posicion']:
    with self.subTest(cat=c['cat'],field=field):
     new=copy.deepcopy(self.new);row=next(r for r in new['categorias'][c['cat']] if r['equipo']==c['despues']['equipo']);row[field]-=1
     with self.assertRaises(u.FuenteInvalida):self.check(new=new)
 def test_future_regression_after_update_rejected(self):
  new=copy.deepcopy(self.new);new['categorias']['2014/15'][3]['pts']-=1
  with self.assertRaises(u.FuenteInvalida):self.check(old=self.new,new=new)
if __name__=='__main__':unittest.main()
