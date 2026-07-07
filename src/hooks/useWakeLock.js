import { useEffect, useRef } from 'react'

const useWakeLock = () => {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    let cancelled = false

    const acquire = async () => {
      try {
        lockRef.current = await navigator.wakeLock.request('screen')
        lockRef.current.addEventListener('release', () => {
          if (!cancelled) lockRef.current = null
        })
      } catch {
        // 使用者拒絕或瀏覽器不支援，靜默失敗
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !lockRef.current) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (lockRef.current) {
        lockRef.current.release()
        lockRef.current = null
      }
    }
  }, [])
}

export default useWakeLock
