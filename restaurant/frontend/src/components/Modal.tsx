import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, size = 'lg' }) => {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className={cn('relative w-full', sizeClasses[size])} role="dialog" aria-modal="true">
        <div className="bg-card border border-card-light rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-card-light">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-gray hover:text-white hover:bg-card-light transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
          {footer ? (
            <div className="px-6 py-4 border-t border-card-light bg-card-light/30 flex justify-end gap-3">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Modal
