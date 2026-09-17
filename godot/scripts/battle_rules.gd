extends RefCounted
class_name WordRpgBattleRules

const GameData = preload("res://godot/scripts/game_data.gd")
const OFFENSIVE: Array[String] = ["combo", "desperate", "poison", "break", "sun", "preempt", "sacrifice"]

static func fighter(extra: Dictionary = {}) -> Dictionary:
	var base: Dictionary = {
		"max_hp":500,"hp":500,"atk":100.0,"def":50.0,"crit":0.10,"shield":0,
		"poison":[],"armor_break":[],"atk_down":[],"def_boost":[],"heal_block":[],
		"crit_lock":0,"stun":0,"regen":0,"regen_fresh":false,
		"role":"warrior","pet":"","monster_id":"","enraged":false,
		"pet_fx":{},"resonance":{},"mythic_fx":{}
	}
	for key: Variant in extra.keys(): base[key] = extra[key]
	return base

static func player_fighter(role_id: String, pet_id: String, level: int) -> Dictionary:
	return fighter(GameData.progression_stats(role_id, pet_id, level))

static func monster_fighter(stage_index: int, level: int) -> Dictionary:
	var stats := GameData.stage_stats(stage_index, level)
	var idx := clampi(stage_index, 0, GameData.STAGES.size() - 1)
	stats["monster_id"] = String(GameData.STAGES[idx]["id"])
	return fighter(stats)

static func random_card() -> Dictionary:
	var id := String(GameData.CARD_POOL[randi_range(0, GameData.CARD_POOL.size() - 1)])
	if id == "stat":
		var defs: Array = [["hp","氣血充盈","green"],["def","罡氣護體","blue"],["atk","戰意沸騰","red"],["crit","破綻洞悉","yellow"]]
		var picked: Array = defs[randi_range(0, defs.size() - 1)]
		var stat := String(picked[0])
		var pct := randi_range(1,3) * 10 if stat == "crit" else randi_range(2,6) * 10
		return {"id":"stat-%s"%stat,"kind":"stat","stat":stat,"name":String(picked[1]),"color":String(picked[2]),"pct":pct,"text":"爆擊率提升 %d%%"%pct if stat=="crit" else "增加 %d%%"%pct,"art":"res://images/card-stat-%s.png"%stat}
	var card: Dictionary = (GameData.CARDS[id] as Dictionary).duplicate(true)
	card["id"] = id
	card["kind"] = "support" if id == "boost" else "skill"
	if id == "boost": card["boost"] = randi_range(3,8) * 10
	return card

static func deal_hand(count: int = 9, role_id: String = "", level: int = 1) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var skills: Array[Dictionary] = []
	if not role_id.is_empty() and GameData.EXCLUSIVE.has(role_id):
		for raw: Variant in GameData.EXCLUSIVE[role_id]:
			var skill: Dictionary = (raw as Dictionary).duplicate(true)
			if level >= int(skill.get("level",999)): skills.append(skill)
	var exclusive_count := 0
	if not role_id.is_empty():
		if level >= 50: exclusive_count = 3
		elif level >= 30: exclusive_count = 2
		elif level >= 10: exclusive_count = 1
	exclusive_count = mini(count, mini(exclusive_count, skills.size()))
	for _i in range(count - exclusive_count): result.append(random_card())
	var pool: Array[Dictionary] = skills.duplicate(true)
	for _i in range(exclusive_count):
		var at := randi_range(0, pool.size() - 1)
		var skill: Dictionary = pool.pop_at(at)
		skill["kind"] = "exclusive"
		skill["exclusive"] = true
		skill["role"] = role_id
		skill["art"] = "res://images/skill-%s-%d.png" % [role_id, int(skill.get("level",10))]
		result.append(skill)
	result.shuffle()
	return result

static func _active_pct(value: Variant) -> float:
	var total := 0.0
	if value is Array:
		for raw: Variant in value:
			if raw is Dictionary: total += float((raw as Dictionary).get("pct",0.0))
	return total

static func effective_def(f: Dictionary) -> float:
	return maxf(0.0, float(f.get("def",0.0)) * (1.0 + _active_pct(f.get("def_boost",[]))) * (1.0 - _active_pct(f.get("armor_break",[]))))

static func effective_atk(f: Dictionary) -> float:
	return maxf(1.0, float(f.get("atk",1.0)) * (1.0 - _active_pct(f.get("atk_down",[]))))

static func _apply_damage(defender: Dictionary, amount: int) -> Dictionary:
	var remaining := maxi(0, amount)
	var shield_damage := 0
	var hp_damage := 0
	var shield := int(defender.get("shield",0))
	if shield > 0 and remaining > 0:
		shield_damage = mini(shield, remaining)
		defender["shield"] = shield - shield_damage
		remaining -= shield_damage
	if remaining > 0 and int(defender.get("hp",0)) > 0:
		hp_damage = mini(int(defender["hp"]), remaining)
		defender["hp"] = maxi(0, int(defender["hp"]) - hp_damage)
	return {"dealt":shield_damage+hp_damage,"shield_damage":shield_damage,"hp_damage":hp_damage}

static func _heal_penalty(f: Dictionary) -> float:
	var max_penalty := 0.0
	for raw: Variant in f.get("heal_block", []):
		if raw is Dictionary: max_penalty = maxf(max_penalty, float((raw as Dictionary).get("pct",0.0)))
	return minf(0.95, maxf(0.0, max_penalty))

static func _heal(f: Dictionary, amount: int, label: String, logs: Array[String], overflow_to_shield: bool = true) -> int:
	var penalty := _heal_penalty(f)
	var adjusted := maxi(0, roundi(float(amount) * (1.0 - penalty)))
	var missing := maxi(0, int(f.get("max_hp",1)) - int(f.get("hp",0)))
	var take := mini(missing, adjusted)
	f["hp"] = int(f.get("hp",0)) + take
	var over := maxi(0, adjusted - take)
	if overflow_to_shield and over > 0: f["shield"] = int(f.get("shield",0)) + over
	if penalty > 0.0: logs.append("禁療：恢復 -%d%%" % roundi(penalty * 100.0))
	logs.append("%s +%d%s" % [label,take,"，護盾 +%d"%over if overflow_to_shield and over>0 else ""])
	return take

static func _consume_stun(f: Dictionary, logs: Array[String]) -> bool:
	if int(f.get("stun",0)) <= 0: return false
	f["stun"] = maxi(0, int(f["stun"]) - 1)
	logs.append("雷縛震擊：暈眩，跳過行動")
	return true

static func _hit(attacker: Dictionary, defender: Dictionary, mult: float, label: String, logs: Array[String], can_crit: bool = true) -> int:
	var atk_fx: Dictionary = attacker.get("mythic_fx", {})
	var def_fx: Dictionary = defender.get("mythic_fx", {})
	if float(def_fx.get("blockChance",0.0)) > 0.0 and randf() < float(def_fx["blockChance"]):
		logs.append("神佑格擋：完全抵擋")
		return 0
	var raw := effective_atk(attacker) * mult
	if bool(atk_fx.get("berserk",false)) and int(attacker.get("hp",0)) > 0 and float(attacker["hp"]) < float(attacker.get("max_hp",1)) * 0.5:
		raw *= 2.0
		logs.append("血怒狂戰：攻擊 ×2")
	var crit := false
	if can_crit and int(attacker.get("crit_lock",0)) <= 0 and randf() < float(attacker.get("crit",0.10)):
		raw *= 2.0
		crit = true
		var crit_max := float(atk_fx.get("critBonusMax",0.0))
		if crit_max > 0.0:
			var bonus := randf_range(float(atk_fx.get("critBonusMin",0.0)), crit_max)
			raw *= 1.0 + bonus
			logs.append("弒神暴擊 +%d%%" % roundi(bonus * 100.0))
	var defense := 0.0 if bool(atk_fx.get("trueDamage",false)) else effective_def(defender)
	var damage := maxi(1, roundi(raw * 100.0 / (100.0 + defense)))
	var result := _apply_damage(defender, damage)
	logs.append("%s%s%s %d" % [label,"（爆擊）" if crit else "","（真傷）" if bool(atk_fx.get("trueDamage",false)) else "",int(result["dealt"])])
	var dealt := int(result["dealt"])
	if dealt > 0:
		var lifesteal := float(atk_fx.get("lifesteal",0.0))
		if lifesteal > 0.0 and int(attacker.get("hp",0)) > 0:
			_heal(attacker, maxi(1, roundi(float(dealt) * lifesteal)), "血契汲取", logs, false)
		var sunder := float(atk_fx.get("sunderPct",0.0))
		if sunder > 0.0 and int(defender.get("hp",0)) > 0:
			var stacks := 0
			for state: Variant in defender.get("armor_break",[]):
				if state is Dictionary and String((state as Dictionary).get("source","")) == "mythic-sunder": stacks += 1
			if stacks < int(atk_fx.get("sunderMax",3)):
				(defender["armor_break"] as Array).append({"pct":sunder,"turns":int(atk_fx.get("sunderTurns",3)),"source":"mythic-sunder"})
				logs.append("蝕甲魔晶：防禦 -%d%%（%d/%d）" % [roundi(sunder*100.0),stacks+1,int(atk_fx.get("sunderMax",3))])
		var stun_chance := float(atk_fx.get("stunChance",0.0))
		if stun_chance > 0.0 and int(defender.get("hp",0)) > 0 and randf() < stun_chance:
			defender["stun"] = maxi(1, int(defender.get("stun",0)))
			logs.append("雷縛震擊：暈眩")
		var antiheal := float(atk_fx.get("antiHealPct",0.0))
		if antiheal > 0.0 and int(defender.get("hp",0)) > 0:
			var turns := int(atk_fx.get("antiHealMinTurns",2)) + (0 if randf() < 0.5 else 1)
			var rest: Array = []
			for state: Variant in defender.get("heal_block",[]):
				if state is Dictionary and String((state as Dictionary).get("source","")) != "mythic-antiheal": rest.append(state)
			rest.append({"pct":antiheal,"turns":turns,"source":"mythic-antiheal"})
			defender["heal_block"] = rest
			logs.append("禁療烙印：恢復 -%d%%・%d回合" % [roundi(antiheal*100.0),turns])
		var fatal_chance := float(atk_fx.get("fatalChance",0.0))
		if fatal_chance > 0.0 and int(defender.get("hp",0)) > 0 and randf() < fatal_chance:
			var fatal := maxi(1, roundi(float(defender.get("max_hp",1)) * float(atk_fx.get("fatalPct",0.0))))
			var fatal_result := _apply_damage(defender, fatal)
			logs.append("死神判決：致命傷害 %d" % int(fatal_result["dealt"]))
		var reflect := float(def_fx.get("reflect",0.0))
		if reflect > 0.0 and int(attacker.get("hp",0)) > 0:
			var reflected := maxi(1, roundi(float(dealt) * reflect))
			var back := _apply_damage(attacker, reflected)
			logs.append("荊棘反噬 %d" % int(back["dealt"]))
	return dealt

static func accuracy_multiplier(correct: int, actor: Dictionary) -> float:
	var n := clampi(correct,0,5)
	var pet := String(actor.get("pet",""))
	var fx: Dictionary = actor.get("pet_fx",{})
	if pet == "owl":
		var high := float(fx.get("highAccuracy",0.0)) if n >= 3 else 0.0
		match n:
			5: return 1.70 + high
			4: return 1.50 + high
			3: return 1.32 + high
			2: return 1.15
			1: return 0.90
			_: return 0.65
	match n:
		5: return 1.50
		4: return 1.32
		3: return 1.15
		2: return 0.90
		1: return 0.65
		_: return 0.0

static func is_offensive(card: Dictionary) -> bool:
	if card.is_empty(): return false
	if bool(card.get("exclusive",false)): return card.has("damage") or card.has("hits")
	return OFFENSIVE.has(String(card.get("id","")))

static func bond_multiplier(cards: Array[Dictionary], card: Dictionary) -> float:
	var color := String(card.get("color","neutral"))
	if color == "neutral": return 1.0
	var same := 0
	for other: Dictionary in cards:
		if String(other.get("color","neutral")) == color: same += 1
	return 1.5 if same >= 2 else 1.0

static func support_boost(card: Dictionary, actor: Dictionary) -> float:
	if String(card.get("id","")) != "boost": return 1.0
	var bonus := int(card.get("boost",0)) + (20 if String(actor.get("role","")) == "mage" else 0)
	return 1.0 + float(bonus) / 100.0

static func _apply_stat(card: Dictionary, actor: Dictionary, power: float, logs: Array[String]) -> void:
	var pct := (float(card.get("pct",0)) / 100.0) * power
	var stat := String(card.get("stat",""))
	if stat == "hp":
		var add := roundi(float(actor["max_hp"]) * pct)
		actor["max_hp"] = int(actor["max_hp"]) + add
		actor["hp"] = int(actor["hp"]) + add
		logs.append("生命值 +%d%%" % roundi(pct*100.0))
	elif stat == "crit":
		actor["crit"] = minf(0.80,float(actor.get("crit",0.10))+pct)
		logs.append("爆擊率 +%d%%" % roundi(pct*100.0))
	elif stat == "atk":
		actor["atk"] = float(actor["atk"]) * (1.0+pct)
		logs.append("攻擊力 +%d%%" % roundi(pct*100.0))
	elif stat == "def":
		actor["def"] = float(actor["def"]) * (1.0+pct)
		var shield := maxi(1,roundi(float(actor["max_hp"])*0.08*power))
		actor["shield"] = int(actor.get("shield",0)) + shield
		logs.append("防禦力 +%d%%" % roundi(pct*100.0))
		logs.append("防禦護盾 +%d" % shield)

static func _apply_exclusive(card: Dictionary, actor: Dictionary, target: Dictionary, power: float, logs: Array[String]) -> void:
	if card.has("hits"):
		for raw: Variant in card["hits"]:
			if int(target.get("hp",0)) <= 0: break
			_hit(actor,target,float(raw)*power,String(card["name"]),logs)
	elif card.has("damage"): _hit(actor,target,float(card["damage"])*power,String(card["name"]),logs)
	var scale := clampf(power,0.1,1.75)
	if card.has("heal") and int(actor.get("hp",0)) > 0: _heal(actor,roundi(float(actor["max_hp"])*float(card["heal"])*scale),String(card["name"]),logs,false)
	if card.has("shield") and int(actor.get("hp",0)) > 0:
		var shield := maxi(1,roundi(float(actor["max_hp"])*float(card["shield"])*scale))
		actor["shield"] = int(actor.get("shield",0)) + shield
		logs.append("%s 護盾 +%d" % [String(card["name"]),shield])
	if card.has("def_buff") and int(actor.get("hp",0)) > 0:
		var pct := float(card["def_buff"]) * scale
		actor["def"] = float(actor["def"]) * (1.0+pct)
		logs.append("%s 防禦 +%d%%" % [String(card["name"]),roundi(pct*100.0)])

static func resolve_card(actor: Dictionary, target: Dictionary, card: Dictionary, correct: int, options: Dictionary = {}) -> Dictionary:
	var logs: Array[String] = []
	var before_target_pool := int(target.get("hp",0)) + int(target.get("shield",0))
	var before_actor_hp := int(actor.get("hp",0))
	if _consume_stun(actor, logs): return {"logs":logs,"damage":0,"heal":0,"next_boost":float(options.get("boost",1.0))}
	var cards: Array[Dictionary] = options.get("cards",[])
	var slot_index := int(options.get("slot_index",0))
	var offensive_index := int(options.get("offensive_index",0))
	var speed_win := bool(options.get("speed_win",false))
	var boost := float(options.get("boost",1.0))
	var acc := accuracy_multiplier(correct, actor)
	if acc <= 0.0:
		logs.append("失敗..凍結中")
		return {"logs":logs,"damage":0,"heal":0,"next_boost":boost}
	var id := String(card.get("id",""))
	if id == "boost":
		var boost_shield := maxi(1,roundi(effective_atk(actor)*0.30*acc))
		actor["shield"] = int(actor.get("shield",0)) + boost_shield
		var bonus := int(card.get("boost",0)) + (20 if String(actor.get("role","")) == "mage" else 0)
		logs.append("神功附體 +%d%%" % bonus)
		logs.append("護盾 +%d" % boost_shield)
		return {"logs":logs,"damage":0,"heal":0,"next_boost":1.0+float(bonus)/100.0}

	var role_amp := 1.0
	var pet_amp := 1.0
	var res_amp := 1.0
	var role_id := String(actor.get("role",""))
	var pet_id := String(actor.get("pet",""))
	var color := String(card.get("color","neutral"))
	var pet_fx: Dictionary = actor.get("pet_fx",{})
	var resonance: Dictionary = actor.get("resonance",{})
	if role_id == "warrior" and color == "blue": role_amp *= 1.30
	if role_id == "mage" and color == "yellow": role_amp *= 1.25
	if role_id == "archer" and color == "red": role_amp *= 1.20
	if role_id == "archer" and is_offensive(card): role_amp *= 1.0 + float(mini(2,offensive_index))*0.15
	if pet_id == "fox" and speed_win and slot_index == 0:
		var amp := 0.20 + float(pet_fx.get("firstCardAmp",0.0))
		pet_amp *= 1.0 + amp
		logs.append("靈狐先機 +%d%%" % roundi(amp*100.0))
	if pet_id == "fox" and color == "red": pet_amp *= 1.0 + float(pet_fx.get("redAmp",0.0))
	if pet_id == "owl" and ["green","blue"].has(color): pet_amp *= 1.0 + float(pet_fx.get("stableAmp",0.0))
	if pet_id == "dragon" and color == "yellow":
		var amp := 0.20 + float(pet_fx.get("yellowAmp",0.0))
		pet_amp *= 1.0 + amp
		logs.append("幼龍黃牌共鳴 +%d%%" % roundi(amp*100.0))
	var yellow_count := 0
	for c: Dictionary in cards:
		if String(c.get("color","")) == "yellow": yellow_count += 1
	if pet_id == "dragon" and yellow_count >= 2 and slot_index == cards.size()-1:
		var amp := 0.30 + float(pet_fx.get("finisherAmp",0.0))
		pet_amp *= 1.0 + amp
		logs.append("幼龍終式爆發 +%d%%" % roundi(amp*100.0))
	if slot_index == 0 and float(resonance.get("firstCardAmp",0.0)) > 0.0:
		res_amp *= 1.0 + float(resonance["firstCardAmp"])
		logs.append("烈戰共鳴 +%d%%" % roundi(float(resonance["firstCardAmp"])*100.0))
	if color == "green" and float(resonance.get("greenAmp",0.0)) > 0.0:
		res_amp *= 1.0 + float(resonance["greenAmp"])
		logs.append("血靈共鳴 +%d%%" % roundi(float(resonance["greenAmp"])*100.0))
	if color == "blue" and float(resonance.get("blueAmp",0.0)) > 0.0:
		res_amp *= 1.0 + float(resonance["blueAmp"])
		logs.append("鐵壁共鳴 +%d%%" % roundi(float(resonance["blueAmp"])*100.0))
	var power := acc * bond_multiplier(cards,card) * boost * role_amp * pet_amp * res_amp
	if bool(card.get("exclusive",false)): _apply_exclusive(card,actor,target,power,logs)
	elif String(card.get("kind","")) == "stat": _apply_stat(card,actor,power,logs)
	else:
		match id:
			"combo":
				var hits: Array[float] = [0.5,0.5,0.5]
				if String(target.get("monster_id","")) == "rabbit": hits = [0.5,0.32,0.32]
				for hit_mult: float in hits:
					if int(target.get("hp",0)) <= 0: break
					_hit(actor,target,hit_mult*power,"瞬步連擊",logs)
				if String(target.get("monster_id","")) == "rabbit": logs.append("霧影卸力：後兩擊傷害降低")
			"desperate":
				_hit(actor,target,2.0*power,"破釜沉舟",logs)
				(actor["def_boost"] as Array).append({"pct":-0.5,"turns":2,"fresh":true})
				logs.append("自身防禦 -50%・2回合")
			"poison":
				_hit(actor,target,0.7*power,"淬毒之刃",logs)
				var resist := 0.5 if String(target.get("monster_id","")) == "moss" else 1.0
				(target["poison"] as Array).append({"damage":roundi(effective_atk(actor)*0.3*power*resist),"turns":3})
				if resist < 1.0: logs.append("苔殼抗毒：毒素傷害減半")
			"break":
				_hit(actor,target,0.7*power,"破甲一擊",logs)
				(target["armor_break"] as Array).append({"pct":0.3*power,"turns":2})
			"sun": _hit(actor,target,0.8*power,"熾陽閃",logs); target["crit_lock"] = int(target.get("crit_lock",0)) + 2
			"preempt": _hit(actor,target,0.9*power,"制敵機先",logs); (target["atk_down"] as Array).append({"pct":0.3*power,"turns":2})
			"regen": _heal(actor,maxi(1,roundi(float(actor["max_hp"])*0.15*power)),"生生不息",logs,false); actor["regen"] = 3; actor["regen_fresh"] = true; logs.append("持續回血 3回合")
			"sacrifice": _hit(actor,target,3.0*power,"玉石俱焚",logs); actor["hp"] = maxi(1,roundi(float(actor["hp"])*0.2)); logs.append("自身生命大幅下降")
			"restore": _heal(actor,roundi(float(actor["max_hp"])*0.8*power),"返本歸元",logs,true)
			"diamond": (actor["def_boost"] as Array).append({"pct":2.0*power,"turns":2,"fresh":true}); logs.append("金剛不壞")
			"aegis":
				var shield := roundi(effective_atk(actor)*power)
				actor["shield"] = int(actor.get("shield",0)) + shield
				logs.append("護盾 +%d" % shield)
	if role_id == "warrior" and color == "blue" and int(actor.get("hp",0)) > 0:
		var shield := maxi(1,roundi(effective_def(actor)*0.14))
		actor["shield"] = int(actor.get("shield",0)) + shield
		logs.append("戰士護盾 +%d" % shield)
	var red_count := 0
	for c: Dictionary in cards:
		if String(c.get("color","")) == "red": red_count += 1
	if pet_id == "fox" and red_count >= 2 and slot_index == cards.size()-1 and int(target.get("hp",0)) > 0:
		_hit(actor,target,(0.40+float(pet_fx.get("chaseAmp",0.0)))*acc,"靈狐追擊",logs)
	var after_target_pool := int(target.get("hp",0)) + int(target.get("shield",0))
	return {"logs":logs,"damage":maxi(0,before_target_pool-after_target_pool),"heal":maxi(0,int(actor.get("hp",0))-before_actor_hp),"next_boost":boost}

static func after_action(actor: Dictionary, other: Dictionary, logs: Array[String]) -> void:
	if bool(actor.get("regen_fresh",false)): actor["regen_fresh"] = false
	elif int(actor.get("regen",0)) > 0 and int(actor.get("hp",0)) > 0:
		_heal(actor,roundi(effective_atk(actor)*0.30),"生生不息",logs,true)
		actor["regen"] = maxi(0,int(actor["regen"])-1)
	var poison: Array = actor.get("poison",[])
	if not poison.is_empty() and int(actor.get("hp",0)) > 0:
		var total := 0
		for raw: Variant in poison:
			var state: Dictionary = raw
			total += int(state.get("damage",0))
			state["turns"] = int(state.get("turns",0))-1
		actor["hp"] = maxi(0,int(actor["hp"])-total)
		logs.append("毒素 %d" % total)
	for key: String in ["armor_break","atk_down","def_boost","heal_block"]:
		var states: Array = actor.get(key,[])
		for raw: Variant in states:
			var state: Dictionary = raw
			if bool(state.get("fresh",false)): state["fresh"] = false
			else: state["turns"] = int(state.get("turns",0))-1
		actor[key] = states.filter(func(v: Variant) -> bool: return int((v as Dictionary).get("turns",0)) > 0)
	actor["poison"] = poison.filter(func(v: Variant) -> bool: return int((v as Dictionary).get("turns",0)) > 0)
	if int(actor.get("crit_lock",0)) > 0: actor["crit_lock"] = int(actor["crit_lock"])-1
	for key: String in ["poison","armor_break","atk_down","def_boost","heal_block"]:
		var other_states: Array = other.get(key,[])
		other[key] = other_states.filter(func(v: Variant) -> bool: return int((v as Dictionary).get("turns",0)) > 0)

static func basic_attack(actor: Dictionary, target: Dictionary, mult: float, label: String = "普通攻擊") -> Array[String]:
	var logs: Array[String] = []
	if _consume_stun(actor, logs): return logs
	var fx: Dictionary = actor.get("mythic_fx",{})
	var hits := 1
	if float(fx.get("flurry3Chance",0.0)) > 0.0:
		var roll := randf()
		if roll < float(fx["flurry3Chance"]): hits = 3
		elif roll < float(fx["flurry3Chance"]) + float(fx.get("flurry2Chance",0.0)): hits = 2
		if hits > 1: logs.append("無盡連斬：%d連擊" % hits)
	for _i in range(hits):
		if int(actor.get("hp",0)) <= 0 or int(target.get("hp",0)) <= 0: break
		_hit(actor,target,mult,label,logs,true)
	return logs

static func ultimate_attack(actor: Dictionary, target: Dictionary, role_id: String) -> Array[String]:
	var logs: Array[String] = []
	if _consume_stun(actor, logs): return logs
	var ultimate := GameData.ultimate(role_id)
	var label := String(ultimate.get("name","終極一擊"))
	logs.append("必殺・%s" % label)
	if ultimate.has("hits"):
		for raw: Variant in ultimate["hits"]:
			if int(target.get("hp",0)) <= 0: break
			_hit(actor,target,float(raw),label,logs,true)
	else: _hit(actor,target,float(ultimate.get("mult",2.8)),label,logs,true)
	return logs

static func monster_round_start(stage: Dictionary, enemy: Dictionary, level: int) -> Array[String]:
	var logs: Array[String] = []
	var id := String(stage.get("id",""))
	if id == "moss":
		var ratio := 0.15 if level >= 10 else 0.12
		var shield := roundi(float(enemy["max_hp"])*ratio)
		enemy["shield"] = int(enemy.get("shield",0)) + shield
		logs.append("孢子甲殼：護盾 +%d" % shield)
		if level >= 10 and int(enemy["hp"]) <= roundi(float(enemy["max_hp"])*0.5):
			var heal := mini(int(enemy["max_hp"])-int(enemy["hp"]),roundi(float(enemy["max_hp"])*0.05))
			enemy["hp"] = int(enemy["hp"])+heal
			if heal > 0: logs.append("孢子再生 +%d" % heal)
	elif id == "bubble":
		var low := int(enemy["hp"]) <= roundi(float(enemy["max_hp"])*0.5)
		var ratio := 0.11
		if level >= 10: ratio = 0.14
		if low: ratio = 0.17
		if low and level >= 10: ratio = 0.20
		var shield := roundi(float(enemy["max_hp"])*ratio)
		enemy["shield"] = int(enemy.get("shield",0)) + shield
		logs.append("泡泡護膜：護盾 +%d" % shield)
	elif id == "beetle":
		var ratio := 0.18 if level >= 10 else 0.15
		var shield := roundi(float(enemy["max_hp"])*ratio)
		enemy["shield"] = int(enemy.get("shield",0))+shield
		logs.append("硬殼防禦：護盾 +%d" % shield)
	elif id == "shadow" and not bool(enemy.get("enraged",false)):
		var threshold := 0.60 if level >= 15 else 0.50
		if int(enemy["hp"]) <= roundi(float(enemy["max_hp"])*threshold):
			enemy["enraged"] = true
			enemy["atk"] = float(enemy["atk"]) * (1.32 if level >= 15 else 1.25)
			enemy["poison"] = []
			enemy["armor_break"] = []
			enemy["atk_down"] = []
			enemy["crit_lock"] = 0
			logs.append("暗影狂暴：攻擊提升，清除負面狀態")
	return logs

static func monster_after_player(stage: Dictionary, player: Dictionary, enemy: Dictionary, dealt: int, level: int) -> Array[String]:
	var logs: Array[String] = []
	var id := String(stage.get("id",""))
	if id == "bubble" and dealt > 0 and int(enemy.get("hp",0)) > 0:
		var absorb := maxi(5,roundi(float(dealt)*0.08))
		enemy["shield"] = int(enemy.get("shield",0))+absorb
		logs.append("泡泡吸收：護盾 +%d" % absorb)
		if int(player.get("hp",0)) > 0:
			var reflected := _apply_damage(player,maxi(5,roundi(float(dealt)*0.06)))
			logs.append("泡膜反彈 %d" % int(reflected["dealt"]))
	if id == "beetle" and dealt > 0 and int(player.get("hp",0)) > 0:
		var ratio := 0.16 if level >= 10 else 0.10
		var cap := 70 if level >= 10 else 45
		var reflected := _apply_damage(player,mini(cap,maxi(8,roundi(float(dealt)*ratio))))
		logs.append("硬殼反震 %d" % int(reflected["dealt"]))
	return logs

static func monster_after_enemy(stage: Dictionary, player: Dictionary, enemy: Dictionary, previous_player_hp: int, slot: int, first: String, level: int) -> Array[String]:
	var logs: Array[String] = []
	var id := String(stage.get("id",""))
	var dealt := maxi(0,previous_player_hp-int(player.get("hp",0)))
	if id == "rabbit" and first == "enemy" and slot == 0 and int(player.get("hp",0)) > 0:
		var result := _apply_damage(player,maxi(12,roundi(float(enemy["atk"])*0.32)))
		logs.append("霧影突襲 %d" % int(result["dealt"]))
	if id == "rabbit" and level >= 10 and slot == 2 and int(player.get("hp",0)) > 0:
		var result := _apply_damage(player,maxi(10,roundi(float(enemy["atk"])*0.22)))
		logs.append("殘影追擊 %d" % int(result["dealt"]))
	if id == "shadow" and dealt > 0 and int(enemy.get("hp",0)) > 0:
		var ratio := 0.35 if level >= 10 else 0.25
		var heal := mini(int(enemy["max_hp"])-int(enemy["hp"]),roundi(float(dealt)*ratio))
		if heal > 0:
			enemy["hp"] = int(enemy["hp"])+heal
			logs.append("暗影汲取 +%d" % heal)
	return logs

static func pet_round_end(player: Dictionary, cards: Array[Dictionary]) -> Array[String]:
	var logs: Array[String] = []
	if String(player.get("pet","")) == "owl" and int(player.get("hp",0)) > 0:
		var stable := 0
		for card: Dictionary in cards:
			if ["green","blue"].has(String(card.get("color",""))): stable += 1
		if stable >= 2:
			var fx: Dictionary = player.get("pet_fx",{})
			_heal(player,roundi(float(player["max_hp"])*(0.08+float(fx.get("guardHeal",0.0)))),"夜梟守心",logs,false)
	return logs
