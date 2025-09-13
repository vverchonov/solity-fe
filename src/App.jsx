import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { ToastProvider } from './contexts/ToastContext'
import { CallProvider } from './contexts/CallProvider'

function App() {
  return (
    <ToastProvider>
      <CallProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </CallProvider>
    </ToastProvider>
  )
}

export default App
