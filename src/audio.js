const TRACKS={menu:'/audio/word%20rpg.mp3',fight:'/audio/fight.mp3'};
let player=null,currentMode='none',unlocked=false,audioCtx=null;

function ensurePlayer(){
  if(player)return player;
  player=new Audio();
  player.loop=true;
  player.preload='auto';
  player.volume=.38;
  return player;
}

function ensureContext(){
  if(!unlocked)return null;
  const Ctx=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Ctx)return null;
  if(!audioCtx)audioCtx=new Ctx();
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  return audioCtx;
}

function tryPlay(){
  if(currentMode==='none')return;
  const audio=ensurePlayer(),src=TRACKS[currentMode];
  if(!src)return;
  if(audio.getAttribute('src')!==src){audio.src=src;audio.currentTime=0}
  const p=audio.play();
  if(p?.catch)p.catch(()=>{});
}

function tone({freq=220,endFreq=freq,duration=.08,type='sine',gain=.08,delay=0}={}){
  const ctx=ensureContext();if(!ctx)return;
  const start=ctx.currentTime+delay,osc=ctx.createOscillator(),vol=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(Math.max(30,freq),start);osc.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),start+duration);
  vol.gain.setValueAtTime(.0001,start);vol.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),start+.008);vol.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(vol);vol.connect(ctx.destination);osc.start(start);osc.stop(start+duration+.02);
}

function noise({duration=.07,gain=.045,delay=0,highpass=500}={}){
  const ctx=ensureContext();if(!ctx)return;
  const length=Math.max(1,Math.floor(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),ch=buffer.getChannelData(0);
  for(let i=0;i<length;i++)ch[i]=(Math.random()*2-1)*(1-i/length);
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),vol=ctx.createGain(),start=ctx.currentTime+delay;
  source.buffer=buffer;filter.type='highpass';filter.frequency.value=highpass;vol.gain.setValueAtTime(gain,start);vol.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.connect(filter);filter.connect(vol);vol.connect(ctx.destination);source.start(start);
}

export function playSfx(kind='hit'){
  if(!unlocked)return;
  if(kind==='swing'){
    noise({duration:.10,gain:.035,highpass:900});tone({freq:520,endFreq:180,duration:.11,type:'triangle',gain:.035});
  }else if(kind==='hit'){
    noise({duration:.055,gain:.06,highpass:350});tone({freq:150,endFreq:70,duration:.09,type:'square',gain:.045});
  }else if(kind==='crit'){
    noise({duration:.11,gain:.075,highpass:260});tone({freq:120,endFreq:45,duration:.16,type:'sawtooth',gain:.065});tone({freq:720,endFreq:240,duration:.10,type:'triangle',gain:.03,delay:.015});
  }else if(kind==='ultimate'){
    tone({freq:90,endFreq:180,duration:.32,type:'sawtooth',gain:.045});tone({freq:280,endFreq:760,duration:.34,type:'triangle',gain:.035,delay:.05});
  }else if(kind==='loot'){
    tone({freq:440,endFreq:660,duration:.15,type:'sine',gain:.035});tone({freq:660,endFreq:990,duration:.20,type:'sine',gain:.035,delay:.12});
  }else if(kind==='mythic'){
    tone({freq:110,endFreq:70,duration:.36,type:'sawtooth',gain:.045});tone({freq:523,endFreq:1046,duration:.42,type:'sine',gain:.04,delay:.08});tone({freq:784,endFreq:1568,duration:.36,type:'sine',gain:.028,delay:.20});
  }
}

export function setMusic(mode='none'){
  currentMode=TRACKS[mode]?mode:'none';
  const audio=ensurePlayer();
  if(currentMode==='none'){audio.pause();return}
  if(unlocked)tryPlay();
}

function unlockAudio(){
  unlocked=true;
  ensureContext();
  tryPlay();
}

document.addEventListener('pointerdown',unlockAudio,{once:true,capture:true});
document.addEventListener('keydown',unlockAudio,{once:true,capture:true});
