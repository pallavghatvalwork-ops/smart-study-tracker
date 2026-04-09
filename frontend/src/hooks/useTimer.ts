import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type TimerState = {
  remainingMs: number
  isRunning: boolean
  formatted: string
  progress: number
  start: () => void
  pause: () => void
  reset: (seconds?: number) => void
}

const DEFAULT_FOCUS_SECONDS = 25 * 60

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function useTimer(initialSeconds = DEFAULT_FOCUS_SECONDS): TimerState {
  const [durationMs, setDurationMs] = useState(initialSeconds * 1000)
  const [remainingMs, setRemainingMs] = useState(initialSeconds * 1000)
  const [isRunning, setIsRunning] = useState(false)

  const endAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    endAtRef.current = null
    stopRaf()
  }, [stopRaf])

  const tick = useCallback(() => {
    if (!endAtRef.current) {
      return
    }

    const nextRemaining = Math.max(0, endAtRef.current - performance.now())
    setRemainingMs(nextRemaining)

    if (nextRemaining <= 0) {
      pause()
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [pause])

  const start = useCallback(() => {
    if (isRunning) {
      return
    }

    setIsRunning(true)
    endAtRef.current = performance.now() + remainingMs
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [isRunning, remainingMs, stopRaf, tick])

  const reset = useCallback(
    (seconds?: number) => {
      const nextDuration = (seconds ?? durationMs / 1000) * 1000
      pause()
      setDurationMs(nextDuration)
      setRemainingMs(nextDuration)
    },
    [durationMs, pause],
  )

  useEffect(() => {
    return () => stopRaf()
  }, [stopRaf])

  const formatted = useMemo(() => formatMs(remainingMs), [remainingMs])
  const progress = useMemo(() => 1 - remainingMs / durationMs, [durationMs, remainingMs])

  return {
    remainingMs,
    isRunning,
    formatted,
    progress,
    start,
    pause,
    reset,
  }
}
