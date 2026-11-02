import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Heart, Music2, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { APPROACH_TIME, GAME_DURATION, HIT_WINDOW, NOTE_COUNT, REQUIRED_HITS, calmSequence, createNotes, findHit, getAccuracy, getProgress } from '../game'
import { playNote, prepareAudio } from '../audio'

export default function RhythmGame({ onUnlock, sound, onSoundChange }) {
  const [phase, setPhase] = useState('intro')
  const [mode, setMode] = useState('rhythm')
  const [elapsed, setElapsed] = useState(0)
  const [hits, setHits] = useState(0)
  const [feedback, setFeedback] = useState('Слушай. Чувствуй. Касайся.')
  const [activeLane, setActiveLane] = useState(-1)
  const [calmStep, setCalmStep] = useState(0)
  const [combo, setCombo] = useState(0)
  const notes = useRef(createNotes())
  const resolved = useRef(new Set())
  const played = useRef(new Set())
  const clock = useRef({ start: 0, offset: 0, elapsed: 0 })
  const hitCount = useRef(0)
  const laneTimer = useRef(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => () => clearTimeout(laneTimer.current), [])

  const begin = () => {
    if (sound) prepareAudio()
    resolved.current = new Set()
    played.current = new Set()
    hitCount.current = 0
    clock.current = { start: performance.now(), offset: 0, elapsed: 0 }
    setElapsed(0); setHits(0); setCombo(0); setCalmStep(0)
    setFeedback(mode === 'calm' ? 'Повтори мелодию по подсказке' : 'Лови ноты на светлой линии')
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'rhythm') return
    let frame
    const update = now => {
      const time = now - clock.current.start + clock.current.offset
      clock.current.elapsed = time
      setElapsed(time)
      for (const note of notes.current) {
        if (time >= note.at && !played.current.has(note.id)) {
          played.current.add(note.id)
          if (sound) playNote(note.lane, true)
        }
        if (time > note.at + HIT_WINDOW && !resolved.current.has(note.id)) {
          resolved.current.add(note.id)
          setCombo(0)
        }
      }
      if (time >= GAME_DURATION) {
        setPhase(hitCount.current >= REQUIRED_HITS ? 'won' : 'retry')
        return
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [phase, mode, sound])

  const pause = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    clock.current.offset = clock.current.elapsed
    setPhase('paused')
  }, [])

  useEffect(() => {
    const hidden = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', hidden)
    return () => document.removeEventListener('visibilitychange', hidden)
  }, [pause])

  const resume = () => {
    if (sound) prepareAudio()
    clock.current.start = performance.now()
    setPhase('playing')
  }

  const tap = useCallback(lane => {
    if (phase !== 'playing') return
    clearTimeout(laneTimer.current)
    setActiveLane(lane)
    laneTimer.current = setTimeout(() => setActiveLane(-1), 160)
    if (mode === 'calm') {
      if (lane !== calmSequence[calmStep]) {
        setFeedback('Попробуй подсвеченную ноту ♡')
        return
      }
      if (sound) playNote(lane)
      const next = calmStep + 1
      setCalmStep(next)
      setHits(Math.round(next / calmSequence.length * REQUIRED_HITS))
      setFeedback(next === calmSequence.length ? 'Это наша мелодия!' : 'Да, именно так!')
      if (next === calmSequence.length) setPhase('won')
      return
    }
    const time = performance.now() - clock.current.start + clock.current.offset
    const note = findHit(notes.current, resolved.current, lane, time)
    if (!note) {
      setFeedback('Чуть ближе к линии — и получится')
      return
    }
    resolved.current.add(note.id)
    hitCount.current += 1
    setHits(hitCount.current)
    setCombo(value => value + 1)
    setFeedback(getAccuracy(note.at - time))
    if (sound) playNote(lane)
    if (hitCount.current >= REQUIRED_HITS) setPhase('won')
  }, [phase, mode, calmStep, sound])

  useEffect(() => {
    const keydown = event => {
      const lane = { a: 0, s: 1, d: 2, ф: 0, ы: 1, в: 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 }[event.key]
      if (lane !== undefined && phase === 'playing' && !event.repeat) { event.preventDefault(); tap(lane) }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [phase, tap])

  const toggleSound = () => {
    if (!sound) prepareAudio()
    onSoundChange(!sound)
  }

  if (phase === 'won') return <div className="game-result" data-testid="game-won">
    <div className="result-icon"><Heart size={40} fill="currentColor" /></div>
    <span className="eyebrow">СЕКРЕТ ОТКРЫТ</span>
    <h2>Кажется, у нас<br />совпадает ритм.</h2>
    <p>А теперь — кое-что, что я давно хотел предложить.</p>
    <button className="button button-dark" onClick={onUnlock}>Посмотреть приглашение <ArrowRight size={18} /></button>
    <span className="result-footnote">Эта мелодия была только для тебя ♡</span>
  </div>

  if (phase === 'retry') return <div className="game-result">
    <div className="result-icon"><Music2 size={40} /></div>
    <span className="eyebrow">УЖЕ ПОЧТИ</span>
    <h2>Ещё один<br />маленький дубль?</h2>
    <p>Ты поймала {hits} из {REQUIRED_HITS} нужных нот. Попробуем снова или сыграем без спешки?</p>
    <button className="button button-dark" onClick={begin}><RotateCcw size={17} /> Ещё раз</button>
    <button className="text-button" onClick={() => { setMode('calm'); setPhase('intro') }}>Хочу без спешки <ArrowRight size={16} /></button>
  </div>

  return <div className={`game-content ${phase === 'intro' ? 'game-intro' : 'game-active'}`}>
    <div className="game-top"><span className="eyebrow">МИНИ-ИГРА / 01</span><button className="icon-button" aria-label={sound ? 'Выключить звук игры' : 'Включить звук игры'} onClick={toggleSound}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button></div>
    <h2>Поймай нашу волну<span className="orange">.</span></h2>
    {phase === 'intro' ? <>
      <p className="game-description">За каждым хорошим вечером — немного магии. Собери мелодию, чтобы открыть моё приглашение.</p>
      <div className="mode-switch" aria-label="Режим игры">
        <button aria-pressed={mode === 'rhythm'} className={mode === 'rhythm' ? 'selected' : ''} onClick={() => setMode('rhythm')}><Music2 size={15} /> Поймать ритм</button>
        <button aria-pressed={mode === 'calm'} className={mode === 'calm' ? 'selected' : ''} onClick={() => setMode('calm')}><Heart size={15} /> Без спешки</button>
      </div>
      <div className="game-demo" aria-hidden="true"><div className="demo-lane"><span>♪</span></div><div className="demo-lane"><span>♫</span></div><div className="demo-lane"><span>♪</span></div><div className="demo-hitline" /><div className="demo-touch"><Sparkles size={19} /></div></div>
      <div className="game-instructions"><span>01</span><p>{mode === 'rhythm' ? 'Ноты падают в трёх дорожках.' : 'Сверху появится короткая мелодия.'}</p><span>02</span><p>{mode === 'rhythm' ? 'Нажимай на клавиши, когда нота на светлой линии.' : 'По очереди нажимай подсвеченные клавиши.'}</p><span>03</span><p>{mode === 'rhythm' ? 'Поймай 10 нот. У тебя всё получится ♡' : 'Здесь нет таймера. Просто играй в своём темпе ♡'}</p></div>
      <button className="button button-dark game-start" onClick={begin}><Play size={17} fill="currentColor" /> {mode === 'rhythm' ? 'Давай сыграем' : 'Начать мелодию'}</button>
      <p className="keyboard-tip">На телефоне — касайся клавиш · На компьютере — A, S, D</p>
    </> : <>
      <div className="game-score"><span><Heart size={15} /> {Math.min(hits, REQUIRED_HITS)} / {REQUIRED_HITS}</span><span>{combo > 1 ? `${combo} подряд ✦` : mode === 'calm' ? 'В своём темпе' : `${Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000))} сек`}</span><button className="icon-button" onClick={pause} aria-label="Пауза"><Pause size={17} /></button></div>
      <div className="game-progress" role="progressbar" aria-label="Мелодия собрана" aria-valuenow={getProgress(hits)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${getProgress(hits)}%` }} /></div>
      <div className={`game-board ${mode === 'calm' ? 'calm-board' : ''}`}>
        {mode === 'rhythm' ? <>
          <div className="lane-lines" aria-hidden="true"><i /><i /><i /></div>
          {notes.current.map(note => {
            const position = 78 - (note.at - elapsed) / APPROACH_TIME * 78
            if (position < -10 || position > 100 || resolved.current.has(note.id)) return null
            return <span className={`falling-note lane-${note.lane}`} key={note.id} data-note={note.id} style={{ top: `${position}%`, left: `${note.lane * 33.333 + 16.666}%` }} aria-hidden="true">{note.lane === 1 ? '♫' : '♪'}</span>
          })}
          <div className="hit-line" aria-hidden="true" />
          <span className="hit-label">ПОЙМАЙ ЗДЕСЬ</span>
        </> : <div className="calm-melody"><span className="eyebrow">ТВОЯ МЕЛОДИЯ</span><div className="melody-sequence">{calmSequence.map((lane, index) => <span key={index} className={`${index < calmStep ? 'done' : ''} ${index === calmStep ? 'current' : ''}`}>{index < calmStep ? <Check size={17} /> : ['до', 'ми', 'соль'][lane]}</span>)}</div><Music2 className="calm-music" size={65} /><p>Нажми «{['до', 'ми', 'соль'][calmSequence[calmStep]]}»</p></div>}
        {phase === 'paused' && <div className="pause-overlay"><Pause size={32} /><h3>Маленькая пауза</h3><button className="button button-orange" onClick={resume}><Play size={16} /> Продолжить</button></div>}
      </div>
      <div className="game-pads">{[0, 1, 2].map(lane => <button key={lane} className={`game-pad pad-${lane} ${activeLane === lane ? 'pressed' : ''} ${mode === 'calm' && lane === calmSequence[calmStep] ? 'suggested' : ''}`} disabled={phase !== 'playing'} onPointerDown={event => { event.preventDefault(); tap(lane) }} onClick={event => { if (event.detail === 0) tap(lane) }} aria-label={`Нота ${['до', 'ми', 'соль'][lane]}`}><Music2 size={23} /><span>{['до', 'ми', 'соль'][lane]}</span><kbd>{['A', 'S', 'D'][lane]}</kbd></button>)}</div>
      <p className="game-feedback" aria-live={mode === 'calm' ? 'polite' : 'off'}>{feedback}</p>
    </>}
  </div>
}
