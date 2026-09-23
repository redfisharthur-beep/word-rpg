import assert from 'node:assert/strict';

const noop=()=>{};
let socket;
globalThis.document={getElementById:()=>({}),addEventListener:noop,querySelector:()=>null};
globalThis.Audio=class{constructor(){this.src='';this.currentTime=0;}pause(){}play(){return Promise.resolve()}getAttribute(name){return this[name]||''}};
globalThis.location={protocol:'https:',host:'example.test'};
globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true})});
globalThis.WebSocket=class{
  static OPEN=1;
  constructor(){this.readyState=1;socket=this;queueMicrotask(()=>this.onopen?.());}
  send(){}
  close(){this.readyState=3;}
  deliver(message){this.onmessage?.({data:JSON.stringify(message)});}
};

const {createPkMode}=await import('../src/pk.js');
const app={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};
const roles={warrior:{name:'戰士',art:'/images/warrior.png'}};
const pets={fox:{name:'狐狸'}};
const fighter=profile=>({hp:100,maxHp:100,atk:10,def:10,crit:.1,shield:0,profile});
const me=fighter({name:'玩家',role:'warrior',level:80});
const opponent=fighter({name:'AI 挑戰者',role:'warrior',level:80});
let exits=0,seasonResults=0;
const mode=createPkMode({app,meta:{playerName:'玩家',role:'warrior',pet:'fox',level:80,rpg:{}},ROLES:roles,PETS:pets,visual:src=>`<img class="fighter-art" src="${src}">`,effects:{},onExit:()=>exits++,onSeasonResult:()=>seasonResults++});
try{
  await mode.start();
  socket.deliver({type:'matched',self:me,opponent,hand:[],bot:true});
  assert.match(app.innerHTML,/pk-battle/);
  const snapshot=({hp,maxHp,atk,def,crit,shield})=>({hp,maxHp,atk,def,crit,shield});
  const step={who:'opponent',slot:0,cycle:1,card:{id:'combo',name:'連擊',color:'red'},self:snapshot(me),opponent:snapshot(opponent),logs:['普通攻擊']};
  // Server deliberately sends only fighter snapshots, not a profile in each step.
  socket.deliver({type:'battle-result',round:1,self:me,opponent,steps:[step],opponentCards:[],finished:false});
  assert.match(app.innerHTML,/action-screen/);
  assert.match(app.innerHTML,/AI 挑戰者/);
  assert.match(app.innerHTML,/玩家/);
  assert.equal(exits,0);
  socket.deliver({type:'battle-result',round:2,self:me,opponent,steps:[step],opponentCards:[],finished:true,winner:'self'});
  assert.match(app.innerHTML,/action-screen/);
  assert.equal(seasonResults,1);
  assert.equal(exits,0);
  console.log('PK bot snapshot -> battle render: PASS');
}finally{mode.stop(false)}
