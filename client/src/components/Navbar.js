import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profileMenuItems = [
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            
            <Link to="/dashboard" className="flex items-center ml-4 lg:ml-0">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AE</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gradient">AthleteEdge</span>
              </div>
            </Link>
          </div>

          {/* Right side - Notifications and profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <span className="sr-only">Open user menu</span>
                {user?.profileImage ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.profileImage}
                    alt={user.firstName}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="ml-2 text-gray-700 font-medium hidden sm:block">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>

              {/* Profile dropdown menu */}
              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;
