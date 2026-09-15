export const ASSETS={
  role:{warrior:'/images/warrior.png',mage:'/images/mage.png',archer:'/images/archer.png'},
  pet:{fox:'/images/fox.png',owl:'/images/owl.png',dragon:'/images/dragon.png'},
  enemy:{moss:'/images/moss.png',rabbit:'/images/rabbit.png',bubble:'/images/bubble.png',beetle:'/images/beetle.png',shadowKing:'/images/shadow-king.png'},
  ui:{equipment:'/images/equipment.png',fight:'/images/fight.png',pk:'/images/PK.png',petSkill:'/images/pet-skill.png',back:'/images/return.png',vs:'/images/VS.png',confirm:'/images/confirm.png',victor:'/images/victor.png',fail:'/images/fail.png',levelUp:'/images/level%20up.png',hp:'/images/HP.png',atk:'/images/ATK.png',def:'/images/DEF.png',crit:'/images/Crit.png',shield:'/images/Shield.png'},
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
installCardAssetStyles();
export function visual(src,_fallback,className='art'){
  if(!src)return '';
  return `<span class="visual-wrap"><img class="${className}" src="${safeText(src)}" alt="" decoding="async" onerror="this.hidden=true"></span>`;
}
