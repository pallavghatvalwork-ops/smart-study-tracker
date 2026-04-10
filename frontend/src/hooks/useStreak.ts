import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type StreakState = {
  streak: number
  loading: boolean
}

const FALLBACK_STREAK = 11

export function useStreak(): StreakState {
  const [streak, setStreak] = useState<number>(FALLBACK_STREAK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadStreak() {
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('user_streak')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (!error && data?.user_streak !== undefined && data?.user_streak !== null) {
        setStreak(Number(data.user_streak) || FALLBACK_STREAK)
      }

      setLoading(false)
    }

    loadStreak()

    return () => {
      isMounted = false
    }
  }, [])

  return { streak, loading }
}
