import { useEffect, useCallback, type ReactNode, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const { isDark } = useTheme()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const modalBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const borderColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 modal-overlay-enter"
      onClick={onClose}
    >
      <div
        className={`${modalBg} rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden modal-content-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor}`}>
          <h2 className={`font-bold text-lg ${textPrimary}`}>{title}</h2>
          <button
            onClick={onClose}
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

interface InputFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
}: InputFieldProps) {
  const { isDark } = useTheme()
  const inputBg = isDark ? 'bg-[#1c2534] border-[#313d4f]' : 'bg-gray-50 border-gray-200'
  const inputText = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const labelColor = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  return (
    <div>
      <label className={`block text-sm font-semibold mb-1.5 ${labelColor}`}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  disabled?: boolean
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}: SelectFieldProps) {
  const { isDark } = useTheme()
  const inputBg = isDark ? 'bg-[#1c2534] border-[#313d4f]' : 'bg-gray-50 border-gray-200'
  const inputText = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const labelColor = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  return (
    <div>
      <label className={`block text-sm font-semibold mb-1.5 ${labelColor}`}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function createRipple(e: MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const circle = document.createElement('span')
  circle.className = 'ripple-circle'
  circle.style.width = circle.style.height = `${size}px`
  circle.style.left = `${e.clientX - rect.left - size / 2}px`
  circle.style.top = `${e.clientY - rect.top - size / 2}px`
  btn.appendChild(circle)
  circle.addEventListener('animationend', () => circle.remove())
}

export function SubmitButton({
  loading,
  children,
  onClick,
  variant = 'primary',
}: {
  loading?: boolean
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'danger'
}) {
  const bg =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600'
      : 'bg-[#4880ff] hover:bg-[#3a6fe0]'

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    createRipple(e)
    onClick?.()
  }, [onClick])

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={loading}
      className={`${bg} text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2 btn-fizzy btn-ripple`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 fade-in-up">
      <p className="text-sm text-red-500">{message}</p>
    </div>
  )
}
