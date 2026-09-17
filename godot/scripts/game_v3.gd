extends "res://godot/scripts/game.gd"

var _ultimate_waiting: bool = false
var _ultimate_choice: bool = false

func resolve_round(player_ms: int) -> void:
	mode = "action"
	busy = true
	var steps: Array[Dictionary] = run.resolve_round(correct_answers, player_ms)
	for step: Dictionary in steps:
		await _play_action_step(step, false)
	busy = false
	var next: String = run.next_round_or_auto()
	if next == "cards":
		selection_deadline = 0
		show_cards()
	elif next == "auto":
		await _run_semi_auto_battle()
	else:
		finish_stage()

func _run_semi_auto_battle() -> void:
	mode = "action"
	busy = true
	for auto_round: int in range(3, 11):
		if int(run.player.get("hp", 0)) <= 0 or int(run.enemy.get("hp", 0)) <= 0:
			break
		for who: String in run.auto_order(auto_round):
			if int(run.player.get("hp", 0)) <= 0 or int(run.enemy.get("hp", 0)) <= 0:
				break
			if who == "player" and run.can_use_ultimate():
				var use_ultimate: bool = await _offer_ultimate(auto_round)
				if use_ultimate:
					var ultimate_step: Dictionary = run.use_ultimate(auto_round)
					await _play_action_step(ultimate_step, true)
					if int(run.enemy.get("hp", 0)) <= 0:
						break
			var step: Dictionary = run.auto_step(auto_round, who)
			await _play_action_step(step, true)
	busy = false
	finish_stage()

func _offer_ultimate(auto_round: int) -> bool:
	_reset_scene()
	_build_combat_stage(run.player, run.enemy)
	var panel := _panel(Rect2(92, 520, 536, 235), Color(0.14, 0.13, 0.11, 0.94), 26, Color(0.92, 0.73, 0.30, 0.85), 2)
	hud.add_child(panel)
	var ultimate: Dictionary = GameData.ultimate(GameState.role)
	panel.add_child(_label("必殺 READY", Rect2(35, 22, 466, 46), 31, HORIZONTAL_ALIGNMENT_CENTER, Color("f5d878")))
	panel.add_child(_label(String(ultimate.get("name", "終極一擊")), Rect2(35, 68, 466, 40), 23, HORIZONTAL_ALIGNMENT_CENTER, Color.WHITE))
	var gauge := ProgressBar.new()
	gauge.position = Vector2(46, 122)
	gauge.size = Vector2(444, 20)
	gauge.min_value = 0
	gauge.max_value = 100
	gauge.value = run.ultimate_energy
	gauge.show_percentage = false
	panel.add_child(gauge)
	var use_btn := _text_button("施放必殺", Rect2(112, 690, 230, 72), 23, Color("7c6229"), Color("fff0bb"))
	var skip_btn := _text_button("繼續自動", Rect2(378, 690, 230, 72), 21, Color("4d5751"), Color.WHITE)
	hud.add_child(use_btn)
	hud.add_child(skip_btn)
	_hud_label("第 %d 回合 · 2.8 秒內可施放" % auto_round, Rect2(170, 780, 380, 35), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED)
	_ultimate_waiting = true
	_ultimate_choice = false
	use_btn.pressed.connect(_choose_ultimate.bind(true))
	skip_btn.pressed.connect(_choose_ultimate.bind(false))
	var timer := get_tree().create_timer(2.8)
	while _ultimate_waiting and timer.time_left > 0.0:
		await get_tree().process_frame
	_ultimate_waiting = false
	return _ultimate_choice

func _choose_ultimate(value: bool) -> void:
	if not _ultimate_waiting:
		return
	_ultimate_choice = value
	_ultimate_waiting = false

func _play_action_step(step: Dictionary, auto: bool) -> void:
	var player_state: Dictionary = step.get("player", run.player)
	var enemy_state: Dictionary = step.get("enemy", run.enemy)
	_reset_scene()
	_build_combat_stage(player_state, enemy_state)
	var mine: bool = String(step.get("who", "player")) == "player"
	var panel := _panel(Rect2(75, 520, 570, 190), Color("eadbd7") if mine else Color("d9e3e9"), 24, Color(1, 1, 1, 0.48), 1)
	hud.add_child(panel)
	var card: Dictionary = step.get("card", {})
	var ultimate: bool = bool(step.get("ultimate", false))
	var title := "必殺・%s" % String(card.get("name", "終極一擊")) if ultimate else ("普通攻擊" if auto or card.is_empty() else String(card.get("name", "技能")))
	panel.add_child(_label(title, Rect2(28, 18, 514, 44), 28 if ultimate else 25, HORIZONTAL_ALIGNMENT_CENTER, Color("8a6827") if ultimate else INK))
	if auto:
		var energy_text := "已施放" if run.ultimate_used else "%d%%" % run.ultimate_energy
		panel.add_child(_label("必殺能量 %s" % energy_text, Rect2(32, 58, 506, 28), 15, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var logs: Array = step.get("logs", [])
	var log_text := ""
	for i: int in range(maxi(0, logs.size() - 3), logs.size()):
		log_text += ("\n" if not log_text.is_empty() else "") + String(logs[i])
	panel.add_child(_label(log_text, Rect2(30, 88, 510, 88), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	await get_tree().process_frame
	if mine:
		if ultimate:
			await fx.play_ultimate(player_sprite, enemy_sprite, camera, GameState.role, maxi(1, int(step.get("damage", 0))))
		else:
			await fx.play_card(player_sprite, enemy_sprite, camera, {"id":"basic","color":"red"} if auto else card, 80 if auto else int(step.get("damage", 0)))
	else:
		if auto or card.is_empty():
			await fx.play_enemy_attack(enemy_sprite, player_sprite, camera)
		else:
			await fx.play_card(enemy_sprite, player_sprite, camera, card, int(step.get("damage", 0)))
	await get_tree().create_timer(0.10 if auto else 0.20).timeout
