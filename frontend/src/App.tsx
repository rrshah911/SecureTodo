import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import TaskList from './components/Tasks/TaskList'
import TaskForm from './components/Tasks/TaskForm'
import Login from './components/Auth/Login'
import SignUp from './components/Auth/SignUp'
import ConfirmSignUp from './components/Auth/ConfirmSignUp'
import Layout from './components/common/Layout'
import { Task } from './types/task'
import { auth } from './services/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
})

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)

  useEffect(() => {
    checkAuthState()
  }, [])

  async function checkAuthState() {
    try {
      const session = await auth.getCurrentUser()
      setIsAuthenticated(!!session)
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTask = () => {
    setSelectedTask(undefined)
    setIsTaskFormOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setIsTaskFormOpen(true)
  }

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false)
    setSelectedTask(undefined)
  }

  const handleSignOut = () => {
    queryClient.clear()
    setIsAuthenticated(false)
    setIsTaskFormOpen(false)
    setSelectedTask(undefined)
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.50'
      }}>
        Loading...
      </Box>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', justifyContent: 'center' }}>
            <BrowserRouter>
              <Routes>
                <Route
                  path="/login"
                  element={
                    !isAuthenticated ? (
                      <Layout showHeader={false}>
                        <Login onLogin={() => setIsAuthenticated(true)} />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route
                  path="/signup"
                  element={
                    !isAuthenticated ? (
                      <Layout showHeader={false}>
                        <SignUp />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route
                  path="/confirm-signup"
                  element={
                    !isAuthenticated ? (
                      <Layout showHeader={false}>
                        <ConfirmSignUp />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route
                  path="/"
                  element={
                    isAuthenticated ? (
                      <Layout onSignOut={handleSignOut}>
                        <TaskList onAddTask={handleAddTask} onEditTask={handleEditTask} />
                        <TaskForm
                          open={isTaskFormOpen}
                          onClose={handleCloseTaskForm}
                          task={selectedTask}
                        />
                      </Layout>
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
              </Routes>
            </BrowserRouter>
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
