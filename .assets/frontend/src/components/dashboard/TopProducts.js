import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

function TopProducts({ data }) {
  const topProducts = data?.slice(0, 5) || [];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Top Performing Blocks</h3>
        <p className="text-sm text-gray-500">Your best performing SmartBlocks</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {topProducts.length > 0 ? (
          topProducts.map((block, index) => (
            <div key={block.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {block.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {block.products} products • {block.retailer}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {block.clicks?.toLocaleString() || 0} clicks
                    </p>
                    <p className="text-xs text-gray-500">
                      ${block.revenue?.toFixed(2) || '0.00'} revenue
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {block.ctr > 3 ? (
                      <TrendingUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      block.ctr > 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {block.ctr?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400 mb-2">
              <TrendingUpIcon className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No performance data yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create and publish blocks to see performance metrics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopProducts;
