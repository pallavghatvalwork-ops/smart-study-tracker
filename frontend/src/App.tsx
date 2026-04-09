import { FloatingTimerWidget } from './components/FloatingTimerWidget'
import { StreakFlameCard } from './components/StreakFlameCard'
import { useStreak } from './hooks/useStreak'

function App() {
  const { streak, loading } = useStreak()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-8 rounded-3xl border border-white/60 bg-white/65 p-6 shadow-sm backdrop-blur sm:mb-10 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Smart Study Tracker
        </p>
        <h1 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold text-slate-900 sm:text-5xl">
          Momentum Board
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Visualize streak energy in real-time. As your consistency rises, the frozen core ignites
          into a flame.
        </p>
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

      <FloatingTimerWidget />
    </main>
  )
}

export default App
