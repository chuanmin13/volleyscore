import { useState, useCallback, useRef, useEffect } from 'react'
import ConfirmModal from '../ConfirmModal'
import Toast from '../Toast'
import Icon from '../Icon'
import useLongPress from '../../hooks/useLongPress'
import useWakeLock from '../../hooks/useWakeLock'
import RoomCodeModal from './RoomCodeModal'
import SettingsOverlay from './SettingsOverlay'
import DrawTeamsModal from './DrawTeamsModal'
import ControlPanel from './ControlPanel'

const INITIAL_OFFLINE_SCORE = () => {
  const saved = sessionStorage.getItem('nowScore')
  return saved ? JSON.parse(saved) : { host: 0, guest: 0 }
}

const INITIAL_OFFLINE_TEAMS = {
  hostName: '', guestName: '', hostColor: '#f24c00', guestColor: '#244ecd', showTeamNames: false,
}

const WIN_SCORE = 25
// 只差 1 分即局末點（例：23:24、20:24、25:26）
const isSetPoint = (s, o) => s - o >= 1 && s >= WIN_SCORE - 1
// 已達成結束比賽條件（領先方 ≥25 分且分差 ≥2）
const isMatchEnd = (s, o) => s - o >= 2 && s >= WIN_SCORE

const ScoreBoard = ({ room, entry, onLeave, onShowGuide }) => {
  useWakeLock()
  const isOnline = room !== null

  const [offlineScore, setOfflineScore] = useState(INITIAL_OFFLINE_SCORE)
  const [offlineTeams, setOfflineTeams] = useState(INITIAL_OFFLINE_TEAMS)
  const [offlineRecords, setOfflineRecords] = useState(() =>
    JSON.parse(sessionStorage.getItem('records') || '[]')
  )

  const [canScore, setCanScore] = useState(entry === 'offline')
  const [panelOpen, setPanelOpen] = useState(false)
  const [swapped, setSwapped] = useState(false)
  const [dragOffset, setDragOffset] = useState(null) // { team, dx, dy }
  const dragStartRef = useRef(null)  // { team, startX, startY }
  const dragMovedRef = useRef(false)


  const [showRoomCodeModal, setShowRoomCodeModal] = useState(entry === 'create')
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [recordsFull, setRecordsFull] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [drawOpen, setDrawOpen] = useState(false)
  const [toast, setToast] = useState(false)
  const [setPointSound, setSetPointSound] = useState(() => localStorage.getItem('setPointSound') === 'true')

  const score = isOnline ? room.roomData.score : offlineScore
  const teams = isOnline ? room.roomData.teams : offlineTeams
  const records = isOnline ? (room.roomData.records || []) : offlineRecords
  const roomCode = isOnline ? room.roomCode : null
  const matchEnded = isMatchEnd(score.host, score.guest) || isMatchEnd(score.guest, score.host)

  const handleSetPointSoundChange = (val) => {
    setSetPointSound(val)
    localStorage.setItem('setPointSound', String(val))
  }

  const whistleRef = useRef(null)
  const prevScoreRef = useRef(score)
  useEffect(() => {
    const prev = prevScoreRef.current
    const wasSetPoint = isSetPoint(prev.host, prev.guest) || isSetPoint(prev.guest, prev.host)
    const isNowSetPoint = isSetPoint(score.host, score.guest) || isSetPoint(score.guest, score.host)
    if (setPointSound && isNowSetPoint && !wasSetPoint) {
      if (!whistleRef.current) whistleRef.current = new Audio('/sounds/whistle.mp3')
      whistleRef.current.currentTime = 0
      whistleRef.current.play().catch(() => {})
    }
    prevScoreRef.current = score
  }, [score, score.host, score.guest, setPointSound])

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

  const orderedTeams = swapped ? ['guest', 'host'] : ['host', 'guest']

  const handleDragStart = useCallback((e, team) => {
    if (e.target.closest('.card-toolbar')) return
    const rect = e.currentTarget.getBoundingClientRect()
    dragStartRef.current = { team, startX: e.clientX, startY: e.clientY, cardW: rect.width, cardH: rect.height }
    dragMovedRef.current = false
    // 不在此處 setPointerCapture，避免提早 capture 導致 click 事件被重導向而失效
  }, [])

  const handleDragMove = useCallback((e, team) => {
    if (!dragStartRef.current || dragStartRef.current.team !== team) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      if (!dragMovedRef.current) e.currentTarget.setPointerCapture(e.pointerId)
      dragMovedRef.current = true
    }
    const isLandscape = window.innerWidth > window.innerHeight
    const cardDim = isLandscape ? dragStartRef.current.cardW : dragStartRef.current.cardH
    const dist = isLandscape ? Math.abs(dx) : Math.abs(dy)
    setDragOffset({ team, dx, dy, willSwap: dist > cardDim * 0.3 })
  }, [])

  const handleDragEnd = useCallback((e, team) => {
    if (!dragStartRef.current || dragStartRef.current.team !== team) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    const isLandscape = window.innerWidth > window.innerHeight
    const dist = isLandscape ? Math.abs(dx) : Math.abs(dy)
    const threshold = (isLandscape ? window.innerWidth : window.innerHeight) * 0.25
    if (dist > threshold) setSwapped(s => !s)
    dragStartRef.current = null
    setDragOffset(null)
  }, [])

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
          setPointSound={setPointSound}
          onSetPointSoundChange={handleSetPointSoundChange}
        />
      )}

      {drawOpen && (
        <DrawTeamsModal
          onClose={() => setDrawOpen(false)}
          drawConfig={isOnline ? room.roomData.drawConfig : null}
          onDrawConfigChange={isOnline ? room.updateDrawConfig : undefined}
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
              房間碼：<span style={{ color: '#f9c784', display: 'flex', alignItems: 'center' }}>{roomCode}<Icon name="qrcode" size={18} /></span>
            </button>
          )}
          {!isOnline && (
            <span className="ctrl-room-code">快速開始</span>
          )}
        </div>
        <div className="room-badge-actions">
          {canScore && (
            <button className="ctrl-settings-btn" onClick={() => setPanelOpen(v => !v)} aria-label="操作選單">
              <Icon name="more-vertical" size={20} />
            </button>
          )}
          <button
            className={`score-switch${canScore ? ' on' : ''}`}
            onClick={() => { setCanScore(v => !v); setPanelOpen(false) }}
            role="switch"
            aria-checked={canScore}
            aria-label="計分模式"
          >
            <span className="score-switch-track">
              <span className="score-switch-thumb">
                <Icon name={canScore ? 'pencil' : 'eye'} size={12} />
              </span>
              <span className="score-switch-label">{canScore ? '計分中' : '純顯示'}</span>
            </span>
          </button>
          <button onClick={() => setDrawOpen(true)} className="draw-btn" aria-label="抽籤分隊">
            <Icon name="roulette" size={24} />
          </button>
          <button className="leave-btn" onClick={() => setLeaveConfirm(true)} aria-label="離開">
            <Icon name="leave" size={22} />
          </button>
        </div>
      </header>

      <div className={`scores-wrap${canScore ? ` ctrl-scores${dragOffset ? ' is-dragging' : ''}` : ''}`}>
        {orderedTeams.map(team => {
          const isDragging = dragOffset?.team === team
          const isSwapTarget = !isDragging && !!dragOffset?.willSwap
          const isPortrait = window.innerWidth <= window.innerHeight
          return (
          <div
            key={team}
            className={`${canScore ? 'ctrl-team-wrap' : 'display-team-wrap'}${isSwapTarget ? ' swap-target' : ''}`}
            style={canScore ? {
              transform: isDragging ? `translate(${dragOffset.dx}px, ${dragOffset.dy}px)` : undefined,
              zIndex: isDragging ? 10 : undefined,
              transition: isDragging ? 'none' : 'transform 0.25s ease',
              opacity: isDragging ? 0.85 : 1,
              cursor: isDragging ? 'grabbing' : 'grab',
            } : undefined}
            onPointerDown={canScore ? (e) => handleDragStart(e, team) : undefined}
            onPointerMove={canScore ? (e) => handleDragMove(e, team) : undefined}
            onPointerUp={canScore ? (e) => handleDragEnd(e, team) : undefined}
            onPointerCancel={canScore ? (e) => handleDragEnd(e, team) : undefined}
          >
            <div
              className="score-card"
              style={{ backgroundColor: teams[`${team}Color`] }}
              onClick={canScore ? () => { if (!dragMovedRef.current) handleAdd(team) } : undefined}
            >
              {teams.showTeamNames && (
                <div className="team-name">
                  {teams[`${team}Name`] || (team === 'host' ? '主隊' : '客隊')}
                </div>
              )}
              <div className="score">{score[team]}</div>
              {isDragging && dragOffset?.willSwap && (
                <div className={`swap-hint-overlay${isPortrait ? ' swap-hint-overlay--portrait' : ''}`}>
                  <Icon name="swap" size={100} />
                </div>
              )}
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
          )
        })}
        {canScore && matchEnded && (
          <button
            className="match-reset-btn"
            onClick={() => setResetConfirm(true)}
            aria-label="比賽結束，重設比數"
          >
            <Icon name="reset" size={26} />
          </button>
        )}
      </div>

      {canScore && (
        <ControlPanel
          records={records}
          score={score}
          onSave={handleSave}
          onDelete={handleDeleteRecord}
          onResetConfirm={() => { setResetConfirm(true); setPanelOpen(false) }}
          panelOpen={panelOpen}
          onPanelClose={() => setPanelOpen(false)}
          onSettingsOpen={() => { setSettingsOpen(true); setPanelOpen(false) }}
          onShowGuide={() => { onShowGuide(); setPanelOpen(false) }}
        />
      )}

      <Toast visible={toast} message="✓ 隊伍設定已儲存" />
    </div>
  )
}

export default ScoreBoard
