export const ASSETS = {
  role:{
    warrior:'/images/warrior.png',
    mage:'/images/mage.png',
    archer:'/images/archer.png',
  },
  pet:{
    fox:'/images/fox.png',
    owl:'/images/owl.png',
    dragon:'/images/dragon.png',
  },
  enemy:{
    moss:'/images/moss.png',
    rabbit:'/images/rabbit.png',
    bubble:'/images/bubble.png',
    beetle:'/images/beetle.png',
    shadowKing:'/images/shadow-king.png',
  },
  item:{
    mistBlade:'/images/mist-blade.png',
    echoRing:'/images/echo-ring.png',
    memoryLeaf:'/images/memory-leaf.png',
    breakCharm:'/images/break-charm.png',
    starStone:'/images/star-stone.png',
    core:'/images/core.png',
  },
  skill:{
    strike:'/images/strike.png',
    break:'/images/break.png',
    guard:'/images/guard.png',
  },
};

function safeText(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function visual(src,fallback,className='art'){
  const mark=safeText(fallback||'✦');
  if(!src) return `<span class="${className} fallback" role="img" aria-label="${mark}">${mark}</span>`;
  const safeSrc=safeText(src);
  return `<span class="visual-wrap"><img class="${className}" src="${safeSrc}" alt="" loading="lazy" decoding="async" onload="this.dataset.ready='1';this.nextElementSibling.hidden=true" onerror="this.hidden=true;this.removeAttribute('src');this.nextElementSibling.hidden=false"><span class="${className} fallback" role="img" aria-label="${mark}">${mark}</span></span>`;
}
