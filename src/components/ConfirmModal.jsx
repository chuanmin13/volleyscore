const ConfirmModal = ({ title, message, confirmLabel = '確認', cancelLabel = '取消', onConfirm, onCancel }) => (
  <div className="modal-backdrop" onClick={onCancel ?? onConfirm}>
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

export default ConfirmModal
