const API='https://radardetrenes.com/api/v1';
const map=L.map('map',{zoomControl:false,preferCanvas:true}).setView([40.15,-3.7],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
document.getElementById('zoom-in').onclick=()=>map.zoomIn();
document.getElementById('zoom-out').onclick=()=>map.zoomOut();
document.getElementById('fit').onclick=()=>map.flyTo([40.15,-3.7],6);
const markers=new Map();let fleet=[],filter='all',selected=null,lastUpdated=null;
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDelay=n=>Number(n)>0?`+${Math.round(n)} min`:'En hora';
function kind(t){let x=String(t.type||'').toLowerCase();return x.includes('commuter')||x.includes('suburban')?'commuter':'long_distance'}
function markerIcon(t){return L.divIcon({className:'',html:`<div class="train-pin ${kind(t)}">➤</div>`,iconSize:[27,27],iconAnchor:[13,13]})}
function trainName(t){return t.productName|| (kind(t)==='commuter'?'Cercanías':'Tren')}
function route(t){return `${t.originName||'Origen desconocido'} <b>→</b> ${t.destinationName||'Destino desconocido'}`}
function visible(t){let q=document.getElementById('search').value.toLowerCase();return(filter==='all'||kind(t)===filter)&&(`${t.trainCode||t.id} ${t.originName} ${t.destinationName} ${t.productName}`.toLowerCase().includes(q))}
function showDetail(t){
 selected=t.id;const d=document.getElementById('detail');d.classList.remove('hidden');
 d.innerHTML=`<button class="detail-close" aria-label="Cerrar" onclick="document.getElementById('detail').classList.add('hidden')">×</button><h2>${esc(trainName(t))} · ${esc(t.trainCode||t.id)}</h2><p>${esc(t.originName)} → ${esc(t.destinationName)}</p><div class="detail-grid"><div>PRÓXIMA PARADA<b>${esc(t.nextStationName||'No disponible')}</b></div><div>RETRASO<b>${esc(fmtDelay(t.delayMinutes))}</b></div><div>TIPO DE SERVICIO<b>${kind(t)==='commuter'?'Cercanías':'Larga distancia'}</b></div><div>ÚLTIMO DATO<b>${t.timestamp?new Date(t.timestamp).toLocaleTimeString('es-ES'):'No disponible'}</b></div><div>LATITUD<b>${Number(t.latitude).toFixed(5)}</b></div><div>LONGITUD<b>${Number(t.longitude).toFixed(5)}</b></div></div>`;
}
function draw(){
 const list=document.getElementById('train-list');list.innerHTML='';
 const subset=fleet.filter(visible).sort((a,b)=>String(a.trainCode||a.id).localeCompare(String(b.trainCode||b.id)));
 document.getElementById('count-label').textContent=subset.length+' resultados';
 subset.forEach(t=>{
  const id=String(t.id);let marker=markers.get(id);
  if(!marker){marker=L.marker([t.latitude,t.longitude],{icon:markerIcon(t),keyboard:true}).addTo(map);marker.on('click',()=>showDetail(t));markers.set(id,marker)}
  else marker.setLatLng([t.latitude,t.longitude]);
  marker.setIcon(markerIcon(t));
  const card=document.createElement('article');card.className='train-card'+(selected===id?' selected':'');
  card.innerHTML=`<div class="card-top"><span class="train-id">${esc(t.trainCode||id)}</span><span class="type-tag">${esc(trainName(t))}</span></div><div class="route">${route(t)}</div><div class="card-bottom"><span>SIGUIENTE: ${esc(t.nextStationName||'—')}</span><span class="${Number(t.delayMinutes)>0?'delay':'ontime'}">${esc(fmtDelay(t.delayMinutes))}</span></div>`;
  card.onclick=()=>{map.flyTo([t.latitude,t.longitude],Math.max(map.getZoom(),8),{duration:.7});showDetail(t);drawSelection()};
  list.appendChild(card);
 });
 // Remove markers no longer present in the current snapshot.
 const current=new Set(fleet.map(t=>String(t.id)));for(const [id,m] of markers){if(!current.has(id)){map.removeLayer(m);markers.delete(id)}}
 document.getElementById('total').textContent=fleet.length;
 document.getElementById('delayed').textContent=fleet.filter(t=>Number(t.delayMinutes)>0).length;
}
function drawSelection(){document.querySelectorAll('.train-card').forEach(c=>c.classList.remove('selected'))}
function updateStatus(ok,msg){document.getElementById('connection').textContent=msg;document.querySelector('.top-center .live-dot').style.background=ok?'#3ce0a0':'#ffad65'}
function accept(data){
 if(!data||!Array.isArray(data.trains))throw new Error('Formato de flota no reconocido');
 fleet=data.trains.filter(t=>Number.isFinite(Number(t.latitude))&&Number.isFinite(Number(t.longitude)));
 lastUpdated=data.updatedAt||new Date().toISOString();
 document.getElementById('updated').textContent=new Date(lastUpdated).toLocaleTimeString('es-ES');
 updateStatus(true,'DATOS EN DIRECTO');
 draw();
}
async function refresh(){
 const b=document.getElementById('refresh');b.disabled=true;
 try{const r=await fetch(API+'/fleet?type=all',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);accept(await r.json())}
 catch(e){updateStatus(false,'FUENTE NO DISPONIBLE');if(!fleet.length)document.getElementById('train-list').innerHTML=`<div class="loading">No se han podido cargar los datos. Comprueba tu conexión y pulsa Actualizar.</div>`}
 finally{b.disabled=false}
}
document.getElementById('refresh').onclick=refresh;
document.getElementById('search').addEventListener('input',draw);
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;draw()});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('search').focus()}});
refresh();
// The live stream sends a cached snapshot immediately and subsequent fleet changes.
try{
 const stream=new EventSource(API+'/fleet/stream?type=all');
 stream.addEventListener('fleet',e=>{try{accept(JSON.parse(e.data))}catch(err){console.warn(err)}});
 stream.onerror=()=>{updateStatus(false,'RECONECTANDO…')};
}catch(e){setInterval(refresh,25000)}
// Safety polling fallback if the stream stays silent or is unsupported.
setInterval(()=>{if(!lastUpdated||Date.now()-new Date(lastUpdated).getTime()>90000)refresh()},30000);
