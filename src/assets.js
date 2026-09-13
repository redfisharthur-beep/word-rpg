export const ASSETS = {
  role:{
    warrior:'/images/roles/warrior.png',
    mage:'/images/roles/mage.png',
    archer:'/images/roles/archer.png',
  },
  pet:{
    fox:'/images/pets/fox.png',
    owl:'/images/pets/owl.png',
    dragon:'/images/pets/dragon.png',
  },
  enemy:{
    moss:'/images/enemies/moss.png',
    rabbit:'/images/enemies/rabbit.png',
    bubble:'/images/enemies/bubble.png',
    beetle:'/images/enemies/beetle.png',
    shadowKing:'/images/enemies/shadow-king.png',
  },
  item:{
    mistBlade:'/images/items/mist-blade.png',
    echoRing:'/images/items/echo-ring.png',
    memoryLeaf:'/images/items/memory-leaf.png',
    breakCharm:'/images/items/break-charm.png',
    starStone:'/images/items/star-stone.png',
    core:'/images/items/core.png',
  },
  skill:{
    strike:'/images/skills/strike.png',
    break:'/images/skills/break.png',
    guard:'/images/skills/guard.png',
  },
};

export function visual(src,fallback,className='art'){
  if(!src) return `<span class="${className} fallback">${fallback}</span>`;
  return `<span class="visual-wrap"><img class="${className}" src="${src}" alt="" onload="this.nextElementSibling.hidden=true" onerror="this.hidden=true"><span class="${className} fallback">${fallback}</span></span>`;
}
