import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Projects } from './pages/Projects'
import { Teams } from './pages/Teams'
import { Calendar } from './pages/Calendar'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Board } from './pages/Board'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Admin } from './pages/Admin'

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: 'projects', Component: Projects },
          { path: 'board/:projectId', Component: Board },
          { path: 'teams', Component: Teams },
          { path: 'calendar', Component: Calendar },
          { path: 'reports', Component: Reports },
          { path: 'settings', Component: Settings },
          { path: 'admin', Component: Admin },
        ],
      },
    ],
  },
])
