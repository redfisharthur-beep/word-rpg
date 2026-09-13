import { ASSETS } from './assets.js';

export const ROLES = [
  { id:'warrior', name:'戰士', icon:'⚔️', art:ASSETS.role.warrior, bonus:'連續答對時，Break +1', color:'#9ba89d', ultimate:{name:'裂地斬',icon:'💢',desc:'重擊並大幅削減 Break'} },
  { id:'mage', name:'法師', icon:'🪄', art:ASSETS.role.mage, bonus:'拼字題成功時，技能效果提升', color:'#b8b0be', ultimate:{name:'星界爆發',icon:'✦',desc:'魔法傷害並獲得大量護盾'} },
  { id:'archer', name:'弓手', icon:'🏹', art:ASSETS.role.archer, bonus:'7 秒內答對時，Combo +1', color:'#aeb9bf', ultimate:{name:'疾風連射',icon:'➶',desc:'無視閃避並提高 Combo'} },
];

export const PETS = [
  { id:'fox', name:'霧尾狐', icon:'🦊', art:ASSETS.pet.fox, type:'guard', passive:'答對時有機率生成護盾', evolve:8, combat:{kind:'guard',base:4,evolved:7} },
  { id:'owl', name:'暮光鴞', icon:'🦉', art:ASSETS.pet.owl, type:'mercy', passive:'降低怪物反擊傷害', evolve:8, combat:{kind:'reduce',base:3,evolved:6} },
  { id:'dragon', name:'青芽龍', icon:'🐲', art:ASSETS.pet.dragon, type:'combo', passive:'Combo 達 3 時強化技能效果', evolve:10, combat:{kind:'combo',base:.12,evolved:.22} },
];

export const ITEMS = [
  { id:'mist-blade', name:'霧鋒', icon:'🗡️', art:ASSETS.item.mistBlade, kind:'裝備', rarity:'普通', effect:'Combo 3+ 時，攻擊 +20%' },
  { id:'echo-ring', name:'回音戒', icon:'💍', art:ASSETS.item.echoRing, kind:'裝備', rarity:'稀有', effect:'聽力題答對時，額外獲得 6 護盾' },
  { id:'memory-leaf', name:'記憶葉', icon:'🍃', art:ASSETS.item.memoryLeaf, kind:'寶物', rarity:'普通', effect:'每場第一次答錯不會中斷 Combo' },
  { id:'break-charm', name:'裂紋符', icon:'🪬', art:ASSETS.item.breakCharm, kind:'寶物', rarity:'稀有', effect:'每場第一次使用破陣時，Break +1' },
  { id:'star-stone', name:'星語石', icon:'🔹', art:ASSETS.item.starStone, kind:'素材', rarity:'素材', effect:'寵物升級與進化用' },
  { id:'core', name:'進化核心', icon:'💠', art:ASSETS.item.core, kind:'素材', rarity:'稀有素材', effect:'寵物進化必需品' },
];

export const WORDS = [
  { id:1, word:'apple', zh:'蘋果', level:1, category:'food', options:['蘋果','香蕉','牛奶','麵包'] },
  { id:2, word:'run', zh:'跑步', level:1, category:'verb', options:['跑步','睡覺','吃','坐下'] },
  { id:3, word:'happy', zh:'開心的', level:1, category:'adjective', options:['開心的','生氣的','快速的','安靜的'] },
  { id:4, word:'river', zh:'河流', level:1, category:'nature', options:['河流','山','天空','森林'] },
  { id:5, word:'brave', zh:'勇敢的', level:2, category:'adjective', options:['勇敢的','疲累的','寒冷的','緩慢的'] },
  { id:6, word:'protect', zh:'保護', level:2, category:'verb', options:['保護','攻擊','忘記','離開'] },
  { id:7, word:'whisper', zh:'低語', level:2, category:'verb', options:['低語','大叫','跳躍','等待'] },
  { id:8, word:'ancient', zh:'古老的', level:2, category:'adjective', options:['古老的','明亮的','空的','柔軟的'] },
  { id:9, word:'journey', zh:'旅程', level:2, category:'noun', options:['旅程','答案','季節','禮物'] },
  { id:10, word:'shadow', zh:'影子', level:2, category:'noun', options:['影子','火焰','聲音','雨滴'] },
];

export const STAGES = [
  { id:1, name:'苔蘚小徑', subtitle:'森林外圍', icon:'🌿', threat:'★', hint:'先熟悉基本戰鬥', wordIds:[1,2,3,4], enemy:{id:'moss',name:'苔球獸',icon:'🟢',art:ASSETS.enemy.moss,hp:70,intent:'纏藤',breakMax:3,intents:['纏藤','蓄力','撞擊']}, reward:'star-stone' },
  { id:2, name:'霧林入口', subtitle:'迷霧深處', icon:'🌫️', threat:'★★', hint:'留意殘影閃避', wordIds:[2,3,4,5,6], enemy:{id:'rabbit',name:'霧角兔',icon:'🐇',art:ASSETS.enemy.rabbit,hp:85,intent:'殘影',breakMax:3,intents:['殘影','突進','蓄力']}, reward:'memory-leaf' },
  { id:3, name:'靜水橋', subtitle:'水霧河岸', icon:'🌉', threat:'★★', hint:'先壓制牠的回血', wordIds:[4,5,6,7], enemy:{id:'bubble',name:'泡泡怪',icon:'🫧',art:ASSETS.enemy.bubble,hp:95,intent:'泡泡治癒',breakMax:4,intents:['泡泡治癒','水彈','膨脹']}, reward:'mist-blade' },
  { id:4, name:'古樹空洞', subtitle:'樹心遺跡', icon:'🌳', threat:'★★★', hint:'Break 能破解硬殼節奏', wordIds:[5,6,7,8,9], enemy:{id:'beetle',name:'木甲蟲',icon:'🪲',art:ASSETS.enemy.beetle,hp:110,intent:'硬殼',breakMax:4,intents:['硬殼','角撞','蓄力']}, reward:'break-charm' },
  { id:5, name:'暮色祭壇', subtitle:'最終試煉', icon:'🗿', threat:'BOSS', hint:'優先出現你最常答錯的字', wordIds:[1,2,3,4,5,6,7,8,9,10], bossFocus:true, enemy:{id:'shadow',name:'影語王',icon:'👁️',art:ASSETS.enemy.shadowKing,hp:150,intent:'暗語',breakMax:5,intents:['暗語','影襲','大招','吞噬']}, reward:'core', boss:true },
];

export const SKILLS = [
  { id:'strike', name:'斬擊', icon:'⚔️', art:ASSETS.skill.strike, effect:'damage', value:22 },
  { id:'break', name:'破陣', icon:'💥', art:ASSETS.skill.break, effect:'break', value:2 },
  { id:'guard', name:'守護', icon:'🛡️', art:ASSETS.skill.guard, effect:'guard', value:14 },
];
