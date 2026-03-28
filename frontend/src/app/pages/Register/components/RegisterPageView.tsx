import { Link } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { PASSWORD_POLICY_HINT } from '@/app/utils/passwordPolicy'
import { REGISTER_PAGE_FIELDS } from '@/app/pages/Register/constants'
import type { useAuthCardSurfaceTokens } from '@/app/hooks/useAuthCardSurfaceTokens'
import type { useRegisterForm } from '@/app/pages/Register/hooks/useRegisterForm'

type AuthCardTokens = ReturnType<typeof useAuthCardSurfaceTokens>

export type RegisterPageViewModel = { tokens: AuthCardTokens } & ReturnType<typeof useRegisterForm>

export type RegisterPageViewProps = {
  model: RegisterPageViewModel
}

export function RegisterPageView({ model }: RegisterPageViewProps) {
  const { tokens, form, showPassword, error, loading, setField, toggleShowPassword, handleSubmit } = model
  const { pageBg, cardBg, cardBorder, textPrimary, textSecondary, inputBg, inputText } = tokens

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

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {REGISTER_PAGE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
                {f.label}
                {f.required ? <span className="text-red-500 ml-0.5">*</span> : null}
              </label>
              <input
                type="text"
                value={form[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
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
                onChange={(e) => setField('password', e.target.value)}
                placeholder="Например, SecurePass1!"
                required
                className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className={`mt-1 text-xs ${textSecondary}`}>{PASSWORD_POLICY_HINT}</p>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
              Подтвердите пароль <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
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
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
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
