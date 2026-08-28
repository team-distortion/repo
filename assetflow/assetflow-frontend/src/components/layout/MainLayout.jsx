import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const { isAuthenticated } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-auto p-6 md:p-8 2xl:p-12 z-0">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
