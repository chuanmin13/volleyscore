import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const RoomCodeModal = ({ roomCode, onClose }) => {
  // 用目前所在網址動態組出加入連結，本機開發、正式站都能正確產生，不寫死網域
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="code-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        <button className="code-modal-ring-btn" onClick={onClose} aria-label="關閉">
          <svg viewBox="0 0 44 44" width="44" height="44">
            <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(231,231,231,0.35)" strokeWidth="1.5" />
            <line x1="16" y1="16" x2="28" y2="28" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="16" x2="16" y2="28" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="code-modal-section">
          <p className="code-modal-section-title">房間碼</p>
          <div className="code-modal-code">{roomCode}</div>
        </div>

        <div className="code-modal-divider" />

        <div className="code-modal-section">
          <p className="code-modal-section-title">可掃碼加入</p>
          <div className="code-modal-qr">
            <QRCodeSVG value={joinUrl} size={140} />
          </div>
          <p className="code-modal-text">掃描後將直接加入本房間</p>
        </div>
      </div>
    </div>
  )
}

export default RoomCodeModal
