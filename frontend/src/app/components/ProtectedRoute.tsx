import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/app/context/useAuth'
import { RouteLoadingScreen } from '@/app/components/RouteLoadingScreen'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <RouteLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
