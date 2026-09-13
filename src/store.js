const KEY='word-rpg-save-v1';

const initialState={
  player:{name:'勇者',level:1,exp:0,hp:100,maxHp:100,role:'warrior',pet:'fox',coins:0,stones:0},
  progress:{unlockedStage:1,cleared:[],masteredWords:[],wordStats:{}},
  inventory:['star-stone'],
};

export function loadState(){
  try{
    const raw=localStorage.getItem(KEY);
    return raw?{...structuredClone(initialState),...JSON.parse(raw)}:structuredClone(initialState);
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
