extends "res://godot/scripts/game_v3.gd"

const RpgRuntime = preload("res://godot/scripts/rpg_runtime.gd")
const InventoryRuntime = preload("res://godot/scripts/inventory_runtime.gd")

## Final production-facing Godot UI layer.
## Combat/progression logic remains in game_v3.gd; this file owns interactive
## pet/equipment surfaces so those systems stay out of the battle controller.

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
	if bool(GameState.collection_unlocks().get("title", false)): title_text = "萬象收藏家"
	role_panel.add_child(_label(title_text, Rect2(420, 102, 225, 34), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var stats: Dictionary = GameData.progression_stats(GameState.role, GameState.pet, GameState.level)
	_add_role_stats(role_panel, stats, Vector2(440, 160))
	_add_tabs(["warrior", "mage", "archer"], ["戰士", "法師", "弓手"], GameState.role, 30, 468, select_role)
	var pet_panel := _panel(Rect2(26, 535, 668, 220), _pet_color(GameState.pet), 26, Color(1, 1, 1, 0.48), 1)
	hud.add_child(pet_panel)
	var pet_data := GameState.pet_display_data(GameState.pet)
	if bool(pet_data.get("awakened", false)):
		pet_panel.add_child(_panel(Rect2(44, 18, 300, 180), Color(0.98, 0.88, 0.52, 0.16), 90, Color(0.94, 0.74, 0.28, 0.58), 3))
		pet_panel.add_child(_label("AWAKEN", Rect2(372, 20, 240, 30), 14, HORIZONTAL_ALIGNMENT_CENTER, Color("9a7529")))
	pet_panel.add_child(_texture(String(pet_data["art"]), Rect2(62, 20, 290, 175)))
	pet_panel.add_child(_label(String(pet_data.get("name", "寵物")), Rect2(365, 54, 250, 40), 23, HORIZONTAL_ALIGNMENT_CENTER, INK))
	pet_panel.add_child(_label("強化 Lv.%d / 4" % GameState.pet_enhance_level(GameState.pet), Rect2(365, 96, 250, 30), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	_add_pet_stats(pet_panel, Vector2(392, 134))
	_add_tabs(["fox", "owl", "dragon"], ["靈狐", "夜梟", "幼龍"], GameState.pet, 30, 770, select_pet)
	var button_size := Vector2(180, 92)
	var x_positions := [56.0, 270.0, 484.0]
	var top_y := 866.0
	var bottom_y := 980.0
	var fight_btn := _image_button("res://images/fight.png", Rect2(x_positions[0], top_y, button_size.x, button_size.y)); fight_btn.pressed.connect(start_adventure)
	var pk_btn := _image_button("res://images/PK.png", Rect2(x_positions[1], top_y, button_size.x, button_size.y)); pk_btn.pressed.connect(start_native_pk)
	var tower_btn := _image_button("res://images/Test.png", Rect2(x_positions[2], top_y, button_size.x, button_size.y)); tower_btn.pressed.connect(start_tower)
	var pet_btn := _image_button("res://images/pet.png", Rect2(x_positions[0], bottom_y, button_size.x, button_size.y)); pet_btn.pressed.connect(show_pet_progression)
	var equipment_btn := _image_button("res://images/equipment.png", Rect2(x_positions[1], bottom_y, button_size.x, button_size.y)); equipment_btn.pressed.connect(show_inventory)
	var collection_btn := _image_button("res://images/Compendium.png", Rect2(x_positions[2], bottom_y, button_size.x, button_size.y)); collection_btn.pressed.connect(show_collection)
	_hud_label("冒險   ·   PK   ·   試煉\n寵物   ·   裝備   ·   圖鑑", Rect2(80, 1082, 560, 58), 14, HORIZONTAL_ALIGNMENT_CENTER, Color(0.29, 0.34, 0.31, 0.72))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 66)); back_btn.pressed.connect(show_home)

func start_native_pk() -> void:
	get_tree().change_scene_to_file("res://godot/scenes/pk.tscn")

func show_pet_progression() -> void:
	mode = "pet-progression"
	_reset_scene()
	_add_background(BG_GAME, 0.76)
	var panel := _panel(Rect2(38, 34, 644, 1100), CREAM, 28, Color(1, 1, 1, 0.70), 1)
	hud.add_child(panel)
	panel.add_child(_label("寵物", Rect2(35, 10, 574, 48), 30, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("結晶 %d   ·   技能點 %d" % [GameState.crystals(), RpgRuntime.available_skill_points(GameState.level, GameState.rpg)], Rect2(290, 58, 300, 30), 16, HORIZONTAL_ALIGNMENT_RIGHT, Color("8a6b2c")))
	var pet_data := GameState.pet_display_data(GameState.pet)
	var awakened := bool(pet_data.get("awakened", false))
	if awakened:
		panel.add_child(_panel(Rect2(65, 98, 260, 285), Color(0.97, 0.84, 0.42, 0.11), 120, Color(0.92, 0.70, 0.25, 0.52), 3))
	panel.add_child(_texture(String(pet_data.get("art", "")), Rect2(65, 88, 270, 300)))
	panel.add_child(_label(String(pet_data.get("name", "寵物")), Rect2(350, 118, 240, 42), 25, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var level := GameState.pet_enhance_level(GameState.pet)
	panel.add_child(_label("強化 Lv.%d / 4%s" % [level, " · 覺醒" if awakened else ""], Rect2(350, 164, 240, 32), 16, HORIZONTAL_ALIGNMENT_CENTER, Color("8d6d2c") if awakened else MUTED))
	panel.add_child(_label(String(pet_data.get("trait", "")), Rect2(350, 205, 240, 70), 14, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var cost := GameState.pet_enhance_cost(GameState.pet)
	if level < 4:
		var enhance_btn := _text_button("強化 · %d 結晶" % cost, Rect2(365, 292, 210, 58), 17, Color("75633d") if GameState.can_enhance_pet(GameState.pet) else Color("a7a29a"), Color.WHITE)
		enhance_btn.disabled = not GameState.can_enhance_pet(GameState.pet)
		panel.add_child(enhance_btn)
		enhance_btn.pressed.connect(_enhance_current_pet)
	else:
		panel.add_child(_label("✦ 覺醒完成 ✦", Rect2(365, 292, 210, 58), 19, HORIZONTAL_ALIGNMENT_CENTER, Color("a77e28")))
	_add_tabs(["fox", "owl", "dragon"], ["靈狐", "夜梟", "幼龍"], GameState.pet, 30, 430, _select_pet_from_progression)
	panel.add_child(_label("技能樹", Rect2(55, 500, 180, 38), 22, HORIZONTAL_ALIGNMENT_LEFT, INK))
	var pet_skills: Dictionary = RpgRuntime.ensure_shape(GameState.rpg)["petSkills"]
	var owned: Array = pet_skills.get(GameState.pet, [])
	var tree: Array = RpgRuntime.PET_TREES[GameState.pet]
	for i in range(tree.size()):
		var node: Dictionary = tree[i]
		var y := 548.0 + float(i) * 92.0
		var has := owned.has(String(node["id"]))
		var can := RpgRuntime.can_unlock_pet_skill(GameState.pet, String(node["id"]), GameState.level, GameState.rpg)
		var row := _panel(Rect2(55, y, 534, 78), Color("dce8dd") if has else Color("ebe7df"), 16, Color("6f8a75") if has else Color(0.65,0.62,0.56,0.30), 1)
		panel.add_child(row)
		row.add_child(_label("%d" % [i + 1], Rect2(12, 12, 38, 54), 21, HORIZONTAL_ALIGNMENT_CENTER, Color("52705a") if has else MUTED))
		row.add_child(_label(String(node["name"]), Rect2(55, 6, 205, 31), 17, HORIZONTAL_ALIGNMENT_LEFT, INK))
		row.add_child(_label(String(node["desc"]), Rect2(55, 36, 315, 34), 13, HORIZONTAL_ALIGNMENT_LEFT, MUTED))
		var skill_btn := _text_button("已解鎖" if has else "%d 點" % int(node["cost"]), Rect2(400, 16, 118, 46), 14, Color("708779") if has else (Color("77683f") if can else Color("aaa59d")), Color.WHITE)
		skill_btn.disabled = has or not can
		row.add_child(skill_btn)
		if not has: skill_btn.pressed.connect(_unlock_pet_skill.bind(String(node["id"])))
	panel.add_child(_label("技能點 = 玩家 Lv. - 1，三隻寵物共用；節點必須依序解鎖", Rect2(65, 1015, 514, 34), 13, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 65)); back_btn.pressed.connect(show_setup)

func _select_pet_from_progression(id: String) -> void:
	GameState.select_pet(id)
	show_pet_progression()

func _enhance_current_pet() -> void:
	if GameState.enhance_pet(GameState.pet): show_pet_progression()

func _unlock_pet_skill(node_id: String) -> void:
	var next_rpg := RpgRuntime.unlock_pet_skill(GameState.pet, node_id, GameState.level, GameState.rpg)
	GameState.rpg = next_rpg
	GameState.save_local()
	GameState.state_changed.emit()
	if GameState.authenticated: GameState.sync_cloudflare_progress()
	show_pet_progression()

func show_inventory() -> void:
	mode = "inventory"
	_reset_scene()
	_add_background(BG_GAME, 0.72)
	var panel := _panel(Rect2(28, 42, 664, 1094), CREAM, 28, Color(1, 1, 1, 0.70), 1)
	hud.add_child(panel)
	panel.add_child(_label("裝備", Rect2(40, 18, 584, 52), 31, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("結晶 %d" % GameState.crystals(), Rect2(450, 68, 150, 30), 16, HORIZONTAL_ALIGNMENT_RIGHT, Color("8a6b2c")))
	var bonuses := GameState.equipment_bonuses()
	var summary := GameData.bonus_text(bonuses)
	if summary.is_empty(): summary = "尚未裝備能力加成"
	var equipped := GameState.rpg.get("equipped", {}) as Dictionary
	var slots := "寶石 %d/3   護甲 %d/1   戒指 %d/2" % [(equipped.get("gems", []) as Array).size(),0 if equipped.get("armor", null) == null else 1,(equipped.get("rings", []) as Array).size()]
	var resonance := RpgRuntime.equipment_resonance(GameState.rpg, GameState.inventory)
	var active_res: Array[String] = []
	if bool(resonance.get("war",false)): active_res.append("烈戰")
	if bool(resonance.get("blood",false)): active_res.append("血靈")
	if bool(resonance.get("guard",false)): active_res.append("鐵壁")
	var resonance_text := "共鳴：%s" % ("／".join(active_res) if not active_res.is_empty() else "未啟動")
	var summary_panel := _panel(Rect2(42, 105, 580, 134), Color(0.88, 0.90, 0.86, 0.96), 20, Color(0.55, 0.63, 0.56, 0.36), 1)
	panel.add_child(summary_panel)
	summary_panel.add_child(_label(slots, Rect2(22, 8, 536, 32), 17, HORIZONTAL_ALIGNMENT_CENTER, INK))
	summary_panel.add_child(_label(summary, Rect2(22, 43, 536, 38), 15, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	summary_panel.add_child(_label(resonance_text, Rect2(22, 84, 536, 32), 15, HORIZONTAL_ALIGNMENT_CENTER, Color("7f6630")))
	var scroll := ScrollContainer.new(); scroll.position = Vector2(34, 260); scroll.size = Vector2(596, 745); panel.add_child(scroll)
	var list := VBoxContainer.new(); list.custom_minimum_size = Vector2(575, 0); list.add_theme_constant_override("separation", 10); scroll.add_child(list)
	if GameState.inventory.is_empty(): list.add_child(_label("尚未取得裝備\n擊敗怪物有機率掉落", Rect2(0, 0, 570, 180), 21, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	else:
		for item: Dictionary in GameState.inventory: list.add_child(_equipment_row(item))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 65)); back_btn.pressed.connect(show_setup)

func _equipment_row(item: Dictionary) -> Control:
	var item_id := String(item.get("id", ""))
	var equipped := GameState.is_equipped(item_id)
	var row := _panel(Rect2(), Color(0.91, 0.89, 0.84, 0.96), 18, Color(0.64, 0.61, 0.55, 0.34), 1)
	row.custom_minimum_size = Vector2(565, 184)
	row.add_child(_texture(String(item.get("art", "")), Rect2(10, 18, 112, 112)))
	var name_color := Color("8b6925") if String(item.get("quality", "")) == "mythic" else INK
	row.add_child(_label(String(item.get("name", "裝備")), Rect2(132, 10, 250, 32), 19, HORIZONTAL_ALIGNMENT_LEFT, name_color))
	var bonuses: Dictionary = item.get("bonuses", {})
	if bonuses.is_empty(): bonuses = GameData.item_bonuses(String(item.get("type", "")), String(item.get("subtype", "")), String(item.get("quality", "common")))
	row.add_child(_label(GameData.bonus_text(bonuses, item), Rect2(132, 43, 245, 54), 13, HORIZONTAL_ALIGNMENT_LEFT, MUTED))
	row.add_child(_label("已裝備" if equipped else "未裝備", Rect2(132, 102, 100, 26), 14, HORIZONTAL_ALIGNMENT_LEFT, Color("55745f") if equipped else MUTED))
	var synth_info := InventoryRuntime.synthesis_info(GameState.inventory, GameState.equipped_ids(), item_id)
	var synth_count := int(synth_info.get("count", 0))
	var synth_label := "已最高階" if String(synth_info.get("next_quality", "")).is_empty() else "合成 %d/3" % mini(3, synth_count)
	var equip_btn := _text_button("卸下" if equipped else "裝上", Rect2(390, 12, 145, 42), 15, Color("61776a"), Color.WHITE)
	row.add_child(equip_btn)
	equip_btn.pressed.connect(_toggle_equipment.bind(item_id))
	var synth_can := bool(synth_info.get("can", false))
	var synth_btn := _text_button(synth_label, Rect2(390, 66, 145, 42), 14, Color("8b7438") if synth_can else Color("b5afa4"), Color.WHITE)
	synth_btn.disabled = not synth_can
	row.add_child(synth_btn)
	if synth_can: synth_btn.pressed.connect(_synthesize_equipment.bind(item_id))
	var gain := int(GameState.CRYSTAL_VALUE.get(String(item.get("quality", "common")), 1))
	var dismantle_btn := _text_button("分解 +%d" % gain, Rect2(390, 120, 145, 42), 14, Color("9b8a78") if not equipped else Color("b8b2aa"), Color.WHITE)
	dismantle_btn.disabled = equipped
	row.add_child(dismantle_btn)
	dismantle_btn.pressed.connect(_dismantle_equipment.bind(item_id))
	return row

func _toggle_equipment(item_id: String) -> void:
	if GameState.is_equipped(item_id): GameState.unequip_item(item_id)
	else: GameState.equip_item(item_id)
	show_inventory()

func _synthesize_equipment(item_id: String) -> void:
	var result := InventoryRuntime.synthesize(GameState.inventory, GameState.equipped_ids(), item_id)
	GameState.apply_synthesis(result)
	show_inventory()

func _dismantle_equipment(item_id: String) -> void:
	GameState.crystallize_item(item_id)
	show_inventory()
