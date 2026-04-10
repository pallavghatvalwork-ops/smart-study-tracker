import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

type StudyLog = {
  topic: string
  plannedHours: number
  completedHours: number
}

const logs: StudyLog[] = [
  { topic: 'Math', plannedHours: 12, completedHours: 7.2 },
  { topic: 'DSA', plannedHours: 10, completedHours: 9.1 },
  { topic: 'DBMS', plannedHours: 8, completedHours: 5.1 },
  { topic: 'OS', plannedHours: 7, completedHours: 4.3 },
  { topic: 'Networks', plannedHours: 9, completedHours: 8.5 },
]

function weightedCompletion(planned: number, completed: number): number {
  if (planned <= 0) {
    return 0
  }

  const ratio = completed / planned
  const confidenceWeight = Math.min(1.2, 0.75 + planned / 24)
  return Math.max(0, Math.min(1.2, ratio * confidenceWeight))
}

export function TopicGapAnalyzer() {
  const chartData = logs.map((entry) => ({
    topic: entry.topic,
    planned: Math.round(entry.plannedHours * 10),
    actual: Math.round(entry.completedHours * 10),
    score: weightedCompletion(entry.plannedHours, entry.completedHours),
  }))

  const redZoneTopics = chartData.filter((entry) => entry.score < 0.7)

  return (
    <section className="streak-card rounded-3xl border border-white/70 p-6 sm:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Topic Gap Analyzer</p>
          <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-900 sm:text-3xl">
            Planned vs Actual Radar
          </h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          Weighted local heuristic
        </span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="72%">
            <PolarGrid stroke="#cbd5e1" strokeOpacity={0.5} />
            <PolarAngleAxis dataKey="topic" tick={{ fill: '#334155', fontSize: 12 }} />
            <Radar
              name="Planned"
              dataKey="planned"
              stroke="#0284c7"
              fill="#38bdf8"
              fillOpacity={0.24}
            />
            <Radar
              name="Actual"
              dataKey="actual"
              stroke="#f97316"
              fill="#fb923c"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Red Zone Topics</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {redZoneTopics.length > 0 ? (
            redZoneTopics.map((topic) => (
              <span
                key={topic.topic}
                className="rounded-full border border-red-300 bg-white px-3 py-1 text-sm font-semibold text-red-700"
              >
                {topic.topic}
              </span>
            ))
          ) : (
            <span className="text-sm font-semibold text-emerald-700">No red zones. Strong execution.</span>
          )}
        </div>
      </div>
    </section>
  )
}
