import React from 'react';
import { 
  AlertTriangleIcon, 
  CheckCircleIcon, 
  InfoIcon,
  XIcon 
} from 'lucide-react';

function Alerts({ alerts }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'info':
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Performance Alerts</h3>
        <p className="text-sm text-gray-500">Important insights about your blocks</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className={`px-6 py-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {alert.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {alert.message}
                  </p>
                  {alert.blockId && (
                    <button className="mt-2 text-xs text-primary-600 hover:text-primary-500">
                      View Block →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400 mb-2">
              <CheckCircleIcon className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No alerts at the moment</p>
            <p className="text-xs text-gray-400 mt-1">
              All your blocks are performing well!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Alerts;
