import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatsCards from '../components/dashboard/StatsCards';
import RecentBlocks from '../components/dashboard/RecentBlocks';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import TopProducts from '../components/dashboard/TopProducts';
import Alerts from '../components/dashboard/Alerts';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

function Dashboard() {
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Hide content by default when user logs in
  useEffect(() => {
    // Always start with content hidden when dashboard loads
    setIsContentVisible(false);
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

  return (
    <div className="space-y-6">
      {/* Header with Toggle Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, [UserName]!</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your Top Performing Block This Week
          </p>
        </div>
        <button
          onClick={() => setIsContentVisible(!isContentVisible)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title={isContentVisible ? 'Hide Dashboard' : 'Show Dashboard'}
        >
          {isContentVisible ? (
            <>
              <EyeOffIcon className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Hide</span>
            </>
          ) : (
            <>
              <EyeIcon className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Show</span>
            </>
          )}
        </button>
      </div>

      {/* Dashboard Content - Conditionally Rendered */}
      {isContentVisible ? (
        <>
          {/* Dashboard Content */}
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Content Hidden</h3>
          <p className="text-sm text-gray-500 mb-4">
            Click the "Show" button above to view your dashboard information.
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
