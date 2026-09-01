import { useState, useEffect, useRef } from 'react'
import { ref, set, get, update, onValue } from 'firebase/database'
import { db } from '../firebase'

const generateRoomCode = () =>
  String(Math.floor(Math.random() * 9000) + 1000)

const initialRoomState = {
  score: { host: 0, guest: 0 },
  teams: { hostName: '', guestName: '', hostColor: '#f24c00', guestColor: '#244ecd' },
  records: [],
  drawConfig: { maleTotal: 18, femaleTotal: 0, customQuota: false, teamSizes: { A: 6, B: 6, C: 6 }, groups: [] },
}

// onRoomMissing：房間在使用中被移除時呼叫，讓上層（App.jsx）決定要怎麼導回 Landing。
// 用 callback 而非內部 state + 額外 effect，因為 setState 只能在這個既有的
// onValue 訂閱 callback 裡直接呼叫，不能另外開一個 effect 去監聽衍生出來的 state
export const useRoom = onRoomMissing => {
  const [roomCode, setRoomCode] = useState(null)
  const [roomData, setRoomData] = useState(initialRoomState)

  const roomDataRef = useRef(initialRoomState) // 避免 stale closure

  const updateRoomData = data => {
    roomDataRef.current = data
    setRoomData(data)
  }

  // 顯示端：建立房間
  const createRoom = async () => {
    const code = generateRoomCode()
    await set(ref(db, `rooms/${code}`), { ...initialRoomState, updatedAt: Date.now() })
    setRoomCode(code)
    return code
  }

  // 控制端：驗證並加入房間
  const joinRoom = async (code) => {
    const snapshot = await get(ref(db, `rooms/${code}`))
    if (!snapshot.exists()) throw new Error('房間碼不存在')
    setRoomCode(code)
    updateRoomData(snapshot.val())
  }

  // 監聽 Firebase 變更（顯示端與控制端共用）；房間在使用中被移除時通知上層，
  // 不然畫面會卡在最後一次收到的舊資料
  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = onValue(ref(db, `rooms/${roomCode}`), snapshot => {
      if (snapshot.exists()) updateRoomData(snapshot.val())
      else onRoomMissing?.()
    })
    return () => unsubscribe()
  }, [roomCode, onRoomMissing])

  // 比分更新：直接寫 score 子路徑，避免整包覆蓋
  const addScore = (team) => {
    if (!roomCode) return
    const current = roomDataRef.current?.score?.[team]
    update(ref(db, `rooms/${roomCode}/score`), { [team]: current + 1, updatedAt: Date.now() })
  }

  const subScore = (team) => {
    if (!roomCode) return
    const current = roomDataRef.current?.score?.[team]
    if (current <= 0) return
    update(ref(db, `rooms/${roomCode}/score`), { [team]: current - 1, updatedAt: Date.now() })
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

  // 局數紀錄
  const saveRecord = () => {
    if (!roomCode) return
    const records = roomDataRef.current?.records || []
    const score = roomDataRef.current?.score
    if (records.length >= 5) return
    update(ref(db, `rooms/${roomCode}`), {
      records: [...records, score],
      score: { host: 0, guest: 0 },
      updatedAt: Date.now(),
    })
  }

  const deleteRecord = index => {
    if (!roomCode) return
    const newRecords = roomDataRef.current?.records?.filter((_, i) => i !== index)
    update(ref(db, `rooms/${roomCode}`), { records: newRecords })
  }

  return {
    roomCode,
    roomData,
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
