import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts'

type StreakFlameCardProps = {
  streak: number
}

const STREAK_TARGET = 30
const FLAME_THRESHOLD = 14

function getStreakPercent(streak: number): number {
  return Math.max(0, Math.min(100, (streak / STREAK_TARGET) * 100))
}

export function StreakFlameCard({ streak }: StreakFlameCardProps) {
  const progress = getStreakPercent(streak)
  const hotStreak = streak >= FLAME_THRESHOLD

  const data = [
    {
      name: 'streak',
      value: progress,
      fill: hotStreak ? 'url(#hotRing)' : 'url(#coolRing)',
    },
  ]

  return (
    <article className="streak-card relative overflow-hidden rounded-3xl border border-white/70 p-6 sm:p-8">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Current Momentum
          </p>
          <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-900 sm:text-3xl">
            Study Streak
          </h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          Goal: {STREAK_TARGET} days
        </span>
      </div>

      <div className="relative h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="70%"
            outerRadius="96%"
            startAngle={215}
            endAngle={-35}
            barSize={18}
          >
            <defs>
              <linearGradient id="hotRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="52%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="coolRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background cornerRadius={16} />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="grid place-items-center rounded-full bg-white/80 p-6 shadow-md backdrop-blur">
            <span
              className={`text-5xl ${hotStreak ? 'flame-pulse' : 'snow-shimmer'}`}
              aria-label={hotStreak ? 'Flame icon' : 'Snowflake icon'}
            >
              {hotStreak ? '🔥' : '❄️'}
            </span>
            <p className="mt-3 text-center font-['Space_Grotesk'] text-3xl font-bold text-slate-900">
              {streak}
              <span className="ml-1 text-lg font-medium text-slate-500">days</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/70 bg-white/70 p-3">
          <p className="text-slate-500">Completion</p>
          <p className="mt-1 font-semibold text-slate-900">{Math.round(progress)}%</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/70 p-3">
          <p className="text-slate-500">Status</p>
          <p className="mt-1 font-semibold text-slate-900">
            {hotStreak ? 'Frozen Flame active' : 'Cold start building'}
          </p>
        </div>
      </div>
    </article>
  )
}
