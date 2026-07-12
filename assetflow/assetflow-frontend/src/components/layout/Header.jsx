import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { Bell, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, role } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-16 glass-panel border-b border-x-0 border-t-0 border-slate-700 flex items-center justify-between px-6 z-10 relative">
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm font-medium tracking-wide">ROLE: <span className="text-indigo-400 ml-1">{role || 'Employee'}</span></span>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
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
