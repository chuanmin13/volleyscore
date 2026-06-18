# ScoreBoard 統一介面規格

## 背景與目標

原本 Display（顯示端）與 Controller（控制端）是兩個獨立元件，服務不同角色。隨著 Display 加入 canScore toggle 後，兩者功能已高度重疊。

統一為單一 `ScoreBoard` 元件的目標：
- 任何裝置（建立房間 / 加入房間 / 快速開始）都進入相同介面
- 預設為純顯示模式（大字、沉浸感）
- 開啟計分模式後，裁判相關功能才出現
- 減少維護兩套平行邏輯的成本

---

## 元件結構

```
components/
  ScoreBoard/
    index.jsx           主元件
    RoomCodeModal.jsx   進場房間碼倒數 modal
    SettingsOverlay.jsx 隊伍設定（名稱、顏色）
    RecordsPanel.jsx    底部紀錄面板
  Landing.jsx
  JoinForm.jsx          加入房間表單（OTP 輸入、錯誤提示、返回按鈕）
  OtpInput.jsx          四格數字輸入元件
  ConfirmModal.jsx
  Toast.jsx
  Icon.jsx
  LoadingOverlay.jsx
```

---

## Entry 情境

ScoreBoard 透過 `entry` prop 接收進入情境，決定初始行為：

| entry | 說明 | showRoomCodeModal | canScore 預設 |
|-------|------|:-----------------:|:------------:|
| `create` | 建立房間 | ✓ | OFF |
| `join` | 加入房間 | ✗ | OFF |
| `offline` | 快速開始 | ✗ | ON |

- `create` / `join` 預設 OFF：任一裝置都可能是大螢幕顯示端，使用者自行切換
- `offline` 預設 ON：進來就是要計分，無純顯示需求
- `showRoomCodeModal`：僅 `create` 進場時顯示，供另一台裝置取得房間碼加入

### 線上模式（room !== null）
- `create`：建立 Firebase 房間，進場顯示房間碼 modal
- `join`：加入既有房間，不顯示 modal

### 離線模式（room === null）
- `offline`：快速開始，分數、隊伍設定、紀錄存於 sessionStorage

---

## canScore 狀態行為

Toggle 文字：**純顯示**（OFF）／**計分中**（ON），無 icon，使用 antd-style switch。

### canScore OFF（純顯示）
- 全螢幕大數字顯示，沉浸感優先
- page-header：房間碼（可點擊查看 modal）、toggle（顯示「純顯示」）、離開按鈕
- 分數卡不可點擊

### canScore ON（計分中）
- 分數卡可點擊加分
- 每張卡底部出現 `+` / `−` toolbar
- page-header 額外出現：設定按鈕（齒輪）
- 底部出現 RecordsPanel（儲存紀錄、查看紀錄、重設比數）
- `−` 長按 600ms → 觸發重設確認 modal

---

## 子元件規格

### RoomCodeModal
- 進入 ScoreBoard 時顯示（限線上模式建立端）
- 5 秒倒數後自動關閉，可手動關閉
- 顯示房間碼，供另一台裝置加入

### SettingsOverlay
- canScore ON 才可開啟（page-header 齒輪按鈕）
- 設定項目：主隊名稱、客隊名稱、主隊顏色、客隊顏色、顯示隊名 toggle
- 套用後顯示 Toast 確認

### RecordsPanel
- canScore ON 才顯示，固定在底部
- 功能：儲存目前比分為一局紀錄、展開查看歷史紀錄、重設比數
- 紀錄上限 5 筆，超過顯示提示
- 每筆紀錄可單獨刪除
- 線上模式同步至 Firebase；離線模式存於 sessionStorage

---

## 狀態設計

ScoreBoard 主元件管理以下狀態：

| 狀態 | 說明 |
|------|------|
| `canScore` | 計分模式開關 |
| `showRoomCodeModal` | 房間碼進場 modal（entry=create 時初始為 true） |
| `leaveConfirm` | 離開確認 modal |
| `resetConfirm` | 重設確認 modal |
| `recordsFull` | 紀錄已滿提示 |
| `settingsOpen` | 設定 overlay |
| `settingsForm` | 設定表單暫存值 |
| `toast` | 套用設定 Toast |
| `offlineScore` | 離線分數（room=null 時使用） |
| `offlineTeams` | 離線隊伍設定 |
| `offlineRecords` | 離線紀錄 |

線上模式的 score / teams / records 來自 `room.roomData`，不存本地 state。

---

## App.jsx 路由變更

| mode（舊） | 元件（舊） | 元件（新） | entry prop |
|-----------|-----------|-----------|-----------|
| `display` | `<Display>` | `<ScoreBoard>` | `create` |
| `controller` | `<Controller>` | `<ScoreBoard>` | `join` |
| `offline` | `<Controller room={null}>` | `<ScoreBoard room={null}>` | `offline` |

三個 mode 統一改為 `scoreboard`，由 `entry` prop 區分行為差異。

---

## 重構範圍

### 新增
- `src/components/scoreboard/index.jsx`
- `src/components/scoreboard/RoomCodeModal.jsx`
- `src/components/scoreboard/SettingsOverlay.jsx`
- `src/components/scoreboard/RecordsPanel.jsx`

### 修改
- `src/App.jsx`：更新 import 與路由邏輯
- `src/components/Landing.jsx`：移除 JoinForm 與 RoomCodeInput，改 import

### 新增（Landing 拆分）
- `src/components/JoinForm.jsx`：加入房間表單（OTP 輸入、錯誤提示、返回按鈕）
- `src/components/OtpInput.jsx`：四格數字輸入元件（原 RoomCodeInput）

### 刪除
- `src/components/Display.jsx`
- `src/components/Controller.jsx`

### CSS
- `.display-mode` → `.scoreboard`（class rename）
- `.ctrl-*` 相關 class 整併或重命名
- canScore ON 時的 RecordsPanel 動畫樣式

---

## 開放問題

- [x] `display` / `controller` mode 合併為 `scoreboard`，以 `entry` prop 區分
- [x] 離線模式（offline）預設 canScore ON
- [x] landscape 下 RecordsPanel 展開時不限制高度，遮住分數卡可接受，使用者自行關閉
