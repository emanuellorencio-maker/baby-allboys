// Aislamiento de identidad con el directorio real; no modifica datos ni consulta red.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx=vm.createContext({DIRECTORIO_CLUBES:read('data/clubes-direcciones.json'),ESCUDOS_CLUBES:[],ZONA_CONFIG:read('data/torneo.json').tiras,zonaActual:'c'});
for(const name of ['norm','esPropio'])vm.runInContext(html.split('\n').find(l=>l.startsWith(`function ${name}(`)),ctx);
vm.runInContext(html.slice(html.indexOf('function escudoVerificado('),html.indexOf('function renderTeamBadge(')),ctx);
const club=ctx.DIRECTORIO_CLUBES.CIENCIAYLABOR;
const sede=club.sedes.c;
const entry={estado:'verificado',nombre:club.nombre,zona:'c',direccion:sede.direccion,localidad:sede.localidad,fuenteFefi:sede.fuente,fuenteIdentidad:'https://example.org/identidad',fuenteEscudo:'https://example.org/escudo',archivo:'assets/escudos/prueba.png'};
const resolve=(name=club.nombre,z='c')=>ctx.escudoVerificado(name,z);
assert.equal(resolve(),'');
ctx.ESCUDOS_CLUBES=[entry];
assert.equal(resolve(),entry.archivo);
assert.equal(resolve('CLUB CIENCIA Y LABOR','i'),'');
assert.equal(resolve(club.nombre,'i'),'');
for(const change of [{estado:'pendiente'},{direccion:'CUENCA 1750'},{localidad:'Otra localidad'},{fuenteFefi:''},{fuenteIdentidad:''},{fuenteEscudo:''},{archivo:'https://example.org/crest.png'},{archivo:'assets/escudos/../logo.png'}]){
  ctx.ESCUDOS_CLUBES=[{...entry,...change}];assert.equal(resolve(),'');
}
ctx.ESCUDOS_CLUBES=[entry,entry];assert.equal(resolve(),'');
ctx.ESCUDOS_CLUBES=null;assert.equal(resolve(),'');
ctx.ESCUDOS_CLUBES=[null,{},false];assert.equal(resolve(),'');
assert.equal(ctx.esPropio('ALL BOYS','desconocida'),false);
assert.equal(ctx.esPropio('ALL BOYS "A"','c'),true);
// Cada entrada publicada debe resolverse y su imagen debe existir en el repo.
ctx.ESCUDOS_CLUBES=read('data/clubes-escudos.json');
assert.ok(Array.isArray(ctx.ESCUDOS_CLUBES));
for(const e of ctx.ESCUDOS_CLUBES){
  assert.equal(resolve(e.nombre,e.zona),e.archivo);
  assert.ok(fs.existsSync(path.join(root,e.archivo)),e.archivo);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,e.archivo))).digest('hex'),e.sha256,e.archivo+' checksum');
}
// Sintaxis de todos los scripts inline, sin ejecutar inicialización ni integraciones.
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  if(!/\bsrc=/.test(match[1])&&!/application\/ld\+json/.test(match[1]))new vm.Script(match[2]);
}
console.log('OK: identidad por zona/sede, evidencia obligatoria, ambiguos, rutas y sintaxis inline.');
