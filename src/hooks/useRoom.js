import { useState, useEffect, useRef } from 'react'
import { ref, set, get, update, onValue, runTransaction, onDisconnect, remove } from 'firebase/database'
import { db } from '../firebase'

const generateRoomCode = () =>
  String(Math.floor(Math.random() * 9000) + 1000)

const initialRoomState = {
  score: { host: 0, guest: 0 },
  teams: { hostName: '', guestName: '', hostColor: '#f24c00', guestColor: '#244ecd' },
  records: [],
  drawConfig: { maleTotal: 18, femaleTotal: 0, customQuota: false, teamSizes: { A: 6, B: 6, C: 6 }, groups: [] },
}

const ROOM_TIMEOUT_MS = 6000
const MAX_CREATE_ATTEMPTS = 3
const TIMEOUT_MARK = '__timeout__'

// 幫任何 Promise 包一層逾時：弱網/離線時 Firebase 呼叫可能長時間不回應，
// 不加這層會讓上層 UI 永遠卡在 loading
const withTimeout = (promise, ms) => {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(TIMEOUT_MARK)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// onRoomMissing：房間在使用中被移除時呼叫，讓上層（App.jsx）決定要怎麼導回 Landing。
// 用 callback 而非內部 state + 額外 effect，因為 setState 只能在這個既有的
// onValue 訂閱 callback 裡直接呼叫，不能另外開一個 effect 去監聽衍生出來的 state
export const useRoom = onRoomMissing => {
  const [roomCode, setRoomCode] = useState(null)
  const [roomData, setRoomData] = useState(initialRoomState)
  const [connected, setConnected] = useState(true)
  const [peerConnected, setPeerConnected] = useState(true)

  // useState 的惰性初始化是 React 認可的「渲染期間執行一次性不純運算」寫法
  const [clientId] = useState(() => Math.random().toString(36).slice(2))
  const hasPeerConnectedRef = useRef(false)

  // 顯示端：建立房間。用 transaction 確保「該房號目前不存在才寫入」，
  // 就算兩台裝置幾乎同時抽中同一組房號也不會互相覆蓋，撞號就重抽
  const createRoom = async () => {
    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
      const code = generateRoomCode()
      let result
      try {
        result = await withTimeout(
          runTransaction(ref(db, `rooms/${code}`), current =>
            current === null ? { ...initialRoomState, updatedAt: Date.now() } : undefined
          ),
          ROOM_TIMEOUT_MS
        )
      } catch (e) {
        throw new Error(e.message === TIMEOUT_MARK ? '建立房間逾時，請檢查網路後再試' : '建立房間失敗，請稍後再試', { cause: e })
      }
      if (result.committed) {
        setRoomCode(code)
        return code
      }
    }
    throw new Error('建立房間失敗，請稍後再試')
  }

  // 控制端：驗證並加入房間；分開處理「逾時/連線問題」與「房間確實不存在」，
  // 才能給使用者看得懂的訊息，而不是原始的技術錯誤
  const joinRoom = async (code) => {
    let snapshot
    try {
      snapshot = await withTimeout(get(ref(db, `rooms/${code}`)), ROOM_TIMEOUT_MS)
    } catch (e) {
      throw new Error(e.message === TIMEOUT_MARK ? '連線逾時，請檢查網路後再試' : '連線失敗，請檢查網路後再試', { cause: e })
    }
    if (!snapshot.exists()) throw new Error('房間碼不存在')
    setRoomCode(code)
    setRoomData(snapshot.val())
  }

  // 監聽 Firebase 變更（顯示端與控制端共用）；房間在使用中被移除時通知上層，
  // 不然畫面會卡在最後一次收到的舊資料
  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = onValue(ref(db, `rooms/${roomCode}`), snapshot => {
      if (snapshot.exists()) setRoomData(snapshot.val())
      else onRoomMissing?.()
    })
    return () => unsubscribe()
  }, [roomCode, onRoomMissing])

  // 本機連線狀態 + presence 註冊：斷線偵測交給 Firebase 伺服器端的 .info/connected，
  // 比前端心跳可靠（就算裝置直接斷網、分頁被關掉，onDisconnect 也會自動清除 presence）
  useEffect(() => {
    if (!roomCode) return
    const presenceRef = ref(db, `rooms/${roomCode}/presence/${clientId}`)
    const unsubscribe = onValue(ref(db, '.info/connected'), snapshot => {
      const isConnected = snapshot.val() === true
      setConnected(isConnected)
      if (isConnected) {
        onDisconnect(presenceRef).remove()
        set(presenceRef, true)
      }
    })
    return () => { unsubscribe(); remove(presenceRef) }
  }, [roomCode, clientId])

  // 對方在線狀態：只有「對方曾經連線過、後來斷線」才提示，避免對方根本還沒加入房間時誤判成異常
  useEffect(() => {
    if (!roomCode) return
    hasPeerConnectedRef.current = false
    const unsubscribe = onValue(ref(db, `rooms/${roomCode}/presence`), snapshot => {
      const presence = snapshot.val() || {}
      const peerOnline = Object.keys(presence).some(id => id !== clientId)
      if (peerOnline) hasPeerConnectedRef.current = true
      setPeerConnected(hasPeerConnectedRef.current ? peerOnline : true)
    })
    return () => unsubscribe()
  }, [roomCode, clientId])

  // 比分更新：對 score/{team} 做原子遞增/遞減，避免兩端同時按分時互相覆蓋漏計分
  const addScore = (team) => {
    if (!roomCode) return
    runTransaction(ref(db, `rooms/${roomCode}/score/${team}`), current =>
      (typeof current === 'number' ? current : 0) + 1
    )
  }

  const subScore = (team) => {
    if (!roomCode) return
    runTransaction(ref(db, `rooms/${roomCode}/score/${team}`), current => {
      const c = typeof current === 'number' ? current : 0
      return c <= 0 ? c : c - 1
    })
  }

  const resetScore = () => {
    if (!roomCode) return
    update(ref(db, `rooms/${roomCode}`), {
      score: { host: 0, guest: 0 },
      updatedAt: Date.now(),
    })
  }

  // 隊伍設定更新
  const updateTeams = teamsPartial => {
    if (!roomCode) return
    update(ref(db, `rooms/${roomCode}/teams`), teamsPartial)
  }

  // 抽籤分隊設定（人數、群組），不含抽籤結果
  const updateDrawConfig = drawConfigPartial => {
    if (!roomCode) return
    update(ref(db, `rooms/${roomCode}/drawConfig`), drawConfigPartial)
  }

  // 局數紀錄：用 transaction 讀當下最新的 records/score 再寫入，避免兩端同時儲存時互相覆蓋
  const saveRecord = () => {
    if (!roomCode) return
    runTransaction(ref(db, `rooms/${roomCode}`), current => {
      if (!current) return current
      const records = current.records || []
      if (records.length >= 5) return undefined
      return { ...current, records: [...records, current.score], score: { host: 0, guest: 0 }, updatedAt: Date.now() }
    })
  }

  const deleteRecord = index => {
    if (!roomCode) return
    runTransaction(ref(db, `rooms/${roomCode}/records`), current =>
      (current || []).filter((_, i) => i !== index)
    )
  }

  return {
    roomCode,
    roomData,
    connected,
    peerConnected,
    createRoom,
    joinRoom,
    addScore,
    subScore,
    resetScore,
    updateTeams,
    updateDrawConfig,
    saveRecord,
    deleteRecord,
  }
}
