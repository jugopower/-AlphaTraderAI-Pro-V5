# AlphaTrader AI Pro V5 — Build024.3.3 API Inspector

以 Build024.3.1 Real KataGo API Fix 為基礎。

## 本版目的
- 右下角可收合 API 資料面板，不再使用全畫面 Debug 視窗。
- Render 回應、HTTP 狀態、錯誤與逾時會直接記錄。
- 面板不鎖定棋盤；即使 API 失敗也可收合。
- 可一鍵複製原始 JSON，供前後端格式比對。
- 不修改棋盤、SGF、數地與計時器核心。

## 測試
先用 9 路棋盤落一手，等待 AI。若 AI 未落子，按右下角「API 資料」→「複製 JSON」。
