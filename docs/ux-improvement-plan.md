# UX 優化計劃

> 來源：UX Design Review（2026-06-17）；測試回饋補充（2026-06-17）；第二輪 UX Review（2026-06-17）
> 範圍：Landing、Display、Controller、Settings Drawer
> 設計規範：所有 UI/UX 改動須參考 `.agents/skills/ux-designer` skill（Visual Design、Interaction Design 規則）

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
| 🟡 P2 | 設定 icon 從 ≡ 改為 SVG（`assets/settings.svg`） | Controller | [x] |
| 🟡 P2 | Controller header/footer 半透明 float，比分滿版 | Controller | [x] |
| 🟡 P2 | 提示使用者安裝 PWA / 隱藏瀏覽器網址列 | 共用 | [x] |
| 🟡 P2+ | Controller 加離開按鈕（同 Display 設計） | Controller | [x] |
| 🟡 P2+ | 減分按鈕 float 在 score-card 上，比分卡真正滿版 | Controller | [x] |
| 🟡 P2+ | 下方工具列改可收合 FAB（`‹` icon，左下角） | Controller | [x] |
| 🟡 P2+ | Landing 背景漸層深化 + 遠端/單機分組 UI | Landing | [x] |
| 🟠 P3 | Landing 加情境說明文字 | Landing | [x] |
| 🟠 P3 | Records drawer 改 overlay，不壓縮比分區 | Display | [x] |
| 🟠 P3 | 隊伍色票加預設色選項，color picker 作自訂 | Settings | [x] |
| 🟠 P3 | OTP 格子補 `aria-label` | Landing Join | [x] |
| 🟢 P4 | 顏色對比自動切換分數文字色（淺色背景→深色字） | Display/Controller | [ ] |
| 🎨 設計 | **全 app 色調統一**（三畫面共用視覺語言） | 共用 | [x] |
| 🎨 設計 | Landing 背景色改為競技感深色 | Landing | [x] |
| 🎨 設計 | Landing 三顆按鈕建立視覺層次（主/次/ghost） | Landing | [x] |
| 🎨 設計 | CSS 設計 token 化（色彩、圓角、spacing） | 共用 | [x] |
| 🎨 設計 | 字體換 Barlow Condensed（運動感） | 共用 | [x] |
| 🎨 設計 | 統一圓角系統（卡片 16px、按鈕 12px、input 10px） | 共用 | [x] |

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

---

## P2+ 詳細規格（第二輪 UX Review，2026-06-17）

> UX 原則依據：ux-designer skill — Interaction Design（確認對話框、touch target）、Visual Design（視覺層次、8px grid、grouping by proximity）

---

### 20. Controller 離開按鈕

**設計來源：** 與 Display `.leave-btn` 完全相同（複用 CSS class + SVG）

**位置：** `ctrl-header` 最右側（與 settings icon 同側、settings 之後）

> UX 注意：leave-btn 放右側與 Display 一致，形成全 app 統一肌肉記憶；settings 在 leave 左側（操作頻率高 > 破壞性操作）

**SVG（同 Display）：**
```jsx
<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" strokeWidth="2"
     strokeLinecap="round" strokeLinejoin="round">
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</svg>
```

**行為：**
- 點擊 → `ConfirmModal`
  - 線上模式：`「確定離開房間？」` / 確認鍵「離開」/ 取消鍵「取消」
  - 單機模式：`「確定返回首頁？」` / 確認鍵「返回」/ 取消鍵「取消」
- 確認 → `onLeave()` prop（App.jsx 負責切換 mode）

**Props 異動：**
- `Controller` 新增 `onLeave` prop
- `App.jsx` 兩處傳入 `onLeave={() => setMode('landing')}`

**CSS：** 直接套用已有 `.leave-btn` class，無需新增樣式

**Touch target：** 44×44px（`.leave-btn` 現有規格符合）

---

### 21. 減分按鈕 float + 比分卡真正滿版

**目標：** score-card 填滿 ctrl-team-wrap，minus-btn 半透明浮在卡片底部中央

**Layout 結構：**
```
ctrl-scores (position: absolute; inset: 0)
  └─ ctrl-team-wrap × 2 (position: relative; flex: 1)
       ├─ score-card (position: absolute; inset: 0)  ← 填滿整個 team-wrap
       └─ minus-btn (position: absolute; bottom: 16px; left: 50%; translateX(-50%))
```

**ctrl-team-wrap：**
```css
.ctrl-team-wrap {
  position: relative;
  flex: 1;
  /* 移除 flex-direction: column; gap: 8px; overflow: hidden; min-height: 0 */
}
```

**score-card（在 ctrl-team-wrap 內）：**
```css
.ctrl-team-wrap .score-card {
  position: absolute;
  inset: 0;
  /* flex: 1; height: auto 不再需要 */
}
```

**minus-btn：**
```css
.minus-btn {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  /* 保留：width: 60px; height: 60px; border-radius: 50%; background: rgba(0,0,0,0.25) */
}
```

**ctrl-scores padding 調整：**
```css
.ctrl-scores {
  padding: 60px 4px 80px;
  /* top: header 高度（60px）; bottom: FAB 44px + 16px bottom + 20px 間距 */
}
```
> 80px bottom padding 確保 minus-btn 不被 FAB 遮蓋（FAB top = 16+44=60px；minus-btn bottom-edge = 80+16=96px from screen bottom，清空間）

**Portrait media query 更新：**
```css
@media (orientation: portrait) {
  .ctrl-scores { flex-direction: column; padding: 60px 4px 80px; }
  .ctrl-team-wrap { flex: 1; width: 100%; /* 移除 flex-direction: row */ }
  /* .ctrl-team-wrap .score-card 的 flex 相關規則可移除（已用 absolute） */
}
```

---

### 22. 下方工具列可收合 FAB

**設計概念：**
- 畫面預設乾淨，只有左下角一個小圓形 FAB
- FAB icon：`‹`（chevron-left），暗示「向左展開」或「有更多」
- 點擊 FAB → 工具列從底部滑入；FAB icon 變 `✕`（關閉）
- 展開後工具列佔據底部，FAB 視覺上嵌入工具列左側

**狀態：**
| 狀態 | FAB icon | footer |
|------|----------|--------|
| 收合（預設） | `‹` | `translateY(100%)` 隱藏 |
| 展開 | `✕` | `translateY(0)` 滑入 |

> UX 原則：預設收合讓比分卡視覺更乾淨；`‹` 暗示可展開但不強迫注意力（Interaction Design：minimize steps，only surface actions when needed）

**FAB 規格：**
```css
.ctrl-fab {
  position: absolute;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  left: 16px;
  z-index: 20;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid var(--border-mid);
  color: var(--text);
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.ctrl-fab:hover { background: rgba(0, 0, 0, 0.65); }
.ctrl-fab.open { transform: rotate(180deg); /* optional spin effect */ }
```

**Footer（可收合）：**
```css
.ctrl-footer {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  padding-left: 72px;          /* 為 FAB 留位 */
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transform: translateY(100%);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.ctrl-footer.open { transform: translateY(0); }
```

**JSX state：** `const [footerOpen, setFooterOpen] = useState(false)`

**操作後自動收合：**
- `handleSave()` 結束後：`setFooterOpen(false)`
- ⚠ 重設比數：`setResetConfirm(true); setFooterOpen(false)`

---

### 23. Landing 背景漸層深化 + 遠端/單機分組

#### 23a. 背景漸層

**現況：** `linear-gradient(160deg, #485696 0%, #2e3a6e 100%)` 方向感弱，明暗差不足

**新漸層：**
```css
.landing {
  background: linear-gradient(to bottom, #485696 0%, #2e3a6e 55%, #1a2347 100%);
}
```
> 由亮藍 → 中藍 → 深海藍，由上往下增加縱深感，符合「舞台感深色背景」設計方向（ux-designer Visual Design：Color Usage — use depth to guide attention）

**`--bg-gradient` token 同步更新：**
```css
--bg-gradient: linear-gradient(to bottom, #485696 0%, #2e3a6e 55%, #1a2347 100%);
```

#### 23b. 遠端/單機分組 UI

**問題：** 三顆按鈕排排站，使用者看不出「建立房間+加入房間」是一對。（ux-designer Visual Design：group related items using proximity and shared containers）

**新 Layout：**
```
┌──────────────────────────────────────────┐
│              VolleyScore                 │
│                                          │
│  ╔══════════════════════════════════╗    │
│  ║  一台顯示比分，另一台遠端控制      ║    │
│  ║  ┌──────────────┐┌────────────┐  ║    │
│  ║  │  建立房間     ││  加入房間   │  ║    │
│  ║  │  顯示端       ││  控制端     │  ║    │
│  ║  └──────────────┘└────────────┘  ║    │
│  ╚══════════════════════════════════╝    │
│                                          │
│          ──────────────                  │
│                                          │
│         ┌──────────────────┐             │
│         │     單機模式      │             │
│         └──────────────────┘             │
└──────────────────────────────────────────┘
```

**元件規格：**

`.landing-remote-group`（外框容器）：
```css
.landing-remote-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  border: 1px solid var(--border-mid);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  width: 100%;
  max-width: 380px;
}
```

`.landing-group-hint`（說明文字）：
```css
.landing-group-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  text-align: center;
  letter-spacing: 0.5px;
}
```

`.landing-or`（分隔線）：
```css
.landing-or {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.82rem;
  width: 100%;
  max-width: 380px;
}
.landing-or::before,
.landing-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
```

`.landing-btn--offline`（獨立單機按鈕）：
```css
/* 新增：寬度與 remote-group 對齊 */
.landing-btn--offline {
  width: 100%;
  max-width: 380px;
}
```

**JSX 結構（Landing main view）：**
```jsx
<div className="landing">
  {creating && <LoadingOverlay />}
  <h1 className="landing-title">VolleyScore</h1>

  <div className="landing-remote-group">
    <p className="landing-group-hint">一台顯示比分，另一台遠端控制</p>
    <div className="landing-actions">
      <button className="btn landing-btn landing-btn--display" ...>
        建立房間 <span className="landing-btn-sub">顯示端</span>
      </button>
      <button className="btn landing-btn landing-btn--controller" ...>
        加入房間 <span className="landing-btn-sub">控制端</span>
      </button>
    </div>
  </div>

  <div className="landing-or"></div>

  <button className="btn landing-btn landing-btn--offline" onClick={onOffline}>
    單機模式
  </button>

  <PwaBanner />
</div>
```

**Portrait mode：** `.landing-actions` 內兩顆按鈕仍維持縱向排列（現有 media query 已覆蓋）

---

## 不實作項目（已確認）

| 項目 | 原因 |
|------|------|
| 無隊名時顯示空白 | 預設行為，符合設計意圖 |
| 房間碼字體放大 | 維持現有大小 |
| 誤觸加分 Undo 機制 | 暫不實作 |

---

## 第三輪 UX Review（ux-designer + ui-ux-pro-max，2026-06-17）

> 工具：`.agents/skills/ux-designer` + `.agents/skills/ui-ux-pro-max`
> 審查範圍：Accessibility、Touch Target、Microcopy、ARIA、Style Consistency

### 已修正項目

| 優先 | 問題 | 檔案 | 修正 |
|------|------|------|------|
| 🔴 Critical | 「顯示/關閉紀錄」按鈕文字邏輯反轉 | Controller.jsx | 用戶自行修正 |
| 🔴 Critical | `landing-btn--controller` border 幾乎不可見（`#2e3a6e` 深藍邊框在深藍漸層上 contrast ≈1:1） | style.css | 用戶自行改為 `var(--accent)` |
| 🟡 P2 | `ctrl-fab` 觸控面積 40→44px | style.css | 已修 |
| 🟡 P2 | `card-toolbar` 無明確高度，跨裝置不穩定 | style.css | 加 `height: 52px` |
| 🟡 P2 | 色票（Settings 顏色圓點）觸控面積 22→28px | style.css | 已修 |
| 🟠 A11y | Settings overlay 無 ARIA（`role="dialog"`、`aria-modal`、`aria-labelledby`） | Controller.jsx | 已加 |
| 🟠 A11y | 刪除紀錄按鈕 `✕` 無 aria-label，螢幕閱讀器不可用 | Controller.jsx | 已加 `aria-label="刪除第 N 局紀錄"` |
| 🟠 A11y | Toast 無 aria-live，螢幕閱讀器不可見 | Toast.jsx | 已加 `role="status" aria-live="polite"` |

### 已修正（補充）

| 項目 | 說明 |
|------|------|
| Dead CSS 清理 | `style.css` 1341→1028 行，刪除 313 行舊版 `.nav-wrap`、`.hamburger`、`.open-nav`、`.calc-wrap`、`.card`、`.minus-wrap` 等 |

### 待處理（低優先）

| 優先 | 問題 | 說明 |
|------|------|------|
| 🟡 P3 | 文字符號 → SVG icons | ✅ 已實作，建立 `Icon.jsx`，替換 4 處 |
| 🟠 A11y | `--text-muted` 對比度不達標 | `rgba(231,231,231,0.55)` 在 `#485696` 上約 2.3:1（WCAG AA 需 4.5:1）；改動影響全局視覺，需視覺驗證再處理 |
| 🟠 A11y | Settings overlay 缺 focus trap | Tab 鍵可逃出 modal，需 JS 層 focus management |

---

### SVG 替換計劃

**現有文字符號（4 處）：**

| 檔案 | 位置 | 符號 | 用途 |
|------|------|------|------|
| `Controller.jsx:258` | FAB | `▼` / `▲` | 展開/收合 footer |
| `Display.jsx:51` | records-toggle | `▲` / `▼` | 展開/收合局數紀錄 |
| `Controller.jsx:269` | 刪除紀錄 | `✕` | 刪除單筆紀錄 |
| `Landing.jsx:49` | PWA banner | `✕` | 關閉 banner |

**建議方案：建立 `src/components/Icon.jsx`（集中管理，零依賴）**

```jsx
// src/components/Icon.jsx
const paths = {
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronUp:   <polyline points="18 15 12 9 6 15" />,
  close:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
}

const Icon = ({ name, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    {paths[name]}
  </svg>
)

export default Icon
```

**替換後用法：**
```jsx
import Icon from './Icon'

// FAB
{footerOpen ? <Icon name="chevronDown" size={18} /> : <Icon name="chevronUp" size={18} />}

// 刪除 / 關閉
<Icon name="close" size={16} />
```

**風格一致性：** `stroke="currentColor" strokeWidth="2"` 與現有 leave-btn SVG 完全相同。

---

## 第四輪修改（使用者測試回饋，2026-06-18）

> 來源：實機測試後回饋，4 項修改

---

### 修改項目

#### 1. 房間代號改全數字（4 位）

**Before：** 3 個英文字母 + 1 個數字（e.g., `ABC3`），需要混合鍵盤切換
**After：** 4 位純數字（1000–9999）（e.g., `3847`）

**理由：**
- 輸入更快，不需要切換鍵盤佈局
- 語音傳達更自然（「三八四七」比「A B C 三」清楚）
- 9000 個可能組合對非正式場合已足夠

**改動：**
- `useRoom.js`：`generateRoomCode` 改為 `String(Math.floor(Math.random() * 9000) + 1000)`
- `Landing.jsx`：OTP 驗證 regex 改為 `/[^0-9]/g`

---

#### 2. OTP 輸入開啟數字鍵盤

**Before：** `inputMode="text"`（全鍵盤）
**After：** `inputMode="numeric"`（數字鍵盤）

**改動：** `Landing.jsx` `RoomCodeInput` input 元素加 `inputMode="numeric"`

---

#### 3. Display 進入後顯示房間碼 Modal

**行為：**
- 進入 Display 頁即自動開啟 Modal
- Modal 中央顯示大字房間碼（金色，clamp 字型大小）
- SVG 環形倒數計時器（5 秒），倒數完自動關閉
- 可手動點「關閉」或點遮罩外部提早關閉
- 左上角房間碼文字改為可點擊按鈕，隨時重開 Modal

**Layout：**
```
┌────────────────────────────┐
│         房間碼              │  ← label（小字）
│          3847              │  ← 大字（accent 金色）
│          ◯ 3               │  ← SVG 環形倒數（accent 色圈）
│        [ 關閉 ]             │
└────────────────────────────┘
```

**圓點倒數設計：**
- 5 個圓點（r=3）等距排列在環形路徑上（DOT_R=14，viewBox 36×36，center 18,18）
- 從 12 點鐘方向順時針排列，每隔 72°（360/5）放一個點
- `i < countdown` 決定亮（`var(--accent)`）或暗（`rgba(255,255,255,0.15)`）
- 每秒消去最後一個亮點
- 倒數數字用 SVG `<text>` 置中（`textAnchor="middle" dominantBaseline="central"`）

```js
const DOT_POSITIONS = Array.from({ length: 5 }, (_, i) => {
  const angle = (-90 + (360 / 5) * i) * (Math.PI / 180)
  return { x: 18 + 14 * Math.cos(angle), y: 18 + 14 * Math.sin(angle) }
})
```

**新增 CSS：**
- `.code-modal-overlay`：全螢幕遮罩，z-index: 300
- `.code-modal`：居中卡片，深色背景
- `.code-modal-code`：`clamp(52px, 14vw, 96px)`，金色
- `.room-badge-code`：hover opacity 效果，pointer cursor

**倒數圓點顏色（與房間碼區隔）：**
- 亮點：`rgba(255,255,255,0.85)`（白色，非 accent 金色）
- 暗點：`rgba(255,255,255,0.2)`
- 數字：`rgba(255,255,255,0.6)`
- SVG 大小：56×56px（從 80 縮小）

---

#### 4. Display 計分模式 Toggle

**行為：**
- 右上角 Switch 切換純檢視 / 計分模式
- 計分模式啟用時：
  - 分數卡點擊 = 加分
  - 底部出現 `+` / `−` card-toolbar（半透明黑底，非隊伍色）
  - Thumb 滑到右側，軌道變暖黃
- 純檢視模式（預設）：分數卡不可點擊，無 card-toolbar

**Toggle 元件：自製 Switch（精確對齊 MUI Switch）**

不引入 antd / MUI（各約 +300KB gzip），純 CSS + React 實作：

**結構：**
```
button.score-switch (52×26px, transparent)
  ::before  →  細軌道 (14px 高，上下各留 6px)
  span.score-switch-thumb  →  白色圓圈 (24px，突出軌道 5px)
    Icon (15px)
```

**CSS 設計：**
- 軌道用 `::before` 偽元素製作，高度 14px，button 高度 26px → thumb（24px）突出軌道上下各 5px
- OFF 軌道：`rgba(0,0,0,0.45)`
- ON 軌道：`rgba(249,199,132,0.55)`（accent 半透明）
- Hover：thumb 周圍 8px 光暈（ripple 簡化版）
- ON Hover：光暈用 accent 色調 `rgba(249,199,132,0.15)`

| 細節 | MUI 原版 | 本專案實作 |
|------|---------|----------|
| 容器尺寸 | 58×38px | 52×26px |
| 軌道高度 | 14px（細） | 14px ✓ |
| Thumb 尺寸 | 20px | 24px（更大，放 icon） |
| Thumb 突出 | ✓ | ✓ |
| Thumb 陰影 | 雙層 | 雙層 ✓ |
| Hover 光暈 | ripple | 8px ring ✓ |
| Transition | 0.3s | 0.3s cubic-bezier ✓ |
| Bundle 增加 | ~300KB | 0KB ✓ |

```jsx
<button className={`score-switch${canScore ? ' on' : ''}`}
        role="switch" aria-checked={canScore} aria-label="計分模式"
        onClick={() => setCanScore(v => !v)}>
  <span className="score-switch-thumb">
    <Icon name={canScore ? 'pointer' : 'eye'} size={15} />
  </span>
</button>
```

**Icon：**
- 眼睛（pure view）：`eye` stroke path
- 手指點擊（scoring）：`pointer` fill-based path（外部 SVG，`fill="currentColor" stroke="none"`）
- 新增至 `Icon.jsx` `paths` 物件

**Display card-toolbar（計分模式）：**
- 沿用隊伍色（inline `style={{ backgroundColor: teamColor }}`），與 Controller 一致
- `can-score` class 動態切換 score-card 圓角為 `16px 16px 0 0`，使卡片與 toolbar 無縫銜接

#### Icon.jsx 管理的 icons（截至 2026-06-18）

| name | 風格 | 用途 |
|------|------|------|
| `chevronDown` | stroke | FAB 收合、records toggle |
| `chevronUp` | stroke | FAB 展開、records toggle |
| `close` | stroke | 刪除紀錄、PWA banner 關閉 |
| `eye` | stroke | Display switch OFF（純檢視模式） |
| `pencil` | stroke | （保留，未使用）|
| `pointer` | fill | Display switch ON（計分模式）|
| `leave` | stroke | 離開房間按鈕（Display + Controller 共用） |

**混用 fill / stroke 說明：**
Icon 元件預設 `fill="none" stroke="currentColor"`。fill-based icon（如 `pointer`）在 path 上直接加 `fill="currentColor" stroke="none"` 覆蓋父層設定，顏色仍跟 CSS `color` 走，兩種風格可共存。

`pointer` icon 來源：手繪風指尖手型 SVG（fill-based），描繪多指展開、食指向上的手勢，語意為「可觸碰/點擊以互動」。

**新增 CSS：**
```css
.display-mode .scores-wrap { align-items: stretch; }
.display-team-wrap { display: flex; flex-direction: column; flex: 1; align-self: stretch; min-width: 0; }
.display-team-wrap .score-card { flex: 1; width: 100%; min-height: 0; cursor: default; }
.display-team-wrap.can-score .score-card { border-radius: 16px 16px 0 0; cursor: pointer; }
```

**資料流：** 直接使用 `room.addScore(team)` / `room.subScore(team)`（useRoom 回傳值，已在 Display props 中）

---

### Bug fixes（2026-06-18 補充）

| 問題 | 原因 | 修正 |
|------|------|------|
| Display 比分卡不滿版 | base `.scores-wrap` 有 `align-items: center`；`.display-mode .scores-wrap` 未覆蓋 | 加 `align-items: stretch`；`display-team-wrap` 加 `align-self: stretch; min-width: 0` |
| Display card-toolbar 與 Controller 外觀不一致 | score-card 圓角 Display 全 16px、Controller 上圓下平；toolbar 顏色不同 | `can-score` class 動態切換圓角為 `16px 16px 0 0`；補回 inline `backgroundColor` |
| 加入房間返回後仍顯示舊錯誤 | `joinError` 在 App.jsx，返回時不清空 | Landing 接收 `onClearError` prop，點返回同時呼叫清空 |
| Controller/Display 比分區樣式不一致 | Controller 用 `ctrl-scores`（含 `align-items: stretch`），Display 只用 `scores-wrap` | 統一在 `.display-mode .scores-wrap` 加 `align-items: stretch` |

### Bug fixes（2026-06-18 第二批）

| 問題 | 原因 | 修正 |
|------|------|------|
| Display 局數紀錄展開後遮住 card-toolbar | `.records-drawer` 為 `position: absolute; bottom: 0`，疊在 scores-wrap 上 | 改為 `position: relative`（normal flow），scores-wrap flex:1 自動縮短讓出空間 |
| 快速開始頁標題顯示「單機模式」 | Controller.jsx 寫死字串 '單機模式' | 改為 '快速開始' |
| Landscape Landing 標題太小 | `clamp(1.4rem, 4vh, 2.5rem)` 在 landscape 的 vh 極小 | 改為 `clamp(1.8rem, 5vw, 2.5rem)`，以 vw 為 preferred value |

### UX 決策紀錄（2026-06-18 第二批）

**Display 頂部 badge 改 overlay（方案 B）：**
- `.room-badge` 改為 `position: absolute; top: 0; z-index: 25; backdrop-filter: blur(8px); background: rgba(0,0,0,0.12)`
- 比分卡延伸至全畫面頂部，badge 浮在上方，與 Controller 的 `ctrl-header` 一致
- z-index: 25 > records-backdrop (19) + records-drawer (20)，確保 badge 永遠可見
- Controller `ctrl-header` 也同步調整為 `rgba(0,0,0,0.12)` + `blur(8px)`，兩頁一致
- tap icon 在 switch ON 狀態下放大至 16px（OFF 的 eye icon 維持 13px）

**RoomCodeModal 倒數關閉按鈕（最終設計）：**
- 浮動圓形按鈕，`position: absolute; top: -18px; right: -18px`（半凸出 modal 右上角）
- SVG arc 倒數環：外圈 track（`rgba(255,255,255,0.18)`）+ 進度圈（`rgba(255,255,255,0.8)`），`stroke-dashoffset` 每秒遞減，`transition: 0.9s linear` 平滑消耗
- 中心 × 圖示（SVG line × 2）
- modal 改為 `position: relative`，按鈕 `position: absolute` 凸出，不需 overflow: hidden
- 演進過程：5 圓點 → 圓點包成 button + 提示文字 → 底部分段條 → 最終浮動 arc ring button

**Display scores-wrap 元素對齊 Controller（完成後）：**

| CSS 屬性 | Controller | Display |
|---------|-----------|---------|
| scores-wrap flex-direction | row（portrait: column） | row（portrait: column）✓ |
| align-items | stretch | stretch ✓ |
| team-wrap | `ctrl-team-wrap` | `display-team-wrap` |
| score-card 圓角（有 toolbar） | `16px 16px 0 0` | `16px 16px 0 0`（`.can-score`）✓ |
| score-card min-height | `min-height: 0` | `min-height: 0` ✓ |
| card-toolbar background | inline teamColor | inline teamColor ✓ |
| user-select | none | none（`.can-score`）✓ |
| 主要差異（刻意保留） | padding 60px 頂部留 header | 無 padding（Display 無 floating header）|

---

### React `useCallback` 使用原則（筆記）

**場景：** `RoomCodeModal` 接收 `onClose` prop，其 `useEffect` 依賴 `onClose`

```jsx
// Display 元件
const closeModal = useCallback(() => setShowModal(false), [])

// 傳入子元件
<RoomCodeModal onClose={closeModal} />

// RoomCodeModal 內部
useEffect(() => {
  const id = setInterval(...)
  return () => clearInterval(id)
}, [onClose])   // ← 依賴 onClose 參考
```

**問題根源：** 每次 Display re-render，`() => setShowModal(false)` 都是全新 function 物件（即使邏輯相同）。新參考 → useEffect deps 改變 → interval 重設 → 倒數歸零無限循環。

**`useCallback` 的作用：** 回傳同一個 function 物件，deps `[]` 代表永不重建。

```
沒有 useCallback：
  render 1 → f1 = () => ...  (new object)
  render 2 → f2 = () => ...  (new object)
  f1 === f2  // false → effect 重跑

useCallback(fn, [])：
  render 1 → f (memoized)
  render 2 → f (same object)
  f === f    // true → effect 不重跑
```

**何時需要：** function 被當作 `useEffect` deps、`React.memo` 子元件的 props、或其他 memoization 比較時。平時不需要對所有 function 都加 `useCallback`。
