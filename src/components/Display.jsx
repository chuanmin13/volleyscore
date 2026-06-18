import { useState, useEffect, useCallback } from 'react'
import ConfirmModal from './ConfirmModal'
import Icon from './Icon'

const COUNTDOWN_SEC = 5
const DOT_R = 14
const DOT_POSITIONS = Array.from({ length: COUNTDOWN_SEC }, (_, i) => {
  const angle = (-90 + (360 / COUNTDOWN_SEC) * i) * (Math.PI / 180)
  return { x: 18 + DOT_R * Math.cos(angle), y: 18 + DOT_R * Math.sin(angle) }
})

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

  return (
    <div className="code-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        <p className="code-modal-label">房間碼</p>
        <div className="code-modal-code">{roomCode}</div>
        <svg viewBox="0 0 36 36" width="56" height="56">
          {DOT_POSITIONS.map((pos, i) => (
            <circle
              key={i}
              cx={pos.x} cy={pos.y} r={3}
              fill={i < countdown ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)'}
            />
          ))}
          <text
            x="18" y="18"
            textAnchor="middle" dominantBaseline="central"
            fontSize="10" fontWeight="600" fill="rgba(255,255,255,0.65)"
            fontFamily="Barlow Condensed, sans-serif"
          >
            {countdown}
          </text>
        </svg>
        <button className="btn code-modal-close" onClick={onClose}>關閉</button>
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
              <Icon name={canScore ? 'tap' : 'eye'} size={13} />
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
