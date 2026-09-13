import { SKILLS, WORDS, PETS } from './game-data.js';

export function createBattle(stage, context={}){
  const pet=PETS.find(p=>p.id===context.petId) || PETS[0];
  const petLevel=Math.max(1,context.petLevel||1);
  const question=pickQuestion(context.wordStats||{});
  return {
    stageId:stage.id,
    enemy:{...stage.enemy,currentHp:stage.enemy.hp,break:0,broken:false,dodge:false,armor:0},
    player:{hp:100,maxHp:100,guard:0,combo:0,roleId:context.roleId||'warrior'},
    pet:{id:pet.id,name:pet.name,level:petLevel,evolved:!!context.petEvolved,trait:pet.combat},
    selectedSkill:'strike',
    turn:1,
    finished:false,
    won:false,
    wordStats:context.wordStats||{},
    currentQuestion:question,
    questionStartedAt:Date.now(),
    lastResult:null,
  };
}

export function pickQuestion(wordStats={}){
  const word=pickWeightedWord(wordStats);
  const roll=Math.random();
  if(roll<.34) return buildMeaningQuestion(word);
  if(roll<.58) return buildReverseQuestion(word);
  if(roll<.80) return buildSpellingQuestion(word);
  return buildListeningQuestion(word);
}

export function chooseSkill(battle,skillId){
  if(!SKILLS.some(s=>s.id===skillId)) return battle;
  return {...battle,selectedSkill:skillId,lastResult:null};
}

export function resolveAnswer(battle,answer){
  if(battle.finished) return battle;
  const question=battle.currentQuestion;
  const correct=normalize(answer)===normalize(question.answer);
  const skill=SKILLS.find(s=>s.id===battle.selectedSkill) || SKILLS[0];
  const next=structuredClone(battle);
  const elapsed=(Date.now()-battle.questionStartedAt)/1000;
  const result={correct,answer,word:question.word,zh:question.zh,questionType:question.type,effect:skill.effect,amount:0,enemyDamage:0,playerDamage:0,broke:false,petText:'',enemyText:'',roleText:''};

  if(correct){
    next.player.combo+=1;
    let roleMultiplier=1;
    if(next.player.roleId==='mage'&&question.type==='spelling'){
      roleMultiplier=1.35;
      result.roleText='法師・拼字共鳴';
    }
    if(next.player.roleId==='archer'&&elapsed<=7){
      next.player.combo+=1;
      roleMultiplier*=1.12;
      result.roleText='弓手・迅捷連擊';
    }

    if(skill.effect==='damage'){
      const brokenBonus=next.enemy.broken?1.8:1;
      const comboBonus=next.player.combo>=3?1.2:1;
      const petBonus=getPetComboBonus(next);
      let damage=Math.round(skill.value*brokenBonus*comboBonus*petBonus*roleMultiplier);
      if(next.enemy.armor>0){
        damage=Math.max(1,damage-next.enemy.armor);
        result.enemyText=`硬殼減傷 ${next.enemy.armor}`;
        next.enemy.armor=0;
      }
      if(next.enemy.dodge){
        damage=Math.max(1,Math.round(damage*.45));
        result.enemyText='殘影閃避';
        next.enemy.dodge=false;
      }
      next.enemy.currentHp=Math.max(0,next.enemy.currentHp-damage);
      result.amount=damage;
      result.enemyDamage=damage;
    }
    if(skill.effect==='break' && !next.enemy.broken){
      const before=next.enemy.break;
      let breakValue=skill.value;
      if(next.player.combo>=3 && next.pet.trait?.kind==='combo') breakValue+=next.pet.evolved?1:0;
      if(next.player.roleId==='warrior'&&next.player.combo>=2){
        breakValue+=1;
        result.roleText='戰士・破勢';
      }
      if(next.player.roleId==='mage'&&question.type==='spelling') breakValue+=1;
      next.enemy.break=Math.min(next.enemy.breakMax,next.enemy.break+breakValue);
      result.amount=next.enemy.break-before;
      if(next.enemy.break>=next.enemy.breakMax){
        next.enemy.broken=true;
        result.broke=true;
      }
    }
    if(skill.effect==='guard'){
      const before=next.player.guard;
      let guardValue=skill.value;
      if(next.player.roleId==='mage'&&question.type==='spelling') guardValue=Math.round(guardValue*1.35);
      next.player.guard=Math.min(40,next.player.guard+guardValue);
      result.amount=next.player.guard-before;
    }
    applyPetCorrect(next,result);
  }else{
    next.player.combo=0;
    result.playerDamage=enemyTurn(next,result);
  }

  if(next.enemy.currentHp<=0){
    next.finished=true;
    next.won=true;
    next.lastResult=result;
    return next;
  }

  if(next.enemy.broken){
    next.enemy.intent='失衡';
  }else if(correct){
    result.playerDamage=enemyTurn(next,result);
  }

  if(next.player.hp<=0){
    next.finished=true;
    next.won=false;
    next.lastResult=result;
    return next;
  }

  next.turn+=1;
  next.currentQuestion=pickQuestion(next.wordStats);
  next.questionStartedAt=Date.now();
  next.lastResult=result;
  return next;
}

function pickWeightedWord(wordStats){
  const pool=[];
  for(const word of WORDS){
    const stats=wordStats[word.id]||{correct:0,wrong:0};
    const weight=Math.max(1,1+(stats.wrong||0)*2-Math.floor((stats.correct||0)/3));
    for(let i=0;i<weight;i++) pool.push(word);
  }
  return pool[Math.floor(Math.random()*pool.length)]||WORDS[0];
}

function buildMeaningQuestion(word){
  return {type:'meaning',label:'意思',wordId:word.id,word:word.word,zh:word.zh,prompt:word.word,answer:word.zh,options:[...word.options]};
}

function buildReverseQuestion(word){
  const distractors=shuffle(WORDS.filter(w=>w.id!==word.id).map(w=>w.word)).slice(0,3);
  return {type:'reverse',label:'英譯',wordId:word.id,word:word.word,zh:word.zh,prompt:word.zh,answer:word.word,options:shuffle([word.word,...distractors])};
}

function buildSpellingQuestion(word){
  const hidden=maskWord(word.word);
  return {type:'spelling',label:'拼字',wordId:word.id,word:word.word,zh:word.zh,prompt:hidden,answer:word.word,options:[]};
}

function buildListeningQuestion(word){
  const distractors=shuffle(WORDS.filter(w=>w.id!==word.id).map(w=>w.word)).slice(0,3);
  return {type:'listening',label:'聽力',wordId:word.id,word:word.word,zh:word.zh,prompt:'🔊',answer:word.word,options:shuffle([word.word,...distractors])};
}

function maskWord(word){
  if(word.length<=3) return `${word[0]} _ ${word[word.length-1]}`;
  const chars=[...word];
  const hideCount=Math.max(1,Math.floor(word.length/2));
  const indexes=shuffle([...Array(word.length).keys()].slice(1,-1)).slice(0,hideCount);
  indexes.forEach(i=>chars[i]='_');
  return chars.join(' ');
}

function normalize(value){
  return String(value??'').trim().toLowerCase();
}

function shuffle(arr){
  const copy=[...arr];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

function getPetComboBonus(battle){
  if(battle.pet.trait?.kind!=='combo' || battle.player.combo<3) return 1;
  const trait=battle.pet.trait;
  const base=battle.pet.evolved?trait.evolved:trait.base;
  const levelBonus=Math.min(.08,(battle.pet.level-1)*.01);
  return 1+base+levelBonus;
}

function applyPetCorrect(battle,result){
  if(battle.pet.trait?.kind!=='guard') return;
  const chance=Math.min(.65,.28+battle.pet.level*.03+(battle.pet.evolved?.15:0));
  if(Math.random()>chance) return;
  const value=(battle.pet.evolved?battle.pet.trait.evolved:battle.pet.trait.base)+Math.floor(battle.pet.level/3);
  battle.player.guard=Math.min(40,battle.player.guard+value);
  result.petText=`${battle.pet.name} +${value} 護盾`;
}

function enemyTurn(battle,result){
  if(battle.enemy.broken){
    battle.enemy.broken=false;
    battle.enemy.break=0;
    battle.enemy.intent=battle.enemy.intents?.[0] || '蓄力';
    result.enemyText='敵人失衡，無法行動';
    return 0;
  }

  const intent=battle.enemy.intent;
  let base=12;

  if(battle.enemy.id==='moss'){
    if(intent==='纏藤'){
      battle.player.guard=Math.max(0,battle.player.guard-8);
      base=8;
      result.enemyText='纏藤削弱護盾';
    }else if(intent==='蓄力') base=18;
    else base=12;
  }

  if(battle.enemy.id==='rabbit'){
    if(intent==='殘影'){
      battle.enemy.dodge=true;
      base=6;
      result.enemyText='下一次攻擊威力降低';
    }else if(intent==='突進') base=16;
    else base=18;
  }

  if(battle.enemy.id==='bubble'){
    if(intent==='泡泡治癒'){
      const heal=12;
      battle.enemy.currentHp=Math.min(battle.enemy.hp,battle.enemy.currentHp+heal);
      base=5;
      result.enemyText=`回復 ${heal} HP`;
    }else if(intent==='膨脹') base=19;
    else base=12;
  }

  if(battle.enemy.id==='beetle'){
    if(intent==='硬殼'){
      battle.enemy.armor=10;
      base=6;
      result.enemyText='下一次受到傷害 -10';
    }else if(intent==='角撞') base=17;
    else base=20;
  }

  if(battle.enemy.id==='shadow'){
    if(intent==='暗語'){
      battle.player.combo=0;
      base=10;
      result.enemyText='Combo 被清空';
    }else if(intent==='吞噬'){
      battle.enemy.currentHp=Math.min(battle.enemy.hp,battle.enemy.currentHp+10);
      base=14;
      result.enemyText='吸收生命 +10';
    }else if(intent==='大招') base=26;
    else base=17;
  }

  const petReduction=getPetReduction(battle);
  const damage=Math.max(0,base-battle.player.guard-petReduction);
  if(petReduction>0 && damage<base) result.petText=`${battle.pet.name} 減傷 ${petReduction}`;
  battle.player.hp=Math.max(0,battle.player.hp-damage);
  battle.player.guard=0;
  battle.enemy.intent=pickIntent(battle.enemy);
  return damage;
}

function getPetReduction(battle){
  if(battle.pet.trait?.kind!=='reduce') return 0;
  const trait=battle.pet.trait;
  const base=battle.pet.evolved?trait.evolved:trait.base;
  return base+Math.floor((battle.pet.level-1)/2);
}

function pickIntent(enemy){
  const intents=enemy.intents?.length?enemy.intents:['蓄力','閃避','回復','護甲'];
  return intents[Math.floor(Math.random()*intents.length)];
}
