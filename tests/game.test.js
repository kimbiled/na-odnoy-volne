import { test } from 'node:test'
import assert from 'node:assert/strict'
import { APPROACH_TIME, BEAT_MS, BEAT_OFFSET, GAME_DURATION, HIT_WINDOW, NOTE_COUNT, REQUIRED_HITS, calmSequence, createNotes, findHit, getAccuracy, getProgress } from '../src/game.js'

test('the whole chart is playable before the timer finishes', () => {
  const notes = createNotes()
  assert.equal(notes.length, NOTE_COUNT)
  assert.equal(new Set(notes.map(note => note.id)).size, NOTE_COUNT)
  assert.ok(notes.every(note => [0, 1, 2].includes(note.lane)))
  assert.ok(notes.at(-1).at + HIT_WINDOW < GAME_DURATION)
  assert.ok(notes[0].at > 1000)
  assert.ok(APPROACH_TIME > HIT_WINDOW)
})

test('timing windows accept exact edges and reject late taps and wrong lanes', () => {
  const [note] = createNotes()
  assert.equal(findHit([note], new Set(), note.lane, note.at + HIT_WINDOW)?.id, note.id)
  assert.equal(findHit([note], new Set(), note.lane, note.at - HIT_WINDOW)?.id, note.id)
  assert.equal(findHit([note], new Set(), note.lane, note.at + HIT_WINDOW + 1), null)
  assert.equal(findHit([note], new Set(), (note.lane + 1) % 3, note.at), null)
})

test('a scored note cannot be scored twice; the closest note wins', () => {
  const notes = [{ id: 1, lane: 0, at: 1000 }, { id: 2, lane: 0, at: 1200 }]
  assert.equal(findHit(notes, new Set(), 0, 1150)?.id, 2)
  assert.equal(findHit(notes, new Set([2]), 0, 1150)?.id, 1)
  assert.equal(findHit(notes, new Set([1, 2]), 0, 1150), null)
})

test('winning threshold and feedback remain bounded', () => {
  assert.equal(getProgress(0), 0)
  assert.equal(getProgress(REQUIRED_HITS), 100)
  assert.equal(getProgress(NOTE_COUNT), 100)
  assert.equal(getAccuracy(0), 'Идеально!')
  assert.equal(getAccuracy(-110), 'Идеально!')
  assert.equal(getAccuracy(150), 'В ритме!')
  assert.equal(REQUIRED_HITS, 50)
  assert.equal(calmSequence.length, REQUIRED_HITS)
  assert.ok(calmSequence.every(lane => [0, 1, 2].includes(lane)))
})

test('the chart follows the measured song beat and lasts long enough for 50 points', () => {
  const notes = createNotes()
  assert.ok(notes.length > 50)
  assert.ok(notes[49].at > 23000)
  assert.ok(GAME_DURATION >= 30000)
  for (const note of notes) {
    const beat = (note.at - BEAT_OFFSET) / BEAT_MS
    assert.ok(Math.abs(beat - Math.round(beat)) < 1e-8)
  }
})
