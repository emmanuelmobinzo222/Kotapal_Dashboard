import React from 'react';
import { 
  MousePointerIcon, 
  DollarSignIcon, 
  TrendingUpIcon, 
  Squares2X2Icon 
} from 'lucide-react';

const stats = [
  {
    name: 'Total Clicks',
    value: 'totalClicks',
    icon: MousePointerIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Total Revenue',
    value: 'totalRevenue',
    icon: DollarSignIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    format: 'currency',
  },
  {
    name: 'Avg CTR',
    value: 'avgCTR',
    icon: TrendingUpIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    format: 'percentage',
  },
  {
    name: 'Active Blocks',
    value: 'activeBlocks',
    icon: Squares2X2Icon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

function StatsCards({ data }) {
  const formatValue = (value, format) => {
    if (value === undefined || value === null) return '0';
    
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = data?.[stat.value] || 0;
        
        return (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatValue(value, stat.format)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;
