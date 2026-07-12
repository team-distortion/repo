import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import RoleProtectedRoute from './RoleProtectedRoute';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Dashboard from '../pages/Dashboard';
import OrganizationSetup from '../pages/admin/OrganizationSetup';
import AssetsDirectory from '../pages/assets/AssetsDirectory';
import AllocationTransfer from '../pages/allocations/AllocationTransfer';
import ResourceBooking from '../pages/bookings/ResourceBooking';
import MaintenanceManagement from '../pages/maintenance/MaintenanceManagement';
import AssetAudit from '../pages/audit/AssetAudit';
import ReportsAnalytics from '../pages/reports/ReportsAnalytics';
import NotificationsCenter from '../pages/notifications/NotificationsCenter';

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
        <Route path="bookings" element={<ResourceBooking />} />
        <Route path="maintenance" element={<MaintenanceManagement />} />
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
