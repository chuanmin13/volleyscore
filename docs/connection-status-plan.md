# 房間模式斷線提示實作計劃

## 問題背景

房間模式下，顯示端與計分端各自獨立連線到 Firebase Realtime Database，透過 `onValue` 監聽
`rooms/{code}` 做即時同步。目前完全沒有連線狀態追蹤機制，任何一端斷線後，另一端無從得知。

實際案例：顯示端網路斷線時不會有任何提示，導致計分端計分到一半，才發現顯示端的比分畫面
沒有跟著更新，兩端分數已經對不起來。

---

## 現況架構（相關程式碼）

| 項目 | 檔案 | 說明 |
|------|------|------|
| 連線技術 | `src/firebase.js` | Firebase Realtime Database |
| 房間邏輯 | `src/hooks/useRoom.js`（109 行） | `createRoom` / `joinRoom` / `onValue` 監聽 `rooms/{code}` |
| 顯示/計分共用 UI | `src/components/ScoreBoard/index.jsx` | 用 `canScore` 狀態切換「計分中」/「純顯示」，兩端可各自切換 |
| 連線狀態追蹤 | 無 | 沒有 `.info/connected`、`onDisconnect`、心跳偵測 |
| 連線 UI 提示 | 無 | 只有房間碼 badge，代表「曾經連線成功」，無法反映即時斷線 |

---

## 解法：Firebase Presence（在線狀態）機制

採用 Firebase RTDB 內建的 `.info/connected` 特殊路徑 + `onDisconnect()`：
斷線偵測由**伺服器端**判定（連線真的中斷才觸發，而非仰賴前端心跳），
就算裝置直接斷網、瀏覽器被關掉，也能正確清除 presence 資料，可靠度高。

### 行為規則

1. **雙向對稱**：顯示端、計分端都套用同一套邏輯，不分角色（因為 `canScore` 可隨時互換）。
2. **自己斷線** → 顯示「網路已斷線，重新連線中…」。
3. **對方斷線** → 顯示「對方裝置已離線，畫面可能未同步」。
4. **對方尚未加入房間**（例如顯示端剛建立房間、計分端還沒掃碼加入）→ **不提示**。
   只有「對方曾經在線、後來斷線」才會觸發提示（用 `hasPeerConnectedOnce` 旗標紀錄，
   避免誤判成異常）。

### 資料結構新增

```
rooms/
  {4碼roomCode}/
    presence/
      {clientId}: true   // 每個連線中的裝置各自佔一個 key，斷線時由 onDisconnect 自動移除
```

---

## 檔案異動清單

### 1. `src/hooks/useRoom.js`

新增邏輯，不更動既有對外 API（`addScore` / `subScore` / `updateTeams` 等維持不變）。

- 新增回傳值：
  - `connected`：自己是否連上 Firebase
  - `peerConnected`：對方是否在線（對方未曾連線過時預設 `true`，不觸發提示）
- 新增兩個 `useEffect`（依賴 `roomCode`）：
  - **本機連線 + presence 註冊**：監聽 `.info/connected`；連線成功時寫入
    `rooms/{code}/presence/{clientId} = true`，並註冊 `onDisconnect().remove()`。
  - **對方在線狀態**：監聽 `rooms/{code}/presence`，排除自己的 `clientId` 後，
    判斷是否還有其他裝置在線；一旦偵測到對方在線過，記錄 `hasPeerConnectedOnce = true`。

範例片段：

```js
import { ref, set, get, update, onValue, onDisconnect, remove } from 'firebase/database'

const clientIdRef = useRef(Math.random().toString(36).slice(2))
const hasPeerConnectedRef = useRef(false)
const [connected, setConnected] = useState(true)
const [peerConnected, setPeerConnected] = useState(true)

// 本機連線狀態 + presence 註冊
useEffect(() => {
  if (!roomCode) return
  const presenceRef = ref(db, `rooms/${roomCode}/presence/${clientIdRef.current}`)
  const unsubscribe = onValue(ref(db, '.info/connected'), snapshot => {
    const isConnected = snapshot.val() === true
    setConnected(isConnected)
    if (isConnected) {
      onDisconnect(presenceRef).remove()
      set(presenceRef, true)
    }
  })
  return () => { unsubscribe(); remove(presenceRef) }
}, [roomCode])

// 對方在線狀態
useEffect(() => {
  if (!roomCode) return
  const unsubscribe = onValue(ref(db, `rooms/${roomCode}/presence`), snapshot => {
    const presence = snapshot.val() || {}
    const peerOnline = Object.keys(presence).some(id => id !== clientIdRef.current)
    if (peerOnline) hasPeerConnectedRef.current = true
    setPeerConnected(hasPeerConnectedRef.current ? peerOnline : true)
  })
  return () => unsubscribe()
}, [roomCode])
```

### 2. `src/components/ScoreBoard/index.jsx`

- 讀取 `room.connected` / `room.peerConnected`（離線模式 `isOnline === false` 時一律視為
  `true`，不顯示提示）。
- 在 `<header className="page-header">` 下方加入提示 bar：
  - 自己斷線（`!connected`）→ 紅色「網路已斷線，重新連線中…」
  - 自己連線正常但對方離線（`connected && !peerConnected`）→ 黃色
    「對方裝置已離線，畫面可能未同步」

### 3. `src/style.css`

新增 `.connection-banner`（含 `--error` / `--warning` 變化）樣式，
參考現有 `.pwa-banner`（`src/style.css:1526`）的 fixed bar 寫法，
定位在 `.page-header`（min-height 44px）下方。

### 4. `src/components/Icon.jsx`（可選）

新增一個簡單的警示三角形 icon（stroke 風格，與現有 icon 一致），供 banner 使用，
避免使用 emoji。

---

## 風險與範圍

- 不影響既有計分、房間建立/加入、資料同步邏輯，純新增功能。
- 新增的 `presence` 節點與既有 `score` / `teams` / `records` 互不干擾。
- 若 Firebase RTDB 安全規則對 `rooms/{code}` 下路徑為開放讀寫（現況 `score` / `teams`
  等子路徑皆可直接讀寫），`presence` 子路徑預期沿用相同規則，無需額外調整；
  若日後改為規則限制寫入，需一併開放 `presence` 路徑。
- 可獨立回退：拿掉 banner 渲染與新增的兩個 `useEffect` 即可還原。
