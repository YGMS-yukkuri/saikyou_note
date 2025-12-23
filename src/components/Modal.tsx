import React, { useEffect } from 'react'

type Props = {
  children: React.ReactNode
  onClose: () => void
}

const Modal: React.FC<Props> = ({ children, onClose }) => {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function onOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={onOverlayClick}>
      <div className="modal-body" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}

export default Modal
