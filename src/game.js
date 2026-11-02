export const LANE_KEYS = ['a', 's', 'd']
export const HIT_WINDOW = 240
export const APPROACH_TIME = 1600
export const REQUIRED_HITS = 50
export const GAME_DURATION = 30000
// Measured against this exact Apple Music preview: 130 BPM, beat phase ~230 ms.
export const BEAT_MS = 60000 / 130
export const BEAT_OFFSET = 230
const FIRST_NOTE = BEAT_OFFSET + Math.ceil((APPROACH_TIME - BEAT_OFFSET) / BEAT_MS) * BEAT_MS
export const NOTE_COUNT = Math.floor((GAME_DURATION - HIT_WINDOW - FIRST_NOTE) / BEAT_MS) + 1

const lanes = [0, 1, 2, 1, 0, 2, 0, 1, 2, 2, 1, 0, 1, 2, 0, 1]
export const createNotes = () => Array.from({ length: NOTE_COUNT }, (_, id) => ({ id, lane: lanes[id % lanes.length], at: FIRST_NOTE + id * BEAT_MS }))

export function findHit(notes, resolved, lane, elapsed) {
  return notes
    .filter(note => note.lane === lane && !resolved.has(note.id) && Math.abs(note.at - elapsed) <= HIT_WINDOW)
    .sort((a, b) => Math.abs(a.at - elapsed) - Math.abs(b.at - elapsed))[0] ?? null
}

export function getAccuracy(delta) {
  return Math.abs(delta) <= 110 ? 'Идеально!' : 'В ритме!'
}

export function getProgress(hits) {
  return Math.min(100, Math.round(hits / REQUIRED_HITS * 100))
}

const calmPattern = [0, 1, 2, 1, 0, 2, 1, 0]
export const calmSequence = Array.from({ length: REQUIRED_HITS }, (_, index) => calmPattern[index % calmPattern.length])
