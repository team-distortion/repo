import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Package, Calendar, Wrench, FileText, Settings, Users, ArrowRightLeft, ClipboardCheck, Bell } from 'lucide-react';

export default function Sidebar() {
  const { role } = useSelector(state => state.auth);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Organization setup', path: '/setup', icon: Settings, roles: ['Admin'] },
    { name: 'Assets', path: '/assets', icon: Package, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Allocation & Transfer', path: '/allocations', icon: ArrowRightLeft, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Resource Booking', path: '/bookings', icon: Calendar, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Audit', path: '/audit', icon: ClipboardCheck, roles: ['Admin', 'Asset Manager'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
  ];

  return (
    <aside className="w-64 glass-panel h-full flex flex-col z-10 relative border-y-0 border-l-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <Package className="text-brand-blue-light w-8 h-8" />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">AssetFlow</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.filter(item => item.roles.includes(role || 'Employee')).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-brand-blue/20 text-blue-400 border border-brand-blue/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
