import { useCallback, useEffect, useRef, useState } from 'react'
import type { BubblePriority } from '@shared/types/growth'

const AUTO_HIDE_MS = 5000
const AUTO_HIDE_LOW_MS = 4000
const AUTO_HIDE_HIGH_MS = 8000
const FADE_MS = 500

export type BubblePhase = 'hidden' | 'visible' | 'fading'

const PRIORITY_RANK: Record<BubblePriority, number> = {
  high: 3,
  normal: 2,
  low: 1
}

function hideDelay(priority: BubblePriority): number {
  if (priority === 'high') return AUTO_HIDE_HIGH_MS
  if (priority === 'low') return AUTO_HIDE_LOW_MS
  return AUTO_HIDE_MS
}

export function useSpeechBubble() {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<BubblePhase>('hidden')
  const [priority, setPriority] = useState<BubblePriority>('low')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priorityRef = useRef<BubblePriority>('low')
  const phaseRef = useRef<BubblePhase>('hidden')

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }, [])

  const finishHide = useCallback(() => {
    clearTimers()
    setPhase('hidden')
    setText('')
    priorityRef.current = 'low'
  }, [clearTimers])

  const beginFade = useCallback(() => {
    clearTimers()
    setPhase('fading')
    fadeTimerRef.current = setTimeout(finishHide, FADE_MS)
  }, [clearTimers, finishHide])

  const scheduleHide = useCallback(
    (nextPriority: BubblePriority) => {
      clearTimers()
      hideTimerRef.current = setTimeout(beginFade, hideDelay(nextPriority))
    },
    [beginFade, clearTimers]
  )

  const show = useCallback(
    (message?: string, nextPriority: BubblePriority = 'normal') => {
      if (
        phaseRef.current !== 'hidden' &&
        PRIORITY_RANK[nextPriority] < PRIORITY_RANK[priorityRef.current]
      ) {
        return
      }

      clearTimers()
      if (message) setText(message)
      priorityRef.current = nextPriority
      setPriority(nextPriority)
      setPhase('visible')
      scheduleHide(nextPriority)
    },
    [clearTimers, scheduleHide]
  )

  const hide = useCallback(() => {
    if (phaseRef.current === 'hidden') return
    beginFade()
  }, [beginFade])

  const pauseAutoHide = useCallback(() => {
    clearTimers()
    if (phaseRef.current === 'fading') {
      setPhase('visible')
    }
  }, [clearTimers])

  const resumeAutoHide = useCallback(() => {
    if (phaseRef.current !== 'visible') return
    scheduleHide(priorityRef.current)
  }, [scheduleHide])

  return {
    text,
    phase,
    visible: phase !== 'hidden',
    priority,
    show,
    hide,
    pauseAutoHide,
    resumeAutoHide
  }
}
