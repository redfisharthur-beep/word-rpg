extends Node

const SLASH_TEXTURE: Texture2D = preload("res://images/effect-slash.png")
const CRIT_TEXTURE: Texture2D = preload("res://images/effect-crit.png")
const GUARD_TEXTURE: Texture2D = preload("res://images/effect-guard.png")
const HEAL_TEXTURE: Texture2D = preload("res://images/effect-heal.png")

var _idle_tweens: Dictionary = {}

func start_idle(sprite: Sprite2D, intensity: float = 1.0) -> void:
	if not is_instance_valid(sprite):
		return
	_stop_idle(sprite)
	var base_scale: Vector2 = sprite.scale
	var tween: Tween = create_tween()
	tween.set_loops()
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(sprite, "scale", base_scale * Vector2(1.018, 0.986), 0.78 / maxf(0.2, intensity))
	tween.tween_property(sprite, "scale", base_scale, 0.78 / maxf(0.2, intensity))
	_idle_tweens[sprite] = tween

func _stop_idle(sprite: Sprite2D) -> void:
	if not _idle_tweens.has(sprite):
		return
	var tween: Tween = _idle_tweens[sprite]
	if tween != null and tween.is_valid():
		tween.kill()
	_idle_tweens.erase(sprite)

func play_card(attacker: Sprite2D, defender: Sprite2D, camera: Camera2D, card: Dictionary, damage: int) -> void:
	if not is_instance_valid(attacker) or not is_instance_valid(defender):
		return
	var id: String = String(card.get("id", ""))
	var color_name: String = String(card.get("color", "neutral"))
	var supportive: bool = damage <= 0 or ["regen", "restore", "diamond", "aegis", "boost"].has(id) or id.begins_with("stat-")
	if supportive:
		var heal_like: bool = color_name == "green" or id == "regen" or id == "restore" or id == "stat-hp"
		await _support_sequence(attacker, HEAL_TEXTURE if heal_like else GUARD_TEXTURE, color_name)
		return
	var hits: int = 1
	if id == "combo": hits = 3
	if id.begins_with("archer-10"): hits = 2
	if id.begins_with("archer-30"): hits = 3
	var heavy: bool = id == "sacrifice" or id.ends_with("-50") or damage >= 300
	await _offensive_sequence(attacker, defender, camera, hits, maxi(1, damage), color_name, heavy)

func play_enemy_attack(attacker: Sprite2D, defender: Sprite2D, camera: Camera2D) -> void:
	if not is_instance_valid(attacker) or not is_instance_valid(defender):
		return
	var attacker_origin: Vector2 = attacker.position
	var defender_origin: Vector2 = defender.position
	var direction: float = 1.0 if defender_origin.x > attacker_origin.x else -1.0
	_stop_idle(attacker)
	var windup: Tween = create_tween()
	windup.set_trans(Tween.TRANS_QUAD)
	windup.set_ease(Tween.EASE_OUT)
	windup.tween_property(attacker, "position", attacker_origin + Vector2(-20.0 * direction, 5.0), 0.08)
	await windup.finished
	_spawn_afterimage(attacker, attacker.position, 0.26, Color(0.72, 0.82, 1.0, 1.0))
	var dash: Tween = create_tween()
	dash.set_trans(Tween.TRANS_EXPO)
	dash.set_ease(Tween.EASE_OUT)
	dash.tween_property(attacker, "position", defender_origin + Vector2(-130.0 * direction, 24.0), 0.14)
	await dash.finished
	_spawn_effect(SLASH_TEXTURE, defender_origin, Color(0.72, 0.82, 1.0, 1.0), -0.28 * direction, 230.0)
	_spawn_damage(defender_origin, "HIT", false, Color(0.88, 0.94, 1.0))
	await _hit_reaction(defender, defender_origin, 22.0 * direction)
	await _shake_camera(camera, 7.0, 0.11)
	var recover: Tween = create_tween()
	recover.set_trans(Tween.TRANS_QUAD)
	recover.set_ease(Tween.EASE_OUT)
	recover.tween_property(attacker, "position", attacker_origin, 0.20)
	await recover.finished
	start_idle(attacker, 0.84)

func play_combo(player: Sprite2D, enemy: Sprite2D, camera: Camera2D) -> void:
	await _offensive_sequence(player, enemy, camera, 3, 312, "red", true)

func _offensive_sequence(attacker: Sprite2D, defender: Sprite2D, camera: Camera2D, hits: int, total_damage: int, color_name: String, heavy: bool) -> void:
	var attacker_origin: Vector2 = attacker.position
	var defender_origin: Vector2 = defender.position
	var direction: float = 1.0 if defender_origin.x > attacker_origin.x else -1.0
	var skill_color: Color = _skill_color(color_name)
	_stop_idle(attacker)

	var base_scale: Vector2 = attacker.scale
	var charge: Tween = create_tween()
	charge.set_parallel(true)
	charge.set_trans(Tween.TRANS_QUAD)
	charge.set_ease(Tween.EASE_OUT)
	charge.tween_property(attacker, "position", attacker_origin + Vector2(-22.0 * direction, 7.0), 0.09)
	charge.tween_property(attacker, "scale", base_scale * Vector2(0.965, 1.035), 0.09)
	await charge.finished

	_spawn_afterimage(attacker, attacker.position, 0.34, skill_color)
	var dash: Tween = create_tween()
	dash.set_trans(Tween.TRANS_EXPO)
	dash.set_ease(Tween.EASE_OUT)
	dash.tween_property(attacker, "position", defender_origin + Vector2(-135.0 * direction, 28.0), 0.13)
	await get_tree().create_timer(0.03).timeout
	_spawn_afterimage(attacker, attacker_origin.lerp(defender_origin, 0.38), 0.26, skill_color)
	await get_tree().create_timer(0.03).timeout
	_spawn_afterimage(attacker, attacker_origin.lerp(defender_origin, 0.67), 0.18, skill_color)
	await dash.finished

	var safe_hits: int = maxi(1, hits)
	var each_damage: int = maxi(1, roundi(float(total_damage) / float(safe_hits)))
	for i: int in range(safe_hits):
		var final_hit: bool = i == safe_hits - 1
		var critical: bool = heavy and final_hit
		var effect_texture: Texture2D = CRIT_TEXTURE if critical else SLASH_TEXTURE
		var angle: float = [-0.55, 0.43, -0.08][i % 3] * direction
		var target_size: float = 285.0 if critical else 235.0
		_spawn_effect(effect_texture, defender_origin, skill_color, angle, target_size)
		_spawn_damage(defender_origin, str(each_damage), critical, Color("ffd177") if critical else Color.WHITE)
		await _hit_reaction(defender, defender_origin, (16.0 + float(i) * 5.0) * direction)
		await _shake_camera(camera, (9.5 if critical else 5.5) + float(i) * 1.2, 0.11 if critical else 0.065)
		await get_tree().create_timer(0.035).timeout

	var recover: Tween = create_tween()
	recover.set_parallel(true)
	recover.set_trans(Tween.TRANS_QUAD)
	recover.set_ease(Tween.EASE_OUT)
	recover.tween_property(attacker, "position", attacker_origin, 0.21)
	recover.tween_property(attacker, "scale", base_scale, 0.20)
	recover.tween_property(defender, "position", defender_origin, 0.18)
	recover.tween_property(defender, "modulate", Color.WHITE, 0.12)
	await recover.finished
	start_idle(attacker, 0.92)

func _support_sequence(sprite: Sprite2D, texture: Texture2D, color_name: String) -> void:
	_stop_idle(sprite)
	var origin_scale: Vector2 = sprite.scale
	var glow: Color = _skill_color(color_name)
	_spawn_effect(texture, sprite.position + Vector2(0, -18), glow, 0.0, 245.0)
	var pulse: Tween = create_tween()
	pulse.set_parallel(true)
	pulse.set_trans(Tween.TRANS_BACK)
	pulse.set_ease(Tween.EASE_OUT)
	pulse.tween_property(sprite, "scale", origin_scale * 1.075, 0.16)
	pulse.tween_property(sprite, "modulate", Color(glow.r, glow.g, glow.b, 1.0), 0.14)
	await pulse.finished
	var recover: Tween = create_tween()
	recover.set_parallel(true)
	recover.set_trans(Tween.TRANS_QUAD)
	recover.set_ease(Tween.EASE_OUT)
	recover.tween_property(sprite, "scale", origin_scale, 0.22)
	recover.tween_property(sprite, "modulate", Color.WHITE, 0.22)
	await recover.finished
	start_idle(sprite, 0.92)

func _spawn_effect(texture: Texture2D, at_position: Vector2, tint: Color, rotation_value: float, target_size: float) -> void:
	if texture == null:
		return
	var effect: Sprite2D = Sprite2D.new()
	effect.texture = texture
	effect.position = at_position
	effect.rotation = rotation_value
	effect.modulate = Color(tint.r, tint.g, tint.b, 0.98)
	effect.z_index = 40
	effect.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var source_size: Vector2 = texture.get_size()
	var base_factor: float = target_size / maxf(1.0, maxf(source_size.x, source_size.y))
	effect.scale = Vector2.ONE * base_factor * 0.45
	add_child(effect)
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.set_trans(Tween.TRANS_EXPO)
	tween.set_ease(Tween.EASE_OUT)
	tween.tween_property(effect, "scale", Vector2.ONE * base_factor * 1.15, 0.14)
	tween.tween_property(effect, "modulate:a", 0.0, 0.30).set_delay(0.06)
	tween.tween_property(effect, "rotation", rotation_value + 0.08, 0.22)
	tween.chain().tween_callback(effect.queue_free)

func _spawn_afterimage(source: Sprite2D, at_position: Vector2, alpha: float, tint: Color) -> void:
	var ghost: Sprite2D = Sprite2D.new()
	ghost.texture = source.texture
	ghost.texture_filter = source.texture_filter
	ghost.position = at_position
	ghost.scale = source.scale
	ghost.rotation = source.rotation
	ghost.flip_h = source.flip_h
	ghost.z_index = source.z_index - 1
	ghost.modulate = Color(tint.r, tint.g, tint.b, alpha)
	source.get_parent().add_child(ghost)
	var fade: Tween = create_tween()
	fade.set_parallel(true)
	fade.set_trans(Tween.TRANS_QUAD)
	fade.set_ease(Tween.EASE_OUT)
	fade.tween_property(ghost, "modulate:a", 0.0, 0.25)
	fade.tween_property(ghost, "scale", ghost.scale * 1.045, 0.25)
	fade.chain().tween_callback(ghost.queue_free)

func _spawn_damage(at_position: Vector2, text: String, critical: bool, color: Color) -> void:
	var label: Label = Label.new()
	label.text = text
	label.position = at_position + Vector2(-95, -150)
	label.size = Vector2(190, 58)
	label.z_index = 60
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 35 if critical else 27)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_outline_color", Color(0.08, 0.08, 0.08, 0.78))
	label.add_theme_constant_override("outline_size", 5 if critical else 3)
	add_child(label)
	var pop: Tween = create_tween()
	pop.set_parallel(true)
	pop.set_trans(Tween.TRANS_BACK)
	pop.set_ease(Tween.EASE_OUT)
	pop.tween_property(label, "position:y", label.position.y - 62.0, 0.36)
	pop.tween_property(label, "scale", Vector2(1.12, 1.12) if critical else Vector2.ONE, 0.15)
	pop.tween_property(label, "modulate:a", 0.0, 0.36).set_delay(0.14)
	pop.chain().tween_callback(label.queue_free)

func _hit_reaction(target: Sprite2D, origin: Vector2, power: float) -> void:
	var hit: Tween = create_tween()
	hit.set_parallel(true)
	hit.set_trans(Tween.TRANS_QUAD)
	hit.set_ease(Tween.EASE_OUT)
	hit.tween_property(target, "position", origin + Vector2(power, -4), 0.045)
	hit.tween_property(target, "modulate", Color(1.0, 0.62, 0.58, 1.0), 0.035)
	await hit.finished
	var rebound: Tween = create_tween()
	rebound.set_parallel(true)
	rebound.set_trans(Tween.TRANS_BACK)
	rebound.set_ease(Tween.EASE_OUT)
	rebound.tween_property(target, "position", origin, 0.075)
	rebound.tween_property(target, "modulate", Color.WHITE, 0.075)
	await rebound.finished

func _shake_camera(target_camera: Camera2D, strength: float, duration: float) -> void:
	var steps: int = maxi(3, int(duration / 0.018))
	for _i in range(steps):
		target_camera.offset = Vector2(randf_range(-strength, strength), randf_range(-strength, strength))
		await get_tree().create_timer(duration / float(steps)).timeout
	target_camera.offset = Vector2.ZERO

func _skill_color(color_name: String) -> Color:
	match color_name:
		"red": return Color(1.0, 0.48, 0.42, 1.0)
		"blue": return Color(0.48, 0.72, 1.0, 1.0)
		"green": return Color(0.50, 0.90, 0.62, 1.0)
		"yellow": return Color(1.0, 0.82, 0.40, 1.0)
		_: return Color(0.92, 0.92, 1.0, 1.0)
