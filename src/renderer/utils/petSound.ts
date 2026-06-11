let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function tone(freq: number, durationMs: number, volume = 0.08): void {
  const ctx = getCtx()
  if (!ctx) return
  void ctx.resume()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.value = volume
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + durationMs / 1000)
}

export function playPetClick(): void {
  tone(660, 60, 0.05)
}

export function playHappy(): void {
  tone(523, 80, 0.06)
  setTimeout(() => tone(784, 100, 0.05), 70)
}

export function playRemind(): void {
  tone(440, 120, 0.07)
  setTimeout(() => tone(392, 140, 0.06), 130)
}

export function playLevelUp(): void {
  tone(523, 90, 0.06)
  setTimeout(() => tone(659, 90, 0.06), 90)
  setTimeout(() => tone(784, 120, 0.05), 180)
}
