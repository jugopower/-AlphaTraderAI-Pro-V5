AlphaTrader AI Pro V5 — Build023 RC1

重構重點：
1. 手機與 iPad 直式只保留一套對局功能列。
2. 移除舊 mobile dock、更多面板與 Unified UI 重複程式。
3. 移除滑動／網址列伸縮時的 resize 與 ResizeObserver 重畫。
4. 只在真正旋轉螢幕後延遲重算一次棋盤。
5. iPad 橫式與桌機保留完整原操作區。

測試順序：新局、落子、悔棋、Pass、投降、形勢判斷、終局計算、SGF 存檔、AI 提示、上下滑動、旋轉。
