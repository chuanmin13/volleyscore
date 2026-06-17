const Toast = ({ visible, message }) => (
  <div className={`toast${visible ? ' toast--visible' : ''}`}>
    {message}
  </div>
)

export default Toast
