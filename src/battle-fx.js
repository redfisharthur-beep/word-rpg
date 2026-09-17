import {ASSETS} from './assets.js';
import {playSfx} from './audio.js';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let seq=0;

function fighterParts(who){
  const actor=document.querySelector(`.action-screen .fighter.${who==='player'?'hero':'enemy'}`);
  const target=document.querySelector(`.action-screen .fighter.${who==='player'?'enemy':'hero'}`);
  const stage=document.querySelector('.action-screen .combat-stage');
  return {actor,target,stage,actorImg:actor?.querySelector('img.fighter-art')||null};
}
function addClass(el,name){if(el)el.classList.add(name)}
function removeClass(el,name){if(el)el.classList.remove(name)}
function roleFrames(role){return ASSETS.roleAction?.[role]||null}
function impactValue(step,previous){
  if(!step||!previous)return {damage:0,heal:0,shield:0};
  const mine=step.who==='player';
  const beforeTarget=mine?previous.enemy:previous.player,afterTarget=mine?step.enemy:step.player;
  const beforeActor=mine?previous.player:previous.enemy,afterActor=mine?step.player:step.enemy;
  const damage=Math.max(0,Math.round(((beforeTarget?.hp||0)+(beforeTarget?.shield||0))-((afterTarget?.hp||0)+(afterTarget?.shield||0))));
  const heal=Math.max(0,Math.round((afterActor?.hp||0)-(beforeActor?.hp||0)));
  const shield=Math.max(0,Math.round((afterActor?.shield||0)-(beforeActor?.shield||0)));
  return {damage,heal,shield};
}
function popNumber(target,text,critical=false){
  if(!target||!text)return;
  const n=document.createElement('span');n.className=`fx-pop ${critical?'critical':''}`;n.textContent=text;target.appendChild(n);setTimeout(()=>n.remove(),820);
}
function flash(target,critical=false){
  if(!target)return;addClass(target,critical?'fx-critical-hit':'fx-hit');setTimeout(()=>removeClass(target,critical?'fx-critical-hit':'fx-hit'),critical?260:180);
}
function shake(stage,strong=false){
  if(!stage)return;addClass(stage,strong?'fx-shake-strong':'fx-shake');setTimeout(()=>removeClass(stage,strong?'fx-shake-strong':'fx-shake'),strong?260:160);
}
async function hitStop(stage,critical){
  if(!critical)return;addClass(stage,'fx-hit-stop');await sleep(80);removeClass(stage,'fx-hit-stop');
}
function effect(target,kind='slash'){
  const src=ASSETS.effect?.[kind]||ASSETS.effect?.slash;if(!target||!src)return;
  const img=document.createElement('img');img.className=`fx-impact fx-${kind}`;img.src=src;img.alt='';target.appendChild(img);setTimeout(()=>img.remove(),520);
}
function targetOffset(actor,target){
  const a=actor?.getBoundingClientRect(),t=target?.getBoundingClientRect();
  if(!a||!t)return 0;
  const ac=a.left+a.width/2,tc=t.left+t.width/2,overlap=Math.min(26,Math.max(14,t.width*.08));
  return tc>=ac?Math.round(t.left-a.right+overlap):Math.round(t.right-a.left-overlap);
}
function clearAttackPose(actor){
  if(!actor)return;
  removeClass(actor,'fx-windup');
  removeClass(actor,'fx-dash');
  removeClass(actor,'fx-approach');
  removeClass(actor,'fx-strike-1');
  removeClass(actor,'fx-strike-2');
  removeClass(actor,'fx-return');
  actor.style.removeProperty('--fx-target-x');
}

export async function playBattleStep({step,previous,role='warrior',duration=1500}={}){
  if(!step||typeof document==='undefined')return;
  const token=++seq,{actor,target,stage,actorImg}=fighterParts(step.who);
  if(!actor||!target||!stage)return;
  const logs=step.logs||[],critical=logs.some(x=>String(x).includes('爆擊')),supportive=logs.some(x=>/回血|護盾|回復|防禦|治療/.test(String(x)))&&!logs.some(x=>/攻擊|傷害|重擊|連擊/.test(String(x)));
  const delta=impactValue(step,previous),frames=step.who==='player'?roleFrames(role):null,original=actorImg?.getAttribute('src')||'';
  const framedAttack=!supportive&&actorImg&&frames?.[0]&&frames?.[1];
  const warriorRush=framedAttack&&step.who==='player'&&role==='warrior';

  if(framedAttack){
    clearAttackPose(actor);
    addClass(actor,'fx-windup');
    await sleep(160);if(token!==seq)return;
    removeClass(actor,'fx-windup');

    if(warriorRush){
      actor.style.setProperty('--fx-target-x',`${targetOffset(actor,target)}px`);
      addClass(actor,'fx-approach');
      await sleep(240);if(token!==seq)return;
    }

    actorImg.src=frames[0];
    addClass(actor,'fx-strike-1');
    playSfx('swing');
    await sleep(800);if(token!==seq)return;

    removeClass(actor,'fx-strike-1');
    actorImg.src=frames[1];
    addClass(actor,'fx-strike-2');
    playSfx('swing');
    await sleep(800);if(token!==seq)return;

    effect(target,critical?'crit':'slash');
    flash(target,critical);
    addClass(target,'fx-knockback');
    setTimeout(()=>removeClass(target,'fx-knockback'),260);
    shake(stage,critical);
    await hitStop(stage,critical);
    playSfx(critical?'crit':'hit');
    if(delta.damage)popNumber(target,`-${delta.damage}`,critical);

    await sleep(120);if(token!==seq)return;
    removeClass(actor,'fx-strike-2');

    if(warriorRush){
      removeClass(actor,'fx-approach');
      addClass(actor,'fx-return');
      await sleep(240);if(token!==seq)return;
    }

    clearAttackPose(actor);
    if(actorImg&&original)actorImg.src=original;
    return;
  }

  addClass(actor,'fx-windup');
  playSfx(supportive?'loot':'swing');
  await sleep(Math.min(420,duration*.28));if(token!==seq)return;
  removeClass(actor,'fx-windup');addClass(actor,'fx-dash');
  await sleep(Math.min(360,duration*.24));if(token!==seq)return;
  removeClass(actor,'fx-dash');
  if(supportive){effect(actor,delta.heal>0?'heal':'guard');if(delta.heal)popNumber(actor,`+${delta.heal}`);else if(delta.shield)popNumber(actor,`+${delta.shield}`);playSfx('loot');addClass(actor,'fx-support');setTimeout(()=>removeClass(actor,'fx-support'),420)}
  else{
    effect(target,critical?'crit':'slash');flash(target,critical);addClass(target,'fx-knockback');setTimeout(()=>removeClass(target,'fx-knockback'),260);shake(stage,critical);await hitStop(stage,critical);playSfx(critical?'crit':'hit');if(delta.damage)popNumber(target,`-${delta.damage}`,critical);
  }
  await sleep(Math.max(160,duration-780));if(token!==seq)return;
  if(actorImg&&original)actorImg.src=original;
  clearAttackPose(actor);
}

export function playUltimateIntro(role='warrior'){
  const stage=document.querySelector('.action-screen .combat-stage');
  if(!stage)return;stage.dataset.ultimate=role;addClass(stage,'fx-ultimate');playSfx('ultimate');setTimeout(()=>removeClass(stage,'fx-ultimate'),720);
}

export function playLootReveal(quality='common'){
  playSfx(quality==='mythic'?'mythic':'loot');
}

export function cancelBattleFx(){seq++;}
