# Firebase 遠端遙控實作計劃（React + Vite）

## 功能目標

- 任意裝置開啟網頁作為**顯示端**（大螢幕，唯讀）
- 另一裝置作為**控制端**（操控比分、設定隊伍）
- 雙端透過 Firebase Realtime Database 即時同步
- 以**房間碼**（4 碼）配對顯示端與控制端

---

## 技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| UI 框架 | React + Vite | 狀態管理與模式切換更清晰；component 結構易於維護 |
| Firebase SDK | npm modular 版（v10） | tree-shaking 體積更小；與 ES module 自然整合 |
| PWA | vite-plugin-pwa | 取代手寫 sw.js，自動生成 Service Worker，排除 Firebase 請求 |
| 路由 | useState 條件渲染 | 三個模式不需要真正的 URL 路由，React Router 過重 |
| 樣式 | 沿用現有 style.css | 不引入 CSS-in-JS，維持原有視覺風格 |
| 螢幕方向 | Landscape-first RWD | 主要設計以橫式為主；manifest 設 `orientation: landscape`；portrait 以 media query 自然降級，不強制旋轉 |

---

## Firebase 資料結構（不變）

```
rooms/
  {4碼roomCode}/
    score:
      host: 0
      guest: 0
    teams:
      hostName: ""
      guestName: ""
      hostColor: "#cd2424"
      guestColor: "#244ecd"
    records: []        // 最多 5 局，格式 [{host, guest}, ...]
    updatedAt: 0       // timestamp，用於過期清理
```

### 房間碼規則
- 4 碼大寫英數字（e.g. `A1B2`）
- 由顯示端建立時隨機產生
- 超過 24 小時無更新的房間可手動或用 Firebase Function 清除

---

## 專案結構

```
scoreCounter/
├── src/
│   ├── firebase.js          # Firebase 初始化（initializeApp、getDatabase）
│   ├── useRoom.js           # 自訂 hook：房間建立、加入、Firebase 監聽
│   ├── App.jsx              # 模式路由（landing / display / controller）
│   ├── components/
│   │   ├── Landing.jsx      # 起始選擇畫面
│   │   ├── Display.jsx      # 顯示端（大螢幕）
│   │   └── Controller.jsx   # 控制端（操控比分）
│   ├── main.jsx
│   └── style.css            # 沿用現有 CSS，新增 display mode 樣式
├── index.html               # 只保留 <div id="root">
├── vite.config.js
├── manifest.json            # 移入 vite-plugin-pwa 設定或保留靜態檔
└── package.json
```

---

## 頁面模式設計

> 所有畫面以 **landscape（橫式）為主要設計**。
> Portrait 透過 `@media (orientation: portrait)` 自然降級（堆疊排列），不強制旋轉。
> `manifest.json` 設 `"orientation": "landscape"` 作為 PWA 安裝後的啟動提示。

### Landing（橫式主設計）

```
┌──────────────────────────────────────────┐
│               ScoreCounter               │
│                                          │
│   ┌──────────────┐  ┌──────────────┐    │
│   │  建立房間     │  │  加入房間    │    │
│   │  （顯示端）   │  │  （控制端）  │    │
│   └──────────────┘  └──────────────┘    │
│                                          │
│            ┌──────────────┐              │
│            │  單機模式    │              │
│            └──────────────┘              │
└──────────────────────────────────────────┘
```

Portrait fallback：三個按鈕改為垂直堆疊。

---

### Display（顯示端，橫式主設計）

```
┌──────────────────────────────────────────┐
│ A1B2                          局數紀錄 ▼ │  ← header bar
├────────────────────┬─────────────────────┤
│                    │                     │
│      Team A        │       Team B        │
│                    │                     │
│        21          │         18          │
│                    │                     │
└────────────────────┴─────────────────────┘

展開後（records drawer 從底部滑出）：
┌──────────────────────────────────────────┐
│ A1B2                          局數紀錄 ▲ │
├────────────────────┬─────────────────────┤
│      Team A        │       Team B        │
│        21          │         18          │
├────────────────────┴─────────────────────┤
│  Set 1: 21:15   Set 2: 18:21            │  ← 橫排 set 紀錄
└──────────────────────────────────────────┘
```
- 兩隊左右分割，比分字體佔滿高度（`clamp` 動態字級）
- Header bar 固定高度，顯示房間碼（左）與 records toggle（右）
- Records drawer 底部展開，橫式時以橫排顯示 set 紀錄
- 即時監聽 Firebase，無操控按鈕

Portrait fallback：左右分割改為上下分割，set 紀錄改縱列。

---

### Controller（控制端，橫式主設計）

```
┌──────────────────────────────────────────┐
│ 房間：A1B2                          [≡]   │  ← header（設定入口）
├──────────────────────┬───────────────────┤
│                      │                   │
│  ╔════════════════╗  │  ╔═════════════╗  │
│  ║      21        ║  │  ║     18      ║  │  ← 點擊整塊 = +1
│  ╚════════════════╝  │  ╚═════════════╝  │
│        [-]           │        [-]        │  ← 減分按鈕獨立
│                      │                   │
├──────────────────────┴───────────────────┤
│          [Save 紀錄]    [Reset 歸零]      │
└──────────────────────────────────────────┘
```
- 數字區塊整塊可點擊（`onClick` = +1），沿用現有 app.js 的互動模式，無加號圖示
- 減分按鈕獨立置於數字區塊下方
- 底部工具列：Save / Reset
- 右上角 `[≡]` 開啟設定 drawer（隊名、顏色）

Portrait fallback：兩隊改為上下排列，操作區各自跟隨。

---

## 實作步驟

### Step 1 — Firebase 專案設定（手動，約 10 分鐘）

1. 前往 [Firebase Console](https://console.firebase.google.com/) 建立新專案
2. 建立 **Realtime Database**，地區選 `asia-east1`
3. 安全規則暫設為測試模式：

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

4. 專案設定 → 新增 Web App → 取得 `firebaseConfig`

---

### Step 2 — 專案初始化

```bash
# 在現有目錄原地建立 Vite 專案（或新目錄再搬移）
npm create vite@latest . -- --template react
npm install
npm install firebase
npm install -D vite-plugin-pwa
```

將現有 `style.css` 搬入 `src/`，刪除 Vite 預設的 `App.css`、`assets/`。

---

### Step 3 — Firebase 初始化（`src/firebase.js`）

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: '...',
  databaseURL: 'https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app',
  // ...
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

---

### Step 4 — 自訂 Hook（`src/useRoom.js`）

封裝所有 Firebase 操作，讓 component 不直接碰 Firebase API：

```javascript
import { useState, useEffect } from 'react';
import { ref, set, update, onValue } from 'firebase/database';
import { db } from './firebase';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

const initialRoomState = {
  score: { red: 0, blue: 0 },
  teams: { redName: '', blueName: '', redColor: '#cd2424', blueColor: '#244ecd' },
  records: [],
};

export const useRoom = () => {
  const [roomCode, setRoomCode] = useState(null);
  const [roomData, setRoomData] = useState(initialRoomState);

  // 顯示端：建立房間並監聽
  const createRoom = async () => {
    const code = generateRoomCode();
    const roomRef = ref(db, `rooms/${code}`);
    await set(roomRef, { ...initialRoomState, updatedAt: Date.now() });
    setRoomCode(code);
    return code;
  };

  // 控制端：驗證房間碼並加入
  const joinRoom = async (code) => {
    const { get } = await import('firebase/database');
    const roomRef = ref(db, `rooms/${code}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) throw new Error('房間碼不存在');
    setRoomCode(code);
    setRoomData(snapshot.val());
  };

  // 監聽 Firebase 變更
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) setRoomData(snapshot.val());
    });
    return () => unsubscribe(); // cleanup
  }, [roomCode]);

  // 比分更新
  const updateScore = (scorePartial) => {
    if (!roomCode) return;
    update(ref(db, `rooms/${roomCode}`), {
      score: { ...roomData.score, ...scorePartial },
      updatedAt: Date.now(),
    });
  };

  // 隊伍設定更新
  const updateTeams = (teamsPartial) => {
    if (!roomCode) return;
    update(ref(db, `rooms/${roomCode}`), {
      teams: { ...roomData.teams, ...teamsPartial },
      updatedAt: Date.now(),
    });
  };

  // 紀錄比分
  const saveRecord = () => {
    if (!roomCode || roomData.records.length >= 5) return;
    const newRecords = [...roomData.records, roomData.score];
    update(ref(db, `rooms/${roomCode}`), { records: newRecords });
  };

  const deleteRecord = (index) => {
    if (!roomCode) return;
    const newRecords = roomData.records.filter((_, i) => i !== index);
    update(ref(db, `rooms/${roomCode}`), { records: newRecords });
  };

  return { roomCode, roomData, createRoom, joinRoom, updateScore, updateTeams, saveRecord, deleteRecord };
};
```

---

### Step 5 — 模式路由（`src/App.jsx`）

```jsx
import { useState } from 'react';
import { useRoom } from './useRoom';
import Landing from './components/Landing';
import Display from './components/Display';
import Controller from './components/Controller';

export default function App() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'display' | 'controller' | 'offline'
  const room = useRoom();

  const handleCreateRoom = async () => {
    await room.createRoom();
    setMode('display');
  };

  const handleJoinRoom = async (code) => {
    await room.joinRoom(code);
    setMode('controller');
  };

  if (mode === 'landing') return <Landing onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onOffline={() => setMode('offline')} />;
  if (mode === 'display') return <Display room={room} />;
  if (mode === 'controller') return <Controller room={room} />;
  if (mode === 'offline') return <Controller room={null} />; // 單機模式沿用 sessionStorage
}
```

---

### Step 6 — Display Component（`src/components/Display.jsx`）

```jsx
import { useState } from 'react';

export default function Display({ room }) {
  const { roomCode, roomData } = room;
  const { score, teams, records } = roomData;
  const [recordsOpen, setRecordsOpen] = useState(false);

  return (
    <div className="container display-mode">
      <div className="room-badge">房間碼：{roomCode}</div>
      <div className="scores-wrap">
        <div className="score-card" style={{ backgroundColor: teams.redColor }}>
          <div className="team-name">{teams.redName}</div>
          <div className="score">{score.red}</div>
        </div>
        <div className="score-card" style={{ backgroundColor: teams.blueColor }}>
          <div className="team-name">{teams.blueName}</div>
          <div className="score">{score.blue}</div>
        </div>
      </div>

      <div className="records-drawer">
        <button
          className="records-toggle"
          onClick={() => setRecordsOpen(o => !o)}
        >
          局數紀錄 {recordsOpen ? '▲' : '▼'}
        </button>
        <div className={`records-body ${recordsOpen ? 'open' : ''}`}>
          {records.map((r, i) => (
            <div key={i} className="record-row">Set {i + 1}: {r.red} : {r.blue}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Step 6-b — Display Mode CSS（`src/style.css` 新增）

```css
/* 顯示端大字體 */
.display-mode .score {
  font-size: clamp(120px, 20vw, 240px);
}

.display-mode .team-name {
  font-size: clamp(32px, 5vw, 64px);
}

.room-badge {
  text-align: center;
  font-size: 1.2rem;
  padding: 8px;
  background: rgba(0, 0, 0, 0.1);
  letter-spacing: 4px;
}

/* 局數紀錄收拉 */
.records-toggle {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.records-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.records-body.open {
  max-height: 300px; /* 足夠容納 5 局 */
}

.record-row {
  padding: 6px 12px;
  text-align: center;
}

/* Portrait RWD fallback */
@media (orientation: portrait) {
  /* Display：左右分割 → 上下分割 */
  .display-mode .scores-wrap {
    flex-direction: column;
  }

  /* Display：set 紀錄改縱列 */
  .records-body .record-row {
    display: block;
  }

  /* Controller：左右並排 → 上下堆疊 */
  .controller .scores-wrap {
    flex-direction: column;
  }
}
```

---

### Step 7 — Controller Component（`src/components/Controller.jsx`）

現有 `app.js` 的比分邏輯移植到此 component，差異：
- `state.red++` → `room.updateScore({ red: roomData.score.red + 1 })`
- `sessionStorage.setItem()` → 僅在 `mode === 'offline'` 時使用
- `innerHTML` 操作 → 直接 JSX render

---

### Step 8 — PWA 設定（`vite.config.js`）

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'VolleyScore',
        short_name: 'VolleyScore',
        theme_color: '#ffffff',
        orientation: 'landscape',   // PWA 安裝後啟動時的預設方向提示
        icons: [{ src: '/scoreCalc.png', sizes: '128x128', type: 'image/png' }],
      },
      workbox: {
        // 排除 Firebase 請求，不進快取
        navigateFallbackDenylist: [/^\/rooms/],
        runtimeCaching: [{
          urlPattern: /^https:\/\/.*\.firebasedatabase\.app\//,
          handler: 'NetworkOnly',
        }],
      },
    }),
  ],
});
```

---

## 與舊計劃的差異對照

| 項目 | 舊計劃（Vanilla JS） | 新計劃（React） |
|------|-------------------|--------------| 
| Firebase 引入 | CDN compat script tag | npm modular import |
| 狀態管理 | 全域 `state` 物件 + 手動 DOM | `useState` + JSX 渲染 |
| Firebase 監聽 cleanup | 需手動管理 | `useEffect` return 自動 cleanup |
| 模式切換 | CSS class 顯示/隱藏 | component 條件渲染 |
| PWA Service Worker | 手寫 sw.js | vite-plugin-pwa 自動生成 |
| 程式碼組織 | 單一 app.js | 多 component + custom hook |
| Firebase 資料結構 | 不變 | 不變 |
| 功能目標 | 不變 | 不變 |

---

## 注意事項與風險

| 項目 | 說明 |
|------|------|
| Firebase 安全規則 | 初期用測試模式；正式使用前依下方 Step 9 設定 |
| 房間碼碰撞 | 4 碼 36 進位有 160 萬組合，同時在線房間極少，可忽略；建立時可加碰撞檢查 |
| 離線處理 | Firebase SDK 內建 queue；控制端斷線後恢復連線自動同步 |
| 單機模式 | Controller 傳入 `room={null}` 時，退回 sessionStorage 邏輯 |
| Firebase 免費額度 | Spark plan：10 GB/月傳輸，個人使用完全足夠 |

---

## 正式部署前安全性設定

### Step 9-a — Vite base 路徑（GitHub Pages 必要）

GitHub Pages 部署在子路徑 `/volleyscore/`，需在 `vite.config.js` 加上 `base`：

```javascript
export default defineConfig({
  base: '/volleyscore/',   // ← 加這行
  plugins: [ ... ],
})
```

> 若之後改用自訂網域（根路徑），移除此行即可。

---

### Step 9-b — Firebase Realtime Database 規則

Firebase Console → Realtime Database → 規則，貼上以下內容後 **Publish**：

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "rooms": {
      "$roomCode": {
        ".validate": "$roomCode.matches(/^[A-Z0-9]{4}$/)",
        ".read": true,
        ".write": true,
        "score": {
          "host":      { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 99" },
          "guest":     { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 99" },
          "updatedAt": { ".validate": "newData.isNumber()" }
        },
        "teams": {
          "hostName":   { ".validate": "newData.isString() && newData.val().length <= 50" },
          "guestName":  { ".validate": "newData.isString() && newData.val().length <= 50" },
          "hostColor":  { ".validate": "newData.isString() && newData.val().length <= 7" },
          "guestColor": { ".validate": "newData.isString() && newData.val().length <= 7" }
        },
        "records": {
          "$index": {
            "host":  { ".validate": "newData.isNumber() && newData.val() >= 0" },
            "guest": { ".validate": "newData.isNumber() && newData.val() >= 0" }
          }
        },
        "updatedAt": { ".validate": "newData.isNumber()" }
      }
    }
  }
}
```

效果：
- `rooms/` 以外的路徑完全拒絕讀寫
- 房間碼格式強制為 4 碼大寫英數字
- 比分限制 0–999，隊名限 50 字元，顏色限 7 字元

---

### Step 9-c — API Key 限制（部署後）

Firebase `apiKey` 在前端必然公開，透過 Google Cloud Console 限制它只能從指定網域使用：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. 找到 `volleyscore-a34a6` 專案的 Browser key → 點 **Edit**
3. **Application restrictions** → 選 **HTTP referrers (websites)**
4. 加入以下網址：
   ```
   https://chuanmin13.github.io/volleyscore/*
   https://chuanmin13.github.io/volleyscore/
   ```
   > 若未來改用自訂網域，改為 `https://yourdomain.com/*`
5. **API restrictions** → 選 **Restrict key** → 勾選 **Firebase Realtime Database API**
6. 儲存

效果：此 API Key 在其他網域呼叫會被 Google 拒絕。

---

### Step 9-d — 舊房間清理

目前房間資料永久留存。最簡單做法：每次比賽結束後，從 Firebase Console → Realtime Database 手動刪除 `rooms/` 節點下的資料。

> 若需自動清理（如超過 24 小時），需升級至 Blaze plan 使用 Firebase Functions scheduled job，個人使用手動即可。

---

### 優先順序

| 優先 | 步驟 | 時機 |
|------|------|------|
| 必做 | Step 9-a（Vite base） | 部署前 |
| 必做 | Step 9-b（Database 規則） | 部署前 |
| 建議 | Step 9-c（API Key 限制） | 部署後（需要網域才能填） |
| 可選 | Step 9-d（舊房間清理） | 使用後定期手動 |

---

## 開發順序建議

1. [x] Step 1：建立 Firebase 專案，取得 config
2. [x] Step 2：Vite + React 初始化，搬移 style.css
3. [x] Step 3：firebase.js 確認連線正常
4. [x] Step 4：實作 useRoom hook
5. [x] Step 5：App.jsx 模式路由 + Landing component
6. [x] Step 6：Display component + display mode CSS
7. [x] Step 7：Controller component
8. [x] Step 8：vite-plugin-pwa 設定
9. [x] Step 9-a：vite.config.js 加 base 路徑
10. [ ] Step 9-b：Firebase Database 規則 Publish
11. [ ] 整合測試：雙裝置驗證即時同步
12. [ ] Step 9-c：部署後設定 API Key HTTP referrer 限制
