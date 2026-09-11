// Prueba aislada: datos reales locales y respuestas demoradas, sin red ni escrituras.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = html.slice(html.indexOf('// Estado exclusivo de TABLAS:'), html.indexOf('function renderTablas(){'));
const read = name => JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const elements = new Map();
const element = key => {if(!elements.has(key))elements.set(key,{innerHTML:'',classList:{toggle(){}},setAttribute(){}});return elements.get(key)};
const pending = [], renders = [];
const original = {torneo:'clausura-2026',sentinel:true};
const context = vm.createContext({
  ZONA_CONFIG:read('data/torneo.json').tiras, zonaActual:'c', vistaActual:'tablas', cargaActual:0,
  tablasData:original, tablaSeleccionadaActual:'general',
  document:{getElementById:element,querySelector:element},esc:String,skeleton:()=>'',
  getJSON: url=>new Promise(resolve=>pending.push(()=>resolve(read(url)))),
  getTablasData: z=>read(`data/${z}/tabla.json`),
  renderTablas:()=>renders.push(vm.runInContext('tablasVistaData.torneo',context)),
});
vm.runInContext(source+`
function esCargaVigente(z,id){return z===zonaActual&&id===cargaActual}
function cargarVistaActual(){return cargarTablas(zonaActual,++cargaActual)}
`,context);
(async()=>{
  assert.equal(vm.runInContext('torneoTablasActual',context),'clausura');
  await vm.runInContext('cargarVistaActual()',context);
  const slow = vm.runInContext("torneoTablasActual='apertura';cargarVistaActual()",context);
  await vm.runInContext("torneoTablasActual='clausura';cargarVistaActual()",context);
  pending.shift()(); await slow;
  assert.equal(renders.at(-1),'clausura-2026');
  assert.equal(context.tablasData,original);
  await vm.runInContext("torneoTablasActual='apertura';cargarVistaActual()",context);
  assert.equal(renders.at(-1),'apertura-2026');
  for(const z of ['i','mat1','mat4']){
    context.zonaActual=z;
    const load=vm.runInContext('cargarVistaActual()',context);
    pending.shift()(); await load;
    assert.equal(vm.runInContext('tablasVistaData.general.length',context),16);
    assert.equal(context.tablasData,original);
  }
  const previous = vm.runInContext("zonaActual='i';torneoTablasActual='clausura';cargarVistaActual()",context);
  await vm.runInContext("zonaActual='c';torneoTablasActual='apertura';cargarVistaActual()",context);
  await previous;
  assert.equal(vm.runInContext('tablasVistaData.zona',context),'C');
  assert.match(elements.get('tablas-contexto').innerHTML,/Apertura 2026.*Zona C/);
  assert.equal(context.tablasData,original);
  console.log('OK: default Clausura, cuatro tiras, caché separada y respuestas tardías descartadas.');
})().catch(error=>{console.error(error);process.exitCode=1});
