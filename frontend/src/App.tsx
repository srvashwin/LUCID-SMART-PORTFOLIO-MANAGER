import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const VerificationPending = lazy(() => import('./pages/VerificationPending'))
const JoinHousehold = lazy(() => import('./pages/JoinHousehold'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Chat = lazy(() => import('./pages/Chat'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Income = lazy(() => import('./pages/Income'))
const Rules = lazy(() => import('./pages/Rules'))
const BudgetPage = lazy(() => import('./pages/Budget'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Accounts = lazy(() => import('./pages/Accounts'))
const Goals = lazy(() => import('./pages/Goals'))
const Analyze = lazy(() => import('./pages/Analyze'))
const Reports = lazy(() => import('./pages/Reports'))
const Account = lazy(() => import('./pages/Account'))
const Help = lazy(() => import('./pages/Help'))
const ImportStatement = lazy(() => import('./pages/ImportStatement'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Recurring = lazy(() => import('./pages/Recurring'))
const HouseholdSettings = lazy(() => import('./pages/HouseholdSettings'))

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

function SuspenseFallback() {
  return (
    <div className="p-6 space-y-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="animate-pulse rounded-xl bg-[rgba(30,30,42,0.6)] border border-[rgba(237,237,243,0.06)] p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-[rgba(237,237,243,0.08)] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[rgba(237,237,243,0.08)] rounded w-1/3" />
            <div className="h-3 bg-[rgba(237,237,243,0.08)] rounded w-1/2" />
          </div>
          <div className="h-4 bg-[rgba(237,237,243,0.08)] rounded w-16" />
        </div>
      ))}
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      {children}
    </Suspense>
  )
}

function App() {
  const content = (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
          <Route path="/signup" element={<SuspenseWrapper><Signup /></SuspenseWrapper>} />
          <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPassword /></SuspenseWrapper>} />
          <Route path="/reset-password" element={<SuspenseWrapper><ResetPassword /></SuspenseWrapper>} />
          <Route path="/verify-email" element={<SuspenseWrapper><VerifyEmail /></SuspenseWrapper>} />
          <Route path="/verify-email-pending" element={<SuspenseWrapper><VerificationPending /></SuspenseWrapper>} />
          <Route path="/join" element={<SuspenseWrapper><JoinHousehold /></SuspenseWrapper>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
            <Route path="chat" element={<SuspenseWrapper><Chat /></SuspenseWrapper>} />
            <Route path="income" element={<SuspenseWrapper><Income /></SuspenseWrapper>} />
            <Route path="expenses" element={<SuspenseWrapper><Expenses /></SuspenseWrapper>} />
            <Route path="rules" element={<SuspenseWrapper><Rules /></SuspenseWrapper>} />
            <Route path="budget" element={<SuspenseWrapper><BudgetPage /></SuspenseWrapper>} />
            <Route path="subscriptions" element={<SuspenseWrapper><Subscriptions /></SuspenseWrapper>} />
            <Route path="accounts" element={<SuspenseWrapper><Accounts /></SuspenseWrapper>} />
            <Route path="goals" element={<SuspenseWrapper><Goals /></SuspenseWrapper>} />
            <Route path="analyze" element={<SuspenseWrapper><Analyze /></SuspenseWrapper>} />
            <Route path="reports" element={<SuspenseWrapper><Reports /></SuspenseWrapper>} />
            <Route path="account" element={<SuspenseWrapper><Account /></SuspenseWrapper>} />
            <Route path="help" element={<SuspenseWrapper><Help /></SuspenseWrapper>} />
            <Route path="import" element={<SuspenseWrapper><ImportStatement /></SuspenseWrapper>} />
            <Route path="portfolio" element={<SuspenseWrapper><Portfolio /></SuspenseWrapper>} />
            <Route path="recurring" element={<SuspenseWrapper><Recurring /></SuspenseWrapper>} />
            <Route path="household" element={<SuspenseWrapper><HouseholdSettings /></SuspenseWrapper>} />
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
