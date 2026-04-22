import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  ChevronDown,
  MessageSquare,
  Accessibility,
  Target,
  CloudSun,
  FileText,
  Phone,
  History,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import Avatar from '../../shared/ui/Avatar';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isRiskRoute = location.pathname.startsWith('/dashboard/risk-prediction');
  const [riskDropdownOpen, setRiskDropdownOpen] = React.useState(isRiskRoute);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');
  const resolvedAvatar = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${backendBase}${user.avatar}`
    : null;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'AI Chatbots', path: '/dashboard/chatbots', icon: MessageSquare },
    { name: 'Body Explorer', path: '/dashboard/body-explorer', icon: Accessibility },
    { name: 'Reverse Planner', path: '/dashboard/reverse-planner', icon: Target },
    { name: 'Forecast', path: '/dashboard/forecast', icon: CloudSun },
    { name: 'Blogs', path: '/dashboard/blogs', icon: FileText },
    { name: 'Prediction History', path: '/dashboard/prediction-history', icon: History },
    { name: 'Contact Us', path: '/dashboard/contact', icon: Phone },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  React.useEffect(() => {
    if (isRiskRoute) {
      setRiskDropdownOpen(true);
    }
  }, [isRiskRoute]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-[#f8f8ff] border-r border-[#e8eaf9] flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-[#e8eaf9] flex items-center justify-between">
          <Link to="/" onClick={handleNavClick} className="flex items-center space-x-2">
            <img src="/favicon.svg" alt="Healance" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-bold text-[#0b1030] font-heading">Healance</span>
          </Link>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2.5 text-[#5f697a] hover:text-[#0b1030] rounded-lg hover:bg-[#f0f1fc]"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          <NavLink
            to={menuItems[0].path}
            end={menuItems[0].end}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 rounded-xl font-medium transition-colors border-l-[3px]',
                isActive
                  ? 'text-[#506cd7] bg-[#f0f1fc] border-l-[#506cd7]'
                  : 'text-slate-600 hover:bg-[#f0f1fc] border-l-transparent'
              )
            }
          >
            <LayoutDashboard size={20} className="mr-3 flex-shrink-0" />
            <span className="truncate">Dashboard</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setRiskDropdownOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors border-l-[3px]',
              isRiskRoute
                ? 'text-[#506cd7] bg-[#f0f1fc] border-l-[#506cd7]'
                : 'text-slate-600 hover:bg-[#f0f1fc] border-l-transparent'
            )}
          >
            <span className="flex items-center">
              <Activity size={20} className="mr-3 flex-shrink-0" />
              <span className="truncate">Risk Prediction</span>
            </span>
            <ChevronDown
              size={18}
              className={cn('transition-transform', riskDropdownOpen ? 'rotate-180' : '')}
            />
          </button>

          {riskDropdownOpen && (
            <div className="ml-6 mt-1 mb-2 space-y-1 border-l border-slate-200 pl-3">
              <NavLink
                to="/dashboard/risk-prediction"
                end
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-[#506cd7] bg-[#f0f1fc]' : 'text-slate-600 hover:bg-[#f0f1fc]'
                  )
                }
              >
                Symptoms Disease
              </NavLink>
              <NavLink
                to="/dashboard/risk-prediction/heart-diabetes"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-[#506cd7] bg-[#f0f1fc]' : 'text-slate-600 hover:bg-[#f0f1fc]'
                  )
                }
              >
                Heart & Diabetes
              </NavLink>
            </div>
          )}

          {menuItems.slice(1).map((item) => {
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-3 rounded-xl font-medium transition-colors border-l-[3px]',
                    isActive
                      ? 'text-[#506cd7] bg-[#f0f1fc] border-l-[#506cd7]'
                      : 'text-slate-600 hover:bg-[#f0f1fc] border-l-transparent'
                  )
                }
              >
                <item.icon size={20} className="mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#e8eaf9]">
          <NavLink
            to="/dashboard/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center p-3 rounded-xl mb-3 transition-colors',
                isActive ? 'bg-[#f0f1fc]' : 'bg-[#f0f1fc]/50 hover:bg-[#f0f1fc]'
              )
            }
          >
            <Avatar src={resolvedAvatar} name={user?.name} size={40} />
            <div className="ml-3 overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Free Plan</p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} className="mr-2 flex-shrink-0" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
