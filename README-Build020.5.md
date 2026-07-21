# Build020.5 前後端讓子對弈版

## 前端新增
- 人機新局可設定分先或讓 2～9 子。
- 讓子時人類固定執黑，AI 執白先下，貼目自動設為 0.5。
- 新增「結束對局」與「返回主畫面」。
- 返回主畫面時可先儲存 SGF。
- SGF 會保存 HA、AB 與 KM。
- API 會傳送 initial_stones、帶顏色的 moves、next_player 與 max_visits。

## 部署順序
1. 先部署後端 Build020.5。
2. 再上傳前端 index.html、sw.js、README-Build020.5.md。
