extends Node

var _idle_tweens: Dictionary = {}

func start_idle(sprite: Sprite2D, intensity: float = 1.0) -> void:
	if not is_instance_valid(sprite): return
	_stop_idle(sprite)
	var base_scale: Vector2 = sprite.scale
	var tween: Tween = create_tween()
	tween.set_loops()
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(sprite, "scale", base_scale * Vector2(1.025, 0.98), 0.72 / intensity)
	tween.tween_property(sprite, "scale", base_scale, 0.72 / intensity)
	_idle_tweens[sprite] = tween

func _stop_idle(sprite: Sprite2D) -> void:
	if _idle_tweens.has(sprite):
		var tween: Tween = _idle_tweens[sprite]
		if tween != null and tween.is_valid(): tween.kill()
		_idle_tweens.erase(sprite)

func play_card(attacker: Sprite2D, defender: Sprite2D, camera: Camera2D, card: Dictionary, damage: int) -> void:
	if not is_instance_valid(attacker) or not is_instance_valid(defender): return
	var id: String = String(card.get("id", ""))
	var color: String = String(card.get("color", "neutral"))
	if damage <= 0:
		await _support_pulse(attacker, color)
		return
	var hits: int = 3 if id == "combo" else 1
	if id.begins_with("archer-10"): hits = 2
	if id.begins_with("archer-30"): hits = 3
	await _offensive_sequence(attacker, defender, camera, hits, damage, color)

func play_enemy_attack(attacker: Sprite2D, defender: Sprite2D, camera: Camera2D) -> void:
	if not is_instance_valid(attacker) or not is_instance_valid(defender): return
	var origin: Vector2 = attacker.position
	var target: Vector2 = defender.position + Vector2(145, 20)
	_stop_idle(attacker)
	var dash: Tween = create_tween()
	dash.set_trans(Tween.TRANS_EXPO)
	dash.set_ease(Tween.EASE_OUT)
	dash.tween_property(attacker, "position", target, 0.16)
	await dash.finished
	_spawn_slash(defender.position, -0.35, true, Color(0.72, 0.82, 1.0, 0.96))
	await _hit_reaction(defender, defender.position, -22.0)
	await _shake_camera(camera, 8.0, 0.13)
	var recover: Tween = create_tween()
	recover.set_trans(Tween.TRANS_QUAD)
	recover.set_ease(Tween.EASE_OUT)
	recover.tween_property(attacker, "position", origin, 0.22)
	await recover.finished
	start_idle(attacker, 0.82)

func play_combo(player: Sprite2D, enemy: Sprite2D, camera: Camera2D) -> void:
	await _offensive_sequence(player, enemy, camera, 3, 312, "red")

func _offensive_sequence(attacker: Sprite2D, defender: Sprite2D, camera: Camera2D, hits: int, total_damage: int, color: String) -> void:
	var attacker_origin: Vector2 = attacker.position
	var defender_origin: Vector2 = defender.position
	var direction: float = 1.0 if defender_origin.x > attacker_origin.x else -1.0
	var target: Vector2 = defender_origin + Vector2(-145.0 * direction, 34.0)
	_stop_idle(attacker)
	var charge: Tween = create_tween()
	charge.set_trans(Tween.TRANS_QUAD)
	charge.set_ease(Tween.EASE_OUT)
	charge.tween_property(attacker, "position", attacker_origin + Vector2(-22.0 * direction, 7.0), 0.09)
	charge.parallel().tween_property(attacker, "scale", attacker.scale * Vector2(0.96, 1.04), 0.09)
	await charge.finished
	_spawn_afterimage(attacker, attacker.position, 0.42)
	var dash: Tween = create_tween()
	dash.set_trans(Tween.TRANS_EXPO)
	dash.set_ease(Tween.EASE_OUT)
	dash.tween_property(attacker, "position", target, 0.13)
	await get_tree().create_timer(0.035).timeout
	_spawn_afterimage(attacker, attacker_origin.lerp(target, 0.40), 0.32)
	await get_tree().create_timer(0.035).timeout
	_spawn_afterimage(attacker, attacker_origin.lerp(target, 0.72), 0.24)
	await dash.finished
	var slash_color: Color = _skill_color(color)
	var safe_hits: int = maxi(1, hits)
	var each_damage: int = maxi(1, roundi(float(total_damage) / float(safe_hits)))
	for i: int in range(safe_hits):
		var angle: float = [-0.62, 0.48, -0.12][i % 3]
		var critical: bool = i == safe_hits - 1 and total_damage >= 220
		_spawn_slash(defender.position, angle, critical, slash_color)
		_spawn_damage(defender.position, str(each_damage), critical)
		await _hit_reaction(defender, defender_origin, direction * (14.0 + float(i) * 5.0))
		await _shake_camera(camera, 5.0 + float(i) * 1.8, 0.07 + float(i) * 0.015)
		await get_tree().create_timer(0.04).timeout
	var recover: Tween = create_tween()
	recover.set_parallel(true)
	recover.set_trans(Tween.TRANS_QUAD)
	recover.set_ease(Tween.EASE_OUT)
	recover.tween_property(attacker, "position", attacker_origin, 0.22)
	recover.tween_property(defender, "position", defender_origin, 0.20)
	recover.tween_property(defender, "modulate", Color.WHITE, 0.12)
	await recover.finished
	start_idle(attacker, 0.92)

func _support_pulse(sprite: Sprite2D, color_name: String) -> void:
	_stop_idle(sprite)
	var base_scale: Vector2 = sprite.scale
	var base_modulate: Color = sprite.modulate
	var glow: Color = _skill_color(color_name)
	glow.a = 1.0
	var pulse: Tween = create_tween()
	pulse.set_parallel(true)
	pulse.set_trans(Tween.TRANS_BACK)
	pulse.set_ease(Tween.EASE_OUT)
	pulse.tween_property(sprite, "scale", base_scale * 1.10, 0.18)
	pulse.tween_property(sprite, "modulate", glow, 0.14)
	await pulse.finished
	var recover: Tween = create_tween()
	recover.set_parallel(true)
	recover.tween_property(sprite, "scale", base_scale, 0.22)
	recover.tween_property(sprite, "modulate", base_modulate, 0.22)
	await recover.finished
	start_idle(sprite, 0.92)

func _skill_color(color_name: String) -> Color:
	match color_name:
		"red": return Color(1.0, 0.48, 0.42, 0.98)
		"blue": return Color(0.48, 0.72, 1.0, 0.98)
		"green": return Color(0.50, 0.90, 0.62, 0.98)
		"yellow": return Color(1.0, 0.82, 0.40, 0.98)
	return Color(0.92, 0.92, 1.0, 0.98)

func _spawn_afterimage(source: Sprite2D, at_position: Vector2, alpha: float) -> void:
	var ghost: Sprite2D = Sprite2D.new()
	ghost.texture = source.texture
	ghost.texture_filter = source.texture_filter
	ghost.position = at_position
	ghost.scale = source.scale
	ghost.rotation = source.rotation
	ghost.flip_h = source.flip_h
	ghost.z_index = source.z_index - 1
	ghost.modulate = Color(0.78, 0.9, 1.0, alpha)
	source.get_parent().add_child(ghost)
	var fade: Tween = create_tween()
	fade.set_parallel(true)
	fade.set_trans(Tween.TRANS_QUAD)
	fade.set_ease(Tween.EASE_OUT)
	fade.tween_property(ghost, "modulate:a", 0.0, 0.26)
	fade.tween_property(ghost, "scale", ghost.scale * 1.05, 0.26)
	fade.chain().tween_callback(ghost.queue_free)

func _spawn_slash(at_position: Vector2, angle: float, critical: bool = false, slash_color: Color = Color.WHITE) -> void:
	var line: Line2D = Line2D.new()
	line.points = PackedVector2Array([Vector2(-118, 0), Vector2(118, 0)])
	line.width = 20.0 if critical else 13.0
	line.default_color = slash_color
	line.position = at_position
	line.rotation = angle
	line.scale = Vector2(0.18, 0.18)
	line.z_index = 30
	add_child(line)
	var slash: Tween = create_tween()
	slash.set_parallel(true)
	slash.set_trans(Tween.TRANS_EXPO)
	slash.set_ease(Tween.EASE_OUT)
	slash.tween_property(line, "scale", Vector2(1.25, 1.25), 0.11)
	slash.tween_property(line, "modulate:a", 0.0, 0.18)
	slash.chain().tween_callback(line.queue_free)

func _spawn_damage(at_position: Vector2, text: String, critical: bool = false) -> void:
	var label: Label = Label.new()
	label.text = text
	label.position = at_position + Vector2(-65, -190)
	label.size = Vector2(180, 64)
	label.z_index = 50
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 34 if critical else 26)
	label.add_theme_color_override("font_color", Color("ffd177") if critical else Color.WHITE)
	add_child(label)
	var pop: Tween = create_tween()
	pop.set_parallel(true)
	pop.set_trans(Tween.TRANS_BACK)
	pop.set_ease(Tween.EASE_OUT)
	pop.tween_property(label, "position:y", label.position.y - 72.0, 0.38)
	pop.tween_property(label, "modulate:a", 0.0, 0.42).set_delay(0.12)
	pop.chain().tween_callback(label.queue_free)

func _hit_reaction(target: Sprite2D, origin: Vector2, power: float) -> void:
	var hit: Tween = create_tween()
	hit.set_parallel(true)
	hit.set_trans(Tween.TRANS_QUAD)
	hit.set_ease(Tween.EASE_OUT)
	hit.tween_property(target, "position", origin + Vector2(power, -4), 0.045)
	hit.tween_property(target, "modulate", Color(1.0, 0.43, 0.43, 1.0), 0.035)
	await hit.finished
	var rebound: Tween = create_tween()
	rebound.set_parallel(true)
	rebound.set_trans(Tween.TRANS_BACK)
	rebound.set_ease(Tween.EASE_OUT)
	rebound.tween_property(target, "position", origin, 0.075)
	rebound.tween_property(target, "modulate", Color.WHITE, 0.07)
	await rebound.finished

func _shake_camera(target_camera: Camera2D, strength: float, duration: float) -> void:
	var steps: int = maxi(3, int(duration / 0.018))
	for _i: int in range(steps):
		target_camera.offset = Vector2(randf_range(-strength, strength), randf_range(-strength, strength))
		await get_tree().create_timer(duration / float(steps)).timeout
	target_camera.offset = Vector2.ZERO
