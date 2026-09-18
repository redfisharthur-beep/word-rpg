extends Node

const GameData = preload("res://godot/scripts/game_data.gd")
const AdventureRun = preload("res://godot/scripts/adventure_run.gd")
const WordBank = preload("res://godot/scripts/word_bank.gd")
const RpgRuntime = preload("res://godot/scripts/rpg_runtime.gd")
const InventoryRuntime = preload("res://godot/scripts/inventory_runtime.gd")
const UiFont = preload("res://godot/scripts/ui_font.gd")

var failures: Array[String] = []

func _ready() -> void:
	call_deferred("_run")

func _check(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _reset_state() -> void:
	GameState.authenticated = false
	GameState.player_name = "E2E"
	GameState.role = "warrior"
	GameState.pet = "fox"
	GameState.level = 1
	GameState.xp = 0
	GameState.unlocked_stage = 0
	GameState.inventory.clear()
	GameState.rpg = {}
	GameState.call("_ensure_rpg")
	CloudflareClient.configure("")

func _item(id: String, type: String, subtype: String, quality: String = "common", level: int = 1) -> Dictionary:
	return {
		"id": id,
		"type": type,
		"subtype": subtype,
		"quality": quality,
		"level": level,
		"name": "%s-%s" % [subtype, quality],
		"bonuses": GameData.item_bonuses(type, subtype, quality),
		"art": "res://images/loot-%s-%s-%s.png" % [type, subtype, quality]
	}

func _test_word_bank() -> void:
	var bank = WordBank.new()
	var loaded := bank.load_from_web_source()
	_check(loaded, "word bank should load src/words.js")
	_check(bank.words.size() >= 1000, "word bank should contain the production vocabulary")
	var q: Dictionary = bank.make_question(0)
	_check(not String(q.get("word", "")).is_empty(), "question should have an English word")
	_check(not String(q.get("answer", "")).is_empty(), "question should have an answer")
	_check((q.get("options", []) as Array).size() == 4, "question should have four options")
	_check((q.get("options", []) as Array).has(q.get("answer")), "question options should include the answer")


func _test_ui_font() -> void:
	var font: Font = UiFont.get_font()
	_check(font != null, "bundled Traditional Chinese UI font should load")
	if font == null:
		return
	var sources: Array[String] = [
		"res://src/words.js",
		"res://data/game-data.json",
		"res://godot/scripts/game.gd",
		"res://godot/scripts/game_v3.gd",
		"res://godot/scripts/game_runtime.gd",
		"res://godot/scripts/pk_native.gd",
		"res://godot/scripts/game_data.gd",
		"res://godot/scripts/battle_rules.gd",
		"res://godot/scripts/rpg_runtime.gd",
		"res://godot/scripts/reward_runtime.gd",
		"res://godot/scripts/game_state.gd",
		"res://godot/scripts/game_state_revision.gd",
		"res://godot/scripts/cloud_sync_notice.gd"
	]
	var seen := {}
	for source_path: String in sources:
		var source := FileAccess.get_file_as_string(source_path)
		_check(not source.is_empty(), "font coverage source should be readable: %s" % source_path)
		for i: int in range(source.length()):
			var codepoint := source.unicode_at(i)
			if codepoint < 128 or seen.has(codepoint):
				continue
			seen[codepoint] = true
			_check(UiFont.supports_char(codepoint), "bundled UI font missing glyph codepoint %d" % codepoint)
	_check(seen.size() >= 1000, "font coverage test should inspect the full Traditional Chinese vocabulary")

func _test_assets() -> void:
	var paths: Array[String] = [
		"res://images/login-bg.png",
		"res://images/bg-game.png",
		"res://images/line.png",
		"res://images/fight.png",
		"res://images/PK.png",
		"res://images/Test.png",
		"res://images/pet.png",
		"res://images/equipment.png",
		"res://images/Compendium.png",
		"res://images/return.png",
		"res://images/confirm.png",
		"res://images/victor.png",
		"res://images/fail.png",
		"res://images/VS.png"
	]
	for role_id: String in ["warrior", "mage", "archer"]:
		var role: Dictionary = GameData.ROLES[role_id]
		paths.append(String(role.get("art", "")))
		paths.append("res://images/%s-act1.png" % role_id)
		paths.append("res://images/%s-act2.png" % role_id)
	for pet_id: String in ["fox", "owl", "dragon"]:
		var pet: Dictionary = GameData.PETS[pet_id]
		paths.append(String(pet.get("art", "")))
		var awakening: Dictionary = pet.get("awakening", {})
		var awakening_art := String(awakening.get("art", ""))
		if not awakening_art.is_empty() and not ResourceLoader.exists(awakening_art):
			print("FULLFLOW ART TODO: optional awakening asset missing: %s" % awakening_art)
	for stage: Dictionary in GameData.STAGES:
		paths.append(String(stage.get("art", "")))
	for quality: String in ["common", "rare", "epic", "legendary", "mythic"]:
		for pair: Array in [
			["gem", "ruby"], ["gem", "thunder"],
			["armor", "guardian"], ["armor", "bloodspirit"],
			["ring", "warbreaker"], ["ring", "battlesoul"]
		]:
			paths.append("res://images/loot-%s-%s-%s.png" % [pair[0], pair[1], quality])
	var seen := {}
	for path: String in paths:
		if path.is_empty() or seen.has(path):
			continue
		seen[path] = true
		_check(ResourceLoader.exists(path), "missing Godot asset: %s" % path)
		if ResourceLoader.exists(path):
			_check(load(path) != null, "asset could not load: %s" % path)

func _test_state_and_progression() -> void:
	_reset_state()
	GameState.select_role("mage")
	GameState.select_pet("dragon")
	_check(GameState.role == "mage", "role selection should persist")
	_check(GameState.pet == "dragon", "pet selection should persist")
	GameState.select_role("invalid")
	GameState.select_pet("invalid")
	_check(GameState.role == "warrior", "invalid role should fall back to warrior")
	_check(GameState.pet == "fox", "invalid pet should fall back to fox")

	var need := GameData.xp_need(1)
	var reward: Dictionary = GameState.add_xp(need)
	_check(GameState.level == 2, "EXP should level the player")
	_check((reward.get("levels", []) as Array).has(2), "level-up reward should report the new level")

	var q := {"index":77, "word":"apple", "answer":"蘋果"}
	GameState.record_word_result(q, false)
	_check(GameState.weak_words().size() == 1, "wrong answer should create a weak word")
	GameState.record_word_result(q, true)
	GameState.record_word_result(q, true)
	_check(GameState.weak_words().size() == 1, "weak word should remain before three consecutive correct answers")
	GameState.record_word_result(q, true)
	_check(GameState.weak_words().is_empty(), "three consecutive correct answers should clear the weak word")

	GameState.inventory.clear()
	GameState.rpg = {}
	GameState.call("_ensure_rpg")
	GameState.call("_copy_inventory", [{"id":"legacy-art","type":"gem","subtype":"ruby","quality":"common","art":"/images/loot-gem-ruby-common.png"}])
	_check(GameState.inventory.size() == 1, "legacy Web inventory should import")
	if GameState.inventory.size() == 1:
		_check(String(GameState.inventory[0].get("art", "")) == "res://images/loot-gem-ruby-common.png", "legacy Web inventory art path should normalize for Godot")
	GameState.inventory.clear()
	for i in range(4):
		GameState.add_loot(_item("g%d" % i, "gem", "ruby", "common"))
		GameState.equip_item("g%d" % i)
	_check((GameState.rpg["equipped"]["gems"] as Array).size() == 3, "gem equipment limit should be three")
	for i in range(3):
		GameState.add_loot(_item("r%d" % i, "ring", "warbreaker", "common"))
		GameState.equip_item("r%d" % i)
	_check((GameState.rpg["equipped"]["rings"] as Array).size() == 2, "ring equipment limit should be two")
	GameState.add_loot(_item("a1", "armor", "guardian", "common"))
	GameState.add_loot(_item("a2", "armor", "bloodspirit", "common"))
	GameState.equip_item("a1")
	GameState.equip_item("a2")
	_check(String(GameState.rpg["equipped"]["armor"]) == "a2", "armor equipment limit should be one")

	for id: String in ["s1", "s2", "s3"]:
		GameState.add_loot(_item(id, "gem", "thunder", "common", 5))
	var synth := InventoryRuntime.synthesize(GameState.inventory, GameState.equipped_ids(), "s1")
	_check(bool(synth.get("ok", false)), "three identical common items should synthesize")
	if bool(synth.get("ok", false)):
		_check(GameState.apply_synthesis(synth), "synthesis result should apply to GameState")
		var made: Dictionary = synth.get("item", {})
		_check(String(made.get("quality", "")) == "rare", "synthesis should upgrade common to rare")

	var dismantle_id := "dismantle"
	GameState.add_loot(_item(dismantle_id, "ring", "battlesoul", "epic"))
	var before_crystals := GameState.crystals()
	var gained := GameState.crystallize_item(dismantle_id)
	_check(gained == 8, "epic dismantle should grant eight crystals")
	_check(GameState.crystals() == before_crystals + 8, "dismantle crystals should persist")

	GameState.rpg["crystals"] = 100
	for _i in range(4):
		_check(GameState.enhance_pet("fox"), "fox should enhance through all four levels")
	_check(GameState.pet_enhance_level("fox") == 4, "pet enhancement should reach level four")
	_check(GameState.pet_is_awakened("fox"), "level-four pet should awaken")
	_check(GameState.crystals() == 25, "pet enhancement should cost 5+10+20+40 crystals")

	GameState.level = 50
	GameState.rpg["petSkills"]["fox"] = []
	var tree: Array = RpgRuntime.PET_TREES["fox"]
	for node_value: Variant in tree:
		var node: Dictionary = node_value
		var node_id := String(node.get("id", ""))
		var next: Dictionary = RpgRuntime.unlock_pet_skill("fox", node_id, GameState.level, GameState.rpg)
		_check((next["petSkills"]["fox"] as Array).has(node_id), "pet skill should unlock in sequence: %s" % node_id)
		GameState.rpg = next

	_check(GameState.collection_count() > 0, "loot should register collection entries")

func _select_first_three(run) -> void:
	var available: Array[int] = run.available_player_indices()
	for i in range(mini(3, available.size())):
		run.toggle_card(available[i])

func _test_adventure() -> void:
	_reset_state()
	GameState.level = 20
	for role_id: String in ["warrior", "mage", "archer"]:
		var run = AdventureRun.new()
		run.start(role_id, "fox", 20)
		_check(run.mode == "adventure", "%s adventure mode should start" % role_id)
		_check(run.hand.size() == 9, "%s should receive nine cards" % role_id)
		_check(run.enemy_hand.size() == 9, "enemy should receive nine cards")
		run.player["max_hp"] = 999999
		run.player["hp"] = 999999
		run.enemy["max_hp"] = 999999
		run.enemy["hp"] = 999999

		_select_first_three(run)
		_check(run.selected.size() == 3, "%s should select exactly three cards" % role_id)
		var first_steps: Array = run.resolve_round(5, 1000)
		_check(not first_steps.is_empty(), "%s round one should resolve actions" % role_id)
		_check(run.used.size() == 3, "%s round one should consume three cards" % role_id)
		_check(int(run.stats.get("total", 0)) == 5, "%s round one should count five questions" % role_id)
		_check(int(run.stats.get("correct", 0)) == 5, "%s correct answers should be recorded" % role_id)
		var next := run.next_round_or_auto()
		_check(next == "cards", "%s should enter round two after surviving round one" % role_id)
		_check(run.round_no == 2, "%s should advance to round two" % role_id)

		_select_first_three(run)
		var second_steps: Array = run.resolve_round(3, 5000)
		_check(not second_steps.is_empty(), "%s round two should resolve actions" % role_id)
		_check(run.used.size() == 6, "%s two rounds should consume six unique cards" % role_id)
		_check(run.next_round_or_auto() == "auto", "%s should enter auto duel after round two" % role_id)
		var auto_steps: Array = run.auto_duel_steps()
		_check(not auto_steps.is_empty(), "%s auto duel should produce combat steps" % role_id)
		_check(["win", "lose", "draw"].has(run.outcome()), "%s adventure should yield a valid outcome" % role_id)

	var stage_run = AdventureRun.new()
	stage_run.start("warrior", "fox", 20)
	stage_run.player["hp"] = maxi(1, int(stage_run.player["max_hp"]) / 2)
	var old_stage: int = int(stage_run.stage_index)
	_check(stage_run.advance_stage(), "adventure should advance from the first stage")
	_check(stage_run.stage_index == old_stage + 1, "adventure stage index should advance")

func _test_tower() -> void:
	_reset_state()
	for floor in [1, 5, 10, 15, 20]:
		var run = AdventureRun.new()
		run.start_tower("warrior", "fox", 30, floor)
		_check(run.mode == "tower", "tower mode should start at %dF" % floor)
		_check(run.tower_floor == floor, "tower should preserve requested floor %d" % floor)
		_check(not run.enemy.is_empty(), "tower %dF should create an enemy" % floor)
		_check(run.hand.size() == 9, "tower %dF should deal nine cards" % floor)
		if floor % 5 == 0:
			_check(run.stage_index == GameData.STAGES.size() - 1, "tower milestone %dF should use the boss stage" % floor)
	var progress = AdventureRun.new()
	progress.start_tower("warrior", "fox", 30, 1)
	_check(progress.advance_tower_floor(), "tower should advance from 1F")
	_check(progress.tower_floor == 2, "tower should advance to 2F")
	var final_floor = AdventureRun.new()
	final_floor.start_tower("warrior", "fox", 30, 20)
	_check(not final_floor.advance_tower_floor(), "tower should stop after 20F")

func _test_ui_routes() -> void:
	_reset_state()
	var scene: PackedScene = load("res://godot/scenes/game.tscn")
	var game = scene.instantiate()
	add_child(game)
	await get_tree().process_frame
	CloudflareClient.configure("")
	game.show_home()
	_check(String(game.mode) == "home", "home UI route should render")
	game.show_setup()
	_check(String(game.mode) == "setup", "setup UI route should render")
	game.show_pet_progression()
	_check(String(game.mode) == "pet-progression", "pet UI route should render")
	game.show_inventory()
	_check(String(game.mode) == "inventory", "equipment UI route should render")
	game.show_collection()
	_check(String(game.mode) == "collection", "collection UI route should render")
	game.start_adventure()
	_check(String(game.mode) == "cards", "Fight should enter card selection")
	_check(game.run != null and game.run.hand.size() == 9, "Fight should initialize a nine-card run")
	_check(game.player_sprite != null and game.player_sprite.get_parent() == game.hud, "combat fighter art should render above the HUD battle panel")
	_check(game.enemy_sprite != null and game.enemy_sprite.get_parent() == game.hud, "combat enemy art should render above the HUD battle panel")
	_check(game.fx != null and game.fx.get_parent() == game.hud, "battle effects should share the HUD canvas layer")
	game.show_setup()
	game.start_tower()
	_check(String(game.mode) == "cards", "tower should enter card selection")
	_check(game.run != null and String(game.run.mode) == "tower", "tower UI should create a tower run")
	game.queue_free()
	await get_tree().process_frame

func _run() -> void:
	print("FULLFLOW: begin")
	_reset_state()
	_test_word_bank()
	_test_ui_font()
	_test_assets()
	_test_state_and_progression()
	_test_adventure()
	_test_tower()
	await _test_ui_routes()
	if failures.is_empty():
		print("Godot full game flow tests: PASS")
		get_tree().quit(0)
	else:
		for message: String in failures:
			push_error(message)
		print("Godot full game flow tests: FAIL (%d)" % failures.size())
		get_tree().quit(1)
