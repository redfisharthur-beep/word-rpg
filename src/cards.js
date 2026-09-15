import {equipmentBonuses,petSkillEffects} from './rpg.js';

export const COLORS={green:'綠色',blue:'藍色',red:'紅色',yellow:'黃色',neutral:'輔助'};
export const BASE={maxHp:500,hp:500,atk:100,def:50,crit:.10,shield:0,poison:[],armorBreak:[],atkDown:[],critLock:0,defBoost:[],regen:0,role:'warrior',pet:null,monsterId:null,rpg:null};
const ROLE_BASE={warrior:{hp:540,atk:96,def:62},mage:{hp:470,atk:112,def:45},archer:{hp:500,atk:106,def:50}};
const PET_BASE={fox:{hp:20,atk:8,def:2},owl:{hp:35,atk:2,def:6},dragon:{hp:25,atk:6,def:4}};
export const TITLE_TIERS=[
  {level:30,name:'傳說勇者',hp:.12,atk:.12,def:.12,crit:.05,label:'生命/攻擊/防禦 +12% · 爆擊 +5%'},
  {level:20,name:'菁英勇者',hp:.08,atk:.08,def:.08,crit:.03,label:'生命/攻擊/防禦 +8% · 爆擊 +3%'},
  {level:10,name:'覺醒勇者',hp:.05,atk:.06,def:.05,crit:.02,label:'生命 +5% · 攻擊 +6% · 防禦 +5% · 爆擊 +2%'},
  {level:5,name:'冒險者',hp:.03,atk:.03,def:.03,crit:.01,label:'生命/攻擊/防禦 +3% · 爆擊 +1%'},
  {level:1,name:'初行者',hp:0,atk:0,def:0,crit:0,label:'基礎能力'}
];
export function titleTier(level=1){const lv=clamp(Math.round(Number(level)||1),1,50);return TITLE_TIERS.find(x=>lv>=x.level)||TITLE_TIERS[TITLE_TIERS.length-1];}
const ROLE_SKILLS={
  warrior:[
    {level:10,id:'warrior-10',name:'震嶽斬',color:'red',text:'155%重擊',fx:{damage:1.55}},
    {level:20,id:'warrior-20',name:'不屈戰魂',color:'green',text:'回血28%＋護盾10%',fx:{healMax:.28,shieldMax:.10}},
    {level:30,id:'warrior-30',name:'王者壁壘',color:'blue',text:'護盾45%＋防禦+20%',fx:{shieldMax:.45,defBuff:.20}},
    {level:40,id:'warrior-40',name:'守護反擊',color:'blue',text:'135%傷害＋護盾25%',fx:{damage:1.35,shieldMax:.25}},
    {level:50,id:'warrior-50',name:'天崩地裂',color:'red',text:'260%終極傷害',fx:{damage:2.60}}
  ],
  mage:[
    {level:10,id:'mage-10',name:'炎爆術',color:'yellow',text:'155%火焰傷害',fx:{damage:1.55}},
    {level:20,id:'mage-20',name:'奧術回復',color:'green',text:'回血35%',fx:{healMax:.35}},
    {level:30,id:'mage-30',name:'魔法障壁',color:'blue',text:'護盾50%',fx:{shieldMax:.50}},
    {level:40,id:'mage-40',name:'星隕術',color:'yellow',text:'205%星隕傷害',fx:{damage:2.05}},
    {level:50,id:'mage-50',name:'終焉魔導',color:'yellow',text:'285%終極傷害',fx:{damage:2.85}}
  ],
  archer:[
    {level:10,id:'archer-10',name:'雙星連射',color:'red',text:'2連擊・每擊82%',fx:{hits:[.82,.82]}},
    {level:20,id:'archer-20',name:'回風步',color:'green',text:'85%傷害＋回血20%',fx:{damage:.85,healMax:.20}},
    {level:30,id:'archer-30',name:'暴雨箭陣',color:'red',text:'3連擊・每擊65%',fx:{hits:[.65,.65,.65]}},
    {level:40,id:'archer-40',name:'風神護佑',color:'green',text:'回血28%＋護盾15%',fx:{healMax:.28,shieldMax:.15}},
    {level:50,id:'archer-50',name:'天穹一箭',color:'red',text:'300%終極傷害',fx:{damage:3.00}}
  ]
};
export function unlockedRoleSkills(role='warrior',level=1){const lv=clamp(Math.round(Number(level)||1),1,50);return (ROLE_SKILLS[role]||[]).filter(x=>lv>=x.level);}
const clone=x=>JSON.parse(JSON.stringify(x));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function progressionStats(role='warrior',pet='fox',level=1,rpg=null){
  const lv=clamp(Math.round(Number(level)||1),1,50),rb=ROLE_BASE[role]||ROLE_BASE.warrior,pb=PET_BASE[pet]||PET_BASE.fox,tier=titleTier(lv),eq=equipmentBonuses(rpg||{}),petFx=petSkillEffects(pet,rpg||{});
  const rawRole={maxHp:rb.hp*(1+(lv-1)*.035),atk:rb.atk*(1+(lv-1)*.025),def:rb.def*(1+(lv-1)*.025)};
  const roleStats={maxHp:Math.round(rawRole.maxHp*(1+tier.hp)),atk:Math.round(rawRole.atk*(1+tier.atk)),def:Math.round(rawRole.def*(1+tier.def))};
  const petStats={maxHp:Math.round(pb.hp*(1+(lv-1)*.03)),atk:Math.round(pb.atk*(1+(lv-1)*.03)),def:Math.round(pb.def*(1+(lv-1)*.03))};
  const total={maxHp:Math.round((roleStats.maxHp+petStats.maxHp)*(1+eq.hpPct+petFx.hpPct)),atk:Math.round((roleStats.atk+petStats.atk)*(1+eq.atkPct+petFx.atkPct)),def:Math.round((roleStats.def+petStats.def)*(1+eq.defPct+petFx.defPct)),crit:Math.min(.85,.10+tier.crit+eq.crit+petFx.crit)};
  return {level:lv,role:roleStats,pet:petStats,title:tier,total:{...total,hp:total.maxHp}};
}
export function makeFighter(extra={}){return {...clone(BASE),...extra};}
export function accuracyMultiplier(correct,actor=null){if(correct===3)return 1.5;if(correct===2)return 1.15;if(correct===1){const fx=actor?.pet==='owl'?petSkillEffects(actor.pet,actor.rpg||{}):null;return .65+(fx?.oneAccuracy||0)}return 0;}
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
export function dealHand(n=9,role=null,level=1){
  const lv=clamp(Math.round(Number(level)||1),1,50),skills=role?unlockedRoleSkills(role,lv):[];
  let exclusiveCount=role?(lv>=50?3:lv>=30?2:lv>=10?1:0):0;
  exclusiveCount=Math.min(n,exclusiveCount,skills.length);
  const hand=Array.from({length:n-exclusiveCount},randomCard),pool=[...skills];
  for(let i=0;i<exclusiveCount;i++){const at=rnd(0,pool.length-1),skill=pool.splice(at,1)[0];hand.push({...skill,uid:crypto.randomUUID(),kind:'exclusive',exclusive:true,role});}
  for(let i=hand.length-1;i>0;i--){const j=rnd(0,i);[hand[i],hand[j]]=[hand[j],hand[i]];}
  return hand;
}
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
  if(Number(actor.regen)>0&&actor.hp>0){const v=Math.round(effectiveAtk(actor)*.30);heal(actor,v,logs,'生生不息');actor.regen=Math.max(0,Number(actor.regen)-1);}
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
function applyExclusive(card,actor,target,power,logs){
  const fx=card.fx||{},scale=Math.max(.1,Math.min(1.75,power)),turns=Math.max(1,Math.round(fx.turns||2));
  if(Array.isArray(fx.hits)){for(const mult of fx.hits){if(target.hp<=0)break;hit(actor,target,mult*power,logs,card.name);}}
  else if(fx.damage)hit(actor,target,fx.damage*power,logs,card.name);
  if(fx.healMax&&actor.hp>0)healHpOnly(actor,Math.round(actor.maxHp*fx.healMax*scale),logs,card.name);
  if(fx.shieldMax&&actor.hp>0){const v=Math.max(1,Math.round(actor.maxHp*fx.shieldMax*scale));actor.shield+=v;logs.push(`${card.name} 護盾 +${v}`);}
  if(fx.atkBuff&&actor.hp>0){const pct=fx.atkBuff*scale;actor.atk*=1+pct;logs.push(`${card.name} 攻擊 +${Math.round(pct*100)}%`);}
  if(fx.defBuff&&actor.hp>0){const pct=fx.defBuff*scale;actor.def*=1+pct;logs.push(`${card.name} 防禦 +${Math.round(pct*100)}%`);}
  if(fx.critBuff&&actor.hp>0){const pct=fx.critBuff*scale;actor.crit=Math.min(.85,actor.crit+pct);logs.push(`${card.name} 爆擊 +${Math.round(pct*100)}%`);}
  if(fx.armorBreak&&target.hp>0){const pct=Math.min(.65,fx.armorBreak*scale);target.armorBreak.push({pct,turns});logs.push(`${card.name} 破甲 ${Math.round(pct*100)}%`);}
  if(fx.atkDown&&target.hp>0){const pct=Math.min(.60,fx.atkDown*scale);target.atkDown.push({pct,turns});logs.push(`${card.name} 降攻 ${Math.round(pct*100)}%`);}
}
function applyCard(card,actor,target,power,logs){if(power<=0)return;if(card?.exclusive)return applyExclusive(card,actor,target,power,logs);if(card.kind==='stat')return applyStat(card,actor,power,logs);switch(card.id){
  case'combo':{
    const hits=target?.monsterId==='rabbit'?[.5,.32,.32]:[.5,.5,.5];
    for(const m of hits){if(target.hp<=0)break;hit(actor,target,m*power,logs,'瞬步連擊');}
    if(target?.monsterId==='rabbit')logs.push('霧影卸力：後兩擊傷害降低');
    break;
  }
  case'desperate':hit(actor,target,2*power,logs,'破釜沉舟');actor.defBoost.push({pct:-.5,turns:2});logs.push('自身防禦 -50%・2回合');break;
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
    const now=Math.max(1,Math.round(actor.maxHp*.15*power));healHpOnly(actor,now,logs,'生生不息');actor.regen=3;logs.push('持續回血 3回合');break;
  }
  case'sacrifice':hit(actor,target,3*power,logs,'玉石俱焚');actor.hp=Math.max(1,Math.round(actor.hp*.2));logs.push('自身生命大幅下降');break;
  case'restore':heal(actor,Math.round(actor.maxHp*.8*power),logs,'返本歸元');break;
  case'diamond':actor.defBoost.push({pct:2*power,turns:2});logs.push('金剛不壞');break;
  case'aegis':{const shield=Math.round(effectiveAtk(actor)*power);actor.shield+=shield;logs.push(`護盾 +${shield}`);break;}
}}
const OFFENSIVE=new Set(['combo','desperate','poison','break','sun','preempt','sacrifice']);
function exclusiveOffensive(card){return !!(card?.fx?.damage||(Array.isArray(card?.fx?.hits)&&card.fx.hits.length));}
export function isOffensive(card){return !!card&&(card.exclusive?exclusiveOffensive(card):OFFENSIVE.has(card.id));}
export function bondMultiplier(cards=[],card){if(!card||card.color==='neutral')return 1;return cards.filter(x=>x?.color===card.color).length>=2?1.5:1;}
export function supportBoost(card,actor){if(!card||card.id!=='boost')return 1;const extra=actor?.role==='mage'?20:0;return 1+(card.boost+extra)/100;}
export function resolveCardAction(actor,target,card,correct,{bond=1,boost=1,offensiveIndex=0,cards=[],slotIndex=0,speedWin=false}={}){
  const logs=[],acc=accuracyMultiplier(correct,actor),petFx=petSkillEffects(actor?.pet,actor?.rpg||{});
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
  if(actor.pet==='fox'&&speedWin&&slotIndex===0){const amp=.20+petFx.firstCardAmp;petAmp*=1+amp;logs.push(`靈狐先機 +${Math.round(amp*100)}%`);}
  if(actor.pet==='fox'&&card.color==='red'&&petFx.redAmp>0)petAmp*=1+petFx.redAmp;
  if(actor.pet==='owl'&&(card.color==='green'||card.color==='blue')&&petFx.stableAmp>0)petAmp*=1+petFx.stableAmp;
  if(actor.pet==='dragon'&&card.color==='yellow'){const amp=.20+petFx.yellowAmp;petAmp*=1+amp;logs.push(`幼龍黃牌共鳴 +${Math.round(amp*100)}%`);}
  const yellowCount=cards.filter(x=>x?.color==='yellow').length;
  if(actor.pet==='dragon'&&yellowCount>=2&&slotIndex===cards.length-1){const amp=.30+petFx.finisherAmp;petAmp*=1+amp;logs.push(`幼龍終式爆發 +${Math.round(amp*100)}%`);}
  applyCard(card,actor,target,acc*bond*boost*roleAmp*petAmp,logs);
  if(actor.role==='warrior'&&card.color==='blue'&&actor.hp>0){const v=Math.max(1,Math.round(effectiveDef(actor)*.14));actor.shield+=v;logs.push(`戰士護盾 +${v}`);}
  const redCount=cards.filter(x=>x?.color==='red').length;
  if(actor.pet==='fox'&&redCount>=2&&slotIndex===cards.length-1&&target.hp>0){hit(actor,target,(.40+petFx.chaseAmp)*acc,logs,'靈狐追擊');}
  return logs;
}
export function applyPetRoundEnd(actor,cards=[],logs=[]){
  if(actor?.pet==='owl'&&actor.hp>0){const stable=cards.filter(c=>c?.color==='green'||c?.color==='blue').length,fx=petSkillEffects(actor.pet,actor.rpg||{});if(stable>=2)healHpOnly(actor,Math.round(actor.maxHp*(.08+fx.guardHeal)),logs,'夜梟守心');}
  return logs;
}
export function resolveBasic(actor,target,correct){const logs=[],p=accuracyMultiplier(correct,actor);if(p<=0){logs.push('失敗..凍結中');return logs;}hit(actor,target,p,logs,'基本攻擊');return logs;}
export function resolveAutoBasic(actor,target){const logs=[];hit(actor,target,1,logs,'普通攻擊',true);return logs;}
export function cardSummary(card){if(!card)return '';if(card.kind==='stat')return `${card.name} ${card.pct}%`;if(card.id==='boost')return `${card.name} ${card.boost}%`;return card.name;}
export function cloneFighter(f){return clone(f);}
