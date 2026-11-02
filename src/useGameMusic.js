import { useCallback, useEffect, useRef, useState } from 'react'

export default function useGameMusic({ source, sound, phase }) {
  const audioRef = useRef(null)
  const [status, setStatus] = useState('ready')

  useEffect(() => {
    if (!source) return
    const audio = new Audio(source)
    audio.preload = 'metadata'
    audio.volume = 0.55
    const failed = () => setStatus('error')
    const playing = () => setStatus('playing')
    const ended = () => setStatus('ended')
    audio.addEventListener('error', failed)
    audio.addEventListener('playing', playing)
    audio.addEventListener('ended', ended)
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeEventListener('error', failed)
      audio.removeEventListener('playing', playing)
      audio.removeEventListener('ended', ended)
      audio.removeAttribute('src')
      audio.load()
      if (audioRef.current === audio) audioRef.current = null
    }
  }, [source])

  const play = useCallback(({ restart = false, enabled = sound } = {}) => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !enabled
    if (audio.error) audio.load()
    if (restart) audio.currentTime = 0
    // Called directly from Start / Resume / Unmute so mobile browsers allow sound.
    audio.play()?.catch(error => {
      if (error.name === 'AbortError') return
      setStatus(error.name === 'NotAllowedError' ? 'blocked' : 'error')
    })
  }, [sound])

  const stop = useCallback(() => { audioRef.current?.pause() }, [])
  const getTime = useCallback(() => audioRef.current?.currentTime * 1000 || 0, [])
  const setMuted = useCallback(muted => { if (audioRef.current) audioRef.current.muted = muted }, [])

  useEffect(() => {
    setMuted(!sound)
    if (phase !== 'playing') stop()
  }, [phase, sound, stop, setMuted])

  return { play, stop, getTime, setMuted, status }
}
