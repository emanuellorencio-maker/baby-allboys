// Prueba aislada del handler: ninguna petición sale a GitHub ni Google Sheets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
Object.assign(process.env, {ADMIN_TOKEN:'unit-test', GITHUB_TOKEN:'unit-test', GITHUB_OWNER:'test', GITHUB_REPO:'test', GITHUB_BRANCH:'main'});
const writes=[];
global.fetch=async (url,options)=>{
  const file=new URL(url).pathname.split('/contents/')[1];
  if(options.method==='PUT'){
    const body=JSON.parse(options.body);
    writes.push({file,data:JSON.parse(Buffer.from(body.content,'base64').toString())});
    return {ok:true,status:200,json:async()=>({commit:{sha:'test-only'}})};
  }
  const data=read(file);
  return {ok:true,status:200,json:async()=>({content:Buffer.from(JSON.stringify(data)).toString('base64'),sha:'test-only'})};
};
const handler=require('../api/guardar-resultados');
async function send(body){
  let result;
  const res={status(code){this.code=code;return this},json(value){result={code:this.code,...value}},setHeader(){}};
  await handler({method:'POST',body},res);
  return result;
}
(async()=>{
  const fx=read('data/c/fixture.json')[5];
  const request={token:'unit-test',zona:'c',fecha_id:fx.fecha_id,partido:{...fx,resultados:{'2019':{local:'0',visitante:'0'}}}};
  assert.equal((await send({...request,token:'incorrecto'})).code,401);
  assert.equal(writes.length,0);
  assert.equal((await send({...request,partido:{...request.partido,local:'CLUB ANTERIOR'}})).code,409);
  assert.equal(writes.length,0);
  const result=await send(request);
  assert.equal(result.code,200);
  assert.equal(writes.length,2);
  const saved=writes[0].data.general[fx.fecha_id][0];
  assert.equal(saved.torneo,'clausura-2026');
  assert.equal(saved._manual,true);
  assert.equal(saved.fecha,fx.fecha);
  assert.equal(saved.resultados['2019'].local,'0');
  assert.equal(result.sheet.updated,0);
  console.log('OK: autenticación, rechazo de fixture viejo y guardado Clausura aislado.');
})().catch(error=>{console.error(error);process.exitCode=1});
