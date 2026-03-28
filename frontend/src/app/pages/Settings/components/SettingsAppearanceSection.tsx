import { Moon, Sun } from 'lucide-react'

type SettingsAppearanceSectionProps = {
  isDark: boolean
  toggleTheme: () => void
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  dividerColor: string
  sectionIconBg: string
}

export function SettingsAppearanceSection({
  isDark,
  toggleTheme,
  cardBg,
  cardBorder,
  textPrimary,
  textSecondary,
  dividerColor,
  sectionIconBg,
}: SettingsAppearanceSectionProps) {
  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden card-hover stagger-row`}>
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${dividerColor}`}>
        <div className={`w-8 h-8 ${sectionIconBg} rounded-lg flex items-center justify-center`}>
          {isDark ? <Sun className="w-4 h-4 text-[#4880ff]" /> : <Moon className="w-4 h-4 text-[#4880ff]" />}
        </div>
        <h2 className={`font-bold ${textPrimary}`}>Внешний вид</h2>
      </div>
      <div className="p-6">
        <p className={`font-semibold mb-1 ${textPrimary}`}>Тема оформления</p>
        <p className={`text-sm mb-4 ${textSecondary}`}>Выберите предпочитаемую тему</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Светлая', preview: 'bg-white border-[#e8e8e8]', active: !isDark, icon: Sun },
            { label: 'Тёмная', preview: 'bg-[#1b2431] border-[#273142]', active: isDark, icon: Moon },
          ].map((theme) => (
            <button
              key={theme.label}
              onClick={() => {
                if (!theme.active) toggleTheme()
              }}
              className={`border-2 rounded-xl p-3 transition-all duration-150 ${
                theme.active ? 'border-[#4880ff]' : isDark ? 'border-[#313d4f]' : 'border-gray-200'
              }`}
            >
              <div className={`${theme.preview} border rounded-lg p-3 mb-2`}>
                <div className="flex gap-1.5 mb-2">
                  {[60, 40, 50].map((width, index) => (
                    <div key={index} className="h-1.5 bg-gray-300 rounded" style={{ width: `${width}%` }} />
                  ))}
                </div>
                <div className={`h-6 ${theme.active ? 'bg-[#4880ff]/20' : 'bg-gray-100'} rounded`} />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <theme.icon className={`w-3.5 h-3.5 ${theme.active ? 'text-[#4880ff]' : textSecondary}`} />
                <p className={`text-xs font-semibold ${theme.active ? 'text-[#4880ff]' : textSecondary}`}>
                  {theme.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
