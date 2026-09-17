# Word RPG — Godot + Cloudflare

這個目錄是 `word-rpg` 的 Godot 正式遊戲層。原本 Web 版仍保留，Godot 逐步接手遊戲畫面與戰鬥演出，Cloudflare 繼續負責帳號、題庫、跨裝置資料與多人連線。

## 架構原則

- `project.godot` 在 repository root，直接使用既有 `images/`、`audio/`，不複製素材。
- 遊戲規則集中在 `godot/scripts/game_data.gd`。
- 玩家本機／雲端狀態集中在 `godot/scripts/game_state.gd`。
- Cloudflare API 集中在 `godot/scripts/cloudflare_client.gd`。
- 題庫沿用 `src/words.js`，Cloudflare `/api/questions` 負責每天題目索引。
- 戰鬥動畫集中在 `godot/scripts/battle_fx.gd`。
- 正式主流程在 `godot/scripts/game_main.gd`。
- `battle_demo.tscn` 只保留為開發測試，不再是正式入口。

## 目前可玩內容

- 正式首頁。
- 戰士／法師／弓手選擇。
- 靈狐／夜梟／幼龍選擇。
- 4 關冒險地圖：苔球獸、霧角兔、木甲蟲、影語王。
- 角色等級與稱號成長。
- 9 張技能牌選 3 張，60 秒選牌。
- 5 題英文單字，單題 10 秒。
- Cloudflare `/api/questions` 題目索引與本機 1200 字題庫整合。
- 答對題數影響技能倍率。
- 原 Web 版主要技能與角色／寵物加成已移植。
- 單張 PNG：待機、瞬步、殘影、斬擊、受擊、擊退、Camera shake。
- 怪物特殊行為：護盾、連擊、反震、吸血。
- EXP、升級、關卡解鎖。
- 普通／稀有／史詩／傳說掉寶。
- 本機持久化存檔。
- LINE 已登入的 Web 環境可同步 `/api/session`、`/api/progress`。
- 背包檢視。

## 開啟方式

1. GitHub Desktop 選 `godot-migration`。
2. Fetch origin → Pull origin。
3. Godot 4.7.2 開啟 repository 根目錄的 `project.godot`。
4. Run Project。
5. 會直接進入 Word RPG 首頁，不需要再手動開 `battle_demo.tscn`。

## 下一批系統

- 裝備穿戴與能力值即時套用。
- 寵物強化／技能樹。
- 20 層試煉塔。
- LINE Login 在 Godot Web Export 的完整回跳流程。
- `/match` Durable Objects WebSocket PK。
- Godot Web Export + Cloudflare 正式部署流程。
