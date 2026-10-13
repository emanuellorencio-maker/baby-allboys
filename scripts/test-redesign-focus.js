// Dependency-free focus regressions for the current redesigned shell.
// No browser, network, notifications, or real submissions are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.BABY_FOCUS_ROOT || path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/redesign.js'), 'utf8');
const helpers = code.slice(code.indexOf('function captureRenderFocus('), code.indexOf('function render(scroll=false)'));
assert.ok(helpers.includes('function restoreRenderFocus('), 'The redesigned shell must restore replaced controls');
let document;
class Element {
  constructor(tag='button', attrs={}, parent=null) {
    this.tagName=tag.toUpperCase(); this.attrs={...attrs}; this.id=attrs.id||'';
    this.parent=parent; this.children=[]; this.isConnected=true;
    this.disabled=false; this.hidden=false; this.inert=false; this.visible=true;
    if(parent)parent.children.push(this);
  }
  getAttributeNames(){return Object.keys(this.attrs)}
  getAttribute(name){return this.attrs[name]??null}
  closest(selector){
    for(let element=this;element;element=element.parent){
      if(selector.split(',').some(part=>part.startsWith('#')?element.id===part.slice(1):part==='[hidden]'?element.hidden:part==='[inert]'?element.inert:part==='[data-round-id]'?element.getAttribute('data-round-id')!==null:false))return element;
    }
    return null;
  }
  querySelectorAll(selector){
    const descendants=this.children.flatMap(child=>[child,...child.querySelectorAll('*')]);
    return descendants.filter(element=>element.isConnected&&(selector==='*'||selector==='[data-round-id]'?selector==='*'||element.getAttribute('data-round-id')!==null:selector==='.fixture[data-round-id]'?element.attrs.class==='fixture'&&element.getAttribute('data-round-id')!==null:selector.split(',').includes(element.tagName.toLowerCase())));
  }
  getClientRects(){return this.visible?[{}]:[]}
  scrollIntoView(options){this.scrollOptions=options}
  focus(options){this.focusOptions=options;document.activeElement=this}
  remove(){this.isConnected=false;for(const child of this.children)child.remove();if(document.activeElement===this)document.activeElement=document.body}
}
function reset(){
  const body=new Element('body');document={body,activeElement:body,
    getElementById(id){return [body,...body.querySelectorAll('*')].find(el=>el.id===id)||null},
    querySelectorAll(selector){return body.querySelectorAll(selector)}};
  for(const id of ['top-nav','mobile-nav','team-nav','main'])new Element('div',{id},body);
  new Element('div',{id:'content'},document.getElementById('main'));
  ctx.document=document;
}
const ctx=vm.createContext({document:null,$:selector=>document.getElementById(selector.slice(1))});
vm.runInContext(helpers,ctx);
const get=id=>document.getElementById(id);
const replace=(element,disabled=false)=>{const parent=element.parent;const attrs=element.attrs;const tag=element.tagName.toLowerCase();element.remove();const next=new Element(tag,attrs,parent);next.disabled=disabled;return next};
const expectFocus=element=>{assert.equal(document.activeElement,element);assert.equal(element.focusOptions.preventScroll,true)};
let checks=0;
function scenario(name,run){reset();run();checks++;console.log('PASS:',name)}

for(const filter of ['todos','proximas','Local','Visitante'])scenario('repeat fixture filter '+filter,()=>{
  let button=new Element('button',{'data-filter':filter},get('content'));button.focus();
  for(let i=0;i<3;i++){const saved=ctx.captureRenderFocus();button=replace(button);ctx.restoreRenderFocus(saved);expectFocus(button)}
});
for(const team of ['c','i','mat1','mat4'])scenario('selected team '+team,()=>{
  const old=new Element('button',{'data-team':team},get('team-nav'));old.focus();
  const saved=ctx.captureRenderFocus(),button=replace(old);ctx.restoreRenderFocus(saved);expectFocus(button);
});
for(const id of ['category-select','round-select','fixture-search'])scenario('replaced control '+id,()=>{
  const old=new Element('select',{id},get('content'));old.focus();
  const saved=ctx.captureRenderFocus(),select=replace(old);ctx.restoreRenderFocus(saved);expectFocus(select);
});
for(const tournament of ['apertura','clausura'])scenario('selected tournament '+tournament,()=>{
  const old=new Element('button',{'data-tournament':tournament},get('content'));old.focus();
  const saved=ctx.captureRenderFocus(),button=replace(old);ctx.restoreRenderFocus(saved);expectFocus(button);
});
scenario('mobile navigation identity is not confused with desktop',()=>{
  new Element('button',{'data-view':'fixture'},get('top-nav')).visible=false;
  const old=new Element('button',{'data-view':'fixture'},get('mobile-nav'));old.focus();
  const saved=ctx.captureRenderFocus(),button=replace(old);ctx.restoreRenderFocus(saved);expectFocus(button);
});
for(const step of ['-1','1'])scenario('date boundary '+step+' returns to date select',()=>{
  const select=new Element('select',{id:'round-select'},get('content'));
  const old=new Element('button',{'data-step':step},get('content'));old.focus();
  const saved=ctx.captureRenderFocus();replace(old,true);ctx.restoreRenderFocus(saved);expectFocus(select);
});
scenario('ordinary next date stays on the next button',()=>{
  const old=new Element('button',{'data-step':'1'},get('content'));old.focus();
  const saved=ctx.captureRenderFocus(),button=replace(old);ctx.restoreRenderFocus(saved);expectFocus(button);
});
scenario('same address repeated on multiple fixture dates remains on the same card',()=>{
  const first=new Element('article',{'data-round-id':'F2',class:'fixture'},get('content'));
  const second=new Element('article',{'data-round-id':'F4',class:'fixture'},get('content'));
  new Element('button',{'data-copy-address':'CHIVILCOY 1998'},first);
  const old=new Element('button',{'data-copy-address':'CHIVILCOY 1998'},second);old.focus();
  const saved=ctx.captureRenderFocus(),button=replace(old);ctx.restoreRenderFocus(saved);expectFocus(button);
});
scenario('clearing an empty search returns to search input',()=>{
  const input=new Element('input',{id:'fixture-search'},get('content'));
  const old=new Element('button',{'data-action':'clear-filters'},get('content'));old.focus();
  const saved=ctx.captureRenderFocus();old.remove();ctx.restoreRenderFocus(saved);expectFocus(input);
});
scenario('removed or ambiguous controls use the content start',()=>{
  const old=new Element('button',{'data-action':'help'},get('content'));old.focus();
  const saved=ctx.captureRenderFocus();old.remove();ctx.restoreRenderFocus(saved);expectFocus(get('main'));
});
scenario('asynchronous refresh does not move focus out of an open dialog',()=>{
  const dialog=new Element('div',{id:'report-modal'},document.body);
  const input=new Element('textarea',{id:'report-comment'},dialog);input.focus();
  assert.equal(ctx.captureRenderFocus(),null);ctx.restoreRenderFocus(null);assert.equal(document.activeElement,input);
});
scenario('focus already moved by a newer UI action is not stolen',()=>{
  const old=new Element('button',{'data-filter':'Local'},get('content'));old.focus();
  const saved=ctx.captureRenderFocus();replace(old);
  const input=new Element('input',{id:'global-search-input'},document.body);input.focus();
  ctx.restoreRenderFocus(saved);assert.equal(document.activeElement,input);
});
scenario('still-connected trigger is left alone',()=>{
  const button=new Element('button',{'data-filter':'Local'},get('content'));button.focus();
  const saved=ctx.captureRenderFocus();ctx.restoreRenderFocus(saved);assert.equal(document.activeElement,button);
});
for(const kind of ['hidden','inert','visible'])scenario('non-interactive replacement '+kind+' is avoided',()=>{
  const old=new Element('button',{'data-filter':'Local'},get('content'));old.focus();
  const saved=ctx.captureRenderFocus(),button=replace(old);button[kind]=kind!=='visible';
  ctx.restoreRenderFocus(saved);expectFocus(get('main'));
});
scenario('global search reaches the matching fixture, with safe fallback',()=>{
  new Element('article',{'data-round-id':'F1',class:'fixture'},get('content'));
  const match=new Element('article',{'data-round-id':'F11',class:'fixture'},get('content'));
  ctx.focusContent('F11',true);expectFocus(match);assert.equal(match.tabIndex,-1);assert.equal(match.scrollOptions.block,'center');
  ctx.focusContent('missing');expectFocus(get('main'));
});
scenario('focused search fixture remains focused after a data refresh',()=>{
  const card=new Element('article',{'data-round-id':'F11',class:'fixture'},get('content'));
  ctx.focusContent('F11');const saved=ctx.captureRenderFocus(),replacement=replace(card);
  ctx.restoreRenderFocus(saved);expectFocus(replacement);assert.equal(replacement.tabIndex,-1);
});
scenario('view change focuses main and preserves URL handling',()=>{
  ctx.state={view:'fixture'};let replaced=false,saved=false;
  ctx.render=()=>{replaced=true};ctx.saveURL=()=>{saved=true};
  vm.runInContext(code.split('\n').find(line=>line.startsWith('function change(')),ctx);
  ctx.change({view:'resultados'});assert.equal(replaced,true);assert.equal(saved,true);expectFocus(get('main'));assert.equal(get('main').scrollOptions.block,'start');
});
scenario('same-view change does not replace the focus restored by render',()=>{
  const button=new Element('button',{'data-filter':'Local'},get('content'));button.focus();
  ctx.state={view:'fixture'};ctx.render=()=>{};ctx.saveURL=()=>{};
  ctx.change({filter:'Local'});assert.equal(document.activeElement,button);
});
assert.match(code,/render=function\(scroll=false\)\{const focused=captureRenderFocus\(\)/);
assert.match(code,/restoreRenderFocus\(focused\)\};/);
assert.match(code,/popstate',\(\)=>\{readState\(\);render\(\);focusContent\(null,true\)\}/);
assert.match(code,/\$\('#global-search'\)\.open=false;focusContent\(u\.view==='fixture'\?u\.round:null,true\)/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const asset=html.match(/src="(js\/redesign.js\?[^\"]+)"/)[1];
assert.ok(sw.includes("'/"+asset+"'"),'The PWA precaches the same script version as the page');
assert.match(asset,/focus-20261013/);
console.log(`PASS: ${checks} focus scenarios, render/history/search wiring and matching PWA asset version. Browser layout and assistive-technology behavior require browser QA.`);
