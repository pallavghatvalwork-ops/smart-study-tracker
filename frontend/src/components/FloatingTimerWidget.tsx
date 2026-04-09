import { useEffect, useMemo, useRef, useState } from 'react'
import { useTimer } from '../hooks/useTimer'
import { useAmbientStore } from '../store/useAmbientStore'

type SoundKey = 'rain' | 'cafe' | 'white'

type SoundMeta = {
  key: SoundKey
  label: string
  src: string
}

const sounds: SoundMeta[] = [
  {
    key: 'rain',
    label: 'Rain',
    src: 'https://cdn.pixabay.com/audio/2022/02/07/audio_200f4ea80f.mp3',
  },
  {
    key: 'cafe',
    label: 'Cafe',
    src: 'https://cdn.pixabay.com/audio/2021/10/22/audio_0eafb4f42f.mp3',
  },
  {
    key: 'white',
    label: 'White Noise',
    src: 'https://cdn.pixabay.com/audio/2023/06/24/audio_78f7ec5f9f.mp3',
  },
]

export function FloatingTimerWidget() {
  const { formatted, isRunning, progress, start, pause, reset } = useTimer(25 * 60)
  const { isPlaying, levels, togglePlaying, setLevel } = useAmbientStore()

  const [position, setPosition] = useState({ x: 24, y: 24 })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement | null>(null)

  const audioRefs = useRef<Record<SoundKey, HTMLAudioElement | null>>({
    rain: null,
    cafe: null,
    white: null,
  })

  useEffect(() => {
    const audios = audioRefs.current

    Object.entries(audios).forEach(([key, audio]) => {
      if (!audio) {
        return
      }

      audio.loop = true
      audio.volume = levels[key as SoundKey]

      if (isPlaying) {
        void audio.play().catch(() => {
          // Browser autoplay restrictions are expected until user interaction.
        })
      } else {
        audio.pause()
      }
    })
  }, [isPlaying, levels])

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!dragging || !widgetRef.current) {
        return
      }

      const nextX = Math.max(12, event.clientX - dragOffset.current.x)
      const nextY = Math.max(12, event.clientY - dragOffset.current.y)
      setPosition({ x: nextX, y: nextY })
    }

    const stopDragging = () => setDragging(false)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stopDragging)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stopDragging)
    }
  }, [dragging])

  const progressPercent = useMemo(() => Math.round(progress * 100), [progress])

  return (
    <section
      ref={widgetRef}
      className="fixed z-50 w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border border-white/70 bg-white/85 p-4 shadow-2xl backdrop-blur"
      style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
    >
      <header
        className="mb-3 flex cursor-grab items-center justify-between"
        onMouseDown={(event) => {
          if (!widgetRef.current) {
            return
          }

          setDragging(true)
          const rect = widgetRef.current.getBoundingClientRect()
          dragOffset.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          }
        }}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Focus Session
          </p>
          <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">Floating Timer</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {dragging ? 'Dragging' : 'Draggable'}
        </span>
      </header>

      <div className="rounded-xl bg-slate-900 px-4 py-3 text-white">
        <p className="text-center font-['Space_Grotesk'] text-3xl font-bold tracking-wide">{formatted}</p>
        <div className="mt-3 h-1.5 rounded-full bg-white/20">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-orange-300 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          onClick={isRunning ? pause : start}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          onClick={() => reset()}
        >
          Reset
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ambient Mix</p>
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
            onClick={togglePlaying}
          >
            {isPlaying ? 'Mute' : 'Play'}
          </button>
        </div>

        <div className="space-y-2">
          {sounds.map((sound) => (
            <label key={sound.key} className="block rounded-lg bg-slate-50 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>{sound.label}</span>
                <span>{Math.round(levels[sound.key] * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(levels[sound.key] * 100)}
                className="w-full"
                onChange={(event) => setLevel(sound.key, Number(event.target.value) / 100)}
              />
              <audio
                ref={(el) => {
                  audioRefs.current[sound.key] = el
                }}
                src={sound.src}
                preload="none"
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}
