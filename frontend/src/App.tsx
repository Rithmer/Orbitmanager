import { RouterProvider } from 'react-router'
import { router } from './app/routes'
import { ThemeProvider } from './app/context/ThemeContext'
import { AuthProvider } from './app/context/AuthContext'
import { QueryProvider } from './app/query/query-provider'

function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}

export default App
