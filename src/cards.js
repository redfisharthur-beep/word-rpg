export const COLORS={green:'綠色',blue:'藍色',red:'紅色',yellow:'黃色',neutral:'輔助'};
export const BASE={maxHp:500,hp:500,atk:100,def:50,crit:.10,shield:0,poison:[],armorBreak:[],atkDown:[],critLock:0,defBoost:[],regen:false,role:'warrior',pet:null,monsterId:null};
const ROLE_BASE={warrior:{hp:540,atk:96,def:62},mage:{hp:470,atk:112,def:45},archer:{hp:500,atk:106,def:50}};
const PET_BASE={fox:{hp:20,atk:8,def:2},owl:{hp:35,atk:2,def:6},dragon:{hp:25,atk:6,def:4}};
const clone=x=>JSON.parse(JSON.stringify(x));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function progressionStats(role='warrior',pet='fox',level=1){
  const lv=clamp(Math.round(Number(level)||1),1,50),rb=ROLE_BASE[role]||ROLE_BASE.warrior,pb=PET_BASE[pet]||PET_BASE.fox;
  const roleStats={maxHp:Math.round(rb.hp*(1+(lv-1)*.035)),atk:Math.round(rb.atk*(1+(lv-1)*.025)),def:Math.round(rb.def*(1+(lv-1)*.025))};
  const petStats={maxHp:Math.round(pb.hp*(1+(lv-1)*.03)),atk:Math.round(pb.atk*(1+(lv-1)*.03)),def:Math.round(pb.def*(1+(lv-1)*.03))};
  const total={maxHp:roleStats.maxHp+petStats.maxHp,atk:roleStats.atk+petStats.atk,def:roleStats.def+petStats.def,crit:.10};
  return {level:lv,role:roleStats,pet:petStats,total:{...total,hp:total.maxHp}};
}
export function makeFighter(extra={}){return {...clone(BASE),...extra};}
export function accuracyMultiplier(correct,actor=null){if(correct===3)return 1.5;if(correct===2)return 1;if(correct===1)return .5;if(actor?.pet==='owl')return .25;return 0;}
export function randomCard(){
  const pool=['stat','stat','stat','combo','desperate','poison','break','sun','preempt','regen','sacrifice','restore','diamond','aegis','boost'];
  const id=pool[rnd(0,pool.length-1)];
  if(id==='stat'){
    const keys=[['hp','氣血充盈','green'],['def','罡氣護體','blue'],['atk','戰意沸騰','red'],['crit','破綻洞悉','yellow']];
    const [stat,name,color]=keys[rnd(0,keys.length-1)],pct=stat==='crit'?rnd(1,3)*10:rnd(2,6)*10;
    return {uid:crypto.randomUUID(),id:`stat-${stat}`,kind:'stat',stat,name,text:stat==='crit'?`爆擊率提升 ${pct}%`:`增加 ${pct}%`,pct,color};
  }
  const defs={
    combo:['瞬步連擊','red','連續攻擊 3 次，每次 50% 攻擊力'],
    desperate:['破釜沉舟','blue','造成 200% 傷害，自身防禦下降 50%'],
    poison:['淬毒之刃','yellow','70% 傷害，附加 30% 攻擊力毒素 3 回合'],
    break:['破甲一擊','red','70% 傷害，對手防禦降低 30% 2 回合'],
    sun:['熾陽閃','yellow','80% 火焰傷害，對手 2 回合無法爆擊'],
    preempt:['制敵機先','red','90% 傷害，對手攻擊降低 30% 2 回合'],
    regen:['生生不息','green','先回血，再於之後每次行動持續回血'],
    sacrifice:['玉石俱焚','yellow','300% 傷害，自身失去目前 80% 生命'],
    restore:['返本歸元','green','恢復最大生命 80%，溢出轉護盾'],
    diamond:['金剛不壞','blue','防禦增加 200%，持續 2 回合'],
    aegis:['混元護體','blue','增加 100% 攻擊力護盾直到戰鬥結束'],
    boost:['神功附體','neutral','強化下一張卡，並立即獲得護盾']
  };
  const [name,color,text]=defs[id];
  return {uid:crypto.randomUUID(),id,kind:id==='boost'?'support':'skill',name,text,color,boost:id==='boost'?rnd(3,8)*10:0};
}
export function dealHand(n=9){return Array.from({length:n},randomCard);}
function activePct(list=[]){return list.reduce((s,x)=>s+x.pct,0);}
export function effectiveDef(f){return Math.max(0,f.def*(1+activePct(f.defBoost))*(1-activePct(f.armorBreak)));}
export function effectiveAtk(f){return Math.max(1,f.atk*(1-activePct(f.atkDown)));}
function hit(attacker,defender,mult,logs,label,canCrit=true){
  const atk=effectiveAtk(attacker);let raw=atk*mult,crit=false;
  if(canCrit&&attacker.critLock<=0&&Math.random()<attacker.crit){raw*=2;crit=true;}
  let dmg=Math.max(1,Math.round(raw*100/(100+effectiveDef(defender))));
  if(defender.shield>0){const block=Math.min(defender.shield,dmg);defender.shield-=block;dmg-=block;}
  defender.hp=Math.max(0,defender.hp-dmg);logs.push(`${label}${crit?'（爆擊）':''} ${dmg}`);return dmg;
}
function heal(f,amount,logs,label){const missing=f.maxHp-f.hp,take=Math.min(missing,amount);f.hp+=take;const over=amount-take;if(over>0)f.shield+=over;logs.push(`${label} ${take}${over>0?`，護盾 +${over}`:''}`);}
function healHpOnly(f,amount,logs,label){const take=Math.max(0,Math.min(f.maxHp-f.hp,amount));f.hp+=take;if(take>0)logs.push(`${label} +${take}`);}
function cleanDurations(f){for(const k of ['poison','armorBreak','atkDown','defBoost'])f[k]=(f[k]||[]).filter(x=>x.turns>0);if(f.critLock<0)f.critLock=0;}
export function afterAction(actor,other,logs=[]){
  if(actor.regen&&actor.hp>0){const v=Math.round(effectiveAtk(actor)*.30);heal(actor,v,logs,'生生不息');}
  if((actor.poison||[]).length&&actor.hp>0){let total=0;for(const p of actor.poison){total+=p.damage;p.turns--;}actor.hp=Math.max(0,actor.hp-total);logs.push(`毒素 ${total}`);}
  for(const k of ['armorBreak','atkDown','defBoost'])for(const s of actor[k]||[])s.turns--;
  if(actor.critLock>0)actor.critLock--;
  cleanDurations(actor);cleanDurations(other);return logs;
}
function applyStat(card,actor,power,logs){
  const pct=(card.pct/100)*power;
  if(card.stat==='hp'){
    const add=Math.round(actor.maxHp*pct);actor.maxHp+=add;actor.hp+=add;logs.push(`生命值 +${Math.round(pct*100)}%`);
  }else if(card.stat==='crit'){
    const points=(card.pct/100)*power;actor.crit=Math.min(.80,actor.crit+points);logs.push(`爆擊率 +${Math.round(points*100)}%`);
  }else{
    actor[card.stat]*=(1+pct);logs.push(`${card.stat==='atk'?'攻擊力':'防禦力'} +${Math.round(pct*100)}%`);
    if(card.stat==='def'){
      const shield=Math.max(1,Math.round(actor.maxHp*.08*power));actor.shield+=shield;logs.push(`防禦護盾 +${shield}`);
    }
  }
}
function applyCard(card,actor,target,power,logs){if(power<=0)return;if(card.kind==='stat')return applyStat(card,actor,power,logs);switch(card.id){
  case'combo':{
    const hits=target?.monsterId==='rabbit'?[.5,.32,.32]:[.5,.5,.5];
    for(const m of hits){if(target.hp<=0)break;hit(actor,target,m*power,logs,'瞬步連擊');}
    if(target?.monsterId==='rabbit')logs.push('霧影卸力：後兩擊傷害降低');
    break;
  }
  case'desperate':hit(actor,target,2*power,logs,'破釜沉舟');actor.def*=.5;logs.push('自身防禦 -50%');break;
  case'poison':{
    hit(actor,target,.7*power,logs,'淬毒之刃');
    const resist=target?.monsterId==='moss'?.5:1;
    target.poison.push({damage:Math.round(effectiveAtk(actor)*.3*power*resist),turns:3});
    if(resist<1)logs.push('苔殼抗毒：毒素傷害減半');
    break;
  }
  case'break':hit(actor,target,.7*power,logs,'破甲一擊');target.armorBreak.push({pct:.3*power,turns:2});break;
  case'sun':hit(actor,target,.8*power,logs,'熾陽閃');target.critLock+=2;break;
  case'preempt':hit(actor,target,.9*power,logs,'制敵機先');target.atkDown.push({pct:.3*power,turns:2});break;
  case'regen':{
    const now=Math.max(1,Math.round(actor.maxHp*.15*power));healHpOnly(actor,now,logs,'生生不息');actor.regen=true;logs.push('持續回血啟動');break;
  }
  case'sacrifice':hit(actor,target,3*power,logs,'玉石俱焚');actor.hp=Math.max(1,Math.round(actor.hp*.2));logs.push('自身生命大幅下降');break;
  case'restore':heal(actor,Math.round(actor.maxHp*.8*power),logs,'返本歸元');break;
  case'diamond':actor.defBoost.push({pct:2*power,turns:2});logs.push('金剛不壞');break;
  case'aegis':{const shield=Math.round(effectiveAtk(actor)*power);actor.shield+=shield;logs.push(`護盾 +${shield}`);break;}
}}
const OFFENSIVE=new Set(['combo','desperate','poison','break','sun','preempt','sacrifice']);
export function isOffensive(card){return !!card&&OFFENSIVE.has(card.id);}
export function bondMultiplier(cards=[],card){if(!card||card.color==='neutral')return 1;return cards.filter(x=>x?.color===card.color).length>=2?1.5:1;}
export function supportBoost(card,actor){if(!card||card.id!=='boost')return 1;const extra=actor?.role==='mage'?20:0;return 1+(card.boost+extra)/100;}
export function resolveCardAction(actor,target,card,correct,{bond=1,boost=1,offensiveIndex=0,cards=[],slotIndex=0,speedWin=false}={}){
  const logs=[],acc=accuracyMultiplier(correct,actor);
  if(acc<=0){logs.push('失敗..凍結中');return logs;}
  if(card?.id==='boost'){
    const shield=Math.max(1,Math.round(effectiveAtk(actor)*.30*acc));actor.shield+=shield;
    logs.push(`神功附體 +${card.boost+(actor.role==='mage'?20:0)}%`);logs.push(`護盾 +${shield}`);return logs;
  }
  if(!card){logs.push('沒有卡牌');return logs;}
  let roleAmp=1,petAmp=1;
  if(actor.role==='warrior'&&card.color==='blue')roleAmp*=1.30;
  if(actor.role==='mage'&&card.color==='yellow')roleAmp*=1.25;
  if(actor.role==='archer'&&card.color==='red')roleAmp*=1.20;
  if(actor.role==='archer'&&isOffensive(card))roleAmp*=1+Math.min(2,offensiveIndex)*.15;
  if(actor.pet==='fox'&&speedWin&&slotIndex===0){petAmp*=1.20;logs.push('靈狐先機 +20%');}
  if(actor.pet==='dragon'&&card.color==='yellow'){petAmp*=1.20;logs.push('幼龍黃牌共鳴 +20%');}
  const yellowCount=cards.filter(x=>x?.color==='yellow').length;
  if(actor.pet==='dragon'&&yellowCount>=2&&slotIndex===cards.length-1){petAmp*=1.30;logs.push('幼龍終式爆發 +30%');}
  applyCard(card,actor,target,acc*bond*boost*roleAmp*petAmp,logs);
  if(actor.role==='warrior'&&card.color==='blue'&&actor.hp>0){const v=Math.max(1,Math.round(effectiveDef(actor)*.20));actor.shield+=v;logs.push(`戰士護盾 +${v}`);}
  const redCount=cards.filter(x=>x?.color==='red').length;
  if(actor.pet==='fox'&&redCount>=2&&slotIndex===cards.length-1&&target.hp>0){hit(actor,target,.40*acc,logs,'靈狐追擊');}
  return logs;
}
export function applyPetRoundEnd(actor,cards=[],logs=[]){
  if(actor?.pet==='owl'&&actor.hp>0){const stable=cards.filter(c=>c?.color==='green'||c?.color==='blue').length;if(stable>=2)healHpOnly(actor,Math.round(actor.maxHp*.08),logs,'夜梟守心');}
  return logs;
}
export function resolveBasic(actor,target,correct){const logs=[],p=accuracyMultiplier(correct,actor);if(p<=0){logs.push('失敗..凍結中');return logs;}if(correct===0&&actor?.pet==='owl')logs.push('夜梟洞察：保留 25% 效果');hit(actor,target,p,logs,'基本攻擊');return logs;}
export function resolveAutoBasic(actor,target){const logs=[];hit(actor,target,1,logs,'普通攻擊',true);return logs;}
export function cardSummary(card){if(!card)return '';if(card.kind==='stat')return `${card.name} ${card.pct}%`;if(card.id==='boost')return `${card.name} ${card.boost}%`;return card.name;}
export function cloneFighter(f){return clone(f);}
