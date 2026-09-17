extends RefCounted
class_name WordRpgAdventureRun

const Rules = preload("res://godot/scripts/battle_rules.gd")
const GameData = preload("res://godot/scripts/game_data.gd")

var role: String = "warrior"
var pet: String = "fox"
var level: int = 1
var stage_index: int = 0
var round_no: int = 1
var player: Dictionary = {}
var enemy: Dictionary = {}
var hand: Array[Dictionary] = []
var enemy_hand: Array[Dictionary] = []
var used: Array[int] = []
var enemy_used: Array[int] = []
var selected: Array[int] = []
var enemy_selected: Array[int] = []
var daily_question_indices: Array[int] = []
var last_order: String = "player"
var stats: Dictionary = {"correct":0,"total":0,"damage":0,"heal":0,"ultimates":0}
var wrong_answers: Array[Dictionary] = []
var ultimate_energy: int = 0
var ultimate_used: bool = false

func start(role_id: String, pet_id: String, player_level: int) -> void:
	role = role_id
	pet = pet_id
	level = clampi(player_level, 1, 50)
	stage_index = 0
	player = Rules.player_fighter(role, pet, level)
	stats = {"correct":0,"total":0,"damage":0,"heal":0,"ultimates":0}
	wrong_answers.clear()
	begin_stage()

func begin_stage() -> void:
	enemy = Rules.monster_fighter(stage_index, level)
	round_no = 1
	hand = Rules.deal_hand(9, role, level)
	enemy_hand = Rules.deal_hand(9)
	used.clear()
	enemy_used.clear()
	selected.clear()
	enemy_selected.clear()
	daily_question_indices.clear()
	last_order = "player"
	ultimate_energy = 0
	ultimate_used = false

func stage_data() -> Dictionary:
	return GameData.STAGES[clampi(stage_index, 0, GameData.STAGES.size() - 1)]

func available_player_indices() -> Array[int]:
	var out: Array[int] = []
	for i: int in range(hand.size()):
		if not used.has(i):
			out.append(i)
	return out

func toggle_card(index: int) -> void:
	if used.has(index):
		return
	if selected.has(index):
		selected.erase(index)
	elif selected.size() < 3:
		selected.append(index)

func auto_fill_selection() -> void:
	var available := available_player_indices()
	for value: int in selected:
		available.erase(value)
	available.shuffle()
	while selected.size() < 3 and not available.is_empty():
		selected.append(available.pop_back())

func selected_cards() -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	for index: int in selected:
		if index >= 0 and index < hand.size():
			out.append(hand[index])
	return out

func _enemy_cards() -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	for index: int in enemy_selected:
		if index >= 0 and index < enemy_hand.size():
			out.append(enemy_hand[index])
	return out

func pick_enemy_cards() -> void:
	var available: Array[int] = []
	for i: int in range(enemy_hand.size()):
		if not enemy_used.has(i):
			available.append(i)
	available.shuffle()
	enemy_selected.clear()
	for i: int in range(mini(3, available.size())):
		enemy_selected.append(available[i])

func resolve_round(correct: int, player_ms: int) -> Array[Dictionary]:
	var steps: Array[Dictionary] = []
	var player_cards := selected_cards()
	pick_enemy_cards()
	var enemy_cards := _enemy_cards()
	var enemy_correct_values: Array[int] = [2,3,3,4,4,5]
	var enemy_correct := enemy_correct_values[randi_range(0, enemy_correct_values.size() - 1)]
	var stage := stage_data()
	var enemy_ms := randi_range(2500,11999) if String(stage["id"]) == "rabbit" else randi_range(4000,25999)
	var first := "player" if player_ms <= enemy_ms else "enemy"
	last_order = first
	stats["correct"] = int(stats.get("correct",0)) + correct
	stats["total"] = int(stats.get("total",0)) + 5
	ultimate_energy = clampi(ultimate_energy + correct * 9 + (8 if first == "player" else 0), 0, 100)
	for index: int in selected:
		if not used.has(index):
			used.append(index)
	for index: int in enemy_selected:
		if not enemy_used.has(index):
			enemy_used.append(index)
	var round_start_logs := Rules.monster_round_start(stage, enemy, level)
	var player_state := {"pending_boost":1.0,"offensive_count":0}
	var enemy_state := {"pending_boost":1.0,"offensive_count":0}
	var sequence: Array[String] = []
	for _i: int in range(3):
		sequence.append(first)
		sequence.append("enemy" if first == "player" else "player")
	var counts := {"player":0,"enemy":0}
	for who: String in sequence:
		if int(player.get("hp",0)) <= 0 or int(enemy.get("hp",0)) <= 0:
			break
		var slot := int(counts[who])
		counts[who] = slot + 1
		var actor: Dictionary = player if who == "player" else enemy
		var target: Dictionary = enemy if who == "player" else player
		var cards: Array[Dictionary] = player_cards if who == "player" else enemy_cards
		if slot >= cards.size():
			continue
		var card: Dictionary = cards[slot]
		var state: Dictionary = player_state if who == "player" else enemy_state
		var actor_correct := correct if who == "player" else enemy_correct
		var previous_player_hp := int(player.get("hp",0))
		var before_enemy_pool := int(enemy.get("hp",0)) + int(enemy.get("shield",0))
		var before_player_hp := int(player.get("hp",0))
		var options := {"cards":cards,"slot_index":slot,"offensive_index":int(state["offensive_count"]),"speed_win":who == first,"boost":float(state["pending_boost"])}
		var result := Rules.resolve_card(actor, target, card, actor_correct, options)
		if String(card.get("id","")) == "boost":
			state["pending_boost"] = float(result.get("next_boost",1.0))
		elif float(state["pending_boost"]) > 1.0:
			state["pending_boost"] = 1.0
		if Rules.is_offensive(card):
			state["offensive_count"] = int(state["offensive_count"]) + 1
		var logs: Array[String] = []
		for raw: Variant in result.get("logs",[]):
			logs.append(String(raw))
		Rules.after_action(actor, target, logs)
		if who == "player":
			var dealt := maxi(0, before_enemy_pool - (int(enemy.get("hp",0)) + int(enemy.get("shield",0))))
			stats["damage"] = int(stats.get("damage",0)) + dealt
			stats["heal"] = int(stats.get("heal",0)) + maxi(0, int(player.get("hp",0)) - before_player_hp)
			for extra: String in Rules.monster_after_player(stage, player, enemy, dealt, level):
				logs.append(extra)
		else:
			for extra: String in Rules.monster_after_enemy(stage, player, enemy, previous_player_hp, slot, first, level):
				logs.append(extra)
		if steps.is_empty() and not round_start_logs.is_empty():
			logs = round_start_logs + logs
		var visual_card := card.duplicate(true)
		visual_card["critical"] = logs.any(func(v: String) -> bool: return v.contains("爆擊"))
		steps.append({"who":who,"slot":slot,"card":visual_card,"logs":logs,"player":player.duplicate(true),"enemy":enemy.duplicate(true),"damage":int(result.get("damage",0)),"heal":int(result.get("heal",0)),"first":first,"auto":false})
	if int(player.get("hp",0)) > 0:
		var before_pet_hp := int(player.get("hp",0))
		var pet_logs := Rules.pet_round_end(player, player_cards)
		stats["heal"] = int(stats.get("heal",0)) + maxi(0, int(player.get("hp",0)) - before_pet_hp)
		if not pet_logs.is_empty() and not steps.is_empty():
			var last: Dictionary = steps[steps.size()-1]
			var last_logs: Array = last.get("logs",[])
			for entry: String in pet_logs:
				last_logs.append(entry)
			last["logs"] = last_logs
			last["player"] = player.duplicate(true)
	selected.clear()
	enemy_selected.clear()
	return steps

func next_round_or_auto() -> String:
	if int(player.get("hp",0)) <= 0 or int(enemy.get("hp",0)) <= 0:
		return "finish"
	if round_no >= 2:
		return "auto"
	round_no += 1
	selected.clear()
	enemy_selected.clear()
	return "cards"

func auto_order(auto_round: int) -> Array[String]:
	var first := last_order if ["player","enemy"].has(last_order) else "player"
	var starter := first if (auto_round - 3) % 2 == 0 else ("enemy" if first == "player" else "player")
	return [starter, "enemy" if starter == "player" else "player"]

func can_use_ultimate() -> bool:
	return ultimate_energy >= 100 and not ultimate_used and int(player.get("hp",0)) > 0 and int(enemy.get("hp",0)) > 0

func use_ultimate(auto_round: int) -> Dictionary:
	var before_pool := int(enemy.get("hp",0)) + int(enemy.get("shield",0))
	var logs := Rules.ultimate_attack(player, enemy, role)
	Rules.after_action(player, enemy, logs)
	var dealt := maxi(0, before_pool - (int(enemy.get("hp",0)) + int(enemy.get("shield",0))))
	stats["damage"] = int(stats.get("damage",0)) + dealt
	stats["ultimates"] = int(stats.get("ultimates",0)) + 1
	ultimate_energy = 0
	ultimate_used = true
	return {"who":"player","slot":0,"card":{"id":"%s-ultimate"%role,"name":String(GameData.ultimate(role).get("name","必殺")),"color":"yellow","critical":true},"logs":logs,"player":player.duplicate(true),"enemy":enemy.duplicate(true),"damage":dealt,"heal":0,"auto":true,"ultimate":true,"cycle":auto_round}

func auto_step(auto_round: int, who: String) -> Dictionary:
	var actor: Dictionary = player if who == "player" else enemy
	var target: Dictionary = enemy if who == "player" else player
	var before_enemy_pool := int(enemy.get("hp",0)) + int(enemy.get("shield",0))
	var before_player_hp := int(player.get("hp",0))
	var logs := Rules.basic_attack(actor, target, 1.0, "普通攻擊")
	Rules.after_action(actor, target, logs)
	if who == "player":
		var dealt := maxi(0, before_enemy_pool - (int(enemy.get("hp",0)) + int(enemy.get("shield",0))))
		stats["damage"] = int(stats.get("damage",0)) + dealt
		stats["heal"] = int(stats.get("heal",0)) + maxi(0, int(player.get("hp",0)) - before_player_hp)
		ultimate_energy = clampi(ultimate_energy + 12 + mini(8, roundi(float(dealt) / 80.0)), 0, 100)
	else:
		ultimate_energy = clampi(ultimate_energy + 5, 0, 100)
	var visual_card := {"id":"basic","color":"red","critical":logs.any(func(v: String) -> bool: return v.contains("爆擊"))}
	return {"who":who,"slot":0,"card":visual_card,"logs":logs,"player":player.duplicate(true),"enemy":enemy.duplicate(true),"damage":0,"heal":0,"auto":true,"cycle":auto_round,"final_round":auto_round == 10}

func auto_duel_steps() -> Array[Dictionary]:
	var steps: Array[Dictionary] = []
	for auto_round: int in range(3,11):
		if int(player.get("hp",0)) <= 0 or int(enemy.get("hp",0)) <= 0:
			break
		for who: String in auto_order(auto_round):
			if int(player.get("hp",0)) <= 0 or int(enemy.get("hp",0)) <= 0:
				break
			steps.append(auto_step(auto_round, who))
	return steps

func outcome() -> String:
	var p := maxi(0,int(player.get("hp",0)))
	var e := maxi(0,int(enemy.get("hp",0)))
	if p == e:
		return "draw"
	if e <= 0 or (p > 0 and p > e):
		return "win"
	return "lose"

func advance_stage() -> bool:
	if stage_index >= GameData.STAGES.size() - 1:
		return false
	player["hp"] = mini(int(player["max_hp"]), int(player["hp"]) + roundi(float(player["max_hp"]) * 0.20))
	for key: String in ["poison","armor_break","atk_down","def_boost","heal_block"]:
		player[key] = []
	player["stun"] = 0
	player["crit_lock"] = 0
	player["regen"] = 0
	player["regen_fresh"] = false
	stage_index += 1
	begin_stage()
	return true
