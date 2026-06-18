import { useState, useCallback } from 'react'
import ConfirmModal from '../ConfirmModal'
import Toast from '../Toast'
import Icon from '../Icon'
import settingsIcon from '../../assets/settings.svg'
import useLongPress from '../../hooks/useLongPress'
import RoomCodeModal from './RoomCodeModal'
import SettingsOverlay from './SettingsOverlay'
import RecordsPanel from './RecordsPanel'

const INITIAL_OFFLINE_SCORE = () => {
  const saved = sessionStorage.getItem('nowScore')
  return saved ? JSON.parse(saved) : { host: 0, guest: 0 }
}

const INITIAL_OFFLINE_TEAMS = {
  hostName: '', guestName: '', hostColor: '#f24c00', guestColor: '#244ecd', showTeamNames: false,
}

const ScoreBoard = ({ room, entry, onLeave }) => {
  const isOnline = room !== null

  const [offlineScore, setOfflineScore] = useState(INITIAL_OFFLINE_SCORE)
  const [offlineTeams, setOfflineTeams] = useState(INITIAL_OFFLINE_TEAMS)
  const [offlineRecords, setOfflineRecords] = useState(() =>
    JSON.parse(sessionStorage.getItem('records') || '[]')
  )

  const [canScore, setCanScore] = useState(entry === 'offline')
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(entry === 'create')
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [recordsFull, setRecordsFull] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState(false)

  const score = isOnline ? room.roomData.score : offlineScore
  const teams = isOnline ? room.roomData.teams : offlineTeams
  const records = isOnline ? (room.roomData.records || []) : offlineRecords
  const roomCode = isOnline ? room.roomCode : null

  const handleAdd = (team) => {
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
    if (records?.length >= 5) {
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
      setOfflineScore({ host: 0, guest: 0 })
      sessionStorage.removeItem('nowScore')
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

  const applySettings = (form) => {
    if (isOnline) {
      room.updateTeams(form)
    } else {
      setOfflineTeams(form)
    }
    setSettingsOpen(false)
    setToast(true)
    setTimeout(() => setToast(false), 1500)
  }

  const onSubLongPress = useCallback(() => {
    setResetConfirm(true)
  }, [])
  const subLongPress = useLongPress(onSubLongPress)

  return (
    <div className="container scoreboard">
      {showRoomCodeModal && (
        <RoomCodeModal roomCode={roomCode} onClose={() => setShowRoomCodeModal(false)} />
      )}

      {settingsOpen && (
        <SettingsOverlay
          teams={teams}
          onApply={applySettings}
          onClose={() => setSettingsOpen(false)}
        />
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

      <header className="page-header">
        <div className="room-badge-left">
          {isOnline && (
            <button className="room-badge-code btn" onClick={() => setShowRoomCodeModal(true)}>
              房間碼：{roomCode}
            </button>
          )}
          {!isOnline && (
            <span className="ctrl-room-code">快速開始</span>
          )}
        </div>
        <div className="room-badge-actions">
          {canScore && (
            <button className="ctrl-settings-btn" onClick={() => setSettingsOpen(true)}>
              <img src={settingsIcon} alt="設定" width="22" height="22" />
            </button>
          )}
          <button
            className={`score-switch${canScore ? ' on' : ''}`}
            onClick={() => setCanScore(v => !v)}
            role="switch"
            aria-checked={canScore}
            aria-label="計分模式"
          >
            <span className="score-switch-track">
              <span className="score-switch-thumb" />
              <span className="score-switch-label">{canScore ? '純顯示' : '計分中'}</span>
            </span>
          </button>
          <button className="leave-btn" onClick={() => setLeaveConfirm(true)} aria-label="離開">
            <Icon name="leave" size={22} />
          </button>
        </div>
      </header>

      <div className={`scores-wrap${canScore ? ' ctrl-scores' : ''}`}>
        {['host', 'guest'].map(team => (
          <div
            key={team}
            className={canScore ? 'ctrl-team-wrap' : `display-team-wrap${canScore ? ' can-score' : ''}`}
          >
            <div
              className="score-card"
              style={{ backgroundColor: teams[`${team}Color`] }}
              onClick={canScore ? () => handleAdd(team) : undefined}
            >
              {teams.showTeamNames && (
                <div className="team-name">
                  {teams[`${team}Name`] || (team === 'host' ? '主隊' : '客隊')}
                </div>
              )}
              <div className="score">{score[team]}</div>
            </div>
            {canScore && (
              <div className="card-toolbar" style={{ backgroundColor: teams[`${team}Color`] }}>
                <button className="card-toolbar-btn card-toolbar-btn--add" onClick={() => handleAdd(team)}>+</button>
                <button
                  className="card-toolbar-btn"
                  onPointerDown={subLongPress.onPointerDown}
                  onPointerUp={subLongPress.onPointerUp}
                  onPointerLeave={subLongPress.onPointerLeave}
                  onPointerCancel={subLongPress.onPointerCancel}
                  onContextMenu={subLongPress.onContextMenu}
                  onClick={subLongPress.wrapClick(() => handleSub(team))}
                >−</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canScore && (
        <RecordsPanel
          records={records}
          score={score}
          onSave={handleSave}
          onDelete={handleDeleteRecord}
          onResetConfirm={() => setResetConfirm(true)}
        />
      )}

      <Toast visible={toast} message="✓ 隊伍設定已儲存" />
    </div>
  )
}

export default ScoreBoard
