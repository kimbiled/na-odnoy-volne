export const LANE_KEYS = ['a', 's', 'd']
export const HIT_WINDOW = 240
export const APPROACH_TIME = 1700
export const REQUIRED_HITS = 10
export const NOTE_COUNT = 16
export const GAME_DURATION = 13000

const lanes = [0, 1, 2, 1, 0, 2, 0, 1, 2, 2, 1, 0, 1, 2, 0, 1]
export const createNotes = () => lanes.map((lane, id) => ({ id, lane, at: 1600 + id * 680 }))

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

export const calmSequence = [0, 1, 2, 1, 0, 2, 1, 0]
