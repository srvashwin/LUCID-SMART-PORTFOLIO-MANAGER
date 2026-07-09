import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Expenses from './pages/Expenses'
import Rules from './pages/Rules'
import BudgetPage from './pages/Budget'
import Subscriptions from './pages/Subscriptions'
import Accounts from './pages/Accounts'
import Goals from './pages/Goals'
import Analyze from './pages/Analyze'
import Reports from './pages/Reports'
import Account from './pages/Account'
import Help from './pages/Help'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#5266eb] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="rules" element={<Rules />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="goals" element={<Goals />} />
            <Route path="analyze" element={<Analyze />} />
            <Route path="reports" element={<Reports />} />
            <Route path="account" element={<Account />} />
            <Route path="help" element={<Help />} />
          </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
