import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { Bell, ChevronRight, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const notifications = [
  { id: 1, tone: 'bg-blue-500', category: 'Alert', title: 'Laptop AF-0014 assigned to Priya Shah', time: '2m ago', detail: 'IT Engineering desk allocation completed from warehouse stock.' },
  { id: 2, tone: 'bg-emerald-500', category: 'Approval', title: 'Maintenance request AF-0055 approved', time: '18m ago', detail: 'Technician visit scheduled for tomorrow at 10:00 AM.' },
  { id: 3, tone: 'bg-sky-500', category: 'Booking', title: 'Booking confirmed: Room B2 : 2:00 to 3:00 PM', time: '1h ago', detail: 'Conference room reserved for product review meeting.' },
];

export default function Header() {
  const { user, role } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

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
    <header className="h-16 glass-panel border-b border-x-0 border-t-0 border-slate-700 flex items-center justify-between px-6 z-10 relative">
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm font-medium tracking-wide">ROLE: <span className="text-indigo-400 ml-1">{role || 'Employee'}</span></span>
      </div>
      
      <div className="flex items-center gap-6">
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((value) => !value)}
            className="text-slate-400 hover:text-white transition-colors relative"
            aria-haspopup="menu"
            aria-expanded={notificationsOpen}
            aria-label="Toggle notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-[360px] rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden z-50 backdrop-blur-md">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/70">
                <div>
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <p className="text-xs text-slate-400">Latest activity from AssetFlow</p>
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="max-h-[340px] overflow-y-auto">
                {notifications.map((item) => (
                  <div key={item.id} className="flex gap-3 px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/80 transition-colors">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-sm ${item.tone}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100 leading-snug">{item.title}</p>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{item.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                      <span className="mt-2 inline-flex rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{user?.name || 'Jane Doe'}</span>
          </div>
          
          <button onClick={handleLogout} className="ml-4 text-slate-400 hover:text-red-400 transition-colors" title="Log out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
