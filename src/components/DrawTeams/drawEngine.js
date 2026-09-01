export const TEAM_KEYS = ['A', 'B', 'C']
export const TEAM_COLORS = { A: '#cd2424', B: '#244ecd', C: '#1f8f1f' }
export const MIN_GROUP_SIZE = 2
export const MAX_GROUP_SIZE = 6

// 翻牌前的裝飾樣式，跟隊伍結果無關，純粹讓籤卡看起來不無聊
export const BACK_EMOJIS = [
  '🎲', '🎯', '🎁', '🦭', '🀄', '🍤', '🍀', '⭐', '🔮', '🎈',
  '🎉', '🎊', '🧧', '🏐', '⚽', '⛄️', '🐡', '🎶', '💎', '🔥',
  '⚡', '🍉', '🍕', '🍔', '🐯', '🐶', '🐱', '🐵', '🦊', '🐼',
  '👻', '🤡', '🥳', '🌟', '✨', '🎪', '🎰', '🦕', '🐷', '🫍',
  '🎸', '🫀', '🥊', '💩', '👾', '👽', '🧠', '💋', '👑', '🐥',
  '🌝', '🦥', '🍗', '🐸', '🎏', '🥑', '🧸', '💌', '🧟', '😈',
  '👱🏿‍♂️', '🎅🏻', '🐝', '🫎', '🦉', '🦄', '🍄', '🥕', '🥦', '🫐',
  '🥐', '🥃', '🍻', '🌊', '⛰️', '☁️', '🌚', '🪁'
]

export const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 依 keyFn 分組後，讓每組平均分散在整個序列中排列（各自帶隨機偏移），
// 避免單純洗牌時同一組（例如同隊）常常擠在相鄰位置
export const declusteredShuffle = (items, keyFn) => {
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

export const withBackEmoji = (arr) => {
  if (arr.length === 0) return arr
  const emojiPool = arr.length <= BACK_EMOJIS.length
    ? shuffle(BACK_EMOJIS).slice(0, arr.length)
    : shuffle(Array.from({ length: arr.length }, (_, i) => BACK_EMOJIS[i % BACK_EMOJIS.length]))
  return arr.map((l, i) => ({ ...l, backEmoji: emojiPool[i] }))
}

// 隊伍目標人數：total 平均分給 3 隊，除不盡的餘數隨機補給其中幾隊（不固定補同一隊）
export const computeQuotas = (total) => {
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
export const apportionFemale = (targetSizes, femaleTotal, totalPeople) => {
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
export const canPackGroups = (groups, maleCaps, femaleCaps) => {
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
export const validateSetup = ({ targetSizes, femaleTotal, totalPeople, targetSizeMismatch }, groups) => {
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
export const assignScorers = (fixedLots, groupLots, maleLots, femaleLots) => {
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
export const buildLots = (drawGroups, remainingMale, remainingFemale) => {
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
