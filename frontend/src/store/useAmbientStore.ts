import { create } from 'zustand'

type SoundKey = 'rain' | 'cafe' | 'white'

type AmbientState = {
  isPlaying: boolean
  levels: Record<SoundKey, number>
  togglePlaying: () => void
  setLevel: (sound: SoundKey, level: number) => void
}

export const useAmbientStore = create<AmbientState>((set) => ({
  isPlaying: false,
  levels: {
    rain: 0.35,
    cafe: 0.25,
    white: 0.2,
  },
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setLevel: (sound, level) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [sound]: Math.max(0, Math.min(1, level)),
      },
    })),
}))
