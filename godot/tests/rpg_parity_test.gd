extends SceneTree

const RpgRuntime = preload("res://godot/scripts/rpg_runtime.gd")
const InventoryRuntime = preload("res://godot/scripts/inventory_runtime.gd")
const RewardRuntime = preload("res://godot/scripts/reward_runtime.gd")

var failures: Array[String] = []

func _init() -> void:
	_test_pet_effects()
	_test_resonance()
	_test_mythic_effects()
	_test_synthesis()
	_test_rewards()
	if failures.is_empty():
		print("Godot RPG parity tests: PASS")
		quit(0)
	else:
		for message: String in failures:
			push_error(message)
		print("Godot RPG parity tests: FAIL (%d)" % failures.size())
		quit(1)

func _check(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _close(actual: float, expected: float, label: String) -> void:
	_check(absf(actual - expected) < 0.0001, "%s expected %.4f, got %.4f" % [label, expected, actual])

func _base_rpg() -> Dictionary:
	return {
		"petSkills":{"fox":[],"owl":[],"dragon":[]},
		"petEnhance":{"fox":0,"owl":0,"dragon":0},
		"equipped":{"gems":[],"armor":null,"rings":[]}
	}

func _test_pet_effects() -> void:
	var fox := _base_rpg()
	fox["petSkills"]["fox"] = ["fox-1","fox-2","fox-3","fox-4","fox-5"]
	fox["petEnhance"]["fox"] = 4
	var f := RpgRuntime.pet_skill_effects("fox", fox)
	_close(float(f["firstCardAmp"]), 0.30, "fox firstCardAmp")
	_close(float(f["chaseAmp"]), 0.35, "fox chaseAmp")
	_close(float(f["redAmp"]), 0.05, "fox redAmp")
	_close(float(f["crit"]), 0.04, "fox crit")
	_check(bool(f["awakened"]), "fox awakened")

	var owl := _base_rpg()
	owl["petSkills"]["owl"] = ["owl-1","owl-2","owl-3","owl-4","owl-5"]
	owl["petEnhance"]["owl"] = 4
	var o := RpgRuntime.pet_skill_effects("owl", owl)
	_close(float(o["highAccuracy"]), 0.25, "owl highAccuracy")
	_close(float(o["guardHeal"]), 0.11, "owl guardHeal")
	_close(float(o["stableAmp"]), 0.05, "owl stableAmp")
	_close(float(o["hpPct"]), 0.05, "owl hpPct")

	var dragon := _base_rpg()
	dragon["petSkills"]["dragon"] = ["dragon-1","dragon-2","dragon-3","dragon-4","dragon-5"]
	dragon["petEnhance"]["dragon"] = 4
	var d := RpgRuntime.pet_skill_effects("dragon", dragon)
	_close(float(d["yellowAmp"]), 0.20, "dragon yellowAmp")
	_close(float(d["finisherAmp"]), 0.25, "dragon finisherAmp")
	_close(float(d["atkPct"]), 0.04, "dragon atkPct")
	_close(float(d["crit"]), 0.03, "dragon crit")

func _item(id: String, type: String, subtype: String, quality: String = "legendary", power: String = "") -> Dictionary:
	var out := {"id":id,"type":type,"subtype":subtype,"quality":quality}
	if not power.is_empty():
		out["mythicPower"] = power
	return out

func _test_resonance() -> void:
	var war_inventory: Array = [_item("r1","gem","ruby"),_item("r2","gem","ruby"),_item("w1","ring","warbreaker")]
	var war := _base_rpg()
	war["equipped"] = {"gems":["r1","r2"],"armor":null,"rings":["w1"]}
	var war_fx := RpgRuntime.equipment_resonance(war, war_inventory)
	_check(bool(war_fx["war"]), "war resonance active")
	_close(float(war_fx["firstCardAmp"]), 0.12, "war resonance amp")

	var blood_inventory: Array = [_item("t1","gem","thunder"),_item("t2","gem","thunder"),_item("b1","armor","bloodspirit")]
	var blood := _base_rpg()
	blood["equipped"] = {"gems":["t1","t2"],"armor":"b1","rings":[]}
	var blood_fx := RpgRuntime.equipment_resonance(blood, blood_inventory)
	_check(bool(blood_fx["blood"]), "blood resonance active")
	_close(float(blood_fx["greenAmp"]), 0.15, "blood resonance amp")

	var guard_inventory: Array = [_item("g1","armor","guardian"),_item("s1","ring","battlesoul")]
	var guard := _base_rpg()
	guard["equipped"] = {"gems":[],"armor":"g1","rings":["s1"]}
	var guard_fx := RpgRuntime.equipment_resonance(guard, guard_inventory)
	_check(bool(guard_fx["guard"]), "guard resonance active")
	_close(float(guard_fx["blueAmp"]), 0.15, "guard resonance amp")

func _test_mythic_effects() -> void:
	var inventory: Array = [
		_item("m1","gem","ruby","mythic","lifesteal"),
		_item("m2","armor","guardian","mythic","ward"),
		_item("m3","ring","battlesoul","mythic","antiheal")
	]
	var rpg := _base_rpg()
	rpg["equipped"] = {"gems":["m1"],"armor":"m2","rings":["m3"]}
	var fx := RpgRuntime.mythic_equipment_effects(rpg, inventory)
	_close(float(fx["lifesteal"]), 0.18, "mythic lifesteal")
	_close(float(fx["blockChance"]), 0.18, "mythic ward")
	_close(float(fx["antiHealPct"]), 0.70, "mythic antiheal")

func _test_synthesis() -> void:
	var inventory: Array = [
		{"id":"c1","type":"gem","subtype":"ruby","quality":"common","level":5},
		{"id":"c2","type":"gem","subtype":"ruby","quality":"common","level":5},
		{"id":"c3","type":"gem","subtype":"ruby","quality":"common","level":5},
		{"id":"keep","type":"gem","subtype":"thunder","quality":"common","level":5}
	]
	var equipped: Array[String] = []
	var info := InventoryRuntime.synthesis_info(inventory, equipped, "c1")
	_check(bool(info["can"]), "common x3 can synthesize")
	_check(String(info["next_quality"]) == "rare", "common synthesizes to rare")
	var result := InventoryRuntime.synthesize(inventory, equipped, "c1")
	_check(bool(result["ok"]), "synthesis succeeds")
	_check((result["remaining"] as Array).size() == 1, "synthesis consumes exactly three")
	var made: Dictionary = result["item"]
	_check(String(made["quality"]) == "rare", "crafted quality is rare")
	_close(float((made["bonuses"] as Dictionary).get("atkPct", 0.0)), 0.045, "rare ruby atk")
	_close(float((made["bonuses"] as Dictionary).get("defPct", 0.0)), 0.045, "rare ruby def")

	var legendary: Array = [
		{"id":"l1","type":"ring","subtype":"warbreaker","quality":"legendary"},
		{"id":"l2","type":"ring","subtype":"warbreaker","quality":"legendary"},
		{"id":"l3","type":"ring","subtype":"warbreaker","quality":"legendary"}
	]
	var max_info := InventoryRuntime.synthesis_info(legendary, equipped, "l1")
	_check(not bool(max_info["can"]), "legendary cannot synthesize to mythic")
	_check(String(max_info["next_quality"]).is_empty(), "legendary has no synthesis next quality")

func _test_rewards() -> void:
	_check(RewardRuntime.adventure_xp(0) == 80, "stage 1 EXP parity")
	_check(RewardRuntime.adventure_xp(4) == 180, "boss EXP parity")
	_check(RewardRuntime.tower_xp(1) == 115, "tower 1F EXP parity")
	_check(RewardRuntime.tower_xp(20) == 400, "tower 20F EXP parity")
	_check(RewardRuntime.tower_crystals(1) == 1, "tower normal crystal reward")
	_check(RewardRuntime.tower_crystals(5) == 5, "tower 5F crystal reward")
	_check(RewardRuntime.tower_crystals(10) == 8, "tower 10F crystal reward")
	_check(RewardRuntime.tower_crystals(15) == 12, "tower 15F crystal reward")
	_check(RewardRuntime.tower_crystals(20) == 20, "tower 20F crystal reward")
	_close(RewardRuntime.mythic_drop_chance(true, 0), 0.03, "boss mythic chance")
	_close(RewardRuntime.mythic_drop_chance(false, 7), 0.0, "tower 7F mythic chance")
	_close(RewardRuntime.mythic_drop_chance(false, 8), 0.04, "tower 8F mythic chance")
	_close(RewardRuntime.mythic_drop_chance(false, 10), 0.12, "tower 10F mythic chance")
	_close(RewardRuntime.mythic_drop_chance(false, 15), 0.18, "tower 15F mythic chance")
	_close(RewardRuntime.mythic_drop_chance(false, 20), 0.30, "tower 20F mythic chance")
	_check(RewardRuntime.tower_regular_loot_stage(1) == 0, "tower 1F loot stage")
	_check(RewardRuntime.tower_regular_loot_stage(5) == 3, "tower 5F boss loot stage")
	_check(RewardRuntime.tower_regular_loot_stage(10) == 3, "tower 10F boss loot stage")
