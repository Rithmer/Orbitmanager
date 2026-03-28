import { useCallback, type MouseEvent, type ReactNode } from 'react'
import { useTheme } from '@/app/context/useTheme'

interface InputFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hint?: ReactNode
}

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  hint,
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
      {hint ? <div className={`mt-1.5 text-xs ${labelColor}`}>{hint}</div> : null}
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
  hint?: ReactNode
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
  hint,
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
      {hint ? <div className={`mt-1.5 text-xs ${labelColor}`}>{hint}</div> : null}
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
  disabled = false,
  type = 'submit',
  className = '',
}: {
  loading?: boolean
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'danger'
  disabled?: boolean
  type?: 'submit' | 'button'
  className?: string
}) {
  const bg =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600'
      : 'bg-[#4880ff] hover:bg-[#3a6fe0]'

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      return
    }
    createRipple(e)
    onClick?.()
  }, [disabled, loading, onClick])

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={loading || disabled}
      aria-busy={loading}
      className={`${bg} text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-fizzy btn-ripple ${className}`.trim()}
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
