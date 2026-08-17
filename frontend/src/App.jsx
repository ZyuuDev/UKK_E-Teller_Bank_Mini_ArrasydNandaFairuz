import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { useEffect } from "react";

//seluruh halaman
import LoginPage from './pages/auth/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import TellerDashboard from './pages/teller/TellerDashboard'
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import NasabahDashboard from './pages/nasabah/NasabahDashboard'

//komponen
//children = halamn yang ingin dilindungi
//allowedRole = role yg diizinkan aksesnya

function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAuthStore()

  //redirek ke login
  if (!token) return <Navigate to="/login" replace />

  //role tidak ssuai
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const { isDark } = useThemeStore()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <BrowserRouter>
      <Routes>
        {/*login*/}
        <Route path="/login" element={<LoginPage />} />

        {/*admin*/}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/*teller*/}
        <Route path="/teller/*" element={
          <ProtectedRoute allowedRoles={['Teller']}>
            <TellerDashboard />
          </ProtectedRoute>
        } />

        {/*supervisor*/}
        <Route path="/supervisor/*" element={
          <ProtectedRoute allowedRoles={['Supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } />

        {/*nasabah*/}
        <Route path="/nasabah/*" element={
          <ProtectedRoute allowedRoles={['Nasabah']}>
            <NasabahDashboard />
          </ProtectedRoute>
        } />

        {/*redirek login*/}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}