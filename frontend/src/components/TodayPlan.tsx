import { useMemo, useState } from 'react'
import { findNextBestSlot } from '../utils/scheduler'
import type { CalendarBusyBlock, ProductivityMap, StudyTask } from '../utils/scheduler'
import { useInteractionStore } from '../store/useInteractionStore'

type PlanTask = StudyTask & {
  completing?: boolean
}

function formatDateTime(value: Date): string {
  return value.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildCalendar(): CalendarBusyBlock[] {
  const now = new Date()
  const blocks: CalendarBusyBlock[] = []

  for (let i = 0; i < 7; i += 1) {
    const morningClassStart = new Date(now)
    morningClassStart.setDate(now.getDate() + i)
    morningClassStart.setHours(9, 0, 0, 0)

    const morningClassEnd = new Date(now)
    morningClassEnd.setDate(now.getDate() + i)
    morningClassEnd.setHours(12, 0, 0, 0)

    const eveningBlockStart = new Date(now)
    eveningBlockStart.setDate(now.getDate() + i)
    eveningBlockStart.setHours(18, 0, 0, 0)

    const eveningBlockEnd = new Date(now)
    eveningBlockEnd.setDate(now.getDate() + i)
    eveningBlockEnd.setHours(20, 30, 0, 0)

    blocks.push(
      { start: morningClassStart, end: morningClassEnd },
      { start: eveningBlockStart, end: eveningBlockEnd },
    )
  }

  return blocks
}

const productivityMap: ProductivityMap = {
  6: 0.45,
  7: 0.55,
  8: 0.62,
  9: 0.58,
  10: 0.6,
  11: 0.59,
  12: 0.5,
  13: 0.52,
  14: 0.66,
  15: 0.73,
  16: 0.82,
  17: 0.79,
  18: 0.58,
  19: 0.54,
  20: 0.64,
  21: 0.76,
  22: 0.68,
}

export function TodayPlan() {
  const triggerSnapFeedback = useInteractionStore((state) => state.triggerSnapFeedback)

  const [tasks, setTasks] = useState<PlanTask[]>(() => {
    const now = new Date()

    return [
      {
        id: 'task-1',
        title: 'Revise DSA recursion patterns',
        durationMin: 75,
        scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0, 0),
      },
      {
        id: 'task-2',
        title: 'DBMS transaction logs worksheet',
        durationMin: 60,
        scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30, 0, 0),
      },
      {
        id: 'task-3',
        title: 'Practice OS scheduling numericals',
        durationMin: 50,
        scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 30, 0, 0),
      },
    ]
  })

  const calendar = useMemo(() => buildCalendar(), [])

  const completeTask = (task: PlanTask) => {
    triggerSnapFeedback()

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completing: true,
            }
          : item,
      ),
    )

    window.setTimeout(() => {
      setTasks((previous) => previous.filter((item) => item.id !== task.id))
    }, 420)
  }

  const reschedule = (task: StudyTask) => {
    const nextSlot = findNextBestSlot(task, calendar, productivityMap)

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? {
              ...item,
              scheduledAt: nextSlot,
            }
          : item,
      ),
    )
  }

  return (
    <section className="streak-card rounded-3xl border border-white/70 p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Today&apos;s Plan</p>
          <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-900 sm:text-3xl">
            Context-Aware Reschedule
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <article
            key={task.id}
            className={`flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3 ${task.completing ? 'snap-row-out' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button
                title="Mark complete"
                aria-label="Mark complete"
                className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full border border-slate-300 bg-white text-xs text-slate-600 ${task.completing ? 'snap-check' : ''}`}
                onClick={() => completeTask(task)}
                disabled={Boolean(task.completing)}
              >
                ✓
              </button>
              <div>
                <h3 className="font-semibold text-slate-900">{task.title}</h3>
                <p className="text-sm text-slate-600">
                  {task.durationMin} mins • {formatDateTime(task.scheduledAt)}
                </p>
              </div>
            </div>

            <button
              title="Find next best slot"
              aria-label="Find next best slot"
              className="rounded-full border border-slate-300 bg-white p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              onClick={() => reschedule(task)}
              disabled={Boolean(task.completing)}
            >
              ↻
            </button>
          </article>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          All tasks completed. Crisp execution.
        </div>
      )}
    </section>
  )
}
