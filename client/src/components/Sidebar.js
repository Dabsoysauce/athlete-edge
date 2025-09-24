import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserIcon,
  ChartBarIcon,
  TargetIcon,
  DocumentTextIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['athlete', 'coach', 'admin'] },
  { name: 'Profile', href: '/profile', icon: UserIcon, roles: ['athlete', 'coach', 'admin'] },
  { name: 'Stats', href: '/stats', icon: ChartBarIcon, roles: ['athlete', 'coach', 'admin'] },
  { name: 'Goals', href: '/goals', icon: TargetIcon, roles: ['athlete', 'coach', 'admin'] },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon, roles: ['athlete', 'coach', 'admin'] },
  { name: 'Team', href: '/team', icon: UsersIcon, roles: ['coach', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['athlete', 'coach', 'admin'] },
];

function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 flex-shrink-0 h-6 w-6',
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User info at bottom */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            {user?.profileImage ? (
              <img
                className="h-10 w-10 rounded-full"
                src={user.profileImage}
                alt={user.firstName}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
