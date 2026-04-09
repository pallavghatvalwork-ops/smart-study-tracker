import { create } from 'zustand'

type FocusPresenceState = {
  isFocusing: boolean
  setFocusing: (focusing: boolean) => void
}

export const useFocusPresenceStore = create<FocusPresenceState>((set) => ({
  isFocusing: false,
  setFocusing: (focusing) => set({ isFocusing: focusing }),
}))
