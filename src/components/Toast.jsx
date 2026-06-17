const Toast = ({ visible, message }) => (
  <div className={`toast${visible ? ' toast--visible' : ''}`} role="status" aria-live="polite">
    {message}
  </div>
)

export default Toast
