extends RefCounted
class_name WordRpgWordBank

var words: Array[Dictionary] = []
var meanings: Array[String] = []

func load_from_web_source() -> bool:
	words.clear()
	meanings.clear()
	var path: String = "res://src/words.js"
	if not FileAccess.file_exists(path):
		_load_fallback()
		return false
	var text: String = FileAccess.get_file_as_string(path)
	var marker: String = "const RAW=`"
	var start: int = text.find(marker)
	if start < 0:
		_load_fallback()
		return false
	start += marker.length()
	var finish: int = text.find("`;", start)
	if finish < 0:
		_load_fallback()
		return false
	var raw: String = text.substr(start, finish - start)
	for line_value: String in raw.split("\n"):
		var line: String = line_value.strip_edges()
		var split_at: int = line.find("|")
		if split_at <= 0: continue
		var english: String = line.substr(0, split_at).strip_edges()
		var chinese: String = line.substr(split_at + 1).strip_edges()
		if english.is_empty() or chinese.is_empty(): continue
		words.append({"word": english, "answer": chinese})
		if not meanings.has(chinese): meanings.append(chinese)
	if words.is_empty():
		_load_fallback()
		return false
	return true

func make_question(index: int) -> Dictionary:
	if words.is_empty(): load_from_web_source()
	var safe_index: int = posmod(index, words.size())
	var source: Dictionary = words[safe_index]
	var answer: String = String(source["answer"])
	var pool: Array[String] = meanings.duplicate()
	pool.erase(answer)
	pool.shuffle()
	var options: Array[String] = [answer]
	for i: int in range(mini(3, pool.size())): options.append(pool[i])
	options.shuffle()
	return {"word": String(source["word"]), "answer": answer, "options": options, "index": safe_index}

func random_questions(count: int) -> Array[Dictionary]:
	if words.is_empty(): load_from_web_source()
	var indices: Array[int] = []
	for i: int in range(words.size()): indices.append(i)
	indices.shuffle()
	var result: Array[Dictionary] = []
	for i: int in range(mini(count, indices.size())): result.append(make_question(indices[i]))
	return result

func _load_fallback() -> void:
	var fallback: Array[Dictionary] = [
		{"word":"apple","answer":"蘋果"},{"word":"book","answer":"書"},{"word":"school","answer":"學校"},{"word":"water","answer":"水"},
		{"word":"friend","answer":"朋友"},{"word":"family","answer":"家庭"},{"word":"computer","answer":"電腦"},{"word":"happy","answer":"開心的"},
		{"word":"teacher","answer":"老師"},{"word":"student","answer":"學生"},{"word":"run","answer":"跑"},{"word":"write","answer":"書寫"},
		{"word":"question","answer":"問題"},{"word":"answer","answer":"答案"},{"word":"green","answer":"綠色"},{"word":"strong","answer":"強壯的"}
	]
	for item: Dictionary in fallback:
		words.append(item.duplicate(true))
		var answer: String = String(item["answer"])
		if not meanings.has(answer): meanings.append(answer)
