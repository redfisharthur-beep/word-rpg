import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const jsonPath=path.join(root,'data/game-data.json');
const data=JSON.parse(fs.readFileSync(jsonPath,'utf8'));

for(const key of ['roles','pets','stages','titles','cardPool','cards','roleSkills','qualities','equipmentValues','towerRules','collectionRewards','seasonTiers']){
  if(data[key]==null)throw new Error(`Missing game-data key: ${key}`);
}

const js=`// AUTO-GENERATED from data/game-data.json. Do not edit directly.\nexport const GAME_DATA=${JSON.stringify(data,null,2)};\nexport const GAME_ROLES=GAME_DATA.roles;\nexport const GAME_PETS=GAME_DATA.pets;\nexport const GAME_STAGES=GAME_DATA.stages;\nexport const TITLE_TIERS=GAME_DATA.titles;\nexport const CARD_POOL=GAME_DATA.cardPool;\nexport const CARD_DEFS=GAME_DATA.cards;\nexport const ROLE_SKILLS=GAME_DATA.roleSkills;\nexport const QUALITY_DEFS=GAME_DATA.qualities;\nexport const EQUIPMENT_VALUES=GAME_DATA.equipmentValues;\nexport const TOWER_RULES=GAME_DATA.towerRules;\nexport const COLLECTION_REWARDS=GAME_DATA.collectionRewards;\nexport const SEASON_TIERS=GAME_DATA.seasonTiers;\n`;

fs.mkdirSync(path.join(root,'src/generated'),{recursive:true});
fs.writeFileSync(path.join(root,'src/generated/game-data.js'),js);
console.log('Validated shared JSON and synced Web/Worker generated data; Godot reads data/game-data.json directly.');
