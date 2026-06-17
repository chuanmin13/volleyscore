import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import Toast from './Toast'
import settingsIcon from '../assets/settings.svg'

const INITIAL_OFFLINE_SCORE = () => {
  const saved = sessionStorage.getItem('nowScore')
  return saved ? JSON.parse(saved) : { host: 0, guest: 0 }
}

const INITIAL_OFFLINE_TEAMS = {
  hostName: '', guestName: '', hostColor: '#f24c00', guestColor: '#244ecd', showTeamNames: false,
}

const PRESET_COLORS = ['#cd2424', '#244ecd', '#1f8f1f', '#d16a03', '#7b2d8b', '#1a1a1a']

const Controller = ({ room, onLeave }) => {
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
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [footerOpen, setFooterOpen] = useState(false)
  const [recordsOpen, setRecordsOpen] = useState(false)
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
    setFooterOpen(false)
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

  const handleLeave = () => {
    if (!isOnline) {
      sessionStorage.removeItem('nowScore')
      sessionStorage.removeItem('records')
    }
    onLeave()
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
        <div className="ctrl-header-right">
          <button className="ctrl-settings-btn" onClick={openSettings}>
            <img src={settingsIcon} alt="設定" width="22" height="22" />
          </button>
          <button className="leave-btn" onClick={() => setLeaveConfirm(true)} aria-label="離開">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {settingsOpen && settingsForm && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-inner" onClick={e => e.stopPropagation()}>
            <h3>設定隊伍</h3>
            {['host', 'guest'].map(team => (
              <div key={team}>
                <div className="settings-row">
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
                <div className="color-swatches">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch${settingsForm[`${team}Color`] === c ? ' active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSettingsForm(f => ({ ...f, [`${team}Color`]: c }))}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="settings-row settings-row--toggle">
              <label>顯示隊名</label>
              <input
                type="checkbox"
                checked={!!settingsForm.showTeamNames}
                onChange={e => setSettingsForm(f => ({ ...f, showTeamNames: e.target.checked }))}
              />
            </div>
            <div className="settings-actions">
              <button className="btn settings-apply" onClick={applySettings}>套用</button>
              <button className="btn settings-cancel" onClick={() => setSettingsOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {leaveConfirm && (
        <ConfirmModal
          message={isOnline ? '確定離開房間？' : '返回首頁將清除目前比分及所有紀錄'}
          confirmLabel="離開"
          cancelLabel="取消"
          onConfirm={handleLeave}
          onCancel={() => setLeaveConfirm(false)}
        />
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
              {teams.showTeamNames && (
                <div className="team-name">
                  {teams[`${team}Name`] || (team === 'host' ? '主隊' : '客隊')}
                </div>
              )}
              <div className="score">{score[team]}</div>
            </div>
            <div className="card-toolbar" style={{ backgroundColor: teams[`${team}Color`] }}>
              <button className="card-toolbar-btn card-toolbar-btn--add" onClick={() => handleAdd(team)}>+</button>
              <button className="card-toolbar-btn" onClick={() => handleSub(team)}>−</button>
            </div>
          </div>
        ))}
      </div>

      <button
        className={`ctrl-fab${footerOpen ? ' open' : ''}`}
        onClick={() => { setFooterOpen(o => { if (o) setRecordsOpen(false); return !o }); }}
        aria-label={footerOpen ? '收合操作列' : '展開操作列'}
      >
        {footerOpen ? '✕' : '‹'}
      </button>

      <footer className={`ctrl-footer${footerOpen ? ' open' : ''}`}>
        {recordsOpen && (
          <div className="ctrl-records-panel">
            {records.length === 0
              ? <p className="ctrl-records-empty">尚無紀錄</p>
              : records.map((r, i) => (
                <div key={i} className="ctrl-record-row">
                  <span>[Set {i + 1}] {r.host} : {r.guest}</span>
                  <button className="btn delRecord" onClick={() => handleDeleteRecord(i)}>✕</button>
                </div>
              ))
            }
          </div>
        )}
        <div className="ctrl-footer-btns">
          <button className="btn ctrl-btn" onClick={handleSave}>儲存紀錄</button>
          <button
            className={`btn ctrl-btn ctrl-btn--records${recordsOpen ? ' active' : ''}`}
            onClick={() => setRecordsOpen(o => !o)}
          >
            紀錄 {recordsOpen ? '▼' : '▲'}
          </button>
          <button className="btn ctrl-btn ctrl-btn--reset" onClick={() => { setResetConfirm(true); setFooterOpen(false); setRecordsOpen(false) }}>重設比數</button>
        </div>
      </footer>

      <Toast visible={toast} message="✓ 隊伍設定已儲存" />
    </div>
  )
}

export default Controller
