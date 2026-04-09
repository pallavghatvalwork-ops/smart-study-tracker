export type FlashcardItem = {
  id: string
  topic: string
  lastReviewedAt: Date
}

export function calculateDecayScore(lastReviewedAt: Date, now = new Date()): number {
  const elapsedMs = now.getTime() - lastReviewedAt.getTime()
  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60))
  const halfLifeHours = 48

  const score = Math.exp((-Math.log(2) * elapsedHours) / halfLifeHours)
  return Math.max(0, Math.min(1, score))
}

export function decayColor(score: number): string {
  if (score >= 0.66) {
    return '#16a34a'
  }

  if (score >= 0.36) {
    return '#eab308'
  }

  return '#dc2626'
}

export function decayLabel(score: number): string {
  if (score >= 0.66) {
    return 'Fresh'
  }

  if (score >= 0.36) {
    return 'Fading'
  }

  return 'Review Due'
}
