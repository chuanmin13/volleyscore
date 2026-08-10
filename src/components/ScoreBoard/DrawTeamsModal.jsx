import { useState, useMemo, useRef } from 'react'
import Icon from '../Icon'

const TEAM_KEYS = ['A', 'B', 'C']
const TEAM_COLORS = { A: '#cd2424', B: '#244ecd', C: '#1f8f1f' }
const MIN_TOTAL = 3
const MIN_GROUP_SIZE = 2
const MAX_GROUP_SIZE = 6

// 翻牌前的裝飾樣式，跟隊伍結果無關，純粹讓籤卡看起來不無聊
const BACK_EMOJIS = [
  '🎲', '🎯', '🎁', '🦭', '🀄', '🍤', '🍀', '⭐', '🔮', '🎈',
  '🎉', '🎊', '🧧', '🏐', '⚽', '⛄️', '🐡', '🎶', '💎', '🔥',
  '⚡', '🍉', '🍕', '🍔', '🐯', '🐶', '🐱', '🐵', '🦊', '🐼',
  '👻', '🤡', '🥳', '🌟', '✨', '🎪', '🎰', '🦕', '🐷', '🫍',
  '🎸', '🫀', '🥊', '💩', '👾', '👽', '🧠', '💋', '👑', '🐥',
  '🌝', '🦥', '🍗', '🐸', '🎏', '🥑', '🧸', '💌', '🧟', '😈',
  '👱🏿‍♂️', '🎅🏻', '🐝', '🫎', '🦉', '🦄', '🍄', '🥕', '🥦', '🫐',
  '🥐', '🥃', '🍻', '🌊', '⛰️', '☁️', '🌚', '🪁', ''
]
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 依 keyFn 分組後，讓每組平均分散在整個序列中排列（各自帶隨機偏移），
// 避免單純洗牌時同一組（例如同隊）常常擠在相鄰位置
const declusteredShuffle = (items, keyFn) => {
  const buckets = new Map()
  items.forEach(item => {
    const key = keyFn(item)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(item)
  })

  const n = items.length
  const positioned = []
  buckets.forEach(bucket => {
    const slot = n / bucket.length
    shuffle(bucket).forEach((item, j) => {
      const jitter = (Math.random() - 0.5) * slot * 0.6
      positioned.push({ item, pos: (j + 0.5) * slot + jitter })
    })
  })

  positioned.sort((a, b) => a.pos - b.pos)
  return positioned.map(p => p.item)
}

// 各隊人數上限：total 平均分給 3 隊，除不盡時前面的隊多 1 人
const computeQuotas = (total) => {
  const base = Math.floor(total / 3)
  const rem = total % 3
  return TEAM_KEYS.map((_, i) => base + (i < rem ? 1 : 0))
}

// 檢查一組群組人數是否能在不超過各隊上限的情況下全部塞入（個人以 1 人為單位彈性遞補，故只需驗證群組本身）
const canPackGroups = (sizes, capacities) => {
  const caps = [...capacities]
  const sorted = [...sizes].sort((a, b) => b - a)
  const backtrack = (idx) => {
    if (idx === sorted.length) return true
    const size = sorted[idx]
    for (let i = 0; i < caps.length; i++) {
      if (caps[i] >= size) {
        caps[i] -= size
        if (backtrack(idx + 1)) return true
        caps[i] += size
      }
    }
    return false
  }
  return backtrack(0)
}

const validateSetup = (total, groups) => {
  const quotas = computeQuotas(total)
  const groupSizeSum = groups.reduce((s, g) => s + g.size, 0)

  if (groupSizeSum > total) {
    return { ok: false, quotas, message: '綁定人數總和超過總人數，請調整' }
  }

  const fixedByTeam = { A: 0, B: 0, C: 0 }
  groups.filter(g => g.mode === 'fixed').forEach(g => { fixedByTeam[g.team] += g.size })

  for (let i = 0; i < TEAM_KEYS.length; i++) {
    const key = TEAM_KEYS[i]
    if (fixedByTeam[key] > quotas[i]) {
      return { ok: false, quotas, message: `${key} 隊固定人數（${fixedByTeam[key]}）已超過隊伍上限（${quotas[i]} 人）` }
    }
  }

  const designatedByTeam = { A: 0, B: 0, C: 0 }
  groups.filter(g => g.mode === 'fixed' && g.scoreDesignated).forEach(g => { designatedByTeam[g.team]++ })

  for (const key of TEAM_KEYS) {
    if (designatedByTeam[key] > 1) {
      return { ok: false, quotas, message: `${key} 隊已有多組指定計分，請取消其中一組` }
    }
  }

  const remainingQuotas = quotas.map((q, i) => q - fixedByTeam[TEAM_KEYS[i]])
  const drawGroups = groups.filter(g => g.mode === 'draw')

  if (!canPackGroups(drawGroups.map(g => g.size), remainingQuotas)) {
    return { ok: false, quotas, message: '目前綁定人數組合無法平均分成三隊，請調整綁定設定' }
  }

  return { ok: true, quotas, remainingQuotas, drawGroups }
}

// 每隊選出一張「計分」記號卡：固定隊伍中有指定計分的群組優先，否則從該隊卡片中隨機挑一張
const assignScorers = (fixedLots, lots) => {
  const scorerIds = new Set()
  TEAM_KEYS.forEach(team => {
    const candidates = [...fixedLots, ...lots].filter(l => l.team === team)
    if (candidates.length === 0) return
    const designated = candidates.find(l => l.scoreDesignated)
    const chosen = designated || candidates[Math.floor(Math.random() * candidates.length)]
    scorerIds.add(chosen.id)
  })
  return {
    fixedLots: fixedLots.map(l => ({ ...l, isScorer: scorerIds.has(l.id) })),
    lots: lots.map(l => ({ ...l, isScorer: scorerIds.has(l.id) })),
  }
}

// 依剩餘隊伍名額，隨機把代表抽籤群組與個人分配進三隊，回傳打亂順序的籤陣列
const buildLots = (drawGroups, remainingQuotas) => {
  const caps = [...remainingQuotas]
  const shuffledGroups = shuffle(drawGroups)
  const assignment = []

  const backtrack = (idx) => {
    if (idx === shuffledGroups.length) return true
    const g = shuffledGroups[idx]
    for (const i of shuffle([0, 1, 2])) {
      if (caps[i] >= g.size) {
        caps[i] -= g.size
        assignment.push({ id: g.id, size: g.size, team: TEAM_KEYS[i] })
        if (backtrack(idx + 1)) return true
        assignment.pop()
        caps[i] += g.size
      }
    }
    return false
  }
  backtrack(0)

  let individualPool = []
  TEAM_KEYS.forEach((team, i) => {
    for (let k = 0; k < caps[i]; k++) individualPool.push(team)
  })
  individualPool = shuffle(individualPool)

  const lots = [
    ...assignment.map(a => ({ id: `g-${a.id}`, size: a.size, team: a.team, revealed: false })),
    ...individualPool.map((team, i) => ({ id: `i-${i}`, size: 1, team, revealed: false })),
  ]
  const shuffledLots = declusteredShuffle(lots, l => l.team)

  // 翻牌前的 emoji 跟隊伍結果無關，不重複抽樣讓每張卡都不一樣
  const emojiPool = shuffledLots.length <= BACK_EMOJIS.length
    ? shuffle(BACK_EMOJIS).slice(0, shuffledLots.length)
    : shuffle(Array.from({ length: shuffledLots.length }, (_, i) => BACK_EMOJIS[i % BACK_EMOJIS.length]))
  return shuffledLots.map((l, i) => ({ ...l, backEmoji: emojiPool[i] }))
}

const DrawTeamsModal = ({ onClose }) => {
  const [phase, setPhase] = useState('setup') // 'setup' | 'draw'
  const [total, setTotal] = useState(18)
  const [groups, setGroups] = useState([])
  const [addingGroup, setAddingGroup] = useState(false)
  const [newSize, setNewSize] = useState(2)
  const [newMode, setNewMode] = useState('draw')
  const [newTeam, setNewTeam] = useState('C')
  const [lots, setLots] = useState([])
  const [fixedLots, setFixedLots] = useState([])
  const nextGroupId = useRef(1)

  const validation = useMemo(() => validateSetup(total, groups), [total, groups])

  const openAddGroup = () => {
    setNewSize(2)
    setNewMode('draw')
    setNewTeam('C')
    setAddingGroup(true)
  }

  const confirmAddGroup = () => {
    setGroups(gs => [...gs, {
      id: nextGroupId.current++,
      size: newSize,
      mode: newMode,
      team: newMode === 'fixed' ? newTeam : null,
      scoreDesignated: false,
    }])
    setAddingGroup(false)
  }

  const removeGroup = (id) => setGroups(gs => gs.filter(g => g.id !== id))

  const toggleScoreDesignated = (id) =>
    setGroups(gs => gs.map(g => (g.id === id ? { ...g, scoreDesignated: !g.scoreDesignated } : g)))

  const startDraw = () => {
    if (!validation.ok) return
    const fixed = groups.filter(g => g.mode === 'fixed').map(g => ({ id: `f-${g.id}`, size: g.size, team: g.team, scoreDesignated: g.scoreDesignated }))
    const drawn = buildLots(validation.drawGroups, validation.remainingQuotas)
    const withScorers = assignScorers(fixed, drawn)
    setFixedLots(withScorers.fixedLots)
    setLots(withScorers.lots)
    setPhase('draw')
  }

  const revealLot = (id) => {
    setLots(ls => ls.map(l => (l.id === id ? { ...l, revealed: true } : l)))
  }

  const revealedCount = (team) =>
    fixedLots.filter(l => l.team === team).reduce((s, l) => s + l.size, 0) +
    lots.filter(l => l.team === team && l.revealed).reduce((s, l) => s + l.size, 0)

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-inner draw-inner" role="dialog" aria-modal="true" aria-labelledby="draw-title" onClick={e => e.stopPropagation()}>
        <h3 id="draw-title">抽籤分隊</h3>

        {phase === 'setup' && (
          <>
            <div className="settings-row draw-total-row">
              <label>總人數</label>
              <div className="draw-stepper">
                <button className="btn draw-stepper-btn" onClick={() => setTotal(t => Math.max(MIN_TOTAL, t - 1))}>−</button>
                <span className="draw-stepper-value">{total}</span>
                <button className="btn draw-stepper-btn" onClick={() => setTotal(t => t + 1)}>+</button>
              </div>
            </div>

            <div className="draw-quota-row">
              {TEAM_KEYS.map((k, i) => (
                <span key={k} className="draw-quota-badge" style={{ backgroundColor: TEAM_COLORS[k] }}>
                  {k} 隊 {validation.quotas[i]} 人
                </span>
              ))}
            </div>

            <div className="draw-groups">
              <div className="draw-groups-header">
                <span>綁定群組</span>
                <button className="btn draw-add-group-btn" onClick={openAddGroup}>+ 新增群組</button>
              </div>

              {groups.length === 0 && <p className="draw-groups-empty">尚無綁定，{total} 人各自抽籤</p>}

              {groups.map(g => (
                <div key={g.id} className="draw-group-row">
                  <span className="draw-group-desc">
                    {g.size} 人・{g.mode === 'fixed' ? `固定 ${g.team} 隊` : '派代表抽籤'}
                    {g.scoreDesignated && (
                      <span className="draw-group-score-badge">
                        <Icon name="pencil" size={11} />指定計分
                      </span>
                    )}
                  </span>
                  <div className="draw-group-actions">
                    {g.mode === 'fixed' && (
                      <input
                        type="checkbox"
                        className="draw-group-score-check"
                        aria-label="指定這組人計分"
                        checked={g.scoreDesignated}
                        onChange={() => toggleScoreDesignated(g.id)}
                      />
                    )}
                    <button className="btn draw-group-del" aria-label="刪除群組" onClick={() => removeGroup(g.id)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {addingGroup && (
                <div className="draw-add-group-form">
                  <div className="settings-row">
                    <label>人數</label>
                    <div className="draw-stepper">
                      <button className="btn draw-stepper-btn" onClick={() => setNewSize(s => Math.max(MIN_GROUP_SIZE, s - 1))}>−</button>
                      <span className="draw-stepper-value">{newSize}</span>
                      <button className="btn draw-stepper-btn" onClick={() => setNewSize(s => Math.min(MAX_GROUP_SIZE, s + 1))}>+</button>
                    </div>
                  </div>
                  <div className="draw-add-group-mode">
                    <button className={`btn draw-mode-btn${newMode === 'draw' ? ' active' : ''}`} onClick={() => setNewMode('draw')}>派代表抽籤</button>
                    <button className={`btn draw-mode-btn${newMode === 'fixed' ? ' active' : ''}`} onClick={() => setNewMode('fixed')}>固定隊伍</button>
                  </div>
                  {newMode === 'fixed' && (
                    <div className="draw-add-group-team">
                      {TEAM_KEYS.map(k => (
                        <button
                          key={k}
                          className={`btn draw-team-pick${newTeam === k ? ' active' : ''}`}
                          style={{ borderColor: TEAM_COLORS[k], color: newTeam === k ? '#fff' : TEAM_COLORS[k], backgroundColor: newTeam === k ? TEAM_COLORS[k] : 'transparent' }}
                          onClick={() => setNewTeam(k)}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="draw-add-group-actions">
                    <button className="btn settings-cancel" onClick={() => setAddingGroup(false)}>取消</button>
                    <button className="btn settings-apply" onClick={confirmAddGroup}>加入</button>
                  </div>
                </div>
              )}
            </div>

            {!validation.ok && <p className="draw-error">{validation.message}</p>}

            <div className="settings-actions">
              <button className="btn settings-cancel" onClick={onClose}>取消</button>
              <button className="btn settings-apply" disabled={!validation.ok} onClick={startDraw}>開始抽籤</button>
            </div>
          </>
        )}

        {phase === 'draw' && (
          <>
            <div className="draw-tally">
              {TEAM_KEYS.map((k, i) => (
                <span key={k} className="draw-tally-badge" style={{ backgroundColor: TEAM_COLORS[k] }}>
                  {k} 隊 {revealedCount(k)} / {validation.quotas[i]}
                </span>
              ))}
            </div>

            <div className="draw-lots-grid">
              {fixedLots.map(l => (
                <div
                  key={l.id}
                  className={`draw-lot draw-lot--fixed${l.isScorer ? ' draw-lot--scorer' : ''}`}
                  style={{ backgroundColor: TEAM_COLORS[l.team] }}
                >
                  <span className="draw-lot-team">{l.team}</span>
                  {l.size > 1 && <span className="draw-lot-size">{l.size} 人固定</span>}
                  {l.isScorer && (
                    <span className="draw-lot-scorer-badge" aria-label="計分">
                      <Icon name="pencil" size={12} />
                    </span>
                  )}
                </div>
              ))}
              {lots.map(l => (
                <button
                  key={l.id}
                  className={`draw-lot${l.revealed ? ' draw-lot--revealed' : ''}${l.revealed && l.isScorer ? ' draw-lot--scorer' : ''}`}
                  style={l.revealed ? { backgroundColor: TEAM_COLORS[l.team] } : { backgroundColor: '#ffffff60' }}
                  onClick={() => !l.revealed && revealLot(l.id)}
                >
                  {l.revealed
                    ? <span className="draw-lot-team">{l.team}</span>
                    : <span className="draw-lot-back-emoji">{l.backEmoji}</span>}
                  {l.size > 1 && <span className="draw-lot-size">{l.size} 人一組</span>}
                  {l.revealed && l.isScorer && (
                    <span className="draw-lot-scorer-badge" aria-label="計分">
                      <Icon name="pencil" size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="settings-actions">
              <button className="btn settings-cancel" onClick={() => setPhase('setup')}>回設定</button>
              <button className="btn settings-apply" onClick={startDraw}>重新抽籤</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DrawTeamsModal
