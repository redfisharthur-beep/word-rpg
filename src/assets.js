export const ASSETS={
  role:{warrior:'/images/warrior.png',mage:'/images/mage.png',archer:'/images/archer.png'},
  pet:{fox:'/images/fox.png',owl:'/images/owl.png',dragon:'/images/dragon.png'},
  enemy:{moss:'/images/moss.png',rabbit:'/images/rabbit.png',bubble:'/images/bubble.png',beetle:'/images/beetle.png',shadowKing:'/images/shadow-king.png'}
};
function safeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function visual(src,_fallback,className='art'){
  const empty=`<span class="${className} image-placeholder" aria-hidden="true"></span>`;
  if(!src)return empty;
  return `<span class="visual-wrap"><img class="${className}" src="${safeText(src)}" alt="" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="${className} image-placeholder" hidden aria-hidden="true"></span></span>`;
}
