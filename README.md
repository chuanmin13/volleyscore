# VolleyScore 排球記分板

A PWA scoreboard for volleyball games — display scores on a tablet, control remotely from your phone.

<img src="https://github.com/chuanmin13/volleyscore/blob/main/img/scoreCounter.JPG?raw=true" width="500px"/> <img src="https://github.com/chuanmin13/volleyscore/blob/main/img/scoreCounter-2.JPG?raw=true" width="500px"/>

---

## Features

- **Remote control** — pair a display device (tablet) with a controller (phone) via 4-digit room code
- **Real-time sync** — score updates appear instantly on the display via Firebase Realtime Database
- **PWA** — installable to home screen on iOS / Android, landscape-first layout
- **Offline mode** — single-device mode with no internet required
- **Customize teams** — set host / guest names and colors per game
- **Score tracking** — tap the score area to add, minus button to deduct
- **Set records** — save up to 5 sets; collapsible on display view
- **Responsive** — landscape primary, portrait fallback

---

## 功能

- **遠端遙控** — 平板作為顯示端，手機輸入 4 碼房間碼加入為控制端
- **即時同步** — 透過 Firebase Realtime Database 即時推播比分至顯示端
- **PWA** — 可安裝至桌面作為 App 使用，以橫式為主要設計
- **單機模式** — 不需網路，單裝置記分（原有功能）
- **自訂隊伍** — 設定主隊 / 客隊名稱及顏色
- **點擊加分** — 點擊整個分數區塊加一分，獨立減分按鈕
- **局數紀錄** — 最多儲存五局比數，顯示端可收合展開
- **響應式設計** — 橫式優先，直式自動降級

---

## Tech

- **React + Vite** — component-based UI, fast build
- **Firebase Realtime Database** — cross-device real-time sync
- **vite-plugin-pwa** — Service Worker & PWA manifest generation
- **Vanilla CSS** — no CSS framework

---

## Usage

### Remote mode
1. Open the app on the display device → **建立房間（顯示端）**
2. Note the 4-digit room code shown on screen
3. Open the app on the controller device → **加入房間（控制端）** → enter the code
4. Tap the score area on the controller to update scores in real time

### Offline mode
Open the app → **單機模式** — works without internet, score persists on refresh.
