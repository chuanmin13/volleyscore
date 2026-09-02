import Icon from '../Icon'
import { useDrawTeams } from './useDrawTeams'
import DrawSetupForm from './DrawSetupForm'
import DrawResultBoard from './DrawResultBoard'

// Landing 獨立入口：不接 room，每次進入都是全新設定，不記憶群組
const DrawTeamsStandalone = ({ onExit }) => {
  const draw = useDrawTeams()

  return (
    <div className="draw-standalone">
      <div className="draw-card-wrap">
        {draw.phase === 'draw' && (
          <button className="draw-close-btn" onClick={onExit} aria-label="關閉">
            <Icon name="close" size={18} />
          </button>
        )}
        <div className="settings-inner draw-standalone-inner draw-inner">
          <h3>抽籤分隊</h3>
          {draw.phase === 'setup' && <p className="draw-standalone-notice">此模式不會保存設定，離開或重新整理後需要重新輸入</p>}
          {draw.phase === 'setup' && <DrawSetupForm draw={draw} onCancel={onExit} />}
          {draw.phase === 'draw' && <DrawResultBoard draw={draw} />}
        </div>
      </div>
    </div>
  )
}

export default DrawTeamsStandalone
