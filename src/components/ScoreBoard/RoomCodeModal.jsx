import qrCode from '../../assets/qrcode.jpg'

const RoomCodeModal = ({ roomCode, onClose }) => {
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
          <img src={qrCode} alt="qrcode" width={140} height={140} />
          <p className="code-modal-text">volleyscore.ctheworldx.com</p>
          <ol className="code-modal-steps">
            <li>掃碼開啟計分板</li>
            <li>點選「進入房間」</li>
            <li>輸入房間號</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default RoomCodeModal
