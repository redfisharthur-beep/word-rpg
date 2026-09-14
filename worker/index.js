import {DurableObject} from 'cloudflare:workers';
import {dealHand,makeFighter,resolveCardAction,resolveBasic,afterAction,cloneFighter,bondMultiplier,supportBoost,isOffensive} from '../src/cards.js';

const WORD_COUNT=30;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const qset=()=>Array.from({length:3},()=>Math.floor(Math.random()*WORD_COUNT));
export default{async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/match'){const id=env.MATCHMAKER.idFromName('global-matchmaker');return env.MATCHMAKER.get(id).fetch(request)}return env.ASSETS.fetch(request)}};

export class Matchmaker extends DurableObject{
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env}
  async fetch(request){if(request.headers.get('Upgrade')!=='websocket')return new Response('WebSocket required',{status:426});const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);server.serializeAttachment({id:crypto.randomUUID(),state:'new',profile:null,opponentId:null,matchId:null,fighter:null,hand:null,used:[],round:1,ready:null});server.send(JSON.stringify({type:'connected'}));return new Response(null,{status:101,webSocket:client})}
  webSocketMessage(ws,message){let data;try{data=JSON.parse(typeof message==='string'?message:new TextDecoder().decode(message))}catch{return}if(data.type==='join')this.join(ws,data.profile||{});if(data.type==='ready')this.ready(ws,data)}
  profile(p){return {name:String(p.name||'PLAYER').slice(0,16),role:['warrior','mage','archer'].includes(p.role)?p.role:'warrior',pet:['fox','owl','dragon'].includes(p.pet)?p.pet:'fox'}}
  send(ws,data){try{ws.send(JSON.stringify(data))}catch{}}
  find(id){return this.ctx.getWebSockets().find(x=>x.deserializeAttachment()?.id===id)}
  view(att){return {...cloneFighter(att.fighter),profile:att.profile}}
  join(ws,p){let att=ws.deserializeAttachment()||{};const profile=this.profile(p);att={...att,state:'waiting',profile,fighter:makeFighter({role:profile.role}),hand:dealHand(9),used:[],round:1,ready:null};ws.serializeAttachment(att);const other=this.ctx.getWebSockets().find(x=>x!==ws&&x.deserializeAttachment()?.state==='waiting');if(!other){this.send(ws,{type:'queued'});return}let oa=other.deserializeAttachment();const matchId=crypto.randomUUID();att={...att,state:'matched',opponentId:oa.id,matchId};oa={...oa,state:'matched',opponentId:att.id,matchId};ws.serializeAttachment(att);other.serializeAttachment(oa);const questions=qset();this.send(ws,{type:'matched',self:this.view(att),opponent:this.view(oa),hand:att.hand,questions});this.send(other,{type:'matched',self:this.view(oa),opponent:this.view(att),hand:oa.hand,questions})}
  cleanReady(data,att){const correct=clamp(Math.round(Number(data.correct)||0),0,3),elapsedMs=clamp(Math.round(Number(data.elapsedMs)||30000),200,30000),available=att.hand.map((_,i)=>i).filter(i=>!att.used.includes(i));let selected=[];if(att.round<3){selected=[...new Set((Array.isArray(data.selected)?data.selected:[]).map(Number).filter(i=>available.includes(i)))].slice(0,3);if(selected.length!==3)return null}return {correct,elapsedMs,selected}}
  ready(ws,data){let a=ws.deserializeAttachment();if(!a||a.state!=='matched'||a.ready)return;const ready=this.cleanReady(data,a);if(!ready){this.send(ws,{type:'error',message:'出牌資料錯誤'});return}a.ready=ready;ws.serializeAttachment(a);const other=this.find(a.opponentId);if(!other){this.send(ws,{type:'opponent-left'});return}let b=other.deserializeAttachment();if(!b?.ready){this.send(ws,{type:'waiting-opponent'});return}this.resolvePair(ws,a,other,b)}
  resolvePair(ws,a,other,b){
    const A=a.fighter,B=b.fighter,ra=a.ready,rb=b.ready,round=a.round,cardsA=round<3?ra.selected.map(i=>a.hand[i]):[],cardsB=round<3?rb.selected.map(i=>b.hand[i]):[],first=ra.elapsedMs<=rb.elapsedMs?'a':'b',sequence=[];
    if(round===3)sequence.push(first,first==='a'?'b':'a');
    else if(first==='a')sequence.push('a','b','a','b','a','b');
    else sequence.push('b','a','b','a','b','a');
    const counts={a:0,b:0},stateA={pendingBoost:1,offensiveCount:0},stateB={pendingBoost:1,offensiveCount:0},stepsA=[],stepsB=[],allLogsA=[],allLogsB=[];
    const doCard=(actor,target,card,correct,pair,state)=>{const bond=bondMultiplier(pair,card);let boost=1;if(state.pendingBoost>1&&card?.id!=='boost'){boost=state.pendingBoost;state.pendingBoost=1}const offensiveIndex=state.offensiveCount,logs=resolveCardAction(actor,target,card,correct,{bond,boost,offensiveIndex});if(card?.id==='boost')state.pendingBoost=supportBoost(card,actor);if(isOffensive(card))state.offensiveCount++;afterAction(actor,target,logs);return logs};
    for(const who of sequence){
      if(A.hp<=0||B.hp<=0)break;
      const slot=counts[who]++;let logs=[],card=null;
      if(round===3){if(who==='a'){logs=resolveBasic(A,B,ra.correct);afterAction(A,B,logs)}else{logs=resolveBasic(B,A,rb.correct);afterAction(B,A,logs)}}
      else if(who==='a'){card=cardsA[slot];logs=doCard(A,B,card,ra.correct,cardsA,stateA)}
      else{card=cardsB[slot];logs=doCard(B,A,card,rb.correct,cardsB,stateB)}
      if(who==='a')allLogsA.push(...logs);else allLogsB.push(...logs);
      stepsA.push({who:who==='a'?'self':'opponent',slot,card,self:cloneFighter(A),opponent:cloneFighter(B),logs});
      stepsB.push({who:who==='b'?'self':'opponent',slot,card,self:cloneFighter(B),opponent:cloneFighter(A),logs});
    }
    if(round<3){a.used.push(...ra.selected);b.used.push(...rb.selected)}
    a.fighter=A;b.fighter=B;
    const finished=round>=3||A.hp<=0||B.hp<=0;let winner=null;
    if(finished){const ar=A.hp/A.maxHp,br=B.hp/B.maxHp;winner=Math.abs(ar-br)<.0001?'draw':ar>br?'a':'b';a.state='finished';b.state='finished'}else{a.round++;b.round++;a.ready=null;b.ready=null}
    ws.serializeAttachment(a);other.serializeAttachment(b);const nextQuestions=finished?null:qset();
    this.send(ws,{type:'battle-result',round,self:this.view(a),opponent:this.view(b),correct:ra.correct,logs:allLogsA,steps:stepsA,opponentCards:cardsB,orderText:first==='a'?`你先出手 · ${(ra.elapsedMs/1000).toFixed(1)} 秒`:`對手先出手 · ${(rb.elapsedMs/1000).toFixed(1)} 秒`,finished,winner:winner==='a'?'self':winner==='b'?'opponent':winner,nextQuestions});
    this.send(other,{type:'battle-result',round,self:this.view(b),opponent:this.view(a),correct:rb.correct,logs:allLogsB,steps:stepsB,opponentCards:cardsA,orderText:first==='b'?`你先出手 · ${(rb.elapsedMs/1000).toFixed(1)} 秒`:`對手先出手 · ${(ra.elapsedMs/1000).toFixed(1)} 秒`,finished,winner:winner==='b'?'self':winner==='a'?'opponent':winner,nextQuestions})
  }
  webSocketClose(ws){const a=ws.deserializeAttachment();if(!a?.opponentId)return;const other=this.find(a.opponentId);if(other){this.send(other,{type:'opponent-left'});const b=other.deserializeAttachment();if(b){b.state='finished';other.serializeAttachment(b)}}}
  webSocketError(ws){this.webSocketClose(ws)}
}
