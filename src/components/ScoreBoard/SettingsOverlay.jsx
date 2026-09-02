import { useState, useEffect } from 'react'
import Icon from '../Icon'

const PRESET_COLORS = ['#cd2424', '#244ecd', '#1f8f1f', '#e68907', '#7b2d8b', '#1a1a1a']

const SettingsOverlay = ({ teams, onApply, onClose, setPointSound, onSetPointSoundChange }) => {
  const [form, setForm] = useState({ ...teams })

  const handleApply = () => {
    onApply(form)
  }

  // 設定到一半容易誤觸背景關閉、遺失未儲存內容，改成只能點 X 或取消才會關閉；
  // Esc 是明確的鍵盤操作意圖，跟意外點擊不同，仍保留
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="settings-overlay">
      <div className="settings-inner" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button className="settings-close-btn" onClick={onClose} aria-label="關閉">
          <Icon name="close" size={18} />
        </button>
        <h3 id="settings-title">設定隊伍</h3>
        {['host', 'guest'].map(team => (
          <div key={team}>
            <div className="settings-row">
              <label>{team === 'host' ? '主隊' : '客隊'}</label>
              <input
                type="text"
                value={form[`${team}Name`]}
                placeholder={team === 'host' ? '主隊' : '客隊'}
                onChange={e => setForm(f => ({ ...f, [`${team}Name`]: e.target.value }))}
              />
              <input
                type="color"
                value={form[`${team}Color`]}
                onChange={e => setForm(f => ({ ...f, [`${team}Color`]: e.target.value }))}
              />
            </div>
            <div className="color-swatches">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${form[`${team}Color`] === c ? ' active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setForm(f => ({ ...f, [`${team}Color`]: c }))}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="settings-row settings-row--toggle">
          <label>顯示隊名</label>
          <input
            type="checkbox"
            checked={!!form.showTeamNames}
            onChange={e => setForm(f => ({ ...f, showTeamNames: e.target.checked }))}
          />
        </div>
        <div className="settings-row settings-row--toggle">
          <label>賽末點提示音</label>
          <input
            type="checkbox"
            checked={!!setPointSound}
            onChange={e => onSetPointSoundChange(e.target.checked)}
          />
        </div>
        <div className="settings-actions">
          <button className="btn settings-apply" onClick={handleApply}>套用</button>
          <button className="btn settings-cancel" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsOverlay
