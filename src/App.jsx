import { useState } from 'react'

import { useRoom } from './hooks/useRoom'

import Landing from './components/Landing'
import ScoreBoard from './components/ScoreBoard'

const App = () => {
  const [mode, setMode] = useState('landing') // 'landing' | 'scoreboard'
  const [entry, setEntry] = useState(null) // 'create' | 'join' | 'offline'

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

  if (mode === 'landing') return (
    <Landing
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onOffline={() => { setEntry('offline'); setMode('scoreboard') }}
      joinError={joinError}
      onClearError={() => setJoinError('')}
    />)
  if (mode === 'scoreboard') return (
    <ScoreBoard
      room={entry === 'offline' ? null : room}
      entry={entry}
      onLeave={() => setMode('landing')}
    />
  )
}

export default App
