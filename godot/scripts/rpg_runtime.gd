extends RefCounted
class_name WordRpgRuntime

const PET_TREES: Dictionary = {
	"fox": [
		{"id":"fox-1","name":"疾風感知","cost":2,"desc":"先手第一張牌效果 +5%"},
		{"id":"fox-2","name":"赤焰爪痕","cost":4,"desc":"紅牌連攜追擊 +10%"},
		{"id":"fox-3","name":"獵風本能","cost":6,"desc":"紅牌效果 +5%"},
		{"id":"fox-4","name":"靈狐敏銳","cost":8,"desc":"爆擊率 +4%"},
		{"id":"fox-5","name":"九尾先機","cost":10,"desc":"先手第一張再 +10%，追擊再 +15%"}
	],
	"owl": [
		{"id":"owl-1","name":"夜視洞察","cost":2,"desc":"答對 3/5 以上時效果 +5%"},
		{"id":"owl-2","name":"守心之羽","cost":4,"desc":"綠／藍牌組合回復再 +2%"},
		{"id":"owl-3","name":"靜謐護佑","cost":6,"desc":"綠／藍牌效果 +5%"},
		{"id":"owl-4","name":"智者回響","cost":8,"desc":"答對 3/5 以上時效果再 +10%"},
		{"id":"owl-5","name":"蒼穹守護","cost":10,"desc":"最大生命 +5%，回復再 +4%"}
	],
	"dragon": [
		{"id":"dragon-1","name":"元素共鳴","cost":2,"desc":"黃牌效果 +4%"},
		{"id":"dragon-2","name":"龍息蓄能","cost":4,"desc":"黃牌終式爆發 +5%"},
		{"id":"dragon-3","name":"幼龍之力","cost":6,"desc":"攻擊力 +4%"},
		{"id":"dragon-4","name":"元素昇華","cost":8,"desc":"黃牌效果再 +6%"},
		{"id":"dragon-5","name":"真龍爆發","cost":10,"desc":"終式再 +10%，爆擊率 +3%"}
	]
}

const MYTHIC_DEFAULT_BY_SUBTYPE := {
	"ruby":"lifesteal", "thunder":"sunder", "guardian":"thorns",
	"bloodspirit":"berserk", "warbreaker":"critburst", "battlesoul":"flurry"
}
const MYTHIC_POWER_POOLS := {
	"gem":["lifesteal","sunder","stun"],
	"armor":["thorns","berserk","ward"],
	"ring":["critburst","flurry","fatal","truehit","antiheal"]
}
const MYTHIC_NAMES := {
	"lifesteal":"血契汲取", "sunder":"蝕甲魔晶", "stun":"雷縛震擊",
	"thorns":"荊棘反噬", "berserk":"血怒狂戰", "ward":"神佑格擋",
	"critburst":"弒神暴擊", "flurry":"無盡連斬", "fatal":"死神判決",
	"truehit":"破界真傷", "antiheal":"禁療烙印"
}

static func ensure_shape(rpg_value: Variant) -> Dictionary:
	var rpg: Dictionary = rpg_value.duplicate(true) if rpg_value is Dictionary else {}
	if not rpg.has("petSkills") or not rpg["petSkills"] is Dictionary:
		rpg["petSkills"] = {"fox":[],"owl":[],"dragon":[]}
	for pet: String in ["fox","owl","dragon"]:
		if not (rpg["petSkills"] as Dictionary).has(pet) or not (rpg["petSkills"] as Dictionary)[pet] is Array:
			(rpg["petSkills"] as Dictionary)[pet] = []
	if not rpg.has("petEnhance") or not rpg["petEnhance"] is Dictionary:
		rpg["petEnhance"] = {"fox":0,"owl":0,"dragon":0}
	if not rpg.has("equipped") or not rpg["equipped"] is Dictionary:
		rpg["equipped"] = {"gems":[],"armor":null,"rings":[]}
	return rpg

static func skill_point_budget(level: int) -> int:
	return maxi(0, clampi(level, 1, 50) - 1)

static func spent_skill_points(rpg_value: Variant) -> int:
	var rpg := ensure_shape(rpg_value)
	var sum := 0
	var pet_skills: Dictionary = rpg["petSkills"]
	for pet: String in ["fox","owl","dragon"]:
		var owned: Array = pet_skills.get(pet, [])
		for raw: Variant in PET_TREES[pet]:
			var node: Dictionary = raw
			if owned.has(String(node["id"])):
				sum += int(node["cost"])
	return sum

static func available_skill_points(level: int, rpg_value: Variant) -> int:
	return maxi(0, skill_point_budget(level) - spent_skill_points(rpg_value))

static func can_unlock_pet_skill(pet: String, node_id: String, level: int, rpg_value: Variant) -> bool:
	if not PET_TREES.has(pet):
		return false
	var tree: Array = PET_TREES[pet]
	var at := -1
	for i in range(tree.size()):
		if String((tree[i] as Dictionary)["id"]) == node_id:
			at = i
			break
	if at < 0:
		return false
	var rpg := ensure_shape(rpg_value)
	var owned: Array = (rpg["petSkills"] as Dictionary).get(pet, [])
	if owned.has(node_id):
		return false
	if at > 0 and not owned.has(String((tree[at - 1] as Dictionary)["id"])):
		return false
	return available_skill_points(level, rpg) >= int((tree[at] as Dictionary)["cost"])

static func unlock_pet_skill(pet: String, node_id: String, level: int, rpg_value: Variant) -> Dictionary:
	var rpg := ensure_shape(rpg_value)
	if not can_unlock_pet_skill(pet, node_id, level, rpg):
		return rpg
	var pet_skills: Dictionary = rpg["petSkills"]
	var owned: Array = pet_skills.get(pet, [])
	owned.append(node_id)
	pet_skills[pet] = owned
	rpg["petSkills"] = pet_skills
	return rpg

static func pet_skill_effects(pet: String, rpg_value: Variant) -> Dictionary:
	var rpg := ensure_shape(rpg_value)
	var owned: Array = (rpg["petSkills"] as Dictionary).get(pet, [])
	var out := {"firstCardAmp":0.0,"chaseAmp":0.0,"redAmp":0.0,"highAccuracy":0.0,"guardHeal":0.0,"stableAmp":0.0,"yellowAmp":0.0,"finisherAmp":0.0,"hpPct":0.0,"atkPct":0.0,"defPct":0.0,"crit":0.0,"awakened":false}
	if pet == "fox":
		if owned.has("fox-1"): out["firstCardAmp"] += 0.05
		if owned.has("fox-2"): out["chaseAmp"] += 0.10
		if owned.has("fox-3"): out["redAmp"] += 0.05
		if owned.has("fox-4"): out["crit"] += 0.04
		if owned.has("fox-5"):
			out["firstCardAmp"] += 0.10
			out["chaseAmp"] += 0.15
	elif pet == "owl":
		if owned.has("owl-1"): out["highAccuracy"] += 0.05
		if owned.has("owl-2"): out["guardHeal"] += 0.02
		if owned.has("owl-3"): out["stableAmp"] += 0.05
		if owned.has("owl-4"): out["highAccuracy"] += 0.10
		if owned.has("owl-5"):
			out["hpPct"] += 0.05
			out["guardHeal"] += 0.04
	elif pet == "dragon":
		if owned.has("dragon-1"): out["yellowAmp"] += 0.04
		if owned.has("dragon-2"): out["finisherAmp"] += 0.05
		if owned.has("dragon-3"): out["atkPct"] += 0.04
		if owned.has("dragon-4"): out["yellowAmp"] += 0.06
		if owned.has("dragon-5"):
			out["finisherAmp"] += 0.10
			out["crit"] += 0.03
	var enhance: Dictionary = rpg["petEnhance"]
	if int(enhance.get(pet, 0)) >= 4:
		out["awakened"] = true
		if pet == "fox":
			out["firstCardAmp"] += 0.15
			out["chaseAmp"] += 0.10
		elif pet == "owl":
			out["highAccuracy"] += 0.10
			out["guardHeal"] += 0.05
		elif pet == "dragon":
			out["yellowAmp"] += 0.10
			out["finisherAmp"] += 0.10
	return out

static func _equipped_items(rpg_value: Variant, inventory_value: Variant) -> Array[Dictionary]:
	var rpg := ensure_shape(rpg_value)
	var inventory: Array = inventory_value if inventory_value is Array else []
	var by_id: Dictionary = {}
	for raw: Variant in inventory:
		if raw is Dictionary:
			by_id[String((raw as Dictionary).get("id", ""))] = raw
	var equipped: Dictionary = rpg["equipped"]
	var ids: Array = []
	ids.append_array(equipped.get("gems", []))
	if equipped.get("armor", null) != null:
		ids.append(equipped["armor"])
	ids.append_array(equipped.get("rings", []))
	var out: Array[Dictionary] = []
	for id_value: Variant in ids:
		var id := String(id_value)
		if by_id.has(id) and by_id[id] is Dictionary:
			out.append((by_id[id] as Dictionary).duplicate(true))
	return out

static func equipment_resonance(rpg_value: Variant, inventory_value: Variant) -> Dictionary:
	var items := _equipped_items(rpg_value, inventory_value)
	var counts := {"ruby":0,"thunder":0,"guardian":0,"bloodspirit":0,"warbreaker":0,"battlesoul":0}
	for item: Dictionary in items:
		var subtype := String(item.get("subtype", ""))
		if counts.has(subtype): counts[subtype] = int(counts[subtype]) + 1
	var war := int(counts["ruby"]) >= 2 and int(counts["warbreaker"]) >= 1
	var blood := int(counts["thunder"]) >= 2 and int(counts["bloodspirit"]) >= 1
	var guard := int(counts["guardian"]) >= 1 and int(counts["battlesoul"]) >= 1
	return {"firstCardAmp":0.12 if war else 0.0,"greenAmp":0.15 if blood else 0.0,"blueAmp":0.15 if guard else 0.0,"war":war,"blood":blood,"guard":guard}

static func mythic_equipment_effects(rpg_value: Variant, inventory_value: Variant) -> Dictionary:
	var items := _equipped_items(rpg_value, inventory_value)
	var powers: Array[String] = []
	for item: Dictionary in items:
		if String(item.get("quality", "")) != "mythic":
			continue
		var power := String(item.get("mythicPower", ""))
		if power.is_empty(): power = String(MYTHIC_DEFAULT_BY_SUBTYPE.get(String(item.get("subtype", "")), ""))
		if not power.is_empty() and not powers.has(power): powers.append(power)
	var out := {"lifesteal":0.0,"sunderPct":0.0,"sunderTurns":3,"sunderMax":3,"stunChance":0.0,"reflect":0.0,"berserk":false,"blockChance":0.0,"critBonusMin":0.0,"critBonusMax":0.0,"flurry2Chance":0.0,"flurry3Chance":0.0,"fatalChance":0.0,"fatalPct":0.0,"trueDamage":false,"antiHealPct":0.0,"antiHealMinTurns":2,"antiHealMaxTurns":3,"active":powers}
	if powers.has("lifesteal"): out["lifesteal"] = 0.18
	if powers.has("sunder"): out["sunderPct"] = 0.08
	if powers.has("stun"): out["stunChance"] = 0.12
	if powers.has("thorns"): out["reflect"] = 0.18
	if powers.has("berserk"): out["berserk"] = true
	if powers.has("ward"): out["blockChance"] = 0.18
	if powers.has("critburst"):
		out["critBonusMin"] = 0.50
		out["critBonusMax"] = 1.00
	if powers.has("flurry"):
		out["flurry2Chance"] = 0.20
		out["flurry3Chance"] = 0.08
	if powers.has("fatal"):
		out["fatalChance"] = 0.03
		out["fatalPct"] = 0.70
	if powers.has("truehit"): out["trueDamage"] = true
	if powers.has("antiheal"): out["antiHealPct"] = 0.70
	return out

static func random_mythic_power(item_type: String) -> String:
	var pool: Array = MYTHIC_POWER_POOLS.get(item_type, [])
	if pool.is_empty():
		return ""
	return String(pool[randi_range(0, pool.size() - 1)])

static func mythic_name(power: String) -> String:
	return String(MYTHIC_NAMES.get(power, "神話能力"))
