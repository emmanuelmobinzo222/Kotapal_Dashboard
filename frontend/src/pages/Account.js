import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

function Account() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    website: user?.website || '',
    plan: user?.plan || 'starter'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const planNames = {
    'starter': 'Starter',
    'pro': 'Pro',
    'creatorplus': 'Creator+',
    'agency': 'Agency'
  };

  if (!user) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account information and preferences
        </p>
      </div>
      
      {/* Profile Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website/Blog URL
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <p className="mt-1 text-sm text-gray-900">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website/Blog URL</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.website ? (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                    {user.website}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Plan</label>
              <p className="mt-1 text-sm text-gray-900">{planNames[user.plan] || 'Unknown'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Billing Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Billing & Subscription</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Plan</label>
            <p className="mt-1 text-sm text-gray-900">{planNames[user.plan] || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan Features</label>
            <div className="mt-1 text-sm text-gray-900">
              {user.plan === 'starter' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>5 product blocks</li>
                  <li>Amazon only</li>
                  <li>Basic analytics</li>
                  <li>Community support</li>
                </ul>
              )}
              {user.plan === 'pro' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>50 product blocks</li>
                  <li>All retailers (Amazon, Walmart, Shopify)</li>
                  <li>Full analytics dashboard</li>
                  <li>Click & conversion tracking</li>
                  <li>Email + chat support</li>
                </ul>
              )}
              {user.plan === 'creatorplus' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Unlimited product blocks</li>
                  <li>All retailers + custom integrations</li>
                  <li>AI-powered recommendations</li>
                  <li>SmartAlerts for performance changes</li>
                  <li>Export reports (PDF/CSV)</li>
                  <li>Priority support</li>
                </ul>
              )}
              {user.plan === 'agency' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Everything in Creator+</li>
                  <li>White-label solution</li>
                  <li>Multi-client management</li>
                  <li>Custom branding & domains</li>
                  <li>API access & webhooks</li>
                  <li>Dedicated account manager</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
