import { RouterProvider } from 'react-router'
import { router } from './app/routes'
import { ThemeProvider } from './app/context/ThemeContext'
import { AuthProvider } from './app/context/AuthContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
