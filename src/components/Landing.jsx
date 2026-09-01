import { useState, useEffect } from 'react'
import LoadingOverlay from './LoadingOverlay'
import Icon from './Icon'
import JoinForm from './JoinForm'
import Toast from './Toast'

const PwaBanner = ({ onShowChange }) => {
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
    onShowChange?.(false)
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

const Landing = ({ onCreateRoom, onJoinRoom, onOffline, onOpenDraw, joinError, onClearError, onShowGuide, roomGoneNotice }) => {
  const [view, setView] = useState('main') // 'main' | 'join'
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return false
    return !sessionStorage.getItem('pwa-banner-dismissed')
  })
  // 房間在使用中被移除、被 App.jsx 導回這裡時，掛載當下 roomGoneNotice 就已經是 true，
  // 短暫提示一下原因後自動消失
  const [roomGoneToast, setRoomGoneToast] = useState(() => roomGoneNotice)

  useEffect(() => {
    if (!roomGoneToast) return
    const timer = setTimeout(() => setRoomGoneToast(false), 2500)
    return () => clearTimeout(timer)
  }, [roomGoneToast])

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
        <JoinForm
          onJoin={handleJoin}
          onBack={() => { onClearError(); setView('main') }}
          joinError={joinError}
          disabled={joining}
        />
        <PwaBanner onShowChange={setBannerVisible} />
        <button onClick={onShowGuide} className="btn help-btn landing-help" aria-label="使用說明">?</button>
      </div>
    )
  }

  return (
    <div className="landing">
      {creating && <LoadingOverlay />}
      <h1 className="landing-title">VolleyScore</h1>

      <div className="landing-body">
        <div className="landing-group">
          <div className="landing-actions">
            <button
              className="btn landing-btn landing-btn--display"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? '建立中…' : '建立房間'}
            </button>
            <button
              className="btn landing-btn landing-btn--controller"
              onClick={() => setView('join')}
            >
              加入房間
            </button>
          </div>
        </div>

        <div className="landing-or">/</div>

        <div className="landing-group">
          <div className="landing-actions">
            <button
              className="btn landing-btn landing-btn--offline"
              onClick={onOffline}
            >
              快速開始
            </button>
            <button
              className="btn landing-btn landing-btn--draw"
              onClick={onOpenDraw}
            >
              抽籤分隊
            </button>
          </div>
        </div>
      </div>

      <PwaBanner onShowChange={setBannerVisible} />
      <span
        className="landing-credit"
        style={bannerVisible ? { bottom: 'calc(56px + max(8px, env(safe-area-inset-bottom)))' } : undefined}
      >
        © CM
        <span className="landing-credit-sep"> · </span>
        <button onClick={onShowGuide} className="btn landing-credit-link landing-credit-btn">使用說明</button>
      </span>
      <button onClick={onShowGuide} className="btn help-btn landing-help" aria-label="使用說明">?</button>
      <Toast visible={roomGoneToast} message="房間已結束，請重新建立或加入房間" />
    </div>
  )
}

export default Landing
