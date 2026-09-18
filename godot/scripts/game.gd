extends Node2D

const GameData = preload("res://godot/scripts/game_data.gd")
const WordBank = preload("res://godot/scripts/word_bank.gd")
const AdventureRun = preload("res://godot/scripts/adventure_run.gd")
const BattleFx = preload("res://godot/scripts/battle_fx.gd")
const UiFont = preload("res://godot/scripts/ui_font.gd")

const VIEW := Vector2(720, 1280)
const BG_GAME := "res://images/bg-game.png"
const BG_LOGIN := "res://images/login-bg.png"
const INK := Color("29332f")
const MUTED := Color("56615b")
const CREAM := Color("f5f0e7")
const STONE := Color("ddd7cf")

var word_bank: WordRpgWordBank = WordBank.new()
var run: WordRpgAdventureRun
var mode := "home"
var camera: Camera2D
var hud: CanvasLayer
var fx: Node
var timer_label: Label
var status_label: Label
var player_sprite: Sprite2D
var enemy_sprite: Sprite2D

var selection_deadline := 0
var question_deadline := 0
var question_batch: Array[Dictionary] = []
var round_questions: Array[Dictionary] = []
var question_index := 0
var correct_answers := 0
var quiz_start_ms := 0
var quiz_locked := false
var busy := false
var last_loot: Dictionary = {}
var last_reward: Dictionary = {}

func _ready() -> void:
	word_bank.load_from_web_source()
	show_home()
	_refresh_cloud_session()

func _process(_delta: float) -> void:
	if mode == "cards" and selection_deadline > 0 and is_instance_valid(timer_label):
		var remaining_ms := maxi(0, selection_deadline - Time.get_ticks_msec())
		timer_label.text = str(int(ceil(float(remaining_ms) / 1000.0)))
		if remaining_ms <= 0:
			selection_deadline = 0
			run.auto_fill_selection()
			confirm_cards()
	elif mode == "quiz" and question_deadline > 0 and not quiz_locked and is_instance_valid(timer_label):
		var remaining_ms := maxi(0, question_deadline - Time.get_ticks_msec())
		timer_label.text = str(int(ceil(float(remaining_ms) / 1000.0)))
		if remaining_ms <= 0:
			question_deadline = 0
			answer_question("")

func _refresh_cloud_session() -> void:
	var connected := await GameState.refresh_cloudflare_session()
	if mode == "home" and is_instance_valid(status_label):
		status_label.text = "LINE CONNECTED" if connected else "LOCAL · CLOUDFLARE READY"

func _reset_scene() -> void:
	for child in get_children():
		remove_child(child)
		child.queue_free()
	camera = Camera2D.new()
	camera.position = VIEW * 0.5
	add_child(camera)
	camera.make_current()
	hud = CanvasLayer.new()
	add_child(hud)
	fx = BattleFx.new()
	hud.add_child(fx)
	timer_label = null
	status_label = null
	player_sprite = null
	enemy_sprite = null

func show_home() -> void:
	mode = "home"
	selection_deadline = 0
	question_deadline = 0
	_reset_scene()
	_add_background(BG_LOGIN, 1.0)
	var line_btn := _image_button("res://images/line.png", Rect2(318, 555, 84, 84))
	line_btn.pressed.connect(show_setup)
	var fight_btn := _transparent_button(Rect2(205, 1080, 310, 105))
	fight_btn.pressed.connect(show_setup)
	status_label = _hud_label("CONNECTING…", Rect2(170, 1195, 380, 30), 13, HORIZONTAL_ALIGNMENT_CENTER, Color(0.27, 0.31, 0.29, 0.78))

func show_setup() -> void:
	mode = "setup"
	_reset_scene()
	_add_background(BG_GAME, 0.88)
	_add_scrim(Color(0.93, 0.91, 0.87, 0.25))

	var role_panel := _panel(Rect2(26, 30, 668, 480), _role_color(GameState.role), 28, Color(1, 1, 1, 0.55), 1)
	hud.add_child(role_panel)
	var role_data: Dictionary = GameData.ROLES[GameState.role]
	role_panel.add_child(_texture(String(role_data["art"]), Rect2(34, 62, 400, 370)))
	role_panel.add_child(_label("%s   Lv.%d" % [GameState.player_name, GameState.level], Rect2(430, 78, 220, 42), 24, HORIZONTAL_ALIGNMENT_CENTER, INK))
	role_panel.add_child(_label(GameData.title_name(GameState.level), Rect2(430, 119, 220, 32), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var stats: Dictionary = GameData.progression_stats(GameState.role, GameState.pet, GameState.level)
	_add_role_stats(role_panel, stats, Vector2(445, 180))
	_add_tabs(["warrior", "mage", "archer"], ["戰士", "法師", "弓手"], GameState.role, 38, 525, select_role)

	var pet_panel := _panel(Rect2(26, 595, 668, 255), _pet_color(GameState.pet), 26, Color(1, 1, 1, 0.48), 1)
	hud.add_child(pet_panel)
	var pet_data: Dictionary = GameData.PETS[GameState.pet]
	pet_panel.add_child(_texture(String(pet_data["art"]), Rect2(70, 28, 280, 185)))
	_add_pet_stats(pet_panel, Vector2(390, 50))
	_add_tabs(["fox", "owl", "dragon"], ["靈狐", "夜梟", "幼龍"], GameState.pet, 38, 865, select_pet)

	var equipment_btn := _image_button("res://images/equipment.png", Rect2(42, 968, 145, 105))
	equipment_btn.pressed.connect(show_inventory)
	var fight_btn := _image_button("res://images/fight.png", Rect2(202, 948, 155, 135))
	fight_btn.pressed.connect(start_adventure)
	var pk_btn := _image_button("res://images/PK.png", Rect2(370, 968, 145, 105))
	pk_btn.pressed.connect(func() -> void: _notice("PK", "下一階段直接接回 Cloudflare /match WebSocket"))
	var pet_btn := _image_button("res://images/pet-skill.png", Rect2(535, 968, 145, 105))
	pet_btn.pressed.connect(func() -> void: _notice("寵物技能", "會沿用原版技能樹與結晶強化規則"))
	_hud_label("%s  ·  %s" % [String(role_data["trait"]), String(pet_data["trait"])], Rect2(60, 1102, 600, 46), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED)
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 70))
	back_btn.pressed.connect(show_home)

func select_role(id: String) -> void:
	GameState.select_role(id)
	show_setup()

func select_pet(id: String) -> void:
	GameState.select_pet(id)
	show_setup()

func start_adventure() -> void:
	run = AdventureRun.new()
	run.start(GameState.role, GameState.pet, GameState.level)
	question_batch.clear()
	last_loot.clear()
	last_reward.clear()
	selection_deadline = 0
	show_cards()

func show_cards() -> void:
	mode = "cards"
	busy = false
	question_deadline = 0
	if selection_deadline <= 0:
		selection_deadline = Time.get_ticks_msec() + 60000
	_reset_scene()
	_build_combat_stage(run.player, run.enemy)
	var card_panel := _panel(Rect2(18, 500, 684, 744), Color(0.91, 0.87, 0.81, 0.95), 26, Color(1, 1, 1, 0.42), 1)
	hud.add_child(card_panel)
	timer_label = _hud_label("60", Rect2(292, 512, 136, 42), 29, HORIZONTAL_ALIGNMENT_CENTER, INK)
	var grid := GridContainer.new()
	grid.columns = 3
	grid.position = Vector2(22, 560)
	grid.size = Vector2(640, 565)
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	hud.add_child(grid)
	for i in range(run.hand.size()):
		if run.used.has(i):
			continue
		var order := run.selected.find(i) + 1
		var card_btn := _battle_card(run.hand[i], run.selected.has(i), order)
		card_btn.pressed.connect(toggle_card.bind(i))
		grid.add_child(card_btn)
	var confirm_btn := _image_button("res://images/confirm.png", Rect2(245, 1153, 230, 70))
	confirm_btn.disabled = run.selected.size() != 3
	confirm_btn.modulate.a = 1.0 if not confirm_btn.disabled else 0.38
	confirm_btn.pressed.connect(confirm_cards)

func toggle_card(index: int) -> void:
	if busy:
		return
	run.toggle_card(index)
	show_cards()

func confirm_cards() -> void:
	if busy:
		return
	if run.selected.size() != 3:
		run.auto_fill_selection()
	if run.selected.size() != 3:
		return
	busy = true
	selection_deadline = 0
	if run.round_no == 1 and question_batch.size() != 10:
		_show_loading("題庫載入中…")
		question_batch = await _load_question_batch()
	var start := (run.round_no - 1) * 5
	round_questions.clear()
	for i in range(5):
		round_questions.append(question_batch[start + i])
	question_index = 0
	correct_answers = 0
	quiz_start_ms = Time.get_ticks_msec()
	busy = false
	show_quiz()

func _load_question_batch() -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	var cloud: Dictionary = await CloudflareClient.get_questions(10)
	if bool(cloud.get("ok", false)):
		var data: Dictionary = cloud.get("data", {})
		var raw: Variant = data.get("indices", [])
		if raw is Array and raw.size() == 10:
			for value in raw:
				out.append(word_bank.make_question(int(value)))
	if out.size() != 10:
		out = word_bank.random_questions(10)
	return out

func show_quiz() -> void:
	mode = "quiz"
	quiz_locked = false
	question_deadline = Time.get_ticks_msec() + 10000
	_reset_scene()
	_build_combat_stage(run.player, run.enemy)
	var panel := _panel(Rect2(24, 510, 672, 690), Color(0.85, 0.89, 0.85, 0.97), 26, Color(1, 1, 1, 0.5), 1)
	hud.add_child(panel)
	panel.add_child(_label("%d / 5" % [question_index + 1], Rect2(28, 18, 110, 38), 18, HORIZONTAL_ALIGNMENT_LEFT, MUTED))
	timer_label = _label("10", Rect2(560, 18, 80, 38), 24, HORIZONTAL_ALIGNMENT_CENTER, INK)
	panel.add_child(timer_label)
	var q: Dictionary = round_questions[question_index]
	var word_panel := _panel(Rect2(66, 80, 540, 135), Color(0.94, 0.93, 0.89, 0.98), 24, Color(0.70, 0.73, 0.69, 0.7), 2)
	panel.add_child(word_panel)
	word_panel.add_child(_label(String(q["word"]), Rect2(20, 15, 500, 105), 40, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var options: Array = q.get("options", [])
	for i in range(options.size()):
		var x := 34.0 + float(i % 2) * 308.0
		var y := 255.0 + float(i / 2) * 145.0
		var answer_btn := _text_button(String(options[i]), Rect2(x, y, 290, 112), 22, Color(0.93, 0.91, 0.86, 0.98), INK)
		panel.add_child(answer_btn)
		answer_btn.pressed.connect(answer_question.bind(String(options[i])))
	panel.add_child(_label("答對 %d 題" % correct_answers, Rect2(210, 560, 250, 40), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))

func answer_question(value: String) -> void:
	if mode != "quiz" or quiz_locked:
		return
	quiz_locked = true
	question_deadline = 0
	var q: Dictionary = round_questions[question_index]
	var answer := String(q["answer"])
	var ok := value == answer
	if ok:
		correct_answers += 1
	else:
		run.wrong_answers.append({"word": String(q["word"]), "answer": answer, "selected": value if not value.is_empty() else "未作答"})
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
	for step in steps:
		await _play_action_step(step, false)
	busy = false
	var next := run.next_round_or_auto()
	if next == "cards":
		selection_deadline = 0
		show_cards()
	elif next == "auto":
		var auto_steps: Array[Dictionary] = run.auto_duel_steps()
		for step in auto_steps:
			await _play_action_step(step, true)
		finish_stage()
	else:
		finish_stage()

func _play_action_step(step: Dictionary, auto: bool) -> void:
	var player_state: Dictionary = step.get("player", run.player)
	var enemy_state: Dictionary = step.get("enemy", run.enemy)
	_reset_scene()
	_build_combat_stage(player_state, enemy_state)
	var mine := String(step.get("who", "player")) == "player"
	var panel := _panel(Rect2(75, 520, 570, 175), Color("eadbd7") if mine else Color("d9e3e9"), 24, Color(1, 1, 1, 0.48), 1)
	hud.add_child(panel)
	var card: Dictionary = step.get("card", {})
	var title := "普通攻擊" if auto or card.is_empty() else String(card.get("name", "技能"))
	panel.add_child(_label(title, Rect2(28, 20, 514, 44), 27, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var logs: Array = step.get("logs", [])
	var log_text := ""
	for i in range(maxi(0, logs.size() - 3), logs.size()):
		log_text += ("\n" if not log_text.is_empty() else "") + String(logs[i])
	panel.add_child(_label(log_text, Rect2(30, 68, 510, 88), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	await get_tree().process_frame
	if mine:
		await fx.play_card(player_sprite, enemy_sprite, camera, {"id": "basic", "color": "red"} if auto else card, 80 if auto else int(step.get("damage", 0)))
	else:
		if auto or card.is_empty():
			await fx.play_enemy_attack(enemy_sprite, player_sprite, camera)
		else:
			await fx.play_card(enemy_sprite, player_sprite, camera, card, int(step.get("damage", 0)))
	await get_tree().create_timer(0.12 if auto else 0.22).timeout

func finish_stage() -> void:
	var outcome := run.outcome()
	if outcome == "win":
		last_reward = GameState.add_xp(80 + run.stage_index * 25)
		last_loot = GameData.roll_loot(run.stage_index, GameState.level)
		if not last_loot.is_empty():
			GameState.add_loot(last_loot)
		if GameState.authenticated:
			GameState.sync_cloudflare_progress()
		show_stage_clear()
	else:
		show_loss(outcome == "draw")

func show_stage_clear() -> void:
	mode = "result"
	_reset_scene()
	_add_background(BG_GAME, 0.80)
	_texture_to_hud("res://images/victor.png", Rect2(165, 55, 390, 135))
	_texture_to_hud(String(GameData.ROLES[GameState.role]["art"]), Rect2(60, 190, 350, 500))
	var foe := _texture(String(run.stage_data()["art"]), Rect2(405, 250, 260, 370))
	foe.modulate = Color(0.45, 0.45, 0.45, 0.72)
	hud.add_child(foe)
	var reward_panel := _panel(Rect2(85, 705, 550, 280), CREAM, 28, Color(1, 1, 1, 0.65), 1)
	hud.add_child(reward_panel)
	reward_panel.add_child(_label("EXP +%d" % int(last_reward.get("amount", 0)), Rect2(35, 24, 480, 50), 28, HORIZONTAL_ALIGNMENT_CENTER, INK))
	if not last_loot.is_empty():
		reward_panel.add_child(_texture(String(last_loot.get("art", "")), Rect2(55, 82, 150, 150)))
		reward_panel.add_child(_label(String(last_loot.get("name", "裝備")), Rect2(220, 105, 280, 55), 23, HORIZONTAL_ALIGNMENT_LEFT, INK))
	else:
		reward_panel.add_child(_label("本關沒有掉落裝備", Rect2(70, 115, 410, 55), 20, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	if run.stage_index < GameData.STAGES.size() - 1:
		var next_btn := _text_button("NEXT", Rect2(225, 1030, 270, 78), 28, Color("566d62"), Color.WHITE)
		hud.add_child(next_btn)
		next_btn.pressed.connect(next_stage)
	else:
		var summary_btn := _text_button("戰績", Rect2(225, 1030, 270, 78), 26, Color("566d62"), Color.WHITE)
		hud.add_child(summary_btn)
		summary_btn.pressed.connect(show_summary)
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1145, 160, 65))
	back_btn.pressed.connect(show_setup)

func next_stage() -> void:
	if run.advance_stage():
		question_batch.clear()
		selection_deadline = 0
		show_cards()
	else:
		show_summary()

func show_summary() -> void:
	mode = "summary"
	_reset_scene()
	_add_background(BG_GAME, 0.70)
	var panel := _panel(Rect2(55, 80, 610, 1040), CREAM, 30, Color(1, 1, 1, 0.72), 1)
	hud.add_child(panel)
	panel.add_child(_label("冒險完成", Rect2(45, 35, 520, 60), 34, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var total := int(run.stats.get("total", 0))
	var correct := int(run.stats.get("correct", 0))
	var rate := 0 if total <= 0 else roundi(float(correct) / float(total) * 100.0)
	panel.add_child(_label("%d%%\n答對率" % rate, Rect2(55, 135, 150, 110), 24, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("%d\n輸出傷害" % int(run.stats.get("damage", 0)), Rect2(230, 135, 150, 110), 24, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("%d\n恢復生命" % int(run.stats.get("heal", 0)), Rect2(405, 135, 150, 110), 24, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("錯題分析", Rect2(55, 285, 500, 50), 25, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var wrong_text := "本次全對"
	if not run.wrong_answers.is_empty():
		wrong_text = ""
		for item in run.wrong_answers:
			wrong_text += "%s  →  %s\n" % [String(item.get("word", "")), String(item.get("answer", ""))]
	panel.add_child(_label(wrong_text.strip_edges(), Rect2(75, 345, 460, 440), 19, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var again_btn := _text_button("再玩一次", Rect2(170, 850, 270, 72), 24, Color("566d62"), Color.WHITE)
	panel.add_child(again_btn)
	again_btn.pressed.connect(start_adventure)
	var setup_btn := _text_button("返回角色", Rect2(170, 935, 270, 62), 20, STONE, INK)
	panel.add_child(setup_btn)
	setup_btn.pressed.connect(show_setup)

func show_loss(draw := false) -> void:
	mode = "result"
	_reset_scene()
	_add_background(BG_GAME, 0.75)
	_texture_to_hud("res://images/fail.png", Rect2(175, 95, 370, 150))
	_hud_label("平手" if draw else "挑戰失敗", Rect2(150, 720, 420, 65), 32, HORIZONTAL_ALIGNMENT_CENTER, INK)
	var retry_btn := _text_button("重新冒險", Rect2(195, 850, 330, 78), 25, Color("566d62"), Color.WHITE)
	hud.add_child(retry_btn)
	retry_btn.pressed.connect(start_adventure)
	var back_btn := _image_button("res://images/return.png", Rect2(280, 975, 160, 70))
	back_btn.pressed.connect(show_setup)

func show_inventory() -> void:
	mode = "inventory"
	_reset_scene()
	_add_background(BG_GAME, 0.72)
	var panel := _panel(Rect2(35, 55, 650, 1080), CREAM, 28, Color(1, 1, 1, 0.68), 1)
	hud.add_child(panel)
	panel.add_child(_label("裝備", Rect2(40, 25, 570, 60), 32, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var scroll := ScrollContainer.new()
	scroll.position = Vector2(30, 105)
	scroll.size = Vector2(590, 850)
	panel.add_child(scroll)
	var list := VBoxContainer.new()
	list.custom_minimum_size = Vector2(570, 0)
	list.add_theme_constant_override("separation", 10)
	scroll.add_child(list)
	if GameState.inventory.is_empty():
		list.add_child(_label("尚未取得裝備\n擊敗怪物有機率掉落", Rect2(0, 0, 570, 180), 21, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	else:
		for item in GameState.inventory:
			var row := _panel(Rect2(), Color(0.90, 0.88, 0.84, 0.88), 18, Color(0.64, 0.61, 0.55, 0.38), 1)
			row.custom_minimum_size = Vector2(560, 120)
			row.add_child(_texture(String(item.get("art", "")), Rect2(12, 10, 105, 100)))
			row.add_child(_label(String(item.get("name", "裝備")), Rect2(135, 25, 385, 38), 21, HORIZONTAL_ALIGNMENT_LEFT, INK))
			row.add_child(_label("Lv.%d" % int(item.get("level", 1)), Rect2(135, 67, 220, 30), 16, HORIZONTAL_ALIGNMENT_LEFT, MUTED))
			list.add_child(row)
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 65))
	back_btn.pressed.connect(show_setup)

func _build_combat_stage(player_state: Dictionary, enemy_state: Dictionary) -> void:
	_add_background(BG_GAME, 0.96)
	_add_scrim(Color(0.93, 0.91, 0.87, 0.08))
	var back_btn := _image_button("res://images/return.png", Rect2(20, 18, 125, 55))
	back_btn.pressed.connect(show_setup)
	_hud_label("%d / %d" % [run.stage_index + 1, GameData.STAGES.size()], Rect2(565, 25, 120, 34), 18, HORIZONTAL_ALIGNMENT_RIGHT, MUTED)
	var combat := _panel(Rect2(20, 78, 680, 405), Color(1, 1, 1, 0.86), 28, Color(1, 1, 1, 0.72), 1)
	hud.add_child(combat)
	var role_data: Dictionary = GameData.ROLES[GameState.role]
	var stage: Dictionary = run.stage_data()
	player_sprite = _sprite(String(role_data["art"]), Vector2(185, 250), Vector2(290, 280))
	enemy_sprite = _sprite(String(stage["art"]), Vector2(535, 245), Vector2(285, 275))
	if player_sprite != null:
		fx.start_idle(player_sprite, 0.92)
	if enemy_sprite != null:
		fx.start_idle(enemy_sprite, 0.84)
	_texture_to_hud("res://images/VS.png", Rect2(323, 150, 82, 82))
	_hud_label(GameState.player_name, Rect2(55, 350, 260, 35), 20, HORIZONTAL_ALIGNMENT_CENTER, INK)
	_hud_label(String(stage["name"]), Rect2(405, 350, 260, 35), 20, HORIZONTAL_ALIGNMENT_CENTER, INK)
	_add_hp_bar(Rect2(55, 392, 260, 14), player_state, Color("718f7c"))
	_add_hp_bar(Rect2(405, 392, 260, 14), enemy_state, Color("b86e67"))
	_add_compact_stats(player_state, Vector2(92, 417))
	_add_compact_stats(enemy_state, Vector2(442, 417))

func _add_compact_stats(fighter: Dictionary, at: Vector2) -> void:
	var defs: Array = [
		["res://images/ATK.png", str(roundi(float(fighter.get("atk", 0))))],
		["res://images/DEF.png", str(roundi(float(fighter.get("def", 0))))],
		["res://images/Crit.png", "%d%%" % roundi(float(fighter.get("crit", 0.0)) * 100.0)],
		["res://images/Shield.png", str(maxi(0, int(fighter.get("shield", 0))))]
	]
	for i in range(defs.size()):
		var x := at.x + float(i % 2) * 112.0
		var y := at.y + float(i / 2) * 35.0
		_texture_to_hud(String(defs[i][0]), Rect2(x, y, 28, 28))
		_hud_label(String(defs[i][1]), Rect2(x + 32, y, 70, 28), 13, HORIZONTAL_ALIGNMENT_LEFT, MUTED)

func _add_hp_bar(rect: Rect2, fighter: Dictionary, fill: Color) -> void:
	var bg := ColorRect.new()
	bg.position = rect.position
	bg.size = rect.size
	bg.color = Color(0.78, 0.80, 0.78, 0.92)
	hud.add_child(bg)
	var ratio := clampf(float(fighter.get("hp", 0)) / maxf(1.0, float(fighter.get("max_hp", 1))), 0.0, 1.0)
	var bar := ColorRect.new()
	bar.position = rect.position
	bar.size = Vector2(rect.size.x * ratio, rect.size.y)
	bar.color = fill
	hud.add_child(bar)

func _battle_card(card: Dictionary, selected: bool, order: int) -> Button:
	var button := Button.new()
	button.custom_minimum_size = Vector2(206, 180)
	button.text = ""
	button.focus_mode = Control.FOCUS_NONE
	var fill := _card_color(String(card.get("color", "neutral")))
	var border := Color(0.33, 0.45, 0.38, 0.92) if selected else Color(0.33, 0.35, 0.34, 0.28)
	button.add_theme_stylebox_override("normal", _box(fill, 16, border, 3 if selected else 1))
	button.add_theme_stylebox_override("hover", _box(fill.lightened(0.035), 16, border, 3 if selected else 1))
	button.add_theme_stylebox_override("pressed", _box(fill.darkened(0.05), 16, border, 3))
	button.add_child(_texture(String(card.get("art", "")), Rect2(10, 8, 186, 112)))
	button.add_child(_label(String(card.get("name", "技能")), Rect2(8, 120, 190, 28), 18, HORIZONTAL_ALIGNMENT_CENTER, INK))
	button.add_child(_label(_card_hint(card), Rect2(8, 147, 190, 27), 12, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	if order > 0:
		button.add_child(_label("•".repeat(order), Rect2(142, 3, 55, 28), 24, HORIZONTAL_ALIGNMENT_RIGHT, Color("41594d")))
	return button

func _card_hint(card: Dictionary) -> String:
	if String(card.get("kind", "")) == "stat":
		return "%s %d%%" % ["爆擊" if String(card.get("stat", "")) == "crit" else "提升", int(card.get("pct", 0))]
	var hints := {
		"combo": "3 次連擊", "desperate": "200% · 自身降防", "poison": "傷害 · 中毒 3 回合",
		"break": "傷害 · 降防 2 回合", "sun": "傷害 · 封鎖爆擊", "preempt": "傷害 · 降攻 2 回合",
		"regen": "立即＋持續回血", "sacrifice": "300% · 消耗生命", "restore": "大量回血",
		"diamond": "防禦 +200%", "aegis": "攻擊力轉護盾", "boost": "強化下一張"
	}
	return String(hints.get(String(card.get("id", "")), card.get("text", "")))

func _add_role_stats(parent: Control, stats: Dictionary, at: Vector2) -> void:
	var defs: Array = [
		["res://images/HP.png", str(int(stats.get("max_hp", 0)))],
		["res://images/ATK.png", str(int(stats.get("atk", 0)))],
		["res://images/DEF.png", str(int(stats.get("def", 0)))]
	]
	for i in range(defs.size()):
		parent.add_child(_texture(String(defs[i][0]), Rect2(at.x, at.y + i * 66, 44, 44)))
		parent.add_child(_label(String(defs[i][1]), Rect2(at.x + 54, at.y + i * 66, 120, 44), 23, HORIZONTAL_ALIGNMENT_LEFT, INK))

func _add_pet_stats(parent: Control, at: Vector2) -> void:
	var pet_data: Dictionary = GameData.PETS[GameState.pet]
	var values: Array = [
		["res://images/HP.png", roundi(float(pet_data["hp"]) * (1.0 + float(GameState.level - 1) * 0.03))],
		["res://images/ATK.png", roundi(float(pet_data["atk"]) * (1.0 + float(GameState.level - 1) * 0.03))],
		["res://images/DEF.png", roundi(float(pet_data["def"]) * (1.0 + float(GameState.level - 1) * 0.03))]
	]
	for i in range(values.size()):
		parent.add_child(_texture(String(values[i][0]), Rect2(at.x, at.y + i * 50, 38, 38)))
		parent.add_child(_label(str(values[i][1]), Rect2(at.x + 48, at.y + i * 50, 100, 38), 20, HORIZONTAL_ALIGNMENT_LEFT, INK))

func _add_tabs(ids: Array, names: Array, current: String, start_x: float, y: float, callback: Callable) -> void:
	for i in range(ids.size()):
		var active := String(ids[i]) == current
		var bg := Color("566d62") if active else Color(0.86, 0.84, 0.80, 0.96)
		var fg := Color.WHITE if active else INK
		var button := _text_button(String(names[i]), Rect2(start_x + i * 215, y, 200, 54), 20, bg, fg)
		hud.add_child(button)
		button.pressed.connect(callback.bind(String(ids[i])))

func _notice(title: String, text: String) -> void:
	var overlay := ColorRect.new()
	overlay.position = Vector2.ZERO
	overlay.size = VIEW
	overlay.color = Color(0.05, 0.06, 0.06, 0.55)
	hud.add_child(overlay)
	var card := _panel(Rect2(95, 430, 530, 300), CREAM, 28, Color(1, 1, 1, 0.8), 2)
	hud.add_child(card)
	card.add_child(_label(title, Rect2(40, 35, 450, 52), 31, HORIZONTAL_ALIGNMENT_CENTER, INK))
	card.add_child(_label(text, Rect2(50, 105, 430, 90), 19, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var close_btn := _text_button("確認", Rect2(165, 215, 200, 58), 21, Color("566d62"), Color.WHITE)
	card.add_child(close_btn)
	close_btn.pressed.connect(func() -> void:
		overlay.queue_free()
		card.queue_free()
	)

func _show_loading(text: String) -> void:
	mode = "loading"
	_reset_scene()
	_build_combat_stage(run.player, run.enemy)
	var panel := _panel(Rect2(70, 565, 580, 260), Color("d8e2d8"), 28, Color(1, 1, 1, 0.55), 1)
	hud.add_child(panel)
	panel.add_child(_label(text, Rect2(40, 80, 500, 72), 29, HORIZONTAL_ALIGNMENT_CENTER, INK))

func _show_feedback(text: String, ok: bool) -> void:
	_reset_scene()
	_build_combat_stage(run.player, run.enemy)
	var panel := _panel(Rect2(100, 610, 520, 220), Color(0.78, 0.87, 0.79, 0.98) if ok else Color(0.90, 0.77, 0.75, 0.98), 30, Color(1, 1, 1, 0.5), 1)
	hud.add_child(panel)
	panel.add_child(_label(text, Rect2(30, 60, 460, 90), 32, HORIZONTAL_ALIGNMENT_CENTER, INK))

func _role_color(id: String) -> Color:
	match id:
		"mage": return Color("e7dcda")
		"archer": return Color("dce5dc")
		_: return Color("dbe3e7")

func _pet_color(id: String) -> Color:
	match id:
		"owl": return Color("e4e1d9")
		"dragon": return Color("dce6de")
		_: return Color("e9ddd2")

func _card_color(id: String) -> Color:
	match id:
		"green": return Color(0.85, 0.91, 0.87, 0.96)
		"blue": return Color(0.84, 0.89, 0.93, 0.96)
		"red": return Color(0.92, 0.85, 0.84, 0.96)
		"yellow": return Color(0.94, 0.91, 0.76, 0.96)
		_: return Color(0.89, 0.88, 0.85, 0.96)

func _add_background(path: String, alpha := 1.0) -> void:
	var texture := _load_texture(path)
	if texture == null:
		return
	var sprite := Sprite2D.new()
	sprite.texture = texture
	sprite.position = VIEW * 0.5
	sprite.modulate.a = alpha
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	var size := texture.get_size()
	if size.x > 0.0 and size.y > 0.0:
		sprite.scale = Vector2.ONE * maxf(VIEW.x / size.x, VIEW.y / size.y)
	sprite.z_index = -100
	add_child(sprite)

func _add_scrim(color: Color) -> void:
	var rect := ColorRect.new()
	rect.position = Vector2.ZERO
	rect.size = VIEW
	rect.color = color
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(rect)

func _sprite(path: String, at: Vector2, max_size: Vector2) -> Sprite2D:
	var texture := _load_texture(path)
	if texture == null:
		return null
	var sprite := Sprite2D.new()
	sprite.texture = texture
	sprite.position = at
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	sprite.z_index = 2
	var size := texture.get_size()
	if size.x > 0.0 and size.y > 0.0:
		sprite.scale = Vector2.ONE * minf(max_size.x / size.x, max_size.y / size.y)
	if is_instance_valid(hud):
		hud.add_child(sprite)
	else:
		add_child(sprite)
	return sprite

func _texture(path: String, rect: Rect2) -> TextureRect:
	var texture_rect := TextureRect.new()
	texture_rect.position = rect.position
	texture_rect.size = rect.size
	texture_rect.texture = _load_texture(path)
	texture_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	texture_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	texture_rect.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	texture_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return texture_rect

func _texture_to_hud(path: String, rect: Rect2) -> TextureRect:
	var texture_rect := _texture(path, rect)
	hud.add_child(texture_rect)
	return texture_rect

func _load_texture(path: String) -> Texture2D:
	if path.is_empty() or not ResourceLoader.exists(path):
		return null
	return load(path) as Texture2D

func _panel(rect: Rect2, color: Color, radius: int, border: Color, width: int) -> Panel:
	var panel := Panel.new()
	panel.position = rect.position
	panel.size = rect.size
	panel.add_theme_stylebox_override("panel", _box(color, radius, border, width))
	return panel

func _box(color: Color, radius: int, border: Color, width: int) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = color
	box.corner_radius_top_left = radius
	box.corner_radius_top_right = radius
	box.corner_radius_bottom_left = radius
	box.corner_radius_bottom_right = radius
	box.border_width_left = width
	box.border_width_right = width
	box.border_width_top = width
	box.border_width_bottom = width
	box.border_color = border
	return box

func _label(text: String, rect: Rect2, font_size: int, align := HORIZONTAL_ALIGNMENT_LEFT, color := Color.WHITE) -> Label:
	var label := Label.new()
	label.text = text
	label.position = rect.position
	label.size = rect.size
	label.horizontal_alignment = align
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	UiFont.apply(label)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label

func _hud_label(text: String, rect: Rect2, font_size: int, align := HORIZONTAL_ALIGNMENT_LEFT, color := Color.WHITE) -> Label:
	var label := _label(text, rect, font_size, align, color)
	hud.add_child(label)
	return label

func _text_button(text: String, rect: Rect2, font_size: int, bg: Color, fg: Color) -> Button:
	var button := Button.new()
	button.text = text
	button.position = rect.position
	button.size = rect.size
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", font_size)
	button.add_theme_color_override("font_color", fg)
	button.add_theme_color_override("font_hover_color", fg)
	UiFont.apply(button)
	button.add_theme_stylebox_override("normal", _box(bg, 16, Color(1, 1, 1, 0.28), 1))
	button.add_theme_stylebox_override("hover", _box(bg.lightened(0.04), 16, Color(1, 1, 1, 0.42), 1))
	button.add_theme_stylebox_override("pressed", _box(bg.darkened(0.06), 16, Color(1, 1, 1, 0.52), 2))
	return button

func _transparent_button(rect: Rect2) -> Button:
	var button := Button.new()
	button.position = rect.position
	button.size = rect.size
	button.text = ""
	button.focus_mode = Control.FOCUS_NONE
	var empty := StyleBoxEmpty.new()
	button.add_theme_stylebox_override("normal", empty)
	button.add_theme_stylebox_override("hover", empty)
	button.add_theme_stylebox_override("pressed", empty)
	hud.add_child(button)
	return button

func _image_button(path: String, rect: Rect2) -> Button:
	var button := _transparent_button(rect)
	button.add_child(_texture(path, Rect2(Vector2.ZERO, rect.size)))
	return button
