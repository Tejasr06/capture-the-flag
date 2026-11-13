import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthProvider'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const HostAuth = lazy(() => import('./pages/HostAuth'))
const HostPageLayout = lazy(() => import('./components/HostPageLayout'))
const HostDashboard = lazy(() => import('./pages/HostDashboard'))
const QuizEditor = lazy(() => import('./pages/QuizEditor'))
const QuizPreview = lazy(() => import('./pages/QuizPreview'))
const HostGame = lazy(() => import('./pages/HostGame'))
const JoinGame = lazy(() => import('./pages/JoinGame'))
const ParticipantLobby = lazy(() => import('./pages/ParticipantLobby'))

function PageLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1020] text-sm text-slate-300">
      Loading QuizArena…
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route element={<LandingPage />} path="/" />
            <Route element={<JoinGame />} path="/join" />
            <Route element={<ParticipantLobby />} path="/play/:pin" />
            <Route element={<HostAuth mode="login" />} path="/host/login" />
            <Route element={<HostAuth mode="register" />} path="/host/register" />
            <Route element={<HostPageLayout />} path="/host">
              <Route element={<HostDashboard />} path="dashboard" />
              <Route element={<QuizEditor />} path="quizzes/new" />
              <Route element={<QuizEditor />} path="quizzes/:quizId/edit" />
              <Route element={<QuizPreview />} path="quizzes/:quizId/preview" />
              <Route element={<HostGame />} path="games/:pin" />
            </Route>
            <Route element={<LandingPage />} path="*" />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
