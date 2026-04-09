import { useEffect, useMemo, useState } from 'react'
import { FloatingTimerWidget } from './components/FloatingTimerWidget'
import { MemoryDecayPanel } from './components/MemoryDecayPanel'
import { StudyPresence } from './components/StudyPresence'
import { StreakFlameCard } from './components/StreakFlameCard'
import { TodayPlan } from './components/TodayPlan'
import { TopicGapAnalyzer } from './components/TopicGapAnalyzer'
import { WeeklyRecapExport } from './components/WeeklyRecapExport'
import { useStreak } from './hooks/useStreak'

type DayTheme = 'morning' | 'afternoon' | 'night'

function getThemeByHour(hour: number): DayTheme {
  if (hour >= 5 && hour < 12) {
    return 'morning'
  }

  if (hour >= 12 && hour < 19) {
    return 'afternoon'
  }

  return 'night'
}

function App() {
  const { streak, loading } = useStreak()
  const [theme, setTheme] = useState<DayTheme>(() => getThemeByHour(new Date().getHours()))

  useEffect(() => {
    const updateTheme = () => setTheme(getThemeByHour(new Date().getHours()))
    const timer = window.setInterval(updateTheme, 60 * 1000)
    updateTheme()

    return () => window.clearInterval(timer)
  }, [])

  const themeClass = useMemo(() => {
    if (theme === 'morning') {
      return 'bg-gradient-to-br from-sky-100 via-cyan-50 to-white'
    }

    if (theme === 'afternoon') {
      return 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100'
    }

    return 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-slate-100'
  }, [theme])

  return (
    <main
      className={`mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 transition-colors duration-1000 sm:px-8 sm:py-10 ${themeClass}`}
    >
      <header className="mb-8 rounded-3xl border border-white/60 bg-white/65 p-6 shadow-sm backdrop-blur sm:mb-10 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Smart Study Tracker
            </p>
            <h1 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold text-slate-900 sm:text-5xl">
              Momentum Board
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Visualize streak energy in real-time. As your consistency rises, the frozen core
              ignites into a flame.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StudyPresence />
            <WeeklyRecapExport />
          </div>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
        <StreakFlameCard streak={streak} />

        <aside className="streak-card rounded-3xl border border-white/70 p-6 sm:p-8">
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">Pulse Snapshot</h2>
          <ul className="mt-5 space-y-4 text-sm text-slate-600">
            <li className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sync</p>
              <p className="mt-1 font-semibold text-slate-900">
                {loading ? 'Fetching Supabase streak...' : 'Connected with local fallback support'}
              </p>
            </li>
            <li className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ignition Threshold</p>
              <p className="mt-1 font-semibold text-slate-900">14 day streak</p>
            </li>
            <li className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Engine</p>
              <p className="mt-1 font-semibold text-slate-900">Recharts RadialBarChart</p>
            </li>
          </ul>
        </aside>
      </section>

      <section className="mt-5">
        <TopicGapAnalyzer />
      </section>

      <section className="mt-5">
        <TodayPlan />
      </section>

      <section className="mt-5">
        <MemoryDecayPanel />
      </section>

      <FloatingTimerWidget />
    </main>
  )
}

export default App
