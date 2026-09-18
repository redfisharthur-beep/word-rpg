import {equipmentBonuses,petSkillEffects,petEnhanceLevel,equipmentResonance,mythicEquipmentEffects} from './rpg.js';
import {GAME_ROLES,GAME_PETS,TITLE_TIERS as SHARED_TITLE_TIERS,CARD_POOL,CARD_DEFS,ROLE_SKILLS as SHARED_ROLE_SKILLS} from './generated/game-data.js';

export const COLORS={green:'綠色',blue:'藍色',red:'紅色',yellow:'黃色',neutral:'輔助'};
export const BASE={maxHp:500,hp:500,atk:100,def:50,crit:.10,shield:0,poison:[],armorBreak:[],atkDown:[],critLock:0,defBoost:[],healBlock:[],stun:0,regen:0,regenFresh:false,role:'warrior',pet:null,monsterId:null,rpg:null};
const ROLE_BASE=Object.fromEntries(Object.entries(GAME_ROLES).map(([id,x])=>[id,{hp:x.base.hp,atk:x.base.atk,def:x.base.def}]));
const PET_BASE=Object.fromEntries(Object.entries(GAME_PETS).map(([id,x])=>[id,{hp:x.base.hp,atk:x.base.atk,def:x.base.def}]));
export const TITLE_TIERS=SHARED_TITLE_TIERS;
const ROLE_SKILLS=SHARED_ROLE_SKILLS;
export function titleTier(level=1){const lv=clamp(Math.round(Number(level)||1),1,50);return TITLE_TIERS.find(x=>lv>=x.level)||TITLE_TIERS[TITLE_TIERS.length-1];}
export function unlockedRoleSkills(role='warrior',level=1){const lv=clamp(Math.round(Number(level)||1),1,50);return (ROLE_SKILLS[role]||[]).filter(x=>lv>=x.level);}
const clone=x=>JSON.parse(JSON.stringify(x));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function progressionStats(role='warrior',pet='fox',level=1,rpg=null){
  const lv=clamp(Math.round(Number(level)||1),1,50),rb=ROLE_BASE[role]||ROLE_BASE.warrior,pb=PET_BASE[pet]||PET_BASE.fox,tier=titleTier(lv),eq=equipmentBonuses(rpg||{}),petFx=petSkillEffects(pet,rpg||{});
  const rawRole={maxHp:rb.hp*(1+(lv-1)*.035),atk:rb.atk*(1+(lv-1)*.025),def:rb.def*(1+(lv-1)*.025)};
  const roleStats={maxHp:Math.round(rawRole.maxHp*(1+tier.hp)),atk:Math.round(rawRole.atk*(1+tier.atk)),def:Math.round(rawRole.def*(1+tier.def))};
  const petEnhance=petEnhanceLevel(pet,rpg||{}),petScale=1+petEnhance*.10,petStats={maxHp:Math.round(pb.hp*(1+(lv-1)*.03)*petScale),atk:Math.round(pb.atk*(1+(lv-1)*.03)*petScale),def:Math.round(pb.def*(1+(lv-1)*.03)*petScale)};
  const total={maxHp:Math.round((roleStats.maxHp+petStats.maxHp)*(1+eq.hpPct+petFx.hpPct)),atk:Math.round((roleStats.atk+petStats.atk)*(1+eq.atkPct+petFx.atkPct)),def:Math.round((roleStats.def+petStats.def)*(1+eq.defPct+petFx.defPct)),crit:Math.min(.85,.10+tier.crit+eq.crit+petFx.crit)};
  return {level:lv,role:roleStats,pet:petStats,title:tier,total:{...total,hp:total.maxHp}};
}
export function makeFighter(extra={}){return {...clone(BASE),...extra};}
export function accuracyMultiplier(correct,actor=null){const n=Math.max(0,Math.min(5,Math.round(Number(correct)||0)));if(actor?.pet==='owl'){const fx=petSkillEffects(actor.pet,actor.rpg||{}),highBonus=n>=3?(fx?.highAccuracy||0):0;if(n===5)return 1.7+highBonus;if(n===4)return 1.5+highBonus;if(n===3)return 1.32+highBonus;if(n===2)return 1.15;if(n===1)return .9;return .65;}if(n===5)return 1.5;if(n===4)return 1.32;if(n===3)return 1.15;if(n===2)return .9;if(n===1)return .65;return 0;}
export function randomCard(){
  const id=CARD_POOL[rnd(0,CARD_POOL.length-1)];
  if(id==='stat'){
    const keys=[['hp','氣血充盈','green'],['def','罡氣護體','blue'],['atk','戰意沸騰','red'],['crit','破綻洞悉','yellow']];
    const [stat,name,color]=keys[rnd(0,keys.length-1)],pct=stat==='crit'?rnd(1,3)*10:rnd(2,6)*10;
    return {uid:crypto.randomUUID(),id:`stat-${stat}`,kind:'stat',stat,name,text:stat==='crit'?`爆擊率提升 ${pct}%`:`增加 ${pct}%`,pct,color};
  }
  const def=CARD_DEFS[id]||{name:id,color:'neutral',text:''};
  return {uid:crypto.randomUUID(),id,kind:id==='boost'?'support':'skill',name:def.name,text:def.text,color:def.color,boost:id==='boost'?rnd(3,8)*10:0};
}
export function dealHand(n=9,role=null,level=1){
  const lv=clamp(Math.round(Number(level)||1),1,50),skills=role?unlockedRoleSkills(role,Math.max(lv,10)):[];
  let exclusiveCount=role?(lv>=30?2:1):0;
  exclusiveCount=Math.min(n,exclusiveCount,skills.length);
  const hand=Array.from({length:n-exclusiveCount},randomCard),pool=[...skills];
  for(let i=0;i<exclusiveCount;i++){const at=rnd(0,pool.length-1),skill=pool.splice(at,1)[0];hand.push({...skill,uid:crypto.randomUUID(),kind:'exclusive',exclusive:true,role});}
  for(let i=hand.length-1;i>0;i--){const j=rnd(0,i);[hand[i],hand[j]]=[hand[j],hand[i]];}
  return hand;
}
function activePct(list=[]){return list.reduce((s,x)=>s+x.pct,0);}
export function effectiveDef(f){return Math.max(0,f.def*(1+activePct(f.defBoost))*(1-activePct(f.armorBreak)));}
export function effectiveAtk(f){return Math.max(1,f.atk*(1-activePct(f.atkDown)));}
function applyDamage(defender,amount){
  let dmg=Math.max(0,Math.round(amount)),shieldDamage=0,hpDamage=0;
  if(defender.shield>0&&dmg>0){shieldDamage=Math.min(defender.shield,dmg);defender.shield-=shieldDamage;dmg-=shieldDamage;}
  if(dmg>0&&defender.hp>0){hpDamage=Math.min(defender.hp,dmg);defender.hp=Math.max(0,defender.hp-hpDamage);}
  return {dealt:shieldDamage+hpDamage,shieldDamage,hpDamage};
}
function healPenalty(f){return Math.min(.95,Math.max(0,...(f.healBlock||[]).map(x=>Number(x.pct)||0)));}
function consumeStun(f,logs){if(Number(f?.stun)>0){f.stun=Math.max(0,Number(f.stun)-1);logs.push('雷縛震擊：暈眩，跳過行動');return true}return false;}
function hit(attacker,defender,mult,logs,label,canCrit=true){
  const atkFx=mythicEquipmentEffects(attacker?.rpg||{}),defFx=mythicEquipmentEffects(defender?.rpg||{});
  if(defFx.blockChance>0&&Math.random()<defFx.blockChance){logs.push('神佑格擋：完全抵擋');return 0;}
  const atk=effectiveAtk(attacker);let raw=atk*mult,crit=false;
  if(atkFx.berserk&&attacker.hp>0&&attacker.hp<attacker.maxHp*.5){raw*=2;logs.push('血怒狂戰：攻擊 ×2');}
  if(canCrit&&attacker.critLock<=0&&Math.random()<attacker.crit){raw*=2;crit=true;if(atkFx.critBonusMax>0){const bonus=atkFx.critBonusMin+Math.random()*(atkFx.critBonusMax-atkFx.critBonusMin);raw*=1+bonus;logs.push(`弒神暴擊 +${Math.round(bonus*100)}%`);}}
  const defense=atkFx.trueDamage?0:effectiveDef(defender),dmg=Math.max(1,Math.round(raw*100/(100+defense))),result=applyDamage(defender,dmg);
  logs.push(`${label}${crit?'（爆擊）':''}${atkFx.trueDamage?'（真傷）':''} ${result.dealt}`);
  if(result.dealt>0){
    if(atkFx.lifesteal>0&&attacker.hp>0)healHpOnly(attacker,Math.max(1,Math.round(result.dealt*atkFx.lifesteal)),logs,'血契汲取');
    if(atkFx.sunderPct>0&&defender.hp>0){const stacks=(defender.armorBreak||[]).filter(x=>x.source==='mythic-sunder').length;if(stacks<atkFx.sunderMax){defender.armorBreak.push({pct:atkFx.sunderPct,turns:atkFx.sunderTurns,source:'mythic-sunder'});logs.push(`蝕甲魔晶：防禦 -${Math.round(atkFx.sunderPct*100)}%（${stacks+1}/${atkFx.sunderMax}）`);}}
    if(atkFx.stunChance>0&&defender.hp>0&&Math.random()<atkFx.stunChance){defender.stun=Math.max(1,Number(defender.stun)||0);logs.push('雷縛震擊：暈眩');}
    if(atkFx.antiHealPct>0&&defender.hp>0){const turns=atkFx.antiHealMinTurns+(Math.random()<.5?0:1),rest=(defender.healBlock||[]).filter(x=>x.source!=='mythic-antiheal');rest.push({pct:atkFx.antiHealPct,turns,source:'mythic-antiheal'});defender.healBlock=rest;logs.push(`禁療烙印：恢復 -${Math.round(atkFx.antiHealPct*100)}%・${turns}回合`);}
    if(atkFx.fatalChance>0&&defender.hp>0&&Math.random()<atkFx.fatalChance){const fatal=Math.max(1,Math.round(defender.maxHp*atkFx.fatalPct)),f=applyDamage(defender,fatal);logs.push(`死神判決：致命傷害 ${f.dealt}`);}
    if(defFx.reflect>0&&attacker.hp>0){const reflected=Math.max(1,Math.round(result.dealt*defFx.reflect)),back=applyDamage(attacker,reflected);logs.push(`荊棘反噬 ${back.dealt}`);}
  }
  return result.dealt;
}
function heal(f,amount,logs,label){const penalty=healPenalty(f),adjusted=Math.max(0,Math.round(amount*(1-penalty))),missing=f.maxHp-f.hp,take=Math.min(missing,adjusted);f.hp+=take;const over=adjusted-take;if(over>0)f.shield+=over;if(penalty>0)logs.push(`禁療：恢復 -${Math.round(penalty*100)}%`);logs.push(`${label} ${take}${over>0?`，護盾 +${over}`:''}`);}
function healHpOnly(f,amount,logs,label){const penalty=healPenalty(f),adjusted=Math.max(0,Math.round(amount*(1-penalty))),take=Math.max(0,Math.min(f.maxHp-f.hp,adjusted));f.hp+=take;if(penalty>0)logs.push(`禁療：恢復 -${Math.round(penalty*100)}%`);if(take>0)logs.push(`${label} +${take}`);}
function cleanDurations(f){for(const k of ['poison','armorBreak','atkDown','defBoost','healBlock'])f[k]=(f[k]||[]).filter(x=>x.turns>0);if(f.critLock<0)f.critLock=0;}
export function afterAction(actor,other,logs=[]){
  if(actor.regenFresh)actor.regenFresh=false;else if(Number(actor.regen)>0&&actor.hp>0){const v=Math.round(effectiveAtk(actor)*.30);heal(actor,v,logs,'生生不息');actor.regen=Math.max(0,Number(actor.regen)-1);}
  if((actor.poison||[]).length&&actor.hp>0){let total=0;for(const p of actor.poison){total+=p.damage;p.turns--;}actor.hp=Math.max(0,actor.hp-total);logs.push(`毒素 ${total}`);}
  for(const k of ['armorBreak','atkDown','defBoost','healBlock'])for(const state of actor[k]||[]){if(state.fresh)state.fresh=false;else state.turns--;}
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
  case'desperate':hit(actor,target,2*power,logs,'破釜沉舟');actor.defBoost.push({pct:-.5,turns:2,fresh:true});logs.push('自身防禦 -50%・2回合');break;
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
    const now=Math.max(1,Math.round(actor.maxHp*.15*power));healHpOnly(actor,now,logs,'生生不息');actor.regen=3;actor.regenFresh=true;logs.push('持續回血 3回合');break;
  }
  case'sacrifice':hit(actor,target,3*power,logs,'玉石俱焚');actor.hp=Math.max(1,Math.round(actor.hp*.2));logs.push('自身生命大幅下降');break;
  case'restore':heal(actor,Math.round(actor.maxHp*.8*power),logs,'返本歸元');break;
  case'diamond':actor.defBoost.push({pct:2*power,turns:2,fresh:true});logs.push('金剛不壞');break;
  case'aegis':{const shield=Math.round(effectiveAtk(actor)*power);actor.shield+=shield;logs.push(`護盾 +${shield}`);break;}
}}
const OFFENSIVE=new Set(['combo','desperate','poison','break','sun','preempt','sacrifice']);
function exclusiveOffensive(card){return !!(card?.fx?.damage||(Array.isArray(card?.fx?.hits)&&card.fx.hits.length));}
export function isOffensive(card){return !!card&&(card.exclusive?exclusiveOffensive(card):OFFENSIVE.has(card.id));}
export function bondMultiplier(cards=[],card){if(!card||card.color==='neutral')return 1;return cards.filter(x=>x?.color===card.color).length>=2?1.5:1;}
export function supportBoost(card,actor){if(!card||card.id!=='boost')return 1;const extra=actor?.role==='mage'?20:0;return 1+(card.boost+extra)/100;}
export function resolveCardAction(actor,target,card,correct,{bond=1,boost=1,offensiveIndex=0,cards=[],slotIndex=0,speedWin=false}={}){
  const logs=[];if(consumeStun(actor,logs))return logs;const acc=accuracyMultiplier(correct,actor),petFx=petSkillEffects(actor?.pet,actor?.rpg||{}),resonance=equipmentResonance(actor?.rpg||{});
  if(acc<=0){logs.push('失敗..凍結中');return logs;}
  if(card?.id==='boost'){
    const shield=Math.max(1,Math.round(effectiveAtk(actor)*.30*acc));actor.shield+=shield;
    logs.push(`神功附體 +${card.boost+(actor.role==='mage'?20:0)}%`);logs.push(`護盾 +${shield}`);return logs;
  }
  if(!card){logs.push('沒有卡牌');return logs;}
  let roleAmp=1,petAmp=1,resAmp=1;
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
  if(slotIndex===0&&resonance.firstCardAmp>0){resAmp*=1+resonance.firstCardAmp;logs.push(`烈戰共鳴 +${Math.round(resonance.firstCardAmp*100)}%`);}
  if(card.color==='green'&&resonance.greenAmp>0){resAmp*=1+resonance.greenAmp;logs.push(`血靈共鳴 +${Math.round(resonance.greenAmp*100)}%`);}
  if(card.color==='blue'&&resonance.blueAmp>0){resAmp*=1+resonance.blueAmp;logs.push(`鐵壁共鳴 +${Math.round(resonance.blueAmp*100)}%`);}
  applyCard(card,actor,target,acc*bond*boost*roleAmp*petAmp*resAmp,logs);
  if(actor.role==='warrior'&&card.color==='blue'&&actor.hp>0){const v=Math.max(1,Math.round(effectiveDef(actor)*.14));actor.shield+=v;logs.push(`戰士護盾 +${v}`);}
  const redCount=cards.filter(x=>x?.color==='red').length;
  if(actor.pet==='fox'&&redCount>=2&&slotIndex===cards.length-1&&target.hp>0){hit(actor,target,(.40+petFx.chaseAmp)*acc,logs,'靈狐追擊');}
  return logs;
}
export function applyPetRoundEnd(actor,cards=[],logs=[]){
  if(actor?.pet==='owl'&&actor.hp>0){const stable=cards.filter(c=>c?.color==='green'||c?.color==='blue').length,fx=petSkillEffects(actor.pet,actor.rpg||{});if(stable>=2)healHpOnly(actor,Math.round(actor.maxHp*(.08+fx.guardHeal)),logs,'夜梟守心');}
  return logs;
}
function basicAttack(actor,target,mult,logs,label){
  const fx=mythicEquipmentEffects(actor?.rpg||{});let hits=1;
  if(fx.flurry3Chance>0){const roll=Math.random();if(roll<fx.flurry3Chance)hits=3;else if(roll<fx.flurry3Chance+fx.flurry2Chance)hits=2;if(hits>1)logs.push(`無盡連斬：${hits}連擊`);}
  for(let i=0;i<hits&&actor.hp>0&&target.hp>0;i++)hit(actor,target,mult,logs,label,true);
}
export function resolveBasic(actor,target,correct){const logs=[];if(consumeStun(actor,logs))return logs;const power=accuracyMultiplier(correct,actor);if(power<=0){logs.push('失敗..凍結中');return logs;}basicAttack(actor,target,power,logs,'基本攻擊');return logs;}
export function resolveAutoBasic(actor,target){const logs=[];if(consumeStun(actor,logs))return logs;basicAttack(actor,target,1,logs,'普通攻擊');return logs;}
export function resolveUltimate(actor,target,role=actor?.role){
  const logs=[];if(consumeStun(actor,logs))return logs;
  const ultimate=GAME_ROLES[role]?.ultimate||GAME_ROLES.warrior.ultimate;
  if(Array.isArray(ultimate.hits)){for(const mult of ultimate.hits){if(target.hp<=0)break;hit(actor,target,mult,logs,ultimate.name,true);}}
  else hit(actor,target,Number(ultimate.mult)||2.8,logs,ultimate.name,true);
  return logs;
}
export function cardSummary(card){if(!card)return '';if(card.kind==='stat')return `${card.name} ${card.pct}%`;if(card.id==='boost')return `${card.name} ${card.boost}%`;return card.name;}
export function cloneFighter(f){return clone(f);}
