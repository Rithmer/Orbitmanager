import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'

export function Register() {
  const { isDark } = useTheme()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    login: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    profession: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const inputBg = isDark ? 'bg-[#1c2534] border-[#313d4f]' : 'bg-gray-50 border-gray-200'
  const inputText = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (form.password.length < 8) {
      setError('Пароль должен быть не менее 8 символов')
      return
    }
    if (form.login.length < 3) {
      setError('Логин должен быть не менее 3 символов')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.login)) {
      setError('Логин может содержать только буквы, цифры и символ подчёркивания')
      return
    }
    if (form.login.length > 50) {
      setError('Логин должен быть не более 50 символов')
      return
    }

    setLoading(true)
    try {
      await register({
        login: form.login,
        password: form.password,
        fullName: form.fullName,
        profession: form.profession || undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович', required: true },
    { key: 'login', label: 'Логин', placeholder: 'ivanov', required: true },
    { key: 'profession', label: 'Должность', placeholder: 'Фронтенд-разработчик', required: false },
  ] as const

  return (
    <div className={`${pageBg} min-h-screen flex items-center justify-center p-4 page-load-stagger`}>
      <div className={`${cardBg} border ${cardBorder} rounded-2xl p-8 w-full max-w-md stagger-row`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold mb-1">
            <span className="text-[#4880ff]">Orbit</span>
            <span className={textPrimary}>Manager</span>
          </h1>
          <p className={`text-sm ${textSecondary}`}>Создайте новый аккаунт</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
                {f.label}
                {f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type="text"
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                required={f.required}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
              />
            </div>
          ))}

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
              Пароль <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Минимум 8 символов"
                required
                className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
              Подтвердите пароль <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Повторите пароль"
              required
              className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4880ff] hover:bg-[#3a6fe0] text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 btn-fizzy"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Зарегистрироваться
          </button>
        </form>

        <p className={`text-center mt-6 text-sm ${textSecondary}`}>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-[#4880ff] font-semibold hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
