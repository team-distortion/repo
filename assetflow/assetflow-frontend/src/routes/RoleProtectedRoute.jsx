import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function RoleProtectedRoute({ allowedRoles }) {
  const { role, isAuthenticated } = useSelector(state => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p>You do not have permission to view this page. This page is restricted to: {allowedRoles.join(', ')}</p>
      </div>
    );
  }

  return <Outlet />;
}
