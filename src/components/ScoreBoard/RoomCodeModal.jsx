import qrCode from '../../assets/link_qrcode.svg'

const COUNTDOWN_SEC = 5
const RING_R = 18
const RING_C = 2 * Math.PI * RING_R
const SEG_GAP = 3
const SEG_LEN = (RING_C - SEG_GAP * COUNTDOWN_SEC) / COUNTDOWN_SEC

const RoomCodeModal = ({ roomCode, onClose }) => {
  // const [countdown, setCountdown] = useState(COUNTDOWN_SEC)

  // useEffect(() => {
  //   const id = setInterval(() => {
  //     setCountdown(c => {
  //       if (c <= 1) { clearInterval(id); onClose(); return 0 }
  //       return c - 1
  //     })
  //   }, 1000)
  //   return () => clearInterval(id)
  // }, [onClose])

  return (
    <div className="code-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        <button className="code-modal-ring-btn" onClick={onClose} aria-label="關閉">
          <svg viewBox="0 0 44 44" width="44" height="44">
            {Array.from({ length: COUNTDOWN_SEC }, (_, i) => (
              <circle key={i}
                cx="22" cy="22" r={RING_R} fill="none"
                // stroke={i < countdown ? 'rgba(255,255,255,0.8)' : 'rgba(249,199,132,0.25)'}
                stroke='rgba(249,199,132,0.25)'
                strokeWidth="2.5"
                strokeDasharray={`${SEG_LEN} ${RING_C - SEG_LEN}`}
                strokeDashoffset={-(i * (SEG_LEN + SEG_GAP))}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ transition: 'stroke 0.3s' }}
              />
            ))}
            <line x1="16" y1="16" x2="28" y2="28" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="16" x2="16" y2="28" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className="code-modal-label">房間碼</p>
        <div className="code-modal-code">{roomCode}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={qrCode}
            alt="link_qrcode"
            width={90}
            height={90}
          />
        </div>
      </div>
    </div>
  )
}

export default RoomCodeModal
