import { useState } from 'react'
import Icon from '../Icon'
import settingsIcon from '../../assets/settings.svg'

const ControlPanel = ({ records, onSave, onDelete, onResetConfirm, panelOpen, onPanelClose, onSettingsOpen, onDrawOpen }) => {
  const [recordsOpen, setRecordsOpen] = useState(false)

  const showRecords = panelOpen && recordsOpen

  const handleSave = () => { onSave(); onPanelClose() }

  return (
    <div className={`ctrl-panel${panelOpen ? ' open' : ''}`}>
      {showRecords && (
        <div className="ctrl-records-panel">
          {records?.length === 0
            ? <p className="ctrl-records-empty">尚無紀錄</p>
            : records?.map((r, i) => (
              <div key={i} className="ctrl-record-row">
                <span>[Set {i + 1}] {r.host} : {r.guest}</span>
                <button className="btn delRecord" aria-label={`刪除第 ${i + 1} 局紀錄`} onClick={() => onDelete(i)}>
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))
          }
        </div>
      )}
      <div className="ctrl-panel-btns">
        <button className="btn ctrl-btn ctrl-btn--settings" onClick={onSettingsOpen}>
          <img src={settingsIcon} alt="" width="16" height="16" />
          設定
        </button>
        <button className="btn ctrl-btn" onClick={handleSave}>
          儲存紀錄
        </button>
        <button
          className={`btn ctrl-btn ctrl-btn--records${recordsOpen ? ' active' : ''}`}
          onClick={() => setRecordsOpen(o => !o)}
        >
          查看紀錄
        </button>
        <button className="btn ctrl-btn ctrl-btn--reset" onClick={onResetConfirm}>
          重設比數
        </button>
        <button className="btn ctrl-btn" onClick={onDrawOpen}>
          抽籤分隊
        </button>
      </div>
    </div>
  )
}

export default ControlPanel
