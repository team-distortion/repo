import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import RoleProtectedRoute from './RoleProtectedRoute';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Dashboard from '../pages/Dashboard';
import OrganizationSetup from '../pages/admin/OrganizationSetup';
import AssetsDirectory from '../pages/assets/AssetsDirectory';
import AllocationTransfer from '../pages/allocations/AllocationTransfer';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        
        <Route element={<RoleProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="setup" element={<OrganizationSetup />} />
        </Route>

        <Route path="assets" element={<AssetsDirectory />} />
        <Route path="allocations" element={<AllocationTransfer />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
