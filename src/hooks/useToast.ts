import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast(duration = 2600) {
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const notify = useCallback((nextMessage: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    setMessage(nextMessage)
    timer.current = window.setTimeout(() => {
      setMessage('')
      timer.current = null
    }, duration)
  }, [duration])

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  return { message, notify }
}
