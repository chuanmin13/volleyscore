import { useState } from 'react'

const INITIAL_OFFLINE_SCORE = () => {
  const saved = sessionStorage.getItem('nowScore')
  return saved ? JSON.parse(saved) : { host: 0, guest: 0 }
}

const INITIAL_OFFLINE_TEAMS = {
  hostName: '', guestName: '', hostColor: '#cd2424', guestColor: '#244ecd',
}

const Controller = ({ room }) => {
  const isOnline = room !== null

  // 單機模式 state
  const [offlineScore, setOfflineScore] = useState(INITIAL_OFFLINE_SCORE)
  const [offlineTeams, setOfflineTeams] = useState(INITIAL_OFFLINE_TEAMS)
  const [offlineRecords, setOfflineRecords] = useState(() =>
    JSON.parse(sessionStorage.getItem('records') || '[]')
  )

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState(null)

  const score = isOnline ? room.roomData.score : offlineScore
  const teams = isOnline ? room.roomData.teams : offlineTeams
  const records = isOnline ? room.roomData.records : offlineRecords
  const roomCode = isOnline ? room.roomCode : null

  const handleAdd = team => {
    if (isOnline) {
      room.addScore(team)
    } else {
      setOfflineScore(s => {
        const next = { ...s, [team]: s[team] + 1 }
        sessionStorage.setItem('nowScore', JSON.stringify(next))
        return next
      })
    }
  }

  const handleSub = (team) => {
    if (isOnline) {
      room.subScore(team)
    } else {
      setOfflineScore(s => {
        if (s[team] <= 0) return s
        const next = { ...s, [team]: s[team] - 1 }
        sessionStorage.setItem('nowScore', JSON.stringify(next))
        return next
      })
    }
  }

  const handleReset = () => {
    if (!confirm('確定重設比數？')) return
    if (isOnline) {
      room.resetScore()
    } else {
      const zero = { host: 0, guest: 0 }
      setOfflineScore(zero)
      sessionStorage.removeItem('nowScore')
    }
  }

  const handleSave = () => {
    if (records.length >= 5) {
      alert('紀錄已滿，請刪除後再新增')
      return
    }
    if (isOnline) {
      room.saveRecord()
    } else {
      setOfflineRecords(prev => {
        const next = [...prev, offlineScore]
        sessionStorage.setItem('records', JSON.stringify(next))
        return next
      })
    }
  }

  const handleDeleteRecord = (i) => {
    if (isOnline) {
      room.deleteRecord(i)
    } else {
      setOfflineRecords(prev => {
        const next = prev.filter((_, idx) => idx !== i)
        sessionStorage.setItem('records', JSON.stringify(next))
        return next
      })
    }
  }

  const openSettings = () => {
    setSettingsForm({ ...teams })
    setSettingsOpen(true)
  }

  const applySettings = () => {
    if (isOnline) {
      room.updateTeams(settingsForm)
    } else {
      setOfflineTeams(settingsForm)
    }
    setSettingsOpen(false)
  }

  return (
    <div className="container controller">
      <header className="ctrl-header">
        <span className="ctrl-room-code">
          {isOnline ? `房間：${roomCode}` : '單機模式'}
        </span>
        <button className="ctrl-settings-btn" onClick={openSettings}>≡</button>
      </header>

      {settingsOpen && settingsForm && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-inner" onClick={e => e.stopPropagation()}>
            <h3>設定隊伍</h3>
            {['host', 'guest'].map(team => (
              <div key={team} className="settings-row">
                <label>{team === 'host' ? '主隊' : '客隊'}</label>
                <input
                  type="text"
                  value={settingsForm[`${team}Name`]}
                  placeholder={team === 'host' ? '主隊' : '客隊'}
                  onChange={e => setSettingsForm(f => ({ ...f, [`${team}Name`]: e.target.value }))}
                />
                <input
                  type="color"
                  value={settingsForm[`${team}Color`]}
                  onChange={e => setSettingsForm(f => ({ ...f, [`${team}Color`]: e.target.value }))}
                />
              </div>
            ))}
            {records.length > 0 && (
              <div className="settings-records">
                <h4>局數紀錄</h4>
                {records.map((r, i) => (
                  <div key={i} className="settings-record-row">
                    <span>Set {i + 1}: {r.host} : {r.guest}</span>
                    <button className="btn delRecord" onClick={() => handleDeleteRecord(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="settings-actions">
              <button className="btn settings-apply" onClick={applySettings}>套用</button>
              <button className="btn settings-cancel" onClick={() => setSettingsOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="scores-wrap ctrl-scores">
        {['host', 'guest'].map(team => (
          <div key={team} className="ctrl-team-wrap">
            <div
              className="score-card"
              style={{ backgroundColor: teams[`${team}Color`] }}
              onClick={() => handleAdd(team)}
            >
              <div className="team-name">
                {teams[`${team}Name`] || (team === 'host' ? '主隊' : '客隊')}
              </div>
              <div className="score">{score[team]}</div>
            </div>
            <button className="minus-btn btn" onClick={() => handleSub(team)}>−</button>
          </div>
        ))}
      </div>

      <footer className="ctrl-footer">
        <button className="btn ctrl-btn" onClick={handleSave}>Save 紀錄</button>
        <button className="btn ctrl-btn" onClick={handleReset}>Reset 歸零</button>
      </footer>
    </div>
  )
}

export default Controller
