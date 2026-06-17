import { useState } from 'react'

import { useRoom } from './hooks/useRoom'

import Landing from './components/Landing'
import Display from './components/Display'
import Controller from './components/Controller'

const App = () => {
  const [mode, setMode] = useState('landing') // 'landing' | 'display' | 'controller' | 'offline'

  const [joinError, setJoinError] = useState('')
  const room = useRoom()

  const handleCreateRoom = async () => {
    await room.createRoom()
    setMode('display')
  }

  const handleJoinRoom = async (code) => {
    try {
      setJoinError('')
      await room.joinRoom(code)
      setMode('controller')
    } catch (e) {
      setJoinError(e.message)
    }
  }

  if (mode === 'landing') return (
    <Landing
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onOffline={() => setMode('offline')}
      joinError={joinError}
    />)
  if (mode === 'display') return <Display room={room} onLeave={() => setMode('landing')} />
  if (mode === 'controller') return <Controller room={room} />
  if (mode === 'offline') return <Controller room={null} /> // 單機模式沿用 sessionStorage
}

export default App
