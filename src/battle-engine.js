import { SKILLS, WORDS, PETS } from './game-data.js';

export function createBattle(stage,context={}){
  const pet=PETS.find(p=>p.id===context.petId)||PETS[0];
  const wordIds=stage.wordIds?.length?stage.wordIds:WORDS.map(w=>w.id);
  const q=pickQuestion(context.wordStats||{},wordIds,!!stage.bossFocus);
  return {
    stageId:stage.id,
    enemy:{...stage.enemy,currentHp:stage.enemy.hp,break:0,broken:false,dodge:false,armor:0},
    player:{hp:100,maxHp:100,guard:0,combo:0,roleId:context.roleId||'warrior'},
    pet:{id:pet.id,name:pet.name,level:Math.max(1,context.petLevel||1),evolved:!!context.petEvolved,trait:pet.combat},
    inventory:[...(context.inventory||[])],
    wordStats:context.wordStats||{},wordIds,bossFocus:!!stage.bossFocus,
    selectedSkill:'strike',turn:1,finished:false,won:false,currentQuestion:q,questionStartedAt:Date.now(),lastResult:null,
    correctCount:0,wrongCount:0,usedMemoryLeaf:false,usedBreakCharm:false,stars:0,
  };
}

export function pickQuestion(wordStats={},wordIds=WORDS.map(w=>w.id),bossFocus=false){
  const w=pickWeightedWord(wordStats,wordIds,bossFocus),r=Math.random();
  if(r<.34)return {type:'meaning',label:'意思',wordId:w.id,word:w.word,zh:w.zh,prompt:w.word,answer:w.zh,options:[...w.options]};
  if(r<.58)return reverseQuestion(w);
  if(r<.80)return {type:'spelling',label:'拼字',wordId:w.id,word:w.word,zh:w.zh,prompt:maskWord(w.word),answer:w.word,options:[]};
  return listeningQuestion(w);
}

export function chooseSkill(battle,skillId){return SKILLS.some(s=>s.id===skillId)?{...battle,selectedSkill:skillId,lastResult:null}:battle;}

export function resolveAnswer(battle,answer){
  if(battle.finished)return battle;
  const q=battle.currentQuestion,correct=norm(answer)===norm(q.answer),skill=SKILLS.find(s=>s.id===battle.selectedSkill)||SKILLS[0],next=structuredClone(battle),elapsed=(Date.now()-battle.questionStartedAt)/1000;
  const result={correct,answer,word:q.word,zh:q.zh,questionType:q.type,effect:skill.effect,amount:0,enemyDamage:0,playerDamage:0,broke:false,petText:'',enemyText:'',roleText:'',itemText:''};

  if(correct){
    next.correctCount+=1;next.player.combo+=1;let mult=1;
    if(next.player.roleId==='mage'&&q.type==='spelling'){mult=1.35;result.roleText='法師・拼字共鳴';}
    if(next.player.roleId==='archer'&&elapsed<=7){next.player.combo+=1;mult*=1.12;result.roleText='弓手・迅捷連擊';}
    if(next.inventory.includes('mist-blade')&&next.player.combo>=3&&skill.effect==='damage'){mult*=1.2;result.itemText='霧鋒・連擊強化';}

    if(skill.effect==='damage'){
      let dmg=Math.round(skill.value*(next.enemy.broken?1.8:1)*(next.player.combo>=3?1.2:1)*petCombo(next)*mult);
      if(next.enemy.armor>0){dmg=Math.max(1,dmg-next.enemy.armor);result.enemyText=`硬殼減傷 ${next.enemy.armor}`;next.enemy.armor=0;}
      if(next.enemy.dodge){dmg=Math.max(1,Math.round(dmg*.45));result.enemyText='殘影閃避';next.enemy.dodge=false;}
      next.enemy.currentHp=Math.max(0,next.enemy.currentHp-dmg);result.amount=dmg;result.enemyDamage=dmg;
    }

    if(skill.effect==='break'&&!next.enemy.broken){
      const before=next.enemy.break;let v=skill.value;
      if(next.player.combo>=3&&next.pet.trait?.kind==='combo')v+=next.pet.evolved?1:0;
      if(next.player.roleId==='warrior'&&next.player.combo>=2){v+=1;result.roleText='戰士・破勢';}
      if(next.player.roleId==='mage'&&q.type==='spelling')v+=1;
      if(next.inventory.includes('break-charm')&&!next.usedBreakCharm){v+=1;next.usedBreakCharm=true;result.itemText='裂紋符・Break +1';}
      next.enemy.break=Math.min(next.enemy.breakMax,next.enemy.break+v);result.amount=next.enemy.break-before;
      if(next.enemy.break>=next.enemy.breakMax){next.enemy.broken=true;result.broke=true;}
    }

    if(skill.effect==='guard'){
      const before=next.player.guard;let v=skill.value;if(next.player.roleId==='mage'&&q.type==='spelling')v=Math.round(v*1.35);
      next.player.guard=Math.min(40,next.player.guard+v);result.amount=next.player.guard-before;
    }

    if(next.inventory.includes('echo-ring')&&q.type==='listening'){
      const before=next.player.guard;next.player.guard=Math.min(40,next.player.guard+6);const gained=next.player.guard-before;
      if(gained>0)result.itemText=`回音戒・護盾 +${gained}`;
    }
    petCorrect(next,result);
  }else{
    next.wrongCount+=1;
    if(next.inventory.includes('memory-leaf')&&!next.usedMemoryLeaf){next.usedMemoryLeaf=true;result.itemText='記憶葉・Combo 保留';}
    else next.player.combo=0;
    result.playerDamage=enemyTurn(next,result);
  }

  if(next.enemy.currentHp<=0){finishBattle(next,true);next.lastResult=result;return next;}
  if(next.enemy.broken)next.enemy.intent='失衡';else if(correct)result.playerDamage=enemyTurn(next,result);
  if(next.player.hp<=0){finishBattle(next,false);next.lastResult=result;return next;}

  next.turn+=1;next.currentQuestion=pickQuestion(next.wordStats,next.wordIds,next.bossFocus);next.questionStartedAt=Date.now();next.lastResult=result;return next;
}

function finishBattle(battle,won){
  battle.finished=true;battle.won=won;
  if(!won){battle.stars=0;return;}
  const total=Math.max(1,battle.correctCount+battle.wrongCount),accuracy=battle.correctCount/total;
  battle.stars=1+(accuracy>=.8?1:0)+(battle.player.hp>=50?1:0);
}

function pickWeightedWord(stats,wordIds,bossFocus){
  const allowed=WORDS.filter(w=>wordIds.includes(w.id));
  const pool=[];
  for(const w of allowed){
    const s=stats[w.id]||{correct:0,wrong:0};
    let weight=Math.max(1,1+(s.wrong||0)*2-Math.floor((s.correct||0)/3));
    if(bossFocus&&(s.wrong||0)>0)weight+=3+(s.wrong||0);
    for(let i=0;i<weight;i++)pool.push(w);
  }
  return pool[Math.floor(Math.random()*pool.length)]||allowed[0]||WORDS[0];
}
function reverseQuestion(w){const d=shuffle(WORDS.filter(x=>x.id!==w.id).map(x=>x.word)).slice(0,3);return {type:'reverse',label:'英譯',wordId:w.id,word:w.word,zh:w.zh,prompt:w.zh,answer:w.word,options:shuffle([w.word,...d])};}
function listeningQuestion(w){const d=shuffle(WORDS.filter(x=>x.id!==w.id).map(x=>x.word)).slice(0,3);return {type:'listening',label:'聽力',wordId:w.id,word:w.word,zh:w.zh,prompt:'🔊',answer:w.word,options:shuffle([w.word,...d])};}
function maskWord(word){if(word.length<=3)return `${word[0]} _ ${word[word.length-1]}`;const chars=[...word],ids=shuffle([...Array(word.length).keys()].slice(1,-1)).slice(0,Math.max(1,Math.floor(word.length/2)));ids.forEach(i=>chars[i]='_');return chars.join(' ');}
function norm(v){return String(v??'').trim().toLowerCase();}
function shuffle(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
function petCombo(b){if(b.pet.trait?.kind!=='combo'||b.player.combo<3)return 1;const t=b.pet.trait,base=b.pet.evolved?t.evolved:t.base;return 1+base+Math.min(.08,(b.pet.level-1)*.01);}
function petCorrect(b,r){if(b.pet.trait?.kind!=='guard')return;const chance=Math.min(.65,.28+b.pet.level*.03+(b.pet.evolved ? .15 : 0));if(Math.random()>chance)return;const v=(b.pet.evolved?b.pet.trait.evolved:b.pet.trait.base)+Math.floor(b.pet.level/3);b.player.guard=Math.min(40,b.player.guard+v);r.petText=`${b.pet.name} +${v} 護盾`;}

function enemyTurn(b,r){
  if(b.enemy.broken){b.enemy.broken=false;b.enemy.break=0;b.enemy.intent=b.enemy.intents?.[0]||'蓄力';r.enemyText='敵人失衡，無法行動';return 0;}
  const intent=b.enemy.intent;let base=12;
  if(b.enemy.id==='moss'){if(intent==='纏藤'){b.player.guard=Math.max(0,b.player.guard-8);base=8;r.enemyText='纏藤削弱護盾';}else base=intent==='蓄力'?18:12;}
  if(b.enemy.id==='rabbit'){if(intent==='殘影'){b.enemy.dodge=true;base=6;r.enemyText='下一次攻擊威力降低';}else base=intent==='突進'?16:18;}
  if(b.enemy.id==='bubble'){if(intent==='泡泡治癒'){b.enemy.currentHp=Math.min(b.enemy.hp,b.enemy.currentHp+12);base=5;r.enemyText='回復 12 HP';}else base=intent==='膨脹'?19:12;}
  if(b.enemy.id==='beetle'){if(intent==='硬殼'){b.enemy.armor=10;base=6;r.enemyText='下一次受到傷害 -10';}else base=intent==='角撞'?17:20;}
  if(b.enemy.id==='shadow'){if(intent==='暗語'){b.player.combo=0;base=10;r.enemyText='Combo 被清空';}else if(intent==='吞噬'){b.enemy.currentHp=Math.min(b.enemy.hp,b.enemy.currentHp+10);base=14;r.enemyText='吸收生命 +10';}else base=intent==='大招'?26:17;}
  const reduce=petReduction(b),damage=Math.max(0,base-b.player.guard-reduce);if(reduce>0&&damage<base)r.petText=`${b.pet.name} 減傷 ${reduce}`;b.player.hp=Math.max(0,b.player.hp-damage);b.player.guard=0;b.enemy.intent=pickIntent(b.enemy);return damage;
}
function petReduction(b){if(b.pet.trait?.kind!=='reduce')return 0;const t=b.pet.trait;return (b.pet.evolved?t.evolved:t.base)+Math.floor((b.pet.level-1)/2);}
function pickIntent(e){const a=e.intents?.length?e.intents:['蓄力','閃避','回復','護甲'];return a[Math.floor(Math.random()*a.length)];}
