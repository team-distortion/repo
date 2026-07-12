import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../components/layout/MainLayout';
import RoleProtectedRoute from './RoleProtectedRoute';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Dashboard from '../pages/Dashboard';
import OrganizationSetup from '../pages/admin/OrganizationSetup';
import AssetsDirectory from '../pages/assets/AssetsDirectory';
import AllocationTransfer from '../pages/allocations/AllocationTransfer';
import ResourceBooking from '../pages/bookings/ResourceBooking';
import MaintenanceDesk from '../pages/maintenance/MaintenanceDesk';
import AssetAudit from '../pages/audit/AssetAudit';
import ReportsAnalytics from '../pages/reports/ReportsAnalytics';
import NotificationsCenter from '../pages/notifications/NotificationsCenter';

export default function AppRoutes() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" replace />} />
      
      <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        
        <Route element={<RoleProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="setup" element={<OrganizationSetup />} />
        </Route>

        <Route path="assets" element={<AssetsDirectory />} />
        <Route path="allocations" element={<AllocationTransfer />} />
        <Route path="bookings" element={<ResourceBooking />} />
        <Route path="maintenance" element={<MaintenanceDesk />} />
        <Route path="notifications" element={<NotificationsCenter />} />

        <Route element={<RoleProtectedRoute allowedRoles={['Admin', 'Asset Manager']} />}>
          <Route path="audit" element={<AssetAudit />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head']} />}>
          <Route path="reports" element={<ReportsAnalytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
