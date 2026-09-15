const TRACKS={menu:'/audio/word-rpg.mp3',fight:'/audio/fight.mp3'};
let player=null,currentMode='none',unlocked=false;

function ensurePlayer(){
  if(player)return player;
  player=new Audio();
  player.loop=true;
  player.preload='auto';
  player.volume=.38;
  return player;
}

function tryPlay(){
  if(currentMode==='none')return;
  const audio=ensurePlayer(),src=TRACKS[currentMode];
  if(!src)return;
  if(audio.getAttribute('src')!==src){audio.src=src;audio.currentTime=0}
  const p=audio.play();
  if(p?.catch)p.catch(()=>{});
}

export function setMusic(mode='none'){
  currentMode=TRACKS[mode]?mode:'none';
  const audio=ensurePlayer();
  if(currentMode==='none'){audio.pause();return}
  if(unlocked)tryPlay();
}

function unlockAudio(){
  unlocked=true;
  tryPlay();
}

document.addEventListener('pointerdown',unlockAudio,{once:true,capture:true});
document.addEventListener('keydown',unlockAudio,{once:true,capture:true});
