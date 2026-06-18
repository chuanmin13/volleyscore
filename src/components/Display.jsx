import { useState, useEffect, useCallback } from 'react'
import ConfirmModal from './ConfirmModal'
import Icon from './Icon'

const COUNTDOWN_SEC = 5
const RING_R = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

const RoomCodeModal = ({ roomCode, onClose }) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC)

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); onClose(); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onClose])

  const dashOffset = RING_CIRCUMFERENCE * (1 - countdown / COUNTDOWN_SEC)

  return (
    <div className="code-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        <button className="code-modal-ring-btn" onClick={onClose} aria-label="關閉">
          <svg viewBox="0 0 44 44" width="44" height="44">
            <circle cx="22" cy="22" r={RING_R} fill="none"
              stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
            <circle cx="22" cy="22" r={RING_R} fill="none"
              stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
            <line x1="16" y1="16" x2="28" y2="28" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="16" x2="16" y2="28" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className="code-modal-label">房間碼</p>
        <div className="code-modal-code">{roomCode}</div>
      </div>
    </div>
  )
}

const Display = ({ room, onLeave }) => {
  const { roomCode, roomData, addScore, subScore } = room
  const { score, teams, records = [] } = roomData

  const [recordsOpen, setRecordsOpen] = useState(false)
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [showModal, setShowModal] = useState(true)
  const [canScore, setCanScore] = useState(false)

  const closeModal = useCallback(() => setShowModal(false), [])

  return (
    <div className="container display-mode">
      {showModal && <RoomCodeModal roomCode={roomCode} onClose={closeModal} />}

      <div className="room-badge">
        <button className="room-badge-code btn" onClick={() => setShowModal(true)}>
          房間碼：{roomCode}
        </button>
        <div className="room-badge-actions">
          <button
            className={`score-switch${canScore ? ' on' : ''}`}
            onClick={() => setCanScore(v => !v)}
            role="switch"
            aria-checked={canScore}
            aria-label="計分模式"
          >
            <span className="score-switch-thumb">
              <Icon name={canScore ? 'tap' : 'eye'} size={canScore ? 16 : 13} />
            </span>
          </button>
          <button className="leave-btn" onClick={() => setLeaveConfirm(true)} aria-label="離開房間">
            <Icon name="leave" size={22} />
          </button>
        </div>
      </div>

      {leaveConfirm && (
        <ConfirmModal
          message="確定離開房間？"
          confirmLabel="離開"
          cancelLabel="取消"
          onConfirm={onLeave}
          onCancel={() => setLeaveConfirm(false)}
        />
      )}

      <div className="scores-wrap">
        {['host', 'guest'].map(team => (
          <div key={team} className={`display-team-wrap${canScore ? ' can-score' : ''}`}>
            <div
              className="score-card"
              style={{ backgroundColor: teams[`${team}Color`] }}
              onClick={canScore ? () => addScore(team) : undefined}
            >
              {teams.showTeamNames && (
                <div className="team-name">{teams[`${team}Name`] || (team === 'host' ? '主隊' : '客隊')}</div>
              )}
              <div className="score">{score[team]}</div>
            </div>
            {canScore && (
              <div className="card-toolbar" style={{ backgroundColor: teams[`${team}Color`] }}>
                <button className="card-toolbar-btn card-toolbar-btn--add" onClick={() => addScore(team)}>+</button>
                <button className="card-toolbar-btn" onClick={() => subScore(team)}>−</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {recordsOpen && (
        <div className="records-backdrop" onClick={() => setRecordsOpen(false)} />
      )}
      <div className="records-drawer">
        <button className="records-toggle" onClick={() => setRecordsOpen(o => !o)}>
          局數紀錄 {recordsOpen ? <Icon name="chevronUp" size={16} /> : <Icon name="chevronDown" size={16} />}
        </button>
        <div className={`records-body ${recordsOpen ? 'open' : ''}`}>
          {records.map((r, i) => (
            <div key={i} className="record-row">Set {i + 1}: {r.host} : {r.guest}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Display
