import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './contexts/ToastContext'
import { CallProvider } from './contexts/CallProvider'
import { UserProvider } from './contexts/UserContext'
import { RatesProvider } from './contexts/RatesProvider'
import { HealthProvider } from './contexts/HealthProvider'
import { WalletProvider } from './contexts/WalletProvider'

function App() {
  return (
    <HealthProvider>
      <ToastProvider>
        <WalletProvider>
          <UserProvider>
            <CallProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <RatesProvider>
                        <Dashboard />
                      </RatesProvider>
                    </ProtectedRoute>
                  } />
                </Routes>
              </Router>
            </CallProvider>
          </UserProvider>
        </WalletProvider>
      </ToastProvider>
    </HealthProvider>
  )
}

export default App
