import { useState } from 'react'
import ConfirmModal from './ConfirmModal'

const Display = ({ room, onLeave }) => {
  const { roomCode, roomData } = room
  const { score, teams, records = [] } = roomData

  const [recordsOpen, setRecordsOpen] = useState(false)
  const [leaveConfirm, setLeaveConfirm] = useState(false)

  return (
    <div className="container display-mode">
      <div className="room-badge">
        房間碼：{roomCode}
        <button className="leave-btn" onClick={() => setLeaveConfirm(true)} aria-label="離開房間">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
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
        <div className="score-card" style={{ backgroundColor: teams.hostColor }}>
          <div className="team-name">{teams.hostName}</div>
          <div className="score">{score.host}</div>
        </div>
        <div className="score-card" style={{ backgroundColor: teams.guestColor }}>
          <div className="team-name">{teams.guestName}</div>
          <div className="score">{score.guest}</div>
        </div>
      </div>

      {recordsOpen && (
        <div className="records-backdrop" onClick={() => setRecordsOpen(false)} />
      )}
      <div className="records-drawer">
        <button
          className="records-toggle"
          onClick={() => setRecordsOpen(o => !o)}
        >
          局數紀錄 {recordsOpen ? '▲' : '▼'}
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
