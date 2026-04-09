import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  LayoutDashboard, 
  LogOut, 
  User,
  Settings,
  FileText
} from 'lucide-react';
import { useAuth } from '@/src/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const Sidebar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Payroll', path: '/admin/payroll', icon: CreditCard },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const employeeLinks = [
    { name: 'My Dashboard', path: '/employee', icon: LayoutDashboard },
    { name: 'My Payslips', path: '/employee/payslips', icon: FileText },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <nav className="flex flex-col h-screen w-64 bg-white border-r border-slate-200" aria-label="Main Navigation">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center" aria-hidden="true">
          <CreditCard className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">PayFlow</span>
      </div>

      <div className="flex-1 px-4 space-y-1" role="list">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            role="listitem"
            aria-label={link.name}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            <link.icon className="w-4 h-4" aria-hidden="true" />
            {link.name}
          </NavLink>
        ))}
      </div>

      <div className="p-4 mt-auto">
        <Separator className="mb-4" aria-hidden="true" />
        <div className="flex items-center gap-3 px-2 mb-4" aria-label="User profile">
          <Avatar className="w-9 h-9 border border-slate-200">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt={user?.full_name || 'User avatar'} />
            <AvatarFallback aria-hidden="true">{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-0">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {user?.full_name || 'User'}
            </span>
            <span className="text-xs text-slate-500 truncate">
              {isAdmin ? 'Administrator' : user?.position || 'Employee'}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
          onClick={logout}
          aria-label="Sign out of your account"
        >
          <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
};

export default Sidebar;
