// Live end-to-end AI matchmaking test: real 60-second alarm, quiz, battle and next round.
import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';
const root=process.env.WORD_RPG_BASE_URL||'https://word-rpg.redfisharthur.workers.dev';
const ROOM='ci-'+(process.env.GITHUB_RUN_ID||crypto.randomUUID())+'-'+(process.env.GITHUB_RUN_ATTEMPT||'1')+'-ai';
const wsUrl=root.replace(/^https:/,'wss:').replace(/^http:/,'ws:')+'/match?practice='+encodeURIComponent(ROOM);
const ws=new WebSocket(wsUrl),queue=[],waiters=[];
let active=true;
ws.addEventListener('message',event=>{
  const message=JSON.parse(String(event.data));
  if(message.type==='error'){console.error('AI PK server error:',message.message);for(const w of waiters.splice(0))w.reject(Error(String(message.message)));return}
  const i=waiters.findIndex(w=>w.type===message.type);
  if(i>=0)waiters.splice(i,1)[0].resolve(message);else queue.push(message);
});
const waitFor=(type,ms=90000)=>{
  const i=queue.findIndex(x=>x.type===type);
  if(i>=0)return Promise.resolve(queue.splice(i,1)[0]);
  return new Promise((resolve,reject)=>{
    const item={type,resolve:m=>{clearTimeout(timer);resolve(m)},reject:e=>{clearTimeout(timer);reject(e)}};
    const timer=setTimeout(()=>{const at=waiters.indexOf(item);if(at>=0)waiters.splice(at,1);reject(Error('Timed out waiting for '+type))},ms);
    waiters.push(item);
  });
};
try{
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('WebSocket connect timeout')),12000);
    ws.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});
    ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('WebSocket connection error'))},{once:true});
  });
  ws.send(JSON.stringify({type:'join',profile:{name:'AI-SMOKE-'+crypto.randomUUID().slice(0,8),role:'mage',pet:'owl',level:1,rpg:{}}}));
  await waitFor('queued',15000);
  const started=Date.now(),matched=await waitFor('matched',85000);
  assert.equal(matched.bot,true,'Expected 60-second AI fallback (test may encounter another human player)');
  assert.ok(Date.now()-started>=59000,'AI should not take over before 60 seconds');
  assert.equal(matched.opponent?.profile?.name,'AI 挑戰者');
  assert.equal(matched.self?.profile?.level,80);
  ws.send(JSON.stringify({type:'quiz-start',selected:[0,1,2]}));
  const quiz=await waitFor('quiz-started',12000);
  assert.equal(quiz.questions.length,5);
  for(const q of quiz.questions){assert.ok(q.word&&Array.isArray(q.options));assert.equal(Object.hasOwn(q,'answer'),false,'PK must not send answer keys');}
  await sleep(4600);
  ws.send(JSON.stringify({type:'ready',answers:Array(5).fill('')}));
  const result=await waitFor('battle-result',25000);
  assert.equal(result.round,1);assert.ok(result.steps?.length>0);
  assert.equal(result.opponent?.profile?.name,'AI 挑戰者');
  console.log('P1 AI 60-second takeover -> protected questions -> battle: PASS');
}finally{active=false;try{ws.close(1000,'smoke complete')}catch{}}
