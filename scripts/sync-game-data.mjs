import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const jsonPath=path.join(root,'data/game-data.json');
const data=JSON.parse(fs.readFileSync(jsonPath,'utf8'));

const js=`// AUTO-GENERATED from data/game-data.json. Do not edit directly.\nexport const GAME_DATA=${JSON.stringify(data,null,2)};\nexport const GAME_ROLES=GAME_DATA.roles;\nexport const GAME_PETS=GAME_DATA.pets;\nexport const GAME_STAGES=GAME_DATA.stages;\nexport const TITLE_TIERS=GAME_DATA.titles;\nexport const CARD_POOL=GAME_DATA.cardPool;\nexport const CARD_DEFS=GAME_DATA.cards;\nexport const ROLE_SKILLS=GAME_DATA.roleSkills;\nexport const QUALITY_DEFS=GAME_DATA.qualities;\nexport const EQUIPMENT_VALUES=GAME_DATA.equipmentValues;\nexport const TOWER_RULES=GAME_DATA.towerRules;\nexport const COLLECTION_REWARDS=GAME_DATA.collectionRewards;\nexport const SEASON_TIERS=GAME_DATA.seasonTiers;\n`;

const gd=`# AUTO-GENERATED from data/game-data.json. Do not edit directly.\nextends RefCounted\nclass_name WordRpgSharedData\n\nconst DATA: Dictionary = ${JSON.stringify(data,null,2)}\nconst ROLES: Dictionary = DATA[\"roles\"]\nconst PETS: Dictionary = DATA[\"pets\"]\nconst STAGES: Array = DATA[\"stages\"]\nconst TITLES: Array = DATA[\"titles\"]\nconst CARD_POOL: Array = DATA[\"cardPool\"]\nconst CARDS: Dictionary = DATA[\"cards\"]\nconst ROLE_SKILLS: Dictionary = DATA[\"roleSkills\"]\nconst QUALITIES: Dictionary = DATA[\"qualities\"]\nconst EQUIPMENT_VALUES: Dictionary = DATA[\"equipmentValues\"]\nconst TOWER_RULES: Dictionary = DATA[\"towerRules\"]\nconst COLLECTION_REWARDS: Array = DATA[\"collectionRewards\"]\nconst SEASON_TIERS: Array = DATA[\"seasonTiers\"]\n`;

fs.mkdirSync(path.join(root,'src/generated'),{recursive:true});
fs.mkdirSync(path.join(root,'godot/generated'),{recursive:true});
fs.writeFileSync(path.join(root,'src/generated/game-data.js'),js);
fs.writeFileSync(path.join(root,'godot/generated/game_data.gd'),gd);
console.log('Synced data/game-data.json -> Web + Godot generated data');
