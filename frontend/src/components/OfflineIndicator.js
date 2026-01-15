import React, { useState, useEffect } from 'react';
import { WifiOffIcon, WifiIcon, RefreshCwIcon } from 'lucide-react';

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false);
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show banner immediately if offline on mount
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && !justCameOnline) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        showBanner || justCameOnline ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-yellow-500 text-yellow-900'
        }`}
      >
        {isOnline ? (
          <>
            <WifiIcon className="h-5 w-5" />
            <span className="font-medium">Back online!</span>
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            <span className="text-sm">Syncing...</span>
          </>
        ) : (
          <>
            <WifiOffIcon className="h-5 w-5" />
            <div>
              <span className="font-medium">You're offline</span>
              <span className="text-sm ml-2">Changes will sync when you reconnect</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OfflineIndicator;
