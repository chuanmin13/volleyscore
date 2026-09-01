import Icon from '../Icon'
import { useDrawTeams } from './useDrawTeams'
import DrawSetupForm from './DrawSetupForm'
import DrawResultBoard from './DrawResultBoard'

const DrawTeamsModal = ({ onClose, drawConfig, onDrawConfigChange }) => {
  const draw = useDrawTeams({ initialConfig: drawConfig, onConfigChange: onDrawConfigChange })

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="draw-card-wrap" onClick={e => e.stopPropagation()}>
        {draw.phase === 'draw' && (
          <button className="draw-close-btn" onClick={onClose} aria-label="關閉">
            <Icon name="close" size={18} />
          </button>
        )}
        <div className="settings-inner draw-inner" role="dialog" aria-modal="true" aria-labelledby="draw-title">
          <h3 id="draw-title">抽籤分隊</h3>
          {draw.phase === 'setup' && <DrawSetupForm draw={draw} onCancel={onClose} />}
          {draw.phase === 'draw' && <DrawResultBoard draw={draw} />}
        </div>
      </div>
    </div>
  )
}

export default DrawTeamsModal
