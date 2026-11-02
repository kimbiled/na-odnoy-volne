import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Dialog({ children, onClose, label, wide = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.documentElement.style.overflow = overflow
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])

  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-label={label}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal-inner">
      <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Закрыть"><X size={20} /></button>
      {children}
    </div>
  </dialog>
}
