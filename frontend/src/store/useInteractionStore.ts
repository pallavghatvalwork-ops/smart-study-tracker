import { create } from 'zustand'

type InteractionState = {
  triggerSnapFeedback: () => void
}

export const useInteractionStore = create<InteractionState>(() => ({
  triggerSnapFeedback: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },
}))
