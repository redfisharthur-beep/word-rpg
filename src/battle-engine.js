import { SKILLS, WORDS, PETS } from './game-data.js';

export function createBattle(stage,context={}){
  const pet=PETS.find(p=>p.id===context.petId)||PETS[0];
  const wordIds=stage.wordIds?.length?stage.wordIds:WORDS.map(w=>w.id);
  const questionTypes=stage.questionTypes?.length?stage.questionTypes:['meaning','reverse','spelling','listening'];
  const q=pickQuestion(context.wordStats||{},wordIds,!!stage.bossFocus,questionTypes);
  const questionLimit=context.questionLimit||getQuestionLimit(stage.id);
  return {
    mode:context.mode||'story',stageId:stage.id,stageName:stage.name,
    enemy:{...stage.enemy,currentHp:stage.enemy.hp,break:0,broken:false,dodge:false,armor:0},
    player:{hp:100,maxHp:100,guard:0,combo:0,roleId:context.roleId||'warrior',energy:0,maxEnergy:100,talents:[...(context.talents||[])]},
    pet:{id:pet.id,name:pet.name,level:Math.max(1,context.petLevel||1),evolved:!!context.petEvolved,trait:pet.combat},
    inventory:[...(context.inventory||[])],
    wordStats:context.wordStats||{},wordIds,questionTypes,bossFocus:!!stage.bossFocus,
    selectedSkill:'strike',turn:1,finished:false,won:false,currentQuestion:q,questionStartedAt:Date.now(),lastResult:null,
    correctCount:0,wrongCount:0,answeredCount:0,questionLimit,usedMemoryLeaf:false,usedBreakCharm:false,stars:0,accuracy:0,
  };
}

export function pickQuestion(wordStats={},wordIds=WORDS.map(w=>w.id),bossFocus=false,questionTypes=['meaning','reverse','spelling','listening']){
  const w=pickWeightedWord(wordStats,wordIds,bossFocus);
  const types=questionTypes.length?questionTypes:['meaning'];
  const type=types[Math.floor(Math.random()*types.length)];
  if(type==='reverse')return reverseQuestion(w,wordIds);
  if(type==='spelling')return {type:'spelling',label:'拼字',wordId:w.id,word:w.word,zh:w.zh,prompt:maskWord(w.word),answer:w.word,options:[]};
  if(type==='listening')return listeningQuestion(w,wordIds);
  return {type:'meaning',label:'意思',wordId:w.id,word:w.word,zh:w.zh,prompt:w.word,answer:w.zh,options:[...w.options]};
}

export function chooseSkill(battle,skillId){return SKILLS.some(s=>s.id===skillId)?{...battle,selectedSkill:skillId,lastResult:null}:battle;}

export function useUltimate(battle){
  if(!battle||battle.finished||battle.player.energy<100)return battle;
  const next=structuredClone(battle),role=next.player.roleId,canFinish=next.mode!=='review'&&next.answeredCount>=next.questionLimit;
  const result={correct:true,answer:'',word:'',zh:'',questionType:'ultimate',effect:'ultimate',amount:0,enemyDamage:0,playerDamage:0,broke:false,petText:'',enemyText:'',roleText:'',itemText:'',ultimateText:''};
  next.player.energy=0;
  if(role==='warrior'){
    const damage=58+(hasTalent(next,'warrior-rage')?15:0);dealDamage(next,damage,canFinish);next.enemy.break=Math.min(next.enemy.breakMax,next.enemy.break+2);if(next.enemy.break>=next.enemy.breakMax){next.enemy.broken=true;result.broke=true;}result.amount=damage;result.enemyDamage=damage;result.ultimateText=`裂地斬・${damage} 傷害 + Break 2`;
  }else if(role==='mage'){
    const damage=42,guard=24+(hasTalent(next,'mage-starshield')?12:0);dealDamage(next,damage,canFinish);next.player.guard=Math.min(40,next.player.guard+guard);result.amount=damage;result.enemyDamage=damage;result.ultimateText=`星界爆發・傷害 + 護盾 ${guard}`;
  }else{
    const damage=54+(hasTalent(next,'archer-volley')?18:0);dealDamage(next,damage,canFinish);next.enemy.dodge=false;next.player.combo+=3;result.amount=damage;result.enemyDamage=damage;result.ultimateText=`疾風連射・${damage} 傷害 + Combo 3`;
  }
  if(canFinish&&next.enemy.currentHp<=0)finishBattle(next,true);
  next.lastResult=result;return next;
}

export function resolveAnswer(battle,answer){
  if(battle.finished)return battle;
  const q=battle.currentQuestion,correct=norm(answer)===norm(q.answer),skill=SKILLS.find(s=>s.id===battle.selectedSkill)||SKILLS[0],next=structuredClone(battle),elapsed=(Date.now()-battle.questionStartedAt)/1000,goalReachedThisAnswer=next.answeredCount+1>=next.questionLimit,wasBrokenAtStart=!!battle.enemy.broken;
  const result={correct,answer,word:q.word,zh:q.zh,questionType:q.type,effect:skill.effect,amount:0,enemyDamage:0,playerDamage:0,broke:false,petText:'',enemyText:'',roleText:'',itemText:'',ultimateText:''};
  next.answeredCount+=1;
  if(correct){
    next.correctCount+=1;next.player.combo+=1;next.player.energy=Math.min(100,next.player.energy+22);let mult=1;
    if(next.player.roleId==='mage'&&q.type==='spelling'){mult=1.35;next.player.energy=Math.min(100,next.player.energy+8+(hasTalent(next,'mage-spellflow')?12:0));result.roleText=hasTalent(next,'mage-spellflow')?'法師・咒文循環':'法師・拼字共鳴';}
    if(next.player.roleId==='archer'){
      const quickLimit=hasTalent(next,'archer-swift')?9:7;if(elapsed<=quickLimit){next.player.combo+=1+(hasTalent(next,'archer-momentum')?1:0);next.player.energy=Math.min(100,next.player.energy+5);mult*=1.12;result.roleText=hasTalent(next,'archer-momentum')?'弓手・乘風連擊':'弓手・迅捷連擊';}
      if(hasTalent(next,'archer-focus')&&next.player.combo>=2&&skill.effect==='damage')mult*=1.15;
    }
    if(next.player.roleId==='warrior'&&next.player.combo>=3)next.player.energy=Math.min(100,next.player.energy+4);
    if(next.inventory.includes('mist-blade')&&next.player.combo>=3&&skill.effect==='damage'){mult*=1.2;result.itemText='霧鋒・連擊強化';}
    if(next.player.roleId==='mage'&&q.type==='spelling'&&hasTalent(next,'mage-arcane')&&skill.effect==='damage')mult*=1.2;
    if(next.player.roleId==='warrior'&&wasBrokenAtStart&&hasTalent(next,'warrior-execution')&&skill.effect==='damage')mult*=1.25;
    if(skill.effect==='damage'){
      let dmg=Math.round(skill.value*(wasBrokenAtStart?1.8:1)*(next.player.combo>=3?1.2:1)*petCombo(next)*mult);if(next.enemy.armor>0){dmg=Math.max(1,dmg-next.enemy.armor);result.enemyText=`硬殼減傷 ${next.enemy.armor}`;next.enemy.armor=0;}if(next.enemy.dodge){dmg=Math.max(1,Math.round(dmg*.45));result.enemyText='殘影閃避';next.enemy.dodge=false;}dealDamage(next,dmg,goalReachedThisAnswer);result.amount=dmg;result.enemyDamage=dmg;
    }
    if(skill.effect==='break'&&!next.enemy.broken){
      const before=next.enemy.break;let v=skill.value;if(next.player.combo>=3&&next.pet.trait?.kind==='combo')v+=next.pet.evolved?1:0;if(next.player.roleId==='warrior'&&next.player.combo>=2){v+=1;result.roleText='戰士・破勢';}if(hasTalent(next,'warrior-breaker')&&next.player.roleId==='warrior'){v+=1;result.roleText='戰士・破甲專精';}if(next.player.roleId==='mage'&&q.type==='spelling')v+=1;if(next.inventory.includes('break-charm')&&!next.usedBreakCharm){v+=1;next.usedBreakCharm=true;result.itemText='裂紋符・Break +1';}next.enemy.break=Math.min(next.enemy.breakMax,next.enemy.break+v);result.amount=next.enemy.break-before;if(next.enemy.break>=next.enemy.breakMax){next.enemy.broken=true;result.broke=true;}
    }
    if(skill.effect==='guard'){
      const before=next.player.guard;let v=skill.value;if(next.player.roleId==='mage'&&q.type==='spelling')v=Math.round(v*1.35);if(next.player.roleId==='warrior'&&hasTalent(next,'warrior-bulwark'))v+=6;if(next.player.roleId==='mage'&&hasTalent(next,'mage-ward'))v+=8;next.player.guard=Math.min(40,next.player.guard+v);result.amount=next.player.guard-before;
    }
    if(next.inventory.includes('echo-ring')&&q.type==='listening'){const before=next.player.guard;next.player.guard=Math.min(40,next.player.guard+6);const gained=next.player.guard-before;if(gained>0)result.itemText=`回音戒・護盾 +${gained}`;}petCorrect(next,result);
  }else{
    next.wrongCount+=1;next.player.energy=Math.min(100,next.player.energy+8);if(next.inventory.includes('memory-leaf')&&!next.usedMemoryLeaf){next.usedMemoryLeaf=true;result.itemText='記憶葉・Combo 保留';}else next.player.combo=0;result.playerDamage=enemyTurn(next,result);
  }
  if(next.player.hp<=0&&next.mode!=='review'){finishBattle(next,false);next.lastResult=result;return next;}
  if(next.mode==='review'&&next.player.hp<=0)next.player.hp=1;
  if(correct&&next.enemy.currentHp>0){
    if(wasBrokenAtStart){next.enemy.broken=false;next.enemy.break=0;if(!result.enemyText)result.enemyText='失衡加成結束';result.playerDamage=enemyTurn(next,result);}
    else if(next.enemy.broken){next.enemy.intent='失衡';if(!result.enemyText)result.enemyText='敵人失衡，無法行動';}
    else result.playerDamage=enemyTurn(next,result);
  }
  if(next.player.hp<=0&&next.mode!=='review'){finishBattle(next,false);next.lastResult=result;return next;}
  if(next.mode==='review'&&next.player.hp<=0)next.player.hp=1;
  if(next.mode==='review'&&goalReachedThisAnswer){finishBattle(next,true);next.lastResult=result;return next;}
  if(next.mode!=='review'&&goalReachedThisAnswer&&next.enemy.currentHp<=0){finishBattle(next,true);next.lastResult=result;return next;}
  if(next.mode!=='review'&&goalReachedThisAnswer&&next.enemy.currentHp>0&&!result.enemyText)result.enemyText='學習目標完成・擊倒敵人即可通關';
  next.turn+=1;next.currentQuestion=pickQuestion(next.wordStats,next.wordIds,next.bossFocus,next.questionTypes);next.questionStartedAt=Date.now();next.lastResult=result;return next;
}

function finishBattle(battle,won){if(battle.answeredCount>battle.questionLimit)battle.questionLimit=battle.answeredCount;battle.finished=true;battle.won=won;const total=Math.max(1,battle.correctCount+battle.wrongCount),accuracy=battle.correctCount/total;battle.accuracy=Math.round(accuracy*100);if(!won){battle.stars=0;return;}battle.stars=1+(accuracy>=.8?1:0)+(battle.player.hp>=50?1:0);}
function dealDamage(battle,damage,canFinish){const nextHp=battle.enemy.currentHp-damage;battle.enemy.currentHp=canFinish?Math.max(0,nextHp):Math.max(1,nextHp);}
function getQuestionLimit(stageId){return ({1:8,2:9,3:10,4:11,5:12})[stageId]||10;}
function hasTalent(b,id){return b.player.talents?.includes(id);}
function pickWeightedWord(stats,wordIds,bossFocus){const allowed=WORDS.filter(w=>wordIds.includes(w.id));const missed=allowed.filter(w=>(stats[w.id]?.wrong||0)>0);const source=bossFocus&&missed.length&&Math.random()<.75?missed:allowed;const pool=[];for(const w of source){const s=stats[w.id]||{correct:0,wrong:0};let weight=Math.max(1,1+(s.wrong||0)*2-Math.floor((s.correct||0)/3));if(bossFocus&&(s.wrong||0)>0)weight+=4+(s.wrong||0)*2;for(let i=0;i<weight;i++)pool.push(w);}return pool[Math.floor(Math.random()*pool.length)]||source[0]||allowed[0]||WORDS[0];}
function reverseQuestion(w,wordIds){const d=shuffle(WORDS.filter(x=>x.id!==w.id&&wordIds.includes(x.id)).map(x=>x.word)).slice(0,3);return {type:'reverse',label:'英譯',wordId:w.id,word:w.word,zh:w.zh,prompt:w.zh,answer:w.word,options:shuffle([w.word,...d])};}
function listeningQuestion(w,wordIds){const d=shuffle(WORDS.filter(x=>x.id!==w.id&&wordIds.includes(x.id)).map(x=>x.word)).slice(0,3);return {type:'listening',label:'聽力',wordId:w.id,word:w.word,zh:w.zh,prompt:'🔊',answer:w.word,options:shuffle([w.word,...d])};}
function maskWord(word){if(word.length<=3)return `${word[0]} _ ${word[word.length-1]}`;const chars=[...word],ids=shuffle([...Array(word.length).keys()].slice(1,-1)).slice(0,Math.max(1,Math.floor(word.length/2)));ids.forEach(i=>chars[i]='_');return chars.join(' ');}
function norm(v){return String(v??'').trim().toLowerCase();}
function shuffle(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
function petCombo(b){if(b.pet.trait?.kind!=='combo'||b.player.combo<3)return 1;const t=b.pet.trait,base=b.pet.evolved?t.evolved:t.base;return 1+base+Math.min(.08,(b.pet.level-1)*.01);}
function petCorrect(b,r){if(b.pet.trait?.kind!=='guard')return;const chance=Math.min(.65,.28+b.pet.level*.03+(b.pet.evolved?.15:0));if(Math.random()>chance)return;const v=(b.pet.evolved?b.pet.trait.evolved:b.pet.trait.base)+Math.floor(b.pet.level/3);b.player.guard=Math.min(40,b.player.guard+v);r.petText=`${b.pet.name} +${v} 護盾`;}
function enemyTurn(b,r){if(b.enemy.broken){b.enemy.broken=false;b.enemy.break=0;b.enemy.intent=b.enemy.intents?.[0]||'蓄力';r.enemyText='敵人失衡，無法行動';return 0;}const intent=b.enemy.intent;let base=10;if(b.enemy.id==='moss'){if(intent==='纏藤'){b.player.guard=Math.max(0,b.player.guard-6);base=6;r.enemyText='纏藤削弱護盾';}else base=intent==='蓄力'?12:9;}if(b.enemy.id==='rabbit'){if(intent==='殘影'){b.enemy.dodge=true;base=5;r.enemyText='下一次攻擊威力降低';}else base=intent==='突進'?12:14;}if(b.enemy.id==='bubble'){if(intent==='泡泡治癒'){b.enemy.currentHp=Math.min(b.enemy.hp,b.enemy.currentHp+10);base=5;r.enemyText='回復 10 HP';}else base=intent==='膨脹'?15:10;}if(b.enemy.id==='beetle'){if(intent==='硬殼'){b.enemy.armor=10;base=5;r.enemyText='下一次受到傷害 -10';}else base=intent==='角撞'?15:17;}if(b.enemy.id==='shadow'){if(intent==='暗語'){b.player.combo=0;base=8;r.enemyText='Combo 被清空';}else if(intent==='吞噬'){b.enemy.currentHp=Math.min(b.enemy.hp,b.enemy.currentHp+10);base=12;r.enemyText='吸收生命 +10';}else base=intent==='大招'?22:14;}const reduce=petReduction(b),damage=Math.max(0,base-b.player.guard-reduce);if(reduce>0&&damage<base)r.petText=`${b.pet.name} 減傷 ${reduce}`;b.player.hp=Math.max(0,b.player.hp-damage);b.player.guard=0;b.enemy.intent=pickIntent(b.enemy);return damage;}
function petReduction(b){if(b.pet.trait?.kind!=='reduce')return 0;const t=b.pet.trait;return (b.pet.evolved?t.evolved:t.base)+Math.floor((b.pet.level-1)/2);}
function pickIntent(e){const a=e.intents?.length?e.intents:['蓄力','閃避','回復','護甲'];return a[Math.floor(Math.random()*a.length)];}
