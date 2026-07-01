import { useState } from 'react'

import { useRoom } from './hooks/useRoom'

import Landing from './components/Landing'
import ScoreBoard from './components/ScoreBoard'
import Guide from './components/Guide'

const App = () => {
  const [mode, setMode] = useState('landing') // 'landing' | 'scoreboard'
  const [entry, setEntry] = useState(null) // 'create' | 'join' | 'offline'
  const [showGuide, setShowGuide] = useState(false)

  const [joinError, setJoinError] = useState('')
  const room = useRoom()

  const handleCreateRoom = async () => {
    await room.createRoom()
    setEntry('create')
    setMode('scoreboard')
  }

  const handleJoinRoom = async (code) => {
    try {
      setJoinError('')
      await room.joinRoom(code)
      setEntry('join')
      setMode('scoreboard')
    } catch (e) {
      setJoinError(e.message)
    }
  }

  return (
    <>
      {mode === 'landing' && (
        <Landing
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onOffline={() => { setEntry('offline'); setMode('scoreboard') }}
          joinError={joinError}
          onClearError={() => setJoinError('')}
          onShowGuide={() => setShowGuide(true)}
        />
      )}
      {mode === 'scoreboard' && (
        <ScoreBoard
          room={entry === 'offline' ? null : room}
          entry={entry}
          onLeave={() => setMode('landing')}
          onShowGuide={() => setShowGuide(true)}
        />
      )}
      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
    </>
  )
}

export default App
