import { useState } from 'react'
import Icon from '../Icon'

const RecordsPanel = ({ records, score, onSave, onDelete, onResetConfirm }) => {
  const [footerOpen, setFooterOpen] = useState(false)
  const [recordsOpen, setRecordsOpen] = useState(false)

  const handleToggle = () => {
    setFooterOpen(o => {
      if (o) setRecordsOpen(false)
      return !o
    })
  }

  return (
    <>
      <button
        className={`ctrl-fab${footerOpen ? ' open' : ''}`}
        onClick={handleToggle}
        aria-label={footerOpen ? '收合操作列' : '展開操作列'}
      >
        {footerOpen ? <Icon name="chevronDown" size={18} /> : <Icon name="chevronUp" size={18} />}
      </button>

      <footer className={`ctrl-footer${footerOpen ? ' open' : ''}`}>
        {recordsOpen && (
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
        <div className="ctrl-footer-btns">
          <button className="btn ctrl-btn" onClick={onSave}>儲存紀錄</button>
          <button
            className={`btn ctrl-btn ctrl-btn--records${recordsOpen ? ' active' : ''}`}
            onClick={() => setRecordsOpen(o => !o)}
          >
            查看紀錄{recordsOpen ? '▾' : '▴'}
          </button>
          <button
            className="btn ctrl-btn ctrl-btn--reset"
            onClick={() => { onResetConfirm(); setFooterOpen(false); setRecordsOpen(false) }}
          >
            重設比數
          </button>
        </div>
      </footer>
    </>
  )
}

export default RecordsPanel
