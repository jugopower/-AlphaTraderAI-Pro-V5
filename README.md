# AlphaTrader AI Pro V5 — Build022.4.1 三星手機觸控修正版

## 本版修正
- 以 Build022.4 為基礎，專門修正 Samsung Galaxy 無法落子。
- 支援 Android Chrome 與 Samsung Internet。
- 棋盤優先使用 `pointerdown`，避免部分三星瀏覽器漏掉 `pointerup`。
- 舊版瀏覽器提供 `touchend` 與 `click` 後備處理。
- 觸控座標依棋盤實際顯示尺寸換算，支援 9／13／19 路。
- 加入重複事件防護，避免一次觸控落兩子。
- 強制棋盤接收觸控，排除透明層或 CSS 阻擋。
- iPad Air 版面、KataGo、SGF、時鐘與讀秒核心均未修改。

## 三星手機測試
1. 請先進入「人機對弈」並按開始。
2. 在四角、邊線與中央各點一次。
3. 分別測試 9／13／19 路。
4. Chrome 與 Samsung Internet 各測一次。
5. 若網站仍顯示舊版，請重新整理或清除網站快取。
