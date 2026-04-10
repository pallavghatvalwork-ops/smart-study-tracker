import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useFocusPresenceStore } from '../store/useFocusPresenceStore'

type PresenceUser = {
  id: string
  name: string
  subject: string
  is_focusing: boolean
}

const fallbackUsers: PresenceUser[] = [
  { id: 'u1', name: 'Alex', subject: 'Math', is_focusing: true },
  { id: 'u2', name: 'Meera', subject: 'DBMS', is_focusing: true },
  { id: 'u3', name: 'Aarav', subject: 'OS', is_focusing: false },
]

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function isPresenceUser(value: unknown): value is PresenceUser {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as PresenceUser
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.is_focusing === 'boolean'
  )
}

export function StudyPresence() {
  const isFocusing = useFocusPresenceStore((state) => state.isFocusing)
  const [members, setMembers] = useState<PresenceUser[]>(fallbackUsers)
  const [toast, setToast] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)

  const myId = useMemo(() => {
    const fromStorage = localStorage.getItem('sst_user_id')
    if (fromStorage) {
      return fromStorage
    }

    const generated = `user-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem('sst_user_id', generated)
    return generated
  }, [])

  useEffect(() => {
    if (!supabase) {
      return
    }

    const channel = supabase.channel('study-together-presence', {
      config: {
        presence: {
          key: myId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const flattenedEntries = Object.values(state).flat() as unknown[]
        const allMembers: PresenceUser[] = flattenedEntries
          .filter(isPresenceUser)
          .filter((entry) => entry.is_focusing)

        setMembers((previous) => {
          const others = previous.filter((item) => item.id.startsWith('u'))
          return [...others, ...allMembers]
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel
          await channel.track({
            id: myId,
            name: 'You',
            subject: 'Current Session',
            is_focusing: isFocusing,
          })
        }
      })

    return () => {
      channelRef.current = null
      void channel.unsubscribe()
    }
  }, [myId])

  useEffect(() => {
    if (!supabase || !channelRef.current) {
      return
    }

    void channelRef.current.track({
      id: myId,
      name: 'You',
      subject: 'Current Session',
      is_focusing: isFocusing,
    })
  }, [isFocusing, myId])

  const activeFriends = members.filter((member) => member.is_focusing && member.name !== 'You')

  const showToast = (name: string, subject: string) => {
    setToast(`${name} is grinding ${subject} too`)
    window.setTimeout(() => setToast(null), 2100)
  }

  return (
    <div className="relative">
      <button
        className="group flex items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-3 py-2"
        onClick={() => {
          if (activeFriends[0]) {
            showToast(activeFriends[0].name, activeFriends[0].subject)
          }
        }}
      >
        <div className="flex -space-x-2">
          {activeFriends.slice(0, 3).map((friend) => (
            <span
              key={friend.id}
              className="relative grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white"
            >
              {initials(friend.name)}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />
            </span>
          ))}
          {activeFriends.length === 0 && (
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600">
              0
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-700">Study Together</p>
      </button>

      {toast && (
        <div className="absolute right-0 top-12 w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
