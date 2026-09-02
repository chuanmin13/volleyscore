import { useState } from 'react'
import Icon from '../Icon'
import GenderCount from './GenderCount'
import ConfirmModal from '../ConfirmModal'
import { TEAM_KEYS, TEAM_COLORS } from './drawEngine'

const DrawResultBoard = ({ draw }) => {
  const [redrawConfirm, setRedrawConfirm] = useState(false)

  const renderLotCard = (l) => (
    <button
      key={l.id}
      className={`draw-lot${l.revealed ? ' draw-lot--revealed' : ''}${l.revealed && l.isScorer ? ' draw-lot--scorer' : ''}`}
      style={l.revealed ? { backgroundColor: TEAM_COLORS[l.team] } : { backgroundColor: '#22222260' }}
      onClick={() => !l.revealed && draw.revealLot(l.id)}
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
    <>
      {redrawConfirm && (
        <ConfirmModal
          message="重新抽籤將洗掉目前的抽籤結果，確定要重來？"
          confirmLabel="重新抽籤"
          cancelLabel="取消"
          onConfirm={() => { setRedrawConfirm(false); draw.startDraw() }}
          onCancel={() => setRedrawConfirm(false)}
        />
      )}

      <div className="draw-tally">
        {TEAM_KEYS.map((k, i) => (
          <span key={k} className="draw-tally-badge" style={{ backgroundColor: TEAM_COLORS[k] }}>
            {k} 隊 {draw.revealedCount(k)} / {draw.validation.targetSizes[i]}
          </span>
        ))}
      </div>

      {(draw.fixedLots.length > 0 || draw.groupLots.length > 0) && (
        <div className="draw-lots-section">
          <p className="draw-lots-section-title">群組卡</p>
          <div className="draw-lots-grid">
            {draw.fixedLots.map(l => (
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
            {draw.groupLots.map(renderLotCard)}
          </div>
        </div>
      )}

      {draw.maleLots.length > 0 && (
        <div className="draw-lots-section">
          <p className="draw-lots-section-title">♂ 個人卡</p>
          <div className="draw-lots-grid">
            {draw.maleLots.map(renderLotCard)}
          </div>
        </div>
      )}

      {draw.femaleLots.length > 0 && (
        <div className="draw-lots-section">
          <p className="draw-lots-section-title">♀ 個人卡</p>
          <div className="draw-lots-grid">
            {draw.femaleLots.map(renderLotCard)}
          </div>
        </div>
      )}

      <div className="settings-actions">
        <button className="btn settings-cancel" onClick={draw.backToSetup}>回設定</button>
        <button className="btn settings-apply-danger" onClick={() => setRedrawConfirm(true)}>重新抽籤</button>
      </div>
    </>
  )
}

export default DrawResultBoard
