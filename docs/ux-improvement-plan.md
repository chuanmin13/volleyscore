# UX 優化計劃

> 來源：UX Design Review（2026-06-17）；測試回饋補充（2026-06-17）
> 範圍：Landing、Display、Controller、Settings Drawer

---

## 優先順序總覽

| 優先 | 項目 | 畫面 | 狀態 |
|------|------|------|------|
| 🔴 P1 | 自訂 Loading Overlay（排球動畫） | 共用 | [x] |
| 🔴 P1 | Display 右上角加離開房間 icon | Display | [x] |
| 🔴 P1 | OTP 輸入錯誤後自動清除並 focus 第一格 | Landing Join | [x] |
| 🔴 P1 | 修正 Controller landscape：減分按鈕消失 | Controller | [x] |
| 🔴 P1 | 修正 Controller portrait：比分卡被壓縮未滿版 | Controller | [x] |
| 🔴 P1 | 全頁可 scroll，應鎖定滿版不可捲動 | 共用 | [x] |
| 🔴 P1 | Landscape 左右空白（safe-area / viewport 未撐滿） | 共用 | [x] |
| 🟡 P2 | Reset / Save 視覺區隔，降低誤觸風險 | Controller | [x] |
| 🟡 P2 | 加分卡片按壓視覺回饋（scale / opacity） | Controller | [x] |
| 🟡 P2 | 設定套用後顯示回饋（✓ 已套用 Toast） | Settings | [x] |
| 🟡 P2 | `confirm()` / `alert()` 改為 in-app modal | Controller | [x] |
| 🟡 P2 | 按鈕文字統一為中文（Save→儲存、Reset→重設） | Controller | [x] |
| 🟡 P2 | 設定 icon 從 ≡ 改為 SVG（`assets/settings.svg`） | Controller | [ ] |
| 🟡 P2 | Controller header/footer 半透明 float，比分滿版 | Controller | [ ] |
| 🟡 P2 | 提示使用者安裝 PWA / 隱藏瀏覽器網址列 | 共用 | [ ] |
| 🟠 P3 | Landing 加情境說明文字 | Landing | [ ] |
| 🟠 P3 | Records drawer 改 overlay，不壓縮比分區 | Display | [ ] |
| 🟠 P3 | 隊伍色票加預設色選項，color picker 作自訂 | Settings | [ ] |
| 🟠 P3 | OTP 格子補 `aria-label` | Landing Join | [ ] |
| 🟢 P4 | 顏色對比自動切換分數文字色（淺色背景→深色字） | Display/Controller | [ ] |
| 🎨 設計 | **全 app 色調統一**（三畫面共用視覺語言） | 共用 | [x] |
| 🎨 設計 | Landing 背景色改為競技感深色 | Landing | [x] |
| 🎨 設計 | Landing 三顆按鈕建立視覺層次（主/次/ghost） | Landing | [x] |
| 🎨 設計 | CSS 設計 token 化（色彩、圓角、spacing） | 共用 | [x] |
| 🎨 設計 | 字體換 Barlow Condensed（運動感） | 共用 | [ ] |
| 🎨 設計 | 統一圓角系統（卡片 16px、按鈕 12px、input 10px） | 共用 | [ ] |

---

## P1 詳細規格

### 1. 共用 Loading Overlay（排球 SVG 動畫）✅

**使用場景：**
- Landing：建立房間中（`creating`）
- Landing：加入房間中（`joining`）
- 未來可擴充：任何非同步等待狀態

**規格：**
- 全螢幕半透明遮罩（`position: fixed; inset: 0; background: rgba(0,0,0,0.45)`）
- 中央置放排球 SVG icon
- 動畫：上下彈跳（bounce），模擬排球落地反彈
- 動畫時長：0.6s，`ease-in-out`，`infinite alternate`
- SVG 尺寸：80×80px
- 不顯示文字（純視覺，避免語言歧義）

**Component 位置：** `src/components/LoadingOverlay.jsx`

---

### 2. Display — 離開房間 icon ✅

**位置：** header bar 最右側，房間碼同一行

**規格：**
- Icon：門口 SVG（`→|`）
- 點擊後顯示 in-app 確認：「確定離開房間？」→ 確認後返回 Landing
- 不使用原生 `confirm()`，改用 in-app mini modal
- 按鈕尺寸：44×44px touch target

**回到 Landing 方式：** 透過 `onLeave` prop 傳入，App.jsx 處理 `setMode('landing')`

---

### 3. OTP 錯誤後自動清除 ✅

**觸發時機：** `joinError` 從空字串變為有值時

**行為：**
1. 清空所有格子（`setDigits(Array(4).fill(''))`）
2. Focus 第一格
3. 錯誤訊息顯示在輸入框下方（現有行為，保留）

**實作位置：** `RoomCodeInput` 接收 `error` prop，以 `useEffect([error])` 觸發清除

---

### 4. 全頁鎖定滿版，禁止捲動

**現況：** Landing 及其他畫面在瀏覽器（非 PWA）開啟時可向下捲動，不是滿版

**建議：**
```css
html, body {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}
```
- `#root` 同樣設 `height: 100%; overflow: hidden`
- 搭配 `<meta name="viewport" content="..., user-scalable=0">` 防止縮放觸發捲動

---

### 5. Landscape 左右空白

**現況：** 手機橫放後，畫面左右有瀏覽器安全區域留白

**建議：**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```
```css
.container {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

### 6. Controller landscape：減分按鈕消失

**現況：** 橫向模式下 `.minus-btn` 被推出畫面或被截斷

**原因：** `ctrl-team-wrap` flex column 高度不足，`minus-btn` 溢出容器

**建議：** 確認 `.ctrl-scores` 與 `.ctrl-team-wrap` 在 landscape 下不使用固定高度，改用 `flex: 1; min-height: 0`

---

### 7. Controller portrait：比分卡被壓縮未滿版

**現況：** 直向模式比分卡高度被壓縮，左右未撐滿

**建議：** portrait media query 下 `.ctrl-scores` 改為 `flex-direction: column`，各 `score-card` 設 `flex: 1; width: 100%`

---

## P2 詳細規格

### 8. Reset / Save 視覺區隔 ✅

- Save：保留現有樣式（`rgba(0,0,0,0.25)`）
- Reset：加 ⚠ prefix，背景改深紅 `rgba(180,30,30,0.35)`
- `justify-content: space-between`

---

### 9. 加分卡片按壓反饋 ✅

```css
.score-card:active {
  transform: scale(0.97);
  opacity: 0.85;
  transition: transform 0.08s, opacity 0.08s;
}
```

---

### 10. 設定套用後 Toast 回饋 ✅

- drawer 關閉後底部出現 Toast：「✓ 隊伍設定已儲存」
- 顯示 1.5 秒後淡出
- Component：`src/components/Toast.jsx`

---

### 11. in-app Modal 取代 confirm / alert ✅

共用 `ConfirmModal` component（`src/components/ConfirmModal.jsx`），props：
```
title, message, confirmLabel, cancelLabel, onConfirm, onCancel
```

---

### 12. 按鈕文字語言統一 ✅

| 現況 | 改為 |
|------|------|
| Save 紀錄 | 儲存紀錄 |
| Reset 歸零 | ⚠ 重設比數 |

---

### 13. 設定 Icon 改為 SVG

**現況：** `⚙`（emoji，跨平台渲染不一致）

**建議：**
- 使用 `src/assets/settings.svg` 取代 emoji
- 以 `<img src={settingsUrl} />` 或 inline SVG 引入
- 尺寸 22×22px，`filter: brightness(0) invert(1)` 讓圖示在深色背景顯示為白色

---

### 14. Controller header/footer 半透明 float，比分滿版

**現況：** header、footer 為普通 flex 子項，佔去比分區空間

**建議：**
- `.controller` 改為 `position: relative`
- `.ctrl-header` / `.ctrl-footer` 改為 `position: absolute`（或 `fixed`），`top: 0` / `bottom: 0`，`width: 100%`，`background: rgba(0,0,0,0.35)`, `backdrop-filter: blur(4px)`
- `.scores-wrap.ctrl-scores` 改為 `position: absolute; inset: 0`，滿版顯示，padding 留出 header/footer 高度

---

### 15. 提示使用者安裝 PWA / 隱藏網址列

**現況：** 使用者直接開啟網頁，網址列佔去空間且無全螢幕體驗

**建議：**
- 偵測 `window.matchMedia('(display-mode: standalone)')` 判斷是否已安裝
- 若未安裝，在 Landing 底部顯示安裝提示條：
  - iOS：「點選 分享 → 加入主畫面 以取得全螢幕體驗」
  - Android/Chrome：攔截 `beforeinstallprompt` 事件，顯示「安裝應用程式」按鈕
- 提示條可關閉（`sessionStorage` 記錄已關閉狀態）

---

## P3 詳細規格

### 16. Landing 情境說明文字 ＋ 單機模式按鈕放大

**說明文字：** 只顯示在「建立房間」「加入房間」上方，單機模式不需要。

```
┌──────────────────────────────────────────┐
│              VolleyScore                 │
│                                          │
│      一台顯示比分，另一台遠端控制            │  ← 說明文字
│   ┌──────────────┐  ┌──────────────┐    │
│   │  建立房間     │  │   加入房間     │    │
│   │  （顯示端）    │  │  （控制端）    │    │
│   └──────────────┘  └──────────────┘    │
│                                          │
│         ┌──────────────────┐             │
│         │     單機模式       │             │
│         └──────────────────┘             │
└──────────────────────────────────────────┘
```

- 說明文字：0.9rem，`rgba(255,255,255,0.8)`，置中
- 「建立房間」「加入房間」包在 `.landing-remote-group` 內（含說明文字）
- 「單機模式」與其他按鈕等高（`min-height: 90px`），寬度同 `.landing-remote-group`

---

### 17. Records Drawer 改 Overlay

**現況：** `max-height` 展開，推擠比分區域往上

**建議：** 改為 `position: absolute; bottom: 0` 的 overlay，浮在比分上方
- 半透明背景（`rgba(0,0,0,0.7)`）
- 點擊外部關閉
- 比分區保持全高度不受影響

---

### 18. 隊伍色票預設選項

在 color picker 上方加 6 個預設色圓點（快速選色）：
```
⬤ #cd2424  ⬤ #244ecd  ⬤ #1f8f1f  ⬤ #d16a03  ⬤ #7b2d8b  ⬤ #1a1a1a
```
點選即套用，color picker 保留作「自訂顏色」。

---

### 19. OTP aria-label

```jsx
<input
  aria-label={`房間碼第 ${i + 1} 碼`}
  ...
/>
```

---

---

## 設計系統審查（ui-ux-pro-max skill，2026-06-17）

> 工具：`.agents/skills/ui-ux-pro-max`，查詢 sports/scoreboard/vibrant 類別

### 核心問題

| 嚴重度 | 問題 | 說明 |
|--------|------|------|
| 🔴 Critical | 三畫面視覺語言不一致 | Landing 橘紅漸層、Controller 白底、Display 白底，同 app 像三個不同產品 |
| 🔴 Critical | Landing 背景色跑調 | `#feb692→#ea5455` 橘色偏餐飲暖色，不符排球競技感 |
| 🔴 Critical | ⚙ emoji 當 icon | 跨平台渲染不一致，skill `no-emoji-icons` 規則 |
| 🟡 High | Landing 按鈕無主次層次 | 三顆按鈕各用不同顏色（藍/綠/黑），選色隨意，無 primary/secondary/ghost 分級 |
| 🟡 High | 字體缺乏運動感 | Concert One 圓潤偏日系休閒；skill 推薦 sports 類別用 Barlow Condensed 或 Bebas Neue |
| 🟠 Medium | 無 CSS 設計 token | 所有顏色直接 hardcode，無法系統性維護 |
| 🟠 Medium | 圓角不一致 | 20px / 16px / 12px / 50% 混用，無統一系統 |
| 🟠 Medium | Display 缺舞台感 | 大螢幕顯示用途但比分卡無陰影/邊框，貼白底很單薄 |

### Skill 推薦設計方向

- **Style：** Vibrant & Block-based（高對比、大字、幾何色塊）
- **Typography：** Barlow Condensed（heading）+ Barlow（body），運動品牌感
- **Color 方向：** 深色背景為底，隊伍色作唯一亮色焦點

---

### 候選配色方案分析（已確認選方案 D ✅）

所有方案摘要：

| 方案 | 色系 | 競技感 | 能量感 | 辨識度 | 使用場景 |
|------|------|--------|--------|--------|----------|
| A — 紫玫系 | Purple + Rose | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 音樂節/派對排球 |
| B — 海軍金系 | Deep Navy + Gold | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 正式賽/聯賽 |
| C — 電競紫系 | Violet + Orange | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 電競/現代運動賽事 |
| **D — 中藍橙系** ✅ | Mid Blue + Orange | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 休閒友誼賽/通用 |
| E — 鋼藍桃系 | Steel Blue + Peach | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | 生活運動品牌 |

---

#### ✅ 最終選擇：方案 D — 中藍橙系
`#485696` Mid Blue / `#e7e7e7` Light Gray / `#f9c784` Warm Yellow / `#fc7a1e` Orange / `#f24c00` Deep Orange

**選擇理由：**
- Mid Blue 比 Deep Navy 更親切平易，適合各種使用情境（正式到休閒皆宜）
- 橙色梯度（暖黃 → 橙 → 深橙）形成自然的能量升溫感，視覺上有層次
- 比方案 B 少了嚴肅感，比方案 C 少了電競感，適合排球這種團隊友誼運動
- Light Gray 作文字色比 Cream 更現代、更清晰

---

### CSS Design Tokens（方案 D）

```css
:root {
  --bg:          #485696;   /* Mid Blue — 全 app 背景 */
  --bg-dark:     #2e3a6e;   /* Darker Blue — header/footer/overlay */
  --bg-surface:  rgba(46, 58, 110, 0.75); /* 半透明深藍 — 浮層底色 */
  --text:        #e7e7e7;   /* Light Gray — 主文字 */
  --text-muted:  rgba(231, 231, 231, 0.55); /* 次要文字 */
  --accent:      #f9c784;   /* Warm Yellow — 主 CTA、標題強調 */
  --accent-fg:   #2e3a6e;   /* 深藍 — accent 按鈕上的文字 */
  --energy:      #f24c00;   /* Deep Orange — 重要操作、得分強調 */
  --energy-fg:   #fff;
  --warm:        #fc7a1e;   /* Orange — 次要強調、hover 狀態 */
  --border:      rgba(231, 231, 231, 0.2);
  --border-mid:  rgba(231, 231, 231, 0.4);
}
```

### 各元件配色對應

| 元件 | token | 說明 |
|------|-------|------|
| 全 app 背景 | `--bg` (#485696) | Landing / Controller / Display 共用 |
| Header / Footer | `--bg-dark` (#2e3a6e) | 深藍，明顯區隔主內容 |
| 主文字 | `--text` (#e7e7e7) | 高對比淺灰 |
| 主按鈕（建立房間） | `--accent` 底 + `--accent-fg` 文字 | 暖黃底 + 深藍字 |
| 次要按鈕（加入房間） | outlined `--border-mid` | 半透明框 |
| Ghost 按鈕（單機模式） | outlined `--border` | 極淡框 |
| 強調 / 重設等危險操作 | `--energy` (#f24c00) | 深橙紅 |
| 主隊預設色 | `#f24c00` (Deep Orange) | 與 --energy 同色系 |
| 客隊預設色 | `#485696` → 改為 `#244ecd` | 藍色仍保留（白字對比佳且與背景有足夠區別度） |
| ConfirmModal 確認鍵 | `--energy` | 保持警示感 |
| 設定套用鍵 | `--warm` (#fc7a1e) | 正向操作用橙色 |

---

## 不實作項目（已確認）

| 項目 | 原因 |
|------|------|
| 無隊名時顯示空白 | 預設行為，符合設計意圖 |
| 房間碼字體放大 | 維持現有大小 |
| 誤觸加分 Undo 機制 | 暫不實作 |
