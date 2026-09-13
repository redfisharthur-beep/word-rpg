import { SKILLS, WORDS } from './game-data.js';

export function createBattle(stage){
  return {
    stageId:stage.id,
    enemy:{...stage.enemy,currentHp:stage.enemy.hp,break:0,broken:false},
    player:{hp:100,maxHp:100,guard:0,combo:0},
    selectedSkill:'strike',
    turn:1,
    finished:false,
    won:false,
    currentWord:pickWord(),
    lastResult:null,
  };
}

export function pickWord(){
  return WORDS[Math.floor(Math.random()*WORDS.length)];
}

export function chooseSkill(battle,skillId){
  if(!SKILLS.some(s=>s.id===skillId)) return battle;
  return {...battle,selectedSkill:skillId,lastResult:null};
}

export function resolveAnswer(battle,answer){
  if(battle.finished) return battle;
  const correct=answer===battle.currentWord.zh;
  const skill=SKILLS.find(s=>s.id===battle.selectedSkill) || SKILLS[0];
  const next=structuredClone(battle);
  const result={correct,answer,word:battle.currentWord.word,zh:battle.currentWord.zh,effect:skill.effect,amount:0,enemyDamage:0,playerDamage:0,broke:false};

  if(correct){
    next.player.combo+=1;
    if(skill.effect==='damage'){
      const bonus=next.enemy.broken?1.8:1;
      const comboBonus=next.player.combo>=3?1.2:1;
      const damage=Math.round(skill.value*bonus*comboBonus);
      next.enemy.currentHp=Math.max(0,next.enemy.currentHp-damage);
      result.amount=damage;
      result.enemyDamage=damage;
    }
    if(skill.effect==='break' && !next.enemy.broken){
      const before=next.enemy.break;
      next.enemy.break=Math.min(next.enemy.breakMax,next.enemy.break+skill.value);
      result.amount=next.enemy.break-before;
      if(next.enemy.break>=next.enemy.breakMax){
        next.enemy.broken=true;
        result.broke=true;
      }
    }
    if(skill.effect==='guard'){
      const before=next.player.guard;
      next.player.guard=Math.min(40,next.player.guard+skill.value);
      result.amount=next.player.guard-before;
    }
  }else{
    next.player.combo=0;
    result.playerDamage=enemyTurn(next);
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
    result.playerDamage=enemyTurn(next);
  }

  if(next.player.hp<=0){
    next.finished=true;
    next.won=false;
    next.lastResult=result;
    return next;
  }

  next.turn+=1;
  next.currentWord=pickWord();
  next.lastResult=result;
  return next;
}

function enemyTurn(battle){
  if(battle.enemy.broken){
    battle.enemy.broken=false;
    battle.enemy.break=0;
    battle.enemy.intent='蓄力';
    return 0;
  }
  const base=battle.enemy.intent==='大招'?24:battle.enemy.intent==='蓄力'?18:12;
  const damage=Math.max(0,base-battle.player.guard);
  battle.player.hp=Math.max(0,battle.player.hp-damage);
  battle.player.guard=0;
  const intents=['蓄力','閃避','回復','護甲'];
  battle.enemy.intent=intents[Math.floor(Math.random()*intents.length)];
  if(battle.enemy.intent==='回復'){
    battle.enemy.currentHp=Math.min(battle.enemy.hp,battle.enemy.currentHp+8);
  }
  return damage;
}
