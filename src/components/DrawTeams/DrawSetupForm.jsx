import Icon from '../Icon'
import GenderCount from './GenderCount'
import { TEAM_KEYS, TEAM_COLORS, MIN_GROUP_SIZE, MAX_GROUP_SIZE } from './drawEngine'

const DrawSetupForm = ({ draw, onCancel }) => (
  <>
    <div className="draw-gender-row">
      <div className="settings-row draw-total-row">
        <label className="draw-gender-label">♂</label>
        <div className="draw-stepper">
          <button className="btn draw-stepper-btn" onClick={() => draw.setMaleTotal(t => Math.max(0, t - 1))}>−</button>
          <span className="draw-stepper-value">{draw.maleTotal}</span>
          <button className="btn draw-stepper-btn" onClick={() => draw.setMaleTotal(t => t + 1)}>+</button>
        </div>
      </div>
      <span className="draw-gender-divider">/</span>
      <div className="settings-row draw-total-row">
        <label className="draw-gender-label">♀</label>
        <div className="draw-stepper">
          <button className="btn draw-stepper-btn" onClick={() => draw.setFemaleTotal(t => Math.max(0, t - 1))}>−</button>
          <span className="draw-stepper-value">{draw.femaleTotal}</span>
          <button className="btn draw-stepper-btn" onClick={() => draw.setFemaleTotal(t => t + 1)}>+</button>
        </div>
      </div>
    </div>

    <div className="draw-add-group-mode draw-quota-mode-toggle">
      <button className={`btn draw-mode-btn${!draw.customQuota ? ' active' : ''}`} onClick={() => draw.setCustomQuota(false)}>自動平均</button>
      <button className={`btn draw-mode-btn${draw.customQuota ? ' active' : ''}`} onClick={draw.enableCustomQuota}>自訂各隊人數</button>
    </div>

    <div className="draw-quota-row">
      {TEAM_KEYS.map((k, i) => (
        <div key={k} className="draw-quota-badge" style={{ backgroundColor: TEAM_COLORS[k] }}>
          {draw.customQuota && (
            <button className="btn draw-quota-badge-btn" aria-label={`${k} 隊減少`} onClick={() => draw.setTeamSize(k, draw.teamSizes[k] - 1)}>−</button>
          )}
          <div className="draw-quota-badge-text">
            <div className="draw-quota-badge-main">{k} 隊 {draw.validation.targetSizes[i]} 人</div>
            <div className="draw-quota-badge-sub"><GenderCount male={draw.validation.maleQuotas[i]} female={draw.validation.femaleQuotas[i]} /></div>
          </div>
          {draw.customQuota && (
            <button className="btn draw-quota-badge-btn" aria-label={`${k} 隊增加`} onClick={() => draw.setTeamSize(k, draw.teamSizes[k] + 1)}>+</button>
          )}
        </div>
      ))}
    </div>

    <div className="draw-groups">
      <div className="draw-groups-header">
        <span>綁定群組</span>
        <button className="btn draw-add-group-btn" onClick={draw.openAddGroup}>+ 新增群組</button>
      </div>

      {draw.groups.length === 0 && <p className="draw-groups-empty">尚無綁定，{draw.totalPeople} 人各自抽籤</p>}

      {draw.groups.map(g => (
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
                onChange={() => draw.toggleScoreDesignated(g.id)}
              />
            )}
            <button className="btn draw-group-del" aria-label="刪除群組" onClick={() => draw.removeGroup(g.id)}>
              <Icon name="close" size={14} />
            </button>
          </div>
        </div>
      ))}

      {draw.addingGroup && (
        <div className="draw-add-group-form">
          <div className="settings-row">
            <label className="draw-gender-label">♂</label>
            <div className="draw-stepper">
              <button className="btn draw-stepper-btn" onClick={() => draw.setNewMale(m => Math.max(0, m - 1))}>−</button>
              <span className="draw-stepper-value">{draw.newMale}</span>
              <button className="btn draw-stepper-btn" onClick={() => draw.setNewMale(m => Math.min(MAX_GROUP_SIZE, m + 1))}>+</button>
            </div>
          </div>
          <div className="settings-row">
            <label className="draw-gender-label">♀</label>
            <div className="draw-stepper">
              <button className="btn draw-stepper-btn" onClick={() => draw.setNewFemale(f => Math.max(0, f - 1))}>−</button>
              <span className="draw-stepper-value">{draw.newFemale}</span>
              <button className="btn draw-stepper-btn" onClick={() => draw.setNewFemale(f => Math.min(MAX_GROUP_SIZE, f + 1))}>+</button>
            </div>
          </div>
          {!draw.newGroupValid && <p className="draw-error">組合人數需在 {MIN_GROUP_SIZE}~{MAX_GROUP_SIZE} 人之間，目前 {draw.newGroupTotal} 人</p>}
          <div className="draw-add-group-mode">
            <button className={`btn draw-mode-btn${draw.newMode === 'draw' ? ' active' : ''}`} onClick={() => draw.setNewMode('draw')}>派代表抽籤</button>
            <button className={`btn draw-mode-btn${draw.newMode === 'fixed' ? ' active' : ''}`} onClick={() => draw.setNewMode('fixed')}>固定隊伍</button>
          </div>
          {draw.newMode === 'fixed' && (
            <div className="draw-add-group-team">
              {TEAM_KEYS.map(k => (
                <button
                  key={k}
                  className={`btn draw-team-pick${draw.newTeam === k ? ' active' : ''}`}
                  style={{ borderColor: TEAM_COLORS[k], color: draw.newTeam === k ? '#fff' : TEAM_COLORS[k], backgroundColor: draw.newTeam === k ? TEAM_COLORS[k] : 'transparent' }}
                  onClick={() => draw.setNewTeam(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
          <div className="draw-add-group-actions">
            <button className="btn settings-cancel" onClick={draw.closeAddGroup}>取消</button>
            <button className="btn settings-apply" disabled={!draw.newGroupValid} onClick={draw.confirmAddGroup}>加入</button>
          </div>
        </div>
      )}
    </div>

    {!draw.validation.ok && <p className="draw-error">{draw.validation.message}</p>}

    <div className="settings-actions">
      <button className="btn settings-cancel" onClick={onCancel}>取消</button>
      <button className="btn settings-apply" disabled={!draw.validation.ok || draw.addingGroup} onClick={draw.startDraw}>開始抽籤（{draw.totalPeople}）</button>
    </div>
  </>
)

export default DrawSetupForm
