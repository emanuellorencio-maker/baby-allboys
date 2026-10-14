// No browser, network, credentials or real submissions. Uses repository data.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const source = process.argv.includes('--baseline')
  ? require('node:child_process').execFileSync('git', ['show', 'HEAD:js/redesign.js'], {cwd:root, encoding:'utf8'})
  : fs.readFileSync(path.join(root, 'js/redesign.js'), 'utf8');
let failFixtures = false, failResults = false, metadataVersion = 1;
const ctx = vm.createContext({window:{}, Date, loadJSON:async file => {
  if ((failFixtures && /\/fixture\.json$/.test(file)) || (failResults && file === 'data/c/resultados.json')) throw Error('Simulated download failure');
  const data = JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if (file === 'data/estado-fefi.json') data.testVersion = metadataVersion;
  return data;
}});
vm.runInContext('let DB={},CONFIG={},DIRECTORY={},CRESTS=[],META={},MANUAL={},DATA_ERRORS={},loadedAt=0,state={};const number=()=>{},own=()=>{},status=()=>{},next=()=>{},result=()=>{},sourceUrl=()=>{};', ctx);
vm.runInContext(source.slice(source.indexOf('async function optionalJSON('), source.indexOf('function renderDataErrors(')), ctx);
const snapshot = () => vm.runInContext('({DB,CONFIG,DIRECTORY,CRESTS,META,MANUAL,DATA_ERRORS,loadedAt,baby:window.BABY})',ctx);
(async()=>{
  await ctx.fetchData();
  const before = snapshot();
  assert.deepEqual(Object.keys(before.DB).sort(), ['c','i','mat1','mat4']);
  failFixtures=true; metadataVersion=2;
  await assert.rejects(ctx.fetchData(), /No se pudo cargar ningún fixture/);
  const after=snapshot();
  assert.equal(after.META.testVersion,1,'Do not label old data with new metadata');
  for(const key of Object.keys(before)) assert.equal(after[key],before[key], `Failed refresh must preserve ${key}`);
  failFixtures=false; failResults=true;
  await ctx.fetchData();
  const partial=snapshot();
  assert.equal(partial.META.testVersion,2);
  assert.equal(partial.DATA_ERRORS.c.results,true,'Partial failure remains explicitly flagged');
  for(const zone of ['i','mat1','mat4']) assert.equal(partial.DATA_ERRORS[zone].results,undefined);
  failResults=false;metadataVersion=3;
  await ctx.fetchData();
  const complete=snapshot();
  assert.equal(complete.META.testVersion,3);
  for(const zone of ['c','i','mat1','mat4']) assert.equal(Object.keys(complete.DATA_ERRORS[zone]).length,0);
  console.log('PASS: failed refresh preserves data and metadata; partial failures flagged; recovery covers all four tiras.');
})().catch(error=>{console.error(error);process.exitCode=1});
