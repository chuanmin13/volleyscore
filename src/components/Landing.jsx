import { useState, useRef, useEffect } from 'react'
import LoadingOverlay from './LoadingOverlay'

const OTP_LENGTH = 4

const RoomCodeInput = ({ onComplete, error, disabled }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const refs = useRef([])

  useEffect(() => {
    if (error) {
      setDigits(Array(OTP_LENGTH).fill(''))
      refs.current[0]?.focus()
    }
  }, [error])

  const handleChange = (i, raw) => {
    const val = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
    if (!val) return

    const next = [...digits]
    next[i] = val
    setDigits(next)

    if (i < OTP_LENGTH - 1) {
      refs.current[i + 1].focus()
    } else if (next.every(d => d)) {
      onComplete(next.join(''))
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (digits[i]) {
        next[i] = ''
        setDigits(next)
      } else if (i > 0) {
        next[i - 1] = ''
        setDigits(next)
        refs.current[i - 1].focus()
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
      .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    refs.current[focusIdx].focus()
    if (pasted.length === OTP_LENGTH) onComplete(pasted)
  }

  return (
    <div className="otp-wrap">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          className={`otp-box${error ? ' otp-box--error' : ''}`}
          type="text"
          inputMode="text"
          maxLength={2}
          value={d}
          autoFocus={i === 0}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  )
}

const Landing = ({ onCreateRoom, onJoinRoom, onOffline, joinError }) => {
  const [view, setView] = useState('main') // 'main' | 'join'
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    await onCreateRoom()
    setCreating(false)
  }

  const handleJoin = async (code) => {
    setJoining(true)
    await onJoinRoom(code)
    setJoining(false)
  }

  if (view === 'join') {
    return (
      <div className="landing">
        {joining && <LoadingOverlay />}
        <h1 className="landing-title">VolleyScore</h1>
        <div className="join-form">
          <p className="join-label">輸入房間碼</p>
          <RoomCodeInput onComplete={handleJoin} error={!!joinError} disabled={joining} />
          {joinError && <p className="join-error">{joinError}</p>}
          {joining && <p className="join-label">加入中…</p>}
          <button
            className="btn landing-btn landing-btn--back"
            onClick={() => setView('main')}
            disabled={joining}
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="landing">
      {creating && <LoadingOverlay />}
      <h1 className="landing-title">VolleyScore</h1>
      <div className="landing-actions">
        <button
          className="btn landing-btn landing-btn--display"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? '建立中…' : '建立房間'}
          <span className="landing-btn-sub">顯示端</span>
        </button>
        <button
          className="btn landing-btn landing-btn--controller"
          onClick={() => setView('join')}
        >
          加入房間
          <span className="landing-btn-sub">控制端</span>
        </button>
        <button
          className="btn landing-btn landing-btn--offline"
          onClick={onOffline}
        >
          單機模式
        </button>
      </div>
    </div>
  )
}

export default Landing
