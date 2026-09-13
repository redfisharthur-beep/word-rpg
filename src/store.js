const KEY='word-rpg-save-v1';

const initialState={
  session:{entered:false,loginMethod:'guest',roleChosen:false},
  player:{name:'',level:1,exp:0,hp:100,maxHp:100,role:'warrior',pet:'fox',coins:0,stones:0,talents:[]},
  pets:{
    fox:{level:1,evolved:false},
    owl:{level:1,evolved:false},
    dragon:{level:1,evolved:false},
  },
  progress:{unlockedStage:1,cleared:[],masteredWords:[],wordStats:{},stageStars:{}},
  inventory:['star-stone'],
};

export function loadState(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw) return structuredClone(initialState);
    const saved=JSON.parse(raw);
    return {
      ...structuredClone(initialState),
      ...saved,
      session:{...initialState.session,...saved.session},
      player:{...initialState.player,...saved.player,talents:Array.isArray(saved.player?.talents)?saved.player.talents:[]},
      pets:{
        fox:{...initialState.pets.fox,...saved.pets?.fox},
        owl:{...initialState.pets.owl,...saved.pets?.owl},
        dragon:{...initialState.pets.dragon,...saved.pets?.dragon},
      },
      progress:{...initialState.progress,...saved.progress,stageStars:{...initialState.progress.stageStars,...saved.progress?.stageStars}},
    };
  }catch{
    return structuredClone(initialState);
  }
}

export function saveState(state){
  localStorage.setItem(KEY,JSON.stringify(state));
}

export function resetState(){
  localStorage.removeItem(KEY);
  return structuredClone(initialState);
}
