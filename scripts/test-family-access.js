// Local checks only: no browser, network, storage or real form submissions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html'), css = read('css/familias.css'), js = read('js/app-enhancements.js');
const baselineRoot = process.env.BABY_BASELINE_DIR;
const inline = text => [...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m => !/\bsrc=/.test(m[1])).map(m => m[2]);
if (baselineRoot) assert.deepEqual(inline(html), inline(fs.readFileSync(path.join(baselineRoot, 'index.html'), 'utf8')), 'All tournament, zone, news and fixture application logic remains byte-identical');
for (const [i, code] of inline(html).entries()) if (!code.trim().startsWith('{')) new vm.Script(code, {filename:`inline-${i}`});
new vm.Script(js);
const between = (text, a, b) => text.slice(text.indexOf(a),text.indexOf(b,text.indexOf(a)));
if (baselineRoot) assert.equal(between(js, '  async function submitReport(', '  function numeric('), between(fs.readFileSync(path.join(baselineRoot, 'js/app-enhancements.js'), 'utf8'), '  async function submitReport(', '  function numeric('), 'Report destination, payload and explicit submission handler unchanged');
const family = between(html, '  <section class="familias-club"', '    <div id="noticias-allboys"');
const links = [...family.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/g)];
assert.equal(links.length,4);
for(const [,attrs,contents] of links) {
 const url = new URL(attrs.match(/href="([^"]+)"/)[1]);
 assert.equal(url.protocol,'https:'); assert.equal(url.hostname,'caallboys.com.ar');
 assert.match(attrs,/rel="noopener noreferrer"/); assert.match(contents,/Se abre en otra pestaña/);
}
assert.doesNotMatch(family,/localhost|\b202[012]2?\b|\b\d{1,2}:\d{2}\b|<form|<input/);
assert.ok(family.includes('reglamento-de-convivencia-y-disciplina'));
assert.match(html,/id="botones-zona" role="group" aria-label="Elegir tira"/);
assert.match(html,/id="botones-vista" role="group"/);
assert.match(html,/css\/familias.css\?v=family-access-20261012/);
assert.match(html,/js\/app-enhancements.js\?v=family-access-20261012/);
for (const m of css.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
 const h=m[1].length===3?[...m[1]].map(c=>c+c).join(''):m[1];
 assert.equal(h.slice(0,2),h.slice(2,4)); assert.equal(h.slice(2,4),h.slice(4,6));
}
assert.match(css,/\.familias-ui #botones-vista \.vista-btn\{min-height:44px!important/);
assert.match(css,/body\.modo-insta \.familias-club\{display:none!important/);
assert.match(css,/\.familias-ui \.share-wa span,\.familias-ui \.share-wa i\{color:#c2c2c2!important/);
assert.match(css,/@media\(max-width:360px\)/);
assert.match(css,/\.familias-ui \.report-modal\{z-index:100100;/);
assert.match(css,/font-size:16px;min-height:44px/);
assert.doesNotMatch(css,/filter:grayscale|mix-blend-mode/);
const document = {activeElement:null};
const nodes = new Map();
function node(id) {
 const classes = new Set(), attrs = new Map();
 return {id,isConnected:true,textContent:'',listeners:{},
 classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
 setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k),
 addEventListener(k,fn){this.listeners[k]=fn}, focus(){document.activeElement=this},
 querySelector(){return nodes.get('heading')},
 querySelectorAll(){return ['report-type','report-comment','report-contact','report-cancel','report-submit'].map(id=>nodes.get(id))}
 };
}
document.getElementById = id => nodes.get(id) || null;
document.createElement = () => node('');
const background = [{inert:false},{inert:true}];
document.body = {children:background,style:{overflow:'auto'},appendChild(modal){
 this.children.push(modal);
 nodes.set(modal.id,modal);
 for(const id of ['heading','report-type','report-comment','report-contact','report-cancel','report-submit','report-status','report-form'])nodes.set(id,node(id));
}};
const ctx=vm.createContext({document,REPORT_TYPES:['Fixture incorrecto'],submitReport(){throw new Error('Submission must never happen in these UI tests')}});
vm.runInContext(between(js,'  let reportReturnFocus = null;', '  async function submitReport('),ctx);
const trigger=node('trigger');trigger.focus();
ctx.openReportModal();
const modal=nodes.get('report-modal');
assert.equal(modal.getAttribute('role'),'dialog');
assert.equal(modal.getAttribute('aria-modal'),'true');
assert.equal(modal.getAttribute('aria-hidden'),'false');
assert.equal(modal.getAttribute('aria-labelledby'),'report-title');
assert.equal(nodes.get('heading').id,'report-title');
assert.equal(nodes.get('report-status').getAttribute('role'),'status');
assert.equal(document.activeElement.id,'report-comment');
assert.ok(background.slice(0,2).every(element=>element.inert));
assert.equal(document.body.style.overflow,'hidden');
const key = (key,shiftKey=false) => {let prevented=false;modal.listeners.keydown({key,shiftKey,preventDefault(){prevented=true}});return prevented};
nodes.get('report-submit').focus();assert.equal(key('Tab'),true);assert.equal(document.activeElement.id,'report-type');
assert.equal(key('Tab',true),true);assert.equal(document.activeElement.id,'report-submit');
nodes.get('report-comment').focus();assert.equal(key('Tab'),false);
ctx.openReportModal(); // repeated opening must not replace the original return target
assert.equal(key('Escape'),true);assert.equal(modal.getAttribute('aria-hidden'),'true');assert.equal(document.activeElement,trigger);
ctx.closeReportModal();assert.equal(document.activeElement,trigger); // idempotent close
assert.equal(background[0].inert,false);assert.equal(background[1].inert,true);
assert.equal(document.body.style.overflow,'auto');
trigger.focus();ctx.openReportModal();nodes.get('report-cancel').listeners.click();assert.equal(document.activeElement,trigger);
ctx.openReportModal();modal.listeners.click({target:nodes.get('report-comment')});assert.equal(modal.classList.contains('abierto'),true);
modal.listeners.click({target:modal});assert.equal(modal.classList.contains('abierto'),false);assert.equal(document.activeElement,trigger);
ctx.openReportModal();trigger.isConnected=false;ctx.closeReportModal(); // detached return target must be safe
assert.equal(modal.getAttribute('aria-hidden'),'true');
console.log('PASS: verified family links, monochrome family styles, 44px targets, dialog semantics, inert/scroll restoration, focus loop, Escape, Cancel, backdrop and repeated open/close. Browser rendering not covered.');

if (baselineRoot) console.log('PASS: all inline application code and report submission handler are byte-identical to the checked baseline.');
