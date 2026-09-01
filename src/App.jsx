import { useState, useEffect, useCallback } from 'react'

import { useRoom } from './hooks/useRoom'

import Landing from './components/Landing'
import ScoreBoard from './components/ScoreBoard'
import Guide from './components/Guide'
import LoadingOverlay from './components/LoadingOverlay'
import DrawTeamsStandalone from './components/DrawTeams/DrawTeamsStandalone'

const ROOM_CODE_PATTERN = /^\d{4}$/
const getRoomCodeFromUrl = () => new URLSearchParams(window.location.search).get('room')

const App = () => {
  const [mode, setMode] = useState('landing') // 'landing' | 'scoreboard' | 'draw'
  const [entry, setEntry] = useState(null) // 'create' | 'join' | 'offline'
  const [showGuide, setShowGuide] = useState(false)

  const [joinError, setJoinError] = useState('')
  const [roomGoneNotice, setRoomGoneNotice] = useState(false)
  // 掛載時網址上有合法房間碼才需要「還原」，沒有就不用等，直接顯示 Landing
  const [restoring, setRestoring] = useState(() => ROOM_CODE_PATTERN.test(getRoomCodeFromUrl() || ''))

  // 房間在使用中被移除（例如從 Firebase 移除該房間節點）就自動導回 Landing；
  // 這個 callback 是在 useRoom 內部既有的 onValue 訂閱裡被呼叫，不是額外的衍生 state effect
  const handleRoomMissing = useCallback(() => {
    window.history.replaceState(null, '', window.location.pathname)
    setEntry(null)
    setMode('landing')
    setRoomGoneNotice(true)
  }, [])

  const room = useRoom(handleRoomMissing)

  // 掛載時嘗試從網址 ?room= 還原房間連線（reload / 分享連結都能直接回到房間）；
  // 房間碼過期就靜默清掉網址、留在 Landing，不彈錯誤嚇到使用者
  useEffect(() => {
    if (!restoring) return
    room.joinRoom(getRoomCodeFromUrl())
      .then(() => {
        setEntry('join')
        setMode('scoreboard')
      })
      .catch(() => {
        window.history.replaceState(null, '', window.location.pathname)
      })
      .finally(() => setRestoring(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateRoom = async () => {
    setRoomGoneNotice(false)
    const code = await room.createRoom()
    window.history.replaceState(null, '', `?room=${code}`)
    setEntry('create')
    setMode('scoreboard')
  }

  const handleJoinRoom = async (code) => {
    try {
      setJoinError('')
      setRoomGoneNotice(false)
      await room.joinRoom(code)
      window.history.replaceState(null, '', `?room=${code}`)
      setEntry('join')
      setMode('scoreboard')
    } catch (e) {
      setJoinError(e.message)
    }
  }

  const handleLeaveRoom = () => {
    window.history.replaceState(null, '', window.location.pathname)
    setEntry(null)
    setRoomGoneNotice(false)
    setMode('landing')
  }

  if (restoring) return <LoadingOverlay />

  return (
    <>
      {mode === 'landing' && (
        <Landing
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onOffline={() => { setEntry('offline'); setMode('scoreboard') }}
          onOpenDraw={() => setMode('draw')}
          joinError={joinError}
          onClearError={() => setJoinError('')}
          onShowGuide={() => setShowGuide(true)}
          roomGoneNotice={roomGoneNotice}
        />
      )}
      {mode === 'draw' && (
        <DrawTeamsStandalone onExit={() => setMode('landing')} />
      )}
      {mode === 'scoreboard' && (
        <ScoreBoard
          room={entry === 'offline' ? null : room}
          entry={entry}
          onLeave={handleLeaveRoom}
          onShowGuide={() => setShowGuide(true)}
        />
      )}
      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
    </>
  )
}

export default App
