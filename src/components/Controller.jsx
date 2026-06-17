import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import Toast from './Toast'

const INITIAL_OFFLINE_SCORE = () => {
  const saved = sessionStorage.getItem('nowScore')
  return saved ? JSON.parse(saved) : { host: 0, guest: 0 }
}

const INITIAL_OFFLINE_TEAMS = {
  hostName: '', guestName: '', hostColor: '#f24c00', guestColor: '#244ecd',
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

  const [resetConfirm, setResetConfirm] = useState(false)
  const [recordsFull, setRecordsFull] = useState(false)
  const [toast, setToast] = useState(false)

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

  const doReset = () => {
    setResetConfirm(false)
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
      setRecordsFull(true)
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
    setToast(true)
    setTimeout(() => setToast(false), 1500)
  }

  return (
    <div className="container controller">
      <header className="ctrl-header">
        <span className="ctrl-room-code">
          {isOnline ? `房間：${roomCode}` : '單機模式'}
        </span>
        <button className="ctrl-settings-btn" onClick={openSettings}>⚙</button>
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

      {resetConfirm && (
        <ConfirmModal
          message="確定重設比數？"
          confirmLabel="重設"
          cancelLabel="取消"
          onConfirm={doReset}
          onCancel={() => setResetConfirm(false)}
        />
      )}

      {recordsFull && (
        <ConfirmModal
          message="紀錄已滿，請刪除後再新增"
          confirmLabel="確認"
          onConfirm={() => setRecordsFull(false)}
        />
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
        <button className="btn ctrl-btn" onClick={handleSave}>儲存紀錄</button>
        <button className="btn ctrl-btn ctrl-btn--reset" onClick={() => setResetConfirm(true)}>⚠ 重設比數</button>
      </footer>

      <Toast visible={toast} message="✓ 隊伍設定已儲存" />
    </div>
  )
}

export default Controller
