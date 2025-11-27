import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LockIcon, AlertCircleIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    shopifyStore: '',
    amazonAffiliateTag: '',
    walmartImpactId: '',
    geoRedirect: false,
    darkMode: false
  });

  // Access control: Only allow Pro, Creator+, and Agency plans
  const allowedPlans = ['pro', 'creatorplus', 'agency'];
  const hasAccess = user && allowedPlans.includes(user.plan?.toLowerCase());

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show access denied message if user doesn't have required plan
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-red-100 rounded-full p-4 mb-4">
              <LockIcon className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4 max-w-md">
              Settings page is only available for Pro, Creator+, and Agency plans.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md">
              <div className="flex items-start">
                <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Your Current Plan: {user.plan || 'Starter'}</p>
                  <p className="text-sm text-yellow-700">
                    Upgrade to Pro or higher to access advanced settings and integrations.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/billing')}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement API call to save settings
    console.log('Settings saved:', settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your integrations and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shopify Store Connection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shopify Store Connection</h2>
          <div>
            <label htmlFor="shopifyStore" className="block text-sm font-medium text-gray-700 mb-2">
              Store URL
            </label>
            <input
              type="text"
              id="shopifyStore"
              name="shopifyStore"
              value={settings.shopifyStore}
              onChange={handleChange}
              placeholder="your-store.myshopify.com"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Amazon Affiliate Tag */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Amazon Affiliate Tag</h2>
          <div>
            <label htmlFor="amazonAffiliateTag" className="block text-sm font-medium text-gray-700 mb-2">
              Affiliate Tag
            </label>
            <input
              type="text"
              id="amazonAffiliateTag"
              name="amazonAffiliateTag"
              value={settings.amazonAffiliateTag}
              onChange={handleChange}
              placeholder="your-tag-20"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Walmart Impact ID */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Walmart Impact ID</h2>
          <div>
            <label htmlFor="walmartImpactId" className="block text-sm font-medium text-gray-700 mb-2">
              Impact ID
            </label>
            <input
              type="text"
              id="walmartImpactId"
              name="walmartImpactId"
              value={settings.walmartImpactId}
              onChange={handleChange}
              placeholder="your-impact-id"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="geoRedirect" className="text-sm font-medium text-gray-700">
                  Geo Redirect
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically redirect users based on their location
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="geoRedirect"
                  name="geoRedirect"
                  checked={settings.geoRedirect}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="darkMode" className="text-sm font-medium text-gray-700">
                  Dark Mode
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Switch to dark theme
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="darkMode"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;

