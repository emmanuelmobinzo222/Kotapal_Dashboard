import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  MenuIcon, 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  LogOutIcon,
  SettingsIcon
} from 'lucide-react';

// Country code to flag emoji mapping
const getCountryFlag = (countryCode) => {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

function Header({ onMenuClick, onMobileMenuClick, user }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [country, setCountry] = useState(null);
  const [countryFlag, setCountryFlag] = useState('🌍');
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Detect user's country on component mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try using ipapi.co (free tier: 1000 requests/day)
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            setCountry(data.country_name || data.country_code);
            setCountryFlag(getCountryFlag(data.country_code));
          }
        }
      } catch (error) {
        console.log('Country detection failed, using fallback');
        // Fallback: try alternative API
        try {
          const fallbackResponse = await fetch('https://ip-api.com/json/?fields=country,countryCode');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.countryCode) {
              setCountry(fallbackData.country || fallbackData.countryCode);
              setCountryFlag(getCountryFlag(fallbackData.countryCode));
            }
          }
        } catch (fallbackError) {
          console.log('Fallback country detection also failed');
        }
      }
    };

    detectCountry();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden -m-2.5 p-2.5 text-gray-700"
              onClick={onMobileMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="h-6 w-6" />
            </button>
            
            {/* Desktop menu button */}
            <button
              type="button"
              className="hidden lg:block -m-2.5 p-2.5 text-gray-700"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Country Flag */}
            {country && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
                <span className="text-xl" title={country}>
                  {countryFlag}
                </span>
                <span className="hidden sm:block text-xs text-gray-600 font-medium">
                  {country}
                </span>
              </div>
            )}
            
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="relative p-2 text-gray-400 hover:text-gray-500"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              
              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">New click on "Best Headphones 2024"</p>
                          <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Block "Top Smart TVs" is performing well</p>
                          <p className="text-xs text-gray-500">1 hour ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Low CTR alert for "Gaming Setup"</p>
                          <p className="text-xs text-gray-500">3 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.plan}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {/* User dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/account');
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <SettingsIcon className="h-4 w-4 mr-3" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/integrations');
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <SettingsIcon className="h-4 w-4 mr-3" />
                      Integrations
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOutIcon className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
