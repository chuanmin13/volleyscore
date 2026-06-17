# UX 優化計劃

> 來源：UX Design Review（2026-06-17）
> 範圍：Landing、Display、Controller、Settings Drawer

---

## 優先順序總覽

| 優先 | 項目 | 畫面 | 狀態 |
|------|------|------|------|
| 🔴 P1 | 自訂 Loading Overlay（排球動畫） | 共用 | [ ] |
| 🔴 P1 | Display 右上角加離開房間 icon | Display | [ ] |
| 🔴 P1 | OTP 輸入錯誤後自動清除並 focus 第一格 | Landing Join | [ ] |
| 🟡 P2 | Reset / Save 視覺區隔，降低誤觸風險 | Controller | [ ] |
| 🟡 P2 | 加分卡片按壓視覺回饋（scale / opacity） | Controller | [ ] |
| 🟡 P2 | 設定套用後顯示回饋（✓ 已套用 Toast） | Settings | [ ] |
| 🟡 P2 | `confirm()` / `alert()` 改為 in-app modal | Controller | [ ] |
| 🟡 P2 | 按鈕文字統一為中文（Save→儲存、Reset→重設） | Controller | [ ] |
| 🟡 P2 | 設定 icon 從 ≡ 改為 ⚙（語意更準確） | Controller | [ ] |
| 🟠 P3 | Landing 加情境說明文字 | Landing | [ ] |
| 🟠 P3 | Records drawer 改 overlay，不壓縮比分區 | Display | [ ] |
| 🟠 P3 | 隊伍色票加預設色選項，color picker 作自訂 | Settings | [ ] |
| 🟠 P3 | OTP 格子補 `aria-label` | Landing Join | [ ] |
| 🟢 P4 | 顏色對比自動切換分數文字色（淺色背景→深色字） | Display/Controller | [ ] |

---

## P1 詳細規格

### 1. 共用 Loading Overlay（排球 SVG 動畫）

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

**Bounce 動畫：**
```css
@keyframes volleyball-bounce {
  from { transform: translateY(-12px); }
  to   { transform: translateY(12px); }
}
```

---

### 2. Display — 離開房間 icon

**位置：** header bar 最右側，房間碼同一行

**草圖（橫式）：**
```
┌──────────────────────────────────────────┐
│ A1B2                     局數紀錄 ▼  [⊗]  │
├───────────────────────┬──────────────────┤
```

**規格：**
- Icon：門口 SVG（`→|`）
- 點擊後顯示 in-app 確認：「確定離開房間？」→ 確認後返回 Landing
- 不使用原生 `confirm()`，改用 in-app mini modal
- 按鈕尺寸：44×44px touch target

**回到 Landing 方式：** 透過 `onLeave` prop 傳入，App.jsx 處理 `setMode('landing')`

---

### 3. OTP 錯誤後自動清除

**觸發時機：** `joinError` 從空字串變為有值時

**行為：**
1. 清空所有格子（`setDigits(Array(4).fill(''))`）
2. Focus 第一格
3. 錯誤訊息顯示在輸入框下方（現有行為，保留）

**實作位置：** `RoomCodeInput` 接收 `error` prop，以 `useEffect([error])` 觸發清除

---

## P2 詳細規格

### 4. Reset / Save 視覺區隔

**現況：** 同等大小、同等顏色的兩顆按鈕並排

**建議：**
- Save：保留現有樣式（`rgba(0,0,0,0.25)`）
- Reset：加 ⚠ prefix
- 兩顆按鈕間距 gap 移除，改為 `justify-content: space-between`

---

### 5. 加分卡片按壓反饋

**現況：** 點擊無任何視覺變化（數字更新但無即時感）

**建議：**
```css
.score-card:active {
  transform: scale(0.97);
  opacity: 0.85;
  transition: transform 0.08s, opacity 0.08s;
}
```

---

### 6. 設定套用後 Toast 回饋

**現況：** drawer 直接關閉，無確認

**建議：**
- drawer 關閉後，底部短暫出現 Toast：「✓ 隊伍設定已儲存」
- 顯示 1.5 秒後淡出
- Toast component 可與 Loading Overlay 放在同一個 `src/components/` 路徑

---

### 7. in-app Modal 取代 confirm / alert

**影響範圍：**
- `Controller.handleReset` → `confirm('確定重設比數？')`
- `Controller.handleSave` → `alert('紀錄已滿')`
- Display 離開房間確認（P1 新增）

**建議實作：** 共用 `ConfirmModal` component，props：
```
title, message, confirmLabel, cancelLabel, onConfirm, onCancel
```

---

### 8. 按鈕文字語言統一

| 現況 | 改為 |
|------|------|
| Save 紀錄 | 儲存紀錄 |
| Reset 歸零 | 重設比數 |
| 套用 / 取消 | 保留（已是中文）|

---

### 9. 設定 Icon 更換

- 現況：`≡`（hamburger，語意為導覽）
- 建議：`⚙` 或自訂 SVG gear icon
- 若使用 emoji，需確認各平台渲染一致性

---

## P3 詳細規格

### 10. Landing 情境說明文字 ＋ 單機模式按鈕放大

**說明文字：** 只顯示在「建立房間」「加入房間」上方，單機模式不需要。

```
┌──────────────────────────────────────────┐
│              VolleyScore                 │
│                                          │
│      一台顯示比分，另一台遠端控制            │  ← 說明文字
│   ┌──────────────┐  ┌──────────────┐    │
│   │  建立房間     │  │   加入房間     │    │
│   │  （顯示端）    │  │  （控制端）    │    │
│   └──────────────┘  └──────────────┘     │
│                                          │
│         ┌──────────────────┐             │
│         │     單機模式       │            │  ← 與上方兩顆等高
│         └──────────────────┘             │
└──────────────────────────────────────────┘
```

- 說明文字：0.9rem，`rgba(255,255,255,0.8)`，置中
- 「建立房間」「加入房間」包在 `.landing-remote-group` 內（含說明文字）
- 「單機模式」移除 `min-height: unset` 覆寫，與其他按鈕等高（`min-height: 90px`）
- 「單機模式」寬度與上方兩顆按鈕組合同寬（`width: 100%` 撐滿 `.landing-remote-group`）

---

### 11. Records Drawer 改 Overlay

**現況：** `max-height` 展開，推擠比分區域往上

**建議：** 改為 `position: absolute; bottom: 0` 的 overlay，浮在比分上方
- 半透明背景（`rgba(0,0,0,0.7)`）
- 點擊外部關閉
- 比分區保持全高度不受影響

---

### 12. 隊伍色票預設選項

在 color picker 上方加 6 個預設色圓點（快速選色）：
```
⬤ #cd2424  ⬤ #244ecd  ⬤ #1f8f1f  ⬤ #d16a03  ⬤ #7b2d8b  ⬤ #1a1a1a
```
點選即套用，color picker 保留作「自訂顏色」。

---

### 13. OTP aria-label

```jsx
<input
  aria-label={`房間碼第 ${i + 1} 碼`}
  ...
/>
```

---

## 不實作項目（已確認）

| 項目 | 原因 |
|------|------|
| 無隊名時顯示空白 | 預設行為，符合設計意圖 |
| 房間碼字體放大 | 維持現有大小 |
| 誤觸加分 Undo 機制 | 暫不實作 |
