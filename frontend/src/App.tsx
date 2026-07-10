import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import VerificationPending from './pages/VerificationPending'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Expenses from './pages/Expenses'
import Income from './pages/Income'
import Rules from './pages/Rules'
import BudgetPage from './pages/Budget'
import Subscriptions from './pages/Subscriptions'
import Accounts from './pages/Accounts'
import Goals from './pages/Goals'
import Analyze from './pages/Analyze'
import Reports from './pages/Reports'
import Account from './pages/Account'
import Help from './pages/Help'
import ImportStatement from './pages/ImportStatement'
import Portfolio from './pages/Portfolio'
import Recurring from './pages/Recurring'
import HouseholdSettings from './pages/HouseholdSettings'
import JoinHousehold from './pages/JoinHousehold'
import Layout from './components/Layout'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

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
  const content = (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-pending" element={<VerificationPending />} />
          <Route path="/join" element={<JoinHousehold />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="income" element={<Income />} />
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
            <Route path="import" element={<ImportStatement />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="recurring" element={<Recurring />} />
            <Route path="household" element={<HouseholdSettings />} />
          </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )

  if (GOOGLE_CLIENT_ID) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
  }
  return content
}

export default App
