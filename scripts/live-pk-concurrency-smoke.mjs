import assert from 'node:assert/strict';
const ROOT=process.env.WORD_RPG_BASE_URL||'https://word-rpg.redfisharthur.workers.dev';
const URL=ROOT.replace(/^https:/,'wss:').replace(/^http:/,'ws:')+'/match';
const clients=Array.from({length:4},(_,i)=>({id:'PK-LOAD-'+i+'-'+crypto.randomUUID().slice(0,6),ws:null,queue:[],waiters:[]}));
function next(client,type,limit=25000){const idx=client.queue.findIndex(m=>m.type===type);if(idx>=0)return Promise.resolve(client.queue.splice(idx,1)[0]);return new Promise((resolve,reject)=>{const item={type,resolve, reject};const timer=setTimeout(()=>{client.waiters=client.waiters.filter(w=>w!==item);reject(Error(client.id+' timeout '+type))},limit);item.resolve=m=>{clearTimeout(timer);resolve(m)};item.reject=e=>{clearTimeout(timer);reject(e)};client.waiters.push(item)})}
async function connect(client){
  const ws=new WebSocket(URL);client.ws=ws;
  ws.addEventListener('message',event=>{
    const m=JSON.parse(String(event.data));
    console.log('PK-CONCURRENT EVENT',client.id,m.type,m.message||'',m.opponent?.profile?.name||'');
    if(m.type==='error'){for(const waiter of client.waiters.splice(0))waiter.reject(Error(m.message));return}
    const i=client.waiters.findIndex(w=>w.type===m.type);
    if(i>=0)client.waiters.splice(i,1)[0].resolve(m);else client.queue.push(m);
  });
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('WS connect timeout')),15000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('WS error'))},{once:true})});
  ws.send(JSON.stringify({type:'join',profile:{name:client.id,role:'warrior',pet:'fox',level:12,rpg:{}}}));
}
try{
  await Promise.all(clients.map(connect));
  const matches=await Promise.all(clients.map(c=>next(c,'matched',30000)));
  for(let i=0;i<4;i++){
    assert.equal(matches[i].bot,undefined,'concurrent humans must not be replaced by bot');
    assert.notEqual(matches[i].opponent.profile.name,clients[i].id,'must not match own socket');
    const other=matches[i].opponent.profile.name;
    const matchIndex=clients.findIndex(c=>c.id===other);
    assert.ok(matchIndex>=0,'opponent must be another of four test players');
    assert.equal(matches[matchIndex].opponent.profile.name,clients[i].id,'pair must be mutual');
    assert.equal(matches[i].self.profile.level,80,'PK level normalized');
  }
  console.log('P1 four concurrent human players -> two mutual matches: PASS');
}finally{for(const c of clients)try{c.ws?.close(1000,'smoke complete')}catch{}}
