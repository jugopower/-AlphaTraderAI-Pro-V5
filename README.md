# AlphaTrader AI Pro V5 — Build024.2 Alpha

## 本版：KataGo Status

以 Build024.1 為基礎，只加強 KataGo 真實連線辨識與狀態顯示，不更動棋盤、SGF、數地及教學核心。

### 新增與修正
- 明確顯示 Online／Offline。
- 分析來源改為「真實 KataGo／連線失敗／尚未連線」，不再以 Demo 混淆。
- 顯示 Render 或自訂伺服器。
- 顯示模型名稱（後端有回傳時）。
- 顯示 Visits、NPS、最後耗時及最後成功時間。
- 連線失敗時清除舊的模型與效能數據，避免誤判。
- 保留 Build024.1 的 AI 強度選點、合法候選手替補及重試機制。

## 測試順序
1. 開啟 KataGo 設定並按「測試分析」。
2. 確認狀態顯示「🟢 Online」及「真實 KataGo」。
3. 測試 9 路人機對弈，再測試 13／19 路。
4. 若模型或 NPS 顯示「—」，表示後端未提供該欄位，不代表 KataGo 未連線。

## 安全原則
Build023 Stable 請永久保留；Build024.2 為 Alpha 測試版。
