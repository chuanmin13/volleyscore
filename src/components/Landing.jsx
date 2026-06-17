import { useState, useRef, useEffect } from 'react'
import LoadingOverlay from './LoadingOverlay'
import Icon from './Icon'

const PwaBanner = () => {
  const [show, setShow] = useState(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return false
    if (sessionStorage.getItem('pwa-banner-dismissed')) return false
    return true
  })
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setShow(false)
  }

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    dismiss()
  }

  if (!show) return null

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.navigator.standalone

  return (
    <div className="pwa-banner">
      <span className="pwa-banner-text">
        {isIOS
          ? '點選「分享」→「加入主畫面」以取得全螢幕體驗'
          : '安裝應用程式以取得全螢幕體驗'}
      </span>
      {!isIOS && deferredPrompt && (
        <button className="pwa-banner-install btn" onClick={install}>安裝</button>
      )}
      <button className="pwa-banner-close" onClick={dismiss} aria-label="關閉"><Icon name="close" size={16} /></button>
    </div>
  )
}

const OTP_LENGTH = 4

const RoomCodeInput = ({ onComplete, error, disabled }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const refs = useRef([])


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
          aria-label={`房間碼第 ${i + 1} 碼`}
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
          <RoomCodeInput key={joinError} onComplete={handleJoin} error={!!joinError} disabled={joining} />
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
        <PwaBanner />
      </div>
    )
  }

  return (
    <div className="landing">
      {creating && <LoadingOverlay />}
      <h1 className="landing-title">VolleyScore</h1>

      <div className="landing-body">
        <div className="landing-remote-group">
          <p className="landing-group-hint">一台顯示比分，另一台遠端控制</p>
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
          </div>
        </div>

        <div className="landing-or">/</div>

        <button
          className="btn landing-btn landing-btn--offline"
          onClick={onOffline}
        >
          快速開始
        </button>
      </div>

      <PwaBanner />
    </div>
  )
}

export default Landing
