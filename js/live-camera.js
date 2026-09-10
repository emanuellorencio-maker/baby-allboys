(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BabyCamera=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DEFAULT_URL='https://www.youtube.com/live/6Yh-ufpaJR4';
  function normalizeUrl(value){
    try {
      const u=new URL(value);
      if(u.protocol!=='https:'||u.username||u.password)return '';
      const host=u.hostname.toLowerCase();
      let id='';
      if(['youtube.com','www.youtube.com','m.youtube.com'].includes(host))id=u.pathname==='/watch'?u.searchParams.get('v'):(u.pathname.match(/^\/live\/([\w-]{11})\/?$/)||[])[1];
      else if(host==='youtu.be')id=u.pathname.slice(1);
      return /^[\w-]{11}$/.test(id||'')?'https://www.youtube.com/watch?v='+id:'';
    }catch{return ''}
  }
  function link(live,now=Date.now()){
    const age=now-Date.parse(live?.updated_at);
    return live?.activo===true&&live?.camara_activa===true&&live?.condicion==='Local'&&age>=0&&age<12*60*60*1000?normalizeUrl(live.camara_url):'';
  }
  return {DEFAULT_URL,normalizeUrl,link};
});
