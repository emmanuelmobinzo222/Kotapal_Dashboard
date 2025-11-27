import React from 'react';
import { Link } from 'react-router-dom';
import { 
  EyeIcon, 
  DollarSignIcon, 
  TrendingUpIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PauseIcon
} from 'lucide-react';

function RecentBlocks({ blocks }) {
  const recentBlocks = blocks?.slice(0, 5) || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <PauseIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Blocks</h3>
          <Link 
            to="/blocks" 
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            View all
          </Link>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {recentBlocks.length > 0 ? (
          recentBlocks.map((block) => (
            <div key={block.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(block.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {block.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {block.products} products • {block.retailer}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="h-4 w-4" />
                      <span>{block.clicks || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSignIcon className="h-4 w-4" />
                      <span>${block.revenue?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUpIcon className="h-4 w-4" />
                      <span>{block.ctr?.toFixed(1) || '0.0'}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(block.status)}`}>
                      {block.status}
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400 mb-2">
              <Squares2X2Icon className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No blocks created yet</p>
            <Link 
              to="/blocks/new" 
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              Create your first block
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentBlocks;
