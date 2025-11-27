import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import StatsCards from '../components/dashboard/StatsCards';
import RecentBlocks from '../components/dashboard/RecentBlocks';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import TopProducts from '../components/dashboard/TopProducts';
import Alerts from '../components/dashboard/Alerts';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Check if user has seen dashboard before (stored in localStorage)
  useEffect(() => {
    const hasSeenDashboard = localStorage.getItem('hasSeenDashboard');
    if (!hasSeenDashboard) {
      // First time viewing - hide content by default
      setIsContentVisible(false);
      localStorage.setItem('hasSeenDashboard', 'true');
    } else {
      // User has seen it before - show content
      setIsContentVisible(true);
    }
  }, []);
  const { data: analytics, isLoading: analyticsLoading } = useQuery(
    'analytics',
    () => api.get('/analytics').then(res => res.data),
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const { data: blocks, isLoading: blocksLoading } = useQuery(
    'blocks',
    () => api.get('/blocks').then(res => res.data)
  );

  const { data: alerts, isLoading: alertsLoading } = useQuery(
    'alerts',
    () => api.get('/alerts').then(res => res.data)
  );

  if (analyticsLoading || blocksLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const toggleContentVisibility = () => {
    setIsContentVisible(!isContentVisible);
  };

  return (
    <div className="space-y-6">
      {/* Header with Toggle Button */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'User'}!</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your Top Performing Block This Week
          </p>
        </div>
        <button
          onClick={toggleContentVisibility}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title={isContentVisible ? 'Hide Dashboard' : 'Show Dashboard'}
        >
          {isContentVisible ? (
            <>
              <EyeOffIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Hide</span>
            </>
          ) : (
            <>
              <EyeIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Show</span>
            </>
          )}
        </button>
      </div>

      {/* Dashboard Content - Conditionally Rendered */}
      {isContentVisible ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Clicks</h3>
          <p className="text-3xl font-bold text-blue-600">[#]</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Conversions</h3>
          <p className="text-3xl font-bold text-green-600">[#]</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Suggestions</h3>
          <p className="text-sm text-gray-600">Swap Product A in Block X (Low CTR)</p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={analytics?.metrics?.overview} />

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart data={analytics?.dailyTrends} />
        <TopProducts data={analytics?.topBlocks} />
      </div>

          {/* Recent Blocks and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentBlocks blocks={blocks} />
            <Alerts alerts={alerts} />
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Dashboard content is hidden</p>
          <p className="text-gray-400 text-sm mt-2">Click the "Show" button above to view your dashboard information</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
