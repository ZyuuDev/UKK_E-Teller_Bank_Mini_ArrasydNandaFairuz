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

