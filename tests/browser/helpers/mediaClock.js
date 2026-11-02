// A controllable media clock for timing tests; real AAC playback is checked in music.spec.js.
export async function installMediaClock(page) {
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      constructor(source) {
        super()
        this.src = source
        this.paused = true
        this.error = null
        this.muted = false
        this.duration = 30.019
        this.readyState = 4
        this.offset = 0
        this.startedAt = 0
        window.__gameAudio = this
      }
      get currentTime() { return Math.min(this.duration, this.offset + (this.paused ? 0 : (performance.now() - this.startedAt) / 1000)) }
      set currentTime(value) { this.offset = value; this.startedAt = performance.now() }
      play() { if (this.paused) this.startedAt = performance.now(); this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve() }
      pause() { this.offset = this.currentTime; this.paused = true }
      load() {}
      removeAttribute(name) { if (name === 'src') this.src = '' }
    }
  })
}
