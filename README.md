# Joy Go Platform

Joy Go Platform 是以圍棋教學、真人對弈、線上比賽與會員管理為核心的網頁平台。

## 目前穩定版本

**Beta 3.2.8-F**

本版重點：
- 真人在線人數同步修正
- 副管理員入口與權限架構
- 主管理員／副管理員／匿名巡場員／正式會員／試用會員五級權限
- 真人弈廳多人在線同步
- 邀請可收回、90 秒失效
- 邀請列表精簡
- 8～16 人網路比賽測試準備

## 主要功能

- 會員註冊、登入、登出
- 正式會員與試用會員管理
- 主管理員、副管理員、匿名巡場員權限
- 真人圍棋對弈大廳
- 線上棋友 Presence 在線同步
- 建立房間、加入房間、邀請對弈
- 比賽報名
- 16 人瑞士制自動配對核心
- 比賽管理與成績管理
- 棋局觀戰與管理
- KataGo 圍棋分析
- 人機對弈
- SGF 棋譜讀取與教學功能
- 活動通知中心

## 技術架構

前端：
- HTML
- CSS
- JavaScript
- GitHub Pages

後端與資料庫：
- Supabase

其他服務：
- Render
- KataGo

## 主要檔案

- `index.html` — Joy Go Platform 主頁
- `lobby.html` — 真人對弈大廳
- `admin-center.html` — 管理中心
- `member-admin.html` — 會員管理
- `tournament-admin.html` — 比賽管理
- `tournament-register.html` — 比賽報名
- `notification-center.html` — 活動通知中心

## 版本管理原則

正式使用中的程式檔直接保留在主目錄。

舊版開發紀錄、舊 README、測試說明不要再大量堆在主目錄。需要保留時，統一移至：

`archive/`

主目錄原則上只保留：
- `README.md`
- 必要 HTML / CSS / JavaScript
- 必要圖片與資源
- 必要設定檔

## 測試重點

正式比賽前應確認：
- 多人同時登入在線人數正確
- 邀請、接受、取消正常
- 進房與重新進入正常
- 斷線後可重新連線
- 比賽配對無重複對手
- 管理員與副管理員權限正確
- 會員不能取得管理權限
- 手機與 iPad 操作正常

## 備份

重要穩定版本應另存 ZIP 備份。

目前穩定備份：

`JoyGo_Beta_3.2.8-F_在線人數統一修正版.zip`

---

Joy Go Platform  
圍棋教學・真人對弈・線上比賽平台
