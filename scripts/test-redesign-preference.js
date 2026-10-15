// No browser, network, accounts or real storage; exercise the preference contract.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),code=fs.readFileSync(path.join(root,'js/redesign.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'data/torneo.json'),'utf8')).tiras;
const key='babyAllBoysFavoriteTira',data=new Map(),nodes=new Map();
let blockedRead=false,blockedWrite=false,writes=0,message='',focused='';
const context=vm.createContext({CONFIG:config,state:{},VIEWS:{inicio:1,fixture:1,resultados:1,tablas:1,ranking:1},URLSearchParams,
 location:{search:'',hash:''},localStorage:{getItem(k){if(blockedRead)throw Error('blocked');return data.get(k)??null},setItem(k,v){if(blockedWrite)throw Error('quota');data.set(k,v);writes++},removeItem(k){if(blockedWrite)throw Error('blocked');data.delete(k);writes++}},
 label:z=>config[z].etiqueta,toast:text=>message=text,$:id=>{if(!nodes.has(id))nodes.set(id,{attrs:{},setAttribute(k,v){this.attrs[k]=v},focus(){focused=id}});return nodes.get(id)}
});
vm.runInContext(code.slice(code.indexOf('function readState('),code.indexOf('function saveURL(')),context);
vm.runInContext(code.slice(code.indexOf('const FAVORITE_KEY='),code.indexOf('// Renders replace controls.')),context);
const json=v=>JSON.parse(JSON.stringify(v));
function open(url=''){const u=new URL(url||'/', 'https://test.invalid');context.location={search:u.search,hash:u.hash};context.readState();return json(context.state)}
function saved(z,cat){data.set(key,JSON.stringify({version:1,z,cat}));}
let checks=0;
for(const [z,cfg] of Object.entries(config)){
 for(const cat of ['general',...cfg.categorias]){
  saved(z,cat);
  for(const view of ['inicio','resultados','tablas']){const s=open('?vista='+view);assert.equal(s.z,z);assert.equal(s.cat,cat);assert.equal(s.view,view);checks++;}
  let s=open('?zona='+z+'&vista=resultados');assert.equal(s.cat,'general','Shared zone without category must mean All');checks++;
  s=open('?zona='+z+'&categoria=general');assert.equal(s.cat,'general');checks++;
  for(const [other,otherCfg] of Object.entries(config)){
   s=open('?zona='+other+'&categoria='+encodeURIComponent(otherCfg.categorias[0]));assert.equal(s.z,other);assert.equal(s.cat,otherCfg.categorias[0]);checks++;
  }
 }
 data.set(key,z);assert.equal(open().z,z);assert.equal(open().cat,'general');assert.equal(data.get(key),z,'Legacy data is not rewritten without a save');checks++;
 saved(z,'does-not-exist');assert.equal(open().cat,'general');checks++;
}
saved('mat1','2014/15');let s=open('?categoria=2013');assert.equal(s.z,'c');assert.equal(s.cat,'2013');
for(const url of ['?zona=invalid','?zona=constructor','?zona=__proto__','?zona=','?categoria=invalid']){s=open(url);assert.equal(s.z,'c');assert.equal(s.cat,'general');checks++;}
assert.equal(open('?zona=d&categoria=2013').z,'c');
s=open('#zona-mat4-resultados');assert.equal(s.z,'mat4');assert.equal(s.cat,'general');assert.equal(s.view,'resultados');
s=open('?modo=insta');assert.equal(s.teamChosen,false);assert.equal(s.cat,'general');
for(const bad of ['{','null','[]','42','"mat1"','{"version":2,"z":"mat1"}','{"version":1,"z":"constructor"}','{"version":1,"z":"gone"}']){data.set(key,bad);s=open();assert.equal(s.z,'c');assert.equal(s.cat,'general');checks++;}
assert.equal(writes,0,'Reading URLs, legacy or corrupt preferences never writes storage');
context.state={z:'mat1',cat:'2014/15'};context.saveFavorite();assert.deepEqual(JSON.parse(data.get(key)),{version:1,z:'mat1',cat:'2014/15'});assert.match(message,/Preferencia guardada/);
assert.equal(nodes.get('#favorite').attrs['aria-pressed'],'true');assert.match(nodes.get('#favorite-summary').textContent,/Los Albos.*2014\/15/);
context.state={z:'c',cat:'general'};context.updateFavoriteControls();assert.equal(nodes.get('#favorite').attrs['aria-pressed'],'false');assert.equal(nodes.get('#favorite-clear').hidden,false);
assert.equal(JSON.parse(data.get(key)).z,'mat1','Browsing a different selection does not overwrite the saved preference');
context.clearFavorite();assert.equal(data.has(key),false);assert.equal(focused,'#favorite');assert.equal(nodes.get('#favorite-clear').hidden,true);
context.state={z:'mat4',cat:'general'};context.saveFavorite();assert.equal(open('?vista=tablas').cat,'general');
blockedWrite=true;context.state={z:'c',cat:'2013'};context.saveFavorite();assert.match(message,/No se pudo guardar/);assert.equal(JSON.parse(data.get(key)).z,'mat4');
context.clearFavorite();assert.match(message,/No se pudo borrar/);assert.equal(data.has(key),true);
blockedRead=true;s=open('?vista=resultados');assert.equal(s.z,'c');assert.equal(s.cat,'general');context.updateFavoriteControls();
s=open('?zona=mat1&categoria=2014%2F15&vista=tablas');assert.equal(s.z,'mat1');assert.equal(s.cat,'2014/15');
console.log(`PASS: ${checks} URL/preference cases plus explicit save, delete, legacy, corruption, read/write failures and accessible controls.`);
