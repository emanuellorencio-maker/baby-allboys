// Offline behavior tests. Synthetic edge cases never change repository data.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),code=fs.readFileSync(path.join(root,'js/redesign.js'),'utf8');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
let now='2026-10-17T12:00:00Z';class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return new Date(now).getTime();}}
const config=read('data/torneo.json').tiras,directory=read('data/clubes-direcciones.json');
const data=Object.fromEntries(Object.keys(config).map(z=>[z,{fixture:read(`data/${z}/fixture.json`),results:read(`data/${z}/resultados.json`)}]));
const ctx=vm.createContext({Date:Clock,Intl,URL,URLSearchParams,window:{},config,directory,data});
vm.runInContext(code.slice(0,code.indexOf("document.addEventListener('click'")),ctx);
const run=s=>vm.runInContext(s,ctx);const reset=()=>run('CONFIG=config;DIRECTORY=JSON.parse(JSON.stringify(directory));DB=JSON.parse(JSON.stringify(data));DATA_ERRORS={};state.z="c";state.view="inicio";');reset();
let checks=0;function check(name,fn){reset();now='2026-10-17T12:00:00Z';fn();checks++;console.log('PASS',name);}
const html=()=>run('matchday()');
check('all four tiras share Argentine F11; only MAT4 has pending times',()=>{const h=html();assert.equal((h.match(/data-day-team=/g)||[]).length,4);assert.equal((h.match(/Horario pendiente de confirmación/g)||[]).length,1);assert.equal((h.match(/Fuente de la sede: FEFI/g)||[]).length,4);assert.equal((h.match(/>Cómo llegar/g)||[]).length,4);assert.match(h,/PUNTA ARENA 1271/);assert.match(h,/Hoy jugamos/);});
check('Argentine midnight and year boundaries',()=>{for(const [iso,day] of [['2026-10-17T02:59:59Z','2026-10-16'],['2026-10-17T03:00:00Z','2026-10-17'],['2027-01-01T02:59:59Z','2026-12-31']]){ctx.iso=iso;assert.equal(run('fixedDay(new Date(iso))'),day);}});
check('no games does not substitute the next date',()=>{now='2026-10-18T15:00:00Z';const h=html();assert.equal((h.match(/Sin partido hoy/g)||[]).length,4);assert.doesNotMatch(h,/>Cómo llegar|Horario confirmado|data-round=/);assert.match(h,/No hay partidos programados/);});
check('partial matchday keeps all four tiras',()=>{run('DB.i.fixture=DB.i.fixture.filter(p=>p.fecha_id!=="F11")');const h=html();assert.equal((h.match(/data-day-team=/g)||[]).length,4);assert.equal((h.match(/>Cómo llegar/g)||[]).length,3);assert.match(h,/Sin partido hoy/);});
check('real free date MAT1 F3 has no map or time',()=>{now=run('DB.mat1.fixture.find(p=>p.condicion==="Libre").fecha_iso')+'T15:00:00Z';const card=html().split('data-day-team="mat1"')[1].split('</article>')[0];assert.match(card,/Fecha libre/);assert.doesNotMatch(card,/Cómo llegar|Horario|Sede:/);});
check('missing fixture is pending, not no game',()=>{run('DATA_ERRORS.i={fixture:true}');const card=html().split('data-day-team="i"')[1].split('</article>')[0];assert.match(card,/pendiente de confirmación/);assert.doesNotMatch(card,/Sin partido hoy|Cómo llegar|data-round=/);});
check('duplicate match is ambiguous',()=>{run('DB.c.fixture.push({...DB.c.fixture.find(p=>p.fecha_id==="F11")})');assert.equal(run('matchdayRows()[0].unavailable'),true);assert.equal(run('matchdayRows()[0].p'),null);});
check('other tournament is excluded',()=>{run('DB.c.fixture.find(p=>p.fecha_id==="F11").torneo="apertura-2026"');assert.equal(run('matchdayRows()[0].p'),null);});
for(const address of ['', 'A confirmar', 'PEDRO MORÁN 2446 / OTRA 123', 'CALLE S/N', 'CALLE 123 | OTRA 456'])check('reject uncertain address '+address,()=>{ctx.address=address;run('Object.values(DIRECTORY).find(c=>c.nombre==="C. S. y D. MORAN").sedes.c.direccion=address');assert.equal(run('matchdayVenue(DB.c.fixture.find(p=>p.fecha_id==="F11"),"c")'),null);assert.doesNotMatch(run('addressLine(DB.c.fixture.find(p=>p.fecha_id==="F11"),"c")'),/google.com/);});
check('missing locality, duplicate club and wrong source are rejected',()=>{for(const mutation of ['Object.values(DIRECTORY).find(c=>c.nombre==="C. S. y D. MORAN").sedes.c.localidad=""','DIRECTORY.duplicate=Object.values(DIRECTORY).find(c=>c.nombre==="C. S. y D. MORAN")','Object.values(DIRECTORY).find(c=>c.nombre==="C. S. y D. MORAN").sedes.c.fuente="https://fefi.com.ar/2025-torneo-anual-baby-futbol/?zona=d&vista=direcciones"']){reset();run(mutation);assert.equal(run('matchdayVenue(DB.c.fixture.find(p=>p.fecha_id==="F11"),"c")'),null);}});
check('changed address cannot reuse a previously verified map',()=>{run('Object.values(DIRECTORY).find(c=>c.nombre==="C. S. y D. MORAN").sedes.c.direccion="OTRA CALLE 123"');assert.equal(run('matchdayVenue(DB.c.fixture.find(p=>p.fecha_id==="F11"),"c").map'),'');assert.match(html(),/Mapa pendiente de verificación/);});
check('four destinations never include origin or personal location',()=>{for(const z of Object.keys(config)){ctx.z=z;const url=new URL(run('matchdayVenue(DB[z].fixture.find(p=>p.fecha_id==="F11"),z).map'));assert.equal(url.origin,'https://www.google.com');assert.deepEqual([...url.searchParams.keys()].sort(),z==='mat4'?['api','query','query_place_id']:['api','query']);if(z==='i'||z==='mat1')assert.equal(url.searchParams.get('query'),'Chivilcoy 1998, Ciudad Autónoma de Buenos Aires, Argentina');if(z==='mat4')assert.equal(url.searchParams.get('query_place_id'),'ChIJJWFaVQ62vJURjjnkzHBEeLA');}});
check('existing address line reuses verified destination for today',()=>{assert.match(run('addressLine(DB.mat4.fixture.find(p=>p.fecha_id==="F11"),"mat4")'),/query_place_id=ChIJJWFaVQ62vJURjjnkzHBEeLA/);});
check('time needs match-specific official provenance',()=>{run('var p=DB.mat4.fixture.find(p=>p.fecha_id==="F11");p.horario="14:30"');assert.equal(run('confirmedMatchTime(p)'),null);run('p.horario_fecha=p.fecha_iso;p.horario_fuente="https://caallboys.com.ar/partido-oficial"');assert.equal(run('confirmedMatchTime(p).time'),'14:30');assert.match(html(),/Horario confirmado/);run('p.horario_fecha="2026-10-16"');assert.equal(run('confirmedMatchTime(p)'),null);run('p.horario_fecha=p.fecha_iso;p.horario="25:90"');assert.equal(run('confirmedMatchTime(p)'),null);});
check('suspended and postponed days never claim they are playing',()=>{run('Object.values(DB).forEach(d=>d.fixture.find(p=>p.fecha_id==="F11").estado="suspendido")');assert.doesNotMatch(html(),/>Hoy jugamos</);assert.match(html(),/Suspendido/);run('DB.c.fixture.find(p=>p.fecha_id==="F11").estado="postergado"');assert.match(html(),/Postergado/);});
check('flyer categories and chronological times are exact for each tira',()=>{
  const expected={c:[['2019','14:15'],['2013','15:00'],['2018','15:40'],['2014','16:30'],['2017','17:20'],['2016','18:10'],['2015','19:00']],i:[['2019','14:15'],['2018','15:00'],['2014','15:40'],['2013','16:30'],['2017','17:20'],['2016','18:10'],['2015','19:00']],mat1:[['2013','08:30'],['2014/15','09:15'],['2016/17','10:00'],['2018/19','10:45'],['2020/21','11:15']]};
  for(const [z,rows] of Object.entries(expected)){ctx.z=z;assert.deepEqual(JSON.parse(JSON.stringify(run('flyerHours(DB[z].fixture.find(p=>p.fecha_id==="F11"),z)'))),rows);}
  assert.equal(run('flyerHours(DB.mat4.fixture.find(p=>p.fecha_id==="F11"),"mat4")'),null);
  assert.equal((html().match(/Horarios del flyer de la jornada · Argentina/g)||[]).length,3);
  assert.match(html(),/2026-10-17T08:30:00-03:00/);
});
check('flyer hours never transfer to other dates, years, opponents or conditions',()=>{
  for(const z of ['c','i','mat1']){ctx.z=z;for(const [field,value] of [['fecha_iso','2026-10-24'],['fecha_iso','2027-10-17'],['fecha_id','F12'],['torneo','apertura-2026'],['local','OTRO LOCAL'],['visitante','OTRO RIVAL'],['condicion','Libre']]){reset();ctx.field=field;ctx.value=value;run('var candidate={...DB[z].fixture.find(p=>p.fecha_id==="F11"),[field]:value}');assert.equal(run('flyerHours(candidate,z)'),null);}
    reset();now='2026-10-18T12:00:00Z';assert.equal(run('flyerHours(DB[z].fixture.find(p=>p.fecha_id==="F11"),z)'),null);now='2026-10-17T12:00:00Z';
  }
});
check('flyer attribution contains no private file IDs, artwork names or service links',()=>{
  assert.doesNotMatch(code,/libfile_|Baby_All_Boys_.*\.png|library-file:|canva\.com|app:\/\/library/i);
  const h=run('matchdayHours(DB.c.fixture.find(p=>p.fecha_id==="F11"),"c")');assert.doesNotMatch(h,/<a|FEFI/);assert.match(h,/flyer de la jornada/);
});
assert.doesNotMatch(code,/navigator\.geolocation|watchPosition|getCurrentPosition/);
console.log(`PASS: ${checks} matchday scenarios; no network, location permission or data mutations.`);
