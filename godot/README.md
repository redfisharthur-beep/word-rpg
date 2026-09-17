# Word RPG — Godot + Cloudflare

這個目錄是 `word-rpg` 的 Godot 正式遊戲層。Web 版目前仍保留做正式站與相容層，Godot 負責主要遊戲畫面、戰鬥演出與原生互動；Cloudflare Worker / Durable Objects 負責 LINE 帳號、題庫、跨裝置資料與多人 PK。

## 正式架構

- `project.godot`：Godot 專案入口；正式 `GameState` 使用 revision-aware 雲端同步層。
- `godot/scenes/game.tscn`：正式主場景。
- `godot/scripts/game_runtime.gd`：正式玩家 UI（六功能首頁、寵物、裝備）。
- `godot/scripts/game_v3.gd`：冒險、試煉、圖鑑、掉寶與戰鬥流程 UI。
- `godot/scripts/game.gd`：共用基礎 UI / 戰鬥流程。
- `godot/scripts/adventure_run.gd`：冒險與 20F 試煉流程狀態。
- `godot/scripts/battle_rules.gd`：卡牌、角色、怪物、神話裝備、共鳴與寵物戰鬥規則。
- `godot/scripts/rpg_runtime.gd`：寵物技能樹、裝備共鳴、神話效果等 RPG 成長規則。
- `godot/scripts/inventory_runtime.gd`：裝備三合一合成規則。
- `godot/scripts/reward_runtime.gd`：冒險／試煉 EXP、結晶、一般與神話掉寶規則。
- `godot/scripts/battle_fx.gd`：act1/act2、受擊、Hit-stop、擊退、震動與戰鬥特效。
- `godot/scripts/game_state.gd`：本機角色／裝備／結晶／寵物／弱點字存檔核心。
- `godot/scripts/game_state_revision.gd`：雲端 revision、409 衝突保護與重啟後持續保護。
- `godot/scripts/cloud_sync_notice.gd`：雲端衝突時的持續提示層。
- `godot/scripts/cloudflare_client.gd`：Cloudflare HTTP API 與 Godot Web LINE Login 導向。
- `godot/scenes/pk.tscn` + `godot/scripts/pk_native.gd`：Godot 原生 WebSocket PK。
- `godot/tests/rpg_parity_test.gd`：Web ↔ Godot RPG 固定數值 parity 測試。
- `godot/tests/pk_protocol_test.tscn`：正式 PK Server message 狀態機 fixture。
- `worker/entry.js` + `worker/progress-revision.js`：revision-aware `/api/session`、`/api/progress` 與 Durable Object 進度版本控制。
- `data/game-data.json`：Web / Worker / Godot 共用遊戲資料來源。
- `images/`、`audio/`：直接共用既有素材，不複製第二套。

舊的 `battle_demo`、`game_main`、`game_v2` 試驗場景與腳本已移除，避免後續修改到錯的版本。

## 目前已完成

- 手機直式 720×1280 正式首頁與角色／寵物資訊。
- 六功能主選單，上 3／下 3：Fight、PK、試煉、寵物、裝備、圖鑑。
- 戰士／法師／弓手與靈狐／夜梟／幼龍。
- 5 關冒險：苔球獸、霧角兔、泡泡怪、木甲蟲、影語王。
- 20 層試煉塔；5／10／15／20F 有額外規則與 Boss 節點。
- 試煉獎勵與 Web 對齊：EXP、5／10／15／20F 結晶、8／10／15／20F 神話掉率與 Boss 3% 神話掉率。
- 9 張牌選 3 張，60 秒選牌；5 題英文單字，每題 10 秒。
- Cloudflare `/api/questions` 題目索引與本機題庫整合。
- 弱點字循環：錯字後續優先混回題組，連續答對 3 次才移出。
- 角色 Lv.1～50、稱號、職業專屬技能與必殺能量。
- act1 → act2 角色動作、Hit-stop、受擊、擊退、Camera shake、程式音效。
- 普通／稀有／史詩／傳說／神話裝備掉落與寶箱揭曉演出。
- 裝備槽：寶石 3、護甲 1、戒指 2。
- 裝備穿戴／卸下／分解結晶，能力即時套用 HP／ATK／DEF／爆擊。
- 裝備三合一：3 件同類型＋同子類型＋同品質未裝備物品，合成下一品質；傳說不會合成神話。
- 三套裝備共鳴：烈戰、血靈、鐵壁。
- 神話能力：吸血、破甲疊層、暈眩、反傷、半血狂戰、格擋、爆擊增傷、連斬、死神判決、真傷、禁療。
- 寵物結晶強化 Lv.0～4，Lv.4 覺醒；專屬覺醒圖缺少時使用原圖＋光環 fallback。
- 每隻寵物 5 節點技能樹，技能點與效果會實際進戰鬥。
- 圖鑑收藏與 10／20／30 件收藏外觀獎勵。
- LINE Login Web 流程：Godot Web 按 LINE → `/auth/line` → callback → `/api/session` 自動恢復登入。
- Godot 原生 PK：WebSocket `/match` 配對、9 選 3、60 秒選牌、5 題×10 秒、Server 驗證答案／時間、Server steps 播放、勝負與賽季分數。
- PK protocol fixture：queued、matched、quiz-started、waiting、battle-result、finished、opponent-left、error。
- RPG parity 自動測試：寵物技能／覺醒、三套共鳴、神話能力、三合一合成、冒險與試煉獎勵固定值。
- 雲端進度 revision：Server 與 Godot client 使用 `baseRevision`；版本衝突回 409，本機進度保留且停止自動同步。
- 雲端衝突狀態會寫入 `user://word_rpg_cloud_meta.json`，重啟後仍不會被 Server 舊／不同版本自動覆蓋。
- Godot Web 紋理匯入使用 Lossy 0.85、最大 2048；不修改原始 PNG。
- Web Export `index.pck` 已由約 186 MB 降至約 53 MB；CI 設 70 MiB 上限避免未來素材膨脹。
- 每次成功 Godot CI 會產生 7 天有效的 `word-rpg-godot-web-<sha>` Web build artifact。
- `main → godot-migration` 自動同步遇到 conflict 會停止，不會再偏向 `main` 自動覆蓋 Godot 專屬檔。

## 驗證

GitHub Actions `Validate Godot` 目前會依序執行：

1. Godot 4.7 Headless 匯入全部腳本／圖片／JSON。
2. 執行 RPG parity 測試。
3. 執行原生 PK protocol fixture。
4. 真正輸出 production Web build，檢查 `index.html`、`index.wasm`、`index.pck`，並要求 PCK ≤ 70 MiB。
5. 上傳 7 天有效的測試 Web build artifact。
6. 啟動正式 `game.tscn` 主場景 smoke test。
7. 啟動原生 `pk.tscn` PK 場景 smoke test。

`Validate Word RPG` 另外會驗證共用資料同步、Web/Worker 語法、revision conflict 規則、PK、題庫與既有 RPG 測試。

## 開啟方式

1. GitHub Desktop 切換到 `godot-migration`。
2. Fetch origin → Pull origin。
3. Godot 4.7.2 開啟 repository 根目錄的 `project.godot`。
4. Run Project。
5. 直接進入正式 Word RPG，不需要手動開任何 demo 場景。

## 後續仍要完成

- 正式 Web client `game-core.js` 也改成 strict `baseRevision` writer；目前 Server 對舊 Web client 保留向後相容寫入。
- 原生 PK 雙 client／真 WebSocket 自動整合測試；目前已完成單 client protocol fixture 與 PK scene smoke test。
- Godot Web build 的 Cloudflare 預覽／正式切換流程；目前正式 `/` 仍由既有 Web 版提供，不會直接覆蓋。
- 雲端進度衝突的人工解決介面（選擇使用本機或 Server）；目前安全策略是保留本機並暫停同步，不自動決定。
- 覺醒寵物專屬圖片：`pet-fox-awakened.png`、`pet-owl-awakened.png`、`pet-dragon-awakened.png`（補圖後程式會自動替換）。
