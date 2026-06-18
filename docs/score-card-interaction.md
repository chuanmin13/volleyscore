# Score Card 互動升級規格

## 目標

提升比分卡的互動質感，從靜態色塊進化為有方向感的動態計分介面。

---

## Feature 1：長按 − 觸發重設比數

### 行為描述
- 長按任一隊的 `−` 按鈕 **600ms** → 觸發 ConfirmModal「確定重設比數？」
- 短按（< 700ms）維持原有減分行為不變
- 適用頁面：Controller、Display（canScore 模式）

### UX 考量
- 語意來自真實使用行為：使用者想要快速歸零時，會本能地連按或長按 − 鈕，長按觸發重設直接命中此模式，屬**行為自然延伸**而非隱性快捷鍵
- 600ms 閾值（比系統長按 500ms 多 100ms 緩衝），防止快速連按誤觸；可依實際使用回饋調整
- ConfirmModal 作為第二道保護，避免長按觸發後立即清空

### 實作方向
```
onTouchStart → 啟動 setTimeout(700ms)
onTouchEnd / onTouchMove(超過閾值) → clearTimeout（取消）
setTimeout 觸發 → setResetConfirm(true)
```

---

## Feature 2：滑動手勢加減分

### 手勢定義
| 手勢 | 動作 | 語意 |
|------|------|------|
| 在分數卡上滑 | `addScore(team)` | 數字往上增加 |
| 在分數卡上下滑 | `subScore(team)` | 數字往下減少 |
| 點擊（現有） | `addScore(team)` | 維持兼容 |

### 觸發條件
- 滑動距離 > 30px（防誤觸）
- 主要是垂直位移（水平偏移 < 垂直偏移，防左右滑切換頁面衝突）
- `touchmove` 期間 `preventDefault()` 阻止頁面捲動

### 適用範圍
- Controller：所有情況下的分數卡
- Display：`canScore` 模式下的分數卡

---

## Feature 3：Rolling Number 動畫

### 視覺效果
數字加分時向上滾出、新數字從下滾入；減分時向下滾出、新數字從上滾入。方向與手勢一致。

```
加分：舊數字 translateY(0 → -100%)，新數字 translateY(100% → 0)
減分：舊數字 translateY(0 → +100%)，新數字 translateY(-100% → 0)
```

### 動畫規格
- 時長：250ms
- Easing：`cubic-bezier(0.4, 0, 0.2, 1)`（Material standard）
- 容器：`overflow: hidden`，高度固定（`height: 1lh` 或明確高度）
- 字體：Chakra Petch（現有，維持）

### React 實作方向

**Option A：CSS transition + key trick**
每次分數變化，給數字元素加上帶方向的 class（`rolling-up` / `rolling-down`），transition 結束後移除。簡單，但需要管理動畫狀態。

**Option B：雙層數字 + absolute 定位**
同時 render 舊數字和新數字，舊的滾出、新的滾入，`onTransitionEnd` 後清除舊數字。效果最乾淨。

**Option C：React Spring / Framer Motion**
用動畫庫處理，減少手動狀態管理。引入額外依賴（~30kb）。

→ **推薦 Option B**，無額外依賴，邏輯可控。

### 狀態設計（Option B）

```jsx
// 每個 team 維護：
{
  current: number,   // 目前顯示的數字
  prev: number,      // 上一個數字（動畫中）
  dir: 'up' | 'down' | null  // 動畫方向
}
```

---

## 實作順序建議

1. **Feature 1**（長按重設）— 最小改動，獨立可測
2. **Feature 2**（滑動手勢）— 需處理 touch event，建議先做 Controller
3. **Feature 3**（Rolling 動畫）— 視覺增強，可最後疊加，不影響功能

---

## 開放問題

- [ ] Display canScore 模式下，滑動手勢與 score-switch toggle 是否衝突？（switch 在頂部 bar，應不重疊）
- [ ] 多次快速加分時動畫是否需要 queue 或直接跳過動畫跟上數字？（建議：超過 150ms 內的第二次觸發跳過動畫，直接顯示最新數字）
- [ ] Landscape 下兩個卡片並排，滑動空間是否夠？（卡片高度約 680px，30px 閾值合理）
