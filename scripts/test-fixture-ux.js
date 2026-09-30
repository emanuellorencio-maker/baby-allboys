// Pruebas locales: datos reales y red/portapapeles aislados; no modifica archivos.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const line=name=>html.split('\n').find(l=>l.startsWith('function '+name+'(')||l.startsWith('async function '+name+'('));
const block=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const elements=new Map(),listeners=[];
const element=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,classList:{add(){},remove(){}},querySelectorAll(){return[]},setAttribute(){},hasAttribute(){return false},focus(){this.focused=true},scrollIntoView(){this.scrolled=true}});return elements.get(id)};
const fixtures=read('data/c/fixture.json');
const cards=fixtures.map(p=>({dataset:{condicion:p.condicion},hidden:false}));
const buttons=['todos','Local','Visitante'].map(value=>({dataset:{filtroFixture:value},setAttribute(name,value){this[name]=value}}));
const original={fixture:fixtures,tabla:{sentinel:'tabla'},resultados:{sentinel:'resultados'}};
const ctx=vm.createContext({
 zonaActual:'c',vistaActual:'fixture',cargaActual:0,fechaResultadoActual:null,
 ZONA_CONFIG:Object.fromEntries(Object.entries(read('data/torneo.json').tiras).map(([z,c])=>[z,{...c,nombre:c.etiqueta+' - Zona '+c.zona}])),
 DIRECTORIO_CLUBES:read('data/clubes-direcciones.json'),fixtureData:original.fixture,tablasData:original.tabla,resultadosData:original.resultados,
 document:{getElementById:element,querySelectorAll:selector=>selector.includes('fixture-card')?cards:buttons,createRange:()=>({selectNodeContents(){}})},
 navigator:{clipboard:{writeText:async text=>listeners.push(text)}},window:{getSelection:()=>({removeAllRanges(){},addRange(){}})},
 getManual:async()=>({}),setTimeout:()=>0,matchMedia:()=>({matches:true})
});
for(const name of ['norm','esc','mapsUrl','direccionEquipo','clonarData','aplicarResultadosManual','textoBusquedaBase','marcar','fechaNum','fechaId','construirIndiceBusqueda','datosBusquedaActual'])vm.runInContext(line(name),ctx);
vm.runInContext(block("let filtroFixtureActual='todos';",'function fechaNum('),ctx);
vm.runInContext(block('let busquedaActual=0;','function actualizarBuscador('),ctx);
(async()=>{
 ctx.filtrarFixture('Visitante');
 assert.equal(cards.filter(c=>!c.hidden).length,fixtures.filter(p=>p.condicion==='Visitante').length);
 assert.ok(cards.every(c=>c.hidden===(c.dataset.condicion!=='Visitante')));
 assert.equal(buttons[2]['aria-pressed'],'true');
 ctx.filtrarFixture('Local');assert.ok(cards.every(c=>c.hidden===(c.dataset.condicion!=='Local')));
 ctx.filtrarFixture('todos');assert.ok(cards.every(c=>!c.hidden));
 assert.equal(ctx.direccionEquipo('CLUB ATLETICO SAN TELMO'),'');
 assert.equal(ctx.direccionEquipo('ESTRADA 1'),'TEJEDOR 867 CABA');
 const pendingMap=ctx.renderDireccion('CLUB ATLETICO SAN TELMO');
 assert.match(pendingMap,/confirmar/);assert.doesNotMatch(pendingMap,/href=|data-copy-address/);
 const status={textContent:''};
 const button={dataset:{copyAddress:'TEJEDOR 867 CABA'},closest:()=>({querySelector:s=>s==='.map-copy-status'?status:{}})};
 await ctx.copiarDireccion(button,{stopPropagation(){}});assert.deepEqual(listeners,['TEJEDOR 867 CABA']);assert.equal(status.textContent,'Dirección copiada.');
 ctx.navigator.clipboard.writeText=async()=>{throw Error('Denied')};await ctx.copiarDireccion(button,{stopPropagation(){}});assert.match(status.textContent,/No se pudo copiar/);
 // Una consulta lenta de otra tira nunca reemplaza los datos visibles.
 let finishFixture;
 ctx.getFixtureData=()=>new Promise(resolve=>finishFixture=resolve);
 ctx.getTablasData=async z=>read(`data/${z}/tabla.json`);
 ctx.getResultadosBase=async z=>read(`data/${z}/resultados.json`);
 const loading=ctx.datosBusquedaActual('i');ctx.zonaActual='mat1';finishFixture(read('data/i/fixture.json'));
 const isolated=await loading;assert.equal(isolated.fixture[0].local,read('data/i/fixture.json')[0].local);
 assert.equal(ctx.fixtureData,original.fixture);assert.equal(ctx.tablasData,original.tabla);assert.equal(ctx.resultadosData,original.resultados);
 // Respuestas fuera de orden y limpiar búsqueda invalidan el resultado anterior.
 const jobs=[];ctx.datosBusquedaActual=z=>new Promise(resolve=>jobs.push({z,resolve}));
 ctx.construirIndiceBusqueda=(datos,z)=>[{texto:datos.word,titulo:datos.word,detalle:z,tipo:'Fixture',vista:'fixture',target:'fixture-F1'}];
 ctx.zonaActual='c';element('global-search-input').value='RACING';const first=ctx.buscarGlobal();
 ctx.zonaActual='i';element('global-search-input').value='ANDES';const second=ctx.buscarGlobal();
 jobs[1].resolve({word:'ANDES'});await second;const shown=element('global-search-results').innerHTML;
 jobs[0].resolve({word:'RACING'});await first;assert.equal(element('global-search-results').innerHTML,shown);assert.match(shown,/ANDES/);
 element('global-search-input').value='TREBOL';const late=ctx.buscarGlobal();
 element('global-search-input').value='';await ctx.buscarGlobal();jobs[2].resolve({word:'TREBOL'});await late;assert.equal(element('global-search-results').innerHTML,'');
 // Espera real de carga y foco en la fecha pedida; respeta navegación posterior.
 let finishView;
 ctx.mostrarVista=v=>{ctx.vistaActual=v;ctx.cargaActual++;return new Promise(resolve=>finishView=resolve)};
 const target=element('resultado-F1');const nav=ctx.irResultadoBusqueda({vista:'resultados',target:'resultado-F1'});
 assert.equal(ctx.fechaResultadoActual,'F1');assert.ok(!target.focused);finishView();await nav;assert.ok(target.focused&&target.scrolled);
 target.focused=false;const stale=ctx.irResultadoBusqueda({vista:'resultados',target:'resultado-F1'});ctx.zonaActual='mat4';finishView();await stale;assert.equal(target.focused,false);
 console.log('OK: filtros, direcciones pendientes, copiar/error, búsqueda aislada, respuestas tardías y foco tras carga.');
})().catch(error=>{console.error(error);process.exitCode=1});
