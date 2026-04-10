import type { CSSProperties } from 'react'
import { calculateDecayScore, decayColor, decayLabel, type FlashcardItem } from '../utils/memoryDecay'

const flashcards: FlashcardItem[] = [
  {
    id: 'fc-1',
    topic: 'TCP 3-way handshake',
    lastReviewedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 'fc-2',
    topic: 'AVL tree rotations',
    lastReviewedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
  },
  {
    id: 'fc-3',
    topic: 'Deadlock conditions',
    lastReviewedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
]

export function MemoryDecayPanel() {
  return (
    <section className="streak-card rounded-3xl border border-white/70 p-6 sm:p-8">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Spaced Repetition Lite</p>
        <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-900 sm:text-3xl">
          Memory Decay Tracker
        </h2>
      </div>

      <div className="space-y-4">
        {flashcards.map((card) => {
          const score = calculateDecayScore(card.lastReviewedAt)
          const color = decayColor(score)
          const label = decayLabel(score)
          const percent = Math.round(score * 100)

          return (
            <article
              key={card.id}
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-slate-900">{card.topic}</p>
                <span className="text-sm font-semibold" style={{ color }}>
                  {label}
                </span>
              </div>

              <div className="h-3 rounded-full bg-slate-200/80 p-[2px]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out w-[var(--decay-width)] bg-[color:var(--decay-color)]"
                  style={
                    {
                      '--decay-width': `${percent}%`,
                      '--decay-color': color,
                    } as CSSProperties
                  }
                />
              </div>

              <p className="mt-2 text-xs text-slate-600">Decay score: {percent}%</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
