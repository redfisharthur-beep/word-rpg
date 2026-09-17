extends "res://godot/scripts/game.gd"

var _ultimate_waiting: bool = false
var _ultimate_choice: bool = false

func show_setup() -> void:
	mode = "setup"
	_reset_scene()
	_add_background(BG_GAME, 0.88)
	_add_scrim(Color(0.93, 0.91, 0.87, 0.25))

	var role_panel := _panel(Rect2(26, 26, 668, 430), _role_color(GameState.role), 28, Color(1, 1, 1, 0.55), 1)
	hud.add_child(role_panel)
	var role_data: Dictionary = GameData.ROLES[GameState.role]
	role_panel.add_child(_texture(String(role_data["art"]), Rect2(34, 46, 385, 335)))
	role_panel.add_child(_label("%s   Lv.%d" % [GameState.player_name, GameState.level], Rect2(420, 58, 225, 42), 24, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var title_text := GameData.title_name(GameState.level)
	if bool(GameState.collection_unlocks().get("title", false)):
		title_text = "萬象收藏家"
	role_panel.add_child(_label(title_text, Rect2(420, 102, 225, 34), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var stats: Dictionary = GameData.progression_stats(GameState.role, GameState.pet, GameState.level)
	_add_role_stats(role_panel, stats, Vector2(440, 160))
	_add_tabs(["warrior", "mage", "archer"], ["戰士", "法師", "弓手"], GameState.role, 30, 468, select_role)

	var pet_panel := _panel(Rect2(26, 535, 668, 220), _pet_color(GameState.pet), 26, Color(1, 1, 1, 0.48), 1)
	hud.add_child(pet_panel)
	var pet_data := GameState.pet_display_data(GameState.pet)
	if bool(pet_data.get("awakened", false)):
		var glow := _panel(Rect2(44, 18, 300, 180), Color(0.98, 0.88, 0.52, 0.16), 90, Color(0.94, 0.74, 0.28, 0.58), 3)
		pet_panel.add_child(glow)
		pet_panel.add_child(_label("AWAKEN", Rect2(372, 20, 240, 30), 14, HORIZONTAL_ALIGNMENT_CENTER, Color("9a7529")))
	pet_panel.add_child(_texture(String(pet_data["art"]), Rect2(62, 20, 290, 175)))
	pet_panel.add_child(_label(String(pet_data.get("name", "寵物")), Rect2(365, 54, 250, 40), 23, HORIZONTAL_ALIGNMENT_CENTER, INK))
	pet_panel.add_child(_label("強化 Lv.%d / 4" % GameState.pet_enhance_level(GameState.pet), Rect2(365, 96, 250, 30), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	_add_pet_stats(pet_panel, Vector2(392, 134))
	_add_tabs(["fox", "owl", "dragon"], ["靈狐", "夜梟", "幼龍"], GameState.pet, 30, 770, select_pet)

	# Six primary actions: 3 x 2, image-driven and same size.
	var size := Vector2(180, 92)
	var x_positions := [56.0, 270.0, 484.0]
	var top_y := 866.0
	var bottom_y := 980.0
	var fight_btn := _image_button("res://images/fight.png", Rect2(x_positions[0], top_y, size.x, size.y))
	fight_btn.pressed.connect(start_adventure)
	var pk_btn := _image_button("res://images/PK.png", Rect2(x_positions[1], top_y, size.x, size.y))
	pk_btn.pressed.connect(func() -> void: _notice("PK", "Godot WebSocket 對戰會沿用 Cloudflare /match；目前可先使用正式 Web 版 PK"))
	var tower_btn := _image_button("res://images/Test.png", Rect2(x_positions[2], top_y, size.x, size.y))
	tower_btn.pressed.connect(start_tower)
	var pet_btn := _image_button("res://images/pet.png", Rect2(x_positions[0], bottom_y, size.x, size.y))
	pet_btn.pressed.connect(func() -> void: _notice("寵物", "強化 Lv.4 會覺醒；新覺醒圖補上後會自動替換"))
	var equipment_btn := _image_button("res://images/equipment.png", Rect2(x_positions[1], bottom_y, size.x, size.y))
	equipment_btn.pressed.connect(show_inventory)
	var collection_btn := _image_button("res://images/Compendium.png", Rect2(x_positions[2], bottom_y, size.x, size.y))
	collection_btn.pressed.connect(show_collection)
	_hud_label("冒險   ·   PK   ·   試煉\n寵物   ·   裝備   ·   圖鑑", Rect2(80, 1082, 560, 58), 14, HORIZONTAL_ALIGNMENT_CENTER, Color(0.29, 0.34, 0.31, 0.72))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 66))
	back_btn.pressed.connect(show_home)

func start_tower() -> void:
	run = AdventureRun.new()
	var next_floor := clampi(GameState.tower_best() + 1, 1, 20)
	run.start_tower(GameState.role, GameState.pet, GameState.level, next_floor)
	question_batch.clear()
	last_loot.clear()
	last_reward.clear()
	selection_deadline = 0
	show_cards()

func show_collection() -> void:
	mode = "collection"
	_reset_scene()
	_add_background(BG_GAME, 0.74)
	var panel := _panel(Rect2(34, 48, 652, 1085), CREAM, 28, Color(1, 1, 1, 0.68), 1)
	hud.add_child(panel)
	var owned := GameState.collection_count()
	panel.add_child(_label("圖鑑", Rect2(35, 22, 582, 58), 32, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("收藏 %d / 30+" % owned, Rect2(35, 78, 582, 36), 18, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var unlocks := GameState.collection_unlocks()
	var reward_text := "10 件  收藏家角色框  %s\n20 件  秘藏戰鬥背景  %s\n30 件  萬象收藏家  %s" % ["✓" if unlocks.frame else "—", "✓" if unlocks.background else "—", "✓" if unlocks.title else "—"]
	var reward_panel := _panel(Rect2(48, 135, 556, 168), Color(0.91, 0.88, 0.80, 0.96), 22, Color(0.74, 0.65, 0.45, 0.38), 1)
	panel.add_child(reward_panel)
	reward_panel.add_child(_label(reward_text, Rect2(24, 16, 508, 136), 18, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("近期收藏", Rect2(48, 322, 250, 36), 21, HORIZONTAL_ALIGNMENT_LEFT, INK))
	var recent := GameState.inventory.slice(maxi(0, GameState.inventory.size() - 6), GameState.inventory.size())
	if recent.is_empty():
		panel.add_child(_label("尚未取得裝備", Rect2(60, 380, 530, 90), 19, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	else:
		for i in range(recent.size()):
			var item: Dictionary = recent[i]
			var col := i % 3
			var row := i / 3
			var x := 48.0 + float(col) * 178.0
			var y := 370.0 + float(row) * 185.0
			var card := _panel(Rect2(x, y, 160, 165), Color(0.94, 0.92, 0.87, 0.96), 18, Color(0.70, 0.66, 0.58, 0.30), 1)
			panel.add_child(card)
			card.add_child(_texture(String(item.get("art", "")), Rect2(18, 10, 124, 110)))
			card.add_child(_label(String(item.get("name", "裝備")), Rect2(8, 122, 144, 34), 14, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("弱點單字", Rect2(48, 760, 250, 38), 21, HORIZONTAL_ALIGNMENT_LEFT, INK))
	var weak := GameState.weak_words()
	var weak_text := "目前沒有弱點單字"
	if not weak.is_empty():
		var lines: Array[String] = []
		for i in range(mini(6, weak.size())):
			var item: Dictionary = weak[i]
			lines.append("%s → %s   錯 %d 次 / 連對 %d" % [String(item.get("word", "#%d" % int(item.get("index", 0)))), String(item.get("answer", "")), int(item.get("misses", 0)), int(item.get("streak", 0))])
		weak_text = "\n".join(lines)
	var weak_panel := _panel(Rect2(48, 808, 556, 196), Color(0.86, 0.89, 0.86, 0.96), 20, Color(0.55, 0.65, 0.58, 0.35), 1)
	panel.add_child(weak_panel)
	weak_panel.add_child(_label(weak_text, Rect2(22, 14, 512, 168), 15, HORIZONTAL_ALIGNMENT_LEFT, INK))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 65))
	back_btn.pressed.connect(show_setup)

func answer_question(value: String) -> void:
	if mode != "quiz" or quiz_locked:
		return
	quiz_locked = true
	question_deadline = 0
	var q: Dictionary = round_questions[question_index]
	var answer := String(q["answer"])
	var ok := value == answer
	GameState.record_word_result(q, ok)
	if ok:
		correct_answers += 1
	else:
		run.wrong_answers.append({"word":String(q["word"]),"answer":answer,"selected":value if not value.is_empty() else "未作答"})
	_show_feedback("正確" if ok else "答案 · %s" % answer, ok)
	await get_tree().create_timer(0.9).timeout
	question_index += 1
	if question_index >= 5:
		var elapsed := clampi(Time.get_ticks_msec() - quiz_start_ms - 4500, 1, 50000)
		await resolve_round(elapsed)
	else:
		show_quiz()

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

func finish_stage() -> void:
	var outcome := run.outcome()
	if outcome == "win":
		var reward_amount := 80 + run.stage_index * 25
		if run.mode == "tower":
			reward_amount = 45 + run.tower_floor * 8
			GameState.record_tower_floor(run.tower_floor)
		last_reward = GameState.add_xp(reward_amount)
		last_loot = GameData.roll_loot(run.stage_index, GameState.level)
		if not last_loot.is_empty():
			GameState.add_loot(last_loot)
		if GameState.authenticated:
			GameState.sync_cloudflare_progress()
		show_stage_clear()
	elif outcome == "draw":
		show_loss(true)
	else:
		show_loss(false)

func show_stage_clear() -> void:
	mode = "result"
	_reset_scene()
	_add_background(BG_GAME, 0.80)
	_texture_to_hud("res://images/victor.png", Rect2(165, 48, 390, 135))
	var label := "試煉 %dF" % run.tower_floor if run.mode == "tower" else "%d / %d" % [run.stage_index + 1, GameData.STAGES.size()]
	_hud_label(label, Rect2(250, 176, 220, 36), 18, HORIZONTAL_ALIGNMENT_CENTER, MUTED)
	_texture_to_hud(String(GameData.ROLES[GameState.role]["art"]), Rect2(60, 205, 350, 465))
	var foe := _texture(String(run.stage_data()["art"]), Rect2(405, 250, 260, 355))
	foe.modulate = Color(0.45, 0.45, 0.45, 0.72)
	hud.add_child(foe)
	var reward_panel := _panel(Rect2(85, 690, 550, 290), CREAM, 28, Color(1, 1, 1, 0.65), 1)
	hud.add_child(reward_panel)
	reward_panel.add_child(_label("EXP +%d" % int(last_reward.get("amount", 0)), Rect2(35, 20, 480, 50), 28, HORIZONTAL_ALIGNMENT_CENTER, INK))
	if not last_loot.is_empty():
		reward_panel.add_child(_texture(String(last_loot.get("art", "")), Rect2(55, 92, 150, 150)))
		reward_panel.add_child(_label(String(last_loot.get("name", "裝備")), Rect2(220, 110, 280, 55), 23, HORIZONTAL_ALIGNMENT_LEFT, INK))
		reward_panel.add_child(_label("收藏 %d" % GameState.collection_count(), Rect2(220, 165, 260, 34), 16, HORIZONTAL_ALIGNMENT_LEFT, MUTED))
	else:
		reward_panel.add_child(_label("本關沒有掉落裝備", Rect2(70, 115, 410, 55), 20, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var has_next := run.tower_floor < 20 if run.mode == "tower" else run.stage_index < GameData.STAGES.size() - 1
	if has_next:
		var next_text := "NEXT FLOOR" if run.mode == "tower" else "NEXT"
		var next_btn := _text_button(next_text, Rect2(225, 1020, 270, 78), 27, Color("566d62"), Color.WHITE)
		hud.add_child(next_btn)
		next_btn.pressed.connect(next_stage)
	else:
		var summary_btn := _text_button("戰績", Rect2(225, 1020, 270, 78), 26, Color("566d62"), Color.WHITE)
		hud.add_child(summary_btn)
		summary_btn.pressed.connect(show_summary)
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1140, 160, 65))
	back_btn.pressed.connect(show_setup)
	if not last_loot.is_empty():
		_play_loot_reveal(last_loot)

func _play_loot_reveal(item: Dictionary) -> void:
	var overlay := Control.new()
	overlay.position = Vector2.ZERO
	overlay.size = VIEW
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay.z_index = 100
	hud.add_child(overlay)
	var beam := ColorRect.new()
	beam.position = Vector2(310, 390)
	beam.size = Vector2(100, 370)
	beam.color = Color(1.0, 0.86, 0.38, 0.0) if String(item.get("quality", "")) == "mythic" else Color(0.82, 0.90, 1.0, 0.0)
	beam.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay.add_child(beam)
	var chest := _panel(Rect2(230, 590, 260, 150), Color("71543a"), 22, Color("c9a65c"), 5)
	overlay.add_child(chest)
	var lid := _panel(Rect2(0, 0, 260, 58), Color("8b6845"), 22, Color("d3b36d"), 5)
	chest.add_child(lid)
	var loot := _texture(String(item.get("art", "")), Rect2(250, 410, 220, 220))
	loot.modulate.a = 0.0
	overlay.add_child(loot)
	var title := _label(String(item.get("name", "裝備")), Rect2(130, 350, 460, 55), 27, HORIZONTAL_ALIGNMENT_CENTER, Color("f8dda1") if String(item.get("quality", "")) == "mythic" else Color.WHITE)
	title.modulate.a = 0.0
	overlay.add_child(title)
	var tween := create_tween()
	tween.tween_property(chest, "scale", Vector2(1.08, 0.92), 0.14)
	tween.tween_property(chest, "scale", Vector2.ONE, 0.12)
	tween.tween_property(lid, "position:y", -58.0, 0.18)
	tween.parallel().tween_property(lid, "rotation", -0.16, 0.18)
	tween.tween_property(beam, "color:a", 0.62, 0.16)
	tween.parallel().tween_property(loot, "modulate:a", 1.0, 0.18)
	tween.parallel().tween_property(loot, "position:y", 345.0, 0.28)
	tween.parallel().tween_property(title, "modulate:a", 1.0, 0.22)
	tween.tween_interval(0.85)
	tween.tween_property(overlay, "modulate:a", 0.0, 0.30)
	tween.tween_callback(overlay.queue_free)

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

func _build_combat_stage(player_state: Dictionary, enemy_state: Dictionary) -> void:
	super._build_combat_stage(player_state, enemy_state)
	var unlocks := GameState.collection_unlocks()
	if bool(unlocks.get("background", false)):
		var aura := _panel(Rect2(26, 84, 668, 392), Color(0.80, 0.72, 0.48, 0.055), 28, Color(0.82, 0.66, 0.30, 0.28), 2)
		aura.mouse_filter = Control.MOUSE_FILTER_IGNORE
		hud.add_child(aura)
	if bool(unlocks.get("frame", false)):
		var frame := _panel(Rect2(47, 116, 284, 292), Color(1,1,1,0.0), 24, Color(0.83, 0.68, 0.34, 0.70), 3)
		frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
		hud.add_child(frame)
	if bool(unlocks.get("title", false)):
		_hud_label("✦  萬象收藏家  ✦", Rect2(55, 82, 270, 28), 14, HORIZONTAL_ALIGNMENT_CENTER, Color("9e792b"))
	var pet_data := GameState.pet_display_data(GameState.pet)
	_texture_to_hud(String(pet_data.get("art", GameData.PETS[GameState.pet]["art"])), Rect2(40, 260, 92, 82))
	if bool(pet_data.get("awakened", false)):
		_hud_label("✦", Rect2(47, 247, 78, 26), 20, HORIZONTAL_ALIGNMENT_CENTER, Color("d7a934"))
	if run != null and run.mode == "tower":
		var rule := run.tower_rule()
		var rule_text := "%dF" % run.tower_floor
		if not rule.is_empty():
			rule_text += " · %s" % String(rule.get("name", "試煉"))
		_hud_label(rule_text, Rect2(250, 42, 220, 30), 15, HORIZONTAL_ALIGNMENT_CENTER, Color("7d6430"))

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
