export const ASSETS={
  role:{warrior:'/images/warrior.png',mage:'/images/mage.png',archer:'/images/archer.png'},
  roleAction:{warrior:['/images/warrior-act1.png','/images/warrior-act2.png'],mage:['/images/mage-act1.png','/images/mage-act2.png'],archer:['/images/archer-act1.png','/images/archer-act2.png']},
  pet:{fox:'/images/fox.png',owl:'/images/owl.png',dragon:'/images/dragon.png'},
  enemy:{moss:'/images/moss.png',rabbit:'/images/rabbit.png',bubble:'/images/bubble.png',beetle:'/images/beetle.png',shadowKing:'/images/shadow-king.png'},
  ui:{equipment:'/images/equipment.png',fight:'/images/fight.png',pk:'/images/PK.png',petSkill:'/images/pet.png',tower:'/images/Test.png',collection:'/images/Compendium.png',back:'/images/return.png',vs:'/images/VS.png',confirm:'/images/confirm.png',victor:'/images/victor.png',fail:'/images/fail.png',levelUp:'/images/level%20up.png',hp:'/images/HP.png',atk:'/images/ATK.png',def:'/images/DEF.png',crit:'/images/Crit.png',shield:'/images/Shield.png'},
  card:{
    'stat-hp':'/images/card-stat-hp.png',
    'stat-def':'/images/card-stat-def.png',
    'stat-atk':'/images/card-stat-atk.png',
    'stat-crit':'/images/card-stat-crit.png',
    combo:'/images/card-combo.png',
    desperate:'/images/card-desperate.png',
    poison:'/images/card-poison.png',
    break:'/images/card-break.png',
    sun:'/images/card-sun.png',
    preempt:'/images/card-preempt.png',
    regen:'/images/card-regen.png',
    sacrifice:'/images/card-sacrifice.png',
    restore:'/images/card-restore.png',
    diamond:'/images/card-diamond.png',
    aegis:'/images/card-aegis.png',
    boost:'/images/card-boost.png'
  },
  effect:{
    slash:'/images/effect-slash.png',
    crit:'/images/effect-crit.png',
    guard:'/images/effect-guard.png',
    heal:'/images/effect-heal.png'
  }
};
function safeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function installCardAssetStyles(){
  if(typeof document==='undefined'||document.getElementById('card-asset-map'))return;
  const style=document.createElement('style');
  style.id='card-asset-map';
  style.textContent=Object.entries(ASSETS.card).map(([id,src])=>`.asset-slot[data-asset="card-${id}"]{background-image:url('${src}');background-size:contain;background-position:center;background-repeat:no-repeat;background-color:transparent;border:0;}`).join('\n');
  document.head.appendChild(style);
}
function installSetupAssetStyles(){
  if(typeof document==='undefined'||document.getElementById('setup-asset-map'))return;
  const style=document.createElement('style');
  style.id='setup-asset-map';
  style.textContent=`.progression-btn{min-height:112px!important;padding:0!important;border:0!important;background-color:transparent!important;background-position:center!important;background-repeat:no-repeat!important;background-size:contain!important;overflow:hidden}.progression-btn>*{opacity:0;pointer-events:none}.tower-entry{background-image:url('${ASSETS.ui.tower}')!important}.collection-entry{background-image:url('${ASSETS.ui.collection}')!important}@media(max-width:700px){.progression-btn{min-height:92px!important}}`;
  document.head.appendChild(style);
}
let actionFrameTimer=null;
function syncRoleActionFrame(){
  clearTimeout(actionFrameTimer);actionFrameTimer=null;
  if(typeof document==='undefined')return;
  const img=document.querySelector('.action-screen .fighter.hero.is-acting img.fighter-art');
  if(!img)return;
  const current=String(img.getAttribute('src')||'');
  const roleId=Object.keys(ASSETS.role).find(id=>current===ASSETS.role[id]||current.endsWith(ASSETS.role[id]));
  const frames=ASSETS.roleAction[roleId];
  if(!frames)return;
  img.src=frames[0];
  actionFrameTimer=setTimeout(()=>{if(img.isConnected&&img.closest('.action-screen .fighter.hero.is-acting'))img.src=frames[1]},1000);
}
function installRoleActionObserver(){
  if(typeof document==='undefined'||typeof MutationObserver==='undefined'||globalThis.__wordRpgActionObserver)return;
  const start=()=>{
    if(globalThis.__wordRpgActionObserver)return;
    const observer=new MutationObserver(()=>queueMicrotask(syncRoleActionFrame));
    observer.observe(document.documentElement,{childList:true,subtree:true});
    globalThis.__wordRpgActionObserver=observer;
    syncRoleActionFrame();
  };
  if(document.documentElement)start();else addEventListener('DOMContentLoaded',start,{once:true});
}
installCardAssetStyles();
installSetupAssetStyles();
installRoleActionObserver();
export function visual(src,_fallback,className='art'){
  if(!src)return '';
  return `<span class="visual-wrap"><img class="${className}" src="${safeText(src)}" alt="" decoding="async" onerror="this.hidden=true"></span>`;
}
