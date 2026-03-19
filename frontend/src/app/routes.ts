import {
  createElement,
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactElement,
} from 'react'
import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import {
  PageShell,
  PageShellHeaderSkeleton,
  PageShellSectionSkeleton,
} from './components/PageShell'

const LoginPage = lazyRoute(() => import('./pages/Login'), 'Login')
const RegisterPage = lazyRoute(() => import('./pages/Register'), 'Register')
const DashboardPage = lazyRoute(() => import('./pages/Dashboard'), 'Dashboard')
const ProjectsPage = lazyRoute(() => import('./pages/Projects'), 'Projects')
const BoardPage = lazyRoute(() => import('./pages/Board'), 'Board')
const TeamsPage = lazyRoute(() => import('./pages/Teams'), 'Teams')
const CalendarPage = lazyRoute(() => import('./pages/Calendar'), 'Calendar')
const ReportsPage = lazyRoute(() => import('./pages/Reports'), 'Reports')
const SettingsPage = lazyRoute(() => import('./pages/Settings'), 'Settings')
const AdminPage = lazyRoute(() => import('./pages/Admin'), 'Admin')

export const router = createBrowserRouter([
  {
    path: '/login',
    element: renderLazyRoute(LoginPage, true),
  },
  {
    path: '/register',
    element: renderLazyRoute(RegisterPage, true),
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, element: renderLazyRoute(DashboardPage) },
          { path: 'projects', element: renderLazyRoute(ProjectsPage) },
          { path: 'board/:projectId', element: renderLazyRoute(BoardPage) },
          { path: 'teams', element: renderLazyRoute(TeamsPage) },
          { path: 'calendar', element: renderLazyRoute(CalendarPage) },
          { path: 'reports', element: renderLazyRoute(ReportsPage) },
          { path: 'settings', element: renderLazyRoute(SettingsPage) },
          { path: 'admin', element: renderLazyRoute(AdminPage) },
        ],
      },
    ],
  },
])

function lazyRoute<TModule extends Record<string, unknown>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const module = await loader()
    const component = module[exportName]

    if (typeof component !== 'function') {
      throw new Error(`Route export "${String(exportName)}" is not a component`)
    }

    return { default: component as ComponentType }
  })
}

function renderLazyRoute(
  Component: LazyExoticComponent<ComponentType>,
  fullScreen = false,
): ReactElement {
  return createElement(
    Suspense,
    {
      fallback: createElement(RouteFallback, { fullScreen }),
    },
    createElement(Component),
  )
}

function RouteFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  if (!fullScreen) {
    return createElement(
      'div',
      {
        className: 'min-h-[320px] p-4 md:p-8',
      },
      createElement(
        PageShell,
        {
          title: 'Загрузка',
          description: 'Подготовка экрана и данных',
          className: 'opacity-90',
        },
        createElement(PageShellHeaderSkeleton),
        createElement(PageShellSectionSkeleton, { rows: 4 }),
      ),
    )
  }

  return createElement(
    'div',
    {
      className: 'h-screen bg-[#f5f6fa] p-4 md:p-8',
    },
    createElement(
      PageShell,
      {
        title: 'Загрузка приложения',
        description: 'Инициализация интерфейса',
      },
      createElement(PageShellHeaderSkeleton),
      createElement(PageShellSectionSkeleton, { rows: 6 }),
    ),
  )
}
