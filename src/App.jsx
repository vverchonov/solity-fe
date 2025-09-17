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
import { BalanceProvider } from './contexts/BalanceProvider'
import { InvoicesProvider } from './contexts/InvoicesProvider'
import { LogsProvider } from './contexts/LogsProvider'
import { TeleProvider } from './contexts/TeleProvider'
import { I18nProvider } from './contexts/I18nProvider'

function App() {
  return (
    <I18nProvider>
      <HealthProvider>
        <ToastProvider>
          <LogsProvider>
            <WalletProvider>
              <UserProvider>
                <TeleProvider>
                  <InvoicesProvider>
                    <BalanceProvider>
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
                    </BalanceProvider>
                  </InvoicesProvider>
                </TeleProvider>
              </UserProvider>
            </WalletProvider>
          </LogsProvider>
        </ToastProvider>
      </HealthProvider>
    </I18nProvider>
  )
}

export default App
