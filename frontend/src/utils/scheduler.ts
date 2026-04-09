export type StudyTask = {
  id: string
  title: string
  durationMin: number
  scheduledAt: Date
}

export type CalendarBusyBlock = {
  start: Date
  end: Date
}

export type ProductivityMap = Record<number, number>

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA
}

export function findNextBestSlot(
  task: StudyTask,
  calendar: CalendarBusyBlock[],
  userProductivityMap: ProductivityMap,
): Date {
  const now = new Date()
  const taskMs = task.durationMin * 60 * 1000

  let bestStart: Date | null = null
  let bestScore = -1

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    for (let hour = 6; hour <= 22; hour += 1) {
      for (const minute of [0, 30]) {
        const start = new Date(now)
        start.setDate(now.getDate() + dayOffset)
        start.setHours(hour, minute, 0, 0)

        if (start <= now) {
          continue
        }

        const end = new Date(start.getTime() + taskMs)
        const isBusy = calendar.some((block) => overlaps(start, end, block.start, block.end))

        if (isBusy) {
          continue
        }

        const productivity = userProductivityMap[start.getHours()] ?? 0.4
        const proximityBonus = dayOffset === 0 ? 0.15 : Math.max(0, 0.12 - dayOffset * 0.02)
        const score = productivity + proximityBonus

        if (score > bestScore) {
          bestScore = score
          bestStart = start
        }
      }
    }
  }

  return bestStart ?? new Date(now.getTime() + 24 * 60 * 60 * 1000)
}
