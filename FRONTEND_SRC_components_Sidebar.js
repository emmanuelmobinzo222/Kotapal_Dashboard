import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  Squares2X2Icon, 
  PlusIcon,
  ChartBarIcon,
  CogIcon,
  Sparkles,
  XMarkIcon
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'SmartBlocks', href: '/blocks', icon: Squares2X2Icon },
  { name: 'Product Library', href: '/products', icon: Squares2X2Icon },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Billing', href: '/billing', icon: CogIcon },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">Kota</span>
            </div>
            <button
              type="button"
              className="lg:hidden -mr-2 p-2 text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon 
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} 
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">U</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">User Name</p>
                <p className="text-xs text-gray-500">Pro Plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
