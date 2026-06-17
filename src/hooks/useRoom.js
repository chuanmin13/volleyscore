import { useState, useEffect, useRef } from 'react'
import { ref, set, get, update, onValue } from 'firebase/database'
import { db } from '../firebase'

const generateRoomCode = () => {
  const letters = Array.from({ length: 3 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  ).join('')
  const digit = Math.floor(Math.random() * 10)
  return letters + digit
}

const initialRoomState = {
  score: { host: 0, guest: 0 },
  teams: { hostName: '', guestName: '', hostColor: '#f24c00', guestColor: '#244ecd' },
  records: [],
}

export const useRoom = () => {
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

  // 監聽 Firebase 變更（顯示端與控制端共用）
  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = onValue(ref(db, `rooms/${roomCode}`), snapshot => {
      if (snapshot.exists()) updateRoomData(snapshot.val())
    })
    return () => unsubscribe()
  }, [roomCode])

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
    saveRecord,
    deleteRecord,
  }
}
