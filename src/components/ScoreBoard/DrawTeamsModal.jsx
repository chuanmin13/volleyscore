import { useState, useMemo, useRef, useEffect } from 'react'
import Icon from '../Icon'

const TEAM_KEYS = ['A', 'B', 'C']
const TEAM_COLORS = { A: '#cd2424', B: '#244ecd', C: '#1f8f1f' }
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
  '🥐', '🥃', '🍻', '🌊', '⛰️', '☁️', '🌚', '🪁'
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
  if (items.length === 0) return []
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

const withBackEmoji = (arr) => {
  if (arr.length === 0) return arr
  const emojiPool = arr.length <= BACK_EMOJIS.length
    ? shuffle(BACK_EMOJIS).slice(0, arr.length)
    : shuffle(Array.from({ length: arr.length }, (_, i) => BACK_EMOJIS[i % BACK_EMOJIS.length]))
  return arr.map((l, i) => ({ ...l, backEmoji: emojiPool[i] }))
}

const GenderCount = ({ male, female }) => (
  <>
    {male > 0 && <>{male}<span className="draw-gender-symbol">♂</span></>}
    {female > 0 && <>{female}<span className="draw-gender-symbol">♀</span></>}
  </>
)

// 隊伍目標人數：total 平均分給 3 隊，除不盡的餘數隨機補給其中幾隊（不固定補同一隊）
const computeQuotas = (total) => {
  const base = Math.floor(total / 3)
  const rem = total % 3
  const quotas = [base, base, base]
  const order = shuffle([0, 1, 2])
  for (let i = 0; i < rem; i++) quotas[order[i]] += 1
  return quotas
}

// 依隊伍目標人數比例分配女生配額（Largest Remainder Method）：
// 女生配額總和保證等於 femaleTotal，且不超過該隊目標人數；
// 小數餘數優先給理想值小數部分最大的隊伍，同分時隨機決定，避免固定偏袒某隊
const apportionFemale = (targetSizes, femaleTotal, totalPeople) => {
  if (totalPeople === 0) return targetSizes.map(() => 0)
  const ideal = targetSizes.map(t => (t * femaleTotal) / totalPeople)
  const base = ideal.map(Math.floor)
  let remaining = femaleTotal - base.reduce((s, b) => s + b, 0)

  const items = targetSizes.map((cap, i) => ({ i, frac: ideal[i] - base[i], cap }))
  while (remaining > 0) {
    const candidates = items.filter(it => base[it.i] < it.cap)
    const topFrac = Math.max(...candidates.map(c => c.frac))
    const tied = shuffle(candidates.filter(c => c.frac === topFrac))
    base[tied[0].i] += 1
    tied[0].frac = -1
    remaining -= 1
  }
  return base
}

// 檢查一批群組（各自帶男/女人數）是否能在不超過各隊男/女配額的情況下全部塞入
// （個人以 1 人為單位彈性遞補，故只需驗證群組本身；每隊同時比較男、女兩個維度）
const canPackGroups = (groups, maleCaps, femaleCaps) => {
  const mCaps = [...maleCaps]
  const fCaps = [...femaleCaps]
  const sorted = [...groups].sort((a, b) => (b.male + b.female) - (a.male + a.female))
  const backtrack = (idx) => {
    if (idx === sorted.length) return true
    const g = sorted[idx]
    for (let i = 0; i < mCaps.length; i++) {
      if (mCaps[i] >= g.male && fCaps[i] >= g.female) {
        mCaps[i] -= g.male
        fCaps[i] -= g.female
        if (backtrack(idx + 1)) return true
        mCaps[i] += g.male
        fCaps[i] += g.female
      }
    }
    return false
  }
  return backtrack(0)
}

// 女生配額計算「看得到」固定群組：固定群組需要的男/女人數先當作該隊下限保留起來，
// 剩下的名額才用比例分配法隨機分給三隊，保證固定群組一定塞得下
const validateSetup = ({ targetSizes, femaleTotal, totalPeople, targetSizeMismatch }, groups) => {
  const zeroQuotas = targetSizes.map(() => 0)

  if (targetSizeMismatch) {
    return { ok: false, targetSizes, femaleQuotas: zeroQuotas, maleQuotas: zeroQuotas, message: '自訂各隊人數總和與男女總人數不符，請調整' }
  }

  const maleSum = groups.reduce((s, g) => s + g.male, 0)
  const femaleSum = groups.reduce((s, g) => s + g.female, 0)

  if (maleSum + femaleSum > totalPeople) {
    return { ok: false, targetSizes, femaleQuotas: zeroQuotas, maleQuotas: zeroQuotas, message: '綁定人數總和超過總人數，請調整' }
  }

  const fixedMaleByTeam = { A: 0, B: 0, C: 0 }
  const fixedFemaleByTeam = { A: 0, B: 0, C: 0 }
  groups.filter(g => g.mode === 'fixed').forEach(g => {
    fixedMaleByTeam[g.team] += g.male
    fixedFemaleByTeam[g.team] += g.female
  })

  const remCap = targetSizes.map((t, i) => t - fixedMaleByTeam[TEAM_KEYS[i]] - fixedFemaleByTeam[TEAM_KEYS[i]])
  for (let i = 0; i < TEAM_KEYS.length; i++) {
    const key = TEAM_KEYS[i]
    if (remCap[i] < 0) {
      return { ok: false, targetSizes, femaleQuotas: zeroQuotas, maleQuotas: zeroQuotas, message: `${key} 隊固定人數（♂${fixedMaleByTeam[key]} ♀${fixedFemaleByTeam[key]}）已超過隊伍目標人數（${targetSizes[i]} 人），請調整` }
    }
  }

  const designatedByTeam = { A: 0, B: 0, C: 0 }
  groups.filter(g => g.mode === 'fixed' && g.scoreDesignated).forEach(g => { designatedByTeam[g.team]++ })

  for (const key of TEAM_KEYS) {
    if (designatedByTeam[key] > 1) {
      return { ok: false, targetSizes, femaleQuotas: zeroQuotas, maleQuotas: zeroQuotas, message: `${key} 隊已有多組指定計分，請取消其中一組` }
    }
  }

  const fixedFemaleSum = TEAM_KEYS.reduce((s, k) => s + fixedFemaleByTeam[k], 0)
  const remCapTotal = remCap.reduce((s, c) => s + c, 0)
  const extraFemale = apportionFemale(remCap, femaleTotal - fixedFemaleSum, remCapTotal)

  const femaleQuotas = targetSizes.map((_, i) => fixedFemaleByTeam[TEAM_KEYS[i]] + extraFemale[i])
  const maleQuotas = targetSizes.map((t, i) => t - femaleQuotas[i])

  const remainingMale = maleQuotas.map((q, i) => q - fixedMaleByTeam[TEAM_KEYS[i]])
  const remainingFemale = femaleQuotas.map((q, i) => q - fixedFemaleByTeam[TEAM_KEYS[i]])
  const drawGroups = groups.filter(g => g.mode === 'draw')

  if (!canPackGroups(drawGroups, remainingMale, remainingFemale)) {
    return { ok: false, targetSizes, femaleQuotas, maleQuotas, message: '目前綁定人數組合無法分成三隊，請調整綁定設定' }
  }

  return { ok: true, targetSizes, femaleQuotas, maleQuotas, remainingMale, remainingFemale, drawGroups }
}

// 每隊選出一張「計分」記號卡：固定隊伍中有指定計分的群組優先，否則從該隊所有卡片中隨機挑一張
const assignScorers = (fixedLots, groupLots, maleLots, femaleLots) => {
  const scorerIds = new Set()
  const allLots = [...fixedLots, ...groupLots, ...maleLots, ...femaleLots]
  TEAM_KEYS.forEach(team => {
    const candidates = allLots.filter(l => l.team === team)
    if (candidates.length === 0) return
    const designated = candidates.find(l => l.scoreDesignated)
    const chosen = designated || candidates[Math.floor(Math.random() * candidates.length)]
    scorerIds.add(chosen.id)
  })
  const tag = (arr) => arr.map(l => ({ ...l, isScorer: scorerIds.has(l.id) }))
  return {
    fixedLots: tag(fixedLots),
    groupLots: tag(groupLots),
    maleLots: tag(maleLots),
    femaleLots: tag(femaleLots),
  }
}

// 依剩餘隊伍男/女配額，隨機把代表抽籤群組安置進三隊（雙維度背包），
// 再把剩餘個人配額分別建立男生池、女生池
const buildLots = (drawGroups, remainingMale, remainingFemale) => {
  const mCaps = [...remainingMale]
  const fCaps = [...remainingFemale]
  const shuffledGroups = shuffle(drawGroups)
  const assignment = []

  const backtrack = (idx) => {
    if (idx === shuffledGroups.length) return true
    const g = shuffledGroups[idx]
    for (const i of shuffle([0, 1, 2])) {
      if (mCaps[i] >= g.male && fCaps[i] >= g.female) {
        mCaps[i] -= g.male
        fCaps[i] -= g.female
        assignment.push({ id: g.id, male: g.male, female: g.female, team: TEAM_KEYS[i] })
        if (backtrack(idx + 1)) return true
        assignment.pop()
        mCaps[i] += g.male
        fCaps[i] += g.female
      }
    }
    return false
  }
  backtrack(0)

  let malePool = []
  let femalePool = []
  TEAM_KEYS.forEach((team, i) => {
    for (let k = 0; k < mCaps[i]; k++) malePool.push(team)
    for (let k = 0; k < fCaps[i]; k++) femalePool.push(team)
  })

  const groupLots = declusteredShuffle(
    assignment.map(a => ({ id: `g-${a.id}`, male: a.male, female: a.female, team: a.team, revealed: false })),
    l => l.team
  )
  const maleLots = declusteredShuffle(
    shuffle(malePool).map((team, i) => ({ id: `im-${i}`, male: 1, female: 0, team, revealed: false })),
    l => l.team
  )
  const femaleLots = declusteredShuffle(
    shuffle(femalePool).map((team, i) => ({ id: `if-${i}`, male: 0, female: 1, team, revealed: false })),
    l => l.team
  )

  return {
    groupLots: withBackEmoji(groupLots),
    maleLots: withBackEmoji(maleLots),
    femaleLots: withBackEmoji(femaleLots),
  }
}

const DrawTeamsModal = ({ onClose, drawConfig, onDrawConfigChange }) => {
  const [phase, setPhase] = useState('setup') // 'setup' | 'draw'
  const [maleTotal, setMaleTotal] = useState(() => drawConfig?.maleTotal ?? 18)
  const [femaleTotal, setFemaleTotal] = useState(() => drawConfig?.femaleTotal ?? 0)
  const [customQuota, setCustomQuota] = useState(() => drawConfig?.customQuota ?? false)
  const [teamSizes, setTeamSizes] = useState(() => drawConfig?.teamSizes ?? { A: 6, B: 6, C: 6 })
  const [groups, setGroups] = useState(() => drawConfig?.groups ?? [])
  const [addingGroup, setAddingGroup] = useState(false)
  const [newMale, setNewMale] = useState(1)
  const [newFemale, setNewFemale] = useState(1)
  const [newMode, setNewMode] = useState('draw')
  const [newTeam, setNewTeam] = useState('C')
  const [groupLots, setGroupLots] = useState([])
  const [maleLots, setMaleLots] = useState([])
  const [femaleLots, setFemaleLots] = useState([])
  const [fixedLots, setFixedLots] = useState([])
  const nextGroupId = useRef((drawConfig?.groups ?? []).reduce((m, g) => Math.max(m, g.id), 0) + 1)

  const totalPeople = maleTotal + femaleTotal

  // 只同步「設定」（人數、群組），不同步抽籤結果；離線模式沒有 onDrawConfigChange，不會寫入
  useEffect(() => {
    onDrawConfigChange?.({ maleTotal, femaleTotal, customQuota, teamSizes, groups })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maleTotal, femaleTotal, customQuota, teamSizes, groups])

  const targetSizes = useMemo(
    () => (customQuota ? TEAM_KEYS.map(k => teamSizes[k]) : computeQuotas(totalPeople)),
    [customQuota, teamSizes, totalPeople]
  )
  const targetSizeMismatch = customQuota && targetSizes.reduce((s, q) => s + q, 0) !== totalPeople

  const validation = useMemo(
    () => validateSetup({ targetSizes, femaleTotal, totalPeople, targetSizeMismatch }, groups),
    [targetSizes, femaleTotal, totalPeople, targetSizeMismatch, groups]
  )

  const enableCustomQuota = () => {
    const [a, b, c] = computeQuotas(totalPeople)
    setTeamSizes({ A: a, B: b, C: c })
    setCustomQuota(true)
  }

  const setTeamSize = (key, value) =>
    setTeamSizes(s => ({ ...s, [key]: Math.max(0, value) }))

  const openAddGroup = () => {
    setNewMale(1)
    setNewFemale(1)
    setNewMode('draw')
    setNewTeam('C')
    setAddingGroup(true)
  }

  const newGroupTotal = newMale + newFemale
  const newGroupValid = newGroupTotal >= MIN_GROUP_SIZE && newGroupTotal <= MAX_GROUP_SIZE

  const confirmAddGroup = () => {
    if (!newGroupValid) return
    setGroups(gs => [...gs, {
      id: nextGroupId.current++,
      male: newMale,
      female: newFemale,
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
    const fixed = groups.filter(g => g.mode === 'fixed').map(g => ({
      id: `f-${g.id}`, male: g.male, female: g.female, team: g.team, scoreDesignated: g.scoreDesignated,
    }))
    const drawn = buildLots(validation.drawGroups, validation.remainingMale, validation.remainingFemale)
    const withScorers = assignScorers(fixed, drawn.groupLots, drawn.maleLots, drawn.femaleLots)
    setFixedLots(withScorers.fixedLots)
    setGroupLots(withScorers.groupLots)
    setMaleLots(withScorers.maleLots)
    setFemaleLots(withScorers.femaleLots)
    setPhase('draw')
  }

  const revealLot = (id) => {
    if (id.startsWith('g-')) setGroupLots(ls => ls.map(l => (l.id === id ? { ...l, revealed: true } : l)))
    else if (id.startsWith('im-')) setMaleLots(ls => ls.map(l => (l.id === id ? { ...l, revealed: true } : l)))
    else if (id.startsWith('if-')) setFemaleLots(ls => ls.map(l => (l.id === id ? { ...l, revealed: true } : l)))
  }

  const revealedCount = (team) => {
    const totalOf = (l) => l.male + l.female
    return fixedLots.filter(l => l.team === team).reduce((s, l) => s + totalOf(l), 0) +
      groupLots.filter(l => l.team === team && l.revealed).reduce((s, l) => s + totalOf(l), 0) +
      maleLots.filter(l => l.team === team && l.revealed).reduce((s, l) => s + totalOf(l), 0) +
      femaleLots.filter(l => l.team === team && l.revealed).reduce((s, l) => s + totalOf(l), 0)
  }

  const renderLotCard = (l) => (
    <button
      key={l.id}
      className={`draw-lot${l.revealed ? ' draw-lot--revealed' : ''}${l.revealed && l.isScorer ? ' draw-lot--scorer' : ''}`}
      style={l.revealed ? { backgroundColor: TEAM_COLORS[l.team] } : { backgroundColor: '#ffffff60' }}
      onClick={() => !l.revealed && revealLot(l.id)}
    >
      {l.revealed
        ? <span className="draw-lot-team">{l.team}</span>
        : <span className="draw-lot-back-emoji">{l.backEmoji}</span>}
      {(l.male + l.female) > 1 && <span className="draw-lot-size"><GenderCount male={l.male} female={l.female} /></span>}
      {l.revealed && l.isScorer && (
        <span className="draw-lot-scorer-badge" aria-label="計分">
          <Icon name="pencil" size={12} />
        </span>
      )}
    </button>
  )

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-inner draw-inner" role="dialog" aria-modal="true" aria-labelledby="draw-title" onClick={e => e.stopPropagation()}>
        <h3 id="draw-title">抽籤分隊</h3>

        {phase === 'setup' && (
          <>
            <div className="draw-gender-row">
              <div className="settings-row draw-total-row">
                <label className="draw-gender-label">♂</label>
                <div className="draw-stepper">
                  <button className="btn draw-stepper-btn" onClick={() => setMaleTotal(t => Math.max(0, t - 1))}>−</button>
                  <span className="draw-stepper-value">{maleTotal}</span>
                  <button className="btn draw-stepper-btn" onClick={() => setMaleTotal(t => t + 1)}>+</button>
                </div>
              </div>
              <div className="settings-row draw-total-row">
                <label className="draw-gender-label">♀</label>
                <div className="draw-stepper">
                  <button className="btn draw-stepper-btn" onClick={() => setFemaleTotal(t => Math.max(0, t - 1))}>−</button>
                  <span className="draw-stepper-value">{femaleTotal}</span>
                  <button className="btn draw-stepper-btn" onClick={() => setFemaleTotal(t => t + 1)}>+</button>
                </div>
              </div>
            </div>

            <div className="draw-add-group-mode draw-quota-mode-toggle">
              <button className={`btn draw-mode-btn${!customQuota ? ' active' : ''}`} onClick={() => setCustomQuota(false)}>自動平均</button>
              <button className={`btn draw-mode-btn${customQuota ? ' active' : ''}`} onClick={enableCustomQuota}>自訂各隊人數</button>
            </div>

            <div className="draw-quota-row">
              {TEAM_KEYS.map((k, i) => (
                <div key={k} className="draw-quota-badge" style={{ backgroundColor: TEAM_COLORS[k] }}>
                  {customQuota && (
                    <button className="btn draw-quota-badge-btn" aria-label={`${k} 隊減少`} onClick={() => setTeamSize(k, teamSizes[k] - 1)}>−</button>
                  )}
                  <div className="draw-quota-badge-text">
                    <div className="draw-quota-badge-main">{k} 隊 {validation.targetSizes[i]} 人</div>
                    <div className="draw-quota-badge-sub"><GenderCount male={validation.maleQuotas[i]} female={validation.femaleQuotas[i]} /></div>
                  </div>
                  {customQuota && (
                    <button className="btn draw-quota-badge-btn" aria-label={`${k} 隊增加`} onClick={() => setTeamSize(k, teamSizes[k] + 1)}>+</button>
                  )}
                </div>
              ))}
            </div>

            <div className="draw-groups">
              <div className="draw-groups-header">
                <span>綁定群組</span>
                <button className="btn draw-add-group-btn" onClick={openAddGroup}>+ 新增群組</button>
              </div>

              {groups.length === 0 && <p className="draw-groups-empty">尚無綁定，{totalPeople} 人各自抽籤</p>}

              {groups.map(g => (
                <div key={g.id} className="draw-group-row">
                  <span className="draw-group-desc">
                    <GenderCount male={g.male} female={g.female} />・{g.mode === 'fixed' ? `固定 ${g.team} 隊` : '派代表抽籤'}
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
                    <label className="draw-gender-label">♂</label>
                    <div className="draw-stepper">
                      <button className="btn draw-stepper-btn" onClick={() => setNewMale(m => Math.max(0, m - 1))}>−</button>
                      <span className="draw-stepper-value">{newMale}</span>
                      <button className="btn draw-stepper-btn" onClick={() => setNewMale(m => Math.min(MAX_GROUP_SIZE, m + 1))}>+</button>
                    </div>
                  </div>
                  <div className="settings-row">
                    <label className="draw-gender-label">♀</label>
                    <div className="draw-stepper">
                      <button className="btn draw-stepper-btn" onClick={() => setNewFemale(f => Math.max(0, f - 1))}>−</button>
                      <span className="draw-stepper-value">{newFemale}</span>
                      <button className="btn draw-stepper-btn" onClick={() => setNewFemale(f => Math.min(MAX_GROUP_SIZE, f + 1))}>+</button>
                    </div>
                  </div>
                  {!newGroupValid && <p className="draw-error">組合人數需在 {MIN_GROUP_SIZE}~{MAX_GROUP_SIZE} 人之間，目前 {newGroupTotal} 人</p>}
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
                    <button className="btn settings-apply" disabled={!newGroupValid} onClick={confirmAddGroup}>加入</button>
                  </div>
                </div>
              )}
            </div>

            {!validation.ok && <p className="draw-error">{validation.message}</p>}

            <div className="settings-actions">
              <button className="btn settings-cancel" onClick={onClose}>取消</button>
              <button className="btn settings-apply" disabled={!validation.ok} onClick={startDraw}>開始抽籤（{totalPeople}）</button>
            </div>
          </>
        )}

        {phase === 'draw' && (
          <>
            <div className="draw-tally">
              {TEAM_KEYS.map((k, i) => (
                <span key={k} className="draw-tally-badge" style={{ backgroundColor: TEAM_COLORS[k] }}>
                  {k} 隊 {revealedCount(k)} / {validation.targetSizes[i]}
                </span>
              ))}
            </div>

            {(fixedLots.length > 0 || groupLots.length > 0) && (
              <div className="draw-lots-section">
                <p className="draw-lots-section-title">群組卡</p>
                <div className="draw-lots-grid">
                  {fixedLots.map(l => (
                    <div
                      key={l.id}
                      className={`draw-lot draw-lot--fixed${l.isScorer ? ' draw-lot--scorer' : ''}`}
                      style={{ backgroundColor: TEAM_COLORS[l.team] }}
                    >
                      <span className="draw-lot-team">{l.team}</span>
                      {(l.male + l.female) > 1 && <span className="draw-lot-size"><GenderCount male={l.male} female={l.female} /> 固定</span>}
                      {l.isScorer && (
                        <span className="draw-lot-scorer-badge" aria-label="計分">
                          <Icon name="pencil" size={12} />
                        </span>
                      )}
                    </div>
                  ))}
                  {groupLots.map(renderLotCard)}
                </div>
              </div>
            )}

            {maleLots.length > 0 && (
              <div className="draw-lots-section">
                <p className="draw-lots-section-title">♂ 個人卡</p>
                <div className="draw-lots-grid">
                  {maleLots.map(renderLotCard)}
                </div>
              </div>
            )}

            {femaleLots.length > 0 && (
              <div className="draw-lots-section">
                <p className="draw-lots-section-title">♀ 個人卡</p>
                <div className="draw-lots-grid">
                  {femaleLots.map(renderLotCard)}
                </div>
              </div>
            )}

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
