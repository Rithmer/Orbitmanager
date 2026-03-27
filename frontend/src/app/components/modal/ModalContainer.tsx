import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTheme } from '@/app/context/useTheme'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const { isDark } = useTheme()
  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeAnimationMs = 350

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open || isClosing ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, isClosing])

  if (!open && !isClosing) return null

  const handleClose = () => {
    if (isClosing) {
      return
    }

    setIsClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false)
      closeTimerRef.current = null
    }, closeAnimationMs)
    onClose()
  }

  const modalBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const borderColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const overlayClassName = isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'
  const contentClassName = isClosing ? 'modal-content-exit' : 'modal-content-enter'

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 ${overlayClassName}`}
      onClick={handleClose}
    >
      <div
        className={`${modalBg} rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor}`}>
          <h2 className={`font-bold text-lg ${textPrimary}`}>{title}</h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-all duration-200 hover:rotate-90 ${
              isDark
                ? 'hover:bg-[#1c2534] text-[#94a3b8]'
                : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
