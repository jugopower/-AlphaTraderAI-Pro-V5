# Build020.0 KataGo Real Analysis

完成項目：

- 前端改用後端實際接受的欄位：`board_size`、`moves`、`next_player`、`komi`
- 支援後端回傳的 snake_case 欄位：`move_infos`、`score_lead`
- 顯示 KataGo 推薦 Top 5
- 顯示勝率、預估目差、分析 visits
- 點選推薦手可在棋盤標示推薦座標
- 預設後端網址改為 AlphaTrader KataGo Server V2
- 預設分析次數 30、貼目 7.5
- 更新 Service Worker 快取名稱，避免 iPad Safari 持續使用舊版

注意：目前後端 API 尚未提供 SGF 設定子（AB/AW）欄位；一般對局手順可正常分析。
