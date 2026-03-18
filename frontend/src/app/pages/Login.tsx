import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { isDark } = useTheme()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ login: '', password: '' })
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
    setLoading(true)
    try {
      await login(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${pageBg} min-h-screen flex items-center justify-center p-4`}>
      <div className={`${cardBg} border ${cardBorder} rounded-2xl p-8 w-full max-w-md`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold mb-1">
            <span className="text-[#4880ff]">Orbit</span>
            <span className={textPrimary}>Manager</span>
          </h1>
          <p className={`text-sm ${textSecondary}`}>Войдите в свой аккаунт</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
              Логин
            </label>
            <input
              type="text"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              placeholder="Введите логин"
              required
              className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Введите пароль"
                required
                className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary} hover:${textPrimary}`}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4880ff] hover:bg-[#3a6fe0] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Войти
          </button>
        </form>

        <p className={`text-center mt-6 text-sm ${textSecondary}`}>
          Нет аккаунта?{' '}
          <Link to="/register" className="text-[#4880ff] font-semibold hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
