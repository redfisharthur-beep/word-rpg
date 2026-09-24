import {ASSETS,preloadRoleAction} from './assets.js';
import {playSfx} from './audio.js';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let seq=0,activeFx=null;

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
  addClass(stage,'fx-hit-stop');await sleep(critical?90:38);removeClass(stage,'fx-hit-stop');
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

function makeFxSession(actor,target,stage,actorImg,original){
  const session={aborted:false,animations:new Set(),nodes:new Set(),actor,target,stage,actorImg,original,
    abort(){
      if(this.aborted)return;
      this.aborted=true;
      for(const animation of this.animations)animation.cancel();
      this.animations.clear();
      for(const node of this.nodes)node.remove();
      this.nodes.clear();
      this.actor?.classList.remove('fx-motion','fx-windup','fx-dash','fx-approach','fx-strike-1','fx-strike-2','fx-return','fx-support');
      this.target?.classList.remove('fx-knockback');
      this.stage?.classList.remove('fx-hit-stop','fx-shake','fx-shake-strong');
      this.actor?.style.removeProperty('transform');
      this.target?.style.removeProperty('transform');
      if(this.actorImg?.isConnected&&this.original)this.actorImg.src=this.original;
    }};
  return session;
}

async function moveFx(session,el,from,to,ms,easing='ease-out'){
  if(session.aborted||!el?.isConnected)return;
  if(!el.animate){
    el.style.transform=to;
    await sleep(ms);
    return;
  }
  const animation=el.animate([{transform:from},{transform:to}],{duration:ms,easing,fill:'forwards'});
  session.animations.add(animation);
  try{await animation.finished}catch{}
  session.animations.delete(animation);
  if(session.aborted)return;
  el.style.transform=to;
  animation.cancel();
}

function fxPose(x=0,sx=1,sy=sx){
  return `translate3d(${Math.round(x)}px,0,0) scale(${sx},${sy})`;
}

function addFxTrail(session,actorImg,stage,dir){
  if(session.aborted||!actorImg?.isConnected)return;
  const imageBox=actorImg.getBoundingClientRect(),stageBox=stage.getBoundingClientRect();
  for(let n=0;n<2;n++){
    const ghost=document.createElement('img');
    ghost.src=actorImg.currentSrc||actorImg.src;
    ghost.alt='';
    ghost.setAttribute('aria-hidden','true');
    ghost.className='fx-afterimage';
    ghost.style.left=`${imageBox.left-stageBox.left-dir*(n+1)*12}px`;
    ghost.style.top=`${imageBox.top-stageBox.top}px`;
    ghost.style.width=`${imageBox.width}px`;
    ghost.style.height=`${imageBox.height}px`;
    ghost.style.setProperty('--fx-trail-x',`${-dir*(12+n*9)}px`);
    ghost.style.animationDelay=`${n*22}ms`;
    stage.appendChild(ghost);
    session.nodes.add(ghost);
    setTimeout(()=>{ghost.remove();session.nodes.delete(ghost)},230);
  }
}

async function flyFx(session,actorImg,target,stage,dir,kind){
  if(session.aborted)return;
  const a=actorImg.getBoundingClientRect(),t=target.querySelector('img.fighter-art')?.getBoundingClientRect()||target.getBoundingClientRect(),s=stage.getBoundingClientRect();
  const shot=document.createElement('span');
  shot.className=`fx-projectile fx-projectile-${kind}`;
  shot.setAttribute('aria-hidden','true');
  shot.style.left=`${a.left-s.left+a.width*(dir>0?.75:.25)}px`;
  shot.style.top=`${a.top-s.top+a.height*.4}px`;
  if(dir<0)shot.style.setProperty('--fx-projectile-turn','-1');
  stage.appendChild(shot);
  session.nodes.add(shot);
  const dx=t.left+t.width*.5-(a.left+a.width*(dir>0?.75:.25));
  const dy=t.top+t.height*.43-(a.top+a.height*.4);
  if(shot.animate){
    const flight=shot.animate([{transform:'translate3d(0,0,0) scale(.75)',opacity:.65},{transform:`translate3d(${dx}px,${dy}px,0) scale(1.05)`,opacity:1}],{duration:kind==='magic'?200:150,easing:'linear',fill:'forwards'});
    session.animations.add(flight);
    try{await flight.finished}catch{}
    session.animations.delete(flight);
    flight.cancel();
  }else await sleep(kind==='magic'?200:150);
  shot.remove();
  session.nodes.delete(shot);
}

export async function playBattleStep({step,previous,role='warrior',duration=950}={}){
  if(!step||typeof document==='undefined')return;
  // A new step must not leave the previous actor displaced, even when a screen is re-rendered.
  cancelBattleFx();
  const token=++seq,{actor,target,stage,actorImg}=fighterParts(step.who);
  if(!actor||!target||!stage)return;
  const original=actorImg?.getAttribute('src')||'';
  const session=makeFxSession(actor,target,stage,actorImg,original);
  activeFx=session;
  const valid=()=>token===seq&&!session.aborted&&actor.isConnected&&target.isConnected;
  const logs=step.logs||[];
  const critical=logs.some(x=>String(x).includes('爆擊'));
  const delta=impactValue(step,previous);
  const supportive=logs.some(x=>/回血|護盾|回復|防禦|治療/.test(String(x)))&&!logs.some(x=>/攻擊|傷害|重擊|連擊/.test(String(x)))&&delta.damage===0;
  const actorRole=step.who==='player'?role:step.enemy?.role;
  const frames=roleFrames(actorRole);
  const framedAttack=!supportive&&actorImg&&frames?.[0]&&frames?.[1];
  const ranged=actorRole==='mage'||actorRole==='archer';
  const dir=target.getBoundingClientRect().left>actor.getBoundingClientRect().left?1:-1;
  const reduce=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const profile=actorRole==='warrior'?{back:9,prep:85,strike:100,recover:190,limit:190}:actorRole==='archer'?{back:7,prep:90,strike:105,recover:135,limit:12}:actorRole==='mage'?{back:5,prep:115,strike:120,recover:165,limit:8}:{back:7,prep:75,strike:105,recover:160,limit:62};
  const back=fxPose(-dir*profile.back,.97,1.025),idle=fxPose(),reach=targetOffset(actor,target);
  // Target-offset already carries its direction. Clamp the dash so phones do not crop the sprite.
  const maxReach=Math.max(30,Math.min(profile.limit,stage.getBoundingClientRect().width*.34));
  const dash=framedAttack&&!ranged?Math.sign(reach||dir)*Math.min(maxReach,Math.max(28,Math.abs(reach))):dir*profile.limit;
  const lunged=fxPose(dash,1.045,.965),held=fxPose(dash,1.015,1);
  const hits=step.ultimate?Math.max(1,Math.min(3,step.hits||2)):step.card?.id==='combo'?3:Array.isArray(step.card?.fx?.hits)?Math.max(1,Math.min(4,step.card.fx.hits.length)):1;
  try{
    actor.classList.add('fx-motion');
    if(framedAttack){
      // Decode the same two original PNGs before the first frame swap, avoiding a mobile decode hitch.
      await Promise.race([preloadRoleAction(actorRole),sleep(480)]);
      if(!valid())return;
      actorImg.src=frames[0];
    }
    const pet=step.who==='player'?step.player?.pet:step.enemy?.pet;
    if(pet&&step.card&&/靈狐|夜梟|幼龍|龍息|狐|梟/.test(logs.join(' '))){
      const src=ASSETS.pet?.[pet];
      if(src){const image=document.createElement('img');image.src=src;image.alt='';image.className=`fx-pet-assist pet-${pet}`;actor.appendChild(image);session.nodes.add(image);setTimeout(()=>{image.remove();session.nodes.delete(image)},850);playSfx('pet')}
    }
    if(supportive){
      playSfx('pet');
      await moveFx(session,actor,idle,fxPose(0,1.04,1.04),reduce?30:145,'ease-out');
      if(!valid())return;
      effect(actor,delta.heal>0?'heal':'guard');
      if(delta.heal)popNumber(actor,`+${delta.heal}`);else if(delta.shield)popNumber(actor,`+${delta.shield}`);
      playSfx('loot');
      await moveFx(session,actor,fxPose(0,1.04,1.04),idle,reduce?30:160,'ease-in-out');
      return;
    }
    // Anticipation -> continuous forward acceleration -> held contact; no competing CSS lunge.
    await moveFx(session,actor,idle,back,reduce?25:profile.prep,'cubic-bezier(.2,.1,.5,1)');
    if(!valid())return;
    if(framedAttack)actorImg.src=frames[1];
    if(framedAttack&&!ranged&&!reduce)addFxTrail(session,actorImg,stage,dir);
    playSfx('swing');
    await moveFx(session,actor,back,lunged,reduce?40:profile.strike,'cubic-bezier(.12,.82,.17,1)');
    if(!valid())return;
    for(let n=0;n<hits;n++){
      if(!valid())return;
      if(n>0){
        if(framedAttack)actorImg.src=frames[0];
        await moveFx(session,actor,held,fxPose(dash-dir*7,.965,1.03),reduce?25:55,'ease-in');
        if(!valid())return;
        if(framedAttack)actorImg.src=frames[1];
        playSfx('swing');
        await moveFx(session,actor,fxPose(dash-dir*7,.965,1.03),lunged,reduce?35:75,'cubic-bezier(.12,.82,.17,1)');
        if(!valid())return;
      }
      if(ranged&&!reduce)await flyFx(session,actorImg||actor,target,stage,dir,actorRole==='mage'?'magic':'arrow');
      if(!valid())return;
      effect(target,n===hits-1&&critical?'crit':'slash');
      flash(target,critical&&n===hits-1);
      shake(stage,critical&&n===hits-1);
      if(n===hits-1&&!reduce)addFxTrail(session,actorImg||actor.querySelector('img'),stage,dir);
      const recoil=reduce?8:critical?21:13;
      const knocked=fxPose(dir*recoil,.99,1.02);
      const knock=moveFx(session,target,idle,knocked,reduce?25:85,'ease-out');
      playSfx(n===hits-1&&critical?'crit':hits>1?'combo':'hit');
      if(delta.damage){
        const each=Math.floor(delta.damage/hits);
        const value=n===hits-1?delta.damage-each*(hits-1):each;
        if(value>0)popNumber(target,`-${value}`,critical&&n===hits-1);
      }
      await sleep(reduce?20:critical&&n===hits-1?92:48);
      if(!valid())return;
      await knock;
      if(!valid())return;
      await moveFx(session,target,knocked,idle,reduce?25:115,'cubic-bezier(.2,.8,.2,1)');
      if(!valid())return;
      if(n<hits-1){
        await moveFx(session,actor,lunged,held,reduce?15:32,'ease-out');
        if(!valid())return;
      }
    }
    await moveFx(session,actor,lunged,idle,reduce?45:profile.recover,'cubic-bezier(.35,.05,.3,1)');
  }finally{
    session.abort();
    if(activeFx===session)activeFx=null;
  }
}

export function playUltimateIntro(role='warrior'){
  const stage=document.querySelector('.action-screen .combat-stage');
  if(!stage)return;stage.dataset.ultimate=role;addClass(stage,'fx-ultimate');playSfx(`ultimate-${role}`);setTimeout(()=>removeClass(stage,'fx-ultimate'),720);
}

export function playLootReveal(quality='common'){
  playSfx(quality==='mythic'?'mythic':'loot');
}

export function cancelBattleFx(){seq++;if(activeFx){activeFx.abort();activeFx=null;}}
