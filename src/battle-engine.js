import { SKILLS, WORDS, PETS } from './game-data.js';

export function createBattle(stage, context={}){
  const pet=PETS.find(p=>p.id===context.petId) || PETS[0];
  const petLevel=Math.max(1,context.petLevel||1);
  return {
    stageId:stage.id,
    enemy:{...stage.enemy,currentHp:stage.enemy.hp,break:0,broken:false,dodge:false,armor:0},
    player:{hp:100,maxHp:100,guard:0,combo:0},
    pet:{id:pet.id,name:pet.name,level:petLevel,evolved:!!context.petEvolved,trait:pet.combat},
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
  const result={correct,answer,word:battle.currentWord.word,zh:battle.currentWord.zh,effect:skill.effect,amount:0,enemyDamage:0,playerDamage:0,broke:false,petText:'',enemyText:''};

  if(correct){
    next.player.combo+=1;
    if(skill.effect==='damage'){
      const brokenBonus=next.enemy.broken?1.8:1;
      const comboBonus=next.player.combo>=3?1.2:1;
      const petBonus=getPetComboBonus(next);
      let damage=Math.round(skill.value*brokenBonus*comboBonus*petBonus);
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
      next.enemy.break=Math.min(next.enemy.breakMax,next.enemy.break+breakValue);
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
  next.currentWord=pickWord();
  next.lastResult=result;
  return next;
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
