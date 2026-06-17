import { useState } from 'react'

const Display = ({ room }) => {
  const { roomCode, roomData } = room
  const { score, teams, records } = roomData

  const [recordsOpen, setRecordsOpen] = useState(false)

  return (
    <div className="container display-mode">
      <div className="room-badge">房間碼：{roomCode}</div>
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
