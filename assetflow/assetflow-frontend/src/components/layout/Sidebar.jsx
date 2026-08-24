import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Home, 
  Package, 
  Calendar, 
  Wrench, 
  FileText, 
  Settings, 
  ArrowRightLeft, 
  ClipboardCheck, 
  Bell 
} from 'lucide-react';

export default function Sidebar() {
  const { role } = useSelector(state => state.auth);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Organization Setup', path: '/setup', icon: Settings, roles: ['Admin'] },
    { name: 'Assets', path: '/assets', icon: Package, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Allocation & Transfer', path: '/allocations', icon: ArrowRightLeft, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Resource Booking', path: '/bookings', icon: Calendar, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Audit', path: '/audit', icon: ClipboardCheck, roles: ['Admin', 'Asset Manager'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
  ];

  return (
    <aside className="w-[240px] bg-[var(--color-surface)] border-r border-[var(--color-border)] h-full flex flex-col z-10 select-none">
      {/* Brand Header (56px) */}
      <div className="h-14 px-6 flex items-center gap-3 border-b border-[var(--color-border)]">
        <Package className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.75} />
        <span className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight">AssetFlow</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.roles.includes(role || 'Employee')).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 ease-out ${
                isActive 
                  ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
