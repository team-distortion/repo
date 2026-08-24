import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { Bell, ChevronRight, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetNotificationsQuery } from '../../store/apiSlice';

export default function Header() {
  const { user, role } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  const { data: notificationsData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 15000,
  });
  const notifications = notificationsData?.data || notificationsData || [];
  const latestNotifications = notifications.slice(0, 5);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  return (
    <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-6 z-20 relative select-none">
      {/* Role Pill Badge */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">ROLE</span>
        <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[12px] font-medium bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
          {role || 'Employee'}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((value) => !value)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors relative"
            aria-haspopup="menu"
            aria-expanded={notificationsOpen}
            aria-label="Toggle notifications"
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
            {notifications.some(n => n.isUnread) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-error)] rounded-full ring-2 ring-[var(--color-surface)]" />
            )}
          </button>
 
          {notificationsOpen && (
            <div className="absolute right-0 top-11 w-[360px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-surface-md overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Notifications</h3>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">Recent activity</p>
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[13px] text-[var(--color-primary)] hover:underline inline-flex items-center gap-0.5"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
 
              <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--color-surface-3)]">
                {latestNotifications.length > 0 ? (
                  latestNotifications.map((item) => (
                    <div key={item.id} className="p-3.5 hover:bg-[var(--color-surface-2)] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium text-[var(--color-text)] leading-snug">{item.title}</p>
                        <span className="text-[11px] text-[var(--color-text-tertiary)] whitespace-nowrap">{item.time}</span>
                      </div>
                      <p className="mt-1 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-[var(--color-text-tertiary)] text-center text-[13px]">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User profile & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-[var(--color-border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-text)]">
            <User className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-[14px] font-medium text-[var(--color-text)] hidden sm:inline">{user?.name || 'Jane Doe'}</span>
          
          <button 
            onClick={handleLogout} 
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-2)] transition-colors ml-1" 
            title="Log out"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
