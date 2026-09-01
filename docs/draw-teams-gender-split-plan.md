# 抽籤分隊：男女分開抽籤 + 房間持久化 實作計劃

## 背景

現行「抽籤分隊」（`src/components/ScoreBoard/DrawTeamsModal.jsx`）只有一個人數池，抽籤時無法保證性別平均分配到三隊。實務上遇到的情境（本次討論過程整理）：

- 男女人數不對等，例如 16 男 2 女、10 男 8 女，但希望每隊儘量平均分到女生
- 群組本身可能是混合性別（例如 1 男 1 女、4 男 1 女）
- 現有「固定隊伍／派代表抽籤」+「自訂各隊人數」只能控制人數，無法同時保證性別分布，過去只能用「湊對」「排除法」等變通做法

結論：把單一人數池拆成「男生／女生」兩個池，各自參與隊伍分配的計算，從演算法根本解決性別平均問題；同時保留「自訂各隊人數」這個既有能力（見待確認事項 1）。

---

## 現況架構（相關程式碼）

| 項目 | 檔案 | 行號 |
|---|---|---|
| 目標隊伍人數計算 | `DrawTeamsModal.jsx` | `computeQuotas` (55-59) |
| 群組容量驗證（1D 背包） | `DrawTeamsModal.jsx` | `canPackGroups` (62-78) |
| 設定驗證 | `DrawTeamsModal.jsx` | `validateSetup` (80-115) |
| 抽籤結果建立 | `DrawTeamsModal.jsx` | `buildLots` (134-172) |
| 自訂各隊人數（本次會話已完成） | `DrawTeamsModal.jsx` | `customQuota` / `teamSizes` state (188-201) |
| Modal 呼叫點 | `ScoreBoard/index.jsx` | 約 221-223（`<DrawTeamsModal onClose=.../>`） |
| 線上房間資料結構 | `src/hooks/useRoom.js` | `initialRoomState` (8-12) |
| 房間巢狀物件局部寫入範例 | `src/hooks/useRoom.js` | `updateTeams` (73-76) |
| 線上/離線資料切換 | `ScoreBoard/index.jsx` | 54-57 |

---

## 演算法設計

### 核心問題

過去想法（各自對男生池、女生池獨立呼叫 `computeQuotas` 再相加）會有一個問題：兩個池的餘數各自獨立、可能不會剛好互補，導致隊伍總人數不是最平均的結果（例如 16 男 2 女可能變成 7/6/5 而不是 6/6/6）。

**修正方向**：先決定「隊伍目標人數」（唯一、確定），再把男女人數依比例「灌入」這些固定的目標容量裡，讓總人數保證等於目標，不再是機率問題。

### Step 1：決定隊伍目標人數 `targetSizes`

沿用並保留現有「自動平均／自訂人數」兩種模式（即本次會話已實作的「自訂各隊人數」功能，見待確認事項 1）：

```js
// 自動模式：加入「餘數隨機補位」，不再固定補 A 隊，避免每次都是 A 隊最大
const computeQuotas = (total) => {
  const base = Math.floor(total / 3)
  const rem = total % 3
  const order = shuffle([0, 1, 2])
  const quotas = [base, base, base]
  for (let i = 0; i < rem; i++) quotas[order[i]] += 1
  return quotas
}

// 自訂模式：使用者輸入 teamSizes = [tA, tB, tC]
// 驗證：tA + tB + tC 必須等於 maleTotal + femaleTotal，否則顯示錯誤
```

無論自動或自訂，`targetSizes` 三隊總和永遠等於總人數，且是「這次抽籤隊伍人數的唯一真相」——後面的性別分配不會、也不能更動這個總量。

### Step 2：依比例分配性別（Largest Remainder Method）

給定 `targetSizes`（隊伍目標人數）與 `femaleTotal`（女生總數），算出每隊該分到幾個女生，讓：
- 各隊女生數總和 = `femaleTotal`（精確，不是機率湊出來的）
- 各隊女生數盡量符合該隊人數佔比（比例分配）
- 餘數（無法整除的部分）優先給「理想值小數部分最大」的隊伍，同分時隨機決定給誰（避免每次都是同一隊優先）

```js
const apportionFemale = (targetSizes, femaleTotal, totalPeople) => {
  if (totalPeople === 0) return targetSizes.map(() => 0)
  const ideal = targetSizes.map(t => (t * femaleTotal) / totalPeople)
  const base = ideal.map(Math.floor)
  let remaining = femaleTotal - base.reduce((a, b) => a + b, 0)

  const items = targetSizes.map((cap, i) => ({ i, frac: ideal[i] - base[i], cap }))
  while (remaining > 0) {
    const candidates = items.filter(it => base[it.i] < it.cap && it.frac >= 0)
    candidates.sort((a, b) => b.frac - a.frac)
    const topFrac = candidates[0].frac
    const tied = shuffle(candidates.filter(c => c.frac === topFrac))
    base[tied[0].i] += 1
    tied[0].frac = -1 // 這輪已分配，排除
    remaining -= 1
  }
  return base // 各隊女生配額
}

// 男生配額 = targetSizes[i] - femaleQuota[i]（自動成立，因為女生配額 <= targetSizes[i]）
```

**驗證範例**：

| 情境 | targetSizes（自動或自訂） | femaleTotal | 結果女生配額 | 結果男生配額 | 隊伍總人數 |
|---|---|---|---|---|---|
| 16男2女（共18） | [6,6,6] | 2 | 例：[1,1,0] | [5,5,6] | **6/6/6**（保證） |
| 10男8女（共18） | [6,6,6] | 8 | 例：[3,3,2] | [3,3,4] | **6/6/6**（保證） |
| 自訂 targetSizes=[6,5,5]，10男6女（共16） | [6,5,5] | 6 | [2,2,2] | [4,3,3] | **6/5/5**（等於自訂目標） |

不管男女比例怎麼變，隊伍總人數永遠精確等於 `targetSizes`，不再是「有機會湊成」而是「保證湊成」。

### Step 3：群組（含混合性別）的容量驗證與擺放

群組資料結構改為 `{ id, male, female, mode, team, scoreDesignated }`（用兩個數字取代原本單一 `size`）。

- **固定隊伍**：該群組的 `male`／`female` 分別不能超過目標隊伍當下「男生配額」／「女生配額」剩餘量（雙維度同時檢查，取代原本 `fixedByTeam` 的單一維度比較）
- **派代表抽籤**：位置搜尋（backtracking）從比較 1 個數字（`caps[i] >= size`）改成同時比較 2 個數字（`maleCaps[i] >= g.male && femaleCaps[i] >= g.female`），其餘搜尋邏輯不變，數量級小（幾個群組 × 3 隊），效能無虞
- 群組整組一定進同一隊，這點不變

### Step 4：個人抽籤

扣除所有群組佔用的男女配額後，剩餘男生配額、女生配額分別產生「個人抽籤池」，各自 shuffle、分開建立籤卡（對應到畫面上的「♂ 個人卡」「♀ 個人卡」兩個網格）。

---

## 計算範例

### 範例 A：18人（15男3女），群組 1/1 一組

**Step 1** `computeQuotas(18)`：18÷3=6 餘 0，整除不用隨機補位。
```
targetSizes = { A: 6, B: 6, C: 6 }
```

**Step 2** `apportionFemale([6,6,6], 3, 18)`：
```
ideal = [6×3/18]×3 = [1, 1, 1]   // 剛好整數，不進小數餘數分配
femaleQuota = { A: 1, B: 1, C: 1 }
maleQuota   = { A: 5, B: 5, C: 5 }
```

**Step 3** 群組（1男1女）固定指定 A 隊：
```
A 男生配額 5 >= 1 ✓，A 女生配額 1 >= 1 ✓ → 放入
A 剩餘：男 4、女 0；B、C 不受影響：男 5、女 1（各自）
```

**Step 4** 個人池：
| 隊伍 | 男生剩餘 | 女生剩餘 |
|---|---|---|
| A | 4 | 0 |
| B | 5 | 1 |
| C | 5 | 1 |

```
男生個人池：[A×4, B×5, C×5] 共 14 張
女生個人池：[B×1, C×1] 共 2 張（A 配額用完，不會出現在池子裡）
```

這個結果剛好呼應最初提出的「1男1女群組 + 其他人含2女，避免落單女生跟群組同隊」需求——A 隊女生配額被群組用完，個人池天生就只會落在 B、C，不需要湊對或排除法等變通做法。

---

### 範例 B：18人（15男3女），群組 1/1 兩組

Step 1、2 與範例 A 相同：`targetSizes = {A:6,B:6,C:6}`、`femaleQuota = {A:1,B:1,C:1}`、`maleQuota = {A:5,B:5,C:5}`。

**Step 3** 兩組（各 1男1女）分別固定指定 群組1→A、群組2→B：
```
群組1 → A：A 男5>=1 ✓、A 女1>=1 ✓ → 放入。A 剩餘：男4、女0
群組2 → B：B 男5>=1 ✓、B 女1>=1 ✓ → 放入。B 剩餘：男4、女0
C 不受影響：男5、女1
```

**Step 4** 個人池：
| 隊伍 | 男生剩餘 | 女生剩餘 |
|---|---|---|
| A | 4 | 0 |
| B | 4 | 0 |
| C | 5 | 1 |

```
男生個人池：[A×4, B×4, C×5] 共 13 張
女生個人池：[C×1] 共 1 張 → 唯一落單女生保證進 C，沒有隨機性
```

**性質**：每隊女生配額只有 1，兩組「各帶 1 女生」的群組不可能落在同一隊（該隊女生配額撐不住 2 女）。若這兩組改成「派代表抽籤」，容量檢查會自動逼它們散開到兩個不同隊，不需要額外規則防止「兩組女生擠同隊」。

---

### 範例 C：18人（16男2女），群組 4/0 指定 C 隊

**Step 1** `targetSizes = { A: 6, B: 6, C: 6 }`（18÷3=6 餘0）

**Step 2** `apportionFemale([6,6,6], 2, 18)`：
```
ideal = [6×2/18]×3 = [0.667, 0.667, 0.667]
base = [0,0,0]，剩 2 個名額，三隊小數並列 → 隨機挑 2 隊各 +1
假設本次隨機結果是 A、B：
femaleQuota = { A: 1, B: 1, C: 0 }
maleQuota   = { A: 5, B: 5, C: 6 }
```

**Step 3** 群組（4男0女）固定指定 C 隊：
```
C 男生配額 6 >= 4 ✓，C 女生配額 0 >= 0 ✓（群組不含女生，這個維度必過）
→ 放入。C 剩餘：男 2、女 0
A、B 不受影響：男5、女1（各自）
```

**Step 4** 個人池：
| 隊伍 | 男生剩餘 | 女生剩餘 |
|---|---|---|
| A | 5 | 1 |
| B | 5 | 1 |
| C | 2 | 0 |

```
男生個人池：[A×5, B×5, C×2] 共 12 張
女生個人池：[A×1, B×1] 共 2 張（C 沒有女生配額，也被純男生群組佔滿容量，雙重保證不會抽到女生）
```

**性質**：純男生群組（female=0）的女生維度檢查永遠是 `0 >= 0`，天生不會跟女生配額衝突，不需要特別處理。

---

## 資料結構變更

```js
// DrawTeamsModal 狀態
maleTotal: number     // 預設 18
femaleTotal: number   // 預設 0
customQuota: boolean  // 沿用既有「自訂各隊人數」開關
teamSizes: { A, B, C } // 自訂模式時的目標隊伍人數

groups: [{
  id, male, female,       // 取代原本 size；新增群組表單預設 male:1, female:1
  mode: 'draw' | 'fixed',
  team: 'A'|'B'|'C'|null,
  scoreDesignated: boolean,
}]
```

`validateSetup` 回傳值新增 `targetSizes`、`femaleQuotas`、`maleQuotas`，供畫面上的配額徽章與 `buildLots` 使用。

---

## UI 變更

**設定畫面（setup phase）**
- 原本「總人數」單一 stepper → 兩個 stepper，label 用 ♂ / ♀ 符號（弱化樣式、小字灰色，視覺上接近 placeholder 的份量感），預設 18 / 0
- 「自動平均／自訂人數」切換沿用既有 UI（`draw-mode-btn`），自訂模式的 3 個隊伍 stepper 維持，但語意變成「目標隊伍總人數」，驗證改為總和需等於 `maleTotal + femaleTotal`
- 新增群組表單：「人數」stepper 改成 ♂ / ♀ 兩個 stepper，預設各 1，總和限制沿用 2~6
- 隊伍配額徽章顯示如「A 隊 6 人（♂5 ♀1）」

**抽籤畫面（draw phase）**
三個獨立網格區塊，任一區塊沒有內容時整區不顯示（含標題）：
1. **群組卡**：固定與派代表抽籤的群組，卡面顯示組成如「4♂1♀」。`groups.length === 0` 時不顯示這區
2. **♂ 個人卡**：扣除群組佔用後，剩餘可抽的男生個人卡。剩餘數為 0 時不顯示
3. **♀ 個人卡**：同上，女生版本

---

## 房間持久化（僅線上模式）

- `useRoom.js`：`initialRoomState` 新增 `drawConfig: { maleTotal, femaleTotal, customQuota, teamSizes, groups }`；新增 `updateDrawConfig(partial)`，比照 `updateTeams` 用 `update(ref(db, 'rooms/{roomCode}/drawConfig'), partial)` 局部寫入
- `ScoreBoard/index.jsx` 呼叫 `<DrawTeamsModal>` 時傳入 room 相關資訊
- `DrawTeamsModal` 掛載時，若線上模式則用 `room.roomData.drawConfig` 回填設定；設定變動（人數、群組增減、自訂人數）時寫回房間
- **只存設定，不存抽籤結果**（phase / lots 不同步）——重新打開 modal 會回到 setup 畫面、帶著上次的人數與群組設定，需要再按一次「開始抽籤」。抽籤結果本來就只存在單一裝置本地 state，沒有跨裝置同步，此次不處理
- 離線模式（快速開始）不做持久化，維持每次重開都重填

---

## 已知限制 / 不在本次範圍

- ~~固定群組若指定到「該性別配額剛好是 0」的隊伍，會顯示驗證錯誤要求調整~~ ——**實作時已修正**：`validateSetup` 改成先把固定群組需要的男/女人數當作該隊下限保留起來，剩下名額才用比例分配法隨機分給三隊，保證固定群組一定塞得下（除非群組本身的合計人數就超過該隊目標人數，這種情況才會出現驗證錯誤，是合理攔截）。詳見 `DrawTeamsModal.jsx` 的 `validateSetup`
- 抽籤結果（已抽出的隊伍）不做跨裝置同步
- 「固定隊伍最小人數 2」的限制維持不變（本次會話稍早討論過，之後有需要再另外處理）

---

## 分階段實作清單

1. [x] `DrawTeamsModal.jsx`：`computeQuotas` 加入隨機補位、新增 `apportionFemale`
2. [x] `DrawTeamsModal.jsx`：群組資料結構與新增群組表單改成男女兩欄
3. [x] `DrawTeamsModal.jsx`：`validateSetup` / `canPackGroups` 改雙維度驗證，並將固定群組納入配額計算（見上方已知限制的更新說明）
4. [x] `DrawTeamsModal.jsx`：`buildLots` 改為群組雙維度背包 + 男女個人池分開建立
5. [x] `DrawTeamsModal.jsx`：畫面改版（設定畫面兩個性別欄位、抽籤畫面三網格、空區塊隱藏）
6. [x] `useRoom.js`：`drawConfig` 初始值與 `updateDrawConfig`
7. [x] `ScoreBoard/index.jsx`：wiring room 到 `DrawTeamsModal`，回填 / 寫回設定
8. [x] `Guide.jsx`：抽籤分隊說明段落改寫
9. [x] 手動驗證：`npm run build`、`eslint` 皆過關；瀏覽器（Playwright headless）跑過「15男3女＋固定群組」（驗證女生配額避開已用完的隊伍）、「男女其中一項為 0 時對應網格隱藏」、「自訂人數總和不符時顯示錯誤並鎖住開始抽籤」三組流程，畫面與 tally 結果皆符合預期
   - 線上房間持久化（`drawConfig` 讀寫）未跑過真實 Firebase 連線的端對端測試，僅完成程式碼邏輯確認
