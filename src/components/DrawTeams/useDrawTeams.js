import { useState, useMemo, useEffect } from 'react'
import { TEAM_KEYS, MIN_GROUP_SIZE, MAX_GROUP_SIZE, computeQuotas, validateSetup, buildLots, assignScorers } from './drawEngine'

const DEFAULT_CONFIG = { maleTotal: 18, femaleTotal: 0, customQuota: false, teamSizes: { A: 6, B: 6, C: 6 }, groups: [] }

// 共用 state/handler：房間版與獨立版都用同一份邏輯，差別只在要不要傳 onConfigChange
export const useDrawTeams = ({ initialConfig, onConfigChange } = {}) => {
  const [phase, setPhase] = useState('setup') // 'setup' | 'draw'
  const [maleTotal, setMaleTotal] = useState(() => initialConfig?.maleTotal ?? DEFAULT_CONFIG.maleTotal)
  const [femaleTotal, setFemaleTotal] = useState(() => initialConfig?.femaleTotal ?? DEFAULT_CONFIG.femaleTotal)
  const [customQuota, setCustomQuota] = useState(() => initialConfig?.customQuota ?? DEFAULT_CONFIG.customQuota)
  const [teamSizes, setTeamSizes] = useState(() => initialConfig?.teamSizes ?? DEFAULT_CONFIG.teamSizes)
  const [groups, setGroups] = useState(() => initialConfig?.groups ?? DEFAULT_CONFIG.groups)
  const [addingGroup, setAddingGroup] = useState(false)
  const [newMale, setNewMale] = useState(1)
  const [newFemale, setNewFemale] = useState(1)
  const [newMode, setNewMode] = useState('draw')
  const [newTeam, setNewTeam] = useState('C')
  const [groupLots, setGroupLots] = useState([])
  const [maleLots, setMaleLots] = useState([])
  const [femaleLots, setFemaleLots] = useState([])
  const [fixedLots, setFixedLots] = useState([])

  const totalPeople = maleTotal + femaleTotal

  // 只同步「設定」（人數、群組），不同步抽籤結果；沒有 onConfigChange 就不會寫入（獨立入口用）
  useEffect(() => {
    onConfigChange?.({ maleTotal, femaleTotal, customQuota, teamSizes, groups })
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
  const closeAddGroup = () => setAddingGroup(false)

  const newGroupTotal = newMale + newFemale
  const newGroupValid = newGroupTotal >= MIN_GROUP_SIZE && newGroupTotal <= MAX_GROUP_SIZE

  const confirmAddGroup = () => {
    if (!newGroupValid) return
    setGroups(gs => [...gs, {
      // 用亂數而非本地計數器產生 id，避免房間內兩台裝置同時新增群組時撞號
      id: crypto.randomUUID(),
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

  const backToSetup = () => setPhase('setup')

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

  return {
    phase, startDraw, backToSetup,
    maleTotal, setMaleTotal, femaleTotal, setFemaleTotal,
    customQuota, setCustomQuota, enableCustomQuota,
    teamSizes, setTeamSize,
    groups, removeGroup, toggleScoreDesignated,
    addingGroup, openAddGroup, closeAddGroup,
    newMale, setNewMale, newFemale, setNewFemale,
    newMode, setNewMode, newTeam, setNewTeam,
    newGroupTotal, newGroupValid, confirmAddGroup,
    totalPeople, validation,
    fixedLots, groupLots, maleLots, femaleLots,
    revealLot, revealedCount,
  }
}
