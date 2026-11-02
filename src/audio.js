let context

export function prepareAudio() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext
    if (!Audio) return
    context ??= new Audio()
    if (context.state === 'suspended') context.resume().catch(() => {})
  } catch { /* Sound is optional; the game works without it. */ }
}

export function playNote(lane = 0, quiet = false) {
  if (!context || context.state !== 'running') return
  const now = context.currentTime
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime([261.63, 329.63, 392][lane], now)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(quiet ? 0.035 : 0.12, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.5)
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
}
