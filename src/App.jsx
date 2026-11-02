import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, CalendarPlus, Check, CheckCheck, ChevronUp, Download, Heart, LockKeyhole, MapPin, Music2, Play, RotateCcw, Send, Sparkles, Ticket, Volume2, VolumeX } from 'lucide-react'
import Dialog from './components/Dialog'
import RhythmGame from './components/RhythmGame'
import Vinyl from './components/Vinyl'
import { invitation as config } from './config'
import { playNote, prepareAudio } from './audio'
import { REQUIRED_HITS } from './game'

const STORAGE_KEY = 'one-wave-invitation-v2'
const readSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {} } catch { return {} } }
const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
const escapeXml = value => String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char])

function WaveMark({ className = '' }) { return <span className={`wave-mark ${className}`} aria-hidden="true">{[14, 23, 30, 19, 11].map((height, i) => <i style={{ height }} key={i} />)}</span> }
function SectionLabel({ number, children }) { return <div className="section-label"><span>{number}</span><span>{children}</span></div> }

function StoryArt({ second = false, revealed = false }) {
  return <div className={`story-art ${second ? 'story-art-b' : ''}`} aria-hidden="true">
    <div className="story-art-grid" />
    {second ? <><div className="mini-ticket"><span>YOU'RE INVITED</span><strong>{revealed ? config.day : '?'}</strong><div>ТЫ · Я · МУЗЫКА</div><div className="mini-barcode" /></div><Sparkles className="story-sparkle" size={34} strokeWidth={1} /><div className="story-wave"><WaveMark /></div></> : <><div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" /><div className="story-heart heart-one"><Heart fill="currentColor" strokeWidth={1} /></div><div className="story-heart heart-two"><Heart fill="currentColor" strokeWidth={1} /></div><span className="handwritten story-handwritten">с этого всё<br />и началось ♡</span><Sparkles className="story-sparkle" size={30} strokeWidth={1.1} /></>}
  </div>
}

export default function App() {
  const [saved] = useState(readSaved)
  const [score, setScore] = useState(Number.isFinite(saved.score) ? Math.max(0, Math.min(REQUIRED_HITS, Math.floor(saved.score))) : 0)
  const unlocked = score >= REQUIRED_HITS
  const [accepted, setAccepted] = useState(saved.score >= REQUIRED_HITS && saved.accepted === true)
  const [modal, setModal] = useState(null)
  const [sound, setSound] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [toast, setToast] = useState('')
  const [confetti, setConfetti] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const toastTimer = useRef()
  const confettiTimer = useRef()
  const videoRef = useRef(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, accepted })) } catch { /* Private browsing may disable storage. */ }
  }, [score, accepted])

  useEffect(() => () => { clearTimeout(toastTimer.current); clearTimeout(confettiTimer.current) }, [])
  useEffect(() => {
    setVideoError(false)
    const currentVideo = videoRef.current
    return () => currentVideo?.pause()
  }, [modal])

  const notify = message => {
    clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(''), 4200)
  }
  const celebrate = () => {
    clearTimeout(confettiTimer.current)
    setConfetti(true)
    confettiTimer.current = setTimeout(() => setConfetti(false), 4500)
  }
  const saveScore = value => setScore(previous => Math.max(previous, Math.min(REQUIRED_HITS, value)))
  const unlock = () => { saveScore(REQUIRED_HITS); setModal(null); celebrate(); setTimeout(() => scrollTo('invitation'), 120) }
  const openInvitation = () => unlocked ? scrollTo('invitation') : setModal('game')
  const toggleSound = () => {
    if (!sound) { prepareAudio(); playNote(1); notify('Звук включён. Музыка появится в игре ♫') }
    setSound(!sound)
  }

  const shareAnswer = async () => {
    const text = `Да, я иду с тобой на концерт ${config.dateLabel}! ♡`
    try {
      if (navigator.share) { await navigator.share({ title: 'Мы на одной волне', text }); return }
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); notify('Ответ скопирован — отправь его мне ♡'); return }
      notify(text)
    } catch (error) { if (error.name !== 'AbortError') notify('Отправь мне: «Да, я иду с тобой ♡»') }
  }

  const saveTicket = async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560"><rect width="1000" height="560" rx="28" fill="#f4f1e9"/><rect x="26" y="26" width="948" height="508" rx="18" fill="none" stroke="#c9c6b9"/><path d="M740 26v508" stroke="#c9c6b9" stroke-dasharray="8 8"/><g font-family="Arial,sans-serif" fill="#2c2d25"><text x="70" y="95" font-size="18" letter-spacing="5">НА ОДНОЙ ВОЛНЕ</text><text x="70" y="205" font-size="58" font-weight="700">Пойдём на концерт?</text><text x="70" y="268" font-size="30">${escapeXml(config.artist || 'Один особенный вечер. Ты и я.')}</text><text x="70" y="344" font-size="22">${escapeXml([config.dateLabel, config.time, config.venue, config.city].filter(Boolean).join(' · '))}</text><text x="70" y="470" font-size="17">Личное приглашение для ${escapeXml(config.recipientGenitive || config.recipient || 'тебя')} ♡</text><text x="776" y="290" font-size="128" font-weight="700" fill="#df7448">08</text><text x="780" y="460" font-size="14" letter-spacing="3">ТЫ + Я</text></g></svg>`
    const file = new File([svg], 'na-odnoy-volne.svg', { type: 'image/svg+xml' })
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Наш вечер' }); return }
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url; link.download = file.name; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      notify('Приглашение сохранено. Этот вечер — наш ♡')
    } catch (error) { if (error.name !== 'AbortError') notify('Не удалось сохранить. Можно сделать скриншот билета ♡') }
  }

  const saveCalendar = () => {
    if (!config.startsAt || !config.endsAt) return
    const stamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const escapeIcs = value => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//One Wave//Personal Invitation//RU', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:nursultan-alua-20261108@one-wave.local', `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(config.startsAt)}`, `DTEND:${stamp(config.endsAt)}`, `SUMMARY:${escapeIcs(`${config.artist} · ${config.sender} и ${config.recipient}`)}`, `LOCATION:${escapeIcs([config.venue, config.address, config.city].filter(Boolean).join(', '))}`, `DESCRIPTION:${escapeIcs('Наш вечер на одной волне. Лучше приехать заранее ♡')}`, 'END:VEVENT', 'END:VCALENDAR']
    const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'nash-vecher-8-november.ics'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    notify('Открой файл, чтобы добавить наш вечер в календарь ♡')
  }

  const videoSource = modal === 'story' ? config.meetingVideo : config.invitationVideo
  return <>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <header className="header container">
      <a href="#" className="brand" aria-label="На одной волне — начало"><WaveMark /><span>на одной<br />волне<span className="brand-dot">.</span></span></a>
      <nav className="desktop-nav" aria-label="Навигация"><a href="#story">Наша история</a><a href="#little-game">Немного магии</a><button onClick={openInvitation}>Приглашение {unlocked ? <ArrowUpRight size={14} /> : <LockKeyhole size={13} />}</button></nav>
      <button className={`sound-toggle ${sound ? 'sound-on' : ''}`} onClick={toggleSound} aria-label={sound ? 'Выключить звук' : 'Включить звук'}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>Звук {sound ? 'вкл' : 'выкл'}</span></button>
    </header>

    <main id="main">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy"><div className="hero-eyebrow"><span className="status-dot" /> {config.recipient ? `${config.recipient.toLocaleUpperCase('ru')}, ЭТОТ СЮРПРИЗ ДЛЯ ТЕБЯ` : 'НЕБОЛЬШОЙ СЮРПРИЗ ДЛЯ ТЕБЯ'}</div>
          <h1 id="hero-title">Кажется, мы<br />на одной<br /><span>волне.</span><svg viewBox="0 0 300 25" aria-hidden="true"><path d="M5 17C58 6 184 2 290 10M25 23c92-11 187-11 247-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg></h1>
          <p className="hero-description">Одна встреча. Тысяча совпадений.<br className="desktop-break" /> И кое-что, что я хочу предложить тебе.</p>
          <div className="hero-actions"><button className="button button-dark" onClick={openInvitation}>{unlocked ? 'Твоё приглашение' : 'У меня для тебя сюрприз'}<ArrowUpRight size={19} /></button><a href="#story" className="hero-story-link"><span className="small-play"><Play size={10} fill="currentColor" /></span> Сначала — наша история</a></div>
          <div className="hero-footnote"><Heart size={13} strokeWidth={1.5} /> Сделано с мыслью о тебе. И только о тебе.</div>
        </div>
        <Vinyl unlocked={unlocked} onPlay={openInvitation} spinning={spinning} onSpin={() => { setSpinning(!spinning); if (!spinning) { if (sound) playNote(0); notify('Наш саундтрек ещё только начинается ♫') } }} />
      </section>

      <div className="marquee-strip" aria-hidden="true"><div>{[0, 1, 2, 3].map(i => <span key={i}>ТЫ + Я <i>✳</i> МУЗЫКА ПОГРОМЧЕ <i>✳</i> МОМЕНТЫ ПОБЛИЖЕ <i>✳</i> НА ОДНОЙ ВОЛНЕ <i>✳</i></span>)}</div></div>

      <section className="story-section container section-space" id="story" aria-labelledby="story-title">
        <SectionLabel number="01">НАШ МАЛЕНЬКИЙ САУНДТРЕК</SectionLabel>
        <div className="section-heading"><h2 id="story-title">У каждой истории<br />есть <em>своё начало.</em></h2><p>Если бы у нас был альбом,<br />эти моменты были бы первыми треками.</p></div>
        <div className="story-grid">
          <button className="story-card" onClick={() => setModal('story')} aria-label="Смотреть первое видео: как всё началось"><div className="story-visual"><StoryArt /><span className="track-label">TRACK 01</span><span className="video-play"><Play size={22} fill="currentColor" /></span><span className="video-format">НАША ИСТОРИЯ</span></div><div className="story-card-copy"><div><span className="small-label">ПЕРВАЯ ГЛАВА</span><h3>Как всё началось</h3><p>Тот самый момент, после которого всё стало чуть интереснее.</p></div><ArrowUpRight size={23} strokeWidth={1.5} /></div></button>
          <button className={`story-card ${unlocked ? '' : 'story-locked'}`} onClick={() => setModal(unlocked ? 'invitation-video' : 'game')} aria-label={unlocked ? 'Смотреть второе видео: у меня есть идея' : 'Открыть игру, чтобы разблокировать второе видео'}><div className="story-visual"><StoryArt second revealed={unlocked} /><span className="track-label">TRACK 02</span><span className={`video-play ${unlocked ? '' : 'locked-play'}`}>{unlocked ? <Play size={22} fill="currentColor" /> : <LockKeyhole size={22} />}</span><span className="video-format">{unlocked ? 'ТВОЁ ПРИГЛАШЕНИЕ' : 'ОТКРОЕТСЯ ПОСЛЕ ИГРЫ'}</span></div><div className="story-card-copy"><div><span className="small-label">СЛЕДУЮЩАЯ ГЛАВА</span><h3>А дальше — мы?</h3><p>{unlocked ? 'Кое-что, что я очень хочу разделить с тобой.' : 'Здесь спрятано кое-что особенное. Ключ — в нашей мелодии.'}</p></div>{unlocked ? <ArrowUpRight size={23} strokeWidth={1.5} /> : <LockKeyhole size={20} strokeWidth={1.5} />}</div></button>
        </div>
        <div className="between-note"><span className="line" /><span className="handwritten">лучшие моменты ещё впереди</span><Heart size={15} /><span className="line" /></div>
      </section>

      <section className="game-section" id="little-game" aria-labelledby="game-title"><div className="container game-section-inner">
        <div className="game-section-copy"><SectionLabel number="02">ЧУТЬ-ЧУТЬ МАГИИ</SectionLabel><h2 id="game-title">Давай проверим<br />наш <em>ритм?</em></h2><p>Я спрятал приглашение в мелодии.<br />Поймай несколько нот — и секрет твой.</p><div className="game-badges"><span><Music2 size={14} /> 50 пойманных нот</span><span><Heart size={14} /> Миллион хороших эмоций</span></div><button className="button button-orange" onClick={() => setModal('game')}>{unlocked ? 'Сыграем ещё?' : 'Поймать нашу волну'}<ArrowUpRight size={18} /></button><span className="game-reassurance">Никаких сложных правил. Только ты и музыка.</span></div>
        <button className="game-preview" onClick={() => setModal('game')} aria-label="Начать мини-игру"><div className="preview-title"><span>НАШ РИТМ</span><span>♪ ♫ ♪</span></div><div className="preview-lanes"><div><span className="preview-note note-a">♪</span><span className="preview-note note-d">♪</span></div><div><span className="preview-note note-b">♫</span></div><div><span className="preview-note note-c">♪</span></div><span className="preview-hit-line" /><span className="preview-pulse" /></div><div className="preview-keys"><span>до</span><span>ми</span><span>соль</span></div><div className="preview-float"><Sparkles size={18} /><span>Твой backstage pass<br /><strong>начинается здесь</strong></span><ArrowUpRight size={18} /></div></button>
        <span className="game-doodle handwritten" aria-hidden="true">psst… это проще,<br />чем кажется ♡</span>
      </div></section>

      <section className={`invitation-section container section-space ${unlocked ? 'is-unlocked' : ''}`} id="invitation" aria-labelledby="invitation-title">
        <SectionLabel number="03">НАШ СЛЕДУЮЩИЙ ТРЕК</SectionLabel>
        {unlocked ? <><div className="invitation-heading"><span className="unlocked-pill"><Check size={13} /> ПРИГЛАШЕНИЕ ОТКРЫТО</span><h2 id="invitation-title">Пойдём на <em>концерт?</em></h2><p>{config.message}</p></div>
          <div className={`concert-ticket ${accepted ? 'ticket-accepted' : ''}`}><div className="concert-ticket-main"><div className="ticket-heading"><WaveMark /><span>ДЛЯ {config.recipient ? (config.recipientGenitive || config.recipient).toLocaleUpperCase('ru') : 'ОДНОГО ОСОБЕННОГО ЧЕЛОВЕКА'}</span><Heart size={19} strokeWidth={1.5} /></div><h3>{config.artist || 'Наш вечер.'}<br /><span>{config.artist ? 'И мы с тобой.' : 'Наша музыка.'}</span></h3><div className="concert-details"><span><Ticket size={16} /> {config.dateLabel}{config.time ? ` · ${config.time}` : ''}</span><span><MapPin size={16} /> {[config.venue, config.city].filter(Boolean).join(', ') || 'Все детали расскажу лично'}</span></div><div className="ticket-bottom"><span>ХОРОШАЯ КОМПАНИЯ: МЫ С ТОБОЙ</span><span>ADMIT TWO ♡</span></div></div><div className="ticket-stub"><span>СОХРАНИ ЭТОТ ВЕЧЕР</span><strong>{config.day}</strong><span className="stub-people">ТЫ + Я</span><div className="barcode" aria-hidden="true" /><span className="stub-number">PERSONAL INVITE · 000002</span></div></div>
          <div className="event-tools"><div className="event-address"><MapPin size={16} /><span>{config.city} · {config.address}<small>8 ноября, воскресенье · начало в 19:00</small></span></div><div><a className="text-button" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([config.venue, config.address, config.city].join(', '))}`} target="_blank" rel="noreferrer">Маршрут <ArrowUpRight size={14} /></a><button className="text-button" onClick={saveCalendar}><CalendarPlus size={15} /> В календарь</button></div></div>
          <div className="rsvp-area">{accepted ? <div className="accepted-state"><span className="accepted-icon"><CheckCheck size={25} /></span><h3>Значит, это свидание ♡</h3><p>Теперь напиши мне — я буду ждать твоё «да».</p><button className="button button-dark" onClick={shareAnswer}><Send size={16} /> Отправить ответ</button></div> : <><p className="handwritten rsvp-question">Ну что, создадим ещё одно воспоминание?</p><button className="button button-dark rsvp-yes" onClick={() => { setAccepted(true); celebrate() }}>Да, я иду с тобой <Heart size={17} /></button></>}
            <div className="invitation-secondary"><button className="text-button" onClick={saveTicket}><Download size={15} /> Сохранить приглашение</button><button className="text-button" onClick={() => setModal('invitation-video')}><Play size={15} /> Моё видеоприглашение</button></div>
          </div></> : <div className="locked-invitation"><div className="locked-ticket-outline" aria-hidden="true"><span>??</span><Heart size={58} strokeWidth={1} /><i /></div><div className="lock-badge"><LockKeyhole size={23} /></div><h2 id="invitation-title">Здесь начинается<br /><em>наш следующий вечер.</em></h2><p>Набери 50 баллов в музыкальной игре —<br className="desktop-break" /> и приглашение окажется у тебя.</p><button className="button button-dark" onClick={() => setModal('game')}>Открыть секрет <ArrowUpRight size={18} /></button></div>}
      </section>
    </main>

    <footer className="footer container"><div className="footer-main"><a href="#" className="brand"><WaveMark /><span>на одной<br />волне<span className="brand-dot">.</span></span></a><span className="footer-message">{config.sender ? `От ${config.senderFrom || config.sender} — тебе.` : 'От меня — тебе.'} С хорошим предчувствием.</span><button className={`footer-heart ${favorite ? 'is-favorite' : ''}`} onClick={() => { setFavorite(!favorite); if (!favorite) notify('Один клик — и мне уже теплее ♡') }} aria-label="Оставить сердечко" aria-pressed={favorite}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></button></div><div className="footer-bottom"><span>ОДНА ИСТОРИЯ. ДВА ЧЕЛОВЕКА. ПРОДОЛЖЕНИЕ СЛЕДУЕТ.</span><a href="#">В самое начало <ChevronUp size={13} /></a></div></footer>

    {modal === 'game' && <Dialog label="Музыкальная игра — поймай нашу волну" onClose={() => setModal(null)}><RhythmGame initialScore={score} onProgress={saveScore} sound={sound} onSoundChange={setSound} onUnlock={unlock} /></Dialog>}
    {(modal === 'story' || modal === 'invitation-video') && <Dialog label={modal === 'story' ? 'Как всё началось — наше видео' : 'Моё видеоприглашение'} wide onClose={() => setModal(null)}><div className="video-modal-content"><span className="eyebrow">{modal === 'story' ? 'TRACK 01 / НАША ИСТОРИЯ' : 'TRACK 02 / ПРИГЛАШЕНИЕ'}</span><h2>{modal === 'story' ? 'Как всё началось.' : 'А дальше — мы?'}</h2>{videoSource && !videoError ? <video ref={videoRef} key={videoSource} controls playsInline preload="metadata" onError={() => setVideoError(true)}><source src={videoSource} />Твой браузер не поддерживает видео.</video> : <div className="video-coming-soon"><StoryArt second={modal !== 'story'} revealed={unlocked} /><div><span className="coming-icon">{videoError ? <RotateCcw size={25} /> : <Heart size={25} />}</span><h3>{videoError ? 'Давай попробуем ещё раз' : 'Самые личные кадры — совсем скоро'}</h3><p>{videoError ? 'Видео не загрузилось. Проверь соединение и открой его снова.' : 'Эта глава ждёт своё видео. А всё остальное уже готово к нашему вечеру.'}</p>{videoError && <button className="button button-dark" onClick={() => setVideoError(false)}>Повторить <RotateCcw size={15} /></button>}</div></div>}<div className="video-modal-footer"><span>{modal === 'story' ? 'Иногда всё начинается с простого «привет».' : 'С тобой любой вечер звучит по-особенному.'}</span><button className="text-button" onClick={() => { setModal(null); if (!unlocked) setTimeout(() => setModal('game'), 80); else scrollTo('invitation') }}>{unlocked ? 'К приглашению' : 'Продолжим?'}<ArrowRight size={16} /></button></div></div></Dialog>}
    <div role="status" aria-live="polite" className={`toast ${toast ? 'toast-visible' : ''}`}><Heart size={15} /> {toast}</div>
    {confetti && <div className="confetti" aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} style={{ '--x': `${(i * 47 + 13) % 100}%`, '--delay': `${(i % 9) * 0.09}s`, '--rotation': `${i * 37}deg`, '--color': ['#ed8158', '#cbbe8b', '#a9b7aa', '#e4b958'][i % 4] }} />)}</div>}
  </>
}
