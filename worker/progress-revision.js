import {cleanRpg} from '../src/rpg.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function cleanProgress(input={}){
  const level=clamp(Math.round(Number(input?.level)||1),1,50);
  return {
    role:['warrior','mage','archer'].includes(input?.role)?input.role:'warrior',
    pet:['fox','owl','dragon'].includes(input?.pet)?input.pet:'fox',
    level,
    xp:level>=50?0:Math.max(0,Math.round(Number(input?.xp)||0)),
    rpg:cleanRpg(input?.rpg)
  };
}

export function progressRecord(input={}){
  return {
    ...cleanProgress(input),
    revision:Math.max(0,Math.round(Number(input?.revision)||0))
  };
}

export function prepareProgressWrite(currentInput={},progressInput={},baseRevisionPresent=false,baseRevisionValue=null){
  const current=progressRecord(currentInput);
  const baseNumber=Number(baseRevisionValue);
  const hasValidBase=baseRevisionPresent&&Number.isInteger(baseNumber)&&baseNumber>=0;
  if(hasValidBase&&baseNumber!==current.revision){
    return {ok:false,status:409,error:'Progress conflict',current};
  }
  return {
    ok:true,
    status:200,
    progress:{...cleanProgress(progressInput),revision:current.revision+1}
  };
}
