import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import DashboardOverview from './pages/DashboardOverview'
import KnowledgeBucket from './pages/KnowledgeBucket'
import Training from './pages/Training'
import Governance from './pages/Governance'
import KPI from './pages/KPI'
import Bookmarks from './pages/Bookmarks'
import Announcements from './pages/Announcements'
import Feedback from './pages/Feedback'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/knowledge" element={<KnowledgeBucket />} />
            <Route path="/training" element={<Training />} />
            <Route path="/governance" element={<Governance />} />
            <Route path="/kpi" element={<KPI />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
