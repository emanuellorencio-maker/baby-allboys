const TOTAL_STICKERS = 980;
const STORAGE_KEY = 'baby_allboys_world_exchange_v1';
const ACTIVE_KEY = 'baby_allboys_world_active_profile';
const CATEGORIES = ['2013','2014','2015','2016','2017','2018','2019','2020','2021','2022'];
const TEAMS = ['All Boys A - Zona C','All Boys B - Zona I','Los Albos - MAT1','All Boys - MAT4','Familiar / Invitado'];
const BLOCKS = [[1,100],[101,200],[201,300],[301,400],[401,500],[501,600],[601,700],[701,800],[801,900],[901,980]];
const ADMIN_KEY = 'allboys2026';

let state = loadDemoState();
let activeId = localStorage.getItem(ACTIVE_KEY) || '';
let currentFilter = 'all';
let currentBlock = 0;
let currentRanking = 'advanced';
let dataMode = 'demo';
let albumDirty = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function loadDemoState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(saved?.profiles?.length) return saved;
  }catch(error){}
  const demo = { profiles: seedProfiles() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  return demo;
}

function saveDemoState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function hashPin(pin, salt){
  const raw = `${salt}:${pin}`;
  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
}

function makeAlbum(owned=[], duplicates=[]){
  const album = {};
  owned.forEach(n => album[n] = 'owned');
  duplicates.forEach(n => album[n] = 'duplicate');
  return album;
}

function seedProfiles(){
  return [
    {id:'demo-mateo',nickname:'Mateo',category:'2015',team:'All Boys A - Zona C',pinHash:'demo',salt:'demo',isActive:true,createdAt:Date.now()-90000,updatedAt:Date.now()-1000,album:makeAlbum(range(1,420),[7,12,33,48,51,90,104,141,202,318,360])},
    {id:'demo-leon',nickname:'Leon',category:'2016',team:'All Boys B - Zona I',pinHash:'demo',salt:'demo',isActive:true,createdAt:Date.now()-80000,updatedAt:Date.now()-2000,album:makeAlbum(range(1,388),[3,10,20,35,77,120,222,333,410,509])},
    {id:'demo-thiago',nickname:'Thiago',category:'2014',team:'Los Albos - MAT1',pinHash:'demo',salt:'demo',isActive:true,createdAt:Date.now()-70000,updatedAt:Date.now()-3000,album:makeAlbum(range(50,360),[1,2,4,5,7,33,51,88,104,500,777])}
  ];
}

function range(a,b){
  const out = [];
  for(let i=a;i<=b;i++) out.push(i);
  return out;
}

function activeProfile(){
  return state.profiles.find(p => p.id === activeId && p.isActive !== false) || null;
}

function profileStats(profile){
  const values = Object.values(profile?.album || {});
  const owned = values.filter(v => v === 'owned' || v === 'duplicate').length;
  const duplicates = values.filter(v => v === 'duplicate').length;
  return { owned, duplicates, missing: TOTAL_STICKERS - owned, percent: Math.round((owned / TOTAL_STICKERS) * 100) };
}

async function apiGet(path){
  const response = await fetch(path, { cache: 'no-store' });
  if(!response.ok) throw new Error('api');
  return response.json();
}

async function apiPost(path, body){
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if(!response.ok || data.ok === false) throw new Error(data.error || 'api');
  return data;
}

function setDataMode(mode){
  dataMode = mode === 'real' ? 'real' : 'demo';
  $('#demo-banner')?.classList.toggle('hidden', dataMode === 'real');
}

async function initDataMode(){
  try{
    const data = await apiGet('/api/intercambio/perfiles');
    if(data.mode === 'real'){
      state = { profiles: Array.isArray(data.profiles) ? data.profiles : [] };
      if(activeId && !activeProfile()) activeId = '';
      setDataMode('real');
      renderLoginOptions();
      renderAlbum();
      return;
    }
  }catch(error){}
  setDataMode('demo');
  renderLoginOptions();
  renderAlbum();
}

function initOptions(){
  const categoryOptions = CATEGORIES.map(c => `<option>${c}</option>`).join('');
  const teamOptions = TEAMS.map(t => `<option>${t}</option>`).join('');
  $('#new-category').innerHTML = categoryOptions;
  $('#new-team').innerHTML = teamOptions;
  $('#login-category').innerHTML = categoryOptions;
  $('#login-team').innerHTML = teamOptions;
}

function showScreen(name){
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(`#screen-${name}`)?.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(name === 'album') renderAlbum();
  if(name === 'matches') renderMatches();
  if(name === 'ranking') renderRanking();
  if(name === 'login') renderLoginOptions();
  document.body.classList.toggle('is-admin-view', name === 'admin');
}

function wireNavigation(){
  $$('[data-go]').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.go)));
}

function renderLoginOptions(){
  const profile = activeProfile();
  if(profile){
    $('#login-nickname').value = profile.nickname || '';
    $('#login-category').value = profile.category || CATEGORIES[0];
    $('#login-team').value = profile.team || TEAMS[0];
  }
}

async function createProfile(event){
  event.preventDefault();
  const nickname = $('#new-nickname').value.trim().replace(/\s+/g,' ');
  const category = $('#new-category').value;
  const team = $('#new-team').value;
  const pin = $('#new-pin').value.trim();
  if(!/^[0-9]{4}$/.test(pin)) return setStatus('#create-status','El PIN tiene que tener 4 digitos.');
  if(!nickname || nickname.length < 2) return setStatus('#create-status','Usa un apodo corto para identificar el album.');

  try{
    let profile;
    if(dataMode === 'real'){
      const data = await apiPost('/api/intercambio/perfiles', { nickname, category, team, pin });
      profile = data.profile;
      state.profiles.unshift(profile);
    }else{
      const salt = crypto.randomUUID();
      profile = { id: crypto.randomUUID(), nickname, category, team, pinHash: await hashPin(pin, salt), salt, isActive: true, createdAt: Date.now(), updatedAt: Date.now(), album: {} };
      state.profiles.push(profile);
      saveDemoState();
    }
    activeId = profile.id;
    localStorage.setItem(ACTIVE_KEY, activeId);
    albumDirty = false;
    setStatus('#create-status','Guardado correctamente.');
    burstConfetti();
    showScreen('album');
  }catch(error){
    setStatus('#create-status', error.message || 'No se pudo guardar, proba de nuevo.');
  }
}

async function loginProfile(event){
  event.preventDefault();
  const nickname = $('#login-nickname').value.trim().replace(/\s+/g,' ');
  const category = $('#login-category').value;
  const team = $('#login-team').value;
  const pin = $('#login-pin').value.trim();
  if(!nickname || !/^[0-9]{4}$/.test(pin)) return setStatus('#login-status','Perfil no encontrado.');

  try{
    let profile;
    if(dataMode === 'real'){
      const data = await apiPost('/api/intercambio/login', { nickname, category, team, pin });
      profile = data.profile;
      upsertProfile(profile);
    }else{
      profile = state.profiles.find(p => p.nickname.toLowerCase() === nickname.toLowerCase() && p.category === category && p.team === team && p.isActive !== false);
      if(!profile) return setStatus('#login-status','Perfil no encontrado.');
      const ok = profile.pinHash === 'demo' || profile.pinHash === await hashPin(pin, profile.salt);
      if(!ok) return setStatus('#login-status','PIN incorrecto.');
    }
    activeId = profile.id;
    localStorage.setItem(ACTIVE_KEY, activeId);
    albumDirty = false;
    setStatus('#login-status','Guardado correctamente.');
    showScreen('album');
  }catch(error){
    setStatus('#login-status', error.message || 'No se pudo entrar, proba de nuevo.');
  }
}

function upsertProfile(profile){
  const index = state.profiles.findIndex(p => p.id === profile.id);
  if(index >= 0) state.profiles[index] = profile;
  else state.profiles.unshift(profile);
}

function renderAlbum(){
  const profile = activeProfile();
  $('#album-profile-button').textContent = profile ? 'Cambiar perfil' : 'Crear perfil';
  $('#album-profile-button').dataset.go = profile ? 'login' : 'profile';
  if(!profile){
    $('#album-title').textContent = 'Todavia no cargaste tu album.';
    $('#album-subtitle').textContent = 'Crea o entra a un perfil para empezar.';
  }else{
    $('#album-title').textContent = `${profile.nickname} - Cat. ${profile.category}`;
    $('#album-subtitle').textContent = `${profile.team}${albumDirty ? ' - cambios sin guardar' : ''}`;
  }
  renderProgress(profile);
  renderBlocks();
  renderStickers(profile);
}

function renderProgress(profile){
  const stats = profileStats(profile || {album:{}});
  $('#stat-owned').textContent = stats.owned;
  $('#stat-missing').textContent = stats.missing;
  $('#stat-duplicates').textContent = stats.duplicates;
  $('#progress-donut').style.setProperty('--p', stats.percent);
  $('#progress-donut span').textContent = `${stats.percent}%`;
  $('#progress-bar').style.width = `${stats.percent}%`;
  $('#progress-title').textContent = `Tenes ${stats.owned} / ${TOTAL_STICKERS}`;
  let message = 'Ya arrancaste el album.';
  if(stats.owned < 100) message = 'Te falta poco para completar 100 figus.';
  if(stats.duplicates >= 5) message = 'Tenes varias repetidas para cambiar.';
  if(stats.duplicates >= 1 && stats.missing >= 1) message = 'Buenisimo, ya podes encontrar cambios.';
  $('#progress-message').textContent = message;
}

function renderBlocks(){
  $('#block-row').innerHTML = BLOCKS.map(([a,b], index) => `<button class="${index === currentBlock ? 'active' : ''}" data-block="${index}">${a}-${b}</button>`).join('');
  $$('#block-row button').forEach(btn => btn.addEventListener('click', () => {
    currentBlock = Number(btn.dataset.block);
    $('#search-number').value = '';
    renderAlbum();
  }));
}

function renderStickers(profile){
  const rawSearch = $('#search-number').value.trim();
  const search = Number(rawSearch);
  const [start,end] = BLOCKS[currentBlock];
  if(rawSearch && (!Number.isInteger(search) || search < 1 || search > TOTAL_STICKERS)){
    $('#stickers-grid').innerHTML = `<div class="panel status">Busca un numero entre 1 y ${TOTAL_STICKERS}.</div>`;
    return;
  }
  const numbers = rawSearch ? [search] : range(start,end);
  const album = profile?.album || {};
  const filtered = numbers.filter(n => currentFilter === 'all' || (album[n] || 'missing') === currentFilter);
  if(!filtered.length){
    $('#stickers-grid').innerHTML = '<div class="panel status">No hay figuritas para ese filtro.</div>';
    return;
  }
  $('#stickers-grid').innerHTML = filtered.map(n => {
    const status = album[n] || 'missing';
    const label = status === 'duplicate' ? 'Repetida' : status === 'owned' ? 'Tengo' : 'Falta';
    return `<button class="sticker ${status}" data-number="${n}" aria-label="Figurita ${n}, estado ${label}. Tocar para cambiar"><strong>${n}</strong><span>${label}</span></button>`;
  }).join('');
  $$('.sticker').forEach(btn => btn.addEventListener('click', () => cycleSticker(Number(btn.dataset.number))));
}

function markDirty(){
  albumDirty = true;
  renderAlbum();
}

function cycleSticker(number){
  const profile = activeProfile();
  if(!profile) return showScreen('profile');
  const current = profile.album[number] || 'missing';
  const next = current === 'missing' ? 'owned' : current === 'owned' ? 'duplicate' : 'missing';
  if(next === 'missing') delete profile.album[number];
  else profile.album[number] = next;
  profile.updatedAt = Date.now();
  if(dataMode === 'demo') saveDemoState();
  markDirty();
}

function parseQuickInput(){
  const text = $('#quick-input').value.trim();
  if(!text) return {numbers:[],errors:['Escribi algunos numeros para cargar.']};
  const errors = [];
  const numbers = [];
  text.split(',').map(x => x.trim()).filter(Boolean).forEach(item => {
    const match = item.match(/^(\d{1,3})(?:x(\d+))?$/i);
    if(!match){ errors.push(`No entendimos "${item}".`); return; }
    const number = Number(match[1]);
    if(number < 1 || number > TOTAL_STICKERS){ errors.push(`${number} esta fuera del 1 al ${TOTAL_STICKERS}.`); return; }
    numbers.push({number, quantity:Number(match[2] || 1)});
  });
  return {numbers, errors};
}

async function applyQuick(mode){
  const profile = activeProfile();
  if(!profile) return showScreen('profile');
  const parsed = parseQuickInput();
  if(parsed.errors.length) return setStatus('#quick-status', parsed.errors.join(' '));
  parsed.numbers.forEach(item => {
    profile.album[item.number] = mode === 'duplicate' || item.quantity > 1 ? 'duplicate' : 'owned';
  });
  profile.updatedAt = Date.now();
  if(dataMode === 'demo') saveDemoState();
  albumDirty = true;
  await persistAlbum('Guardado correctamente.');
  renderAlbum();
}

async function clearSelection(){
  const profile = activeProfile();
  if(!profile) return showScreen('profile');
  const parsed = parseQuickInput();
  if(parsed.errors.length) return setStatus('#quick-status', parsed.errors.join(' '));
  parsed.numbers.forEach(item => delete profile.album[item.number]);
  profile.updatedAt = Date.now();
  if(dataMode === 'demo') saveDemoState();
  albumDirty = true;
  await persistAlbum('Seleccion limpiada.');
  renderAlbum();
}

async function persistAlbum(message='Guardado correctamente.'){
  const profile = activeProfile();
  if(!profile) return showScreen('profile');
  try{
    if(dataMode === 'real'){
      await apiPost('/api/intercambio/figus', { profileId: profile.id, album: profile.album || {} });
    }else{
      saveDemoState();
    }
    albumDirty = false;
    setStatus('#quick-status', message);
    burstConfetti();
  }catch(error){
    setStatus('#quick-status', error.message || 'No se pudo guardar, proba de nuevo.');
  }
}

function profileSets(profile){
  const missing = [];
  const duplicates = [];
  for(let n=1;n<=TOTAL_STICKERS;n++){
    const s = profile.album?.[n] || 'missing';
    if(s === 'missing') missing.push(n);
    if(s === 'duplicate') duplicates.push(n);
  }
  return {missing, duplicates};
}

function calculateLocalMatches(){
  const me = activeProfile();
  if(!me) return [];
  const mine = profileSets(me);
  return state.profiles.filter(p => p.id !== me.id && p.isActive !== false).map(other => {
    const their = profileSets(other);
    const givesMe = their.duplicates.filter(n => mine.missing.includes(n));
    const iGive = mine.duplicates.filter(n => their.missing.includes(n));
    const ideal = givesMe.length > 0 && iGive.length > 0;
    const type = ideal ? 'Cambio ideal' : givesMe.length ? 'Me sirve' : iGive.length ? 'Yo le sirvo' : '';
    const explain = ideal ? 'Cambio redondo: a los dos les sirve.' : givesMe.length ? 'Te puede ayudar con figuritas que te faltan.' : 'Vos tenes repetidas que le sirven.';
    return {other,givesMe,iGive,ideal,type,explain,score:givesMe.length + iGive.length};
  }).filter(m => m.score > 0).sort((a,b) => Number(b.ideal)-Number(a.ideal) || b.score-a.score || Number(b.other.category===me.category)-Number(a.other.category===me.category) || Number(b.other.team===me.team)-Number(a.other.team===me.team));
}

async function renderMatches(){
  const me = activeProfile();
  if(!me){
    $('#matches-list').innerHTML = '<div class="panel status">Todavia no cargaste tu album.</div>';
    return;
  }
  $('#matches-list').innerHTML = '<div class="panel status">Buscando cambios...</div>';
  try{
    let matches = calculateLocalMatches();
    if(dataMode === 'real'){
      const data = await apiGet(`/api/intercambio/matches?profileId=${encodeURIComponent(me.id)}`);
      matches = data.matches || [];
    }
    if(!matches.length){
      $('#matches-list').innerHTML = '<div class="panel status">Todavia no hay otros albumes cargados o no encontramos cambios disponibles. Proba cargando tus repetidas.</div>';
      return;
    }
    $('#matches-list').innerHTML = matches.map((m,idx) => `
      <article class="match-card ${idx === 0 ? 'open' : ''}">
        <div class="match-top">
          <div>
            <h3>${esc(m.other.nickname)}</h3>
            <div class="match-meta">Cat. ${esc(m.other.category)} - ${esc(m.other.team)}</div>
          </div>
          <span class="tag ${m.ideal ? 'ideal' : ''}">${esc(m.type)}</span>
        </div>
        <div class="match-explain">${esc(m.explain)}</div>
        <div class="match-stats">
          <div><b>${m.givesMe.length}</b><span>Figus que te puede dar</span></div>
          <div><b>${m.iGive.length}</b><span>Figus que vos le podes dar</span></div>
        </div>
        <button class="detail-toggle">Ver detalle</button>
        <div class="match-detail">
          <p><b>Te puede dar:</b> ${m.givesMe.slice(0,40).join(', ') || 'Por ahora ninguna'}</p>
          <p><b>Vos le podes dar:</b> ${m.iGive.slice(0,40).join(', ') || 'Por ahora ninguna'}</p>
          <div class="match-help">Coordina los cambios en el club con un adulto. No compartas telefono, direccion ni datos personales.</div>
        </div>
      </article>
    `).join('');
    $$('.detail-toggle').forEach(btn => btn.addEventListener('click', () => btn.closest('.match-card').classList.toggle('open')));
  }catch(error){
    $('#matches-list').innerHTML = '<div class="panel status">No se pudieron cargar los cambios.</div>';
  }
}

function localRankingRows(){
  const profiles = state.profiles.filter(p => p.isActive !== false);
  const me = activeProfile();
  let rows = [...profiles];
  if(currentRanking === 'category' && me) rows = rows.filter(p => p.category === me.category);
  if(currentRanking === 'team' && me) rows = rows.filter(p => p.team === me.team);
  const key = currentRanking === 'duplicates' ? 'duplicates' : currentRanking === 'near' ? 'missing' : 'owned';
  return rows.sort((a,b) => currentRanking === 'near' ? profileStats(a)[key] - profileStats(b)[key] : profileStats(b)[key] - profileStats(a)[key]);
}

async function renderRanking(){
  $('#ranking-list').innerHTML = '<div class="panel status">Cargando ranking...</div>';
  try{
    let rows = localRankingRows().map(profile => ({ ...profile, stats: profileStats(profile) }));
    if(dataMode === 'real'){
      const me = activeProfile();
      const data = await apiGet(`/api/intercambio/ranking?mode=${encodeURIComponent(currentRanking)}&profileId=${encodeURIComponent(me?.id || '')}`);
      rows = data.ranking || [];
    }
    if(!rows.length){
      $('#ranking-list').innerHTML = '<div class="panel status">No hay perfiles de tu categoria todavia.</div>';
      return;
    }
    $('#ranking-list').innerHTML = rows.slice(0,20).map((p,index) => {
      const s = p.stats || profileStats(p);
      const medal = ['🥇','🥈','🥉'][index] || `${index+1}.`;
      const value = currentRanking === 'duplicates' ? `${s.duplicates} repetidas` : `${s.owned} figus`;
      return `<article class="ranking-card">
        <div class="ranking-top">
          <div><h3>${esc(p.nickname)}</h3><div class="ranking-meta">Cat. ${esc(p.category)} - ${esc(p.team)} - ${value}</div></div>
          <div class="medal">${medal}</div>
        </div>
      </article>`;
    }).join('');
  }catch(error){
    $('#ranking-list').innerHTML = '<div class="panel status">No se pudo cargar el ranking.</div>';
  }
}

function renderAdmin(){
  const counts = state.profiles.reduce((acc,p) => {
    acc.total++;
    acc[p.category] = (acc[p.category] || 0) + 1;
    if(!Object.keys(p.album || {}).length) acc.empty++;
    return acc;
  }, {total:0,empty:0});
  $('#admin-panel').innerHTML = `
    <div class="panel">
      <h3>${counts.total} perfiles</h3>
      <p class="safe-note">${dataMode === 'real' ? 'Modo real: conectado a Supabase.' : 'Modo demo: los datos no se comparten todavia entre usuarios.'}</p>
      <p class="safe-note">Vacios o sospechosos: ${counts.empty}</p>
      <p class="safe-note">${CATEGORIES.map(c => `${c}: ${counts[c] || 0}`).join(' - ')}</p>
    </div>
    ${state.profiles.map(p => `<div class="admin-row">
      <div><b>${esc(p.nickname)}</b><div class="ranking-meta">Cat. ${esc(p.category)} - ${esc(p.team)}</div></div>
      <div><button data-admin-hide="${esc(p.id)}">${p.isActive === false ? 'Mostrar' : 'Ocultar'}</button><button data-admin-delete="${esc(p.id)}">Borrar</button></div>
    </div>`).join('')}
  `;
  $$('[data-admin-hide]').forEach(btn => btn.addEventListener('click', () => {
    const p = state.profiles.find(x => x.id === btn.dataset.adminHide);
    if(p) p.isActive = p.isActive === false;
    if(dataMode === 'demo') saveDemoState();
    renderAdmin();
  }));
  $$('[data-admin-delete]').forEach(btn => btn.addEventListener('click', () => {
    state.profiles = state.profiles.filter(x => x.id !== btn.dataset.adminDelete);
    if(activeId === btn.dataset.adminDelete) activeId = '';
    if(dataMode === 'demo') saveDemoState();
    renderAdmin();
  }));
}

function setStatus(selector, message){
  $(selector).textContent = message;
}

function burstConfetti(){
  const box = $('#confetti');
  box.innerHTML = '';
  const colors = ['#fff','#d9ad4f','#81d99b','#8fd4ff'];
  for(let i=0;i<32;i++){
    const piece = document.createElement('i');
    piece.style.left = `${Math.random()*100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random()*.28}s`;
    box.appendChild(piece);
  }
  setTimeout(() => box.innerHTML = '', 1300);
}

function wireEvents(){
  $('#create-profile-form').addEventListener('submit', createProfile);
  $('#login-form').addEventListener('submit', loginProfile);
  $('#quick-owned').addEventListener('click', () => applyQuick('owned'));
  $('#quick-duplicate').addEventListener('click', () => applyQuick('duplicate'));
  $('#clear-selection').addEventListener('click', clearSelection);
  $('#save-album').addEventListener('click', () => persistAlbum('Guardado correctamente.'));
  $('#search-number').addEventListener('input', renderAlbum);
  $$('#filter-row button').forEach(btn => btn.addEventListener('click', () => {
    $$('#filter-row button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderAlbum();
  }));
  $$('#ranking-tabs button').forEach(btn => btn.addEventListener('click', () => {
    $$('#ranking-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRanking = btn.dataset.ranking;
    renderRanking();
  }));
  $('#admin-login').addEventListener('submit', event => {
    event.preventDefault();
    if($('#admin-key').value !== ADMIN_KEY) return setStatus('#admin-status','Clave incorrecta.');
    $('#admin-panel').classList.remove('hidden');
    renderAdmin();
  });
}

initOptions();
wireNavigation();
wireEvents();
renderLoginOptions();
renderAlbum();
initDataMode();
if(new URLSearchParams(location.search).get('admin') === '1') showScreen('admin');
