# 抽籤分隊獨立入口 + UI 修正 + 房間連線持久化 實作計劃

> **狀態：已完成並通過 `npm run lint`、`npm run build`**。以下內容已同步更新為實際實作結果，跟原始計劃有出入的地方（主要是 Part 4 的 `roomMissing` 設計、以及驗證階段抓到的幾個小 bug）都在對應段落標註。

## 背景

本次會話整理出三塊互相關聯的工作：

1. 抽籤分隊（`DrawTeamsModal.jsx`）5 個 UI/互動小問題
2. Landing page 重新設計，讓「抽籤分隊」有獨立入口（不需要房間也能用），因此需要把元件從 `ScoreBoard/` 底下獨立出來，讓房間內的抽籤 modal 與 Landing 的獨立入口共用同一套元件
3. 討論中額外發現：`App.jsx`/`useRoom.js` 完全沒有做連線持久化，只要頁面 reload（背景太久被系統回收、手動重新整理）就會被踢回 Landing，需要重新輸入房間碼。已與使用者確認採用「輕量 URL 同步」方案，這次一起做

---

## Part 1：抽籤分隊檔案架構重構

### 現況

`src/components/ScoreBoard/DrawTeamsModal.jsx`（577 行）把三件事混在一起：

| 內容 | 行號 |
|---|---|
| 純演算法（`shuffle`、`declusteredShuffle`、`computeQuotas`、`apportionFemale`、`canPackGroups`、`validateSetup`、`assignScorers`、`buildLots`、`withBackEmoji`、`BACK_EMOJIS`） | 1-252 |
| `GenderCount` 顯示元件 | 62-67 |
| `DrawTeamsModal` 元件：state、handler、setup 畫面 JSX、draw 畫面 JSX、與 Room 耦合的 `onDrawConfigChange` 同步 | 254-577 |

呼叫點只有一處：`src/components/ScoreBoard/index.jsx:221-227`

```jsx
{drawOpen && (
  <DrawTeamsModal
    onClose={() => setDrawOpen(false)}
    drawConfig={isOnline ? room.roomData.drawConfig : null}
    onDrawConfigChange={isOnline ? room.updateDrawConfig : undefined}
  />
)}
```

問題：Landing 要開一個「獨立入口」進同一套抽籤流程，但完全不碰 Room/Firebase、每次進入都是全新設定（不記憶群組）。現有元件把畫面渲染跟「是否持久化」寫在同一個檔案裡，沒辦法乾淨地被兩個入口共用。

### 新架構

搬出 `ScoreBoard/`，獨立成 `src/components/DrawTeams/`：

```
src/components/DrawTeams/
  drawEngine.js         純函式：TEAM_KEYS, TEAM_COLORS, MIN/MAX_GROUP_SIZE, BACK_EMOJIS,
                         shuffle, declusteredShuffle, withBackEmoji, computeQuotas,
                         apportionFemale, canPackGroups, validateSetup, assignScorers, buildLots
                         （對應原檔案第 1-252 行，原樣搬移，不改邏輯）
  GenderCount.jsx        顯示元件（原第 62-67 行，順手修正 Part 2 / 項目 2 的對齊問題）
  useDrawTeams.js         共用 state + handler 的 hook
                         簽名：useDrawTeams({ initialConfig, onConfigChange } = {})
                         回傳：phase, maleTotal/femaleTotal, customQuota, teamSizes, groups,
                         addingGroup 及其表單欄位, validation, totalPeople,
                         fixedLots/groupLots/maleLots/femaleLots, 以及所有 handler
                         （原第 254-355 行的 state/effect/handler 邏輯搬進來，不寫死 Room 耦合，
                         onConfigChange 是否存在由呼叫端決定）
  DrawSetupForm.jsx        setup 階段畫面（原第 381-511 行），props: { draw, onCancel }
  DrawResultBoard.jsx      draw 階段畫面（原第 513-570 行），props: { draw, onClose }
  DrawTeamsModal.jsx       房間內用：overlay/settings-inner 外殼，接 room.drawConfig /
                         room.updateDrawConfig，關閉 = onClose（收合 modal 回計分板）
  DrawTeamsStandalone.jsx  Landing 獨立入口用：全螢幕頁面外殼，不傳 onConfigChange
                         （不讀不寫任何 storage，每次掛載都是預設值），關閉 = onExit（回 Landing）
```

`src/components/ScoreBoard/DrawTeamsModal.jsx` 刪除；`ScoreBoard/index.jsx:9` 的 import 改成 `../DrawTeams/DrawTeamsModal`。

---

## Part 2：5 項 UI 修正

| # | 問題 | 檔案 / 現況 | 修法 |
|---|---|---|---|
| 1 | 抽籤人數設定，男女中間要有 `/` 分隔 | `DrawSetupForm`（原 `DrawTeamsModal.jsx:383-400`）`.draw-gender-row` 內兩個 `.draw-total-row` 並排 | 在兩個 row 中間插入 `<span className="draw-gender-divider">/</span>`，新增對應 CSS |
| 2 | 群組抽籤卡的 ♂/♀ 沒對齊，符號被裁到只剩上半 | `GenderCount`（原 62-67 行）+ `style.css:1166-1169`（`.draw-gender-symbol` 靠 `vertical-align:-0.05em` 硬調）| ♂/♀ 是 Unicode 符號，字型本身的行高比數字高很多，vertical-align 是猜數值、不同容器（`draw-lot-size` 極小的 64px 籤卡 / `draw-quota-badge-sub`）猜的值不會通用。改用 `display:inline-flex; align-items:center` 讓瀏覽器依 flex 對齊而非字型基線計算，不受字型行高影響。改完會啟動 dev server 實機比對，不只憑改完的 CSS 就結案 |
| 3 | 自訂各隊人數時，加減按鈕出現會擠壓文字換行；按鈕與底框不要 padding | `DrawSetupForm`（原 407-422 行）+ `style.css:1205-1244`（`.draw-quota-badge` 有 `padding:6px 4px`） | `.draw-quota-badge` 的 `padding` 改 `0`（`.draw-quota-badge-btn` 本身已經是 `padding:0`，不用改）；`.draw-quota-badge-main`/`-sub` 加 `white-space:nowrap` 爭取寬度 |
| 4 | 新增群組表單開著、還沒按「加入」時，不該讓人按「開始抽籤」 | `DrawSetupForm`（原 506-508 行）目前 disabled 只看 `!validation.ok` | disabled 條件加上 `draw.addingGroup` |
| 5 | 翻牌抽籤畫面要有關閉整個視窗的按鈕 | `DrawResultBoard`（原 513-570 行）目前只有「回設定」「重新抽籤」，沒有真正離開的路徑 | 右上角圓形按鈕，比照 `RoomCodeModal.jsx` 的 `.code-modal-ring-btn`（用既有 `Icon name="close"`），新增 `.draw-close-btn` CSS；`.draw-inner` 補上 `position: relative` 讓按鈕可以絕對定位在卡片右上角。只在 `phase === 'draw'` 顯示（setup 階段已經有「取消」按鈕，不重複） |

---

## Part 3：Landing 重新設計 + 獨立入口

已確認版型：「快速開始」與「抽籤分隊」改成同排兩個等重按鈕（都是「不需要房間」的功能）。

```
      VolleyScore

  ┌──────────┐┌──────────┐
  │ 建立房間  ││ 加入房間  │
  └──────────┘└──────────┘

─────────── / ───────────

  ┌──────────┐┌──────────┐
  │ 快速開始  ││🎲抽籤分隊 │
  └──────────┘└──────────┘
```

改動：

- `Landing.jsx`：`landing-body` 第二個 `landing-group`（現在只有「快速開始」一顆按鈕，第 121-128 行）改成跟第一組一樣用 `landing-actions` 包兩顆按鈕；新增 `onOpenDraw` prop 與對應按鈕，樣式新增 `.landing-btn--draw`
- `App.jsx`：新增 `mode === 'draw'` 分支，沿用現有「無 router、靠 `mode` state 切換頁面」慣例（不引入 react-router），渲染 `<DrawTeamsStandalone onExit={() => setMode('landing')} />`

---

## Part 4：房間連線持久化（URL 同步）

### 現況問題

`App.jsx` 的 `mode`/`entry`、`useRoom.js` 的 `roomCode`/`roomData` 全部是純記憶體 state，沒有任何 persistence（連 `sessionStorage` 都沒有，那個只用在離線模式的比分）。只要整個頁面重新載入，房間連線就完全消失，得回 Landing 重新輸入 4 位房間碼。

### 設計：`?room=XXXX` query string

- **寫入時機**：`App.jsx` 的 `handleCreateRoom` / `handleJoinRoom` 成功後，呼叫 `history.replaceState(null, '', `?room=${code}`)`
- **還原時機**：App 掛載時讀 `new URLSearchParams(window.location.search).get('room')`；有值就直接呼叫 `room.joinRoom(code)`，成功則 `setEntry('join')`、`setMode('scoreboard')`；失敗（房間碼過期/不存在）**靜默清除** query string、留在 Landing，不彈錯誤訊息（避免使用者一打開網頁就被過期連結嚇到）。還原過程用既有 `LoadingOverlay` 顯示，不要讓畫面先閃一下 Landing 再跳轉
- **清除時機**：`ScoreBoard`/`index.jsx` 的 `handleLeave`（離開房間回 Landing）時，`App.jsx` 對應的 `onLeave` 也要把 query string 清掉（`history.replaceState(null, '', window.location.pathname)`）
- **不動 `useRoom.js` 的對外介面（新增一個欄位）**：`createRoom`/`joinRoom` 行為不變，URL 同步全部放在 `App.jsx` 這層，維持 hook 只管 Firebase 讀寫的單一職責

### 防呆：房間在使用中被移除（新增）

**現況問題**：`useRoom.js:43-49` 的 `onValue` 監聽目前是「房間存在才更新 `roomData`，不存在就什麼都不做」：

```js
const unsubscribe = onValue(ref(db, `rooms/${roomCode}`), snapshot => {
  if (snapshot.exists()) updateRoomData(snapshot.val())
})
```

如果房間在使用中被從 Realtime DB 移除（不管什麼原因），畫面會卡在最後一次收到的舊資料，使用者不會知道房間已經沒了，繼續操作也不會有效果。這跟上面「還原時房間碼已失效」是不同情境（還原失敗是進場前就擋掉，這裡是進場後房間中途消失），需要分開處理：

**⚠️ 實際實作跟原計劃不同**：原計劃是 `useRoom.js` 內部維護 `roomMissing` state，`App.jsx` 另外開一個 `useEffect` 監聽這個 state 來導回 Landing。實作時 `npm run lint` 擋下來——專案的 eslint 規則 `react-hooks/set-state-in-effect` 不允許在 effect body 裡直接同步呼叫 setState（只允許在 subscription 的 callback 裡呼叫），而「監聽 `roomMissing` 變成 `true` 就 `setMode('landing')`」正好是這種被禁止的寫法。改成 **callback 模式**：

- **`useRoom.js`**：不維護 `roomMissing` state，改成接受一個 `onRoomMissing` callback 參數：`export const useRoom = (onRoomMissing) => {...}`。既有的 `onValue` 訂閱裡，`else` 分支從 `setRoomMissing(true)` 改成呼叫 `onRoomMissing?.()`——這個呼叫本來就在合法的 subscription callback 裡，不會被規則擋
- **`App.jsx`**：`const handleRoomMissing = useCallback(() => { window.history.replaceState(...); setEntry(null); setMode('landing'); setRoomGoneNotice(true) }, [])`，`const room = useRoom(handleRoomMissing)`。這裡的 setState 呼叫是在一般函式（callback）裡，不是在 effect body 裡，同樣合法。`roomGoneNotice` 改成 `App.jsx` 自己的 state（不再是 `room.roomMissing`），並在 `handleCreateRoom`/`handleJoinRoom`/`handleLeaveRoom` 開頭重置為 `false`，避免舊的提示殘留到下一次成功建立/加入房間
- **`Landing.jsx`**：`roomGoneNotice` prop 改成用 `useState(() => roomGoneNotice)` 當初始值（掛載時就已經是最新值，不需要用 effect 去追蹤 prop 從 false 變 true），再用一個只依賴 `roomGoneToast` 自己的 effect 處理 `setTimeout` 自動消失
- 適用範圍：不管是線上房間被誰刪除、或未來加上房間過期自動清理機制，都會走這條路徑被自動導回 Landing，不會卡在無效房間畫面

### 明確不在本次範圍

- **QR code 動態產圖**：現在 `RoomCodeModal` 用的是一張固定的靜態圖片（`src/assets/qrcode.jpg`，連到首頁，不含房間碼），不是「這個房間專屬」的 QR。要做到「掃碼直接帶房間碼進房」需要另外導入 QR code 產生器（新依賴），是一個獨立的功能決策，這次只確保「網址列有房間碼」這件事本身能用（可以手動複製網址分享），暫不動 QR 圖片
- **瀏覽器上一頁/下一頁語意**：只用 `replaceState`（不用 `pushState`），不處理 `popstate` 事件。也就是離開房間、切換 landing/draw 頁面時不會產生瀏覽器歷史記錄，「上一頁」不會有意義的返回行為。這次的目標單純是「reload 不丟房間連線」+「網址可分享」

---

## 驗證階段抓到的問題（實作完成後才發現）

寫完初版後用瀏覽器實機檢查，另外抓到 4 個沒在原計劃裡的小問題，一併修掉：

| 問題 | 原因 | 修法 |
|---|---|---|
| Standalone 抽籤頁的標題、人數字全部變黑色 | `DrawTeamsStandalone.jsx` 的卡片 `div` 只給了 `draw-standalone-inner draw-inner` class，沒有房間版有的 `settings-inner`，吃不到 `.settings-inner { color: var(--text) }` 跟 `.settings-inner h3 { color: var(--accent) }` | `className` 補上 `settings-inner` |
| 「開始抽籤」「加入」按鈕 disabled 時看起來跟平常一樣、感覺沒生效 | 專案只有 `.landing-btn:disabled` 有樣式，`.btn`（`.settings-apply` 這類按鈕的基礎 class）完全沒有 `:disabled` 樣式規則——按鈕其實真的點不動，只是外觀沒變化 | `style.css` 補上通用的 `.btn:disabled { opacity: 0.4; cursor: not-allowed; }` |
| 翻牌畫面右上角關閉 X 被卡片邊緣裁掉一角 | `.draw-close-btn` 用負值 `top:-12px; right:-12px` 探出卡片邊界，但卡片本身（`.draw-inner`）有 `overflow-y: auto`（要給長內容捲動用），探出去的部分被裁掉 | 新增 `.draw-card-wrap`（`position:relative`、不設 overflow）包住「關閉按鈕 + 卡片」，按鈕改成卡片的兄弟節點而不是子節點，`DrawTeamsModal.jsx`、`DrawTeamsStandalone.jsx` 都要改 |
| `roomMissing` 用 state + 額外 effect 監聽，被 eslint 擋下 | 見上面 Part 4 的說明 | 改成 `useRoom(onRoomMissing)` callback 模式 |

---

## 檔案改動清單

| 檔案 | 動作 |
|---|---|
| `src/components/DrawTeams/drawEngine.js` | 新增 |
| `src/components/DrawTeams/GenderCount.jsx` | 新增 |
| `src/components/DrawTeams/useDrawTeams.js` | 新增 |
| `src/components/DrawTeams/DrawSetupForm.jsx` | 新增 |
| `src/components/DrawTeams/DrawResultBoard.jsx` | 新增 |
| `src/components/DrawTeams/DrawTeamsModal.jsx` | 新增（取代下面那個） |
| `src/components/DrawTeams/DrawTeamsStandalone.jsx` | 新增 |
| `src/components/ScoreBoard/DrawTeamsModal.jsx` | 刪除 |
| `src/components/ScoreBoard/index.jsx` | 改 import 路徑 |
| `src/components/Landing.jsx` | 新增「抽籤分隊」按鈕與版面調整；新增 `roomGoneNotice` Toast 顯示 |
| `src/App.jsx` | 新增 `mode: 'draw'`；新增 URL 同步（讀取/寫入/清除 `?room=`）與掛載時自動還原；`handleRoomMissing` callback（`useCallback`）傳給 `useRoom`，收到通知就導回 Landing 並設 `roomGoneNotice` |
| `src/hooks/useRoom.js` | 改成 `useRoom(onRoomMissing)`：`onValue` 偵測房間消失時呼叫 `onRoomMissing?.()`（不再自己維護 `roomMissing` state） |
| `src/style.css` | 新增/調整：`.draw-gender-divider`、`.draw-gender-symbol`/`.draw-gender-count`、`.draw-quota-badge` padding、`.draw-card-wrap`/`.draw-close-btn`、`.draw-inner`、`.landing-btn--draw`、`.draw-standalone`（Standalone 頁面外殼）、通用 `.btn:disabled` |

---

## 分階段實作清單

1. [x] `drawEngine.js` / `GenderCount.jsx` / `useDrawTeams.js` 抽出，邏輯不變
2. [x] `DrawSetupForm.jsx`（含項目 1、3、4 修正）/ `DrawResultBoard.jsx`（含項目 5 修正）
3. [x] `DrawTeamsModal.jsx`（房間版）/ `DrawTeamsStandalone.jsx`（獨立版），刪除舊檔、改 `ScoreBoard/index.jsx` import
4. [x] `style.css`：項目 2 對齊修正 + 上述所有新 class
5. [x] `Landing.jsx` + `App.jsx`：獨立入口按鈕與 `mode: 'draw'`
6. [x] `App.jsx`：`?room=` URL 同步（寫入/還原/清除）
7. [x] `useRoom.js` + `App.jsx` + `Landing.jsx`：`roomMissing` 防呆與導回 Landing 提示（改成 callback 模式，見上方說明）
8. [x] `npm run lint`、`npm run build`（皆通過；`app.js` 根目錄那 6 個既有錯誤跟本次改動無關，未被引用）
9. [x] 瀏覽器實機驗證，抓到並修掉 4 個問題（見上方「驗證階段抓到的問題」）：
   - Standalone 抽籤頁文字變黑 → 補 `settings-inner` class
   - disabled 按鈕看不出來 → 補通用 `.btn:disabled` 樣式
   - 翻牌畫面關閉按鈕被裁掉 → 新增 `.draw-card-wrap` 外層
   - `roomMissing` 效果模式改成 callback（lint 規則要求）
10. [ ] 使用者自行在瀏覽器複測：房間內抽籤 modal 全流程、Landing 獨立入口抽籤、URL 還原/清除、手動到 Firebase Console 刪除使用中房間節點確認導回 Landing
