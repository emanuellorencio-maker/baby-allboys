// Offline: inspect generated links only; never open or send to WhatsApp.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = process.argv.includes('--baseline')
  ? require('node:child_process').execFileSync('git', ['show', 'HEAD:js/redesign.js'], {cwd:root, encoding:'utf8'})
  : fs.readFileSync(path.join(root, 'js/redesign.js'), 'utf8');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const ctx = vm.createContext({URLSearchParams, URL});
vm.runInContext(source.slice(0, source.indexOf('function addressLine(')), ctx);
vm.runInContext(source.slice(source.indexOf('function freshnessText('), source.indexOf('function sectionHead(')), ctx);
ctx.config = read('data/torneo.json').tiras;
ctx.meta = read('data/estado-fefi.json');
ctx.data = Object.fromEntries(Object.keys(ctx.config).map(z => [z, {
  fixture:read(`data/${z}/fixture.json`), results:read(`data/${z}/resultados.json`)
}]));
vm.runInContext('CONFIG=config;META=meta;DB=data;state.view="resultados";',ctx);
const run = code => vm.runInContext(code, ctx);
const text = () => new URL(run('share(p,true)')).searchParams.get('text');
run('var p=DB.c.fixture.find(p=>p.fecha_id==="F10");');
assert.equal(run('status(p)'), 'Preliminar');
assert.match(text(), /Resultado preliminar.*FEFI: Previo/i, 'A/F10 must retain the visible preliminary warning in its share link');
// Render the actual results link, with no browser or external navigation.
vm.runInContext(source.split(/\r?\n/).filter(line => /^function (results|rawScore|categorySelector|sectionHead|sourceNote|contextualSourceUrl)\(/.test(line)).join('\n'),ctx);
ctx.navigator={onLine:true};
run('state.round="F10";');
const html=run('results()');
assert.match(html,/Resultado preliminar/);
const renderedLink=html.match(/href="([^"]+)"[^>]*>Compartir resultados/)[1].replaceAll('&amp;','&');
assert.equal(new URL(renderedLink).searchParams.get('text'),text());
let scenarios = 1;
for (const z of Object.keys(ctx.config)) {
  ctx.zone = z;
  run('state.z=zone;p=DB[zone].fixture.find(p=>p.condicion!=="Libre");var r={local:p.local,visitante:p.visitante,resultados:{"2013":{local:0,visitante:2}},estado:"Previo"};DB[zone].results.general[p.fecha_id]=[r];');
  for (const estado of ['Previo','PREVIO','Verificado','Definitivo',undefined]) {
    ctx.testEstado = estado;
    run('r.estado=testEstado;');
    const message = text();
    assert.equal(/Resultado preliminar/i.test(message), /previo/i.test(estado));
    if (estado) assert.ok(message.includes(`FEFI: ${estado}`));
    assert.ok(message.includes(run('freshnessText()')), 'Keep the consultation date');
    assert.match(message, /2013: 0 – 2/, 'Zero is a real score');
    assert.ok(message.includes(ctx.config[z].etiqueta));
    const link = new URL(message.split('\n').at(-1));
    assert.equal(link.searchParams.get('zona'), z);
    assert.equal(link.searchParams.get('fecha'), run('p.fecha_id'));
    scenarios++;
  }
  for (const special of ['GP','NP','Suspendido','Postergado','Libre']) {
    ctx.special = special;
    run('r.resultados={"2013":{local:special,visitante:0},"2014":{local:null,visitante:undefined},"2015":{local:0,visitante:0}};');
    assert.ok(text().includes(`2013 (estado FEFI): Local ${special}; Visitante 0`));
    assert.match(text(), /2014: — – —/);
    assert.match(text(), /2015: 0 – 0/);
    scenarios++;
  }
  run('r._manual=true;r.estado="Previo";');
  assert.match(text(), /Carga manual del club; no equivale a verificación FEFI/);
  assert.match(text(), /Resultado preliminar/);
  for (const estado of ['suspendido','postergado']) {
    ctx.fixtureEstado=estado;run('p.estado=fixtureEstado;');
    assert.ok(text().toLowerCase().includes(`estado de jornada: ${estado}`));
  }
  run('p.condicion="Libre";state.cat="2013";');
  assert.match(text(), /Fecha libre/);
  assert.match(text(), /Estado de jornada: Libre/);
  assert.match(text(), /categoria=2013/);
  assert.doesNotMatch(new URL(run('share(p)')).searchParams.get('text'), /Resultado preliminar|Fuente FEFI consultada/);
  scenarios+=4;
}
console.log(`PASS: ${scenarios} share scenarios; four tiras, preliminary/final, manual, special states, zero/missing scores, dates and deep links.`);
