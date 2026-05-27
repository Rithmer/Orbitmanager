import { Building2 } from 'lucide-react'
import {
  ABOUT_PAGE_ICONS,
  periodOptions,
  values,
} from '@/app/pages/About/constants'
import type { AboutPageViewModel } from '@/app/pages/About/types'

type AboutPageViewProps = {
  model: AboutPageViewModel
}

export function AboutPageView({ model }: AboutPageViewProps) {
  const {
    isDark,
    activePeriod,
    setActivePeriod,
    pageBg,
    cardBg,
    cardBorder,
    textPrimary,
    textSecondary,
    stats,
  } = model

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8`}>
      <section className={`${cardBg} border ${cardBorder} rounded-2xl p-6 md:p-8`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-[#4880ff]/10 p-2.5">
            <Building2 className="h-5 w-5 text-[#4880ff]" />
          </div>
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${textPrimary}`}>О нас</h1>
            <p className={`mt-2 max-w-3xl text-sm md:text-base ${textSecondary}`}>
              OrbitManager - компания, которая предоставляет веб-приложение для управления командами,
              проектами и задачами. Мы помогаем бизнесу объединять планирование, контроль выполнения и
              аналитику в одном рабочем пространстве.
            </p>
            <p className={`mt-3 max-w-3xl text-sm md:text-base ${textSecondary}`}>
              Наша цель - сократить операционные потери команд и сделать проектную работу предсказуемой:
              от первой идеи до готового результата. Мы развиваем продукт вместе с командами пользователей,
              поэтому каждый релиз ориентирован на реальные рабочие сценарии.
            </p>
          </div>
        </div>
      </section>

      <section className={`${cardBg} border ${cardBorder} mt-6 rounded-2xl p-5 md:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg md:text-xl font-semibold ${textPrimary}`}>Пульс платформы</h2>
            <p className={`mt-1 text-sm ${textSecondary}`}>
              Небольшой интерактив: выберите период и посмотрите, как меняются показатели.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {periodOptions.map((option) => {
              const isActive = option.id === activePeriod
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActivePeriod(option.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#4880ff] text-white'
                      : `${isDark ? 'bg-[#1f2937] text-[#94a3b8]' : 'bg-[#eef2ff] text-[#4a5568]'}`
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className={`${isDark ? 'bg-[#1f2937]' : 'bg-[#f8fafc]'} rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Проекты в работе</span>
              <ABOUT_PAGE_ICONS.projects className="h-4 w-4 text-[#4880ff]" />
            </div>
            <p className={`mt-2 text-2xl font-bold ${textPrimary}`}>{stats.projects}</p>
          </article>
          <article className={`${isDark ? 'bg-[#1f2937]' : 'bg-[#f8fafc]'} rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Задач закрыто</span>
              <ABOUT_PAGE_ICONS.tasks className="h-4 w-4 text-[#4880ff]" />
            </div>
            <p className={`mt-2 text-2xl font-bold ${textPrimary}`}>{stats.tasks.toLocaleString('ru-RU')}</p>
          </article>
          <article className={`${isDark ? 'bg-[#1f2937]' : 'bg-[#f8fafc]'} rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Активных команд</span>
              <ABOUT_PAGE_ICONS.teams className="h-4 w-4 text-[#4880ff]" />
            </div>
            <p className={`mt-2 text-2xl font-bold ${textPrimary}`}>{stats.teams}</p>
          </article>
          <article className={`${isDark ? 'bg-[#1f2937]' : 'bg-[#f8fafc]'} rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Сроки соблюдены</span>
              <ABOUT_PAGE_ICONS.onTimeRate className="h-4 w-4 text-[#4880ff]" />
            </div>
            <p className={`mt-2 text-2xl font-bold ${textPrimary}`}>{stats.onTimeRate}%</p>
          </article>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {values.map((value) => (
          <article key={value.title} className={`${cardBg} border ${cardBorder} rounded-xl p-5`}>
            <div className="mb-3 inline-flex rounded-lg bg-[#4880ff]/10 p-2">
              <value.icon className="h-4 w-4 text-[#4880ff]" />
            </div>
            <h2 className={`text-base font-semibold ${textPrimary}`}>{value.title}</h2>
            <p className={`mt-2 text-sm leading-relaxed ${textSecondary}`}>{value.description}</p>
          </article>
        ))}
      </section>

      <section className={`${cardBg} border ${cardBorder} mt-6 rounded-2xl p-6`}>
        <h2 className={`text-lg md:text-xl font-semibold ${textPrimary}`}>Как мы работаем</h2>
        <p className={`mt-2 text-sm leading-relaxed ${textSecondary}`}>
          Мы строим OrbitManager вокруг трех принципов: прозрачность, скорость и адаптивность. Продукт
          объединяет планирование, исполнение и контроль в едином процессе, чтобы каждая команда видела не
          только свои задачи, но и общий прогресс по целям компании.
        </p>
      </section>

      <div className="mt-6 flex justify-end">
        <span className={`text-xs md:text-sm ${textSecondary}`}>OrbitManager. Все права защищены.</span>
      </div>
    </div>
  )
}
