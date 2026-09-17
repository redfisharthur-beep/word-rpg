# Godot migration — Step 1

這個目錄是 `word-rpg` 從純 Web 前端漸進搬到 Godot 的第一階段。

## 原則

- 不破壞目前 `main` 的 Web 版本。
- Godot 專案根目錄維持在 repository root，直接使用現有 `images/` 圖檔，不複製素材。
- Cloudflare Worker / Durable Objects 先維持現有 API 與 PK 架構。
- 遊戲表現逐步由 Godot 接手；帳號、存檔、題庫與多人連線繼續由 Cloudflare 負責。
- 不在舊程式尾端疊補丁；新 Godot 功能集中在 `godot/` 下。

## Step 1 已完成

- Godot 4.7.x 專案設定。
- 手機直向 720×1280 viewport。
- Compatibility renderer，優先考慮 Web / 手機相容性。
- 戰鬥展示場景 `godot/scenes/battle_demo.tscn`。
- 直接讀取既有：
  - `images/bg-game.png`
  - `images/warrior.png`
  - `images/beetle.png`
  - `images/VS.png`
- 單張 PNG 動態演出：
  - 呼吸待機
  - 蓄力後座
  - 瞬步前衝
  - 殘影
  - 三段斬線
  - 受擊變色
  - 擊退
  - 傷害數字
  - Camera shake

## 開啟方式

1. 安裝 Godot 4.7.2 Standard。
2. Clone / Pull 此 repository 的 `godot-migration` branch。
3. Godot Project Manager → Import。
4. 選 repository 根目錄內的 `project.godot`。
5. Run Project。
6. 點擊底部 `FIGHT` 測試戰鬥演出。

## 下一階段

Step 2：把 Cloudflare `/api/session`、`/api/progress`、`/api/questions` 與 `/match` WebSocket 封裝成 Godot client，先完成登入狀態 / 玩家進度 / 題目取得，再接 PK。
