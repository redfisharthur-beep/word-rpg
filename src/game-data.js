import { ASSETS } from './assets.js';

export const ROLES = [
  { id:'warrior', name:'戰士', icon:'⚔️', art:ASSETS.role.warrior, bonus:'連續答對時，Break +1；破陣獲得護盾', color:'#9ba89d', ultimate:{name:'裂地斬',icon:'💢',desc:'重擊、削減 Break 並獲得護盾'} },
  { id:'mage', name:'法師', icon:'🪄', art:ASSETS.role.mage, bonus:'拼字題成功時，技能效果提升', color:'#b8b0be', ultimate:{name:'星界爆發',icon:'✦',desc:'魔法傷害並獲得護盾'} },
  { id:'archer', name:'弓手', icon:'🏹', art:ASSETS.role.archer, bonus:'7 秒內答對時，Combo +1 並獲得護盾', color:'#aeb9bf', ultimate:{name:'疾風連射',icon:'➶',desc:'無視閃避並提高 Combo'} },
];

export const TALENTS = {
  warrior:[
    {id:'warrior-breaker',tier:2,name:'破甲專精',icon:'💥',desc:'破陣成功時額外 +1 Break'},
    {id:'warrior-bulwark',tier:2,name:'鐵壁',icon:'🛡️',desc:'守護額外 +6 護盾'},
    {id:'warrior-execution',tier:3,name:'處決姿態',icon:'⚔️',desc:'敵人失衡時，斬擊傷害 +25%'},
    {id:'warrior-rage',tier:3,name:'戰意爆發',icon:'💢',desc:'裂地斬傷害 +15'},
  ],
  mage:[
    {id:'mage-spellflow',tier:2,name:'咒文循環',icon:'✎',desc:'拼字答對時額外 +10 能量'},
    {id:'mage-ward',tier:2,name:'秘法護幕',icon:'◇',desc:'守護額外 +8 護盾'},
    {id:'mage-arcane',tier:3,name:'奧術共鳴',icon:'✦',desc:'拼字題的斬擊傷害再 +20%'},
    {id:'mage-starshield',tier:3,name:'星盾',icon:'🔷',desc:'星界爆發額外 +12 護盾'},
  ],
  archer:[
    {id:'archer-swift',tier:2,name:'迅足',icon:'➶',desc:'9 秒內答對也能觸發迅捷連擊'},
    {id:'archer-focus',tier:2,name:'專注射擊',icon:'🎯',desc:'Combo 2+ 時斬擊傷害 +15%'},
    {id:'archer-volley',tier:3,name:'風暴箭雨',icon:'🏹',desc:'疾風連射傷害 +18'},
    {id:'archer-momentum',tier:3,name:'乘風',icon:'🌬️',desc:'迅捷連擊額外再 +1 Combo'},
  ],
};

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
  {id:1,word:'apple',zh:'蘋果',level:1,category:'daily',options:['蘋果','香蕉','牛奶','麵包']},
  {id:2,word:'book',zh:'書',level:1,category:'daily',options:['書','筆','桌子','門']},
  {id:3,word:'cat',zh:'貓',level:1,category:'daily',options:['貓','狗','鳥','魚']},
  {id:4,word:'run',zh:'跑步',level:1,category:'action',options:['跑步','睡覺','坐下','吃飯']},
  {id:5,word:'happy',zh:'開心的',level:1,category:'feeling',options:['開心的','生氣的','疲累的','害怕的']},
  {id:6,word:'water',zh:'水',level:1,category:'daily',options:['水','果汁','牛奶','茶']},
  {id:7,word:'friend',zh:'朋友',level:1,category:'people',options:['朋友','老師','醫生','學生']},
  {id:8,word:'school',zh:'學校',level:1,category:'place',options:['學校','公園','醫院','商店']},
  {id:9,word:'green',zh:'綠色的',level:1,category:'color',options:['綠色的','紅色的','藍色的','黃色的']},
  {id:10,word:'small',zh:'小的',level:1,category:'adjective',options:['小的','大的','高的','長的']},

  {id:11,word:'river',zh:'河流',level:2,category:'nature',options:['河流','山','天空','森林']},
  {id:12,word:'forest',zh:'森林',level:2,category:'nature',options:['森林','海洋','沙漠','城市']},
  {id:13,word:'cloud',zh:'雲',level:2,category:'nature',options:['雲','雨','風','雪']},
  {id:14,word:'quiet',zh:'安靜的',level:2,category:'adjective',options:['安靜的','吵鬧的','快速的','明亮的']},
  {id:15,word:'brave',zh:'勇敢的',level:2,category:'feeling',options:['勇敢的','害怕的','疲累的','孤單的']},
  {id:16,word:'follow',zh:'跟隨',level:2,category:'action',options:['跟隨','離開','等待','停止']},
  {id:17,word:'listen',zh:'聆聽',level:2,category:'action',options:['聆聽','觀看','觸摸','奔跑']},
  {id:18,word:'light',zh:'光',level:2,category:'nature',options:['光','影子','聲音','煙霧']},
  {id:19,word:'path',zh:'小徑',level:2,category:'place',options:['小徑','橋','房間','屋頂']},
  {id:20,word:'rabbit',zh:'兔子',level:2,category:'animal',options:['兔子','狐狸','老虎','烏龜']},

  {id:21,word:'protect',zh:'保護',level:3,category:'action',options:['保護','攻擊','忘記','丟棄']},
  {id:22,word:'whisper',zh:'低語',level:3,category:'action',options:['低語','大叫','跳躍','哭泣']},
  {id:23,word:'bridge',zh:'橋',level:3,category:'place',options:['橋','道路','城堡','洞穴']},
  {id:24,word:'stone',zh:'石頭',level:3,category:'nature',options:['石頭','木頭','葉子','花朵']},
  {id:25,word:'deep',zh:'深的',level:3,category:'adjective',options:['深的','淺的','短的','薄的']},
  {id:26,word:'danger',zh:'危險',level:3,category:'noun',options:['危險','和平','秘密','希望']},
  {id:27,word:'search',zh:'尋找',level:3,category:'action',options:['尋找','隱藏','關閉','推動']},
  {id:28,word:'across',zh:'穿越',level:3,category:'direction',options:['穿越','下面','旁邊','後面']},
  {id:29,word:'sudden',zh:'突然的',level:3,category:'adjective',options:['突然的','緩慢的','平靜的','柔軟的']},
  {id:30,word:'bubble',zh:'泡泡',level:3,category:'nature',options:['泡泡','火焰','冰塊','沙子']},

  {id:31,word:'ancient',zh:'古老的',level:4,category:'adjective',options:['古老的','現代的','明亮的','空的']},
  {id:32,word:'journey',zh:'旅程',level:4,category:'noun',options:['旅程','答案','季節','禮物']},
  {id:33,word:'courage',zh:'勇氣',level:4,category:'feeling',options:['勇氣','恐懼','憤怒','疲勞']},
  {id:34,word:'hidden',zh:'隱藏的',level:4,category:'adjective',options:['隱藏的','公開的','破碎的','乾燥的']},
  {id:35,word:'guard',zh:'守衛',level:4,category:'noun',options:['守衛','商人','農夫','旅人']},
  {id:36,word:'escape',zh:'逃離',level:4,category:'action',options:['逃離','進入','保留','建造']},
  {id:37,word:'attack',zh:'攻擊',level:4,category:'action',options:['攻擊','保護','治療','等待']},
  {id:38,word:'armor',zh:'盔甲',level:4,category:'gear',options:['盔甲','戒指','鞋子','斗篷']},
  {id:39,word:'power',zh:'力量',level:4,category:'noun',options:['力量','聲音','方向','顏色']},
  {id:40,word:'beetle',zh:'甲蟲',level:4,category:'animal',options:['甲蟲','蝴蝶','蜘蛛','蜜蜂']},

  {id:41,word:'shadow',zh:'影子',level:5,category:'mystery',options:['影子','火焰','聲音','雨滴']},
  {id:42,word:'memory',zh:'記憶',level:5,category:'mind',options:['記憶','夢想','問題','秘密']},
  {id:43,word:'silent',zh:'寂靜的',level:5,category:'adjective',options:['寂靜的','明亮的','溫暖的','快速的']},
  {id:44,word:'enemy',zh:'敵人',level:5,category:'people',options:['敵人','朋友','隊友','老師']},
  {id:45,word:'victory',zh:'勝利',level:5,category:'noun',options:['勝利','失敗','選擇','機會']},
  {id:46,word:'challenge',zh:'挑戰',level:5,category:'noun',options:['挑戰','禮物','故事','方法']},
  {id:47,word:'focus',zh:'專注',level:5,category:'mind',options:['專注','休息','懷疑','忘記']},
  {id:48,word:'master',zh:'精通',level:5,category:'action',options:['精通','放棄','模仿','猜測']},
  {id:49,word:'final',zh:'最後的',level:5,category:'adjective',options:['最後的','最初的','相同的','普通的']},
  {id:50,word:'wisdom',zh:'智慧',level:5,category:'mind',options:['智慧','速度','運氣','聲音']},
];

export const STAGES = [
  {id:1,name:'苔蘚小徑',subtitle:'森林外圍',icon:'🌿',threat:'★',levelBand:'Lv.1',objective:'認識 10 個生活基礎字，建立英中對應',hint:'先熟悉英翻中與中翻英',questionTypes:['meaning','reverse'],wordIds:[1,2,3,4,5,6,7,8,9,10],enemy:{id:'moss',name:'苔球獸',icon:'🟢',art:ASSETS.enemy.moss,hp:70,intent:'纏藤',breakMax:3,intents:['纏藤','蓄力','撞擊']},reward:'star-stone'},
  {id:2,name:'霧林入口',subtitle:'迷霧深處',icon:'🌫️',threat:'★★',levelBand:'Lv.2',objective:'自然與行動字彙，開始練習聽辨',hint:'加入聽力題，留意殘影閃避',questionTypes:['meaning','reverse','listening'],wordIds:[11,12,13,14,15,16,17,18,19,20],enemy:{id:'rabbit',name:'霧角兔',icon:'🐇',art:ASSETS.enemy.rabbit,hp:85,intent:'殘影',breakMax:3,intents:['殘影','突進','蓄力']},reward:'memory-leaf'},
  {id:3,name:'靜水橋',subtitle:'水霧河岸',icon:'🌉',threat:'★★',levelBand:'Lv.3',objective:'熟悉較長單字，開始建立拼字能力',hint:'正式加入拼字題，先壓制牠的回血',questionTypes:['meaning','reverse','listening','spelling'],wordIds:[21,22,23,24,25,26,27,28,29,30],enemy:{id:'bubble',name:'泡泡怪',icon:'🫧',art:ASSETS.enemy.bubble,hp:95,intent:'泡泡治癒',breakMax:4,intents:['泡泡治癒','水彈','膨脹']},reward:'mist-blade'},
  {id:4,name:'古樹空洞',subtitle:'樹心遺跡',icon:'🌳',threat:'★★★',levelBand:'Lv.4',objective:'戰鬥與冒險字彙，完整混合四種題型',hint:'完整混合題型，Break 能破解硬殼節奏',questionTypes:['meaning','reverse','listening','spelling'],wordIds:[31,32,33,34,35,36,37,38,39,40],enemy:{id:'beetle',name:'木甲蟲',icon:'🪲',art:ASSETS.enemy.beetle,hp:110,intent:'硬殼',breakMax:4,intents:['硬殼','角撞','蓄力']},reward:'break-charm'},
  {id:5,name:'暮色祭壇',subtitle:'最終試煉',icon:'🗿',threat:'BOSS',levelBand:'Review',objective:'從已學 50 字中優先複習你的錯題與弱點字',hint:'弱點字出現率大幅提高',questionTypes:['meaning','reverse','listening','spelling'],wordIds:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50],bossFocus:true,enemy:{id:'shadow',name:'影語王',icon:'👁️',art:ASSETS.enemy.shadowKing,hp:150,intent:'暗語',breakMax:5,intents:['暗語','影襲','大招','吞噬']},reward:'core',boss:true},
];

export const SKILLS = [
  { id:'strike', name:'斬擊', icon:'⚔️', art:ASSETS.skill.strike, effect:'damage', value:22 },
  { id:'break', name:'破陣', icon:'💥', art:ASSETS.skill.break, effect:'break', value:2 },
  { id:'guard', name:'守護', icon:'🛡️', art:ASSETS.skill.guard, effect:'guard', value:14 },
];
