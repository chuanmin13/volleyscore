import { useEffect } from 'react'

const ConfirmModal = ({ title, message, confirmLabel = '確認', cancelLabel = '取消', onConfirm, onCancel }) => {
  const dismiss = onCancel ?? onConfirm

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dismiss])

  return (
    <div className="modal-backdrop" onClick={dismiss}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {title && <p className="modal-title">{title}</p>}
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          {onCancel && <button className="btn modal-btn modal-btn--cancel" onClick={onCancel}>{cancelLabel}</button>}
          <button className="btn modal-btn modal-btn--confirm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
