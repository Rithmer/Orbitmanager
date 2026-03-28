import { Link } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import type { useAuthCardSurfaceTokens } from '@/app/hooks/useAuthCardSurfaceTokens'
import type { useLoginForm } from '@/app/pages/Login/hooks/useLoginForm'

type AuthCardTokens = ReturnType<typeof useAuthCardSurfaceTokens>

export type LoginPageViewModel = { tokens: AuthCardTokens } & ReturnType<typeof useLoginForm>

export type LoginPageViewProps = {
  model: LoginPageViewModel
}

export function LoginPageView({ model }: LoginPageViewProps) {
  const { tokens, form, showPassword, error, loading, setLogin, setPassword, toggleShowPassword, handleSubmit } =
    model
  const { pageBg, cardBg, cardBorder, textPrimary, textSecondary, inputBg, inputText } = tokens

  return (
    <div className={`${pageBg} min-h-screen flex items-center justify-center p-4`}>
      <div className={`${cardBg} border ${cardBorder} rounded-2xl p-8 w-full max-w-md fade-in-up`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold mb-1">
            <span className="text-[#4880ff]">Orbit</span>
            <span className={textPrimary}>Manager</span>
          </h1>
          <p className={`text-sm ${textSecondary}`}>Войдите в свой аккаунт</p>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Логин</label>
            <input
              type="text"
              value={form.login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              required
              className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary} hover:${textPrimary}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4880ff] hover:bg-[#3a6fe0] text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 btn-fizzy"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
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
