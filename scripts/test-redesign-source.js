// Offline regression: inspect contextual official links, without opening them.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const source=process.argv.includes('--baseline')
  ? require('node:child_process').execFileSync('git',['show','HEAD:js/redesign.js'],{cwd:root,encoding:'utf8'})
  : fs.readFileSync(path.join(root,'js/redesign.js'),'utf8');
const context=vm.createContext({state:{},URL});
vm.runInContext(source.split(/\r?\n/).filter(line=>line.startsWith('const sourceUrl=')||line.startsWith('function contextualSourceUrl(')).join('\n'),context);
let checks=0;
for(const [zone,slug] of Object.entries({c:'d',i:'i',mat1:'1',mat4:'4'})){
  for(const tournament of ['clausura','apertura']){
    for(const view of ['fixture','resultados','tablas','inicio','ranking']){
      context.state={z:zone,tournament,view};
      const url=new URL(context.contextualSourceUrl());
      const expectedView=view==='fixture'?'fixture-clausura':view==='tablas'?'tablas-'+tournament:'fechas-clausura';
      assert.equal(url.origin,'https://fefi.com.ar');
      assert.equal(url.pathname,'/2026-torneo-anual-baby-futbol/');
      assert.equal(url.searchParams.get('vista'),expectedView,`${zone}/${tournament}/${view}`);
      assert.equal(url.searchParams.get('zona'),zone==='c'&&tournament==='apertura'&&view==='tablas'?'c':slug);
      checks++;
    }
  }
}
assert.match(source,/function sourceNote\(\)[\s\S]*?contextualSourceUrl\(\)/);
assert.match(source,/\$\('#source-info'\)\.innerHTML=[^\n]*contextualSourceUrl\(\)/);
console.log(`PASS: ${checks} zone/tournament/view combinations; 2026 selector, correct fixture/results/table destination and both contextual link consumers.`);
