import { useState, useRef } from 'react'

const OTP_LENGTH = 4

const OtpInput = ({ onComplete, error, disabled }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const refs = useRef([])

  const handleChange = (i, raw) => {
    const val = raw.replace(/[^0-9]/g, '').slice(-1)
    if (!val) return

    const next = [...digits]
    next[i] = val
    setDigits(next)

    if (i < OTP_LENGTH - 1) {
      refs.current[i + 1].focus()
    } else if (next.every(d => d)) {
      onComplete(next.join(''))
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (digits[i]) {
        next[i] = ''
        setDigits(next)
      } else if (i > 0) {
        next[i - 1] = ''
        setDigits(next)
        refs.current[i - 1].focus()
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
      .replace(/[^0-9]/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    refs.current[focusIdx].focus()
    if (pasted.length === OTP_LENGTH) onComplete(pasted)
  }

  return (
    <div className="otp-wrap">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          className={`otp-box${error ? ' otp-box--error' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={d}
          autoFocus={i === 0}
          disabled={disabled}
          aria-label={`房間碼第 ${i + 1} 碼`}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  )
}

export default OtpInput
