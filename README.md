# AlphaTrader AI Pro V5 — Build024.2 Full Release

建置日期：2026-07-29

## 版本定位

本版以 Build023 Stable 為基礎，整合 Build024.1 KataGo 核心修正及 Build024.2 連線狀態面板。棋盤、SGF、正式數地、計時器與教學模式維持原有核心，不另行重寫。

## KataGo 功能

- 顯示 Online／Offline。
- 顯示真實 KataGo、連線失敗或尚未連線。
- 顯示伺服器、模型、Visits、NPS、分析耗時及最後成功時間。
- AI 強度設定實際套用於候選手選擇。
- 第一推薦手不合法時，自動尋找下一個合法候選手。
- 防止重複送出分析請求，並加入請求冷卻與逾時保護。
- 連線失敗時清除舊效能資料，避免把舊資料誤認為目前連線。

## 保留功能

- 9／13／19 路棋盤。
- SGF 載入與操作。
- 提子、悔棋、Pass、認輸。
- 正式數地與終局結果。
- 對局時鐘及 iPad 直橫式介面。

## 部署

將本 ZIP 解壓後的 `index.html` 與 `README.md` 上傳至 GitHub 儲存庫根目錄，覆蓋同名檔案並 Commit。GitHub Pages 更新後，資訊視窗及 AI 分析視窗應顯示 `Build024.2 Full Release`。

## 首次測試

1. 重新整理 GitHub Pages，必要時關閉舊分頁再開新分頁。
2. 開啟「資訊」，確認版本為 Build024.2 Full Release。
3. 開啟 KataGo 設定，按「測試分析」。
4. 只有顯示 Online／真實 KataGo，才代表 Render 後端連線成功。
5. 依序測試 9 路、13 路及 19 路人機對弈。

## 備份原則

Build023 Stable 必須永久保留。Build024.2 Full Release 若測試異常，可立即回復 Build023。
