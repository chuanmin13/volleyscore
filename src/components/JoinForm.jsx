import OtpInput from './OtpInput'

const JoinForm = ({ onJoin, onBack, joinError, disabled }) => {
  return (
    <div className="join-form">
      <p className="join-label">輸入房間碼</p>
      <OtpInput key={joinError} onComplete={onJoin} error={!!joinError} disabled={disabled} />
      {joinError && <p className="join-error">{joinError}</p>}
      {disabled && <p className="join-label">加入中…</p>}
      <button
        className="btn landing-btn landing-btn--back"
        onClick={onBack}
        disabled={disabled}
      >
        返回
      </button>
    </div>
  )
}

export default JoinForm
