/**
 * @file App.jsx
 * @description Root application component. Configures routes and auth provider.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import ProductsPage from './pages/ProductsPage';
import ProjectsPage from './pages/ProjectsPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';

const App = () => (
  <AuthProvider>
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/leads"      element={<LeadsPage />} />
          <Route path="/products"   element={<ProductsPage />} />
          <Route path="/projects"   element={<ProjectsPage />} />
          <Route path="/customers"  element={<CustomersPage />} />
          <Route path="/reports"    element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AuthProvider>
);

export default App;
