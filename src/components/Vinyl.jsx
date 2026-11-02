import { Heart, Music2, Sparkles } from 'lucide-react'
import { invitation } from '../config'

export default function Vinyl({ onPlay, spinning, onSpin }) {
  return <div className="hero-art">
    <div className="art-orbit" aria-hidden="true" />
    <div className="handwritten art-note">некоторые совпадения<br />совсем не случайны</div>
    <svg className="doodle-arrow" viewBox="0 0 104 70" fill="none" aria-hidden="true"><path d="M7 7C30 0 35 34 26 40S5 17 37 24s47 22 58 38m-18-9 19 10 1-21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
    <div className="record-sleeve"><div className="sleeve-top"><span>OUR LITTLE<br />SOUNDTRACK</span><Sparkles size={24} strokeWidth={1.3} /></div><div className="sleeve-bottom"><span>SIDE A</span><span>ТЫ + Я</span></div></div>
    <button className={`vinyl ${spinning ? 'is-spinning' : ''}`} onClick={onSpin} aria-label={spinning ? 'Остановить пластинку' : 'Покрутить пластинку'}>
      <div className="vinyl-reflection" /><div className="vinyl-label"><span className="label-top">НА ОДНОЙ ВОЛНЕ</span><Heart size={22} strokeWidth={1.3} /><strong>ты & я</strong><span className="label-bottom">ЛИМИТИРОВАННЫЙ ТИРАЖ: 2</span><i /></div>
    </button>
    <div className="sun-sticker" aria-hidden="true"><span>100%<br /><small>наш вайб</small></span></div>
    <button className="art-ticket" onClick={onPlay}><div><span className="ticket-micro">{invitation.city ? `${invitation.city.toLocaleUpperCase('ru')} · ${invitation.time}` : 'ОДИН ОСОБЕННЫЙ ВЕЧЕР'}</span><strong>08<span>/ {invitation.month || 'концерт'}</span></strong></div><span className="ticket-perf" /><Music2 size={29} strokeWidth={1.3} /><span className="ticket-number">NO. 000002</span></button>
    <span className="art-caption"><span /> ПЛАСТИНКУ МОЖНО ПОКРУТИТЬ</span>
  </div>
}
