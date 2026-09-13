import { DurableObject } from 'cloudflare:workers';

const WORD_COUNT=30;
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/match'){
      const id=env.MATCHMAKER.idFromName('global-matchmaker');
      return env.MATCHMAKER.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};

export class Matchmaker extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;}

  async fetch(request){
    if(request.headers.get('Upgrade')!=='websocket')return new Response('WebSocket required',{status:426});
    const pair=new WebSocketPair();
    const client=pair[0],server=pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({id:crypto.randomUUID(),state:'new',profile:null,opponentId:null,matchId:null,hp:0,maxHp:0,ready:null,turn:1});
    server.send(JSON.stringify({type:'connected'}));
    return new Response(null,{status:101,webSocket:client});
  }

  webSocketMessage(ws,message){
    let data;try{data=JSON.parse(typeof message==='string'?message:new TextDecoder().decode(message))}catch{return}
    if(data.type==='join')return this.join(ws,data.profile||{});
    if(data.type==='ready')return this.ready(ws,data);
  }

  join(ws,profile){
    let att=ws.deserializeAttachment()||{};
    const role=['warrior','mage','archer'].includes(profile.role)?profile.role:'warrior';
    const pet=['fox','owl','dragon'].includes(profile.pet)?profile.pet:'fox';
    const base={warrior:{hp:150},mage:{hp:134},archer:{hp:140}}[role];
    att={...att,state:'waiting',profile:{role,pet},hp:base.hp,maxHp:base.hp,ready:null,turn:1};
    ws.serializeAttachment(att);

    const candidate=this.ctx.getWebSockets().find(other=>{
      if(other===ws)return false;const a=other.deserializeAttachment();return a?.state==='waiting'&&a?.profile;
    });
    if(!candidate){ws.send(JSON.stringify({type:'queued'}));return}

    const other=candidate.deserializeAttachment();
    const matchId=crypto.randomUUID();
    att={...att,state:'matched',opponentId:other.id,matchId,ready:null,turn:1};
    const otherAtt={...other,state:'matched',opponentId:att.id,matchId,ready:null,turn:1};
    ws.serializeAttachment(att);candidate.serializeAttachment(otherAtt);
    const q=Math.floor(Math.random()*WORD_COUNT);
    ws.send(JSON.stringify({type:'matched',opponent:{...other.profile,hp:otherAtt.hp,maxHp:otherAtt.maxHp},questionIndex:q}));
    candidate.send(JSON.stringify({type:'matched',opponent:{...att.profile,hp:att.hp,maxHp:att.maxHp},questionIndex:q}));
  }

  ready(ws,data){
    let att=ws.deserializeAttachment();
    if(!att||att.state!=='matched')return;
    const snap=this.cleanSnapshot(data.snapshot||{},att.profile);
    att.hp=clamp(num(snap.hp,att.hp),0,num(snap.maxHp,att.maxHp));
    att.maxHp=Math.max(1,num(snap.maxHp,att.maxHp));
    att.ready=snap;ws.serializeAttachment(att);
    const opponent=this.findById(att.opponentId);
    if(!opponent){ws.send(JSON.stringify({type:'opponent-left'}));return}
    let oppAtt=opponent.deserializeAttachment();
    if(!oppAtt?.ready){ws.send(JSON.stringify({type:'waiting-opponent'}));return}

    const result=this.resolve(att,oppAtt);
    att={...att,hp:result.aHp,maxHp:result.aMax,ready:null,turn:att.turn+1};
    oppAtt={...oppAtt,hp:result.bHp,maxHp:result.bMax,ready:null,turn:oppAtt.turn+1};
    if(result.finished){att.state='finished';oppAtt.state='finished'}
    ws.serializeAttachment(att);opponent.serializeAttachment(oppAtt);
    const nextQ=Math.floor(Math.random()*WORD_COUNT);
    ws.send(JSON.stringify({type:'battle-result',rounds:result.aRounds,selfMaxHp:result.aMax,opponentMaxHp:result.bMax,nextQuestionIndex:nextQ,finished:result.finished,winner:result.winner==='a'?'self':result.winner==='b'?'opponent':'draw'}));
    opponent.send(JSON.stringify({type:'battle-result',rounds:result.bRounds,selfMaxHp:result.bMax,opponentMaxHp:result.aMax,nextQuestionIndex:nextQ,finished:result.finished,winner:result.winner==='b'?'self':result.winner==='a'?'opponent':'draw'}));
  }

  cleanSnapshot(s,profile){
    const out={role:profile.role,pet:profile.pet,skills:s.skills||{},streak:Math.max(0,num(s.streak,0))};
    for(const k of ['hp','maxHp','atk','def','crit','combo','lifesteal','counter','shield','fire','poison','regen','rage','roleGuard','reprisal','elementAmp','arcaneBurst','firstCrit','firstCombo'])out[k]=num(s[k],0);
    out.maxHp=clamp(out.maxHp,1,999);out.hp=clamp(out.hp,0,out.maxHp);out.atk=clamp(out.atk,1,300);out.def=clamp(out.def,0,200);out.crit=clamp(out.crit,0,.9);out.combo=clamp(out.combo,0,.9);out.lifesteal=clamp(out.lifesteal,0,.5);out.counter=clamp(out.counter,0,2);out.shield=clamp(out.shield,0,100);out.fire=clamp(out.fire,0,100);out.poison=clamp(out.poison,0,100);out.regen=clamp(out.regen,0,50);return out;
  }

  resolve(a,b){
    const A=a.ready,B=b.ready;let ah=clamp(a.hp,0,A.maxHp),bh=clamp(b.hp,0,B.maxHp);
    if(A.pet==='owl')ah=Math.min(A.maxHp,ah+3);if(B.pet==='owl')bh=Math.min(B.maxHp,bh+3);
    const aRounds=[],bRounds=[];
    for(let round=1;round<=3&&ah>0&&bh>0;round++){
      ah=Math.min(A.maxHp,ah+Math.max(0,Math.round(A.regen)));bh=Math.min(B.maxHp,bh+Math.max(0,Math.round(B.regen)));
      const hitA=this.attack(A,B,round),hitB=this.attack(B,A,round);
      let damageToB=hitA.damage,damageToA=hitB.damage;
      if(B.role==='warrior')damageToB=Math.max(1,Math.round(damageToB*.9));if(A.role==='warrior')damageToA=Math.max(1,Math.round(damageToA*.9));
      if(B.pet==='owl')damageToB=Math.max(1,Math.round(damageToB*.88));if(A.pet==='owl')damageToA=Math.max(1,Math.round(damageToA*.88));
      const counterA=A.counter>0?Math.max(0,Math.round(A.atk*A.counter-B.def)):0;
      const counterB=B.counter>0?Math.max(0,Math.round(B.atk*B.counter-A.def)):0;
      damageToB+=counterA;damageToA+=counterB;
      bh=Math.max(0,bh-damageToB);ah=Math.max(0,ah-damageToA);
      if(A.lifesteal>0&&hitA.damage>0)ah=Math.min(A.maxHp,ah+Math.max(1,Math.round(hitA.damage*A.lifesteal)));
      if(B.lifesteal>0&&hitB.damage>0)bh=Math.min(B.maxHp,bh+Math.max(1,Math.round(hitB.damage*B.lifesteal)));
      aRounds.push({round,selfHp:ah,opponentHp:bh,dealt:damageToB,received:damageToA,selfCrit:hitA.crit,selfCombo:hitA.combo,oppCrit:hitB.crit});
      bRounds.push({round,selfHp:bh,opponentHp:ah,dealt:damageToA,received:damageToB,selfCrit:hitB.crit,selfCombo:hitB.combo,oppCrit:hitA.crit});
    }
    const finished=ah<=0||bh<=0;const winner=!finished?null:ah===bh?'draw':ah>bh?'a':'b';
    return {aHp:ah,bHp:bh,aMax:A.maxHp,bMax:B.maxHp,aRounds,bRounds,finished,winner};
  }

  attack(A,D,round){
    let raw=A.atk*(1+A.rage*Math.max(0,A.streak-1));
    if(A.role==='mage'&&round===3)raw*=1+A.arcaneBurst;
    const critLv=num(A.skills?.crit,0),comboLv=num(A.skills?.combo,0),fireLv=num(A.skills?.fire,0),poisonLv=num(A.skills?.poison,0);
    const critChance=clamp(A.crit+(A.role==='archer'&&round===1?.12+A.firstCrit:0),0,.9);
    const comboChance=clamp(A.combo+(A.role==='archer'&&round===1?.12+A.firstCombo:0),0,.9);
    const crit=Math.random()<critChance,combo=Math.random()<comboChance;
    if(crit)raw*=critLv>=3?2.35:2;
    let damage=Math.max(1,Math.round(raw-D.def-D.shield-D.roleGuard));
    const elem=A.role==='mage'?1.22+A.elementAmp:1+A.elementAmp;
    const fire=Math.max(0,Math.round(A.fire*elem));
    damage+=fire;
    if(fireLv>=3&&round>1)damage+=Math.max(1,Math.round(fire*.35));
    if(fireLv>=5&&round===3)damage+=Math.max(2,Math.round(fire*1.4));
    if(A.poison>0){const pm=poisonLv>=5?1.8:poisonLv>=3?1.3:1;damage+=Math.max(1,Math.round(A.poison*elem*pm));}
    if(combo){damage+=Math.max(1,Math.round(A.atk*(comboLv>=3?.8:.58)-D.def*.5));if(comboLv>=5)damage+=Math.max(1,Math.round(A.atk*.4-D.def*.25));}
    if(crit&&critLv>=5)damage+=Math.max(1,Math.round(A.atk*.4));
    if(A.pet==='fox'&&Math.random()<.30)damage+=Math.max(1,Math.round(A.atk*.45));
    if(A.pet==='dragon')damage+=3;
    return {damage,crit,combo};
  }

  findById(id){return this.ctx.getWebSockets().find(ws=>ws.deserializeAttachment()?.id===id)}
  webSocketClose(ws){
    const att=ws.deserializeAttachment();if(!att?.opponentId)return;const opponent=this.findById(att.opponentId);if(opponent){try{opponent.send(JSON.stringify({type:'opponent-left'}))}catch{}const oa=opponent.deserializeAttachment();if(oa){oa.state='finished';opponent.serializeAttachment(oa)}}
  }
  webSocketError(ws){this.webSocketClose(ws)}
}
