import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { LockIcon, UnlockIcon, SaveIcon } from 'lucide-react';
import toast from 'react-hot-toast';

function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState({
    shopifyStore: '',
    amazonAffiliateTag: '',
    walmartImpactId: '',
    geoRedirect: false,
    darkMode: false,
  });

  // Access control: Check if user is authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    navigate('/login');
    return null;
  }

  // Additional access control: Check if user has permission to access settings
  // For now, we'll require a password unlock for extra security
  const handleUnlock = () => {
    // In a real app, you'd verify this with the backend
    // For now, we'll use a simple check (you can enhance this)
    if (password === 'settings123' || password === user.email) {
      setIsUnlocked(true);
      setPassword('');
      toast.success('Settings unlocked');
    } else {
      toast.error('Invalid password. Please try again.');
      setPassword('');
    }
  };

  const handleSave = () => {
    // Save settings logic would go here
    toast.success('Settings saved successfully!');
  };

  const handleLock = () => {
    setIsUnlocked(false);
    toast.success('Settings locked');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Access Control: Lock Screen */}
      {!isUnlocked ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="max-w-md mx-auto text-center">
            <LockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Settings Locked
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Please enter your password to access settings
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUnlock();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your password"
                />
              </div>
              <button
                onClick={handleUnlock}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <div className="flex items-center justify-center space-x-2">
                  <UnlockIcon className="h-5 w-5" />
                  <span>Unlock Settings</span>
                </div>
              </button>
              <p className="text-xs text-gray-400 mt-4">
                For demo: Use your email or "settings123"
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Settings Content - Only visible when unlocked */
        <div className="space-y-6">
          {/* Lock Button */}
          <div className="flex justify-end">
            <button
              onClick={handleLock}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <LockIcon className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Lock Settings</span>
            </button>
          </div>

          {/* Shopify Store Connection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Shopify Store Connection
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="shopifyStore" className="block text-sm font-medium text-gray-700 mb-2">
                  Store URL
                </label>
                <input
                  type="text"
                  id="shopifyStore"
                  value={settings.shopifyStore}
                  onChange={(e) => setSettings({ ...settings, shopifyStore: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://your-store.myshopify.com"
                />
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Connect Store
              </button>
            </div>
          </div>

          {/* Amazon Affiliate Tag */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Amazon Affiliate Tag
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="amazonTag" className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliate Tag
                </label>
                <input
                  type="text"
                  id="amazonTag"
                  value={settings.amazonAffiliateTag}
                  onChange={(e) => setSettings({ ...settings, amazonAffiliateTag: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="your-tag-20"
                />
              </div>
            </div>
          </div>

          {/* Walmart Impact ID */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Walmart Impact ID
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="walmartId" className="block text-sm font-medium text-gray-700 mb-2">
                  Impact ID
                </label>
                <input
                  type="text"
                  id="walmartId"
                  value={settings.walmartImpactId}
                  onChange={(e) => setSettings({ ...settings, walmartImpactId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Your Impact ID"
                />
              </div>
            </div>
          </div>

          {/* Geo Redirect Toggle */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Geo Redirect
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Automatically redirect users based on their location
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.geoRedirect}
                  onChange={(e) => setSettings({ ...settings, geoRedirect: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Dark Mode
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Switch to dark theme
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <SaveIcon className="h-5 w-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;

