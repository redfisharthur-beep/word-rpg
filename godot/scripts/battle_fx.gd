extends Node

var _idle_tweens: Dictionary = {}

func start_idle(sprite: Sprite2D, intensity: float = 1.0) -> void:
	if not is_instance_valid(sprite):
		return
	var base_scale: Vector2 = sprite.scale
	var tween: Tween = create_tween()
	tween.set_loops()
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(sprite, "scale", base_scale * Vector2(1.025, 0.98), 0.72 / intensity)
	tween.tween_property(sprite, "scale", base_scale, 0.72 / intensity)
	_idle_tweens[sprite] = tween

func play_combo(player: Sprite2D, enemy: Sprite2D, camera: Camera2D) -> void:
	var player_origin: Vector2 = player.position
	var enemy_origin: Vector2 = enemy.position
	var target: Vector2 = enemy_origin + Vector2(-175, 45)

	# 1) 微蓄力：靜態立繪靠縮放與後座產生準備動作。
	var charge: Tween = create_tween()
	charge.set_trans(Tween.TRANS_QUAD)
	charge.set_ease(Tween.EASE_OUT)
	charge.tween_property(player, "position", player_origin + Vector2(-24, 8), 0.10)
	await charge.finished

	# 2) 瞬步：同一張 PNG 前衝，沿途留下淡出的殘影。
	_spawn_afterimage(player, player.position, 0.42)
	var dash: Tween = create_tween()
	dash.set_trans(Tween.TRANS_EXPO)
	dash.set_ease(Tween.EASE_OUT)
	dash.tween_property(player, "position", target, 0.13)
	await get_tree().create_timer(0.035).timeout
	_spawn_afterimage(player, player_origin + Vector2(55, 0), 0.34)
	await get_tree().create_timer(0.035).timeout
	_spawn_afterimage(player, player_origin.lerp(target, 0.56), 0.28)
	await dash.finished

	# 3) 三段斬擊：每段都有斬線、受擊、傷害字與不同強度震動。
	var slash_angles: Array[float] = [-0.62, 0.48, -0.12]
	var damages: Array[String] = ["128", "146", "CRIT 312"]
	for i: int in range(3):
		_spawn_slash(enemy.position, slash_angles[i], i == 2)
		_spawn_damage(enemy.position, damages[i], i == 2)
		await _hit_reaction(enemy, enemy_origin, 14.0 + float(i) * 6.0)
		await _shake_camera(camera, 5.0 + float(i) * 2.5, 0.075 + float(i) * 0.025)
		await get_tree().create_timer(0.035).timeout

	# 4) 終擊：敵人被推出、角色短暫停格，再回到原位。
	var knockback: Tween = create_tween()
	knockback.set_trans(Tween.TRANS_BACK)
	knockback.set_ease(Tween.EASE_OUT)
	knockback.tween_property(enemy, "position", enemy_origin + Vector2(58, -10), 0.12)
	await knockback.finished

	await get_tree().create_timer(0.08).timeout

	var recover: Tween = create_tween()
	recover.set_parallel(true)
	recover.set_trans(Tween.TRANS_QUAD)
	recover.set_ease(Tween.EASE_OUT)
	recover.tween_property(player, "position", player_origin, 0.24)
	recover.tween_property(enemy, "position", enemy_origin, 0.30)
	recover.tween_property(enemy, "modulate", Color.WHITE, 0.16)
	await recover.finished

func _spawn_afterimage(source: Sprite2D, at_position: Vector2, alpha: float) -> void:
	var ghost: Sprite2D = Sprite2D.new()
	ghost.texture = source.texture
	ghost.position = at_position
	ghost.scale = source.scale
	ghost.rotation = source.rotation
	ghost.flip_h = source.flip_h
	ghost.z_index = source.z_index - 1
	ghost.modulate = Color(0.78, 0.9, 1.0, alpha)
	source.get_parent().add_child(ghost)

	var fade: Tween = create_tween()
	fade.set_trans(Tween.TRANS_QUAD)
	fade.set_ease(Tween.EASE_OUT)
	fade.tween_property(ghost, "modulate:a", 0.0, 0.26)
	fade.tween_property(ghost, "scale", ghost.scale * 1.05, 0.08)
	fade.tween_callback(ghost.queue_free)

func _spawn_slash(at_position: Vector2, angle: float, critical: bool = false) -> void:
	var line: Line2D = Line2D.new()
	line.points = PackedVector2Array([Vector2(-118, 0), Vector2(118, 0)])
	line.width = 20.0 if critical else 13.0
	line.default_color = Color(1.0, 0.82, 0.52, 0.98) if critical else Color(0.91, 0.95, 1.0, 0.92)
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
	await slash.finished
	line.queue_free()

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
	await pop.finished
	label.queue_free()

func _hit_reaction(enemy: Sprite2D, origin: Vector2, power: float) -> void:
	var hit: Tween = create_tween()
	hit.set_parallel(true)
	hit.set_trans(Tween.TRANS_QUAD)
	hit.set_ease(Tween.EASE_OUT)
	hit.tween_property(enemy, "position", origin + Vector2(power, -4), 0.045)
	hit.tween_property(enemy, "modulate", Color(1.0, 0.43, 0.43, 1.0), 0.035)
	await hit.finished

	var rebound: Tween = create_tween()
	rebound.set_parallel(true)
	rebound.set_trans(Tween.TRANS_BACK)
	rebound.set_ease(Tween.EASE_OUT)
	rebound.tween_property(enemy, "position", origin, 0.075)
	rebound.tween_property(enemy, "modulate", Color.WHITE, 0.07)
	await rebound.finished

func _shake_camera(camera: Camera2D, strength: float, duration: float) -> void:
	var steps: int = maxi(3, int(duration / 0.018))
	for _i: int in range(steps):
		camera.offset = Vector2(randf_range(-strength, strength), randf_range(-strength, strength))
		await get_tree().create_timer(duration / float(steps)).timeout
	camera.offset = Vector2.ZERO
