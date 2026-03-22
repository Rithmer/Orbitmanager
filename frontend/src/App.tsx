import { RouterProvider } from 'react-router'
import { router } from './app/routes'
import { ThemeProvider } from './app/context/ThemeContext'
import { AuthProvider } from './app/context/AuthContext'
import { QueryProvider } from './app/query/query-provider'
import { AppErrorBoundary } from './app/components/AppErrorBoundary'
import { ApiErrorBanner } from './app/components/ApiErrorBanner'

function App() {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <ApiErrorBanner />
            <RouterProvider router={router} />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </AppErrorBoundary>
  )
}

export default App
