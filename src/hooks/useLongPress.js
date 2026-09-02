import { useRef, useCallback, useState } from 'react'

const useLongPress = (onLongPress, delay = 600) => {
  const timerRef = useRef(null)
  const didFire = useRef(false)
  const [pressing, setPressing] = useState(false)

  const start = useCallback(() => {
    didFire.current = false
    setPressing(true)
    timerRef.current = setTimeout(() => {
      didFire.current = true
      setPressing(false)
      navigator.vibrate?.(15)
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current)
    setPressing(false)
  }, [])

  // 長按已觸發時抑制後續的 click（避免觸發 subScore）
  const wrapClick = useCallback((handler) => (e) => {
    if (didFire.current) { didFire.current = false; return }
    handler(e)
  }, [])

  return {
    pressing,
    delay,
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e) => e.preventDefault(),
    wrapClick,
  }
}

export default useLongPress
