const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('css/familias.css'),html=read('index.html');
const added=css.slice(css.indexOf('/* Crests:'));
assert.ok(added.includes('background:transparent!important'));
assert.ok(added.includes('object-fit:contain!important'));
assert.ok(added.includes('overflow:visible'));
assert.ok(added.includes('minmax(0,1fr)'));
assert.ok(added.includes('filter:none!important'));
assert.ok(!/mix-blend-mode|clip-path|object-fit:cover/.test(added));
assert.ok(added.includes('img[src="assets/escudos/juventud-de-liniers.png"]'));
assert.ok(!added.includes('argentinos-juniors'));
assert.ok(html.includes('css/familias.css?v=family-access-20261012'));
for(const size of [70,62,60])assert.ok(Math.sqrt(2)*(size-22)<=size,'image rectangle fits circular disk');
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/\bsrc=/.test(match[1])&&!/application\/ld\+json/.test(match[1]))new vm.Script(match[2]);
for(const e of JSON.parse(read('data/clubes-escudos.json'))){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,e.archivo))).digest('hex'),e.sha256,e.archivo);}
console.log('PASS: CSS safety, circular containment dimensions, inline JS syntax, all source checksums. Browser rendering not covered.');
